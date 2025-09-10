data "aws_ami" "amzn_linx_lts" {
  most_recent = true

  filter {
    name   = "name"
    values = ["al2023-ami-*-arm64"]
  }

  owners = ["137112412989"]
}

resource "aws_security_group" "jenkins_server_sg" {
  name        = "jenkins_server_sg"
  description = "allows ssh and http traffic"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "my_server" {
  ami                         = data.aws_ami.amzn_linx_lts.id
  instance_type               = "t4g.micro"
  key_name                    = aws_key_pair.my_server_key.key_name
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.jenkins_server_sg.id]

  root_block_device {
    volume_size = 8
  }

  tags = {
    Name = "Jenkins Instance"
  }
}

locals {
  jenkins_hosts = [aws_instance.my_server.public_ip]
}

resource "local_file" "ansible_inventory" {
  filename = "../data/hosts.ini"
  content = templatefile("./templates/hosts.tpl", {
    hosts = local.jenkins_hosts
  })
}

output "jenkins_public_ip" {
  value     = aws_instance.my_server.public_ip
  sensitive = false
}
