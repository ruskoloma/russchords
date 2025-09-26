data "aws_ami" "amzn_linx_lts" {
  most_recent = true
  filter {
    name   = "name"
    values = ["al2023-ami-*-arm64"]
  }
  owners = ["137112412989"]
}

resource "aws_ebs_volume" "utility_host_data" {
  availability_zone = var.availability_zone
  size              = var.ebs_volume_size
  tags = {
    Name = "${var.instance_name}_data"
  }
  lifecycle { prevent_destroy = true }
}

resource "aws_volume_attachment" "utility_host_data_attachment" {
  volume_id   = aws_ebs_volume.utility_host_data.id
  instance_id = aws_instance.utility_host.id
  device_name = "/dev/sdf"
}

resource "aws_iam_role" "utility_host_role" {
  name = "utility_host_role_${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "ec2.amazonaws.com" }
      }
    ]
  })
}

resource "aws_iam_instance_profile" "utility_host_profile" {
  name = "utility_host_profile_${var.environment}"
  role = aws_iam_role.utility_host_role.name
}

resource "aws_instance" "utility_host" {
  ami                         = data.aws_ami.amzn_linx_lts.id
  instance_type               = var.instance_type
  key_name                    = aws_key_pair.my_server_key.key_name
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.utility_host_sg.id]
  iam_instance_profile        = aws_iam_instance_profile.utility_host_profile.name
  subnet_id                   = var.subnet_id

  root_block_device { volume_size = var.root_volume_size }

  tags = { Name = "${var.instance_name}-${var.environment}" }
}

resource "local_file" "ansible_directory" {
  filename        = "${dirname(var.write_public_ip_path)}/.gitkeep"
  content         = "# Directory for ${var.environment} environment files"
  file_permission = "0755"
}

resource "local_file" "ansible_inventory" {
  filename = var.write_public_ip_path
  content = templatefile(var.ansible_inventory_template_path, {
    hosts = [aws_instance.utility_host.public_ip]
  })
  depends_on = [local_file.ansible_directory]
}

output "public_ip" {
  value = aws_instance.utility_host.public_ip
}

output "ingress_security_group_id" {
  value = aws_security_group.utility_host_sg.id
}
