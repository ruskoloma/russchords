locals {
  env              = var.environment
  ssm_base         = "/russchords/${local.env}"
  project_env_name = "${var.project_name}-${local.env}"
}
