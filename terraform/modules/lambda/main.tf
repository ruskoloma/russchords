variable "hosted_zone_id" {
  description = "Public Route53 hosted zone ID for API custom domain"
  type        = string
}

variable "domain_name" {
  description = "Custom domain for the API (e.g. fn.example.com)"
  type        = string
}

variable "redirect_url" {
  description = "Callback/redirect URL used by the Lambda app"
  type        = string
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name used by the Lambda"
  type        = string
}

variable "lambda_name" {
  default     = "russchords-parser"
  description = "Lambda function name"
}

variable "source_url" {
  type    = string
  default = "https://holychords.pro"
}

variable "s3_bucket_name" {
  description = "Name of existing S3 bucket to store Lambda deployment package"
  type        = string
}

variable "cors_origins" {
  description = "List of allowed CORS origins for the Lambda API"
  type        = list(string)
  default     = []
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}


locals {
  lambda_s3_key = "${var.lambda_name}.zip"
}

resource "aws_lambda_function" "this" {
  function_name = var.lambda_name
  role          = aws_iam_role.lambda_exec.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  architectures = ["arm64"]
  timeout       = 30

  s3_bucket = var.s3_bucket_name
  s3_key    = local.lambda_s3_key

  source_code_hash = null

  environment {
    variables = {
      SOURCE_URL   = var.source_url
      REDIRECT_URL = var.redirect_url
      TABLE_NAME   = var.dynamodb_table_name
    }
  }
}

resource "aws_lambda_permission" "allow_apigw" {
  statement_id  = "AllowInvokeFromHttpApi"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${aws_apigatewayv2_api.http_api.id}/*/*"
}

resource "aws_apigatewayv2_api" "http_api" {
  name          = "${var.lambda_name}-http-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_credentials = true
    allow_headers     = ["*"]
    allow_methods     = ["*"]
    allow_origins     = var.cors_origins
    expose_headers    = ["*"]
    max_age           = 300
  }
}

resource "aws_apigatewayv2_integration" "lambda_proxy" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.this.invoke_arn
  payload_format_version = "2.0"
}

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

resource "aws_acm_certificate" "api_cert" {
  domain_name       = var.domain_name
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
  zone_id = var.hosted_zone_id
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
  domain_name = var.domain_name
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
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"
  alias {
    name                   = aws_apigatewayv2_domain_name.custom.domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.custom.domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

output "lambda_function_name" {
  value = aws_lambda_function.this.function_name
}

output "lambda_code_key" {
  value = local.lambda_s3_key
}

output "api_domain_name" {
  description = "Lambda API domain name"
  value       = aws_route53_record.api_alias.fqdn
}
