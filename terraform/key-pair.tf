resource "tls_private_key" "ssh" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "my_server_key" {
  key_name   = "my_server_key"
  public_key = tls_private_key.ssh.public_key_openssh
}

resource "local_file" "ansible_private_key" {
  filename        = "../data/jenkins_id_rsa"
  content         = tls_private_key.ssh.private_key_pem
  file_permission = "0600"
}
