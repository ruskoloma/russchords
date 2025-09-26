variable "key_pair_name" {
  type    = string
  default = "utility_host_key"
}

variable "write_private_key_path" {
  type    = string
  default = "../../../data/jenkins_id_rsa"
}

resource "tls_private_key" "ssh" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "my_server_key" {
  key_name   = "${var.key_pair_name}_${var.environment}"
  public_key = tls_private_key.ssh.public_key_openssh
}

resource "local_file" "ansible_private_key" {
  filename        = var.write_private_key_path
  content         = tls_private_key.ssh.private_key_pem
  file_permission = "0600"
}
