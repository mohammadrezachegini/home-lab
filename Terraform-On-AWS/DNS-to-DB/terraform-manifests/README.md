# AWS DNS-to-DB Infrastructure with Terraform

A production-ready AWS infrastructure deployment using Terraform that provisions a complete three-tier web application architecture with Application Load Balancer, multiple EC2 instances, and RDS MySQL database.

## Architecture Overview

This infrastructure creates a highly available, scalable AWS environment with:

- **Network Layer**: Custom VPC with public, private, and database subnets across multiple availability zones
- **Application Layer**: Three separate applications (App1, App2, App3) running on EC2 instances in private subnets
- **Database Layer**: Multi-AZ RDS MySQL database
- **Load Balancing**: Application Load Balancer with SSL/TLS termination
- **DNS**: Route53 integration with custom domain
- **Security**: Layered security groups for bastion host, applications, load balancer, and database

## Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) >= 1.0
- AWS CLI configured with appropriate credentials
- AWS Account with necessary permissions
- Route53 hosted zone (domain: `rezaops.com` - update to your domain)
- EC2 Key Pair named `terraform-key` (or update in variables)

## Architecture Components

### VPC Configuration
- **CIDR Block**: 10.0.0.0/16
- **Availability Zones**: us-east-1a, us-east-1b
- **Public Subnets**: 10.0.101.0/24, 10.0.102.0/24
- **Private Subnets**: 10.0.1.0/24, 10.0.2.0/24
- **Database Subnets**: 10.0.151.0/24, 10.0.152.0/24
- **NAT Gateway**: Single NAT Gateway for cost optimization

### EC2 Instances
- **Bastion Host**: Public subnet with Elastic IP
- **App1 Instances**: 2x t2.micro in private subnets (HTTP on port 80)
- **App2 Instances**: 2x t2.micro in private subnets (HTTP on port 80)
- **App3 Instances**: 2x t2.micro in private subnets (Java app on port 8080)

### Application Load Balancer
- **HTTP → HTTPS Redirect**: Port 80 redirects to 443
- **SSL/TLS**: AWS Certificate Manager integration
- **Path-Based Routing**:
  - `/app1/*` → App1 target group
  - `/app2/*` → App2 target group
  - `/*` → App3 target group (default)

### RDS MySQL Database
- **Engine**: MySQL 8.0.35
- **Instance Class**: db.t3.large
- **Multi-AZ**: Enabled for high availability
- **Storage**: 20GB (auto-scaling up to 100GB)
- **Backup Retention**: 0 days (modify for production)
- **Performance Insights**: Enabled

## Project Structure

```
terraform-manifests/
├── c1-versions.tf                              # Provider configuration
├── c2-generic-variables.tf                     # Generic variables (region, environment)
├── c3-local-values.tf                          # Local values and tags
├── c4-01-vpc-variables.tf                      # VPC variables
├── c4-02-vpc-module.tf                         # VPC module configuration
├── c4-03-vpc-outputs.tf                        # VPC outputs
├── c5-01-securitygroup-variables.tf            # Security group variables
├── c5-02-securitygroup-outputs.tf              # Security group outputs
├── c5-03-securitygroup-bastionsg.tf            # Bastion security group
├── c5-04-securitygroup-privatesg.tf            # Private instances security group
├── c5-05-securitygroup-loadbalancersg.tf       # Load balancer security group
├── c5-06-securitygroup-rdsdbsg.tf              # RDS security group
├── c6-01-datasource-ami.tf                     # AMI data source
├── c6-02-datasource-route53-zone.tf            # Route53 data source
├── c7-01-ec2instance-variables.tf              # EC2 variables
├── c7-02-ec2instance-outputs.tf                # EC2 outputs
├── c7-03-ec2instance-bastion.tf                # Bastion host
├── c7-04-ec2instance-private_app1.tf           # App1 instances
├── c7-05-ec2instance-private_app2.tf           # App2 instances
├── c7-06-ec2instance-private-app3.tf           # App3 instances
├── c8-elasticip.tf                             # Elastic IP for bastion
├── c9-nullresource-provisioners.tf             # Provisioners
├── c10-01-ALB-application-loadbalancer-variables.tf  # ALB variables
├── c10-02-ALB-application-loadbalancer.tf      # ALB configuration
├── c10-03-ALB-application-loadbalancer-outputs.tf    # ALB outputs
├── c11-acm-certificatemanager.tf               # ACM certificate
├── c12-route53-dnsregistration.tf              # DNS registration
├── c13-01-rdsdb-variables.tf                   # RDS variables
├── c13-02-rdsdb.tf                             # RDS configuration
├── c13-03-rdsdb-outputs.tf                     # RDS outputs
├── app1-install.sh                             # App1 installation script
├── app2-install.sh                             # App2 installation script
├── app3-ums-install.tmpl                       # App3 installation template
├── jumpbox-install.sh                          # Bastion installation script
├── terraform.tfvars                            # Main variables
├── vpc.auto.tfvars                             # VPC auto variables
├── ec2instance.auto.tfvars                     # EC2 auto variables
├── loadbalancer.auto.tfvars                    # Load balancer auto variables
├── rdsdb.auto.tfvars                           # RDS auto variables
└── secrets.tfvars                              # Sensitive variables (not in git)
```

## Installation & Deployment

### 1. Clone the Repository

```bash
git clone <repository-url>
cd DNS-to-DB/terraform-manifests
```

### 2. Configure Variables

Update the following files with your specific values:

**terraform.tfvars**:
```hcl
aws_region = "us-east-1"
environment = "stag"
business_divsion = "hr"
```

**vpc.auto.tfvars**: Configure VPC settings
**ec2instance.auto.tfvars**: Configure instance settings
**loadbalancer.auto.tfvars**: Configure DNS names
**rdsdb.auto.tfvars**: Configure database settings
**secrets.tfvars**: Set database password (keep secure!)

### 3. Update Domain Name

Replace `rezaops.com` with your domain in:
- `c6-02-datasource-route53-zone.tf`
- `c11-acm-certificatemanager.tf`
- `c12-route53-dnsregistration.tf`
- `loadbalancer.auto.tfvars`

### 4. Create Private Key Directory

```bash
mkdir -p private-key
# Place your terraform-key.pem in this directory
chmod 400 private-key/terraform-key.pem
```

### 5. Initialize Terraform

```bash
terraform init
```

### 6. Plan Deployment

```bash
terraform plan -var-file="secrets.tfvars"
```

### 7. Apply Configuration

```bash
terraform apply -var-file="secrets.tfvars" -auto-approve
```

## Post-Deployment

### Access Applications

After successful deployment:

- **App1**: `https://dns-to-db.rezaops.com/app1/`
- **App2**: `https://dns-to-db.rezaops.com/app2/`
- **App3**: `https://dns-to-db.rezaops.com/` (User Management System)

### Connect to Bastion Host

```bash
ssh -i private-key/terraform-key.pem ec2-user@<bastion-public-ip>
```

### Connect to Private Instances

From bastion host:
```bash
ssh -i terraform-key.pem ec2-user@<private-instance-ip>
```

### Access RDS Database

From bastion host:
```bash
mysql -h <rds-endpoint> -u dbadmin -p
# Password: dbpassword11 (from secrets.tfvars)
```

## Applications

### App1 (Static Web App)
- Simple HTML page with pink background
- Displays instance metadata
- Health check: `/app1/index.html`

### App2 (Static Web App)
- Simple HTML page with teal background
- Displays instance metadata
- Health check: `/app2/index.html`

### App3 (User Management System)
- Java Spring Boot application
- Connects to RDS MySQL database
- Runs on port 8080
- Health check: `/login`

## Security Configuration

### Security Groups

1. **Bastion SG**: SSH (22) from 0.0.0.0/0
2. **Private SG**: SSH (22), HTTP (80), HTTP (8080) from VPC CIDR
3. **Load Balancer SG**: HTTP (80), HTTPS (443), Port 81 from 0.0.0.0/0
4. **RDS SG**: MySQL (3306) from VPC CIDR

### SSL/TLS

- ACM certificate with DNS validation
- Wildcard certificate for `*.rezaops.com`
- TLS 1.3 security policy

## Monitoring & Logging

- **RDS Performance Insights**: 7-day retention
- **RDS CloudWatch Logs**: General logs enabled
- **Enhanced Monitoring**: 60-second interval

## Cost Optimization

- Single NAT Gateway (instead of per-AZ)
- t2.micro instances (adjust for production)
- RDS backup retention set to 0 (increase for production)
- Deletion protection disabled (enable for production)

## Production Considerations

Before using in production:

1. **Enable Deletion Protection**: Set `deletion_protection = true` for ALB and RDS
2. **Increase Backup Retention**: Set `backup_retention_period = 7` or higher
3. **Multi-NAT Gateway**: Use `vpc_single_nat_gateway = false` for high availability
4. **Instance Sizing**: Adjust instance types based on workload
5. **Monitoring**: Enable comprehensive CloudWatch monitoring
6. **Secrets Management**: Use AWS Secrets Manager instead of tfvars files
7. **State Backend**: Configure remote state backend (S3 + DynamoDB)
8. **Auto Scaling**: Add Auto Scaling Groups for dynamic capacity

## Cleanup

To destroy all resources:

```bash
terraform destroy -var-file="secrets.tfvars" -auto-approve
```

**Warning**: This will permanently delete all resources including the RDS database.

## Troubleshooting

### Issue: ACM Certificate Validation Timeout
- Ensure Route53 hosted zone is properly configured
- Check DNS propagation: `nslookup dns-to-db.rezaops.com`

### Issue: Instances Can't Connect to RDS
- Verify security group rules allow port 3306 from private subnets
- Check RDS endpoint in App3 user data template

### Issue: Health Checks Failing
- Verify application installation scripts completed successfully
- Check instance logs: `/var/log/cloud-init-output.log`

### Issue: SSH Connection Refused
- Ensure private key has correct permissions (400)
- Verify security group allows SSH from your IP

## Module Versions

- **VPC Module**: 5.13.0
- **EC2 Module**: 5.7.0
- **ALB Module**: 9.11.0
- **RDS Module**: 6.9.0
- **Security Group Module**: 5.2.0
- **ACM Module**: 5.1.0
- **AWS Provider**: 5.70.0
