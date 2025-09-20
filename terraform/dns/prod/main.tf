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
  source            = "../../modules/public_zone"
  public_zone_name  = var.public_zone_name
}

module "lambda_dns" {
  source            = "../../modules/public_zone"
  public_zone_name  = var.lambda_zone_name
}

output "zones" {
  value = {
    main = module.dns
    lambda = module.lambda_dns
  }
}