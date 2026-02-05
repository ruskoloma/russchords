include "common" {
  path = find_in_parent_folders("common.hcl")
}

terraform {
  source = "${get_repo_root()}/terraform/stacks/ecr"
}

inputs = {
  environment  = "shared"
  aws_region   = "us-west-2"
  aws_profile  = "russchords-admin"
}

