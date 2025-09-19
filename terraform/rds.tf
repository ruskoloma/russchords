variable "db_name" {
  description = "Name of the initial database to create"
  type        = string
  default     = "devdb"
}

variable "db_username" {
  description = "Master username for the RDS instance"
  type        = string
  default     = "postgresdev"
}

resource "aws_db_subnet_group" "dev_db" {
  name       = "dev-db-subnets"
  subnet_ids = [aws_subnet.public_subnet_1.id, aws_subnet.public_subnet_2.id]
}

resource "aws_db_instance" "dev_db" {
  identifier            = "dev-db"
  engine                = "postgres"
  engine_version        = "17.5"
  instance_class        = "db.t4g.micro"
  allocated_storage     = 20
  max_allocated_storage = 20
  storage_type          = "gp3"
  db_subnet_group_name  = aws_db_subnet_group.dev_db.name

  username                    = var.db_username
  manage_master_user_password = true

  db_name = var.db_name

  skip_final_snapshot = true
  publicly_accessible = false
  deletion_protection = false

  backup_retention_period = 0
  vpc_security_group_ids  = [aws_security_group.rds_sg.id]
}

resource "aws_security_group" "rds_sg" {
  name   = "rds-postgres-sg"
  vpc_id = aws_vpc.dev_main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_fargate_main_sg.id]
    # cidr_blocks = 
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

output "db_master_secret_arn" {
  value     = aws_db_instance.dev_db.master_user_secret[0].secret_arn
  sensitive = true
}

data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_db_instance.dev_db.master_user_secret[0].secret_arn
}

locals {
  ConnectionString = "Host=${aws_db_instance.dev_db.address};Port=${aws_db_instance.dev_db.port};Database=${var.db_name};Username=${var.db_username};Password=${jsondecode(data.aws_secretsmanager_secret_version.db_password.secret_string)["password"]}"
}
