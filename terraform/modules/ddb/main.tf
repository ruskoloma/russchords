
variable "table_name" {
  type        = string
  default     = "cached-songs"
  description = "Base DynamoDB table name"
}

variable "tags" {
  type    = map(string)
  default = {}
}

resource "aws_dynamodb_table" "this" {
  name         = var.table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = var.tags
}


output "ddb_table_name" {
  value = aws_dynamodb_table.this.name
}

output "ddb_table_arn" {
  value = aws_dynamodb_table.this.arn
}
