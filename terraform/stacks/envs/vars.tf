variable "project_name" {
  default = "russchords"
}


variable "environment" {
  description = "Environment name (dev, prod, etc.)"
  type        = string
}

variable "utility_host_instance_type" {
  description = "EC2 instance type for the utility host"
  type        = string
  default     = "t4g.small"
}

variable "vite_api_url" {
  description = "API URL for Vite frontend"
  type        = string
  default     = ""
}

variable "vite_cognito_redirect_uri" {
  description = "Cognito redirect URI for frontend"
  type        = string
  default     = ""
}

variable "vite_cognito_logout_uri" {
  description = "Cognito logout URI for frontend"
  type        = string
  default     = ""
}

variable "vite_cognito_silent_redirect_uri" {
  description = "Cognito silent redirect URI for frontend"
  type        = string
  default     = ""
}

variable "vite_cognito_scope" {
  description = "Cognito scope for frontend"
  type        = string
  default     = "openid email profile"
}

variable "vite_google_search_key" {
  description = "Google Search API key"
  type        = string
  default     = ""
  sensitive   = true
}

variable "vite_google_search_cx" {
  description = "Google Search Custom Search Engine ID"
  type        = string
  default     = ""
}

variable "vite_gtm_id" {
  description = "Google Tag Manager ID for frontend"
  type        = string
  default     = ""
}

variable "s3_bucket_name" {
  description = "S3 bucket name for lambda code storage"
  type        = string
  default     = "russchords-state"
}

variable "email" {
  description = "Email address for SSL certificate notifications"
  type        = string
  default     = "admin@russchords.pro"
}

variable "viewer_user_email" {
  description = "Email address for the viewer user (for AWS console login)"
  type        = string
  default     = "guest@russchords.pro"
}

variable "viewer_user_password" {
  description = "Password for the viewer user (for AWS console login)"
  type        = string
  default     = "Noth!ngJustHangingAr0und"
}

variable "github_branch" {
  description = "GitHub branch for deployment"
  type        = string
  default     = "develop"
}


variable "callback_urls" {
  description = "Cognito callback URLs"
  type        = list(string)
  default     = []
}

variable "logout_urls" {
  description = "Cognito logout URLs"
  type        = list(string)
  default     = []
}

variable "private_zone_name" {
  description = "Private DNS zone name"
  type        = string
}

variable "task_cpu" {
  description = "Task CPU for ECS backend (optional)"
  type        = string
  default     = null
}

variable "enable_gtm" {
  description = "Enable Google Tag Manager SSM parameter"
  type        = bool
  default     = false
}

variable "viewer_policy_env_suffix" {
  description = "Whether to include environment suffix in viewer policy name"
  type        = bool
  default     = false
}

variable "lambda_zone_id_source" {
  description = "Source path for lambda zone ID in remote state (for dev: 'public_zone_id', for prod: 'zones.lambda.public_zone_id')"
  type        = string
  default     = "public_zone_id"
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

