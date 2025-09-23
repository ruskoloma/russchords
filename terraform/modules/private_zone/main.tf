variable "private_zone_name" {
  description = "Private hosted zone name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for associating the private zone"
  type        = string
}

resource "aws_route53_zone" "private" {
  name = var.private_zone_name

  vpc {
    vpc_id = var.vpc_id
  }
}

output "private_zone_id" {
  value = aws_route53_zone.private.id
}

