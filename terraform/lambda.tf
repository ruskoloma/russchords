locals {
  lambda_hosted_zone_id = aws_route53_zone.dev_public.id
}
locals {
  lambda_s3_bucket = "${var.lambda_name}-code"
  lambda_s3_key    = "${var.lambda_name}.zip"
}

resource "aws_s3_bucket" "lambda_bucket" {
  bucket        = local.lambda_s3_bucket
  force_destroy = true
}

variable "lambda_name" {
  default     = "dev-russchords-parser"
  description = "Lambda function name"
}

variable "lambda_runtime" {
  default     = "nodejs20.x"
  description = "AWS Lambda runtime"
}

variable "lambda_handler" {
  default     = "index.handler"
  description = "Entry point for Lambda"
}

variable "source_url" {
  type    = string
  default = "https://holychords.pro"
}

locals {
  domain_name = "fn.russchords.dev"
}

locals {
  redirect_url = "https://${trim(aws_route53_record.frontend_alias.fqdn, ".")}"
}

# Execution role that Lambda assumes
resource "aws_iam_role" "lambda_exec" {
  name = "${var.lambda_name}-exec"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# Attach the same policies you used before (adapted as AWS managed policies)
# 1) Basic CW logs for Lambda
resource "aws_iam_role_policy_attachment" "basic_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# 2) DynamoDB Full Access (adjust if you want least privilege later)
resource "aws_iam_role_policy_attachment" "dynamodb_full" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

# 3) SSM ReadOnly (to read params/secrets if needed)
resource "aws_iam_role_policy_attachment" "ssm_readonly" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess"
}

#################################
# ====== Lambda Function ======
#################################

resource "aws_lambda_function" "this" {
  function_name = var.lambda_name
  role          = aws_iam_role.lambda_exec.arn
  runtime       = var.lambda_runtime
  handler       = var.lambda_handler
  architectures = ["arm64"]
  timeout       = 30

  s3_bucket = aws_s3_bucket.lambda_bucket.id
  s3_key    = local.lambda_s3_key

  # Whenever code changes, update this (e.g., Git SHA) to force deployment
  # If you build the ZIP in CI, compute and pass the base64-encoded sha256.
  source_code_hash = null

  environment {
    variables = {
      SOURCE_URL = var.source_url
      # AWS_REGION   = data.aws_region.current.name
      REDIRECT_URL = local.redirect_url
      TABLE_NAME   = aws_dynamodb_table.cache.name
    }
  }
}

# Allow API Gateway to invoke the Lambda

resource "aws_lambda_permission" "allow_apigw" {
  statement_id  = "AllowInvokeFromHttpApi"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${aws_apigatewayv2_api.http_api.id}/*/*"
}

########################################
# ====== API Gateway (HTTP API v2) ======
########################################

resource "aws_apigatewayv2_api" "http_api" {
  name          = "${var.lambda_name}-http-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda_proxy" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.this.invoke_arn
  payload_format_version = "2.0"
}

# Catch-all route to the Lambda
resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_proxy.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

################################################
# ====== Custom domain + ACM + Route53 ======
################################################

resource "aws_acm_certificate" "api_cert" {
  domain_name       = local.domain_name
  validation_method = "DNS"
  lifecycle { create_before_destroy = true }
}

resource "aws_route53_record" "api_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.api_cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }
  zone_id = local.lambda_hosted_zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "api_cert_validation" {
  certificate_arn         = aws_acm_certificate.api_cert.arn
  validation_record_fqdns = [for r in aws_route53_record.api_cert_validation : r.fqdn]
}

resource "aws_apigatewayv2_domain_name" "custom" {
  domain_name = local.domain_name
  domain_name_configuration {
    certificate_arn = aws_acm_certificate_validation.api_cert_validation.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "mapping" {
  api_id      = aws_apigatewayv2_api.http_api.id
  domain_name = aws_apigatewayv2_domain_name.custom.id
  stage       = aws_apigatewayv2_stage.default.id
}

resource "aws_route53_record" "api_alias" {
  zone_id = local.lambda_hosted_zone_id
  name    = local.domain_name
  type    = "A"
  alias {
    name                   = aws_apigatewayv2_domain_name.custom.domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.custom.domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}


resource "aws_ssm_parameter" "lambda_function_name" {
  name  = "${local.ssm_base}/lambda/function-name"
  type  = "String"
  value = var.lambda_name
}

resource "aws_ssm_parameter" "lambda_code_bucket" {
  name  = "${local.ssm_base}/lambda/code-bucket"
  type  = "String"
  value = aws_s3_bucket.lambda_bucket.bucket
}

resource "aws_ssm_parameter" "lambda_code_key" {
  name  = "${local.ssm_base}/lambda/code-key"
  type  = "String"
  value = local.lambda_s3_key
}
