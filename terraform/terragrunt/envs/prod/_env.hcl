include "common" {
  path = find_in_parent_folders("common.hcl")
}

terraform {
  source = "${get_repo_root()}/terraform/stacks/envs"
}

dependencies {
  paths = ["../../dns/prod", "../../ecr"]
}

dependency "dns" {
  config_path = "../../dns/prod"
}

dependency "ecr" {
  config_path = "../../ecr"
}

try {
  include "secrets" {
    path   = "${get_terragrunt_dir()}/secrets.hcl"
    expose = true
  }
} catch {}

inputs = merge(
  {
    environment                = "prod"
    aws_region                 = "us-west-2"
    aws_profile                = "russchords-admin"
    project_name                = "russchords"
    vpc_cidr                    = "10.0.0.0/16"
    public_subnet_cidrs         = ["10.0.1.0/24", "10.0.2.0/24"]
    utility_host_instance_type  = "t4g.small"
    task_cpu                    = "256"
    enable_gtm                  = true
    s3_bucket_name              = "russchords-state"
    email                       = "admin@russchords.pro"
    viewer_user_email           = "guest@russchords.pro"
    viewer_user_password        = "Noth!ngJustHangingAr0und"
    viewer_policy_env_suffix    = false
    lambda_zone_id_source       = "zones.lambda.public_zone_id"
    vite_api_url                = ""
    vite_cognito_redirect_uri   = ""
    vite_cognito_logout_uri     = ""
    vite_cognito_silent_redirect_uri = ""
    vite_cognito_scope          = "openid email profile"
  },
  try(include.secrets.inputs, {
    github_branch          = "prod"
    private_zone_name      = "prod.internal"
    callback_urls          = []
    logout_urls            = []
    vite_google_search_key = get_env("TF_VAR_vite_google_search_key", "")
    vite_google_search_cx  = get_env("TF_VAR_vite_google_search_cx", "")
    vite_gtm_id            = get_env("TF_VAR_vite_gtm_id", "")
  })
)
