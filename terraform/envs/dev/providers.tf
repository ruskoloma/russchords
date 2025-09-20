provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile

  default_tags {
    tags = {
      Environment = var.environment
    }
  }
}

provider "aws" {
  alias   = "us_east_1"
  region  = "us-east-1"
  profile = var.aws_profile
}

provider "awscc" {
  region  = data.aws_region.current.name
  profile = var.aws_profile
}

variable "aws_region" {
  type        = string
  description = "AWS region"
  default     = "us-west-2"
}

variable "aws_profile" {
  type        = string
  description = "AWS CLI/SDK profile to use"
  default     = "russchords-admin"
}

variable "environment" {
  type        = string
  description = "Environment tag"
  default     = "dev"
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}
