# AWS EKS Cluster with Terraform - IAM Admin Users

A production-ready Terraform infrastructure-as-code project for deploying an Amazon EKS (Elastic Kubernetes Service) cluster with VPC networking, bastion host, and IAM user management for cluster administration.

## 🏗️ Architecture Overview

This Terraform project provisions:

- **VPC Infrastructure**: Custom VPC with public, private, and database subnets across multiple availability zones
- **EKS Cluster**: Fully managed Kubernetes cluster with configurable version and networking
- **Node Groups**: Public node group with auto-scaling capabilities
- **Bastion Host**: EC2 instance in public subnet for secure cluster access
- **IAM Integration**: OIDC provider for service accounts and IAM users for cluster administration
- **Security Groups**: Configured for bastion host and EKS cluster access

## 📋 Prerequisites

- AWS CLI installed and configured
- Terraform >= 1.0 installed
- kubectl installed for Kubernetes management
- An AWS account with appropriate permissions
- SSH key pair created in AWS (default: `terraform-key`)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ekscluster-terraform-manifests
```

### 2. Configure Variables

Update the `.tfvars` files according to your requirements:

**`terraform.tfvars`** - Core settings:
```hcl
aws_region = "us-east-1"
environment = "dev"
business_divsion = "hr"
```

**`vpc.auto.tfvars`** - VPC configuration:
```hcl
vpc_name = "myvpc"
vpc_cidr_block = "10.0.0.0/16"
vpc_public_subnets = ["10.0.101.0/24", "10.0.102.0/24"]
vpc_private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
```

**`eks.auto.tfvars`** - EKS cluster settings:
```hcl
cluster_name = "eksdemo1"
cluster_version = "1.30"
cluster_endpoint_public_access = true
```

### 3. Set Up Backend

Ensure the S3 bucket and DynamoDB table exist for state management:

```bash
# Create S3 bucket for state
aws s3 mb s3://terraform-on-aws-eks-381492238320

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name dev-ekscluster \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

### 4. Add SSH Private Key

Place your private key in the `private-key/` directory:

```bash
mkdir -p private-key
cp /path/to/terraform-key.pem private-key/
chmod 400 private-key/terraform-key.pem
```

### 5. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Review the execution plan
terraform plan

# Apply the configuration
terraform apply
```

## 📁 Project Structure

```
ekscluster-terraform-manifests/
├── c1-versions.tf                          # Terraform and provider versions
├── c2-01-generic-variables.tf             # Generic variables (region, environment)
├── c2-02-local-values.tf                   # Local values for naming and tags
├── c3-01-vpc-variables.tf                  # VPC input variables
├── c3-02-vpc-module.tf                     # VPC module configuration
├── c3-03-vpc-outputs.tf                    # VPC output values
├── c4-01-ec2bastion-variables.tf           # Bastion host variables
├── c4-02-ec2bastion-outputs.tf             # Bastion host outputs
├── c4-03-ec2bastion-securitygroups.tf      # Bastion security group
├── c4-04-ami-datasource.tf                 # Amazon Linux 2 AMI data source
├── c4-05-ec2bastion-instance.tf            # Bastion EC2 instance
├── c4-06-ec2bastion-elasticip.tf           # Elastic IP for bastion
├── c4-07-ec2bastion-provisioners.tf        # Provisioners for key management
├── c5-01-eks-variables.tf                  # EKS cluster variables
├── c5-02-eks-outputs.tf                    # EKS cluster outputs
├── c5-03-iamrole-for-eks-cluster.tf        # IAM role for EKS control plane
├── c5-04-iamrole-for-eks-nodegroup.tf      # IAM role for worker nodes
├── c5-05-securitygroups-eks.tf             # EKS security groups (placeholder)
├── c5-06-eks-cluster.tf                    # EKS cluster resource
├── c5-07-eks-node-group-public.tf          # Public node group
├── c5-08-eks-node-group-private.tf         # Private node group (commented)
├── c6-01-iam-oidc-connect-provider-variables.tf  # OIDC variables
├── c6-02-iam-oidc-connect-provider.tf      # OIDC provider for IRSA
├── c7-01-kubernetes-provider.tf            # Kubernetes provider config
├── c7-02-kubernetes-configmap.tf           # aws-auth ConfigMap
├── c8-01-iam-admin-user.tf                 # Admin IAM user
├── c8-02-iam-basic-user.tf                 # Basic IAM user with EKS access
├── terraform.tfvars                        # Main variable values
├── vpc.auto.tfvars                         # VPC auto-loaded variables
├── eks.auto.tfvars                         # EKS auto-loaded variables
└── ec2bastion.auto.tfvars                  # Bastion auto-loaded variables
```

## 🔐 IAM Users and Access

The project creates two IAM users for EKS cluster management:

### Admin User (`hr-dev-eksadmin1`)
- Full AWS AdministratorAccess
- Full Kubernetes cluster access via system:masters group
- Can manage AWS resources and Kubernetes workloads

### Basic User (`hr-dev-eksadmin2`)
- Limited AWS console access
- EKS full access policy (read-only for AWS services)
- Full Kubernetes cluster access via system:masters group

### Configure kubectl Access

After deployment, configure kubectl for each user:

```bash
# Update kubeconfig
aws eks update-kubeconfig \
  --region us-east-1 \
  --name hr-dev-eksdemo1 \
  --profile <user-profile>

# Verify access
kubectl get nodes
kubectl get pods --all-namespaces
```

## 🌐 VPC Configuration

### Network Layout

- **VPC CIDR**: 10.0.0.0/16
- **Public Subnets**: 10.0.101.0/24, 10.0.102.0/24 (for load balancers, bastion)
- **Private Subnets**: 10.0.1.0/24, 10.0.2.0/24 (for worker nodes)
- **Database Subnets**: 10.0.151.0/24, 10.0.152.0/24 (for RDS if needed)
- **Availability Zones**: us-east-1a, us-east-1b
- **NAT Gateway**: Single NAT gateway for cost optimization

## 🎯 Key Features

### High Availability
- Multi-AZ deployment across 2 availability zones
- Auto-scaling node groups (min: 1, max: 2, desired: 1)

### Security
- Private API endpoint option available
- Security groups with least privilege access
- OIDC provider for IAM roles for service accounts (IRSA)
- SSH key-based access to bastion and nodes

### Observability
- EKS control plane logging enabled (api, audit, authenticator, controllerManager, scheduler)

### State Management
- Remote state stored in S3
- State locking with DynamoDB
- Versioned state file

## 📊 Outputs

After successful deployment, Terraform outputs include:

- VPC ID and CIDR block
- Public/Private subnet IDs
- NAT gateway public IPs
- EKS cluster endpoint
- EKS cluster certificate authority
- Bastion host Elastic IP
- OIDC provider ARN
- IAM role ARNs

View outputs:
```bash
terraform output
```

## 🛠️ Maintenance

### Update EKS Cluster Version

1. Update `cluster_version` in `eks.auto.tfvars`
2. Run `terraform plan` to review changes
3. Apply changes: `terraform apply`

### Scale Node Groups

Modify scaling configuration in `c5-07-eks-node-group-public.tf`:

```hcl
scaling_config {
  desired_size = 2
  min_size     = 1    
  max_size     = 4
}
```

### Destroy Infrastructure

```bash
# Destroy all resources
terraform destroy

# Destroy specific resources
terraform destroy -target=aws_eks_node_group.eks_ng_public
```

## 🐛 Troubleshooting

### Unable to connect to cluster
```bash
# Verify IAM user/role mapping
kubectl get configmap aws-auth -n kube-system -o yaml

# Check cluster status
aws eks describe-cluster --name hr-dev-eksdemo1 --region us-east-1
```

### Nodes not joining cluster
```bash
# SSH to bastion host
ssh -i private-key/terraform-key.pem ec2-user@<bastion-eip>

# From bastion, check node logs
ssh -i /tmp/terraform-key.pem ec2-user@<node-private-ip>
sudo journalctl -u kubelet
```

## 💰 Cost Optimization

- Single NAT gateway instead of one per AZ
- t3.micro for bastion host
- t3.medium for worker nodes
- Consider Spot instances for non-production
- Delete resources when not in use: `terraform destroy`

## 📝 Best Practices Implemented

- ✅ Infrastructure as Code with Terraform
- ✅ Remote state management with S3 and DynamoDB
- ✅ Modular structure for reusability
- ✅ Consistent naming and tagging strategy
- ✅ Security groups with minimal required access
- ✅ IAM roles with least privilege
- ✅ Multi-AZ deployment for high availability
- ✅ Separate subnets for different tiers

