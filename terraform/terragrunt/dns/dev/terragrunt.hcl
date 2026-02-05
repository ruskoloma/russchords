include "common" {
  path = find_in_parent_folders("common.hcl")
}

terraform {
  source = "${get_repo_root()}/terraform/stacks/dns"
}

inputs = {
  environment      = "dev"
  aws_region       = "us-west-2"
  aws_profile      = "russchords-admin"
  public_zone_name  = "russchords.dev"
}

