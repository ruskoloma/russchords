############################################
# Cognito (simple, email-only, no MFA)
############################################

# --- Inputs you may want to tweak ---
variable "app_name" { default = "russchords" }
variable "env" { default = "dev" }

# Must be globally unique (used for the Hosted UI domain)
variable "cognito_domain_prefix" { default = "russchords-dev" }

# Front-end URLs (for local dev + staging). Adjust as needed.
variable "frontend_local_base" { default = "http://localhost:5173" }
variable "frontend_stage_base" { default = "https://stage.rsln.pro" }

# Token lifetimes (simple defaults)
variable "refresh_days" { default = 30 }
variable "id_minutes" { default = 60 }
variable "access_minutes" { default = 60 }

# -------------------------------------
# User Pool (email sign-in; nickname optional; no MFA)
# -------------------------------------
resource "aws_cognito_user_pool" "this" {
  name              = "${var.app_name}_${var.env}_user_pool"
  mfa_configuration = "OFF"

  # Users sign in with email; verify email automatically
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Simple, sane password policy
  password_policy {
    minimum_length                   = 6
    require_lowercase                = false
    require_numbers                  = false
    require_symbols                  = false
    require_uppercase                = false
    temporary_password_validity_days = 7
  }

  # Only keep nickname as a (mutable, optional) standard attribute
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

  # Account recovery through verified email
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }
}

# -------------------------------------
# App client for SPA / Hosted UI (Authorization Code flow)
# -------------------------------------
resource "aws_cognito_user_pool_client" "web" {
  name            = var.app_name
  user_pool_id    = aws_cognito_user_pool.this.id
  generate_secret = false # SPA / public client

  # Keep Cognito native provider only
  supported_identity_providers = ["COGNITO"]

  # OAuth2/OIDC via Hosted UI
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]

  callback_urls = [
    "${var.frontend_local_base}/auth/callback",
    # "${var.frontend_local_base}/auth/silent-redirect",
    "${var.frontend_stage_base}/auth/callback",
    # "${var.frontend_stage_base}/auth/silent-redirect",
  ]

  logout_urls = [
    var.frontend_local_base,
    var.frontend_stage_base,
  ]

  # Basic auth flows for SRP + refresh
  explicit_auth_flows = [
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]

  prevent_user_existence_errors = "ENABLED"

  # Token lifetimes
  refresh_token_validity = var.refresh_days
  id_token_validity      = var.id_minutes
  access_token_validity  = var.access_minutes

  token_validity_units {
    refresh_token = "days"
    id_token      = "minutes"
    access_token  = "minutes"
  }
}

# -------------------------------------
# Hosted UI domain (managed domain; change prefix to something unique)
# -------------------------------------
resource "aws_cognito_user_pool_domain" "domain" {
  domain                = var.cognito_domain_prefix
  user_pool_id          = aws_cognito_user_pool.this.id
  managed_login_version = 2
}
resource "awscc_cognito_managed_login_branding" "default_style" {
  user_pool_id = aws_cognito_user_pool.this.id

  # If your app client comes from the *aws* provider, you already have the raw client_id:
  client_id = aws_cognito_user_pool_client.web.id

  # Minimal settings — empty JSON uses Cognito defaults (works to unblock the 403)
  settings = jsonencode({})

  # Optional: add assets later (logo, etc). Example stub:
  # assets = [{
  #   category  = "PAGE_HEADER_LOGO"
  #   extension = "PNG"
  #   bytes     = filebase64("${path.module}/brand/logo.png")
  # }]
}

locals {
  cognito_authority = "https://${aws_cognito_user_pool_domain.domain.domain}.auth.${data.aws_region.current.name}.amazoncognito.com"
}

# Handy outputs
output "cognito_user_pool_id" { value = aws_cognito_user_pool.this.id }
output "cognito_user_pool_client_id" { value = aws_cognito_user_pool_client.web.id }
output "cognito_hosted_ui_base" {
  value = local.cognito_authority
}


