# AWS VPC Infrastructure with Terraform

This repository contains Terraform configurations for provisioning AWS VPC infrastructure using the official AWS VPC module. The project includes two implementations: a basic VPC setup and a standardized, production-ready configuration with best practices.

## Project Structure

```
.
├── terraform-manifests/
│   └── v1-vpc-modules/          # Basic VPC implementation
│       ├── c1-version.tf
│       ├── c2-generic-variables.tf
│       └── c3-vpc.tf
└── vpc-module-standardized/     # Production-ready VPC with standards
    ├── c1-version.tf
    ├── c2-generic-variables.tf
    ├── c3-local-values.tf
    ├── c4-01-vpc-variables.tf
    ├── c4-02-vpc-modules.tf
    ├── c4-03-vpc-outputs.tf
    ├── terraform.tfvars
    └── vpc.auto.tfvars
```

## Features

### Network Architecture

- **Multi-AZ Deployment**: Resources distributed across multiple availability zones for high availability
- **Three-Tier Network Design**:
  - Public Subnets: For internet-facing resources (load balancers, bastion hosts)
  - Private Subnets: For application servers and compute resources
  - Database Subnets: Isolated subnets for database instances
- **NAT Gateway**: Enables outbound internet connectivity for private subnets
- **DNS Support**: DNS hostnames and resolution enabled

### Infrastructure Components

- VPC with customizable CIDR block
- Public subnets in multiple AZs
- Private subnets in multiple AZs
- Database subnet group with dedicated route table
- Internet Gateway for public subnet connectivity
- NAT Gateway for private subnet outbound access (single NAT for cost optimization)
- Appropriate route tables for each subnet tier

## Prerequisites

- Terraform >= 1.6
- AWS CLI configured with appropriate credentials
- AWS Account with necessary permissions to create VPC resources

## Quick Start

### Using the Standardized Module (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd AWS-VPC/vpc-module-standardized
```

2. Initialize Terraform:
```bash
terraform init
```

3. Review and customize variables in `terraform.tfvars` and `vpc.auto.tfvars`:
```bash
# Edit terraform.tfvars for general settings
# Edit vpc.auto.tfvars for VPC-specific settings
```

4. Plan the deployment:
```bash
terraform plan
```

5. Apply the configuration:
```bash
terraform apply
```

## Configuration

### Basic Configuration (terraform.tfvars)

```hcl
aws_region = "us-east-1"
environment = "stag"
business_divsion = "HR"
```

### VPC Configuration (vpc.auto.tfvars)

```hcl
vpc_name = "myvpc"
vpc_cidr_block = "10.0.0.0/16"
vpc_availability_zones = ["us-east-1a", "us-east-1b"]
vpc_public_subnets = ["10.0.101.0/24", "10.0.102.0/24"]
vpc_private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
vpc_database_subnets = ["10.0.151.0/24", "10.0.152.0/24"]
vpc_create_database_subnet_group = true 
vpc_create_database_subnet_route_table = true   
vpc_enable_nat_gateway = true  
vpc_single_nat_gateway = true
```

## Network Design

### Default CIDR Allocation

| Subnet Type | AZ | CIDR Block | Hosts |
|-------------|-----|------------|-------|
| Public | us-east-1a | 10.0.101.0/24 | 251 |
| Public | us-east-1b | 10.0.102.0/24 | 251 |
| Private | us-east-1a | 10.0.1.0/24 | 251 |
| Private | us-east-1b | 10.0.2.0/24 | 251 |
| Database | us-east-1a | 10.0.151.0/24 | 251 |
| Database | us-east-1b | 10.0.152.0/24 | 251 |

## Outputs

The module provides the following outputs:

- `vpc_id`: The ID of the VPC
- `vpc_cidr_block`: The CIDR block of the VPC
- `private_subnets`: List of private subnet IDs
- `public_subnets`: List of public subnet IDs
- `nat_public_ips`: Public IPs of NAT Gateways
- `azs`: List of availability zones used

## Tagging Strategy

Resources are tagged with:
- **Environment**: Deployment environment (dev, stag, prod)
- **Business Division**: Organizational unit
- **Type**: Subnet classification
- **Owner**: Resource owner

## Cost Optimization

The default configuration uses a **single NAT Gateway** to minimize costs. For production environments requiring high availability, consider:

```hcl
vpc_single_nat_gateway = false  # Deploy NAT Gateway in each AZ
```

Note: Multiple NAT Gateways will increase costs but provide better redundancy.

## Module Versions

- AWS Provider: ~> 5.0
- VPC Module: 5.4.0 (standardized) / 5.13.0 (basic)

## Customization

### Changing AWS Region

Modify `aws_region` in `terraform.tfvars`:
```hcl
aws_region = "us-west-2"
```

Remember to update availability zones accordingly in `vpc.auto.tfvars`.

### Adjusting CIDR Blocks

Modify the CIDR blocks in `vpc.auto.tfvars` to match your network design:
```hcl
vpc_cidr_block = "10.0.0.0/16"
vpc_public_subnets = ["10.0.101.0/24", "10.0.102.0/24"]
```

### Adding More Availability Zones

Extend the lists in `vpc.auto.tfvars`:
```hcl
vpc_availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
vpc_public_subnets = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
```

## Security Considerations

- Private subnets have no direct internet access
- Database subnets are isolated with dedicated route tables
- NAT Gateway provides controlled outbound access for private resources
- No inbound access from internet to private/database subnets by default

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will permanently delete all VPC resources. Ensure no resources are running in the VPC before destruction.

## Troubleshooting

### Common Issues

**Issue**: Terraform initialization fails
```bash
# Solution: Clean and reinitialize
rm -rf .terraform
terraform init
```

**Issue**: CIDR block conflicts
- Ensure CIDR blocks don't overlap with existing VPCs
- Verify subnet CIDR blocks are within VPC CIDR range

**Issue**: Insufficient IAM permissions
- Verify AWS credentials have VPC creation permissions
- Check AWS profile configuration in `~/.aws/credentials`
