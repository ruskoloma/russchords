locals {
  env              = var.environment
  ssm_base         = "/russchords/${local.env}"
  project_env_name = "${var.project_name}-${local.env}"
  cognito_issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${module.cognito.cognito_user_pool_id}"

}

