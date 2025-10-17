# AWS Application Load Balancer - Terraform Infrastructure

A production-ready Terraform configuration for deploying a highly available web application infrastructure on AWS using Application Load Balancer, VPC, EC2 instances, and security groups.

## Architecture Overview

This infrastructure creates:

- **VPC** with public and private subnets across multiple availability zones
- **Application Load Balancer** in public subnets
- **EC2 instances** in private subnets running Apache web server
- **Bastion Host** in public subnet for secure access
- **Security Groups** with least privilege access
- **NAT Gateway** for private subnet internet access

## Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) >= 1.0
- AWS CLI configured with appropriate credentials
- An AWS account with necessary permissions
- SSH key pair named `terraform-key` (or customize in variables)

## Project Structure

```
terraform-manifests/
├── c1-versions.tf                              # Provider versions
├── c2-generic-variables.tf                     # Generic variables (region, environment)
├── c3-local-values.tf                          # Local values for resource naming
├── c4-01-vpc-variables.tf                      # VPC input variables
├── c4-02-vpc-module.tf                         # VPC module configuration
├── c4-03-vpc-outputs.tf                        # VPC outputs
├── c5-01-securitygroup-variables.tf            # Security group variables
├── c5-02-securitygroup-outputs.tf              # Security group outputs
├── c5-03-securitygroup-bastionsg.tf            # Bastion host security group
├── c5-04-securitygroup-privatesg.tf            # Private instances security group
├── c5-05-securitygroup-loadbalancersg.tf       # Load balancer security group
├── c6-01-datasource-ami.tf                     # Amazon Linux 2 AMI data source
├── c7-01-ec2instance-variables.tf              # EC2 instance variables
├── c7-02-ec2instance-outputs.tf                # EC2 instance outputs
├── c7-03-ec2instance-bastion.tf                # Bastion host configuration
├── c7-04-ec2instance-private.tf                # Private EC2 instances
├── c8-elasticip.tf                             # Elastic IP for bastion
├── c9-nullresource-provisioners.tf             # Provisioners for configuration
├── c10-01-ALB-application-loadbalancer-variables.tf
├── c10-02-ALB-application-loadbalancer.tf      # ALB configuration
├── c10-03-ALB-application-loadbalancer-outputs.tf
├── app1-install.sh                             # Application installation script
├── terraform.tfvars                            # Main configuration values
├── vpc.auto.tfvars                             # VPC configuration values
└── ec2instance.auto.tfvars                     # EC2 configuration values
```

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AWS-ALB-Application-LoadBalancer-Basic/terraform-manifests
```

### 2. Create SSH Key Pair

```bash
# Create private-key directory
mkdir -p private-key

# Generate or copy your SSH key
# The key should be named terraform-key.pem
cp /path/to/your/key.pem private-key/terraform-key.pem
chmod 400 private-key/terraform-key.pem
```

### 3. Configure Variables

Edit `terraform.tfvars`:

```hcl
aws_region = "us-east-1"
environment = "stag"
business_divsion = "hr"
```

Edit `ec2instance.auto.tfvars`:

```hcl
instance_type = "t2.micro"
instance_keypair = "terraform-key"
private_instance_count = 2
```

### 4. Initialize Terraform

```bash
terraform init
```

### 5. Plan Deployment

```bash
terraform plan
```

### 6. Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted to confirm.

## Infrastructure Components

### VPC Configuration

- **CIDR Block**: 10.0.0.0/16
- **Availability Zones**: 2 (us-east-1a, us-east-1b)
- **Public Subnets**: 10.0.101.0/24, 10.0.102.0/24
- **Private Subnets**: 10.0.1.0/24, 10.0.2.0/24
- **Database Subnets**: 10.0.151.0/24, 10.0.152.0/24
- **NAT Gateway**: Single NAT Gateway for cost optimization

### Security Groups

**Bastion Host SG**:
- Inbound: SSH (22) from 0.0.0.0/0
- Outbound: All traffic

**Private Instances SG**:
- Inbound: SSH (22) and HTTP (80) from VPC CIDR
- Outbound: All traffic

**Load Balancer SG**:
- Inbound: HTTP (80) from 0.0.0.0/0, Port 81 from 0.0.0.0/0
- Outbound: All traffic

### Application Load Balancer

- **Type**: Application Load Balancer
- **Scheme**: Internet-facing
- **Listeners**: HTTP on port 80
- **Target Group**: HTTP:80 with health checks on `/app1/index.html`
- **Health Check Settings**:
  - Interval: 30 seconds
  - Timeout: 6 seconds
  - Healthy threshold: 3
  - Unhealthy threshold: 3

### EC2 Instances

- **AMI**: Latest Amazon Linux 2
- **Instance Type**: t2.micro (configurable)
- **Count**: 2 instances in private subnets
- **User Data**: Automatically installs and configures Apache web server
- **Application**: Sample web application on `/app1/index.html`

## Accessing the Infrastructure

### Access Application

After deployment, get the ALB DNS name:

```bash
terraform output
```

Access the application:
- Main page: `http://<alb-dns-name>/`
- App1: `http://<alb-dns-name>/app1/index.html`
- Metadata: `http://<alb-dns-name>/app1/metadata.html`

### SSH to Private Instances

1. SSH to bastion host:
```bash
ssh -i private-key/terraform-key.pem ec2-user@<bastion-eip>
```

2. From bastion, SSH to private instances:
```bash
ssh -i terraform-key.pem ec2-user@<private-instance-ip>
```

## Outputs

The following outputs are available after deployment:

- `vpc_id`: VPC identifier
- `public_subnets`: Public subnet IDs
- `private_subnets`: Private subnet IDs
- `ec2_bastion_public_ip`: Bastion host public IP
- `ec2_private_instance_ids`: Private instance IDs
- `ec2_private_ip`: Private instance IP addresses
- ALB DNS name and other ALB details

## Customization

### Change Region

Edit `terraform.tfvars`:
```hcl
aws_region = "us-west-2"
```

Update availability zones in `vpc.auto.tfvars`:
```hcl
vpc_availability_zones = ["us-west-2a", "us-west-2b"]
```

### Scale EC2 Instances

The configuration uses `for_each` to create instances. To change the count, modify the `for_each` parameter in `c7-04-ec2instance-private.tf`:

```hcl
for_each = toset(["0", "1", "2"])  # Creates 3 instances
```

### Change Instance Type

Edit `ec2instance.auto.tfvars`:
```hcl
instance_type = "t3.small"
```

## Cost Considerations

This infrastructure incurs costs for:
- EC2 instances (2x t2.micro)
- NAT Gateway
- Application Load Balancer
- Elastic IP
- Data transfer

**Cost Optimization**:
- Single NAT Gateway is used instead of one per AZ
- t2.micro instances for demo purposes
- Consider stopping/destroying when not in use

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

Type `yes` when prompted.

## Troubleshooting

### Connection Issues

1. Verify security group rules
2. Check NAT Gateway status
3. Ensure route tables are properly configured

### Health Check Failures

1. Verify application is running on private instances
2. Check health check path: `/app1/index.html`
3. Review target group settings
4. SSH to instance and verify Apache is running

### SSH Key Issues

Ensure the SSH key:
- Is in PEM format
- Has correct permissions (400)
- Matches the key pair in AWS

## Module Versions

- AWS Provider: 5.70.0
- VPC Module: 5.13.0
- EC2 Instance Module: 5.7.0
- Security Group Module: 5.2.0
- ALB Module: 9.11.0


---

**Note**: This is a demonstration infrastructure. For production use, consider:
- HTTPS/SSL certificates
- Multiple NAT Gateways for high availability
- Auto Scaling Groups
- CloudWatch monitoring and alarms
- Backup and disaster recovery strategies
- Enhanced security measures
