variable "project_name" {
  default = "russchords"
}

variable "main_domain_name" {
  default = "russchords.dev"
}

variable "environment" {
  description = "Environment name (dev, prod, etc.)"
  type        = string
  default     = "dev"
}

variable "utility_host_instance_type" {
  description = "EC2 instance type for the utility host"
  type        = string
  default     = "t4g.small"
}

# Frontend build variables
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
