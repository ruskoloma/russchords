provider "aws" {
  region  = "us-west-2"
  profile = "russchords-admin"

  default_tags {
    tags = {
      Environment = "dev"
    }
  }
}

provider "aws" {
  alias   = "us_east_1"
  region  = "us-east-1"
  profile = "russchords-admin"
}

provider "awscc" {
  region  = data.aws_region.current.name
  profile = "russchords-admin"
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "dev_main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "Dev VPC"
  }
}

resource "aws_subnet" "public_subnet_1" {
  vpc_id                  = aws_vpc.dev_main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "Main Dev"
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.dev_main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name = "Main Dev"
  }
}

resource "aws_route_table" "main_route_table" {
  vpc_id = aws_vpc.dev_main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main_gw.id
  }
}

resource "aws_internet_gateway" "main_gw" {
  vpc_id = aws_vpc.dev_main.id
}

resource "aws_route_table_association" "a" {
  subnet_id      = aws_subnet.public_subnet_1.id
  route_table_id = aws_route_table.main_route_table.id
}

data "aws_region" "current" {}

data "aws_caller_identity" "current" {}
