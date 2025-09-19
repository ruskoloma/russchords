resource "aws_route53_zone" "dev_public" {
  name = "russchords.dev"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_route53_zone" "dev_private" {
  name = "dev.internal"

  vpc {
    vpc_id = aws_vpc.dev_main.id
  }
}

resource "aws_route53_record" "dev_internal_jenkins" {
  name    = "jenkins.dev.internal"
  zone_id = aws_route53_zone.dev_private.id
  type    = "A"
  ttl     = "30"
  records = [aws_instance.main_server.private_ip]
}

resource "aws_route53_record" "dev_public_jenkins" {
  name    = "jenkins.russchords.dev"
  zone_id = aws_route53_zone.dev_public.id
  type    = "A"
  ttl     = "30"
  records = [aws_instance.main_server.public_ip]
}

resource "aws_route53_record" "dev_public_api" {
  name    = "api.russchords.dev"
  zone_id = aws_route53_zone.dev_public.id
  type    = "A"
  ttl     = "30"
  records = [aws_instance.main_server.public_ip]
}

resource "aws_route53_record" "isntance1" {
  name    = "instance1.russchords.dev"
  zone_id = aws_route53_zone.dev_public.id
  type    = "A"
  ttl     = "30"
  records = [aws_instance.main_server.public_ip]
}
