variable "image_repo_name" {
  description = "ECR repository name to push images to (e.g. backend-api)."
  default     = "russchords/backend-api"
}

variable "github_repo" {
  description = "GitHub repo in the form owner/name."
  default     = "ruskoloma/russchords"
}

variable "github_branch" {
  description = "Branch or ref to build."
  default     = "stage"
}

resource "aws_iam_role" "codebuild" {
  name = "russchords-codebuild-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "codebuild.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "codebuild_inline" {
  name = "russchords-codebuild-inline"
  role = aws_iam_role.codebuild.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      # CloudWatch Logs
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "*"
      },

      # ECR (get token + push images)
      {
        Effect = "Allow",
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:CompleteLayerUpload",
          "ecr:DescribeRepositories",
          "ecr:GetRepositoryPolicy",
          "ecr:InitiateLayerUpload",
          "ecr:ListImages",
          "ecr:PutImage",
          "ecr:UploadLayerPart"
        ],
        Resource = "*"
      }
    ]
  })
}

# ---------- CodeBuild Project ----------
resource "aws_codebuild_project" "backend_api" {
  name         = "russchords-backend-api"
  description  = "Builds BackendApi Docker image and pushes to ECR"
  service_role = aws_iam_role.codebuild.arn

  artifacts {
    type = "NO_ARTIFACTS"
  }

  # Managed environment image (Amazon Linux) with Docker, arm64 toolchain
  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/amazonlinux-aarch64-standard:3.0"
    type                        = "ARM_CONTAINER"
    privileged_mode             = true # required for `docker build` inside CodeBuild
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = data.aws_region.current.name
    }
    environment_variable {
      name  = "AWS_ACCOUNT_ID"
      value = data.aws_caller_identity.current.account_id
    }
    environment_variable {
      name  = "IMAGE_REPO_NAME"
      value = var.image_repo_name
    }
  }

  source {
    type                = "GITHUB"
    location            = "https://github.com/${var.github_repo}.git"
    buildspec           = "backend/BackendApi/buildspec.yml"
    report_build_status = false
    git_clone_depth     = 1
    insecure_ssl        = false
  }

  # Build the specific branch/ref (matches the console screenshot: "stage")
  source_version = var.github_branch

  logs_config {
    cloudwatch_logs {
      status = "ENABLED"
    }
  }

  queued_timeout = 10 # minutes in queue before timing out
  build_timeout  = 10 # build timeout in minutes

  tags = {
    Project = "russchords"
    Service = "backend-api"
  }
}




