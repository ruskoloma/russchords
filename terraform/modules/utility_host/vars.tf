variable "vpc_id" { type = string }
variable "subnet_id" { type = string }
variable "availability_zone" { type = string }

variable "instance_type" {
  type    = string
  default = "t4g.micro"
}

variable "instance_name" {
  type    = string
  default = "utility-host"
}

variable "ebs_volume_size" {
  type    = number
  default = 5
}

variable "root_volume_size" {
  type    = number
  default = 8
}

variable "write_public_ip_path" {
  type    = string
  default = "../../../data/hosts.ini"
}

variable "ansible_inventory_template_path" {
  type    = string
  default = "../../templates/hosts.tpl"
}

variable "private_zone_id" {
  description = "Route53 hosted zone ID for the domain"
  type        = string
}

variable "public_zone_id" {
  description = "Route53 hosted zone ID for the domain"
  type        = string
}
