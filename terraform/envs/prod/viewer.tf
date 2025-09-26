# Read-only viewer user for sharing with hiring managers
# This user can view all resources but cannot modify anything

# IAM User for read-only access
resource "aws_iam_user" "viewer" {
  name = "${local.env}-guest"
  path = "/"

  tags = {
    Name        = "guest"
    Environment = var.environment
    Purpose     = "Read-only access for hiring managers"
  }
}

# Attach AWS managed read-only policy
resource "aws_iam_user_policy_attachment" "viewer_readonly" {
  user       = aws_iam_user.viewer.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

# Additional policy for DynamoDB data access (ReadOnlyAccess doesn't include data operations)
resource "aws_iam_policy" "viewer_dynamodb_data" {
  name        = "guest-dynamodb-data"
  description = "DynamoDB data access for guest viewer user"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Scan",
          "dynamodb:Query",
          "dynamodb:GetItem",
          "dynamodb:BatchGetItem"
        ]
        Resource = [
          "arn:aws:dynamodb:*:*:table/${local.ddb_table_name}",
          "arn:aws:dynamodb:*:*:table/${local.ddb_table_name}/index/*"
        ]
      }
    ]
  })

  tags = {
    Name        = "guest-dynamodb-data"
    Environment = var.environment
    Purpose     = "DynamoDB data access"
  }
}

# Attach DynamoDB data policy
resource "aws_iam_user_policy_attachment" "viewer_dynamodb_data" {
  user       = aws_iam_user.viewer.name
  policy_arn = aws_iam_policy.viewer_dynamodb_data.arn
}

# Create access keys for the viewer user
resource "aws_iam_access_key" "viewer" {
  user = aws_iam_user.viewer.name
}

# Create login profile for AWS Console access
resource "aws_iam_user_login_profile" "viewer" {
  user    = aws_iam_user.viewer.name
  pgp_key = "" # No PGP encryption for simplicity

  lifecycle {
    ignore_changes = [password_length, password_reset_required, pgp_key]
  }
}

# Set the password directly (since we're not using PGP)
resource "null_resource" "set_viewer_password" {
  provisioner "local-exec" {
    command = "aws iam update-login-profile --profile ${var.aws_profile} --user-name ${aws_iam_user.viewer.name} --password '${var.viewer_user_password}' --no-password-reset-required"
  }

  depends_on = [aws_iam_user_login_profile.viewer]
}

# Store credentials in SSM Parameter Store
resource "aws_ssm_parameter" "viewer_access_key_id" {
  name        = "${local.ssm_base}/viewer/access-key-id"
  description = "Viewer user access key ID"
  type        = "String"
  value       = aws_iam_access_key.viewer.id
  overwrite   = true

  tags = {
    Name        = "guest-access-key-id"
    Environment = var.environment
    Purpose     = "Viewer access key ID"
  }
}

resource "aws_ssm_parameter" "viewer_secret_access_key" {
  name        = "${local.ssm_base}/viewer/secret-access-key"
  description = "Viewer user secret access key"
  type        = "SecureString"
  value       = aws_iam_access_key.viewer.secret
  overwrite   = true

  tags = {
    Name        = "guest-secret-access-key"
    Environment = var.environment
    Purpose     = "Viewer secret access key"
  }
}

# Simple outputs for sharing with hiring managers
output "viewer_console_login" {
  description = "AWS Console login information for hiring managers"
  value = {
    console_url   = "https://${data.aws_caller_identity.current.account_id}.signin.aws.amazon.com/console?region=${data.aws_region.current.name}"
    username      = aws_iam_user.viewer.name
    email         = var.viewer_user_email
    password      = var.viewer_user_password
    access_key_id = aws_iam_access_key.viewer.id
    region        = data.aws_region.current.name
  }
  sensitive = false
}

output "viewer_usage_instructions" {
  description = "Instructions for hiring managers"
  value       = "AWS Console Access for Hiring Managers:\n\n1. Go to: https://${data.aws_caller_identity.current.account_id}.signin.aws.amazon.com/console?region=${data.aws_region.current.name}\n2. Username: ${aws_iam_user.viewer.name}\n3. Password: ${var.viewer_user_password}\n4. Region: ${data.aws_region.current.name}\n\nWhat you can explore:\n- EC2 instances (utility host)\n- ECS cluster and services (backend API)\n- RDS database (PostgreSQL)\n- DynamoDB table (cached songs)\n- Lambda functions (song parser)\n- CloudFront distribution (frontend hosting)\n- S3 buckets (frontend assets)\n- Route53 DNS records\n- VPC and networking setup\n\nNote: This is read-only access - you cannot modify anything."
  sensitive   = false
}
