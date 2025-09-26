variable "db_name" {
  description = "Name of the initial database to create"
  type        = string
  default     = "postgres"
}

variable "db_username" {
  description = "Master username for the RDS instance"
  type        = string
  default     = "postgres"
}

variable "db_identifier" {
  description = "Identifier for the RDS instance"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for the RDS instance"
  type        = list(string)
}

variable "vpc_id" {
  description = "VPC ID for the RDS instance"
  type        = string
}

variable "ingress_security_group_id" {
  description = "Security group ID for the RDS instance ingress"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, prod, etc.)"
  type        = string
}

resource "aws_db_subnet_group" "this" {
  name       = "${var.environment}-db-subnets"
  subnet_ids = var.subnet_ids
}

resource "aws_db_instance" "this" {
  identifier            = var.db_identifier
  engine                = "postgres"
  engine_version        = "17.5"
  instance_class        = "db.t4g.micro"
  allocated_storage     = 20
  max_allocated_storage = 20
  storage_type          = "gp3"
  db_subnet_group_name  = aws_db_subnet_group.this.name

  username                    = var.db_username
  manage_master_user_password = true

  db_name = var.db_name

  skip_final_snapshot = true
  publicly_accessible = false
  deletion_protection = false

  backup_retention_period = 0
  vpc_security_group_ids  = [aws_security_group.this.id]
}

resource "aws_security_group" "this" {
  name   = "rds-postgres-sg-${var.environment}"
  vpc_id = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.ingress_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_db_instance.this.master_user_secret[0].secret_arn
}

output "db_master_secret_arn" {
  value     = aws_db_instance.this.master_user_secret[0].secret_arn
  sensitive = true
}

output "ConnectionString" {
  value     = "Host=${aws_db_instance.this.address};Port=${aws_db_instance.this.port};Database=${var.db_name};Username=${var.db_username};Password=${jsondecode(data.aws_secretsmanager_secret_version.db_password.secret_string)["password"]}"
  sensitive = true
}
