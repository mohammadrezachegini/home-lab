# AWS EC2 Instance and Security Groups - Terraform Infrastructure

A production-ready Terraform project for deploying a secure AWS infrastructure with VPC, public bastion hosts, private EC2 instances, and properly configured security groups.

## Architecture Overview

This project creates a multi-tier AWS infrastructure with:

- **VPC** with public, private, and database subnets across multiple availability zones
- **Bastion Host** in public subnet for secure SSH access
- **Private EC2 Instances** running a sample web application
- **Security Groups** with least-privilege access controls
- **NAT Gateway** for private subnet internet access
- **Elastic IP** for bastion host persistent addressing

## Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) >= 1.0
- AWS Account with appropriate permissions
- AWS CLI configured with credentials
- SSH key pair created in AWS (default: `terraform-key`)

## Project Structure

```
terraform-manifests/
├── app1-install.sh                        # User data script for web server setup
├── c1-versions.tf                         # Terraform and provider versions
├── c2-generic-variables.tf                # Generic variables (region, environment)
├── c3-local-values.tf                     # Local values for resource naming
├── c4-01-vpc-variables.tf                 # VPC configuration variables
├── c4-02-vpc-module.tf                    # VPC module configuration
├── c4-03-vpc-outputs.tf                   # VPC outputs
├── c5-01-securitygroup-variables.tf       # Security group variables
├── c5-02-securitygroup-outputs.tf         # Security group outputs
├── c5-03-securitygroup-bastionsg.tf       # Bastion host security group
├── c5-04-securitygroup-privatesg.tf       # Private instance security group
├── c6-01-datasource-ami.tf                # AMI data source for Amazon Linux 2
├── c7-01-ec2instance-variables.tf         # EC2 instance variables
├── c7-02-ec2instance-outputs.tf           # EC2 instance outputs
├── c7-03-ec2instance-bastion.tf           # Bastion host EC2 configuration
├── c7-04-ec2instance-private.tf           # Private EC2 instances configuration
├── c8-elasticip.tf                        # Elastic IP for bastion host
├── c9-nullresource-provisioners.tf        # Provisioners for SSH key setup
├── ec2instance.auto.tfvars                # EC2 instance variable values
├── vpc.auto.tfvars                        # VPC variable values (empty)
└── terraform.tfvars                       # General variable values (empty)
```

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AWS-EC2Instance-and-SecurityGroups/terraform-manifests
```

### 2. Configure Variables

Update the variable files as needed:

**ec2instance.auto.tfvars:**
```hcl
instance_type = "t2.micro"
instance_keypair = "terraform-key"  # Replace with your key pair name
private_instance_count = 2
```

**c2-generic-variables.tf** (optional overrides):
```hcl
variable "aws_region" {
  default = "us-east-1"  # Change if needed
}

variable "environment" {
  default = "dev"  # dev, staging, prod
}

variable "business_division" {
  default = "sap"
}
```

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Create SSH Key Directory

```bash
mkdir -p private-key
# Place your terraform-key.pem file in this directory
chmod 400 private-key/terraform-key.pem
```

### 5. Plan and Apply

```bash
terraform plan
terraform apply
```

Review the plan and type `yes` to create the infrastructure.

## Configuration Details

### VPC Configuration

- **CIDR Block:** 10.0.0.0/16
- **Availability Zones:** us-east-1a, us-east-1b
- **Public Subnets:** 10.0.101.0/24, 10.0.102.0/24
- **Private Subnets:** 10.0.1.0/24, 10.0.2.0/24
- **Database Subnets:** 10.0.151.0/24, 10.0.152.0/24

### Security Groups

**Bastion Host Security Group:**
- Ingress: SSH (port 22) from 0.0.0.0/0
- Egress: All traffic allowed

**Private Instance Security Group:**
- Ingress: SSH (port 22) and HTTP (port 80) from VPC CIDR only
- Egress: All traffic allowed

### EC2 Instances

- **AMI:** Latest Amazon Linux 2
- **Instance Type:** t2.micro (configurable)
- **Private Instances:** 2 instances across availability zones
- **Bastion Host:** 1 instance with Elastic IP

## Accessing Resources

### Connect to Bastion Host

```bash
ssh -i private-key/terraform-key.pem ec2-user@<BASTION_ELASTIC_IP>
```

### Connect to Private Instances (via Bastion)

```bash
# From bastion host
ssh -i /tmp/terraform-key.pem ec2-user@<PRIVATE_INSTANCE_IP>
```

### Access Web Application

From bastion host:
```bash
curl http://<PRIVATE_INSTANCE_IP>/app1/
```

## Outputs

After deployment, Terraform will output:

- VPC ID and CIDR block
- Public and private subnet IDs
- NAT Gateway public IPs
- Bastion host public IP
- Private instance IDs and private IPs
- Security group IDs

View outputs:
```bash
terraform output
```

## Web Application

The private instances run a simple Apache web server with:

- **Homepage:** `/var/www/html/index.html`
- **App1 Page:** `/var/www/html/app1/index.html`
- **Metadata:** `/var/www/html/app1/metadata.html` (EC2 instance metadata)

## Customization

### Change Instance Count

Edit `ec2instance.auto.tfvars`:
```hcl
private_instance_count = 3  # Increase to 3 instances
```

### Modify VPC Configuration

Edit `c4-01-vpc-variables.tf` to change:
- CIDR blocks
- Subnet configurations
- Availability zones
- NAT Gateway settings

### Update Security Group Rules

Modify `c5-03-securitygroup-bastionsg.tf` or `c5-04-securitygroup-privatesg.tf` to adjust ingress/egress rules.

## Clean Up

To destroy all resources:

```bash
terraform destroy
```

Type `yes` to confirm deletion.

## Cost Considerations

Running this infrastructure will incur AWS charges for:
- EC2 instances (t2.micro eligible for free tier)
- NAT Gateway (~$0.045/hour + data transfer)
- Elastic IP (free when attached, $0.005/hour when detached)
- Data transfer

**Estimated Monthly Cost:** ~$32-40 (primarily NAT Gateway)

To reduce costs:
- Set `vpc_enable_nat_gateway = false` (private instances lose internet access)
- Use t3.micro instances (better performance/cost ratio)
- Destroy resources when not in use

## Troubleshooting

### SSH Connection Issues

1. Verify security group allows SSH from your IP
2. Check that key pair permissions are correct (`chmod 400`)
3. Confirm Elastic IP is attached to bastion host

### Private Instance Access

1. Ensure you're connecting via bastion host
2. Verify private security group allows traffic from VPC CIDR
3. Check NAT Gateway is functioning for outbound connectivity

### Terraform Errors

```bash
# Refresh state
terraform refresh

# Validate configuration
terraform validate

# Re-initialize if needed
terraform init -upgrade
```

## Security Best Practices

✅ Bastion host uses Elastic IP for consistent access  
✅ Private instances not directly accessible from internet  
✅ Security groups follow least-privilege principle  
✅ NAT Gateway for secure outbound internet access  
✅ SSH keys properly provisioned with correct permissions  

⚠️ **Production Recommendations:**
- Restrict bastion SSH access to specific IP ranges
- Implement AWS Systems Manager Session Manager instead of bastion
- Enable VPC Flow Logs for network monitoring
- Use AWS Secrets Manager for key management
- Enable CloudWatch monitoring and alarms

