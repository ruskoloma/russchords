variable "vpc_cidr" {
  description = "VPC CIDR"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDRs"
  type        = list(string)
  default = [
    "10.0.1.0/24",
    "10.0.2.0/24"
  ]
}

module "network" {
  source              = "../../modules/network"
  vpc_cidr            = var.vpc_cidr
  public_subnet_cidrs = var.public_subnet_cidrs
  tags = {
    Environment = var.environment
  }
}

locals {
  vpc_id                = module.network.vpc_id
  private_zone_id       = module.private_zone.private_zone_id
  public_subnet_ids     = module.network.public_subnet_ids
  default_public_subnet = module.network.public_subnet_ids[0]
  default_az            = module.network.availability_zones[0]
  default_subnet_id     = module.network.public_subnet_ids[0]
  ddb_table_name        = module.ddb.ddb_table_name
  cognito_authority     = module.cognito.cognito_hosted_ui_base
  cognito_client_id     = module.cognito.cognito_user_pool_client_id
  cognito_domain        = "auth.${var.main_domain_name}"
}

module "private_zone" {
  source            = "../../modules/private_zone"
  private_zone_name = "dev.internal"
  vpc_id            = local.vpc_id
}


module "cognito" {
  source             = "../../modules/cognito"
  callback_urls      = ["http://localhost:5173/auth/callback"]
  logout_urls        = ["http://localhost:5173"]
  custom_domain_name = local.cognito_domain
  route53_zone_id    = local.public_zone_id
  certificate_arn    = local.cognito_cert_arn

  depends_on = [
    module.frontend_hosting
  ]
}

module "rds" {
  source                    = "../../modules/rds"
  db_identifier             = local.project_env_name
  subnet_ids                = local.public_subnet_ids
  vpc_id                    = local.vpc_id
  ingress_security_group_id = module.backend.security_group_id
}

module "ddb" {
  source     = "../../modules/ddb"
  table_name = "cached-songs-${local.env}"
}


module "utility_host" {
  source            = "../../modules/utility_host"
  vpc_id            = local.vpc_id
  subnet_id         = local.default_subnet_id
  availability_zone = local.default_az
  private_zone_id   = local.private_zone_id
  public_zone_id    = local.public_zone_id
  instance_type     = var.utility_host_instance_type
}

module "lambda" {
  source              = "../../modules/lambda"
  hosted_zone_id      = local.public_zone_id
  domain_name         = "fn.${var.main_domain_name}"
  redirect_url        = "https://${var.main_domain_name}"
  dynamodb_table_name = local.ddb_table_name
  lambda_name         = "russchords-parser-${local.env}"
  s3_bucket_name      = "russchords-state"
}

module "backend" {
  source             = "../../modules/backend"
  vpc_id             = local.vpc_id
  subnet_ids         = local.public_subnet_ids
  ssm_base           = local.ssm_base
  github_branch      = "develop"
  ecr_repository_uri = local.backend_api_ecr_repo_url
  image_repo_name    = local.backend_api_repo_name
}

module "frontend_hosting" {
  source          = "../../modules/frontend_hosting"
  project_name    = local.project_env_name
  domain_name     = var.main_domain_name
  hosted_zone_id  = local.public_zone_id
  certificate_arn = local.hosting_cert_arn
}





