variable "domain_name" {
  description = "FQDN for the certificate (e.g., example.com or jenkins.example.dev)."
  type        = string
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID that serves domain_name. Used to create DNS validation records."
  type        = string
}

variable "key_algorithm" {
  description = "ACM key algorithm: RSA_2048 | RSA_4096 | EC_256 | EC_384"
  type        = string
  default     = "RSA_2048"
}

variable "wait_for_validation" {
  description = "Create aws_acm_certificate_validation and wait for DNS validation to complete."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags applied to the ACM certificate."
  type        = map(string)
  default     = {}
}

resource "aws_acm_certificate" "this" {
  domain_name       = var.domain_name
  validation_method = "DNS"
  key_algorithm     = var.key_algorithm

  lifecycle { create_before_destroy = true }
  tags = var.tags
}

locals {
  dvo_records = {
    for dvo in aws_acm_certificate.this.domain_validation_options :
    dvo.domain_name => {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  }
}

resource "aws_route53_record" "validation" {
  for_each = local.dvo_records

  zone_id = var.hosted_zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.value]
}


resource "aws_acm_certificate_validation" "this" {
  count                   = var.wait_for_validation ? 1 : 0
  certificate_arn         = aws_acm_certificate.this.arn
  validation_record_fqdns = [for r in aws_route53_record.validation : r.fqdn]
}

output "certificate_arn" {
  description = "ARN of the ACM certificate (validated ARN if wait_for_validation = true)."
  value       = var.wait_for_validation ? aws_acm_certificate_validation.this[0].certificate_arn : aws_acm_certificate.this.arn
}

output "domain_name" {
  description = "The FQDN for which the certificate was requested."
  value       = var.domain_name
}

output "validation_fqdns" {
  description = "FQDNs of Route 53 DNS validation records created."
  value       = [for r in aws_route53_record.validation : r.fqdn]
}
