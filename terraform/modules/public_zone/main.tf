variable "public_zone_name" {
  description = "Public hosted zone domain name"
  type        = string
}

resource "aws_route53_zone" "public" {
  name = var.public_zone_name

  lifecycle {
    prevent_destroy = true
  }
}

output "public_zone_id" {
  value = aws_route53_zone.public.id
}
