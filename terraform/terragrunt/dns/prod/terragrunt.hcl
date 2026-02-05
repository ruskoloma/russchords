include "common" {
  path = find_in_parent_folders("common.hcl")
}

terraform {
  source = "${get_repo_root()}/terraform/stacks/dns"
}

inputs = {
  environment      = "prod"
  aws_region        = "us-west-2"
  aws_profile       = "russchords-admin"
  public_zone_name  = "russchords.app"
  lambda_zone_name  = "russchords.pro"
}

