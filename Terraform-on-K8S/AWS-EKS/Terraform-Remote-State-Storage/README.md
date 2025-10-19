# Terraform Remote State Storage for EKS

This project sets up remote state storage infrastructure for Terraform, enabling team collaboration and state locking for EKS deployments.

## Overview

This configuration creates the necessary AWS resources for storing Terraform state remotely:
- **S3 Bucket** for state file storage with versioning enabled
- **DynamoDB Table** for state locking to prevent concurrent modifications
- **Encryption** for secure state storage

## Architecture

```
Terraform State Management
├── S3 Bucket (with versioning)
│   └── Stores terraform.tfstate files
└── DynamoDB Table
    └── Manages state locks
```

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with credentials
- AWS Account with appropriate permissions

## What Gets Created

### S3 Bucket
- Versioning enabled for state history
- Server-side encryption
- Bucket policies for access control
- Lifecycle rules (optional)

### DynamoDB Table
- Table for state locking
- On-demand billing mode
- Primary key: LockID

## Usage

### 1. Deploy State Storage Infrastructure

```bash
cd ekscluster-terraform-manifests
terraform init
terraform apply
```

### 2. Configure Backend in Other Projects

After creating the infrastructure, configure your other Terraform projects to use remote state:

```hcl
terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "eks/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
```

### 3. Migrate Existing State (if applicable)

```bash
# In your existing project
terraform init -migrate-state
```

## Project Structure

```
├── ekscluster-terraform-manifests/
│   ├── c1-versions.tf              # Provider configuration
│   ├── c2-01-generic-variables.tf  # Generic variables
│   ├── c2-02-local-values.tf       # Local values
│   ├── c3-s3-bucket.tf             # S3 bucket for state
│   ├── c4-dynamodb-table.tf        # DynamoDB for locking
│   └── terraform.tfvars            # Variable values
└── k8sresources-terraform-manifests/
    └── (Kubernetes resources using remote state)
```

## Configuration

### Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS Region | us-east-1 |
| `environment` | Environment name | dev |
| `state_bucket_name` | S3 bucket name for state | - |

## Benefits of Remote State

1. **Team Collaboration** - Multiple team members can work together
2. **State Locking** - Prevents concurrent modifications
3. **State History** - Version control for infrastructure changes
4. **Security** - Encrypted state storage
5. **Backup** - Automatic versioning protects against accidental changes

## Best Practices

### Bucket Naming
- Use globally unique bucket names
- Include organization/project prefix
- Format: `{org}-{project}-terraform-state`

### Access Control
- Restrict bucket access to specific IAM roles
- Enable bucket versioning
- Enable MFA delete for production

### State Organization
- Use different state files for different environments
- Organize by project/component
- Use consistent key naming: `{env}/{project}/terraform.tfstate`

## Security Considerations

1. **Encryption** - Always enable encryption at rest
2. **Access Logs** - Enable S3 access logging
3. **IAM Policies** - Implement least privilege access
4. **MFA Delete** - Enable for production buckets
5. **Versioning** - Keep historical state versions

## Cost Considerations

- **S3 Storage**: ~$0.023 per GB/month
- **DynamoDB**: On-demand pricing (~$1.25 per million writes)
- **Typical Monthly Cost**: $1-5 for small teams

## Outputs

After deployment:
- S3 bucket name for backend configuration
- DynamoDB table name for state locking
- Bucket ARN and region

## Remote State Usage Example

### Project A (EKS Cluster)
```hcl
terraform {
  backend "s3" {
    bucket         = "myorg-eks-terraform-state"
    key            = "eks-cluster/prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
```

### Project B (EKS Add-ons) - Using Remote State Data Source
```hcl
data "terraform_remote_state" "eks" {
  backend = "s3"
  config = {
    bucket = "myorg-eks-terraform-state"
    key    = "eks-cluster/prod/terraform.tfstate"
    region = "us-east-1"
  }
}

# Reference EKS cluster outputs
resource "helm_release" "example" {
  cluster_name = data.terraform_remote_state.eks.outputs.cluster_id
}
```

## Troubleshooting

### State Lock Issues
```bash
# View current locks
aws dynamodb scan --table-name terraform-state-lock

# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

### Bucket Access Issues
```bash
# Verify bucket exists
aws s3 ls s3://your-bucket-name

# Check bucket policy
aws s3api get-bucket-policy --bucket your-bucket-name
```

### Migration Issues
```bash
# Backup current state before migration
terraform state pull > backup.tfstate

# Reconfigure backend
terraform init -reconfigure
```

## Cleanup

**Warning**: Only destroy if you're sure no projects are using this state storage!

```bash
# Empty S3 bucket first
aws s3 rm s3://your-bucket-name --recursive

# Then destroy
terraform destroy
```
