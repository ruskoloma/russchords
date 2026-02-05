remote_state {
  backend = "s3"
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite_terragrunt"
  }
  config = {
    bucket  = "russchords-state"
    key     = "${replace(path_relative_to_include(), "terragrunt/", "")}/terraform.tfstate"
    region  = "us-west-2"
    encrypt = true
    profile = "russchords-admin"
  }
}

generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<EOF
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.14.1"
    }
    awscc = {
      source  = "hashicorp/awscc"
      version = "~> 1.56"
    }
  }

  required_version = ">= 1.2"
}
EOF
}

