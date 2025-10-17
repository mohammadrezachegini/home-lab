# AWS EKS with EBS CSI Driver - Terraform Infrastructure

This repository contains Terraform configurations for deploying an AWS EKS cluster with the EBS CSI (Container Storage Interface) driver, enabling persistent volume support for Kubernetes workloads.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Outputs](#outputs)
- [Clean Up](#clean-up)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This project automates the deployment of:

- **AWS VPC** with public, private, and database subnets
- **EKS Cluster** (Kubernetes 1.31) with OIDC provider
- **EKS Node Groups** in public subnets
- **Bastion Host** for secure cluster access
- **EBS CSI Driver** via Helm for persistent storage
- **IAM Roles and Policies** with IRSA (IAM Roles for Service Accounts)
- **Remote State Management** using S3 and DynamoDB

## 🏗️ Architecture

```
AWS Cloud
├── VPC (10.0.0.0/16)
│   ├── Public Subnets (10.0.101.0/24, 10.0.102.0/24)
│   │   ├── NAT Gateway
│   │   ├── Bastion Host (EC2)
│   │   └── EKS Node Group
│   ├── Private Subnets (10.0.1.0/24, 10.0.2.0/24)
│   └── Database Subnets (10.0.151.0/24, 10.0.152.0/24)
├── EKS Cluster
│   ├── Control Plane
│   ├── OIDC Provider
│   └── Node Groups (t3.medium)
└── EBS CSI Driver
    ├── IAM Role (IRSA)
    ├── IAM Policy
    └── Helm Chart Deployment
```

## ✅ Prerequisites

### Required Tools

- **Terraform** >= 1.6.0
- **AWS CLI** v2.x
- **kubectl** (compatible with Kubernetes 1.31)
- **helm** >= 3.x
- **git**

### AWS Requirements

- AWS Account with appropriate permissions
- AWS CLI configured with credentials
- EC2 Key Pair named `terraform-key` in `us-east-1`
- S3 bucket for Terraform state: `terraform-on-aws-eks-381492238320`
- DynamoDB tables for state locking:
  - `dev-ekscluster`
  - `dev-ebs-storage`

### IAM Permissions

Your AWS user/role needs permissions for:
- VPC, EC2, EKS management
- IAM role and policy creation
- S3 and DynamoDB access
- ELB and Auto Scaling operations

## 📁 Project Structure

```
Terraform-on-K8S/AWS-EKS/EBS-CSI-Install-Kubernetes-Storage/
├── ekscluster-terraform-manifests/        # EKS Cluster Infrastructure
│   ├── c1-versions.tf                     # Terraform & Provider versions
│   ├── c2-01-generic-variables.tf         # Global variables
│   ├── c2-02-local-values.tf              # Local values
│   ├── c3-01-vpc-variables.tf             # VPC variables
│   ├── c3-02-vpc-module.tf                # VPC module configuration
│   ├── c3-03-vpc-outputs.tf               # VPC outputs
│   ├── c4-01-ec2bastion-variables.tf      # Bastion variables
│   ├── c4-02-ec2bastion-outputs.tf        # Bastion outputs
│   ├── c4-03-ec2bastion-securitygroups.tf # Security groups
│   ├── c4-04-ami-datasource.tf            # AMI data source
│   ├── c4-05-ec2bastion-instance.tf       # Bastion instance
│   ├── c4-06-ec2bastion-elasticip.tf      # Elastic IP
│   ├── c4-07-ec2bastion-provisioners.tf   # Provisioners
│   ├── c5-01-eks-variables.tf             # EKS variables
│   ├── c5-02-eks-outputs.tf               # EKS outputs
│   ├── c5-03-iamrole-for-eks-cluster.tf   # EKS IAM role
│   ├── c5-04-iamrole-for-eks-nodegroup.tf # Node group IAM role
│   ├── c5-06-eks-cluster.tf               # EKS cluster
│   ├── c5-07-eks-node-group-public.tf     # Public node group
│   ├── c6-01-iam-oidc-connect-provider-variables.tf
│   ├── c6-02-iam-oidc-connect-provider.tf # OIDC provider
│   ├── terraform.tfvars                   # Main variables
│   ├── vpc.auto.tfvars                    # VPC variables
│   ├── eks.auto.tfvars                    # EKS variables
│   └── ec2bastion.auto.tfvars             # Bastion variables
│
└── ebs-terraform-manifests/               # EBS CSI Driver
    ├── c1-versions.tf                     # Terraform versions
    ├── c2-remote-state-datasource.tf      # Remote state data
    ├── c3-01-generic-variables.tf         # Variables
    ├── c3-02-local-values.tf              # Local values
    ├── c4-01-ebs-csi-datasources.tf       # EBS CSI policy data
    ├── c4-02-ebs-csi-iam-policy-and-role.tf # IAM setup
    ├── c4-03-ebs-csi-helm-provider.tf     # Helm provider
    ├── c4-04-ebs-csi-install-using-helm.tf # Helm installation
    ├── c4-05-ebs-csi-outputs.tf           # Outputs
    └── terraform.tfvars                   # Variables
```

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Terraform-on-K8S/AWS-EKS/EBS-CSI-Install-Kubernetes-Storage
```

### 2. Configure AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region (us-east-1)
```

### 3. Prepare SSH Key

Place your `terraform-key.pem` file in the appropriate location:

```bash
mkdir -p ekscluster-terraform-manifests/private-key
cp /path/to/terraform-key.pem ekscluster-terraform-manifests/private-key/
chmod 400 ekscluster-terraform-manifests/private-key/terraform-key.pem
```

### 4. Update Variables (Optional)

Edit the `.tfvars` files to customize your deployment:

- `ekscluster-terraform-manifests/terraform.tfvars`
- `ekscluster-terraform-manifests/vpc.auto.tfvars`
- `ekscluster-terraform-manifests/eks.auto.tfvars`
- `ebs-terraform-manifests/terraform.tfvars`

### 5. Deploy EKS Cluster

```bash
cd ekscluster-terraform-manifests

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the configuration
terraform apply -auto-approve
```

### 6. Configure kubectl

```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name hr-dev-eksdemo1

# Verify cluster access
kubectl get nodes
kubectl get pods -n kube-system
```

### 7. Deploy EBS CSI Driver

```bash
cd ../ebs-terraform-manifests

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the configuration
terraform apply -auto-approve
```

### 8. Verify EBS CSI Driver

```bash
# Check the EBS CSI controller pods
kubectl get pods -n kube-system | grep ebs-csi

# Verify the service account
kubectl get sa ebs-csi-controller-sa -n kube-system

# Check the IAM role annotation
kubectl describe sa ebs-csi-controller-sa -n kube-system
```

## ⚙️ Configuration

### Core Variables

#### EKS Cluster (`ekscluster-terraform-manifests/terraform.tfvars`)

```hcl
aws_region       = "us-east-1"
environment      = "dev"
business_divsion = "hr"
```

#### VPC Configuration (`vpc.auto.tfvars`)

```hcl
vpc_name                              = "myvpc"
vpc_cidr_block                        = "10.0.0.0/16"
vpc_public_subnets                    = ["10.0.101.0/24", "10.0.102.0/24"]
vpc_private_subnets                   = ["10.0.1.0/24", "10.0.2.0/24"]
vpc_database_subnets                  = ["10.0.151.0/24", "10.0.152.0/24"]
vpc_enable_nat_gateway                = true
vpc_single_nat_gateway                = true
```

#### EKS Configuration (`eks.auto.tfvars`)

```hcl
cluster_name                         = "eksdemo1"
cluster_version                      = "1.31"
cluster_service_ipv4_cidr           = "172.20.0.0/16"
cluster_endpoint_public_access       = true
cluster_endpoint_private_access      = false
```

#### EBS CSI Driver (`ebs-terraform-manifests/terraform.tfvars`)

```hcl
aws_region       = "us-east-1"
environment      = "dev"
business_divsion = "hr"
```

### Backend Configuration

Both modules use S3 backend with state locking:

```hcl
backend "s3" {
  bucket         = "terraform-on-aws-eks-381492238320"
  key            = "dev/eks-cluster/terraform.tfstate"  # or dev/ebs-storage/terraform.tfstate
  region         = "us-east-1"
  dynamodb_table = "dev-ekscluster"  # or dev-ebs-storage
}
```

## 📤 Outputs

### EKS Cluster Outputs

After deployment, you'll receive:

- `cluster_id` - EKS cluster name
- `cluster_endpoint` - Kubernetes API endpoint
- `cluster_certificate_authority_data` - Certificate data for kubectl
- `aws_iam_openid_connect_provider_arn` - OIDC provider ARN
- `ec2_bastion_eip` - Bastion host public IP
- `vpc_id` - VPC identifier

### EBS CSI Driver Outputs

- `ebs_csi_iam_policy_arn` - IAM policy ARN
- `ebs_csi_iam_role_arn` - IAM role ARN for the CSI driver
- `ebs_csi_helm_metadata` - Helm release metadata

## 🧪 Testing EBS CSI Driver

Create a test PVC and pod:

```yaml
# storage-class.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ebs-sc
provisioner: ebs.csi.aws.com
volumeBindingMode: WaitForFirstConsumer
parameters:
  type: gp3
  encrypted: "true"

---
# pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ebs-claim
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: ebs-sc
  resources:
    requests:
      storage: 4Gi

---
# pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: app
spec:
  containers:
  - name: app
    image: nginx
    volumeMounts:
    - name: persistent-storage
      mountPath: /data
  volumes:
  - name: persistent-storage
    persistentVolumeClaim:
      claimName: ebs-claim
```

Apply and verify:

```bash
kubectl apply -f storage-class.yaml
kubectl apply -f pvc.yaml
kubectl apply -f pod.yaml

kubectl get pvc
kubectl get pv
kubectl get pods
```

## 🗑️ Clean Up

To destroy all resources:

```bash
# 1. Delete EBS CSI Driver
cd ebs-terraform-manifests
terraform destroy -auto-approve

# 2. Delete EKS Cluster and VPC
cd ../ekscluster-terraform-manifests
terraform destroy -auto-approve
```

**Important:** Ensure all Kubernetes resources (LoadBalancers, PVCs) are deleted before running `terraform destroy` to avoid orphaned AWS resources.

## 🔧 Troubleshooting

### Common Issues

#### 1. EBS CSI Driver Pods Not Starting

```bash
# Check pod logs
kubectl logs -n kube-system -l app=ebs-csi-controller

# Verify IAM role
kubectl describe sa ebs-csi-controller-sa -n kube-system
```

#### 2. PVC Stuck in Pending

```bash
# Check storage class
kubectl get sc

# Check PVC events
kubectl describe pvc <pvc-name>

# Verify EBS CSI driver is running
kubectl get pods -n kube-system | grep ebs-csi
```

#### 3. Node Group Issues

```bash
# Check node status
kubectl get nodes

# View node group in AWS console
aws eks describe-nodegroup --cluster-name hr-dev-eksdemo1 --nodegroup-name <nodegroup-name>
```

#### 4. Bastion Connection Issues

```bash
# Check security group
aws ec2 describe-security-groups --group-ids <sg-id>

# Test SSH connection
ssh -i terraform-key.pem ec2-user@<bastion-eip>
```

### Logs and Debugging

```bash
# EKS cluster logs
aws eks describe-cluster --name hr-dev-eksdemo1

# Terraform debug mode
export TF_LOG=DEBUG
terraform apply

# Kubernetes events
kubectl get events --all-namespaces --sort-by='.lastTimestamp'
```

