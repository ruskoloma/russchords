terraform {
  backend "s3" {}

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

