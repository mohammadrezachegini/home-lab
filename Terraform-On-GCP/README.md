# Terraform on Google Cloud Platform

A comprehensive collection of Terraform configurations for deploying various infrastructure patterns on Google Cloud Platform. This repository contains production-ready examples for load balancers, Cloud SQL databases, Cloud DNS, Certificate Manager, and more.

## Overview

This repository demonstrates Infrastructure as Code (IaC) best practices for GCP using Terraform. Each subdirectory contains a complete, deployable example with documentation, making it easy to learn and implement GCP services.

## Prerequisites

- **Google Cloud Platform Account** with billing enabled
- **Terraform** v1.0+ installed
- **GCP CLI** (`gcloud`) installed and configured
- **Authentication** configured:
  ```bash
  gcloud auth application-default login
  ```
- Appropriate GCP project permissions (Editor or Owner role recommended)

## Repository Structure

### Load Balancers

#### Regional HTTP Load Balancers

- **[Regional-HTTP-LB-MIGPublic](Regional-HTTP-LB-MIGPublic/)** - Regional HTTP Load Balancer with public Managed Instance Groups
- **[Regional-HTTP-LB-MIGPrivate](Regional-HTTP-LB-MIGPrivate/)** - Regional HTTP Load Balancer with private Managed Instance Groups and Cloud NAT
- **[Regional-HTTP-LB-PATH-Routing](Regional-HTTP-LB-PATH-Routing/)** - Path-based routing with multiple backend services
- **[Regional-HTTP-LB-HOST-Routing](Regional-HTTP-LB-HOST-Routing/)** - Host-based routing for multi-tenant applications
- **[Regional-HTTP-LB-HEADER-Routing](Regional-HTTP-LB-HEADER-Routing/)** - Header-based routing for advanced traffic management
- **[Regional-HTTP-LB-MIGUpdatePolicy](Regional-HTTP-LB-MIGUpdatePolicy/)** - MIG update policies and rolling updates

#### Regional HTTPS Load Balancers

- **[Regional-HTTPS-LB-SelfSigned](Regional-HTTPS-LB-SelfSigned/)** - HTTPS Load Balancer with self-signed SSL certificates
- **[Regional-HTTPS-LB-CloudDNS](Regional-HTTPS-LB-CloudDNS/)** - HTTPS Load Balancer with Cloud DNS and managed certificates
- **[Regional-HTTPS-LB-Logging](Regional-HTTPS-LB-Logging/)** - HTTPS Load Balancer with Cloud Logging integration
- **[Regional-HTTPS-LB-Monitoring](Regional-HTTPS-LB-Monitoring/)** - HTTPS Load Balancer with Cloud Monitoring and uptime checks

### Cloud SQL Databases

- **[CloudSQL-PublicDB-TF-Remote-State](CloudSQL-PublicDB-TF-Remote-State/)** - Public Cloud SQL MySQL instance with Terraform remote state
- **[CloudSQL-PrivateDB](CloudSQL-PrivateDB/)** - Private Cloud SQL instance with VPC peering and private service connection

### Full-Stack Applications

#### Cloud DNS + Cloud SQL + HTTPS Load Balancer (Private DB)

- **[DNS-to-DB-CloudDNS-CloudSQL-PrivateDB](DNS-to-DB-CloudDNS-CloudSQL-PrivateDB/)** - Complete architecture with:
  - Cloud SQL Private Database
  - HTTPS Load Balancer with managed certificates
  - Cloud DNS for domain management
  - VPC with private service connection
  - Cloud NAT and Cloud Router
  - Monitoring and uptime checks

#### Cloud DNS + Cloud SQL + HTTPS Load Balancer (Public DB)

- **[DNS-to-DB-CloudDNS-CloudSQL-PublicDB](DNS-to-DB-CloudDNS-CloudSQL-PublicDB/)** - Full-stack deployment with public Cloud SQL database

#### Self-Signed SSL + Cloud SQL

- **[DNS-to-DB-SelfSigned-CloudSQL-PrivateDB](DNS-to-DB-SelfSigned-CloudSQL-PrivateDB/)** - HTTPS Load Balancer with self-signed certificates and private Cloud SQL
- **[DNS-to-DB-SelfSigned-CloudSQL-PublicDB](DNS-to-DB-SelfSigned-CloudSQL-PublicDB/)** - HTTPS Load Balancer with self-signed certificates and public Cloud SQL

### Foundational Components

- **[Instance-Templates-and-LocalValues](Instance-Templates-and-LocalValues/)** - Best practices for instance templates and local values in Terraform

## Common Features

All projects in this repository demonstrate:

- **Auto-scaling**: Managed Instance Groups with CPU-based auto-scaling
- **Health Checks**: Automated health monitoring for instances and load balancers
- **High Availability**: Regional deployments with multiple zones
- **Security**: Firewall rules, network tags, and IAM best practices
- **Infrastructure as Code**: Declarative configuration with Terraform
- **Resource Naming**: Consistent naming conventions using local values
- **Outputs**: Comprehensive outputs for resource references

## Quick Start

Choose a project from the list above and follow these steps:

### 1. Navigate to Project Directory

```bash
cd terraform-on-gcp/<project-name>
```

### 2. Review Documentation

Each project contains a detailed README with:
- Architecture overview
- Prerequisites
- Configuration options
- Deployment instructions
- Troubleshooting guide

### 3. Customize Variables

Edit `terraform.tfvars`:

```hcl
gcp_project = "your-project-id"
gcp_region1 = "us-central1"
environment = "dev"
```

### 4. Deploy

```bash
terraform init
terraform plan
terraform apply
```

### 5. Cleanup

```bash
terraform destroy
```

## Configuration Patterns

### Standard Variables

Most projects use these common variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `gcp_project` | GCP Project ID | terraform-gcp-438417 |
| `gcp_region1` | Primary GCP Region | us-central1 or us-east1 |
| `machine_type` | VM Machine Type | e2-micro |
| `environment` | Environment (dev/staging/prod) | dev |
| `business_divsion` | Business division tag | hr/sap/it |

### File Naming Convention

Projects follow a consistent file naming pattern:

- `c1-versions.tf` - Terraform and provider versions
- `c2-01-variables.tf` - Input variables
- `c2-02-local-values.tf` - Local values and common tags
- `c3-vpc.tf` - VPC and networking
- `c4-firewallrules.tf` - Firewall rules
- `c5-datasource.tf` - Data sources
- `c6-xx-*.tf` - Compute resources (instance templates, MIGs, etc.)
- `c7-xx-*.tf` - Load balancer resources
- `c8-*.tf` - Cloud NAT and Cloud Router
- `c9-*.tf` - Cloud DNS
- `c10-*.tf` - Certificate Manager

## Architecture Patterns

### Basic Load Balancer

```
Internet → Regional HTTP LB → Managed Instance Group → Compute Instances
```

### Private Load Balancer with Cloud NAT

```
Internet → Regional HTTP LB → MIG (Private) → Cloud NAT → Internet
```

### Full-Stack with Database

```
Cloud DNS → Regional HTTPS LB → MIG → Cloud SQL (Private)
                ↓
          Certificate Manager
                ↓
          Cloud Monitoring
```

## Security Considerations

All projects implement security best practices:

1. **Network Security**
   - Firewall rules with specific source ranges
   - Network tags for resource isolation
   - VPC with custom subnets

2. **Database Security**
   - Private IP connections (recommended)
   - Authorized networks for public IPs
   - Strong password policies

3. **Certificate Management**
   - Managed SSL certificates via Certificate Manager
   - Self-signed certificates for testing
   - Automated certificate renewal

4. **Access Control**
   - Service accounts with minimal permissions
   - IAM roles following least privilege principle

## Cost Optimization

### Development/Testing

- Use `e2-micro` or `f1-micro` instance types
- Set minimum auto-scaling instances to 1-2
- Use preemptible instances where possible
- Delete resources when not in use

### Production

- Right-size instance types based on workload
- Enable committed use discounts
- Use sustained use discounts
- Implement auto-scaling to match demand
- Monitor costs with Cloud Billing reports

### Estimated Monthly Costs

Basic HTTP LB with 2 e2-micro instances (us-central1):
- **Compute**: ~$14-16 (2 × e2-micro)
- **Load Balancer**: ~$18-25
- **Networking**: ~$5-10 (variable)
- **Static IP**: ~$3-5
- **Total**: ~$40-60/month

## Best Practices

### Terraform State Management

1. **Use Remote State**: Store state in GCS buckets
   ```hcl
   terraform {
     backend "gcs" {
       bucket = "your-terraform-state-bucket"
       prefix = "terraform/state"
     }
   }
   ```

2. **Enable Versioning**: Protect against accidental deletions
   ```bash
   gsutil versioning set on gs://your-terraform-state-bucket
   ```

3. **Use State Locking**: Prevent concurrent modifications

### Resource Naming

Use consistent naming with local values:

```hcl
locals {
  name_prefix = "${var.business_divsion}-${var.environment}"

  common_tags = {
    environment      = var.environment
    business_divsion = var.business_divsion
    managed_by       = "terraform"
  }
}
```

### Module Organization

Organize resources by service:
- Networking (VPC, subnets, firewall)
- Compute (instance templates, MIGs)
- Load balancing (backends, URL maps)
- Databases (Cloud SQL)
- DNS (Cloud DNS zones and records)

## Troubleshooting

### Common Issues

**Quota Exceeded**
```bash
# Check quotas
gcloud compute project-info describe --project=YOUR_PROJECT

# Request quota increase in GCP Console
```

**Authentication Errors**
```bash
# Refresh credentials
gcloud auth application-default login

# Set project
gcloud config set project YOUR_PROJECT_ID
```

**State Lock Issues**
```bash
# View locks
terraform force-unlock LOCK_ID

# Only use when certain no other operations are running
```

**Resource Already Exists**
```bash
# Import existing resource
terraform import google_compute_instance.example projects/PROJECT/zones/ZONE/instances/INSTANCE

# Or remove from state
terraform state rm google_compute_instance.example
```

### Debug Commands

```bash
# Enable Terraform debug logging
export TF_LOG=DEBUG
export TF_LOG_PATH=./terraform.log

# GCP resource inspection
gcloud compute instances list
gcloud compute instance-groups managed list
gcloud compute forwarding-rules list
gcloud sql instances list

# View logs
gcloud logging read "resource.type=gce_instance" --limit 50
```


## Support and Resources

- **GCP Documentation**: https://cloud.google.com/docs
- **Terraform GCP Provider**: https://registry.terraform.io/providers/hashicorp/google/latest/docs
- **GCP Pricing Calculator**: https://cloud.google.com/products/calculator
- **GCP Free Tier**: https://cloud.google.com/free

