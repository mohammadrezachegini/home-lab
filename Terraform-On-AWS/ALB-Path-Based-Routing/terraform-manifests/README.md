# AWS Application Load Balancer (ALB) with Path-Based Routing

This Terraform project demonstrates how to set up an AWS Application Load Balancer with path-based routing to distribute traffic to different application backends based on URL paths.

## Architecture Overview

This infrastructure deploys:

- **VPC** with public and private subnets across 2 availability zones
- **Application Load Balancer (ALB)** in public subnets with HTTPS/HTTP listeners
- **Two application tiers** (App1 and App2) running on EC2 instances in private subnets
- **Bastion Host** for SSH access to private instances
- **Route 53** DNS record for custom domain routing
- **ACM Certificate** for HTTPS with automatic DNS validation
- **Path-based routing rules**:
  - `/app1*` routes to App1 target group
  - `/app2*` routes to App2 target group
  - Root path returns a fixed response

## Prerequisites

- AWS Account with appropriate permissions
- Terraform installed (compatible with version using AWS provider 5.70.0)
- AWS CLI configured with credentials
- A Route 53 hosted zone for domain `rezaops.com` (update to your domain)
- EC2 Key Pair named `terraform-key` (or update the variable)

## Project Structure

```
terraform-manifests/
├── c1-versions.tf                              # Provider configuration
├── c2-generic-variables.tf                     # Generic input variables
├── c3-local-values.tf                          # Local values and tags
├── c4-01-vpc-variables.tf                      # VPC variables
├── c4-02-vpc-module.tf                         # VPC module configuration
├── c4-03-vpc-outputs.tf                        # VPC outputs
├── c5-03-securitygroup-bastionsg.tf           # Bastion security group
├── c5-04-securitygroup-privatesg.tf           # Private instance security group
├── c5-05-securitygroup-loadbalancersg.tf      # Load balancer security group
├── c6-01-datasource-ami.tf                     # AMI data source
├── c6-02-datasource-route53-zone.tf           # Route53 zone data source
├── c7-01-ec2instance-variables.tf             # EC2 variables
├── c7-03-ec2instance-bastion.tf               # Bastion host configuration
├── c7-04-ec2instance-private_app1.tf          # App1 EC2 instances
├── c7-04-ec2instance-private_app2.tf          # App2 EC2 instances
├── c8-elasticip.tf                             # Elastic IP for bastion
├── c9-nullresource-provisioners.tf            # Provisioners for bastion setup
├── c10-02-ALB-application-loadbalancer.tf     # ALB configuration
├── c11-acm-certificatemanager.tf              # ACM certificate
├── c12-route53-dnsregistration.tf             # Route53 DNS record
├── app1-install.sh                             # App1 installation script
├── app2-install.sh                             # App2 installation script
├── terraform.tfvars                            # Main variable values
├── vpc.auto.tfvars                             # VPC variable values
└── ec2instance.auto.tfvars                     # EC2 variable values
```

## Configuration

### 1. Update Domain Name

Replace `rezaops.com` with your domain in the following files:
- `c6-02-datasource-route53-zone.tf`
- `c11-acm-certificatemanager.tf`
- `c12-route53-dnsregistration.tf`

### 2. Update Variables

Edit `terraform.tfvars`:
```hcl
aws_region = "us-east-1"
environment = "stag"
business_divsion = "hr"
```

Edit `vpc.auto.tfvars` to customize VPC settings:
```hcl
vpc_name = "myvpc"
vpc_cidr_block = "10.0.0.0/16"
vpc_availability_zones = ["us-east-1a", "us-east-1b"]
```

Edit `ec2instance.auto.tfvars`:
```hcl
instance_type = "t2.micro"
instance_keypair = "terraform-key"
private_instance_count = 2
```

### 3. Add SSH Key

Place your private key file at:
```
private-key/terraform-key.pem
```

## Deployment Steps

### Initialize Terraform
```bash
cd terraform-manifests
terraform init
```

### Validate Configuration
```bash
terraform validate
```

### Plan Infrastructure
```bash
terraform plan
```

### Apply Infrastructure
```bash
terraform apply -auto-approve
```

### Destroy Infrastructure
```bash
terraform destroy -auto-approve
```

## Application Details

### App1
- **Path**: `/app1/*`
- **Color Theme**: Pink background (RGB: 250, 210, 210)
- **Instances**: 2 (deployed across 2 AZs)
- **Health Check**: `/app1/index.html`

### App2
- **Path**: `/app2/*`
- **Color Theme**: Cyan background (RGB: 15, 232, 192)
- **Instances**: 2 (deployed across 2 AZs)
- **Health Check**: `/app2/index.html`

## Load Balancer Configuration

### Listeners

**HTTP Listener (Port 80)**
- Redirects all traffic to HTTPS (Port 443) with HTTP 301 status

**HTTPS Listener (Port 443)**
- SSL Policy: `ELBSecurityPolicy-TLS13-1-2-Res-2021-06`
- Certificate: Auto-validated via Route53 DNS
- Root path: Returns fixed static message
- Path-based routing:
  - `/app1*` → App1 Target Group
  - `/app2*` → App2 Target Group

### Target Groups

Both target groups configured with:
- Protocol: HTTP
- Port: 80
- Deregistration delay: 10 seconds
- Health check interval: 30 seconds
- Sticky sessions: Enabled (3600 seconds)

## Access Your Applications

After deployment, access your applications at:

- **App1**: `https://apps.rezaops.com/app1/`
- **App2**: `https://apps.rezaops.com/app2/`
- **Root**: `https://apps.rezaops.com/` (returns fixed response)

## Security Groups

### Bastion Host Security Group
- **Inbound**: SSH (22) from 0.0.0.0/0
- **Outbound**: All traffic

### Private Instance Security Group
- **Inbound**: SSH (22) and HTTP (80) from VPC CIDR
- **Outbound**: All traffic

### Load Balancer Security Group
- **Inbound**: HTTP (80), HTTPS (443), Port 81 from 0.0.0.0/0
- **Outbound**: All traffic

## Key Features

- **High Availability**: Resources deployed across 2 availability zones
- **Auto-Scaling Ready**: Target groups configured for easy ASG integration
- **Secure**: HTTPS with ACM certificate, private subnets for applications
- **Path-Based Routing**: Intelligent traffic distribution based on URL paths
- **Session Persistence**: Sticky sessions enabled for consistent user experience
- **Health Checks**: Automated health monitoring for both applications
- **DNS Integration**: Custom domain with Route 53

## Outputs

After successful deployment, Terraform will output:
- VPC ID and CIDR block
- Public and private subnet IDs
- NAT Gateway public IPs
- Bastion host public IP
- Private instance IDs and IPs for both apps
- ACM certificate ARN
- Route53 zone ID and name

## Cost Considerations

This infrastructure incurs costs for:
- EC2 instances (Bastion + 4 private instances)
- Application Load Balancer
- NAT Gateway (data processing charges)
- Elastic IP addresses
- Data transfer

To minimize costs:
- Use `t2.micro` instances (Free Tier eligible)
- Set `vpc_single_nat_gateway = true` (already configured)
- Destroy resources when not in use

## Troubleshooting

### ACM Certificate Validation
If certificate validation fails:
1. Verify Route53 hosted zone exists
2. Check DNS propagation
3. Ensure `wait_for_validation = true` in ACM module

### Application Not Accessible
1. Check security group rules
2. Verify target group health checks are passing
3. Ensure instances have internet access via NAT Gateway
4. Check ALB listener rules

### SSH Access Issues
1. Verify key pair name matches
2. Check bastion security group allows SSH
3. Ensure Elastic IP is associated
