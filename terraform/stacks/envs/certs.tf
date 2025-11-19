module "cognito_cert" {
  source         = "../../modules/acm_cert"
  domain_name    = local.cognito_domain
  hosted_zone_id = local.public_zone_id
  providers = {
    aws = aws.us_east_1
  }

  tags = {
    Name = local.project_env_name
  }
}

module "hosting_cert" {
  source         = "../../modules/acm_cert"
  domain_name    = local.main_domain_name
  hosted_zone_id = local.public_zone_id
  providers = {
    aws = aws.us_east_1
  }

  tags = {
    Name = local.project_env_name
  }
}

locals {
  cognito_cert_arn = module.cognito_cert.certificate_arn
  hosting_cert_arn = module.hosting_cert.certificate_arn
}

