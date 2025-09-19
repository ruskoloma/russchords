variable "project_name" {
  description = "Project name"
  default     = "rcfrontdev"
}

variable "frontend_domain" {
  description = "Domain name for the frontend"
  default     = "russchords.dev"
}

locals {
  frontend_hosted_zone_id = aws_route53_zone.dev_public.id
}

locals {
  s3_bucket_name = "${var.project_name}-bucket"
}

resource "aws_acm_certificate" "cdn" {
  provider          = aws.us_east_1
  domain_name       = var.frontend_domain
  validation_method = "DNS"
  lifecycle {
    create_before_destroy = true
  }
  tags = {
    Name = "${var.project_name}-cert"
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cdn.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }
  zone_id = local.frontend_hosted_zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "cdn" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.cdn.arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

resource "aws_s3_bucket" "frontend" {
  bucket        = local.s3_bucket_name
  force_destroy = true
  tags = {
    Name = var.project_name
  }
}

resource "aws_s3_bucket_ownership_controls" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.project_name}-oac"
  description                       = "OAC for ${var.project_name} S3"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

data "aws_iam_policy_document" "frontend_bucket" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.frontend.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.frontend.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = data.aws_iam_policy_document.frontend_bucket.json
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  comment             = "CloudFront distribution for ${var.project_name}"
  default_root_object = "index.html"

  aliases = [var.frontend_domain]

  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "s3-${aws_s3_bucket.frontend.id}"

    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-${aws_s3_bucket.frontend.id}"
    viewer_protocol_policy = "redirect-to-https"

    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6" # AWS Managed: CachingOptimized
    compress        = true

    response_headers_policy_id = "67f7725c-6f97-4210-82d7-5512b31e9d03" # AWS Managed: SecurityHeadersPolicy
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  price_class = "PriceClass_100"

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cdn.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Name = var.project_name
  }

  depends_on = [
    aws_acm_certificate_validation.cdn
  ]
}

resource "aws_route53_record" "frontend_alias" {
  zone_id = local.frontend_hosted_zone_id
  name    = var.frontend_domain
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}

output "s3_bucket_name" {
  value = aws_s3_bucket.frontend.bucket
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.frontend.id
}
