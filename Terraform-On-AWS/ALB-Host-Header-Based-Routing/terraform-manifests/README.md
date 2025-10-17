# AWS Application Load Balancer - Host Header-Based Routing 🚀

[![Terraform](https://img.shields.io/badge/Terraform-1.0+-623CE4?style=flat&logo=terraform)](https://www.terraform.io/)
[![AWS](https://img.shields.io/badge/AWS-Cloud-FF9900?style=flat&logo=amazon-aws)](https://aws.amazon.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> Production-ready Terraform infrastructure for AWS Application Load Balancer with intelligent host header-based routing across multiple applications.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

This project deploys a complete, scalable AWS infrastructure using Terraform that demonstrates advanced Application Load Balancer capabilities. The infrastructure routes traffic to different applications based on domain names (host headers), providing a clean separation of services while maintaining a unified entry point.

**Perfect for:**
- Multi-tenant applications
- Microservices architecture
- Blue-green deployments
- A/B testing scenarios
- Learning AWS networking and load balancing

## 🏗️ Architecture

```
Internet
    │
    ├─── Route53 DNS (rezaops.com)
    │       ├── app1.rezaops.com ──┐
    │       ├── app2.rezaops.com ──┤
    │       └── myapps.rezaops.com ┘
    │
    └─── Application Load Balancer (HTTPS:443)
            │
            ├─── Host: app1.rezaops.com ──► Target Group 1
            │                                   └── App1 Instances (Private Subnets)
            │                                       ├── EC2 Instance (AZ-1)
            │                                       └── EC2 Instance (AZ-2)
            │
            └─── Host: app2.rezaops.com ──► Target Group 2
                                                └── App2 Instances (Private Subnets)
                                                    ├── EC2 Instance (AZ-1)
                                                    └── EC2 Instance (AZ-2)
```

### Infrastructure Components

| Component | Description | Count |
|-----------|-------------|-------|
| **VPC** | Custom VPC with public/private subnets | 1 |
| **Availability Zones** | Multi-AZ deployment for high availability | 2 |
| **Public Subnets** | Hosts ALB and Bastion | 2 |
| **Private Subnets** | Hosts application EC2 instances | 2 |
| **NAT Gateway** | Enables private subnet internet access | 1 |
| **Application Load Balancer** | Layer 7 load balancer with host routing | 1 |
| **Target Groups** | One per application | 2 |
| **EC2 Instances** | App instances + Bastion host | 5 |
| **Security Groups** | Network access control | 3 |
| **ACM Certificate** | SSL/TLS certificate with auto-validation | 1 |
| **Route53 Records** | DNS A records with alias | 3 |

## ✨ Features

### 🔒 Security
- **Automatic HTTPS redirect** from HTTP (port 80 → 443)
- **TLS 1.3** encryption with AWS Certificate Manager
- **IMDSv2** for enhanced EC2 metadata security
- **Private subnet isolation** for application instances
- **Bastion host** for secure SSH access
- **Security group** isolation between layers

### ⚡ High Availability
- **Multi-AZ deployment** across 2 availability zones
- **Auto-scaling ready** architecture
- **Health checks** with automatic failover
- **Sticky sessions** for stateful applications
- **Connection draining** during instance deregistration

### 🎯 Intelligent Routing
- **Host header-based routing** to different applications
- **Weighted target groups** for traffic distribution
- **Custom error responses** for unmatched routes
- **Path-based health checks** per application

### 💰 Cost Optimized
- **Single NAT Gateway** deployment option
- **t2.micro instances** for development
- **On-demand resources** with no long-term commitment

## 📦 Prerequisites

Before you begin, ensure you have:

- [x] **AWS Account** with administrative access
- [x] **Terraform** >= 1.0 installed ([Download](https://www.terraform.io/downloads))
- [x] **AWS CLI** configured with credentials ([Guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html))
- [x] **Route53 Hosted Zone** for your domain (e.g., `rezaops.com`)
- [x] **EC2 Key Pair** created in AWS (named `terraform-key`)
- [x] **Private Key File** stored at `private-key/terraform-key.pem`

### Verify Installation

```bash
# Check Terraform version
terraform version

# Check AWS CLI configuration
aws sts get-caller-identity

# Verify Route53 hosted zone
aws route53 list-hosted-zones
```

## 🚀 Quick Start

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/AWS-Samples/ALB-Host-Header-Based-Routing.git
cd ALB-Host-Header-Based-Routing/terraform-manifests
```

### 2️⃣ Initialize Terraform

```bash
terraform init
```

### 3️⃣ Customize Configuration

Edit the `.tfvars` files to match your requirements:

```bash
# Update with your domain name
vim loadbalancer.auto.tfvars

# Update with your environment
vim terraform.tfvars

# Update VPC CIDR if needed
vim vpc.auto.tfvars
```

### 4️⃣ Review the Plan

```bash
terraform plan
```

### 5️⃣ Deploy Infrastructure

```bash
terraform apply -auto-approve
```

⏱️ **Deployment time:** Approximately 10-15 minutes

### 6️⃣ Access Your Applications

```bash
# Get the ALB DNS name
terraform output

# Access applications (after DNS propagation)
curl https://app1.rezaops.com
curl https://app2.rezaops.com
```

## ⚙️ Configuration

### Environment Variables

**`terraform.tfvars`** - Generic configuration
```hcl
aws_region       = "us-east-1"    # AWS region
environment      = "stag"          # Environment name
business_divsion = "hr"            # Business division tag
```

**`loadbalancer.auto.tfvars`** - Domain configuration
```hcl
app1_dns_name = "app1.rezaops.com"  # App1 domain
app2_dns_name = "app2.rezaops.com"  # App2 domain
```

**`vpc.auto.tfvars`** - Network configuration
```hcl
vpc_name               = "myvpc"
vpc_cidr_block         = "10.0.0.0/16"
vpc_availability_zones = ["us-east-1a", "us-east-1b"]
vpc_public_subnets     = ["10.0.101.0/24", "10.0.102.0/24"]
vpc_private_subnets    = ["10.0.1.0/24", "10.0.2.0/24"]
```

**`ec2instance.auto.tfvars`** - Instance configuration
```hcl
instance_type          = "t2.micro"        # Instance size
instance_keypair       = "terraform-key"    # SSH key name
private_instance_count = 2                  # Instances per app
```

### Security Groups

| Group | Inbound Rules | Purpose |
|-------|---------------|---------|
| **Bastion SG** | SSH (22) from 0.0.0.0/0 | Public SSH access |
| **Private SG** | SSH (22), HTTP (80) from VPC CIDR | Private instance access |
| **ALB SG** | HTTP (80), HTTPS (443) from 0.0.0.0/0 | Public web access |

## 📝 Deployment

### Step-by-Step Deployment

<details>
<summary><b>1. Infrastructure Provisioning</b></summary>

```bash
cd terraform-manifests
terraform init
terraform validate
terraform plan -out=tfplan
terraform apply tfplan
```
</details>

<details>
<summary><b>2. DNS Propagation</b></summary>

Wait for DNS records to propagate (may take 5-60 minutes):

```bash
# Check DNS resolution
nslookup app1.rezaops.com
nslookup app2.rezaops.com

# Or use dig
dig app1.rezaops.com
```
</details>

<details>
<summary><b>3. Certificate Validation</b></summary>

ACM certificate validation is automatic via DNS. Monitor status:

```bash
aws acm describe-certificate --certificate-arn <CERT_ARN>
```
</details>

<details>
<summary><b>4. Health Check Verification</b></summary>

Check target health in AWS Console or CLI:

```bash
aws elbv2 describe-target-health --target-group-arn <TG_ARN>
```
</details>

### Terraform Outputs

After successful deployment:

```bash
terraform output
```

**Key outputs:**
- `ec2_bastion_public_ip` - Bastion host public IP
- `vpc_id` - VPC identifier
- `acm_certificate_arn` - SSL certificate ARN
- `ec2_private_ip_app1` - App1 instance private IPs
- `ec2_private_ip_app2` - App2 instance private IPs

## 🎮 Usage

### Accessing Applications

**Via Browser:**
- App1: `https://app1.rezaops.com`
- App2: `https://app2.rezaops.com`
- Default: `https://myapps.rezaops.com` (returns fixed response)

**Via cURL:**
```bash
# Access App1
curl -k https://app1.rezaops.com

# Access App2
curl -k https://app2.rezaops.com

# View instance metadata
curl -k https://app1.rezaops.com/app1/metadata.html
```

### SSH Access

**Connect to Bastion Host:**
```bash
ssh -i private-key/terraform-key.pem ec2-user@<BASTION_PUBLIC_IP>
```

**From Bastion to Private Instances:**
```bash
# The key is already copied to bastion via provisioner
ssh -i ~/terraform-key.pem ec2-user@<PRIVATE_INSTANCE_IP>
```

### Application Details

#### 🔴 App1
- **URL:** https://app1.rezaops.com
- **Theme:** Light Red Background
- **Version:** V1
- **Health Check:** `/app1/index.html`
- **Metadata:** `/app1/metadata.html`

#### 🔵 App2
- **URL:** https://app2.rezaops.com
- **Theme:** Turquoise Background
- **Version:** V1
- **Health Check:** `/app2/index.html`
- **Metadata:** `/app2/metadata.html`

## 📁 Project Structure

```
terraform-manifests/
│
├── 📄 app1-install.sh                              # App1 bootstrap script
├── 📄 app2-install.sh                              # App2 bootstrap script
│
├── 🔧 c1-versions.tf                               # Provider versions
├── 🔧 c2-generic-variables.tf                      # Global variables
├── 🔧 c3-local-values.tf                           # Local values & tags
│
├── 🌐 c4-01-vpc-variables.tf                       # VPC variables
├── 🌐 c4-02-vpc-module.tf                          # VPC module config
├── 🌐 c4-03-vpc-outputs.tf                         # VPC outputs
│
├── 🔒 c5-01-securitygroup-variables.tf             # SG variables
├── 🔒 c5-02-securitygroup-outputs.tf               # SG outputs
├── 🔒 c5-03-securitygroup-bastionsg.tf             # Bastion security group
├── 🔒 c5-04-securitygroup-privatesg.tf             # Private SG
├── 🔒 c5-05-securitygroup-loadbalancersg.tf        # ALB security group
│
├── 📊 c6-01-datasource-ami.tf                      # AMI data source
├── 📊 c6-02-datasource-route53-zone.tf             # Route53 data source
│
├── 💻 c7-01-ec2instance-variables.tf               # EC2 variables
├── 💻 c7-02-ec2instance-outputs.tf                 # EC2 outputs
├── 💻 c7-03-ec2instance-bastion.tf                 # Bastion instance
├── 💻 c7-04-ec2instance-private_app1.tf            # App1 instances
├── 💻 c7-04-ec2instance-private_app2.tf            # App2 instances
│
├── 🌍 c8-elasticip.tf                              # Elastic IP
├── 🔄 c9-nullresource-provisioners.tf              # Provisioners
│
├── ⚖️ c10-01-ALB-application-loadbalancer-variables.tf  # ALB variables
├── ⚖️ c10-02-ALB-application-loadbalancer.tf            # ALB config
├── ⚖️ c10-03-ALB-application-loadbalancer-outputs.tf    # ALB outputs
│
├── 🔐 c11-acm-certificatemanager.tf                # SSL certificate
├── 🌐 c12-route53-dnsregistration.tf               # DNS records
│
├── 📋 terraform.tfvars                             # Generic values
├── 📋 vpc.auto.tfvars                              # VPC values
├── 📋 ec2instance.auto.tfvars                      # EC2 values
└── 📋 loadbalancer.auto.tfvars                     # ALB values
```

## 🐛 Troubleshooting

### Common Issues

<details>
<summary><b>❌ Health Checks Failing</b></summary>

**Symptoms:** Target instances showing unhealthy in ALB console

**Solutions:**
```bash
# 1. Check security group rules
aws ec2 describe-security-groups --group-ids <SG_ID>

# 2. Verify Apache is running on instances
ssh to instance
sudo systemctl status httpd

# 3. Test health check path locally
curl http://localhost/app1/index.html

# 4. Check ALB security group allows access to instances
# Ensure Private SG allows HTTP from ALB SG
```
</details>

<details>
<summary><b>❌ DNS Not Resolving</b></summary>

**Symptoms:** Cannot access applications via domain name

**Solutions:**
```bash
# 1. Verify Route53 records exist
aws route53 list-resource-record-sets --hosted-zone-id <ZONE_ID>

# 2. Check DNS propagation
dig app1.rezaops.com

# 3. Verify ALB is healthy
aws elbv2 describe-load-balancers

# 4. Clear DNS cache
# macOS: sudo dscacheutil -flushcache
# Windows: ipconfig /flushdns
# Linux: sudo systemd-resolve --flush-caches
```
</details>

<details>
<summary><b>❌ Certificate Validation Stuck</b></summary>

**Symptoms:** ACM certificate shows "Pending validation"

**Solutions:**
```bash
# 1. Check CNAME records were created
aws route53 list-resource-record-sets --hosted-zone-id <ZONE_ID>

# 2. Verify hosted zone is correct
terraform output mydomain_name

# 3. Wait longer (can take up to 30 minutes)

# 4. Check ACM certificate status
aws acm describe-certificate --certificate-arn <CERT_ARN>
```
</details>

<details>
<summary><b>❌ SSH Connection Refused</b></summary>

**Symptoms:** Cannot connect to bastion or private instances

**Solutions:**
```bash
# 1. Verify security group allows your IP
aws ec2 describe-security-groups --group-ids <BASTION_SG_ID>

# 2. Check key permissions
chmod 400 private-key/terraform-key.pem

# 3. Verify correct username
# Amazon Linux 2: ec2-user
# Ubuntu: ubuntu

# 4. Test with verbose output
ssh -v -i private-key/terraform-key.pem ec2-user@<IP>
```
</details>

<details>
<summary><b>⚠️ Known Bug in app2-install.sh</b></summary>

**Issue:** Line 13 in `app2-install.sh` saves metadata to wrong path

**Current (incorrect):**
```bash
sudo curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/dynamic/instance-identity/document -o /var/www/html/app1/metadata.html
```

**Should be:**
```bash
sudo curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/dynamic/instance-identity/document -o /var/www/html/app2/metadata.html
```

**Fix:** Update the path from `app1` to `app2` before deployment.
</details>

### Debug Commands

```bash
# View Terraform state
terraform show

# Check specific resource
terraform state show module.vpc.aws_vpc.this[0]

# View logs
terraform apply -debug

# Refresh state
terraform refresh

# Validate configuration
terraform validate
```

## 💰 Cost Estimation

**Estimated monthly cost (us-east-1):**

| Resource | Quantity | Monthly Cost (USD) |
|----------|----------|-------------------|
| EC2 t2.micro | 5 | ~$42.00 |
| Application Load Balancer | 1 | ~$22.50 |
| NAT Gateway | 1 | ~$32.00 |
| Elastic IPs | 2 | ~$7.20 |
| Data Transfer | Variable | ~$10-50 |
| **Total** | | **~$113.70 - $153.70** |

💡 **Cost Optimization Tips:**
- Use `terraform destroy` when not in use
- Consider Reserved Instances for production
- Use Auto Scaling to match demand
- Enable S3 VPC endpoints to reduce NAT costs
- Use AWS Cost Explorer for detailed analysis

## 🧹 Cleanup

### Destroy Infrastructure

```bash
# Preview what will be destroyed
terraform plan -destroy

# Destroy all resources
terraform destroy

# Auto-approve (use with caution)
terraform destroy -auto-approve
```

⚠️ **Warning:** This will permanently delete all resources. Ensure you have backups if needed.

### Manual Cleanup (if needed)

If Terraform destroy fails:

1. Delete ALB target group attachments manually
2. Wait for instances to deregister
3. Delete ALB and target groups
4. Run `terraform destroy` again

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow Terraform best practices
- Use meaningful variable names
- Add comments for complex logic
- Update documentation for changes
- Test changes before submitting PR

## 📚 Additional Resources

- [AWS Application Load Balancer Documentation](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)

</div>
