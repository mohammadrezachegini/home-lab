# AWS EKS with EBS Storage and Sample Application

This repository contains Terraform infrastructure as code for deploying an AWS EKS cluster with EBS CSI driver integration and a sample user management web application.

## Architecture Overview

The infrastructure consists of three main components:

1. **EKS Cluster Infrastructure** - Core Kubernetes cluster setup with VPC, node groups, and OIDC provider
2. **EBS CSI Driver** - AWS EBS Container Storage Interface driver for persistent volume support
3. **Sample Application** - User management web application with MySQL database using EBS persistent storage

## Repository Structure

```
.
├── ekscluster-terraform-manifests/     # EKS cluster infrastructure
├── ebs-terraform-manifests/            # EBS CSI driver installation
└── terraform-manifests-UMS-WebApp/     # Sample application deployment
```

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.6.0
- kubectl installed
- An AWS account with appropriate permissions
- SSH key pair named `terraform-key` in your AWS account

## Infrastructure Components

### 1. EKS Cluster Infrastructure

**Location**: `ekscluster-terraform-manifests/`

Creates the following resources:
- VPC with public, private, and database subnets across 2 AZs
- NAT Gateway for private subnet internet access
- EKS Cluster (v1.31)
- Public node group with t3.medium instances
- Bastion host for cluster access
- IAM roles and policies for EKS
- OIDC provider for service account integration

**Key Features**:
- Remote state storage in S3
- State locking with DynamoDB
- Cluster logging enabled (api, audit, authenticator, controllerManager, scheduler)
- SSH access via bastion host

### 2. EBS CSI Driver

**Location**: `ebs-terraform-manifests/`

Installs and configures:
- EBS CSI IAM policy from official GitHub repository
- IAM role with web identity for service account authentication
- Helm-based EBS CSI driver installation
- Service account with proper annotations

### 3. Sample User Management Application

**Location**: `terraform-manifests-UMS-WebApp/`

Deploys:
- MySQL 5.6 database with persistent storage
- User management web application
- Multiple service types (ClusterIP, LoadBalancer, NodePort)
- ConfigMap for database initialization

## Configuration

### Default Variables

**EKS Cluster** (`ekscluster-terraform-manifests/terraform.tfvars`):
```hcl
aws_region = "us-east-1"
environment = "dev"
business_divsion = "hr"
```

**VPC Configuration** (`ekscluster-terraform-manifests/vpc.auto.tfvars`):
```hcl
vpc_cidr_block = "10.0.0.0/16"
vpc_public_subnets = ["10.0.101.0/24", "10.0.102.0/24"]
vpc_private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
vpc_database_subnets = ["10.0.151.0/24", "10.0.152.0/24"]
```

**EKS Settings** (`ekscluster-terraform-manifests/eks.auto.tfvars`):
```hcl
cluster_name = "eksdemo1"
cluster_version = "1.31"
cluster_service_ipv4_cidr = "172.20.0.0/16"
```

## Deployment Instructions

### Step 1: Deploy EKS Cluster

```bash
cd ekscluster-terraform-manifests/

# Initialize Terraform
terraform init

# Review the execution plan
terraform plan

# Apply the configuration
terraform apply -auto-approve

# Configure kubectl
aws eks update-kubeconfig --region us-east-1 --name hr-dev-eksdemo1
```

### Step 2: Install EBS CSI Driver

```bash
cd ../ebs-terraform-manifests/

# Initialize Terraform
terraform init

# Deploy EBS CSI driver
terraform apply -auto-approve

# Verify installation
kubectl get pods -n kube-system | grep ebs-csi
```

### Step 3: Deploy Sample Application

```bash
cd ../terraform-manifests-UMS-WebApp/

# Initialize Terraform
terraform init

# Deploy application
terraform apply -auto-approve

# Get LoadBalancer URL
kubectl get svc usermgmt-webapp-clb-service
```

## Remote State Configuration

All modules use S3 backend for state management:

- **S3 Bucket**: `terraform-on-aws-eks-381492238320`
- **Region**: `us-east-1`
- **State Files**:
  - EKS Cluster: `dev/eks-cluster/terraform.tfstate`
  - EBS Storage: `dev/ebs-storage/terraform.tfstate`
  - Sample App: `dev/ebs-sampleapp-demo/terraform.tfstate`

**DynamoDB Tables** (State Locking):
- `dev-ekscluster`
- `dev-ebs-storage`
- `dev-ebs-sampleapp-demo`

## Application Access

After deployment, access the application through:

1. **Classic Load Balancer**:
   ```bash
   kubectl get svc usermgmt-webapp-clb-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
   ```

2. **Network Load Balancer**:
   ```bash
   kubectl get svc usermgmt-webapp-network-lb-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
   ```

3. **NodePort** (via Bastion host):
   ```bash
   kubectl get svc usermgmt-webapp-nodeport-service
   # Access via: http://<node-ip>:31280
   ```

## Persistent Storage Details

The MySQL database uses EBS volumes through Kubernetes:

- **Storage Class**: `ebs-sc`
- **Provisioner**: `ebs.csi.aws.com`
- **Volume Binding**: `WaitForFirstConsumer`
- **PVC Size**: 4Gi
- **Access Mode**: ReadWriteOnce

## Outputs

### EKS Cluster Outputs
- Cluster ID and ARN
- Cluster endpoint
- OIDC provider ARN
- Node group details
- VPC and subnet information

### EBS CSI Outputs
- IAM policy ARN
- IAM role ARN
- Helm release metadata

## Cleanup

To destroy all resources in reverse order:

```bash
# 1. Destroy sample application
cd terraform-manifests-UMS-WebApp/
terraform destroy -auto-approve

# 2. Destroy EBS CSI driver
cd ../ebs-terraform-manifests/
terraform destroy -auto-approve

# 3. Destroy EKS cluster
cd ../ekscluster-terraform-manifests/
terraform destroy -auto-approve
```

## Security Considerations

- Bastion host has SSH access from `0.0.0.0/0` - restrict this in production
- Database password stored in plain text - use AWS Secrets Manager in production
- EKS API endpoint is publicly accessible - consider private endpoint for production
- Review IAM policies and apply principle of least privilege

## Provider Versions

- AWS Provider: 5.74.0
- Kubernetes Provider: 2.33.0
- Helm Provider: 2.16.1
- HTTP Provider: 3.4.5

## Known Issues

- MySQL deployment uses persistent storage volume named inconsistently in volume_mount
- Private node group is commented out but included in code
- Bastion host provisioners require private key file at `private-key/terraform-key.pem`

