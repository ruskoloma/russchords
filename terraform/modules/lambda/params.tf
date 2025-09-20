resource "aws_ssm_parameter" "lambda_function_name" {
  name  = "${var.ssm_base}/lambda/function-name"
  type  = "String"
  value = var.lambda_name
}

resource "aws_ssm_parameter" "lambda_code_key" {
  name  = "${var.ssm_base}/lambda/code-key"
  type  = "String"
  value = local.lambda_s3_key
}
