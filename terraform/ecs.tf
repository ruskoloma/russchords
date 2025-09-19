resource "aws_ecs_cluster" "dev_cluster" {
  name = "dev-cluster"
}

resource "aws_ecs_cluster_capacity_providers" "dev_capacity_provider" {
  cluster_name = aws_ecs_cluster.dev_cluster.name

  capacity_providers = ["FARGATE"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
  }
}

resource "aws_ecs_task_definition" "backend_api" {
  family                   = "backend-api-task"
  cpu                      = "512"
  memory                   = "1024"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  execution_role_arn       = aws_iam_role.ecs_task_exec_role.arn
  task_role_arn            = aws_iam_role.ecs_backend_api_task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }


  container_definitions = jsonencode(local.container_definitions)
}

resource "aws_iam_role" "ecs_task_exec_role" {
  name               = "ecs-task-exec-role"
  assume_role_policy = local.assume_ecs_tasks
}

resource "aws_iam_role_policy_attachment" "ecs_exec_base_attach" {
  role       = aws_iam_role.ecs_task_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy_attachment" "ecs_exec_parameter_store_attach" {
  role       = aws_iam_role.ecs_task_exec_role.name
  policy_arn = aws_iam_policy.parameter_store_access.arn
}

resource "aws_iam_role_policy" "ecs_exec_create_log_group" {
  name = "ecs-exec-create-log-group"
  role = aws_iam_role.ecs_task_exec_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = ["logs:CreateLogGroup"],
      Resource = "*"
    }]
  })
}

resource "aws_iam_policy" "parameter_store_access" {
  name        = "parameter-store-access"
  description = "Allows retrieving parameters from ssm "

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SSMReadAll"
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath",
          "ssm:DescribeParameters"
        ]
        Resource = "*"
      },
      {
        Sid    = "KMSDecryptAll"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })
}


resource "aws_iam_role" "ecs_backend_api_task" {
  name               = "ecs-backend-api-task"
  assume_role_policy = local.assume_ecs_tasks
}

resource "aws_iam_role_policy_attachment" "ecs_backend_api_task_attach_ssm" {
  role       = aws_iam_role.ecs_backend_api_task.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess"
}

resource "aws_iam_role_policy_attachment" "ecs_backend_api_task_attach_ddb" {
  role       = aws_iam_role.ecs_backend_api_task.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess"
}

resource "aws_iam_role_policy_attachment" "ecs_backend_api_task_attach_rds_full" {
  role       = aws_iam_role.ecs_backend_api_task.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonRDSFullAccess"
}


resource "aws_ecs_service" "backend_api" {
  name            = "backend-api-service"
  cluster         = aws_ecs_cluster.dev_cluster.name
  task_definition = aws_ecs_task_definition.backend_api.arn
  desired_count   = 1

  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
  }

  network_configuration {
    subnets          = [aws_subnet.public_subnet_1.id]
    security_groups  = [aws_security_group.ecs_fargate_main_sg.id]
    assign_public_ip = true
  }

  service_registries {
    registry_arn = aws_service_discovery_service.api.arn
  }
}

resource "aws_security_group" "ecs_fargate_main_sg" {
  name        = "ecs-fargate-main-sg"
  description = "Allow all inbound and outbound traffic"
  vpc_id      = aws_vpc.dev_main.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}







locals {
  container_definitions = [
    {
      name = "aspnet-backend"

      environment = [
        {
          name  = "ASPNETCORE_ENVIRONMENT"
          value = "Production"
        },
        {
          name  = "ConnectionStrings__DefaultConnection",
          value = local.ConnectionString
        },
        {
          name  = "AWS_REGION",
          value = data.aws_region.current.name
        },
        {
          name  = "COGNITO__AUTHORITY",
          value = local.cognito_authority
        },
        {
          name  = "COGNITO__CLIENTID",
          value = aws_cognito_user_pool_client.web.id
        },

      ]

      environmentFiles = []
      image            = "${data.aws_caller_identity.current.account_id}.dkr.ecr.us-west-2.amazonaws.com/${var.ecr_backend_repo}:latest"

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/backend-task-definition"
          "awslogs-create-group"  = "true"
          "awslogs-region"        = "us-west-2"
          "awslogs-stream-prefix" = "ecs"
        }
      }

      portMappings = [
        {
          appProtocol   = "http"
          containerPort = 8080
          name          = "aspnet-backend-8080-tcp"
          protocol      = "tcp"
        }
      ]

      secrets = [
        # { name = "COGNITO__AUTHORITY", valueFrom = "/russchords/dev/shared/cognito/authority" },
        # { name = "COGNITO__CLIENTID", valueFrom = "/russchords/dev/shared/cognito/client_id" },
        # { name = "ConnectionStrings__DefaultConnection", valueFrom = "/russchords/dev/backend/db/connection_string" },
        # { name = "HTTPS_PROXY", valueFrom = "/russchords/stage/shared/proxy/https" },
        # { name = "HTTP_PROXY", valueFrom = "/russchords/stage/shared/proxy/http" }
      ]
    }
  ]
}


resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = "dev-ecs.internal"
  description = "Private DNS namespace for ECS services"
  vpc         = aws_vpc.dev_main.id
}

resource "aws_service_discovery_service" "api" {
  name = "api"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id

    dns_records {
      type = "A"
      ttl  = 10
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}
