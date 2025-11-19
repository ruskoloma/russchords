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
}

variable "public_zone_name" {
  description = "Public hosted zone domain name"
  type        = string
}

variable "lambda_zone_name" {
  description = "Lambda hosted zone domain name (optional, only for prod)"
  type        = string
  default     = null
}

module "dns" {
  source           = "../../modules/public_zone"
  public_zone_name = var.public_zone_name
}

module "lambda_dns" {
  count            = var.lambda_zone_name != null ? 1 : 0
  source           = "../../modules/public_zone"
  public_zone_name = var.lambda_zone_name
}

output "zones" {
  value = var.lambda_zone_name != null ? {
    main   = module.dns
    lambda = module.lambda_dns[0]
  } : null
}

output "public_zone_id" {
  value = module.dns.public_zone_id
}

output "main_domain_name" {
  value = var.public_zone_name
}

output "lambda_domain_name" {
  value = var.lambda_zone_name != null ? var.lambda_zone_name : "fn.${var.public_zone_name}"
}

