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

resource "aws_ssm_parameter" "lambda_code_bucket" {
  name        = "${local.ssm_base}/lambda/code-bucket"
  description = "Lambda S3 code bucket"
  type        = "String"
  value       = var.s3_bucket_name
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

# RDS SSM Parameters
resource "aws_ssm_parameter" "rds_connection_string" {
  name        = "${local.ssm_base}/rds/connection-string"
  description = "RDS database connection string"
  type        = "SecureString"
  value       = module.rds.ConnectionString
  overwrite   = true
}

# Frontend SSM Parameters
resource "aws_ssm_parameter" "frontend_s3_bucket" {
  name        = "${local.ssm_base}/frontend/build-s3-bucket"
  description = "Frontend S3 bucket name"
  type        = "String"
  value       = module.frontend_hosting.s3_bucket_name
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_cf_dist_id" {
  name        = "${local.ssm_base}/frontend/build-cf-dist-id"
  description = "Frontend CloudFront distribution ID"
  type        = "String"
  value       = module.frontend_hosting.cloudfront_distribution_id
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_api_url" {
  name        = "${local.ssm_base}/frontend/vite-api-url"
  description = "Frontend API URL"
  type        = "String"
  value       = var.vite_api_url != "" ? var.vite_api_url : "https://${module.utility_host.api_domain_name}"
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_lambda_parser_domain" {
  name        = "${local.ssm_base}/frontend/vite-lambda-parser-domain"
  description = "Lambda parser domain for frontend"
  type        = "String"
  value       = module.lambda.api_domain_name
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_cognito_authority" {
  name        = "${local.ssm_base}/frontend/vite-cognito-authority"
  description = "Cognito authority for frontend"
  type        = "String"
  value       = local.cognito_issuer
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_cognito_client_id" {
  name        = "${local.ssm_base}/frontend/vite-cognito-client-id"
  description = "Cognito client ID for frontend"
  type        = "String"
  value       = module.cognito.cognito_user_pool_client_id
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_cognito_redirect_uri" {
  name        = "${local.ssm_base}/frontend/vite-cognito-redirect-uri"
  description = "Cognito redirect URI for frontend"
  type        = "String"
  value       = var.vite_cognito_redirect_uri != "" ? var.vite_cognito_redirect_uri : "https://${local.main_domain_name}/auth/callback"
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_cognito_logout_uri" {
  name        = "${local.ssm_base}/frontend/vite-cognito-logout-uri"
  description = "Cognito logout URI for frontend"
  type        = "String"
  value       = var.vite_cognito_logout_uri != "" ? var.vite_cognito_logout_uri : "https://${local.main_domain_name}"
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_cognito_domain" {
  name        = "${local.ssm_base}/frontend/vite-cognito-domain"
  description = "Cognito domain for frontend"
  type        = "String"
  value       = module.cognito.cognito_domain_alias_record_name
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_cognito_silent_redirect_uri" {
  name        = "${local.ssm_base}/frontend/vite-cognito-silent-redirect-uri"
  description = "Cognito silent redirect URI for frontend"
  type        = "String"
  value       = var.vite_cognito_silent_redirect_uri != "" ? var.vite_cognito_silent_redirect_uri : "https://${local.main_domain_name}/auth/silent-callback"
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_cognito_scope" {
  name        = "${local.ssm_base}/frontend/vite-cognito-scope"
  description = "Cognito scope for frontend"
  type        = "String"
  value       = var.vite_cognito_scope
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_google_search_key" {
  name        = "${local.ssm_base}/frontend/vite-google-search-key"
  description = "Google Search API key for frontend"
  type        = "SecureString"
  value       = var.vite_google_search_key
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_google_search_cx" {
  name        = "${local.ssm_base}/frontend/vite-google-search-cx"
  description = "Google Search Custom Search Engine ID for frontend"
  type        = "String"
  value       = var.vite_google_search_cx
  overwrite   = true
}

resource "aws_ssm_parameter" "frontend_gtm_id" {
  count       = 0
  name        = "${local.ssm_base}/frontend/vite-gtm-id"
  description = "Google Tag Manager ID for frontend"
  type        = "String"
  value       = var.vite_gtm_id
  overwrite   = true
}

# Backend Cognito SSM Parameters
resource "aws_ssm_parameter" "backend_cognito_authority" {
  name        = "${local.ssm_base}/backend/cognito-authority"
  description = "Cognito authority for backend"
  type        = "String"
  value       = module.cognito.cognito_hosted_ui_base
  overwrite   = true
}

resource "aws_ssm_parameter" "backend_cognito_client_id" {
  name        = "${local.ssm_base}/backend/cognito-client-id"
  description = "Cognito client ID for backend"
  type        = "String"
  value       = module.cognito.cognito_user_pool_client_id
  overwrite   = true
}

# Nginx-proxy SSM Parameters
resource "aws_ssm_parameter" "nginx_proxy_api_pass_host" {
  name        = "${local.ssm_base}/nginx-proxy/api-pass-host"
  description = "API pass host for nginx-proxy"
  type        = "String"
  value       = "${module.backend.api_internal_domain}:8080"
  overwrite   = true
}

resource "aws_ssm_parameter" "nginx_proxy_domain" {
  name        = "${local.ssm_base}/nginx-proxy/domain"
  description = "Domain for nginx-proxy"
  type        = "String"
  value       = local.main_domain_name
  overwrite   = true
}

resource "aws_ssm_parameter" "nginx_proxy_email" {
  name        = "${local.ssm_base}/nginx-proxy/email"
  description = "Email for nginx-proxy SSL certificates"
  type        = "String"
  value       = var.email
  overwrite   = true
}

resource "aws_ssm_parameter" "nginx_proxy_jenkins_pass_host" {
  name        = "${local.ssm_base}/nginx-proxy/jenkins-pass-host"
  description = "Jenkins pass host for nginx-proxy"
  type        = "String"
  value       = "${module.utility_host.jenkins_internal_domain}:8080"
  overwrite   = true
}

resource "aws_ssm_parameter" "nginx_proxy_only_subdomains" {
  name        = "${local.ssm_base}/nginx-proxy/only-subdomains"
  description = "Only subdomains flag for nginx-proxy"
  type        = "String"
  value       = "TRUE"
  overwrite   = true
}

resource "aws_ssm_parameter" "nginx_proxy_subdomains" {
  name        = "${local.ssm_base}/nginx-proxy/subdomains"
  description = "Subdomains for nginx-proxy"
  type        = "String"
  value       = "api,jenkins"
  overwrite   = true
}

resource "aws_ssm_parameter" "nginx_proxy_url" {
  name        = "${local.ssm_base}/nginx-proxy/url"
  description = "URL for nginx-proxy"
  type        = "String"
  value       = local.main_domain_name
  overwrite   = true
}

resource "aws_ssm_parameter" "nginx_proxy_validation" {
  name        = "${local.ssm_base}/nginx-proxy/validation"
  description = "Validation method for nginx-proxy SSL"
  type        = "String"
  value       = "http"
  overwrite   = true
}

resource "aws_ssm_parameter" "shared_cognito_authority" {
  name        = "${local.ssm_base}/shared/cognito/authority"
  description = "Shared Cognito authority for applications"
  type        = "String"
  value       = local.cognito_issuer
  overwrite   = true
}

resource "aws_ssm_parameter" "shared_cognito_client_id" {
  name        = "${local.ssm_base}/shared/cognito/client_id"
  description = "Shared Cognito client ID for applications"
  type        = "String"
  value       = module.cognito.cognito_user_pool_client_id
  overwrite   = true
}
