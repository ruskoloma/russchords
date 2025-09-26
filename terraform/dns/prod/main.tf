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
  default     = "prod"
}

variable "public_zone_name" {
  description = "Public hosted zone domain name"
  type        = string
  default     = "russchords.app"
}

variable "lambda_zone_name" {
  description = "Lambda hosted zone domain name"
  type        = string
  default     = "russchords.pro"
}

module "dns" {
  source           = "../../modules/public_zone"
  public_zone_name = var.public_zone_name
}

module "lambda_dns" {
  source           = "../../modules/public_zone"
  public_zone_name = var.lambda_zone_name
}

output "zones" {
  value = {
    main   = module.dns
    lambda = module.lambda_dns
  }
}

output "public_zone_id" {
  value = module.dns.public_zone_id
}

output "main_domain_name" {
  value = var.public_zone_name
}

output "lambda_domain_name" {
  value = var.lambda_zone_name
}
