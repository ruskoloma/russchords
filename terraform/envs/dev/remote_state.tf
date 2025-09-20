data "terraform_remote_state" "dns" {
  backend = "s3"
  config = {
    bucket  = "russchords-state"
    key     = "dns/dev/terraform.tfstate"
    region  = "us-west-2"
    encrypt = true
    profile = "russchords-admin"
  }
}

data "terraform_remote_state" "ecr" {
  backend = "s3"
  config = {
    bucket  = "russchords-state"
    key     = "ecr/terraform.tfstate"
    region  = "us-west-2"
    encrypt = true
    profile = "russchords-admin"
  }
}

locals {
  public_zone_id           = data.terraform_remote_state.dns.outputs.public_zone_id
  backend_api_ecr_repo_url = data.terraform_remote_state.ecr.outputs.backend_api_ecr_repo_url
  nginx_proxy_ecr_repo_url = data.terraform_remote_state.ecr.outputs.nginx_proxy_ecr_repo_url
  backend_api_repo_name    = data.terraform_remote_state.ecr.outputs.backend_api_repo_name
  nginx_proxy_repo_name    = data.terraform_remote_state.ecr.outputs.nginx_proxy_repo_name
}
