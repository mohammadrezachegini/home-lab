# IaC DevOps using AWS CodePipeline

A complete Infrastructure as Code (IaC) solution that automates AWS infrastructure deployment using Terraform and AWS CodePipeline. This project demonstrates a production-ready DevOps workflow with multi-environment support (dev, staging) and automated CI/CD pipelines.

## 🏗️ Architecture Overview

This solution deploys a highly available, scalable web application infrastructure on AWS with the following components:

- **VPC**: Multi-AZ Virtual Private Cloud with public, private, and database subnets
- **ALB**: Application Load Balancer with SSL/TLS termination
- **Auto Scaling**: EC2 Auto Scaling Groups with dynamic scaling policies
- **Route53**: DNS management with custom domain routing
- **ACM**: SSL certificate management
- **Security Groups**: Layered security architecture
- **SNS**: Auto Scaling notifications
- **Bastion Host**: Secure SSH access to private instances

## 📋 Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Terraform v0.15.3 or higher
- AWS CodePipeline and CodeBuild setup
- Route53 hosted zone (domain: rezaops.com)
- SSH key pair (terraform-key)
- S3 bucket for Terraform state
- DynamoDB table for state locking

## 🚀 Features

### Infrastructure Components

- **High Availability**: Multi-AZ deployment across 3 availability zones
- **Auto Scaling**: Dynamic scaling based on CPU and ALB request metrics
- **Security**: Multi-layered security groups for bastion, application, and load balancer
- **SSL/TLS**: Automated certificate management with ACM
- **DNS**: Route53 integration with custom domains
- **Monitoring**: CloudWatch integration and SNS notifications

### DevOps Pipeline

- **Multi-Environment Support**: Separate dev and staging environments
- **Automated Deployments**: CI/CD via AWS CodePipeline
- **State Management**: Remote state in S3 with DynamoDB locking
- **Infrastructure Validation**: Automated terraform validate and plan

## 📁 Project Structure

```
.
├── buildspec-dev.yml           # CodeBuild spec for dev environment
├── buildspec-stag.yml          # CodeBuild spec for staging environment
└── terraform-manifests/
    ├── c1-versions.tf          # Provider and backend configuration
    ├── c2-generic-variables.tf # Global variables
    ├── c3-local-values.tf      # Local values
    ├── c4-*-vpc-*.tf          # VPC module configuration
    ├── c5-*-securitygroup-*.tf # Security group modules
    ├── c6-*-datasource-*.tf    # Data sources (AMI, Route53)
    ├── c7-*-ec2instance-*.tf   # Bastion host configuration
    ├── c8-elasticip.tf         # Elastic IP for bastion
    ├── c9-nullresource-*.tf    # Provisioners
    ├── c10-*-ALB-*.tf          # Application Load Balancer
    ├── c11-acm-*.tf            # ACM certificate
    ├── c12-route53-*.tf        # DNS registration
    ├── c13-*-autoscaling-*.tf  # Auto Scaling configuration
    ├── dev.conf                # Dev backend configuration
    ├── dev.tfvars              # Dev environment variables
    ├── stag.conf               # Staging backend configuration
    ├── stag.tfvars             # Staging environment variables
    └── terraform.tfvars        # Global terraform variables
```

## 🔧 Configuration

### Environment Variables

The project uses AWS Systems Manager Parameter Store for secure credential management:

- `/CodeBuild/MY_AWS_ACCESS_KEY_ID`
- `/CodeBuild/MY_AWS_SECRET_ACCESS_KEY`

### Terraform Versions

- **Terraform**: 0.15.3
- **AWS Provider**: 5.70.0
- **VPC Module**: 5.13.0
- **ALB Module**: 9.11.0
- **ACM Module**: 5.1.0
- **Security Group Module**: 5.2.0
- **EC2 Instance Module**: 5.7.0

## 🌍 Environments

### Development Environment

- **Domain**: devdemo5.rezaops.com
- **Backend State**: s3://terraform-on-aws-for-ec2-lowyi/iacdevops/dev/terraform.tfstate
- **VPC CIDR**: 10.0.0.0/16
- **Instance Type**: t2.micro

### Staging Environment

- **Domain**: stagedemo5.rezaops.com
- **Backend State**: s3://terraform-on-aws-for-ec2-lowyi/iacdevops/stag/terraform.tfstate
- **VPC CIDR**: 10.0.0.0/16
- **Instance Type**: t2.micro

## 📝 Deployment Instructions

### Manual Deployment

```bash
# Clone the repository
git clone <repository-url>
cd terraform-manifests

# Initialize Terraform (Dev Environment)
terraform init -backend-config=dev.conf

# Validate configuration
terraform validate

# Plan deployment
terraform plan -var-file=dev.tfvars

# Apply changes
terraform apply -var-file=dev.tfvars -auto-approve

# For Staging Environment
terraform init -backend-config=stag.conf -reconfigure
terraform plan -var-file=stag.tfvars
terraform apply -var-file=stag.tfvars -auto-approve
```

### Automated Deployment via CodePipeline

The CodePipeline automatically triggers on code commits and executes the buildspec files for each environment.

## 🔐 Security Features

- **Bastion Host**: SSH access only through bastion in public subnet
- **Private Instances**: Application instances in private subnets
- **Security Groups**: 
  - Bastion SG: SSH (22) from anywhere
  - Private SG: SSH (22), HTTP (80, 8080) from VPC only
  - ALB SG: HTTP (80), HTTPS (443) from anywhere
- **SSL/TLS**: HTTPS enforcement with automatic certificate validation
- **HTTP to HTTPS Redirect**: Automatic redirection on port 80

## 📊 Auto Scaling Configuration

### Scaling Policies

1. **CPU-Based Scaling**: Triggers when average CPU > 50%
2. **Request-Based Scaling**: Triggers when ALB requests > 10 per target

### Scheduled Scaling

- **Scale Up**: 7 AM EST (capacity: 8 instances)
- **Scale Down**: 5 PM EST (capacity: 2 instances)

### Capacity Limits

- **Minimum**: 2 instances
- **Desired**: 2 instances
- **Maximum**: 10 instances

## 🔔 Notifications

SNS notifications are configured for the following Auto Scaling events:

- Instance launch
- Instance termination
- Launch errors
- Termination errors

**Email**: rezachegini1994@gmail.com

## 🌐 Application Details

The deployed application is a simple web server that displays:

- Welcome message
- Application version
- EC2 instance metadata

**Access URLs**:
- Dev: https://devdemo5.rezaops.com
- Staging: https://stagedemo5.rezaops.com

## 🗑️ Cleanup

To destroy the infrastructure:

```bash
# Update buildspec.yml
# Change: TF_COMMAND: "apply"
# To: TF_COMMAND: "destroy"

# Or manually destroy
terraform destroy -var-file=dev.tfvars -auto-approve
terraform destroy -var-file=stag.tfvars -auto-approve
```

## 📚 Modules Used

This project leverages official Terraform AWS modules:

- [terraform-aws-modules/vpc/aws](https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws)
- [terraform-aws-modules/alb/aws](https://registry.terraform.io/modules/terraform-aws-modules/alb/aws)
- [terraform-aws-modules/security-group/aws](https://registry.terraform.io/modules/terraform-aws-modules/security-group/aws)
- [terraform-aws-modules/ec2-instance/aws](https://registry.terraform.io/modules/terraform-aws-modules/ec2-instance/aws)
- [terraform-aws-modules/acm/aws](https://registry.terraform.io/modules/terraform-aws-modules/acm/aws)

