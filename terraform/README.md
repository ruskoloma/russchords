# RussChords Terraform

## Structure
- modules/network: VPC, public subnets, IGW, routes
- modules/dns: Route53 public and private zones
- providers.tf: providers and common variables
- main.tf: module wiring and core variables
- *.tf: service stacks (ecs, lambda, rds, cdn, hosts, cognito, codebuild, dynamodb)

## Usage
```
terraform init
terraform plan -out=plan.tfplan
terraform apply plan.tfplan
```

## Inputs (root)
- aws_region (default: us-west-2)
- aws_profile (default: russchords-admin)
- environment (default: dev)
- vpc_cidr (default: 10.0.0.0/16)
- public_subnet_cidrs (default: [10.0.1.0/24, 10.0.2.0/24])
- public_zone_name (default: russchords.dev)
- private_zone_name (default: dev.internal)

## Notes
- DNS records and services consume outputs from modules.
- Avoid hardcoding ARNs/IDs; prefer variables and module outputs.

