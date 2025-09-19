terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.92"
    }
    awscc = {
      source  = "hashicorp/awscc"
      version = "~> 1.56"
    }
  }

  required_version = ">= 1.2"
}
