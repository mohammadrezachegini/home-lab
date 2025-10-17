# AWS VPC using Terraform

This project creates a production-ready AWS VPC infrastructure using Terraform with public, private, and database subnets across multiple availability zones.

## Architecture Overview

This Terraform configuration deploys:
- **VPC** with custom CIDR block
- **Public Subnets** across multiple availability zones
- **Private Subnets** for application workloads
- **Database Subnets** with dedicated subnet group
- **NAT Gateway** for private subnet internet access
- **Internet Gateway** for public subnet access
- **Route Tables** for proper traffic routing

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with credentials
- AWS Account with appropriate permissions

## Project Structure

```
terraform-manifests/
├── c1-versions.tf              # Terraform and provider versions
├── c2-generic-variables.tf     # Generic input variables
├── c3-local-values.tf          # Local values and common tags
├── c4-01-vpc-variables.tf      # VPC-specific variables
├── c4-02-vpc-module.tf         # VPC module configuration
├── c4-03-vpc-outputs.tf        # VPC output values
├── terraform.tfvars            # Generic variable values
└── vpc.auto.tfvars             # VPC variable values
```

## Configuration

### Default Settings

**Generic Variables** (terraform.tfvars):
```hcl
aws_region       = "us-east-1"
environment      = "stag"
business_divsion = "HR"
```

**VPC Variables** (vpc.auto.tfvars):
```hcl
vpc_name                               = "myvpc"
vpc_cidr_block                         = "10.0.0.0/16"
vpc_availability_zones                 = ["us-east-1a", "us-east-1b"]
vpc_public_subnets                     = ["10.0.101.0/24", "10.0.102.0/24"]
vpc_private_subnets                    = ["10.0.1.0/24", "10.0.2.0/24"]
vpc_database_subnets                   = ["10.0.151.0/24", "10.0.152.0/24"]
vpc_create_database_subnet_group       = true
vpc_create_database_subnet_route_table = true
vpc_enable_nat_gateway                 = true
vpc_single_nat_gateway                 = true
```

## Usage

### 1. AWS Credentials Setup

Configure your AWS credentials in `~/.aws/credentials`:
```ini
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
```

### 2. Initialize Terraform

```bash
cd terraform-manifests
terraform init
```

### 3. Validate Configuration

```bash
terraform validate
```

### 4. Plan Infrastructure

```bash
terraform plan
```

### 5. Apply Configuration

```bash
terraform apply
```

### 6. Destroy Infrastructure

```bash
terraform destroy
```

## Customization

### Change AWS Region

Update `terraform.tfvars`:
```hcl
aws_region = "us-west-2"
```

Update availability zones in `vpc.auto.tfvars`:
```hcl
vpc_availability_zones = ["us-west-2a", "us-west-2b"]
```

### Adjust CIDR Blocks

Modify `vpc.auto.tfvars` to use different IP ranges:
```hcl
vpc_cidr_block      = "172.16.0.0/16"
vpc_public_subnets  = ["172.16.101.0/24", "172.16.102.0/24"]
vpc_private_subnets = ["172.16.1.0/24", "172.16.2.0/24"]
```

### Add More Availability Zones

```hcl
vpc_availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
vpc_public_subnets     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
vpc_private_subnets    = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
```

### Enable Multiple NAT Gateways

For high availability, use one NAT Gateway per AZ:
```hcl
vpc_single_nat_gateway = false
```

**Note:** This increases costs as you'll be charged for each NAT Gateway.

## Outputs

After applying, Terraform will output:

- **vpc_id** - The VPC ID
- **vpc_cidr_block** - The VPC CIDR block
- **public_subnets** - List of public subnet IDs
- **private_subnets** - List of private subnet IDs
- **nat_public_ips** - NAT Gateway public IPs
- **azs** - Availability zones used

View outputs:
```bash
terraform output
```

## Features

### Network Segmentation
- Public subnets for load balancers and bastion hosts
- Private subnets for application workloads
- Database subnets isolated from application tier

### High Availability
- Resources spread across multiple availability zones
- Optional multiple NAT Gateways for redundancy

### Security
- Private subnets have no direct internet access
- NAT Gateway provides secure outbound connectivity
- Database subnets in separate route table

### Tagging
All resources are tagged with:
- Environment (dev/stag/prod)
- Business Division
- Subnet Type

## Cost Optimization

To reduce costs during development:
- Use `vpc_single_nat_gateway = true` (only one NAT Gateway)
- Deploy in fewer availability zones
- Destroy resources when not in use

## Troubleshooting

### AWS Credentials Error
Ensure AWS CLI is configured:
```bash
aws configure
```

### Provider Version Issues
Update provider version in `c1-versions.tf` if needed.

### CIDR Block Conflicts
Ensure CIDR blocks don't overlap with existing VPCs in your account.

## Module Information

This project uses the official AWS VPC Terraform module:
- **Source:** `terraform-aws-modules/vpc/aws`
- **Version:** 5.14.0
- **Documentation:** [Terraform AWS VPC Module](https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws/latest)

