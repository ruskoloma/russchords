resource "aws_ssm_parameter" "backend_aws_account_id" {
  name        = "${local.ssm_base}/backend/aws-account-id"
  description = "AWS account ID used in builds and scripts"
  type        = "String"
  value       = data.aws_caller_identity.current.id
  overwrite   = true
}

# Lambda SSM Parameters
resource "aws_ssm_parameter" "lambda_function_name" {
  name        = "${local.ssm_base}/lambda/function-name"
  description = "Lambda function name"
  type        = "String"
  value       = module.lambda.lambda_function_name
  overwrite   = true
}

resource "aws_ssm_parameter" "lambda_code_key" {
  name        = "${local.ssm_base}/lambda/code-key"
  description = "Lambda S3 code key"
  type        = "String"
  value       = module.lambda.lambda_code_key
  overwrite   = true
}

# Backend SSM Parameters
resource "aws_ssm_parameter" "backend_codebuild_project" {
  name        = "${local.ssm_base}/backend/codebuild-project"
  description = "Name of CodeBuild project"
  type        = "String"
  value       = module.backend.codebuild_project_name
  overwrite   = true
}

resource "aws_ssm_parameter" "backend_ecr_repo" {
  name        = "${local.ssm_base}/backend/ecr-repo"
  description = "ECR repository for backend image"
  type        = "String"
  value       = module.backend.ecr_repo_name
  overwrite   = true
}

resource "aws_ssm_parameter" "backend_ecs_cluster" {
  name        = "${local.ssm_base}/backend/ecs-cluster"
  description = "ECS cluster name"
  type        = "String"
  value       = module.backend.cluster_name
  overwrite   = true
}

resource "aws_ssm_parameter" "backend_ecs_service" {
  name        = "${local.ssm_base}/backend/ecs-service"
  description = "ECS service name for backend"
  type        = "String"
  value       = module.backend.service_name
  overwrite   = true
}

# DynamoDB SSM Parameters
resource "aws_ssm_parameter" "ddb_table_name" {
  name        = "${local.ssm_base}/ddb/table-name"
  description = "DynamoDB table name"
  type        = "String"
  value       = module.ddb.ddb_table_name
  overwrite   = true
}

# Frontend SSM Parameters
resource "aws_ssm_parameter" "frontend_s3_bucket" {
  name        = "${local.ssm_base}/frontend/BUILD_S3_BUCKET"
  description = "Frontend S3 bucket name"
  type        = "String"
  value       = module.frontend_hosting.s3_bucket_name
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_cf_dist_id" {
  name        = "${local.ssm_base}/frontend/BUILD_CF_DIST_ID"
  description = "Frontend CloudFront distribution ID"
  type        = "String"
  value       = module.frontend_hosting.cloudfront_distribution_id
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_api_url" {
  name        = "${local.ssm_base}/frontend/VITE_API_URL"
  description = "Frontend API URL"
  type        = "String"
  value       = var.vite_api_url != "" ? var.vite_api_url : "https://${module.utility_host.api_domain_name}"
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_lambda_parser_domain" {
  name        = "${local.ssm_base}/frontend/VITE_LAMBDA_PARSER_DOMAIN"
  description = "Lambda parser domain for frontend"
  type        = "String"
  value       = "https://${module.lambda.api_domain_name}"
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_cognito_authority" {
  name        = "${local.ssm_base}/frontend/VITE_COGNITO_AUTHORITY"
  description = "Cognito authority for frontend"
  type        = "String"
  value       = module.cognito.cognito_hosted_ui_base
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_cognito_client_id" {
  name        = "${local.ssm_base}/frontend/VITE_COGNITO_CLIENT_ID"
  description = "Cognito client ID for frontend"
  type        = "String"
  value       = module.cognito.cognito_user_pool_client_id
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_cognito_redirect_uri" {
  name        = "${local.ssm_base}/frontend/VITE_COGNITO_REDIRECT_URI"
  description = "Cognito redirect URI for frontend"
  type        = "String"
  value       = var.vite_cognito_redirect_uri != "" ? var.vite_cognito_redirect_uri : "https://${var.main_domain_name}/auth/callback"
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_cognito_logout_uri" {
  name        = "${local.ssm_base}/frontend/VITE_COGNITO_LOGOUT_URI"
  description = "Cognito logout URI for frontend"
  type        = "String"
  value       = var.vite_cognito_logout_uri != "" ? var.vite_cognito_logout_uri : "https://${var.main_domain_name}"
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_cognito_domain" {
  name        = "${local.ssm_base}/frontend/VITE_COGNITO_DOMAIN"
  description = "Cognito domain for frontend"
  type        = "String"
  value       = module.cognito.cognito_domain_alias_record_name
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_cognito_silent_redirect_uri" {
  name        = "${local.ssm_base}/frontend/VITE_COGNITO_SILENT_REDIRECT_URI"
  description = "Cognito silent redirect URI for frontend"
  type        = "String"
  value       = var.vite_cognito_silent_redirect_uri != "" ? var.vite_cognito_silent_redirect_uri : "https://${var.main_domain_name}/auth/silent-callback"
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_cognito_scope" {
  name        = "${local.ssm_base}/frontend/VITE_COGNITO_SCOPE"
  description = "Cognito scope for frontend"
  type        = "String"
  value       = var.vite_cognito_scope
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_google_search_key" {
  name        = "${local.ssm_base}/frontend/VITE_GOOGLE_SEARCH_KEY"
  description = "Google Search API key for frontend"
  type        = "SecureString"
  value       = var.vite_google_search_key
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_google_search_cx" {
  name        = "${local.ssm_base}/frontend/VITE_GOOGLE_SEARCH_CX"
  description = "Google Search Custom Search Engine ID for frontend"
  type        = "String"
  value       = var.vite_google_search_cx
  overwrite   = true
}

