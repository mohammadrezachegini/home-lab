# AWS EKS Cluster with IAM Role-Based Access Control

This Terraform project provisions a complete AWS EKS (Elastic Kubernetes Service) cluster infrastructure with comprehensive IAM-based authentication and authorization for cluster administrators.

## 🏗️ Architecture Overview

This solution creates:
- **VPC Infrastructure**: Custom VPC with public, private, and database subnets across multiple availability zones
- **EKS Cluster**: Fully managed Kubernetes cluster with OIDC provider integration
- **Node Groups**: Public node group with auto-scaling capabilities
- **Bastion Host**: EC2 instance for secure cluster access
- **IAM Integration**: Multiple access patterns using IAM users, groups, and roles
- **RBAC Configuration**: Kubernetes ConfigMap for AWS authentication

## 📋 Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.0
- SSH key pair created in AWS (named `terraform-key` by default)
- S3 bucket for Terraform state storage
- DynamoDB table for state locking

## 🔑 IAM Access Patterns

This project demonstrates three different IAM-based access patterns:

### 1. Admin User (eksadmin1)
- **Type**: IAM User with direct permissions
- **AWS Access**: Full AdministratorAccess
- **K8s Access**: system:masters (via aws-auth ConfigMap)
- **Use Case**: Full administrative access to both AWS and Kubernetes

### 2. Basic User (eksadmin2)
- **Type**: IAM User with limited permissions
- **AWS Access**: EKS-specific permissions only (eks:*, iam:ListRoles, ssm:GetParameter)
- **K8s Access**: system:masters (via aws-auth ConfigMap)
- **Use Case**: Kubernetes-focused admin without broad AWS console access

### 3. EKS Admin via Role Assumption (eksadmin3)
- **Type**: IAM User + IAM Group + IAM Role
- **AWS Access**: Can assume `eks-admin-role` which has EKS permissions
- **K8s Access**: system:masters (via aws-auth ConfigMap)
- **Use Case**: Enterprise pattern using role assumption for temporary credentials

## 📁 Project Structure

```
ekscluster-terraform-manifests/
├── c1-versions.tf                    # Terraform & provider versions, S3 backend
├── c2-01-generic-variables.tf        # Generic variables (region, environment)
├── c2-02-local-values.tf             # Local values and common tags
├── c3-01-vpc-variables.tf            # VPC configuration variables
├── c3-02-vpc-module.tf               # VPC module configuration
├── c3-03-vpc-outputs.tf              # VPC outputs
├── c4-01-ec2bastion-variables.tf    # Bastion host variables
├── c4-02-ec2bastion-outputs.tf      # Bastion host outputs
├── c4-03-ec2bastion-securitygroups.tf # Bastion security group
├── c4-04-ami-datasource.tf          # Amazon Linux 2 AMI data source
├── c4-05-ec2bastion-instance.tf     # Bastion EC2 instance
├── c4-06-ec2bastion-elasticip.tf    # Elastic IP for bastion
├── c4-07-ec2bastion-provisioners.tf # Provisioners for bastion setup
├── c5-01-eks-variables.tf            # EKS cluster variables
├── c5-02-eks-outputs.tf              # EKS cluster outputs
├── c5-03-iamrole-for-eks-cluster.tf # EKS cluster IAM role
├── c5-04-iamrole-for-eks-nodegroup.tf # Node group IAM role
├── c5-06-eks-cluster.tf              # EKS cluster resource
├── c5-07-eks-node-group-public.tf   # Public node group
├── c6-01-iam-oidc-connect-provider-variables.tf # OIDC variables
├── c6-02-iam-oidc-connect-provider.tf # OIDC provider setup
├── c7-01-kubernetes-provider.tf      # Kubernetes provider config
├── c7-02-kubernetes-configmap.tf     # aws-auth ConfigMap
├── c8-01-iam-admin-user.tf           # Admin IAM user
├── c8-02-iam-basic-user.tf           # Basic IAM user
├── c9-01-iam-role-eksadmins.tf      # EKS admin IAM role
├── c9-02-iam-group-and-user-eksadmins.tf # IAM group and user
├── terraform.tfvars                  # Generic variable values
├── vpc.auto.tfvars                   # VPC variable values
├── eks.auto.tfvars                   # EKS variable values
└── ec2bastion.auto.tfvars           # Bastion variable values
```

## 🚀 Deployment

### Step 1: Configure Backend

Update the S3 backend configuration in `c1-versions.tf`:

```hcl
backend "s3" {
  bucket = "your-terraform-state-bucket"
  key    = "dev/eks-cluster/terraform.tfstate"
  region = "us-east-1"
  dynamodb_table = "your-lock-table"
}
```

### Step 2: Update Variables

Edit the `.tfvars` files according to your requirements:

**terraform.tfvars**:
```hcl
aws_region = "us-east-1"
environment = "dev"
business_divsion = "hr"
```

**eks.auto.tfvars**:
```hcl
cluster_name = "eksdemo1"
cluster_version = "1.30"
cluster_service_ipv4_cidr = "172.20.0.0/16"
```

### Step 3: Initialize and Deploy

```bash
# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the configuration
terraform apply
```

### Step 4: Configure kubectl

```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name hr-dev-eksdemo1

# Verify cluster access
kubectl get nodes
kubectl get pods -A
```

## 🔐 Accessing the Cluster

### Using IAM User Credentials

```bash
# Configure AWS CLI with IAM user credentials
aws configure --profile eksadmin1

# Update kubeconfig
aws eks update-kubeconfig \
  --region us-east-1 \
  --name hr-dev-eksdemo1 \
  --profile eksadmin1

# Access cluster
kubectl get nodes
```

### Using IAM Role (Role Assumption)

```bash
# Assume the EKS admin role
aws sts assume-role \
  --role-arn arn:aws:iam::ACCOUNT_ID:role/hr-dev-eks-admin-role \
  --role-session-name eks-admin-session \
  --profile eksadmin3

# Export temporary credentials
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."

# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name hr-dev-eksdemo1

# Access cluster
kubectl get nodes
```

## 📊 Key Features

### Network Architecture
- **Public Subnets**: 10.0.101.0/24, 10.0.102.0/24
- **Private Subnets**: 10.0.1.0/24, 10.0.2.0/24
- **Database Subnets**: 10.0.151.0/24, 10.0.152.0/24
- **NAT Gateway**: Single NAT gateway for cost optimization
- **Availability Zones**: us-east-1a, us-east-1b

### EKS Configuration
- **Version**: Kubernetes 1.30
- **Node Type**: t3.medium (ON_DEMAND)
- **Scaling**: Min 1, Desired 1, Max 2
- **Logging**: All control plane logs enabled
- **Access**: Public API endpoint (can be customized)

### Security Features
- SSH access to bastion host with key-based authentication
- Private key provisioned to bastion for node access
- Security groups limiting bastion access
- OIDC provider for IAM Roles for Service Accounts (IRSA)

## 🗑️ Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: Ensure all Kubernetes resources (LoadBalancers, PVCs) are deleted before destroying the infrastructure to avoid orphaned AWS resources.

## 📝 Important Notes

1. **SSH Key**: Ensure `terraform-key` exists in AWS EC2 Key Pairs
2. **Private Key**: Place `terraform-key.pem` in `private-key/` directory for bastion provisioning
3. **State Management**: S3 backend requires pre-existing bucket and DynamoDB table
4. **Costs**: Running this infrastructure incurs AWS charges (EKS, EC2, NAT Gateway)
5. **Node Groups**: Private node group configuration is commented out but available

## 🔧 Customization

### Change Cluster Version
Edit `eks.auto.tfvars`:
```hcl
cluster_version = "1.31"
```

### Add Private Node Group
Uncomment the configuration in `c5-08-eks-node-group-private.tf`

### Modify Network CIDR
Edit `vpc.auto.tfvars` to change subnet ranges

### Enable Private API Endpoint
Edit `eks.auto.tfvars`:
```hcl
cluster_endpoint_private_access = true
cluster_endpoint_public_access = false
```
