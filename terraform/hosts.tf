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
  vpc_id      = aws_vpc.dev_main.id

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
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 443
    to_port     = 443
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

resource "aws_ebs_volume" "main_server_data" {
  availability_zone = aws_subnet.public_subnet_1.availability_zone
  size              = 5

  tags = {
    Name = "dev_main_server_data"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_volume_attachment" "main_server_data_attachment" {
  volume_id   = aws_ebs_volume.main_server_data.id
  instance_id = aws_instance.main_server.id
  device_name = "/dev/sdf"
}

resource "aws_instance" "main_server" {
  ami                         = data.aws_ami.amzn_linx_lts.id
  instance_type               = "t4g.micro"
  key_name                    = aws_key_pair.my_server_key.key_name
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.jenkins_server_sg.id]
  iam_instance_profile        = aws_iam_instance_profile.main_server_profile.name
  subnet_id                   = aws_subnet.public_subnet_1.id

  root_block_device {
    volume_size = 8
  }

  tags = {
    Name = "Jenkins Instance"
  }
}

locals {
  jenkins_hosts = [aws_instance.main_server.public_ip]
}

resource "local_file" "ansible_inventory" {
  filename = "../data/hosts.ini"
  content = templatefile("./templates/hosts.tpl", {
    hosts = local.jenkins_hosts
  })
}


resource "aws_iam_role" "main_server_role" {
  name = "main_server_role"

  assume_role_policy = local.assume_ec2_instances
}

resource "aws_iam_instance_profile" "main_server_profile" {
  name = "main_server_profile"
  role = aws_iam_role.main_server_role.name
}

resource "aws_iam_role_policy" "main_server_role_policy" {
  name = "main_server_role_policy"
  role = aws_iam_role.main_server_role.name
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "SSMReadAll",
        Effect = "Allow",
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath",
          "ssm:DescribeParameters"
        ],
        Resource = "*"
      },
      {
        Sid    = "KMSDecryptAll",
        Effect = "Allow",
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ],
        Resource = "*"
      },
      {
        Sid    = "ECRGetAuthToken",
        Effect = "Allow",
        Action = [
          "ecr:GetAuthorizationToken",
          "sts:GetCallerIdentity"
        ],
        Resource = "*"
      },
      {
        Sid    = "ECRPullRead",
        Effect = "Allow",
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
          "ecr:DescribeImages",
          "ecr:DescribeRepositories",
          "ecr:ListImages"
        ],
        Resource = "*"
      },
      {
        Sid    = "CodeBuildBasicControl",
        Effect = "Allow",
        Action = [
          "codebuild:StartBuild",
          "codebuild:BatchGetBuilds",
          "codebuild:BatchGetProjects",
          "codebuild:ListBuildsForProject"
        ],
        Resource = "*"
      },
      {
        Sid    = "EcsForceDeploy",
        Effect = "Allow",
        Action = [
          "ecs:DescribeServices",
          "ecs:UpdateService",
          "ecs:DescribeTaskDefinition",
          "ecs:RegisterTaskDefinition"
        ],
        Resource = "*"
      },
      {
        Sid    = "LogsReadOptional",
        Effect = "Allow",
        Action = [
          "logs:GetLogEvents",
          "logs:FilterLogEvents",
          "logs:DescribeLogStreams",
          "logs:DescribeLogGroups"
        ],
        Resource = "*"
      },
      {
        Sid    = "BucketLevelAllBuckets"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation",
          "s3:ListBucketMultipartUploads"
        ]
        Resource = "*"
      },
      {
        Sid    = "ObjectLevelAllBuckets"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObject",
          "s3:AbortMultipartUpload",
          "s3:ListMultipartUploadParts",
          "s3:PutObjectAcl"
        ]
        Resource = "*"
      },
      {
        Sid      = "InvalidateAllDistsInAccount"
        Effect   = "Allow"
        Action   = "cloudfront:CreateInvalidation"
        Resource = "*"
      },
      {
        Sid    = "ReadInvalidationsAllDists"
        Effect = "Allow"
        Action = [
          "cloudfront:GetInvalidation",
          "cloudfront:ListInvalidations"
        ]
        Resource = "*"
      },
      {
        Sid      = "ListDistributions"
        Effect   = "Allow"
        Action   = "cloudfront:ListDistributions"
        Resource = "*"
      }
    ]
  })
}

output "jenkins_public_ip" {
  value     = aws_instance.main_server.public_ip
  sensitive = false
}
