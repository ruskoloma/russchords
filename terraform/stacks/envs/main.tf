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
  environment         = var.environment
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
  cognito_domain        = "auth.${local.main_domain_name}"

  callback_urls = concat(var.callback_urls, [
    "https://${local.main_domain_name}/auth/callback",
    "https://${local.main_domain_name}"
  ])
  logout_urls = concat(var.logout_urls, [
    "https://${local.main_domain_name}"
  ])
}

module "private_zone" {
  source            = "../../modules/private_zone"
  private_zone_name = var.private_zone_name
  vpc_id            = local.vpc_id
}


module "cognito" {
  source             = "../../modules/cognito"
  callback_urls      = local.callback_urls
  logout_urls        = local.logout_urls
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
  environment               = var.environment
}

module "ddb" {
  source     = "../../modules/ddb"
  table_name = "cached-songs-${local.env}"
}


module "utility_host" {
  source                 = "../../modules/utility_host"
  vpc_id                 = local.vpc_id
  subnet_id              = local.default_subnet_id
  availability_zone      = local.default_az
  private_zone_id        = local.private_zone_id
  public_zone_id         = local.public_zone_id
  instance_type          = var.utility_host_instance_type
  environment            = var.environment
  write_public_ip_path   = "../../../data/${var.environment}/hosts.ini"
  write_private_key_path = "../../../data/${var.environment}/jenkins_id_rsa"
}

module "lambda" {
  source              = "../../modules/lambda"
  hosted_zone_id      = local.lambda_zone_id
  domain_name         = local.lambda_domain_name
  redirect_url        = "https://${local.main_domain_name}"
  dynamodb_table_name = local.ddb_table_name
  lambda_name         = "russchords-parser-${local.env}"
  s3_bucket_name      = var.s3_bucket_name
  cors_origins        = ["https://${local.main_domain_name}", "http://localhost:5173"]
  environment         = var.environment
}

module "backend" {
  source             = "../../modules/backend"
  vpc_id             = local.vpc_id
  subnet_ids         = local.public_subnet_ids
  ssm_base           = local.ssm_base
  github_branch      = var.github_branch
  ecr_repository_uri = local.backend_api_ecr_repo_url
  image_repo_name    = local.backend_api_repo_name
  private_zone_id    = local.private_zone_id
  environment        = var.environment
  task_cpu           = var.task_cpu != null ? var.task_cpu : "512"
}

module "frontend_hosting" {
  source          = "../../modules/frontend_hosting"
  project_name    = local.project_env_name
  domain_name     = local.main_domain_name
  hosted_zone_id  = local.public_zone_id
  certificate_arn = local.hosting_cert_arn
}

