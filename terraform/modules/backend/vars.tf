variable "cluster_name" {
  type    = string
  default = "backend-cluster"
}

variable "vpc_id" { type = string }
variable "subnet_ids" { type = list(string) }
variable "ecr_repository_uri" { type = string }
variable "cognito_authority" { type = string }
variable "cognito_client_id" { type = string }
variable "database_connection_string" { type = string }
variable "ssm_base" {}


variable "task_cpu" {
  type    = string
  default = "512"
}

variable "task_memory" {
  type    = string
  default = "1024"
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "container_port" {
  type    = number
  default = 8080
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "image_repo_name" {
  description = "ECR repository name to push images to (e.g. backend-api)."
  type        = string
  default     = "russchords/backend-api"
}

variable "github_repo" {
  description = "GitHub repo in the form owner/name."
  type        = string
  default     = "ruskoloma/russchords"
}

variable "github_branch" {
  description = "Branch or ref to build."
  type        = string
  default     = "dev"
}

variable "buildspec_path" {
  description = "Path to buildspec file relative to repo root."
  type        = string
  default     = "backend/BackendApi/buildspec.yml"
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
