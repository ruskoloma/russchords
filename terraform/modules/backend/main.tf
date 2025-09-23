resource "aws_ecs_cluster" "main" {
  name = var.cluster_name
  tags = var.tags
}

resource "aws_ecs_cluster_capacity_providers" "backend_capacity_provider" {
  cluster_name       = aws_ecs_cluster.main.name
  capacity_providers = ["FARGATE"]
  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
  }
}

resource "aws_ecs_task_definition" "this" {
  family                   = "backend-task"
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name = "backend"
      environment = [
        {
          name  = "ASPNETCORE_ENVIRONMENT"
          value = "Production"
        },
        {
          name  = "AWS_REGION"
          value = data.aws_region.current.name
        },
      ]
      secrets = [
        {
          name      = "ConnectionStrings__DefaultConnection"
          valueFrom = "${var.ssm_base}/rds/connection-string"
        },
        {
          name      = "COGNITO__AUTHORITY"
          valueFrom = "${var.ssm_base}/shared/cognito/authority"
        },
        {
          name      = "COGNITO__CLIENTID"
          valueFrom = "${var.ssm_base}/shared/cognito/client_id"
        },
      ]
      image = var.ecr_repository_uri
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/backend-task"
          "awslogs-create-group"  = "true"
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }
      portMappings = [
        {
          appProtocol   = "http"
          containerPort = var.container_port
          name          = "backend-${var.container_port}-tcp"
          protocol      = "tcp"
        }
      ]
    }
  ])
}


resource "aws_ecs_service" "this" {
  name            = "backend-service"
  cluster         = aws_ecs_cluster.main.name
  task_definition = aws_ecs_task_definition.this.arn
  desired_count   = var.desired_count

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
  }

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }

  service_registries {
    registry_arn = aws_service_discovery_service.api.arn
  }
}

resource "aws_security_group" "ecs_sg" {
  name        = "ecs-backend-sg"
  description = "Security group for ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = var.container_port
    to_port     = var.container_port
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

resource "aws_service_discovery_private_dns_namespace" "backend_namespace" {
  name        = "backend-ecs.internal"
  description = "Private DNS namespace for backend services"
  vpc         = var.vpc_id
}

resource "aws_service_discovery_service" "api" {
  name = "api"
  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.backend_namespace.id
    dns_records {
      type = "A"
      ttl  = 10
    }
    routing_policy = "MULTIVALUE"
  }
}

resource "aws_route53_record" "dev_internal_api" {
  name    = "api"
  zone_id = var.private_zone_id
  type    = "CNAME"
  ttl     = 30
  records = ["api.backend-ecs.internal"]
}

output "cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "service_name" {
  value = aws_ecs_service.this.name
}

output "task_definition_arn" {
  value = aws_ecs_task_definition.this.arn
}

output "security_group_id" {
  value = aws_security_group.ecs_sg.id
}

output "ecr_repo_name" {
  value = var.image_repo_name
}

output "api_internal_domain" {
  description = "API internal domain name"
  value       = aws_route53_record.dev_internal_api.fqdn
}
