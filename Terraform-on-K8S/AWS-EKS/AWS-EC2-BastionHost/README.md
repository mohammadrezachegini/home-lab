# AWS EKS Cluster with Bastion Host - Terraform Infrastructure

This repository contains Terraform configurations to provision a complete AWS EKS (Elastic Kubernetes Service) cluster with a bastion host for secure access.

## 🏗️ Architecture Overview

This infrastructure creates:
- **VPC** with public, private, and database subnets across multiple availability zones
- **EKS Cluster** for running Kubernetes workloads
- **Bastion Host** (EC2 instance) in public subnet for secure cluster access
- **NAT Gateway** for private subnet internet access
- **Security Groups** with appropriate ingress/egress rules
- **Elastic IP** for stable bastion host access

## 📋 Prerequisites

Before you begin, ensure you have:

- [Terraform](https://www.terraform.io/downloads.html) >= 1.0 installed
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- AWS account with necessary permissions to create VPC, EKS, EC2 resources
- SSH key pair created in AWS (default: `terraform-key`)
- Private key file stored locally at `private-key/terraform-key.pem`

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Terraform-on-K8S/AWS-EKS/AWS-EC2-BastionHost/terraform-manifests
```

### 2. Configure AWS Credentials

Ensure your AWS credentials are configured:

```bash
aws configure
```

Or set up credentials in `~/.aws/credentials`:

```ini
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
```

### 3. Review and Customize Variables

Edit the `.tfvars` files to match your requirements:

**terraform.tfvars** - General settings:
```hcl
aws_region = "us-east-1"
environment = "stag"
business_divsion = "hr"
```

**vpc.auto.tfvars** - VPC configuration:
```hcl
vpc_name = "myvpc"
vpc_cidr_block = "10.0.0.0/16"
vpc_public_subnets = ["10.0.101.0/24", "10.0.102.0/24"]
vpc_private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
```

**eks.auto.tfvars** - EKS cluster name:
```hcl
cluster_name = "eksdemo1"
```

**ec2bastion.auto.tfvars** - Bastion host settings:
```hcl
instance_type = "t3.micro"
instance_keypair = "terraform-key"
```

### 4. Initialize Terraform

```bash
terraform init
```

### 5. Plan the Infrastructure

```bash
terraform plan
```

### 6. Apply the Configuration

```bash
terraform apply
```

Type `yes` when prompted to confirm the deployment.

## 📁 Project Structure

```
terraform-manifests/
├── c1-versions.tf                      # Terraform and provider versions
├── c2-01-generic-variables.tf         # Generic input variables
├── c2-02-local-values.tf               # Local values and common tags
├── c3-01-vpc-variables.tf              # VPC input variables
├── c3-02-vpc-module.tf                 # VPC module configuration
├── c3-03-vpc-outputs.tf                # VPC output values
├── c4-01-ec2bastion-variables.tf       # EC2 bastion variables
├── c4-02-ec2bastion-outputs.tf         # EC2 bastion outputs
├── c4-03-ec2bastion-securitygroups.tf  # Security groups
├── c4-04-ami-datasource.tf             # AMI data source
├── c4-05-ec2bastion-instance.tf        # EC2 instance configuration
├── c4-06-ec2bastion-elasticip.tf       # Elastic IP for bastion
├── c4-07-ec2bastion-provisioners.tf    # Provisioners for bastion setup
├── c5-01-eks-variables.tf              # EKS cluster variables
├── terraform.tfvars                    # General variable values
├── vpc.auto.tfvars                     # VPC variable values
├── eks.auto.tfvars                     # EKS variable values
└── ec2bastion.auto.tfvars              # Bastion variable values
```

## 🔧 Configuration Details

### VPC Configuration

- **CIDR Block**: 10.0.0.0/16
- **Availability Zones**: us-east-1a, us-east-1b
- **Public Subnets**: 10.0.101.0/24, 10.0.102.0/24
- **Private Subnets**: 10.0.1.0/24, 10.0.2.0/24
- **Database Subnets**: 10.0.151.0/24, 10.0.152.0/24
- **NAT Gateway**: Single NAT gateway for cost optimization

### Bastion Host

- **Instance Type**: t3.micro
- **AMI**: Latest Amazon Linux 2
- **Access**: SSH on port 22 (open to 0.0.0.0/0)
- **Elastic IP**: Yes (for stable access)

### EKS Cluster

- **Name**: eksdemo1
- **Region**: us-east-1
- **Network**: Deployed in private subnets

## 📤 Outputs

After successful deployment, Terraform will output:

- `vpc_id` - The VPC ID
- `vpc_cidr_block` - VPC CIDR block
- `private_subnets` - List of private subnet IDs
- `public_subnets` - List of public subnet IDs
- `nat_public_ips` - NAT gateway public IP
- `ec2_bastion_public_instance_ids` - Bastion host instance ID
- `ec2_bastion_eip` - Bastion host Elastic IP

## 🔐 Accessing the Bastion Host

After deployment, connect to the bastion host:

```bash
ssh -i private-key/terraform-key.pem ec2-user@<BASTION_EIP>
```

Replace `<BASTION_EIP>` with the Elastic IP from Terraform outputs.

## 🧹 Cleanup

To destroy all created resources:

```bash
terraform destroy
```

Type `yes` when prompted to confirm deletion.

## ⚠️ Important Notes

- The bastion host security group allows SSH from anywhere (0.0.0.0/0). Consider restricting this to your IP range in production.
- Single NAT gateway configuration is used for cost savings but creates a single point of failure.
- Ensure your private key file has proper permissions: `chmod 400 private-key/terraform-key.pem`

## 🔄 Updating Resources

To update the infrastructure:

1. Modify the relevant `.tf` or `.tfvars` files
2. Run `terraform plan` to review changes
3. Run `terraform apply` to apply changes

## 📚 Module Versions

- **AWS Provider**: 5.74
- **VPC Module**: 5.14.0
- **Security Group Module**: 5.2.0
- **EC2 Instance Module**: 5.7.1

