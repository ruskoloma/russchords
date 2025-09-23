provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile

  default_tags {
    tags = {
      Environment = var.environment
    }
  }
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

variable "public_zone_name" {
  description = "Public hosted zone domain name"
  type        = string
  default     = "russchords.dev"
}

module "dns" {
  source           = "../../modules/public_zone"
  public_zone_name = var.public_zone_name
}

output "public_zone_id" {
  value = module.dns.public_zone_id
}
