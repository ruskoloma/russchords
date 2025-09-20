provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile

  default_tags {
    tags = {
      Environment = var.environment
    }
  }
}

variable "aws_region" {
  type        = string
  description = "AWS region"
  default     = "us-west-2"
}

variable "aws_profile" {
  type        = string
  description = "AWS CLI/SDK profile to use"
  default     = "russchords-admin"
}

variable "environment" {
  type        = string
  description = "Environment tag"
  default     = "dev"
}

variable "backend_api_repo_name" {
  default = "russchords/backend-api"
}

variable "nginx_proxy_repo_name" {
  default = "russchords/nginx-reverse-proxy"
}

resource "aws_ecr_repository" "repos" {
  for_each = toset([
    var.backend_api_repo_name,
    var.nginx_proxy_repo_name
  ])

  name                 = each.value
  image_tag_mutability = "MUTABLE"
  force_delete         = false
  image_scanning_configuration { scan_on_push = true }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Project = "russchords"
  }
}

resource "aws_ecr_lifecycle_policy" "keep_recent" {
  for_each   = aws_ecr_repository.repos
  repository = each.value.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

output "backend_api_ecr_repo_url" {
  description = "Backend API ECR repository URL"
  value       = aws_ecr_repository.repos[var.backend_api_repo_name].repository_url
}

output "nginx_proxy_ecr_repo_url" {
  description = "Nginx Proxy ECR repository URL"
  value       = aws_ecr_repository.repos[var.nginx_proxy_repo_name].repository_url
}

output "backend_api_repo_name" {
  description = "Backend API ECR repository name"
  value       = var.backend_api_repo_name
}

output "nginx_proxy_repo_name" {
  description = "Nginx Proxy ECR repository name"
  value       = var.nginx_proxy_repo_name
}
