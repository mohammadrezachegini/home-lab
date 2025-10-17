# AWS EKS Cluster with Terraform - IAM Users Authentication

![Terraform](https://img.shields.io/badge/Terraform-1.0+-623CE4?logo=terraform&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-EKS-FF9900?logo=amazon-aws&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-1.30-326CE5?logo=kubernetes&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)

A production-ready Terraform project that provisions a complete AWS EKS (Elastic Kubernetes Service) cluster with VPC infrastructure, bastion host, and IAM user-based authentication for cluster administration.

## 🏗️ Architecture Overview

This infrastructure creates:

- **VPC with Public and Private Subnets** across 2 availability zones
- **EKS Cluster** (Kubernetes 1.30) with public API endpoint
- **Public Node Group** with auto-scaling (1-2 t3.medium instances)
- **Bastion Host** (t3.micro) in public subnet for secure access
- **IAM Users** with EKS cluster access via aws-auth ConfigMap
- **OIDC Provider** for IAM Roles for Service Accounts (IRSA)
- **Remote State Management** using S3 and DynamoDB

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          AWS Cloud                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    VPC (10.0.0.0/16)                       │  │
│  │                                                             │  │
│  │  ┌──────────────────┐         ┌──────────────────┐        │  │
│  │  │  Public Subnet   │         │  Public Subnet   │        │  │
│  │  │   us-east-1a     │         │   us-east-1b     │        │  │
│  │  │  10.0.101.0/24   │         │  10.0.102.0/24   │        │  │
│  │  │                  │         │                  │        │  │
│  │  │ ┌──────────────┐ │         │ ┌──────────────┐ │        │  │
│  │  │ │Bastion Host  │ │         │ │  EKS Nodes   │ │        │  │
│  │  │ │  (t3.micro)  │ │         │ │  (t3.medium) │ │        │  │
│  │  │ └──────────────┘ │         │ └──────────────┘ │        │  │
│  │  └──────────────────┘         └──────────────────┘        │  │
│  │           │                            │                    │  │
│  │  ┌────────┴────────┐         ┌────────┴────────┐          │  │
│  │  │ Private Subnet  │         │ Private Subnet  │          │  │
│  │  │   us-east-1a    │         │   us-east-1b    │          │  │
│  │  │  10.0.1.0/24    │         │  10.0.2.0/24    │          │  │
│  │  └─────────────────┘         └─────────────────┘          │  │
│  │                                                             │  │
│  │  ┌─────────────────────────────────────────────┐          │  │
│  │  │         EKS Control Plane                    │          │  │
│  │  │      (Managed by AWS)                        │          │  │
│  │  └─────────────────────────────────────────────┘          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │  IAM Users    │  │ OIDC Provider │  │  CloudWatch   │       │
│  │  Authentication│  │  for IRSA     │  │  Logs         │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## ✨ Features

- **Infrastructure as Code**: Complete infrastructure defined in Terraform
- **High Availability**: Multi-AZ deployment with auto-scaling
- **Secure Access**: Bastion host for secure SSH access to private resources
- **IAM Authentication**: Two-tier user access (Admin and Basic)
- **IRSA Support**: OIDC provider for Kubernetes service account IAM roles
- **Control Plane Logging**: Comprehensive logging to CloudWatch
- **Remote State**: S3 backend with DynamoDB state locking
- **Modular Design**: Clean, reusable Terraform modules

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Terraform](https://www.terraform.io/downloads.html) >= 1.0
- [AWS CLI](https://aws.amazon.com/cli/) configured with credentials
- [kubectl](https://kubernetes.io/docs/tasks/tools/) for Kubernetes management
- AWS Account with appropriate permissions
- SSH Key Pair named `terraform-key` in your AWS account

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/eks-terraform-infrastructure.git
cd eks-terraform-infrastructure/ekscluster-terraform-manifests
```

### 2. Configure AWS Credentials

```bash
aws configure --profile default
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (us-east-1)
# Enter your default output format (json)
```

### 3. Create S3 Backend for Terraform State

```bash
# Create S3 bucket for Terraform state
aws s3 mb s3://terraform-on-aws-eks-381492238320 --region us-east-1

# Enable versioning on the bucket
aws s3api put-bucket-versioning \
  --bucket terraform-on-aws-eks-381492238320 \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name dev-ekscluster \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

### 4. Prepare SSH Key

```bash
# Create directory for private key
mkdir -p private-key

# Copy your existing terraform-key.pem or create a new one via AWS Console
# Then copy it to the private-key directory
cp ~/Downloads/terraform-key.pem private-key/

# Set correct permissions
chmod 400 private-key/terraform-key.pem
```

### 5. Initialize Terraform

```bash
terraform init
```

### 6. Review Configuration

```bash
# Review the execution plan
terraform plan
```

### 7. Deploy Infrastructure

```bash
# Apply the configuration
terraform apply

# Or auto-approve to skip confirmation
terraform apply -auto-approve
```

**Deployment Time**: Approximately 15-20 minutes

## 📁 Project Structure

```
ekscluster-terraform-manifests/
├── c1-versions.tf                              # Terraform and provider versions
├── c2-01-generic-variables.tf                  # Generic variables
├── c2-02-local-values.tf                       # Local values for naming/tagging
├── c3-01-vpc-variables.tf                      # VPC configuration variables
├── c3-02-vpc-module.tf                         # VPC module configuration
├── c3-03-vpc-outputs.tf                        # VPC outputs
├── c4-01-ec2bastion-variables.tf               # Bastion host variables
├── c4-02-ec2bastion-outputs.tf                 # Bastion host outputs
├── c4-03-ec2bastion-securitygroups.tf          # Bastion security group
├── c4-04-ami-datasource.tf                     # Amazon Linux 2 AMI
├── c4-05-ec2bastion-instance.tf                # Bastion EC2 instance
├── c4-06-ec2bastion-elasticip.tf               # Elastic IP for bastion
├── c4-07-ec2bastion-provisioners.tf            # Provisioners
├── c5-01-eks-variables.tf                      # EKS cluster variables
├── c5-02-eks-outputs.tf                        # EKS cluster outputs
├── c5-03-iamrole-for-eks-cluster.tf           # IAM role for control plane
├── c5-04-iamrole-for-eks-nodegroup.tf         # IAM role for worker nodes
├── c5-06-eks-cluster.tf                        # EKS cluster resource
├── c5-07-eks-node-group-public.tf             # Public node group
├── c6-01-iam-oidc-connect-provider-variables.tf # OIDC provider variables
├── c6-02-iam-oidc-connect-provider.tf         # OIDC provider for IRSA
├── c7-01-kubernetes-provider.tf                # Kubernetes provider config
├── c7-02-kubernetes-configmap.tf               # aws-auth ConfigMap
├── c8-01-iam-admin-user.tf                     # Admin IAM user
├── c8-02-iam-basic-user.tf                     # Basic IAM user
├── terraform.tfvars                            # Main variable values
├── vpc.auto.tfvars                             # VPC variable values
├── eks.auto.tfvars                             # EKS variable values
├── ec2bastion.auto.tfvars                      # Bastion variable values
└── private-key/                                # SSH keys (gitignored)
    └── terraform-key.pem
```

## ⚙️ Configuration

### Default Configuration Values

**Network Configuration:**
```hcl
aws_region         = "us-east-1"
vpc_cidr_block     = "10.0.0.0/16"
vpc_public_subnets = ["10.0.101.0/24", "10.0.102.0/24"]
vpc_private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
```

**EKS Configuration:**
```hcl
cluster_name               = "hr-dev-eksdemo1"
cluster_version            = "1.30"
cluster_service_ipv4_cidr  = "172.20.0.0/16"
node_instance_types        = ["t3.medium"]
node_desired_size          = 1
node_min_size              = 1
node_max_size              = 2
```

**IAM Users:**
- **Admin User**: `hr-dev-eksadmin1` (Full AWS + EKS access)
- **Basic User**: `hr-dev-eksadmin2` (EKS-only access)

### Customizing Configuration

Edit the appropriate `.tfvars` files:

**terraform.tfvars** - General settings:
```hcl
aws_region       = "us-east-1"
environment      = "dev"
business_divsion = "hr"
```

**vpc.auto.tfvars** - VPC settings:
```hcl
vpc_name                  = "myvpc"
vpc_cidr_block            = "10.0.0.0/16"
vpc_enable_nat_gateway    = true
vpc_single_nat_gateway    = true
```

**eks.auto.tfvars** - EKS settings:
```hcl
cluster_name                         = "eksdemo1"
cluster_version                      = "1.30"
cluster_endpoint_public_access       = true
cluster_endpoint_private_access      = false
```

## 🔐 Configure kubectl Access

### For Admin User (Full Access)

```bash
# Configure AWS CLI profile
aws configure --profile eksadmin1
# Enter Access Key ID: (from AWS Console)
# Enter Secret Access Key: (from AWS Console)

# Update kubeconfig
aws eks update-kubeconfig \
  --region us-east-1 \
  --name hr-dev-eksdemo1 \
  --profile eksadmin1

# Verify access
kubectl get nodes
kubectl get pods -A
```

### For Basic User (EKS-Only Access)

```bash
# Configure AWS CLI profile
aws configure --profile eksadmin2

# Update kubeconfig
aws eks update-kubeconfig \
  --region us-east-1 \
  --name hr-dev-eksdemo1 \
  --profile eksadmin2

# Verify access
kubectl get nodes
```

## 🔧 Common Operations

### Access Bastion Host

```bash
# Get Bastion EIP from Terraform output
terraform output ec2_bastion_eip

# SSH to bastion
ssh -i private-key/terraform-key.pem ec2-user@<bastion-eip>

# From bastion, you can access private resources
```

### Scale Node Group

Edit `c5-07-eks-node-group-public.tf`:

```hcl
scaling_config {
  desired_size = 3  # Change from 1 to 3
  min_size     = 1    
  max_size     = 5  # Increase max
}
```

Apply changes:
```bash
terraform apply -target=aws_eks_node_group.eks_ng_public
```

### View Cluster Logs

```bash
# List log groups
aws logs describe-log-groups \
  --log-group-name-prefix /aws/eks/hr-dev-eksdemo1 \
  --region us-east-1

# Tail API server logs
aws logs tail /aws/eks/hr-dev-eksdemo1/cluster --follow
```

### Update Kubernetes Version

Update `eks.auto.tfvars`:
```hcl
cluster_version = "1.31"
```

Apply:
```bash
terraform apply
```

## 📊 Outputs

After successful deployment:

```bash
terraform output
```

**Available Outputs:**
- `cluster_id` - EKS cluster name
- `cluster_endpoint` - Kubernetes API endpoint
- `cluster_version` - Kubernetes version
- `vpc_id` - VPC identifier
- `ec2_bastion_eip` - Bastion host public IP
- `aws_iam_openid_connect_provider_arn` - OIDC provider ARN
- `account_id` - AWS account ID

## 🧪 Testing

### Verify Cluster Functionality

```bash
# Check cluster status
kubectl cluster-info

# Check nodes
kubectl get nodes -o wide

# Deploy test application
kubectl create deployment nginx --image=nginx
kubectl expose deployment nginx --port=80 --type=LoadBalancer

# Verify deployment
kubectl get pods
kubectl get svc
```

### Cleanup Test Resources

```bash
kubectl delete svc nginx
kubectl delete deployment nginx
```

## 🔒 Security Best Practices

### 1. Restrict Bastion Access

Edit `c4-03-ec2bastion-securitygroups.tf`:

```hcl
module "public_bastion_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "5.2.0"

  name = "${local.name}-public-bastion-sg"
  vpc_id = module.vpc.vpc_id
  
  ingress_rules = ["ssh-tcp"]
  ingress_cidr_blocks = ["YOUR_IP_ADDRESS/32"]  # Change this!
  
  egress_rules = ["all-all"]
}
```

### 2. Enable Private API Endpoint

For production, enable private endpoint:

```hcl
cluster_endpoint_private_access = true
cluster_endpoint_public_access  = false
```

### 3. Rotate IAM Credentials

Regularly rotate access keys for IAM users:

```bash
aws iam create-access-key --user-name hr-dev-eksadmin1
aws iam delete-access-key --user-name hr-dev-eksadmin1 --access-key-id <old-key-id>
```

### 4. Enable Encryption

Add encryption at rest for EKS secrets (requires KMS key).

### 5. Network Policies

Implement Kubernetes network policies for pod-to-pod communication control.

## 🐛 Troubleshooting

### Issue: Unable to connect to EKS cluster

**Error**: `error: You must be logged in to the server (Unauthorized)`

**Solution**:
```bash
# Verify aws-auth ConfigMap
kubectl get configmap aws-auth -n kube-system -o yaml

# Reconfigure kubectl
aws eks update-kubeconfig --region us-east-1 --name hr-dev-eksdemo1
```

### Issue: Nodes not joining cluster

**Solution**:
```bash
# Check node group status
aws eks describe-nodegroup \
  --cluster-name hr-dev-eksdemo1 \
  --nodegroup-name hr-dev-eks-ng-public

# Check CloudWatch logs
aws logs tail /aws/eks/hr-dev-eksdemo1/cluster --follow
```

### Issue: Terraform state locked

**Error**: `Error: Error locking state`

**Solution**:
```bash
# Force unlock (use carefully!)
terraform force-unlock <lock-id>
```

### Issue: SSH connection refused to bastion

**Solution**:
```bash
# Verify security group
aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=*bastion*"

# Check instance status
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=*BastionHost*"
```

## 🧹 Cleanup

To destroy all resources:

```bash
# Delete all Kubernetes resources first
kubectl delete all --all -A

# Wait for LoadBalancers to be deleted
kubectl get svc -A

# Destroy Terraform infrastructure
terraform destroy

# Or auto-approve
terraform destroy -auto-approve
```

**⚠️ Important**: Ensure all Kubernetes LoadBalancers and PersistentVolumeClaims are deleted before running `terraform destroy` to avoid orphaned AWS resources.

