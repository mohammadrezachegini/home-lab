# AWS Autoscaling with Launch Templates - Terraform

A comprehensive Terraform infrastructure project that deploys a highly available, auto-scaling web application on AWS with Application Load Balancer, SSL/TLS certificates, and DNS management.

## Architecture Overview

This project creates a production-ready infrastructure with:

- **VPC** with public, private, and database subnets across multiple availability zones
- **Application Load Balancer (ALB)** with HTTPS support
- **Auto Scaling Group** with Launch Templates
- **Route53** DNS integration
- **ACM** SSL/TLS certificate management
- **SNS** notifications for scaling events
- **CloudWatch** monitoring with target tracking policies

## Features

### High Availability
- Multi-AZ deployment (us-east-1a, us-east-1b)
- Auto Scaling Group with configurable min/max instances
- Application Load Balancer with health checks
- Rolling instance refresh strategy

### Security
- SSL/TLS certificates via AWS Certificate Manager
- HTTP to HTTPS redirect
- Security groups with least privilege access
- Bastion host for secure SSH access
- Private subnet deployment for application servers

### Auto Scaling Policies
- **Target Tracking Scaling**: Based on CPU utilization (50% target)
- **Target Tracking Scaling**: Based on ALB request count per target (10 requests)
- **Scheduled Actions**: Scale up at 7 AM and scale down at 5 PM

### Monitoring & Notifications
- SNS topic for auto scaling events
- Email notifications for instance launch/terminate events
- CloudWatch metrics integration

## Prerequisites

- AWS Account
- Terraform >= 1.0
- AWS CLI configured
- Domain registered in Route53 (rezaops.com in this example)
- SSH key pair created in AWS (terraform-key)

## Project Structure

```
terraform-manifests/
├── c1-versions.tf                    # Provider and version configurations
├── c2-generic-variables.tf           # Global variables (region, environment)
├── c3-local-values.tf                # Local values and common tags
├── c4-*-vpc-*.tf                     # VPC module configuration
├── c5-*-securitygroup-*.tf           # Security group modules
├── c6-*-datasource-*.tf              # Data sources (AMI, Route53)
├── c7-*-ec2instance-*.tf             # Bastion host configuration
├── c8-elasticip.tf                   # Elastic IP for bastion
├── c9-nullresource-provisioners.tf   # Provisioners for setup
├── c10-*-ALB-*.tf                    # Application Load Balancer
├── c11-acm-certificatemanager.tf     # SSL/TLS certificates
├── c12-route53-dnsregistration.tf    # DNS record creation
├── c13-*-autoscaling-*.tf            # Auto Scaling configuration
├── app1-install.sh                   # Application installation script
├── vpc.auto.tfvars                   # VPC variables
└── ec2instance.auto.tfvars           # EC2 variables
```

## Configuration

### VPC Configuration (`vpc.auto.tfvars`)
```hcl
vpc_name = "myvpc"
vpc_cidr_block = "10.0.0.0/16"
vpc_availability_zones = ["us-east-1a", "us-east-1b"]
vpc_public_subnets = ["10.0.101.0/24", "10.0.102.0/24"]
vpc_private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
vpc_database_subnets = ["10.0.151.0/24", "10.0.152.0/24"]
vpc_enable_nat_gateway = true
vpc_single_nat_gateway = true
```

### EC2 Configuration (`ec2instance.auto.tfvars`)
```hcl
instance_type = "t2.micro"
instance_keypair = "terraform-key"
private_instance_count = 2
```

## Customization Required

Before deploying, update the following:

1. **Domain Name** (multiple files):
   - `c11-acm-certificatemanager.tf`: Update domain name from `rezaops.com`
   - `c12-route53-dnsregistration.tf`: Update DNS record name
   - `c6-02-datasource-route53-zone.tf`: Update Route53 zone name

2. **Email Notification** (`c13-05-autoscaling-notifications.tf`):
   - Change `endpoint = "rezachegini1994@gmail.com"` to your email

3. **SSH Key Pair** (`ec2instance.auto.tfvars`):
   - Ensure your key pair name exists in AWS
   - Place private key in `private-key/` directory

4. **AWS Region** (`c2-generic-variables.tf`):
   - Default is `us-east-1`, change if needed

## Deployment

### Step 1: Initialize Terraform
```bash
cd terraform-manifests
terraform init
```

### Step 2: Validate Configuration
```bash
terraform validate
```

### Step 3: Plan Deployment
```bash
terraform plan
```

### Step 4: Apply Configuration
```bash
terraform apply
```

Confirm by typing `yes` when prompted.

### Step 5: Verify Email Subscription
Check your email and confirm the SNS subscription for auto scaling notifications.

## Accessing the Application

After deployment, access your application at:
- **HTTP**: `http://asg-lt.rezaops.com` (redirects to HTTPS)
- **HTTPS**: `https://asg-lt.rezaops.com`

Application endpoints:
- `/` - Root with fixed response
- `/app1/index.html` - Application home page
- `/app1/metadata.html` - EC2 instance metadata

## Auto Scaling Behavior

### Capacity Settings
- **Desired**: 2 instances
- **Minimum**: 2 instances
- **Maximum**: 5 instances

### Scaling Triggers
1. **CPU Utilization**: Scales when average CPU > 50%
2. **Request Count**: Scales when requests per target > 10
3. **Schedule**: 
   - Scale to 8 instances at 7 AM UTC
   - Scale to 2 instances at 9 PM UTC

### Health Checks
- **Type**: EC2
- **Path**: `/app1/index.html`
- **Interval**: 30 seconds
- **Healthy threshold**: 3
- **Unhealthy threshold**: 3

## Outputs

Key outputs after deployment:

```hcl
# VPC
vpc_id
vpc_cidr_block
public_subnets
private_subnets

# Load Balancer
lb_dns_name
lb_arn
lb_zone_id

# Auto Scaling
autoscaling_group_id
autoscaling_group_name
launch_template_id

# ACM
acm_certificate_arn

# Bastion Host
ec2_bastion_public_ip
```

## Security Groups

### Bastion Security Group
- **Ingress**: SSH (22) from 0.0.0.0/0
- **Egress**: All traffic

### Load Balancer Security Group
- **Ingress**: HTTP (80), HTTPS (443), Port 81
- **Egress**: All traffic

### Private Instance Security Group
- **Ingress**: SSH (22), HTTP (80), HTTP (8080) from VPC CIDR
- **Egress**: All traffic

## Monitoring

CloudWatch metrics tracked:
- CPU utilization
- Request count per target
- Target response time
- Healthy/unhealthy host count

## Cost Optimization

- Single NAT Gateway (set `vpc_single_nat_gateway = true`)
- t2.micro instances (free tier eligible)
- Scheduled scaling to reduce costs during off-hours

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

Type `yes` when prompted. This will remove all AWS resources created by this project.

**Note**: Ensure to delete any S3 buckets, CloudWatch logs, or other resources that may have been created outside of Terraform.

## Troubleshooting

### Certificate Validation Issues
If ACM certificate validation fails:
- Verify Route53 hosted zone exists
- Check DNS propagation (can take up to 30 minutes)
- Ensure email confirmation if using email validation

### Auto Scaling Not Working
- Check CloudWatch alarms in AWS Console
- Verify target group health checks
- Review auto scaling activity history

### Cannot SSH to Bastion
- Verify security group allows SSH from your IP
- Check Elastic IP association
- Ensure correct private key is being used

## Module Versions

- **VPC**: 5.13.0
- **ALB**: 9.11.0
- **Security Group**: 5.2.0
- **EC2 Instance**: 5.7.0
- **ACM**: 5.1.0
