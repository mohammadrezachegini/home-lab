# AWS EKS with EBS Storage Management using Terraform

A complete Infrastructure as Code (IaC) solution for deploying Amazon EKS cluster with AWS EBS CSI Driver and a sample User Management web application with persistent MySQL storage.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Components](#components)
- [Setup Instructions](#setup-instructions)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Testing](#testing)
- [Cleanup](#cleanup)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This project demonstrates a production-ready AWS EKS cluster deployment with:

- **EKS Cluster** (v1.31) with public node groups
- **AWS EBS CSI Driver** for persistent volume management
- **Dynamic volume provisioning** with storage classes
- **Volume expansion** capabilities
- **Sample User Management Application** with MySQL backend
- **Multiple load balancer options** (Classic, Network, NodePort)
- **S3 backend** for Terraform state management
- **DynamoDB** for state locking

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                     VPC (10.0.0.0/16)                  │  │
│  │  ┌──────────────┐         ┌──────────────┐            │  │
│  │  │ Public Subnet│         │ Public Subnet│            │  │
│  │  │  us-east-1a  │         │  us-east-1b  │            │  │
│  │  │              │         │              │            │  │
│  │  │ ┌──────────┐ │         │ ┌──────────┐ │            │  │
│  │  │ │ Bastion  │ │         │ │EKS Nodes │ │            │  │
│  │  │ │   Host   │ │         │ │          │ │            │  │
│  │  │ └──────────┘ │         │ └──────────┘ │            │  │
│  │  │              │         │              │            │  │
│  │  │              │         │ ┌──────────┐ │            │  │
│  │  │              │         │ │MySQL Pod │ │            │  │
│  │  │              │         │ │  + EBS   │ │            │  │
│  │  │              │         │ └──────────┘ │            │  │
│  │  └──────────────┘         └──────────────┘            │  │
│  │                                                         │  │
│  │  ┌──────────────┐         ┌──────────────┐            │  │
│  │  │Private Subnet│         │Private Subnet│            │  │
│  │  │  us-east-1a  │         │  us-east-1b  │            │  │
│  │  └──────────────┘         └──────────────┘            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────┐   ┌──────────────────────┐       │
│  │   EBS Volumes        │   │  Load Balancers      │       │
│  │   (Persistent)       │   │  (CLB/NLB)           │       │
│  └──────────────────────┘   └──────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## ✅ Prerequisites

### Required Tools

- **Terraform** >= 1.6.0
- **AWS CLI** configured with appropriate credentials
- **kubectl** for Kubernetes management
- **Helm** >= 2.16.1 (installed via Terraform)

### AWS Resources

- AWS Account with appropriate permissions
- S3 bucket for Terraform state: `terraform-on-aws-eks-381492238320`
- DynamoDB tables for state locking:
  - `dev-ekscluster`
  - `dev-ebs-storage`
  - `dev-ebs-sampleapp-demo`
- EC2 Key Pair: `terraform-key`

### Required IAM Permissions

Your AWS user/role needs permissions for:
- EKS cluster creation and management
- VPC and networking resources
- EC2 instances and security groups
- IAM roles and policies
- EBS volumes and snapshots
- Load balancers (Classic and Network)

## 📁 Project Structure

```
.
├── ekscluster-terraform-manifests/     # EKS Cluster Infrastructure
│   ├── c1-versions.tf                  # Terraform and provider versions
│   ├── c2-01-generic-variables.tf      # Common variables
│   ├── c2-02-local-values.tf           # Local values
│   ├── c3-01-vpc-variables.tf          # VPC configuration variables
│   ├── c3-02-vpc-module.tf             # VPC module configuration
│   ├── c3-03-vpc-outputs.tf            # VPC outputs
│   ├── c4-*-ec2bastion-*.tf            # Bastion host configuration
│   ├── c5-*-eks-*.tf                   # EKS cluster and node groups
│   ├── c6-*-iam-oidc-*.tf              # OIDC provider for IRSA
│   ├── terraform.tfvars                # Variable values
│   ├── vpc.auto.tfvars                 # VPC variable values
│   ├── eks.auto.tfvars                 # EKS variable values
│   └── ec2bastion.auto.tfvars          # Bastion variable values
│
├── ebs-terraform-manifests/            # EBS CSI Driver Installation
│   ├── c1-versions.tf                  # Terraform and provider versions
│   ├── c2-remote-state-datasource.tf   # Remote state data source
│   ├── c3-01-generic-variables.tf      # Generic variables
│   ├── c3-02-local-values.tf           # Local values
│   ├── c4-01-ebs-csi-datasources.tf    # EBS CSI IAM policy datasource
│   ├── c4-02-ebs-csi-iam-policy-and-role.tf  # IAM role for EBS CSI
│   ├── c4-03-ebs-csi-helm-provider.tf  # Helm provider configuration
│   ├── c4-04-ebs-csi-install-using-helm.tf   # EBS CSI driver installation
│   ├── c4-05-ebs-csi-outputs.tf        # EBS CSI outputs
│   └── terraform.tfvars                # Variable values
│
└── terraform-manifests-UMS-WebApp/     # Sample Application Deployment
    ├── c1-versions.tf                  # Terraform and provider versions
    ├── c2-remote-state-datasource.tf   # Remote state data source
    ├── c3-providers.tf                 # Kubernetes provider
    ├── c4-01-storage-class.tf          # EBS storage class
    ├── c4-02-persistent-volume-claim.tf # PVC for MySQL
    ├── c4-03-UserMgmtWebApp-ConfigMap.tf # Database initialization script
    ├── c4-04-mysql-deployment.tf       # MySQL deployment
    ├── c4-05-mysql-clusterip-service.tf # MySQL ClusterIP service
    ├── c4-06-UserMgmtWebApp-deployment.tf # Web app deployment
    ├── c4-07-UserMgmtWebApp-loadbalancer-service.tf # Classic LB
    ├── c4-08-UserMgmtWebApp-network-loadbalancer-service.tf # Network LB
    ├── c4-09-UserMgmtWebApp-nodeport-service.tf # NodePort service
    └── webappdb.sql                    # Database schema
```

## 🔧 Components

### 1. EKS Cluster Infrastructure

**Features:**
- EKS cluster version 1.31
- Public node group with t3.medium instances
- Auto-scaling (min: 1, max: 2)
- Bastion host for secure access
- VPC with public and private subnets
- NAT Gateway for outbound connectivity
- OIDC provider for IAM Roles for Service Accounts (IRSA)

**Network Configuration:**
- VPC CIDR: `10.0.0.0/16`
- Public Subnets: `10.0.101.0/24`, `10.0.102.0/24`
- Private Subnets: `10.0.1.0/24`, `10.0.2.0/24`
- Database Subnets: `10.0.151.0/24`, `10.0.152.0/24`
- Service CIDR: `172.20.0.0/16`

### 2. EBS CSI Driver

**Features:**
- Installed via Helm chart
- IAM Role for Service Accounts (IRSA) integration
- Dynamic volume provisioning
- Volume expansion support
- Snapshot capabilities
- Retain reclaim policy

**Storage Class Configuration:**
- Provisioner: `ebs.csi.aws.com`
- Volume Binding Mode: `WaitForFirstConsumer`
- Allow Volume Expansion: `true`
- Reclaim Policy: `Retain`

### 3. Sample User Management Application

**Components:**
- MySQL 5.6 database with persistent EBS storage
- Java-based user management web application
- Multiple service exposure options:
  - Classic Load Balancer
  - Network Load Balancer
  - NodePort (31280)

**Storage:**
- Initial PVC size: 6Gi
- Expandable without downtime
- Data persists across pod restarts

## 🚀 Setup Instructions

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Terraform-on-K8S/AWS-EKS/EBS-Resizing-on-EKS
```

### Step 2: Configure AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, Region, and output format
```

### Step 3: Update Configuration Files

Update the following files with your specific values:

**ekscluster-terraform-manifests/terraform.tfvars:**
```hcl
aws_region = "us-east-1"
environment = "dev"
business_divsion = "hr"  # Change to your division
```

**ekscluster-terraform-manifests/ec2bastion.auto.tfvars:**
```hcl
instance_type = "t3.micro"
instance_keypair = "your-key-pair-name"  # Update with your key pair
```

**Update S3 backend bucket name** in all `c1-versions.tf` files to match your bucket.

### Step 4: Create Required AWS Resources

Create S3 bucket and DynamoDB tables:

```bash
# Create S3 bucket
aws s3 mb s3://your-bucket-name --region us-east-1

# Create DynamoDB tables
aws dynamodb create-table \
    --table-name dev-ekscluster \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region us-east-1

aws dynamodb create-table \
    --table-name dev-ebs-storage \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region us-east-1

aws dynamodb create-table \
    --table-name dev-ebs-sampleapp-demo \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region us-east-1
```

## 📦 Deployment

### Phase 1: Deploy EKS Cluster

```bash
cd ekscluster-terraform-manifests

# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Plan deployment
terraform plan

# Apply configuration
terraform apply -auto-approve
```

**Expected Duration:** 15-20 minutes

### Phase 2: Configure kubectl

```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name hr-dev-eksdemo1

# Verify cluster access
kubectl get nodes
kubectl get pods -A
```

### Phase 3: Install EBS CSI Driver

```bash
cd ../ebs-terraform-manifests

# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply configuration
terraform apply -auto-approve
```

**Verification:**
```bash
# Check EBS CSI driver pods
kubectl get pods -n kube-system | grep ebs-csi

# Verify service account
kubectl get sa -n kube-system ebs-csi-controller-sa

# Check IAM role annotation
kubectl describe sa ebs-csi-controller-sa -n kube-system
```

### Phase 4: Deploy Sample Application

```bash
cd ../terraform-manifests-UMS-WebApp

# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply configuration
terraform apply -auto-approve
```

## 🧪 Testing

### Verify Deployments

```bash
# Check all resources
kubectl get all

# Check storage class
kubectl get storageclass

# Check PVC
kubectl get pvc

# Check PV
kubectl get pv
```

### Test Application

```bash
# Get Load Balancer URL (Classic)
kubectl get svc usermgmt-webapp-clb-service

# Get Load Balancer URL (Network)
kubectl get svc usermgmt-webapp-network-lb-service

# Access application
# http://<load-balancer-dns-name>
```

### Test Volume Expansion

1. Edit the PVC to increase size:
```bash
kubectl edit pvc ebs-mysql-pv-claim
# Change storage from 6Gi to 10Gi
```

2. Verify expansion:
```bash
kubectl get pvc ebs-mysql-pv-claim
kubectl describe pvc ebs-mysql-pv-claim
```

3. Check the EBS volume in AWS Console for updated size.

## 🧹 Cleanup

**Important:** Follow the reverse order to avoid dependency issues.

### Step 1: Destroy Sample Application
```bash
cd terraform-manifests-UMS-WebApp
terraform destroy -auto-approve
```

### Step 2: Destroy EBS CSI Driver
```bash
cd ../ebs-terraform-manifests
terraform destroy -auto-approve
```

### Step 3: Destroy EKS Cluster
```bash
cd ../ekscluster-terraform-manifests
terraform destroy -auto-approve
```

### Step 4: Clean Up AWS Resources (Optional)
```bash
# Delete S3 bucket (remove all objects first)
aws s3 rb s3://your-bucket-name --force

# Delete DynamoDB tables
aws dynamodb delete-table --table-name dev-ekscluster
aws dynamodb delete-table --table-name dev-ebs-storage
aws dynamodb delete-table --table-name dev-ebs-sampleapp-demo
```

## 🔍 Troubleshooting

### EBS CSI Driver Issues

**Problem:** Pods can't mount EBS volumes

**Solution:**
```bash
# Check driver installation
kubectl get pods -n kube-system | grep ebs-csi-controller

# Check logs
kubectl logs -n kube-system -l app=ebs-csi-controller

# Verify IAM role
aws iam get-role --role-name <ebs-csi-role-name>
```

### PVC Stuck in Pending

**Problem:** PVC remains in Pending state

**Solution:**
```bash
# Check PVC events
kubectl describe pvc ebs-mysql-pv-claim

# Verify storage class
kubectl get storageclass ebs-sc -o yaml

# Check if pod is scheduled (required for WaitForFirstConsumer)
kubectl get pods
```

### Load Balancer Not Working

**Problem:** Cannot access application via Load Balancer

**Solution:**
```bash
# Check service status
kubectl describe svc usermgmt-webapp-clb-service

# Verify security groups
kubectl get svc usermgmt-webapp-clb-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Check target health in AWS Console
```

### Terraform State Lock

**Problem:** State file is locked

**Solution:**
```bash
# Force unlock (use with caution)
terraform force-unlock <lock-id>
```

## 📚 Additional Resources

- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [AWS EBS CSI Driver](https://github.com/kubernetes-sigs/aws-ebs-csi-driver)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Kubernetes Storage Documentation](https://kubernetes.io/docs/concepts/storage/)

