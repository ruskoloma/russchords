resource "aws_ssm_parameter" "backend_codebuild_project" {
  name        = "${var.ssm_base}/backend/codebuild-project"
  description = "Name of CodeBuild project"
  type        = "String"
  value       = aws_codebuild_project.this.name
  overwrite   = true
}

resource "aws_ssm_parameter" "backend_ecr_repo" {
  name        = "${var.ssm_base}/backend/ecr-repo"
  description = "ECR repository for backend image"
  type        = "String"
  value       = var.image_repo_name
  overwrite   = true
}

resource "aws_ssm_parameter" "backend_ecs_cluster" {
  name        = "${var.ssm_base}/backend/ecs-cluster"
  description = "ECS cluster name"
  type        = "String"
  value       = aws_ecs_cluster.main.name
  overwrite   = true
}

resource "aws_ssm_parameter" "backend_ecs_service" {
  name        = "${var.ssm_base}/backend/ecs-service"
  description = "ECS service name for backend"
  type        = "String"
  value       = aws_ecs_service.this.name
  overwrite   = true
}
