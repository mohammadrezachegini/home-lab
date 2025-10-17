# AWS EKS with EBS CSI Driver - Terraform & Kubernetes

This repository contains Infrastructure as Code (IaC) using Terraform to provision an Amazon EKS cluster with EBS CSI driver integration, along with a sample User Management Web Application demonstrating persistent storage capabilities.

## Architecture Overview

The infrastructure consists of:
- **AWS EKS Cluster** (v1.31) with public node groups
- **VPC** with public, private, and database subnets across 2 availability zones
- **EBS CSI Driver** for dynamic volume provisioning
- **Bastion Host** for secure cluster access
- **IAM Roles & Policies** with IRSA (IAM Roles for Service Accounts)
- **Sample Application** - User Management Web App with MySQL database

## Repository Structure

```
.
├── ekscluster-terraform-manifests/    # EKS cluster infrastructure
│   ├── c1-versions.tf                 # Provider versions and S3 backend
│   ├── c2-01-generic-variables.tf     # Generic variables
│   ├── c2-02-local-values.tf          # Local values
│   ├── c3-01-vpc-variables.tf         # VPC variables
│   ├── c3-02-vpc-module.tf            # VPC module configuration
│   ├── c4-xx-ec2bastion-*.tf          # Bastion host resources
│   ├── c5-xx-eks-*.tf                 # EKS cluster resources
│   ├── c6-xx-iam-oidc-*.tf            # OIDC provider for IRSA
│   └── *.auto.tfvars                  # Auto-loaded variable files
│
├── ebs-terraform-manifests/           # EBS CSI driver installation
│   ├── c1-versions.tf                 # Provider versions
│   ├── c2-remote-state-datasource.tf  # Remote state reference
│   ├── c4-01-ebs-csi-datasources.tf   # EBS IAM policy datasource
│   ├── c4-02-ebs-csi-iam-*.tf         # IAM role for EBS CSI
│   ├── c4-03-ebs-csi-helm-provider.tf # Helm provider config
│   └── c4-04-ebs-csi-install-*.tf     # Helm release for EBS CSI
│
└── kube-manifests-UMS-WebApp/         # Kubernetes manifests
    ├── 01-storage-class.yaml          # EBS StorageClass
    ├── 02-persistent-volume-claim.yaml # PVC for MySQL
    ├── 03-UserManagement-ConfigMap.yaml # DB initialization script
    ├── 04-mysql-deployment.yaml       # MySQL deployment
    ├── 05-mysql-clusterip-service.yaml # MySQL service
    ├── 06-UserMgmtWebApp-Deployment.yaml # Web app deployment
    ├── 07-*.yaml                      # Classic Load Balancer service
    ├── 08-*.yaml                      # Network Load Balancer service
    └── 09-*.yaml                      # NodePort service
```

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.0
- kubectl installed
- An AWS EC2 key pair named `terraform-key`
- S3 bucket for Terraform state: `terraform-on-aws-eks-381492238320`
- DynamoDB tables for state locking:
  - `dev-ekscluster`
  - `dev-ebs-storage`

## Configuration

### Variable Files

**ekscluster-terraform-manifests/terraform.tfvars:**
```hcl
aws_region = "us-east-1"
environment = "dev"
business_divsion = "hr"
```

**ekscluster-terraform-manifests/eks.auto.tfvars:**
```hcl
cluster_name = "eksdemo1"
cluster_service_ipv4_cidr = "172.20.0.0/16"
cluster_version = "1.31"
```

**ekscluster-terraform-manifests/vpc.auto.tfvars:**
```hcl
vpc_name = "myvpc"
vpc_cidr_block = "10.0.0.0/16"
vpc_public_subnets = ["10.0.101.0/24", "10.0.102.0/24"]
vpc_private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
```

## Deployment Steps

### Step 1: Deploy EKS Cluster

```bash
cd ekscluster-terraform-manifests

# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Plan infrastructure
terraform plan

# Apply configuration
terraform apply -auto-approve
```

### Step 2: Configure kubectl

```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name hr-dev-eksdemo1

# Verify connection
kubectl get nodes
kubectl get namespaces
```

### Step 3: Deploy EBS CSI Driver

```bash
cd ../ebs-terraform-manifests

# Initialize Terraform
terraform init

# Apply EBS CSI driver
terraform apply -auto-approve

# Verify installation
kubectl get pods -n kube-system | grep ebs-csi
kubectl get serviceaccount ebs-csi-controller-sa -n kube-system
```

### Step 4: Deploy Sample Application

```bash
cd ../kube-manifests-UMS-WebApp

# Deploy all Kubernetes resources
kubectl apply -f 01-storage-class.yaml
kubectl apply -f 02-persistent-volume-claim.yaml
kubectl apply -f 03-UserManagement-ConfigMap.yaml
kubectl apply -f 04-mysql-deployment.yaml
kubectl apply -f 05-mysql-clusterip-service.yaml
kubectl apply -f 06-UserMgmtWebApp-Deployment.yaml

# Choose one service type:
# Option 1: Classic Load Balancer
kubectl apply -f 07-UserMgmtWebApp-Classic-LoadBalancer-Service.yaml

# Option 2: Network Load Balancer
kubectl apply -f 08-UserMgmtWebApp-Network-LoadBalancer.yaml

# Option 3: NodePort
kubectl apply -f 09-UserMgmtWebApp-NodePort-Service.yaml
```

### Step 5: Verify Deployment

```bash
# Check PVC status
kubectl get pvc

# Check pods
kubectl get pods

# Check services
kubectl get svc

# Get Load Balancer URL (for LoadBalancer services)
kubectl get svc usermgmt-webapp-clb-service
```

## Features

### EKS Cluster Features
- Kubernetes version 1.31
- Public node group with t3.medium instances
- Auto-scaling configuration (1-2 nodes)
- Control plane logging enabled
- OIDC provider for IRSA

### Networking
- Custom VPC with CIDR 10.0.0.0/16
- 2 public subnets, 2 private subnets, 2 database subnets
- NAT Gateway for private subnet internet access
- Bastion host with Elastic IP

### Storage
- EBS CSI driver deployed via Helm
- Dynamic volume provisioning
- WaitForFirstConsumer binding mode
- 4Gi persistent volume for MySQL

### Security
- IAM roles with least privilege
- Security groups for bastion and EKS
- IRSA for EBS CSI driver
- Private key management for SSH access

## Application Details

### User Management Web Application
- **Frontend/Backend**: Spring Boot application (stacksimplify/kube-usermgmt-webapp:1.0.0-MySQLDB)
- **Database**: MySQL 5.6 with persistent storage
- **Init Container**: Waits for MySQL availability before starting
- **Environment Variables**: Database connection configured via env vars

### Database Configuration
- Root password: `dbpassword11`
- Database name: `webappdb`
- Port: 3306
- Persistent storage: 4Gi EBS volume

## Accessing the Application

After deployment, get the Load Balancer DNS:

```bash
kubectl get svc usermgmt-webapp-clb-service
```

Access the application at:
```
http://<LOAD-BALANCER-DNS>/usermgmt/
```

## Cleanup

### Delete Kubernetes Resources
```bash
cd kube-manifests-UMS-WebApp
kubectl delete -f .
```

### Destroy EBS CSI Driver
```bash
cd ../ebs-terraform-manifests
terraform destroy -auto-approve
```

### Destroy EKS Cluster
```bash
cd ../ekscluster-terraform-manifests
terraform destroy -auto-approve
```

## Troubleshooting

### Check EBS CSI Driver Logs
```bash
kubectl logs -n kube-system -l app=ebs-csi-controller
```

### Check PVC Status
```bash
kubectl describe pvc ebs-mysql-pv-claim
```

### Check Pod Logs
```bash
kubectl logs deployment/mysql
kubectl logs deployment/usermgmt-webapp
```

### Verify IAM Role Annotations
```bash
kubectl describe sa ebs-csi-controller-sa -n kube-system
```

## Important Notes

1. **State Management**: This project uses S3 backend for remote state storage
2. **Region-Specific**: EBS CSI driver image is configured for us-east-1
3. **Cost Optimization**: Single NAT Gateway is used to reduce costs
4. **SSH Access**: Bastion host provides secure access to EKS worker nodes
5. **Database Credentials**: Change default passwords in production
