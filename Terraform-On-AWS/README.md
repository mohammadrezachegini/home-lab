# AWS Terraform Infrastructure Samples

[![Terraform](https://img.shields.io/badge/Terraform-1.0+-623CE4?style=flat&logo=terraform)](https://www.terraform.io/)
[![AWS](https://img.shields.io/badge/AWS-Cloud-FF9900?style=flat&logo=amazon-aws)](https://aws.amazon.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> Production-ready Terraform configurations for deploying scalable, highly available AWS infrastructure. From VPCs to full-stack applications with load balancers, auto-scaling, databases, and DevOps pipelines.

## 📋 Overview

This repository contains a comprehensive collection of AWS infrastructure samples built with Terraform. Each sample demonstrates best practices for deploying production-grade infrastructure on AWS, including networking, compute, storage, databases, load balancing, auto-scaling, monitoring, and CI/CD pipelines.

## 🎯 Who Is This For?

- **DevOps Engineers** learning Infrastructure as Code
- **Cloud Architects** designing AWS solutions
- **Developers** deploying applications on AWS
- **Teams** implementing production infrastructure
- **Students** learning AWS and Terraform

## 🏗️ Repository Structure

```
AWS-Samples/
├── AWS-VPC/                                    # VPC networking fundamentals
├── AWS-EC2Instance-and-SecurityGroups/         # EC2 and security configurations
├── AWS-ALB-Application-LoadBalancer-Basic/     # Basic ALB setup
├── ALB-Path-Based-Routing/                     # Advanced ALB routing
├── ALB-Host-Header-Based-Routing/              # Host header routing
├── ALB-HTTPHeader-QueryString-Redirects/       # Complex routing rules
├── AWS-NLB-Network-Load-Balancer/              # Network Load Balancer
├── Autoscaling-with-Launch-Templates/          # Auto Scaling Groups
├── AWS-CloudWatch/                             # Monitoring and alerting
├── DNS-to-DB/                                  # Full-stack with RDS
├── IaC-DevOps-using-AWS-CodePipeline/          # CI/CD automation
└── Develop-Terraform-Module-from-scratch/      # Custom module development
```

## 🚀 Quick Start

### Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) >= 1.0
- [AWS CLI](https://aws.amazon.com/cli/) configured with credentials
- AWS account with appropriate permissions
- SSH key pair for EC2 access

### Basic Usage

```bash
# Clone the repository
git clone https://github.com/yourusername/AWS-Samples.git
cd AWS-Samples

# Navigate to a sample
cd AWS-VPC/vpc-module-standardized

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Deploy infrastructure
terraform apply

# Destroy when done
terraform destroy
```

## 📚 Samples Catalog

### 1. AWS VPC - Network Foundation
**Path:** `AWS-VPC/`

Create production-ready VPCs with public, private, and database subnets across multiple availability zones.

**Features:**
- Multi-AZ deployment
- NAT Gateway for private subnets
- Database subnet groups
- DNS support enabled

**Use Case:** Foundation for any AWS infrastructure

---

### 2. EC2 Instances with Security Groups
**Path:** `AWS-EC2Instance-and-SecurityGroups/`

Deploy EC2 instances with bastion hosts and layered security groups.

**Features:**
- Bastion host in public subnet
- Private application instances
- Security group best practices
- Elastic IP management

**Use Case:** Secure EC2 deployment patterns

---

### 3. Application Load Balancer (Basic)
**Path:** `AWS-ALB-Application-LoadBalancer-Basic/`

Set up internet-facing Application Load Balancer with target groups.

**Features:**
- HTTP listener configuration
- Target group health checks
- Multi-AZ distribution
- Auto Scaling integration

**Use Case:** Simple web application load balancing

---

### 4. ALB Path-Based Routing
**Path:** `ALB-Path-Based-Routing/`

Route traffic to different backends based on URL paths.

**Features:**
- `/app1/*` → Application 1
- `/app2/*` → Application 2
- SSL/TLS termination
- Route53 DNS integration

**Use Case:** Microservices architecture

---

### 5. ALB Host Header Routing
**Path:** `ALB-Host-Header-Based-Routing/`

Route traffic based on domain names (virtual hosting).

**Features:**
- `app1.domain.com` → App1 instances
- `app2.domain.com` → App2 instances
- ACM certificate management
- Multi-application hosting

**Use Case:** Multi-tenant applications

---

### 6. ALB Advanced Routing
**Path:** `ALB-HTTPHeader-QueryString-Redirects/`

Complex routing with HTTP headers, query strings, and redirects.

**Features:**
- Custom HTTP header routing
- Query string redirects
- Host header redirects
- HTTP to HTTPS redirect

**Use Case:** Advanced traffic management

---

### 7. Network Load Balancer
**Path:** `AWS-NLB-Network-Load-Balancer/`

Deploy high-performance Layer 4 load balancer.

**Features:**
- TCP/TLS listeners
- Ultra-low latency
- Static IP addresses
- Auto Scaling support

**Use Case:** TCP-based applications, gaming, IoT

---

### 8. Auto Scaling with Launch Templates
**Path:** `Autoscaling-with-Launch-Templates/`

Implement dynamic auto-scaling for applications.

**Features:**
- CPU-based scaling
- Request-based scaling
- Scheduled scaling actions
- SNS notifications

**Use Case:** Dynamically scalable applications

---

### 9. CloudWatch Monitoring
**Path:** `AWS-CloudWatch/`

Comprehensive monitoring and alerting setup.

**Features:**
- CloudWatch alarms
- CIS compliance monitoring
- Synthetics canaries
- SNS notifications

**Use Case:** Production monitoring and alerting

---

### 10. DNS to Database (Full Stack)
**Path:** `DNS-to-DB/`

Complete three-tier application with database.

**Features:**
- Multi-AZ RDS MySQL
- Three separate applications
- ALB with path routing
- Database connectivity

**Use Case:** Full-stack web applications

---

### 11. IaC DevOps Pipeline
**Path:** `IaC-DevOps-using-AWS-CodePipeline/`

Automated infrastructure deployment with CI/CD.

**Features:**
- AWS CodePipeline integration
- Multi-environment support
- Remote state management
- Automated testing

**Use Case:** Production DevOps workflows

---

### 12. Custom Terraform Module
**Path:** `Develop-Terraform-Module-from-scratch/`

Learn to build reusable Terraform modules.

**Features:**
- S3 static website hosting
- Module structure best practices
- Input/output variables
- Module reusability

**Use Case:** Creating custom infrastructure modules

## 🔧 Common Configuration

Most samples use similar configuration patterns:

### Variables Structure
```
terraform.tfvars       # Global variables
vpc.auto.tfvars       # VPC-specific variables
ec2instance.auto.tfvars # EC2-specific variables
```

### Typical Variables
```hcl
aws_region = "us-east-1"
environment = "dev"
business_division = "hr"
vpc_cidr_block = "10.0.0.0/16"
instance_type = "t2.micro"
instance_keypair = "terraform-key"
```

## 🔐 Security Best Practices

Each sample implements security best practices:

- ✅ Private subnets for application instances
- ✅ Bastion hosts for SSH access
- ✅ Security groups with least privilege
- ✅ SSL/TLS certificates for HTTPS
- ✅ Encrypted data at rest
- ✅ VPC Flow Logs enabled
- ✅ IAM roles for EC2 instances

## 💰 Cost Optimization

Tips for managing AWS costs:

- Use `t2.micro` instances (free tier eligible)
- Enable `single_nat_gateway = true`
- Destroy resources when not in use
- Use scheduled auto-scaling
- Monitor with AWS Cost Explorer
- Set up billing alarms

## 📖 Documentation

Each sample includes:

- **README.md** - Comprehensive guide
- **Architecture diagrams** - Visual representation
- **Configuration examples** - Sample tfvars
- **Troubleshooting guide** - Common issues
- **Cost estimates** - Expected monthly costs

## 🛠️ Module Versions

This repository uses official Terraform AWS modules:

| Module | Version | Purpose |
|--------|---------|---------|
| VPC | 5.13.0 | Network infrastructure |
| ALB | 9.11.0 | Application load balancing |
| EC2 | 5.7.0 | Compute instances |
| Security Group | 5.2.0 | Network security |
| ACM | 5.1.0 | SSL certificates |
| RDS | 6.9.0 | Managed databases |

## 🧪 Testing

Before deploying to production:

1. **Validate** - `terraform validate`
2. **Format** - `terraform fmt -recursive`
3. **Plan** - Review changes carefully
4. **Apply** - Deploy to dev environment first
5. **Test** - Verify functionality
6. **Promote** - Deploy to production

## 🗺️ Learning Path

Recommended order for learning:

1. **AWS-VPC** - Understand networking
2. **AWS-EC2Instance-and-SecurityGroups** - Learn compute basics
3. **AWS-ALB-Application-LoadBalancer-Basic** - Add load balancing
4. **ALB-Path-Based-Routing** - Advanced routing
5. **Autoscaling-with-Launch-Templates** - Dynamic scaling
6. **AWS-CloudWatch** - Add monitoring
7. **DNS-to-DB** - Full-stack application
8. **IaC-DevOps-using-AWS-CodePipeline** - Automation



## 🔗 Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [AWS Documentation](https://docs.aws.amazon.com)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

## 📊 Sample Comparison

| Sample | Complexity | Components | Use Case |
|--------|-----------|------------|----------|
| AWS-VPC | ⭐ Basic | VPC, Subnets, NAT | Network foundation |
| EC2-SecurityGroups | ⭐⭐ Intermediate | EC2, SG, Bastion | Compute deployment |
| ALB-Basic | ⭐⭐ Intermediate | ALB, Target Groups | Load balancing |
| ALB-Advanced | ⭐⭐⭐ Advanced | ALB, Routing Rules | Complex routing |
| Auto Scaling | ⭐⭐⭐ Advanced | ASG, Launch Templates | Dynamic scaling |
| CloudWatch | ⭐⭐⭐ Advanced | Alarms, Synthetics | Monitoring |
| DNS-to-DB | ⭐⭐⭐⭐ Expert | Full Stack + RDS | Complete application |
| IaC-DevOps | ⭐⭐⭐⭐ Expert | CI/CD Pipeline | Production automation |

## 🎓 What You'll Learn

- ✅ AWS networking fundamentals
- ✅ EC2 instance management
- ✅ Load balancer configuration
- ✅ Auto Scaling strategies
- ✅ Database integration
- ✅ Security group design
- ✅ SSL/TLS certificate management
- ✅ DNS with Route53
- ✅ Monitoring with CloudWatch
- ✅ Infrastructure as Code principles
- ✅ Terraform best practices
- ✅ CI/CD for infrastructure

## 🌟 Star History

If you find this repository helpful, please consider giving it a star ⭐

---

**Built with ❤️ using Terraform and AWS**
