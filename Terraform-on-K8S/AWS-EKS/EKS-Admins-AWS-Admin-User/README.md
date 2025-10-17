# AWS EKS Cluster with Terraform - IAM Users Authentication

This Terraform project provisions a complete AWS EKS (Elastic Kubernetes Service) cluster with VPC infrastructure, bastion host, and IAM user-based authentication for cluster administration.

## 🏗️ Architecture Overview

This infrastructure creates:

- **VPC with Public and Private Subnets** across 2 availability zones
- **EKS Cluster** (Kubernetes 1.30) with public API endpoint
- **Public Node Group** with auto-scaling (1-2 t3.medium instances)
- **Bastion Host** (t3.micro) in public subnet for secure access
- **IAM Users** with EKS cluster access via aws-auth ConfigMap
- **OIDC Provider** for IAM Roles for Service Accounts (IRSA)

## 📋 Prerequisites

- **Terraform** >= 1.0
- **AWS CLI** configured with credentials
- **kubectl** for Kubernetes management
- **AWS Account** with appropriate permissions
- **SSH Key Pair** named `terraform-key` in your AWS account

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ekscluster-terraform-manifests
```

### 2. Configure AWS Credentials

```bash
aws configure --profile default
```

### 3. Create S3 Backend

```bash
# Create S3 bucket for Terraform state
aws s3 mb s3://terraform-on-aws-eks-381492238320 --region us-east-1

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name dev-ekscluster \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

### 4. Add SSH Private Key

```bash
mkdir -p private-key
# Copy your terraform-key.pem to private-key/ directory
chmod 400 private-key/terraform-key.pem
```

### 5. Initialize Terraform

```bash
terraform init
```

### 6. Review and Apply

```bash
terraform plan
terraform apply -auto-approve
```

## 📁 Project Structure

```
ekscluster-terraform-manifests/
├── c1-versions.tf                              # Terraform and provider versions
├── c2-01-generic-variables.tf                  # Generic variables (region, env, business division)
├── c2-02-local-values.tf                       # Local values for naming and tagging
├── c3-01-vpc-variables.tf                      # VPC configuration variables
├── c3-02-vpc-module.tf                         # VPC module configuration
├── c3-03-vpc-outputs.tf                        # VPC outputs
├── c4-01-ec2bastion-variables.tf               # Bastion host variables
├── c4-02-ec2bastion-outputs.tf                 # Bastion host outputs
├── c4-03-ec2bastion-securitygroups.tf          # Security group for bastion
├── c4-04-ami-datasource.tf                     # Amazon Linux 2 AMI datasource
├── c4-05-ec2bastion-instance.tf                # Bastion host EC2 instance
├── c4-06-ec2bastion-elasticip.tf               # Elastic IP for bastion
├── c4-07-ec2bastion-provisioners.tf            # File and remote provisioners
├── c5-01-eks-variables.tf                      # EKS cluster variables
├── c5-02-eks-outputs.tf                        # EKS cluster outputs
├── c5-03-iamrole-for-eks-cluster.tf           # IAM role for EKS control plane
├── c5-04-iamrole-for-eks-nodegroup.tf         # IAM role for EKS worker nodes
├── c5-06-eks-cluster.tf                        # EKS cluster resource
├── c5-07-eks-node-group-public.tf             # Public node group configuration
├── c6-01-iam-oidc-connect-provider-variables.tf # OIDC provider variables
├── c6-02-iam-oidc-connect-provider.tf         # OIDC provider for IRSA
├── c7-01-kubernetes-provider.tf                # Kubernetes provider configuration
├── c7-02-kubernetes-configmap.tf               # aws-auth ConfigMap
├── c8-01-iam-admin-user.tf                     # Admin IAM user with full access
├── c8-02-iam-basic-user.tf                     # Basic IAM user with EKS access
├── terraform.tfvars                            # Main variable values
├── vpc.auto.tfvars                             # VPC variable values
├── eks.auto.tfvars                             # EKS variable values
└── ec2bastion.auto.tfvars                      # Bastion variable values
```

## ⚙️ Configuration

### Default Configuration

The project uses the following defaults (can be overridden in `.tfvars` files):

**Network:**
- Region: `us-east-1`
- VPC CIDR: `10.0.0.0/16`
- Public Subnets: `10.0.101.0/24`, `10.0.102.0/24`
- Private Subnets: `10.0.1.0/24`, `10.0.2.0/24`

**EKS Cluster:**
- Name: `hr-dev-eksdemo1`
- Version: `1.30`
- Service CIDR: `172.20.0.0/16`
- Node Group: 1-2 t3.medium instances

**IAM Users:**
- Admin User: `hr-dev-eksadmin1` (Full AWS access)
- Basic User: `hr-dev-eksadmin2` (EKS-only access)

### Customization

Edit the `.tfvars` files to customize:

**terraform.tfvars** - General settings:
```hcl
aws_region = "us-east-1"
environment = "dev"
business_divsion = "hr"
```

**vpc.auto.tfvars** - VPC settings:
```hcl
vpc_cidr_block = "10.0.0.0/16"
vpc_enable_nat_gateway = true
vpc_single_nat_gateway = true
```

**eks.auto.tfvars** - EKS settings:
```hcl
cluster_name = "eksdemo1"
cluster_version = "1.30"
```

## 🔐 IAM User Access

### Configure kubectl for IAM Users

After deployment, configure kubectl access for the IAM users:

**For Admin User:**
```bash
aws configure --profile eksadmin1
# Enter Access Key and Secret Key for hr-dev-eksadmin1

aws eks update-kubeconfig \
  --region us-east-1 \
  --name hr-dev-eksdemo1 \
  --profile eksadmin1
```

**For Basic User:**
```bash
aws configure --profile eksadmin2
# Enter Access Key and Secret Key for hr-dev-eksadmin2

aws eks update-kubeconfig \
  --region us-east-1 \
  --name hr-dev-eksdemo1 \
  --profile eksadmin2
```

### Verify Access

```bash
kubectl get nodes
kubectl get pods -A
```

## 🔧 Common Operations

### Access Bastion Host

```bash
# Get Bastion EIP from output
terraform output ec2_bastion_eip

# SSH to bastion
ssh -i private-key/terraform-key.pem ec2-user@<bastion-eip>
```

### Update Node Group Size

Edit `c5-07-eks-node-group-public.tf`:
```hcl
scaling_config {
  desired_size = 2
  min_size     = 1    
  max_size     = 3
}
```

Then apply:
```bash
terraform apply
```

### Enable Cluster Logging

Control plane logging is already enabled for:
- API server
- Audit
- Authenticator
- Controller Manager
- Scheduler

View logs in CloudWatch Logs console.

## 📊 Outputs

After successful deployment, you'll get:

```
cluster_endpoint          - EKS API endpoint
cluster_id               - EKS cluster name
vpc_id                   - VPC ID
ec2_bastion_eip          - Bastion host public IP
account_id               - AWS account ID
aws_iam_openid_connect_provider_arn - OIDC provider ARN
```

View outputs:
```bash
terraform output
```

## 🧹 Cleanup

To destroy all resources:

```bash
terraform destroy -auto-approve
```

**Note:** Ensure all Kubernetes resources (LoadBalancers, PVCs) are deleted before destroying to avoid orphaned AWS resources.

## 🔒 Security Considerations

1. **Bastion Host** - SSH access is open to `0.0.0.0/0`. Restrict to your IP:
   ```hcl
   ingress_cidr_blocks = ["YOUR_IP/32"]
   ```

2. **EKS API Endpoint** - Public access is enabled. For production, enable private access:
   ```hcl
   cluster_endpoint_private_access = true
   cluster_endpoint_public_access = false
   ```

3. **Node Group SSH Key** - Stored in `private-key/`. Never commit to Git.

4. **IAM User Credentials** - Create access keys securely via AWS Console.

## 🐛 Troubleshooting

### Issue: Unable to connect to EKS cluster

**Solution:** Ensure aws-auth ConfigMap is properly configured:
```bash
kubectl get configmap aws-auth -n kube-system -o yaml
```

### Issue: Nodes not joining cluster

**Solution:** Check IAM role and security groups:
```bash
kubectl get nodes
aws eks describe-nodegroup --cluster-name hr-dev-eksdemo1 --nodegroup-name hr-dev-eks-ng-public
```

### Issue: Terraform state locked

**Solution:** Unlock DynamoDB state:
```bash
terraform force-unlock <lock-id>
```

## 📚 Resources

- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform EKS Module](https://registry.terraform.io/modules/terraform-aws-modules/eks/aws/latest)
