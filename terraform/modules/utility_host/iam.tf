resource "aws_iam_role_policy" "utility_host_role_policy" {
  name = "utility_host_role_policy"
  role = aws_iam_role.utility_host_role.name
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid      = "SSMReadAll",
        Effect   = "Allow",
        Action   = ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath", "ssm:DescribeParameters"],
        Resource = "*"
      },
      {
        Sid      = "KMSDecryptAll",
        Effect   = "Allow",
        Action   = ["kms:Decrypt", "kms:DescribeKey"],
        Resource = "*"
      },
      {
        Sid      = "ECRGetAuthToken",
        Effect   = "Allow",
        Action   = ["ecr:GetAuthorizationToken", "sts:GetCallerIdentity"],
        Resource = "*"
      },
      {
        Sid      = "ECRPullRead",
        Effect   = "Allow",
        Action   = ["ecr:BatchCheckLayerAvailability", "ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer", "ecr:DescribeImages", "ecr:DescribeRepositories", "ecr:ListImages"],
        Resource = "*"
      },
      {
        Sid      = "CodeBuildBasicControl",
        Effect   = "Allow",
        Action   = ["codebuild:StartBuild", "codebuild:BatchGetBuilds", "codebuild:BatchGetProjects", "codebuild:ListBuildsForProject"],
        Resource = "*"
      },
      {
        Sid      = "EcsForceDeploy",
        Effect   = "Allow",
        Action   = ["ecs:DescribeServices", "ecs:UpdateService", "ecs:DescribeTaskDefinition", "ecs:RegisterTaskDefinition"],
        Resource = "*"
      },
      {
        Sid      = "LogsReadOptional",
        Effect   = "Allow",
        Action   = ["logs:GetLogEvents", "logs:FilterLogEvents", "logs:DescribeLogStreams", "logs:DescribeLogGroups"],
        Resource = "*"
      },
      {
        Sid      = "BucketLevelAllBuckets",
        Effect   = "Allow",
        Action   = ["s3:ListBucket", "s3:GetBucketLocation", "s3:ListBucketMultipartUploads"],
        Resource = "*"
      },
      {
        Sid      = "ObjectLevelAllBuckets",
        Effect   = "Allow",
        Action   = ["s3:PutObject", "s3:DeleteObject", "s3:GetObject", "s3:AbortMultipartUpload", "s3:ListMultipartUploadParts", "s3:PutObjectAcl"],
        Resource = "*"
      },
      {
        Sid      = "InvalidateAllDistsInAccount",
        Effect   = "Allow",
        Action   = "cloudfront:CreateInvalidation",
        Resource = "*"
      },
      {
        Sid      = "ReadInvalidationsAllDists",
        Effect   = "Allow",
        Action   = ["cloudfront:GetInvalidation", "cloudfront:ListInvalidations"],
        Resource = "*"
      },
      {
        Sid      = "ListDistributions",
        Effect   = "Allow",
        Action   = "cloudfront:ListDistributions",
        Resource = "*"
      }
    ]
  })
}
