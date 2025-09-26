variable "app_name" { default = "russchords" }
variable "env" { default = "dev" }

variable "callback_urls" {
  default = [
    "http://localhost:5173/auth/callback",
  ]
}

variable "logout_urls" {
  default = [
    "http://localhost:5173"
  ]
}

variable "refresh_days" { default = 30 }
variable "id_minutes" { default = 60 }
variable "access_minutes" { default = 60 }
variable "certificate_arn" {}

variable "custom_domain_name" {
  description = "Custom domain name for Cognito User Pool"
}


variable "route53_zone_id" {
  description = "Route53 hosted zone ID for the custom domain"
}

resource "aws_cognito_user_pool" "this" {
  name                     = "${var.app_name}_${var.env}_user_pool"
  mfa_configuration        = "OFF"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  password_policy {
    minimum_length                   = 6
    require_lowercase                = false
    require_numbers                  = false
    require_symbols                  = false
    require_uppercase                = false
    temporary_password_validity_days = 7
  }
  schema {
    name                = "nickname"
    attribute_data_type = "String"
    mutable             = true
    required            = true
    string_attribute_constraints {
      min_length = "2"
      max_length = "10"
    }
  }
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }
}

resource "aws_cognito_user_pool_client" "web" {
  name                                 = "${var.app_name}-web"
  user_pool_id                         = aws_cognito_user_pool.this.id
  generate_secret                      = false
  supported_identity_providers         = ["COGNITO"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]

  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  explicit_auth_flows = [
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]
  prevent_user_existence_errors = "ENABLED"
  refresh_token_validity        = var.refresh_days
  id_token_validity             = var.id_minutes
  access_token_validity         = var.access_minutes

  token_validity_units {
    refresh_token = "days"
    id_token      = "minutes"
    access_token  = "minutes"
  }
}

resource "aws_cognito_user_pool_domain" "custom" {
  domain                = var.custom_domain_name
  user_pool_id          = aws_cognito_user_pool.this.id
  certificate_arn       = var.certificate_arn
  managed_login_version = 2
}

resource "aws_route53_record" "cognito_custom_domain" {
  zone_id = var.route53_zone_id
  name    = aws_cognito_user_pool_domain.custom.domain
  type    = "A"

  alias {
    name                   = aws_cognito_user_pool_domain.custom.cloudfront_distribution_arn
    zone_id                = local.cloudfront_zone_id
    evaluate_target_health = false
  }
}

resource "awscc_cognito_managed_login_branding" "default_style" {
  user_pool_id = aws_cognito_user_pool.this.id
  client_id    = aws_cognito_user_pool_client.web.id
  settings     = jsonencode({})
}

locals {
  cognito_authority  = "https://${var.custom_domain_name}"
  cloudfront_zone_id = "Z2FDTNDATAQYW2"
}


output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.this.id
}
output "cognito_user_pool_client_id" {
  value = aws_cognito_user_pool_client.web.id
}
output "cognito_hosted_ui_base" {
  value = local.cognito_authority
}
output "cognito_custom_domain_target" {
  value = aws_cognito_user_pool_domain.custom.cloudfront_distribution
}
output "cognito_domain_alias_record_name" {
  value = var.custom_domain_name
}
