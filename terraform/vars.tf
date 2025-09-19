variable "ecr_backend_repo" {
  default = "russchords/backend-api"
}

locals {
  ssm_base = "/russchords/dev"
}

resource "aws_ssm_parameter" "backend_aws_account_id" {
  name        = "${local.ssm_base}/backend/aws-account-id"
  description = "AWS account ID used in builds and scripts"
  type        = "String"
  value       = data.aws_caller_identity.current.id
  overwrite   = true
}

resource "aws_ssm_parameter" "backend_codebuild_project" {
  name        = "${local.ssm_base}/backend/codebuild-project"
  description = "Name of CodeBuild project"
  type        = "String"
  value       = aws_codebuild_project.backend_api.name
  overwrite   = true
}

resource "aws_ssm_parameter" "backend_ecr_repo" {
  name        = "${local.ssm_base}/backend/ecr-repo"
  description = "ECR repository for backend image"
  type        = "String"
  value       = var.ecr_backend_repo
  overwrite   = true
}

resource "aws_ssm_parameter" "backend_ecs_cluster" {
  name        = "${local.ssm_base}/backend/ecs-cluster"
  description = "ECS cluster name"
  type        = "String"
  value       = aws_ecs_cluster.dev_cluster.name
  overwrite   = true
}

resource "aws_ssm_parameter" "backend_ecs_service" {
  name        = "${local.ssm_base}/backend/ecs-service"
  description = "ECS service name for backend"
  type        = "String"
  value       = aws_ecs_service.backend_api.name
  overwrite   = true
}
