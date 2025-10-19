# Terraform on Kubernetes (AWS EKS)

A comprehensive collection of Terraform configurations and Kubernetes manifests for deploying and managing AWS EKS (Elastic Kubernetes Service) clusters with various add-ons, controllers, and workloads. This repository demonstrates production-ready patterns for running Kubernetes on AWS.

## Overview

This repository provides Infrastructure as Code (IaC) examples for AWS EKS, covering everything from basic cluster setup to advanced features like auto-scaling, ingress controllers, storage management, and IAM integration. Each subdirectory contains complete, deployable examples with detailed documentation.

## Prerequisites

- **Terraform** >= 1.0 installed
- **AWS CLI** configured with appropriate credentials
- **kubectl** installed for Kubernetes cluster management
- **AWS Account** with appropriate permissions
- **SSH Key Pair** for bastion host access
- Basic understanding of Kubernetes concepts

## Repository Structure

### Foundation & Cluster Setup

#### Basic Infrastructure
- **[AWS-VPC-using-Terraform](AWS-EKS/AWS-VPC-using-Terraform/)** - Production-ready VPC with public, private, and database subnets
- **[AWS-EC2-BastionHost](AWS-EKS/AWS-EC2-BastionHost/)** - Bastion host for secure EKS cluster access
- **[AWS-EKS-Cluster-Basics](AWS-EKS/AWS-EKS-Cluster-Basics/)** - Complete EKS cluster with VPC, bastion, and node groups
- **[Terraform-Remote-State-Storage](AWS-EKS/Terraform-Remote-State-Storage/)** - S3 backend for Terraform state management

#### Kubernetes Resource Management
- **[Kubernetes-Resources-via-Terraform](AWS-EKS/Kubernetes-Resources-via-Terraform/)** - Deploy Kubernetes resources using Terraform

### Storage Solutions

#### EBS (Elastic Block Store)
- **[EBS-CSI-Install-Kubernetes-Storage](AWS-EKS/EBS-CSI-Install-Kubernetes-Storage/)** - EBS CSI driver installation via Helm
- **[EBS-CSI-Install-using-EKS-AddOn](AWS-EKS/EBS-CSI-Install-using-EKS-AddOn/)** - EBS CSI driver as EKS add-on
- **[EBS-Kubernetes-SampleApp-Terraform](AWS-EKS/EBS-Kubernetes-SampleApp-Terraform/)** - Sample application with EBS storage (Terraform)
- **[EBS-Kubernetes-SampleApp-YAML](AWS-EKS/EBS-Kubernetes-SampleApp-YAML/)** - Sample application with EBS storage (YAML)
- **[EBS-Resizing-on-EKS](AWS-EKS/EBS-Resizing-on-EKS/)** - Dynamic EBS volume resizing

#### EFS (Elastic File System)
- **[EKS-EFS-CSI-Install](AWS-EKS/EKS-EFS-CSI-Install/)** - EFS CSI driver installation
- **[EKS-EFS-Static-Provisioning](AWS-EKS/EKS-EFS-Static-Provisioning/)** - Static EFS volume provisioning
- **[EKS-EFS-Dynamic-Provisioning](AWS-EKS/EKS-EFS-Dynamic-Provisioning/)** - Dynamic EFS volume provisioning
- **[EKS-EFS-Fargate](AWS-EKS/EKS-EFS-Fargate/)** - EFS with Fargate workloads

### Load Balancing & Ingress

#### AWS Load Balancer Controller
- **[EKS-with-LoadBalancer-Controller](AWS-EKS/EKS-with-LoadBalancer-Controller/)** - Install AWS Load Balancer Controller

#### Network Load Balancer (NLB)
- **[EKS-NLB-Basics](AWS-EKS/EKS-NLB-Basics/)** - Basic NLB with Kubernetes services
- **[EKS-NLB-InternalLB](AWS-EKS/EKS-NLB-InternalLB/)** - Internal NLB for private services
- **[EKS-NLB-TLS-externaldns](AWS-EKS/EKS-NLB-TLS-externaldns/)** - NLB with TLS and ExternalDNS

#### Application Load Balancer (ALB) Ingress
- **[EKS-Ingress-Basics](AWS-EKS/EKS-Ingress-Basics/)** - Basic ALB Ingress setup
- **[EKS-Ingress-Context-Path-Routing](AWS-EKS/EKS-Ingress-Context-Path-Routing/)** - Path-based routing
- **[EKS-Ingress-NameBasedVirtualHost-Routing](AWS-EKS/EKS-Ingress-NameBasedVirtualHost-Routing/)** - Host-based routing
- **[EKS-Ingress-SSL-SSLRedirect](AWS-EKS/EKS-Ingress-SSL-SSLRedirect/)** - SSL/TLS with HTTP to HTTPS redirect
- **[EKS-Ingress-SSLDiscovery-Host](AWS-EKS/EKS-Ingress-SSLDiscovery-Host/)** - SSL discovery via host header
- **[EKS-Ingress-SSLDiscovery-TLS](AWS-EKS/EKS-Ingress-SSLDiscovery-TLS/)** - SSL discovery via TLS block
- **[EKS-Ingress-InternalLB](AWS-EKS/EKS-Ingress-InternalLB/)** - Internal ALB ingress
- **[EKS-Ingress-Groups](AWS-EKS/EKS-Ingress-Groups/)** - Share ALB across multiple ingresses
- **[EKS-Ingress-Cross-Namespaces](AWS-EKS/EKS-Ingress-Cross-Namespaces/)** - Ingress across namespaces
- **[EKS-Ingress-TargetType-IP](AWS-EKS/EKS-Ingress-TargetType-IP/)** - IP mode for pod direct routing

### DNS Management
- **[EKS-ExternalDNS-Install](AWS-EKS/EKS-ExternalDNS-Install/)** - ExternalDNS controller installation
- **[EKS-ExternalDNS-with-k8s-Service](AWS-EKS/EKS-ExternalDNS-with-k8s-Service/)** - DNS records for Kubernetes services
- **[EKS-ExternalDNS-with-Ingress-Service](AWS-EKS/EKS-ExternalDNS-with-Ingress-Service/)** - DNS records for Ingress resources

### Auto-Scaling

#### Cluster Autoscaler
- **[EKS-Cluster-Autoscaler](AWS-EKS/EKS-Cluster-Autoscaler/)** - Cluster Autoscaler installation and configuration
- **[EKS-Cluster-Autoscaler-Testing](AWS-EKS/EKS-Cluster-Autoscaler-Testing/)** - Test scenarios for cluster scaling

#### Pod Autoscaling
- **[EKS-Horizontal-Pod-Autoscaler](AWS-EKS/EKS-Horizontal-Pod-Autoscaler/)** - HPA based on CPU/memory metrics
- **[EKS-Vertical-Pod-Autoscaler-Install](AWS-EKS/EKS-Vertical-Pod-Autoscaler-Install/)** - VPA installation and configuration

### IAM & Security

#### IAM Roles for Service Accounts (IRSA)
- **[EKS-IRSA](AWS-EKS/EKS-IRSA/)** - Configure IAM roles for Kubernetes service accounts

#### EKS Access Management
- **[EKS-Admins-AWS-Admin-User](AWS-EKS/EKS-Admins-AWS-Admin-User/)** - Admin access for AWS users
- **[EKS-Admins-AWS-Basic-User](AWS-EKS/EKS-Admins-AWS-Basic-User/)** - Basic user access patterns
- **[EKS-Admins-as-AWS-IAM-Users](AWS-EKS/EKS-Admins-as-AWS-IAM-Users/)** - Map IAM users to Kubernetes RBAC
- **[EKS-Admins-with-AWS-IAM-Roles](AWS-EKS/EKS-Admins-with-AWS-IAM-Roles/)** - Admin access via IAM roles
- **[EKS-Admins-with-AWS-IAM-Roles-TF](AWS-EKS/EKS-Admins-with-AWS-IAM-Roles-TF/)** - IAM role mapping with Terraform
- **[EKS-DeveloperAccess-IAM-Users](AWS-EKS/EKS-DeveloperAccess-IAM-Users/)** - Developer access controls
- **[EKS-ReadOnly-IAM-Users](AWS-EKS/EKS-ReadOnly-IAM-Users/)** - Read-only access for users

### AWS Fargate
- **[Fargate-Only-EKS-Cluster](AWS-EKS/Fargate-Only-EKS-Cluster/)** - Serverless EKS cluster with Fargate
- **[EKS-Fargate-Profiles](AWS-EKS/EKS-Fargate-Profiles/)** - Configure Fargate profiles
- **[EKS-Run-k8s-workloads-on-Fargate](AWS-EKS/EKS-Run-k8s-workloads-on-Fargate/)** - Deploy workloads on Fargate

### Monitoring & Logging
- **[EKS-Monitoring-Logging-Terraform](AWS-EKS/EKS-Monitoring-Logging-Terraform/)** - CloudWatch monitoring via Terraform
- **[EKS-Monitoring-Logging-kubectl](AWS-EKS/EKS-Monitoring-Logging-kubectl/)** - CloudWatch monitoring via kubectl

## Quick Start

### Basic EKS Cluster Deployment

For a complete EKS cluster with VPC and bastion host:

```bash
# Navigate to the basic cluster setup
cd terraform-on-k8s/AWS-EKS/AWS-EKS-Cluster-Basics/terraform-manifests

# Initialize Terraform
terraform init

# Review the planned changes
terraform plan

# Deploy the infrastructure
terraform apply

# Configure kubectl
aws eks update-kubeconfig --region us-east-1 --name <cluster-name>

# Verify cluster access
kubectl get nodes
```

### Learning Path

For those new to EKS with Terraform, follow this recommended path:

1. **[AWS-VPC-using-Terraform](AWS-EKS/AWS-VPC-using-Terraform/)** - Understand VPC networking
2. **[AWS-EC2-BastionHost](AWS-EKS/AWS-EC2-BastionHost/)** - Setup bastion host
3. **[AWS-EKS-Cluster-Basics](AWS-EKS/AWS-EKS-Cluster-Basics/)** - Deploy your first cluster
4. **[EBS-CSI-Install-using-EKS-AddOn](AWS-EKS/EBS-CSI-Install-using-EKS-AddOn/)** - Add persistent storage
5. **[EKS-with-LoadBalancer-Controller](AWS-EKS/EKS-with-LoadBalancer-Controller/)** - Install load balancer controller
6. **[EKS-Ingress-Basics](AWS-EKS/EKS-Ingress-Basics/)** - Configure basic ingress
7. **[EKS-ExternalDNS-Install](AWS-EKS/EKS-ExternalDNS-Install/)** - Setup DNS automation
8. **[EKS-Cluster-Autoscaler](AWS-EKS/EKS-Cluster-Autoscaler/)** - Enable auto-scaling

## Common Configuration Patterns

### Standard Variables

Most projects use these common variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS Region | us-east-1 |
| `environment` | Environment name | stag/dev/prod |
| `business_divsion` | Business division | hr/it/finance |
| `cluster_name` | EKS cluster name | eksdemo1 |
| `cluster_version` | Kubernetes version | 1.31 |

### File Naming Convention

Projects follow a consistent pattern:

- `c1-versions.tf` - Terraform and provider versions
- `c2-xx-*.tf` - Variables and local values
- `c3-xx-*.tf` - VPC and networking resources
- `c4-xx-*.tf` - EC2 and bastion resources
- `c5-xx-*.tf` - EKS cluster resources
- `c6-xx-*.tf` - Additional EKS features (OIDC, add-ons)
- `*.auto.tfvars` - Auto-loaded variable values

## Architecture Overview

### Standard EKS Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    VPC (10.0.0.0/16)                   │  │
│  │                                                         │  │
│  │  ┌──────────────┐  ┌──────────────┐                   │  │
│  │  │ Public Subnet│  │ Public Subnet│                   │  │
│  │  │   (AZ-1a)    │  │   (AZ-1b)    │                   │  │
│  │  │              │  │              │                   │  │
│  │  │  Bastion     │  │  NAT Gateway │                   │  │
│  │  │  Host        │  │              │                   │  │
│  │  └──────────────┘  └──────────────┘                   │  │
│  │         │                  │                           │  │
│  │  ┌──────────────┐  ┌──────────────┐                   │  │
│  │  │Private Subnet│  │Private Subnet│                   │  │
│  │  │   (AZ-1a)    │  │   (AZ-1b)    │                   │  │
│  │  │              │  │              │                   │  │
│  │  │ EKS Worker   │  │ EKS Worker   │                   │  │
│  │  │ Nodes        │  │ Nodes        │                   │  │
│  │  └──────────────┘  └──────────────┘                   │  │
│  │                                                         │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │           EKS Control Plane (Managed)           │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Ingress Architecture with ALB

```
Internet
   │
   ▼
AWS ALB (Application Load Balancer)
   │
   ├─── Path: /app1 ──► Service: app1-svc ──► Pods: app1
   │
   ├─── Path: /app2 ──► Service: app2-svc ──► Pods: app2
   │
   └─── Host: api.example.com ──► Service: api-svc ──► Pods: api
```
