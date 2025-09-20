resource "aws_ssm_parameter" "backend_aws_account_id" {
  name        = "${local.ssm_base}/backend/aws-account-id"
  description = "AWS account ID used in builds and scripts"
  type        = "String"
  value       = data.aws_caller_identity.current.id
  overwrite   = true
}

