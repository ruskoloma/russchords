

resource "aws_route53_record" "dev_internal_jenkins" {
  name    = "jenkins"
  zone_id = var.private_zone_id
  type    = "A"
  ttl     = 30
  records = [aws_instance.utility_host.private_ip]
}

resource "aws_route53_record" "dev_public_jenkins" {
  name    = "jenkins"
  zone_id = var.public_zone_id
  type    = "A"
  ttl     = 30
  records = [aws_instance.utility_host.public_ip]
}

resource "aws_route53_record" "dev_public_api" {
  name    = "api"
  zone_id = var.public_zone_id
  type    = "A"
  ttl     = 30
  records = [aws_instance.utility_host.public_ip]
}

resource "aws_route53_record" "isntance1" {
  name    = "instance1"
  zone_id = var.public_zone_id
  type    = "A"
  ttl     = 30
  records = [aws_instance.utility_host.public_ip]
}
