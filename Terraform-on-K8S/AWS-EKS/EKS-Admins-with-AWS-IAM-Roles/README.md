# EKS Admin Access with AWS IAM Roles

## Overview

This project implements full administrative access to Amazon EKS clusters using AWS IAM roles and role assumption. Unlike direct IAM user mapping, this approach follows AWS security best practices by using IAM roles that users can assume, providing better security, auditability, and centralized access management.

The solution creates IAM roles with full EKS administrative privileges and maps them to the Kubernetes `system:masters` group through the `aws-auth` ConfigMap. This enables seamless integration between AWS IAM identity management and Kubernetes RBAC (Role-Based Access Control).

## Architecture

### Access Flow

```
AWS IAM User/Group
        |
        | sts:AssumeRole
        ↓
    IAM Role (EKS Admin)
        |
        | mapped via aws-auth ConfigMap
        ↓
    Kubernetes Group: system:masters
        |
        | ClusterRole: cluster-admin
        ↓
    Full Cluster Access
```

### Components

1. **IAM Role**: `eks-admin-role` with EKS access permissions
2. **IAM Group**: `eksadmins` group for organizing admin users
3. **IAM Policy**: Inline policy allowing role assumption and EKS API access
4. **aws-auth ConfigMap**: Maps IAM role to Kubernetes `system:masters` group
5. **IAM Users**: Admin users who can assume the role

### Key Features

- **Role-Based Access**: Users assume roles instead of direct cluster access
- **Full Admin Rights**: Complete control over cluster and all resources
- **Audit Trail**: CloudTrail logs all role assumption events
- **Temporary Credentials**: Role sessions provide temporary security credentials
- **Centralized Management**: Manage access through IAM groups

## Prerequisites

### Required Tools

- **Terraform** >= 1.0.0
- **AWS CLI** v2.x configured with appropriate credentials
- **kubectl** v1.24+
- **aws-iam-authenticator** or AWS CLI v1.16.156+ for kubectl authentication

### AWS Requirements

- AWS Account with administrative permissions
- Ability to create IAM roles, policies, and users
- Existing or new EKS cluster
- OIDC provider configured for the EKS cluster

### Required IAM Permissions

The user deploying this Terraform configuration needs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:CreatePolicy",
        "iam:CreateGroup",
        "iam:CreateUser",
        "iam:AttachRolePolicy",
        "iam:AttachGroupPolicy",
        "iam:PutRolePolicy",
        "iam:PutGroupPolicy",
        "iam:AddUserToGroup",
        "iam:GetRole",
        "iam:GetUser",
        "iam:PassRole",
        "eks:*",
        "ec2:*",
        "ssm:GetParameter"
      ],
      "Resource": "*"
    }
  ]
}
```

## Project Structure

```
EKS-Admins-with-AWS-IAM-Roles/
│
├── ekscluster-terraform-manifests/
│   ├── c1-versions.tf                    # Terraform and provider versions
│   ├── c2-01-generic-variables.tf        # Common variables
│   ├── c2-02-local-values.tf             # Local values and tags
│   ├── c3-01-vpc-variables.tf            # VPC configuration
│   ├── c3-02-vpc-module.tf               # VPC module
│   ├── c3-03-vpc-outputs.tf              # VPC outputs
│   ├── c4-01-ec2bastion-variables.tf     # Bastion host variables
│   ├── c4-02-ec2bastion-outputs.tf       # Bastion outputs
│   ├── c4-03-ec2bastion-securitygroups.tf # Security groups
│   ├── c4-04-ami-datasource.tf           # AMI lookup
│   ├── c4-05-ec2bastion-instance.tf      # Bastion EC2 instance
│   ├── c4-06-ec2bastion-elasticip.tf     # Elastic IP
│   ├── c4-07-ec2bastion-provisioners.tf  # Provisioning scripts
│   ├── c5-01-eks-variables.tf            # EKS variables
│   ├── c5-02-eks-outputs.tf              # EKS outputs
│   ├── c5-03-iamrole-for-eks-cluster.tf  # EKS cluster IAM role
│   ├── c5-04-iamrole-for-eks-nodegroup.tf # Node group IAM role
│   ├── c5-05-securitygroups-eks.tf       # EKS security groups
│   ├── c5-06-eks-cluster.tf              # EKS cluster resource
│   ├── c5-07-eks-node-group-public.tf    # Public node group
│   ├── c5-08-eks-node-group-private.tf   # Private node group (optional)
│   └── c6-01-iam-oidc-connect-provider-variables.tf
│       c6-02-iam-oidc-connect-provider.tf # OIDC provider for IRSA
│
└── iam-files/
    └── eks-full-access-policy.json       # IAM policy document
```

## Usage

### Step 1: Review IAM Policy

The `iam-files/eks-full-access-policy.json` defines the permissions for EKS admins:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:ListRoles",
        "eks:*",
        "ssm:GetParameter"
      ],
      "Resource": "*"
    }
  ]
}
```

This policy provides:
- **eks:*** - Full access to all EKS operations
- **iam:ListRoles** - Ability to list IAM roles (required for console)
- **ssm:GetParameter** - Access to SSM parameters (often used for config)

### Step 2: Configure Terraform Variables

Create a `terraform.tfvars` file:

```hcl
# Generic Variables
aws_region = "us-east-1"
environment = "dev"
business_division = "hr"

# VPC Variables
vpc_name = "myvpc"
vpc_cidr_block = "10.0.0.0/16"
vpc_availability_zones = ["us-east-1a", "us-east-1b"]
vpc_public_subnets = ["10.0.101.0/24", "10.0.102.0/24"]
vpc_private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]

# EKS Variables
cluster_name = "my-eks-cluster"
cluster_version = "1.28"

# Bastion Variables
bastion_instance_type = "t3.micro"
```

### Step 3: Deploy the Infrastructure

```bash
# Navigate to the manifests directory
cd ekscluster-terraform-manifests

# Initialize Terraform
terraform init

# Review the execution plan
terraform plan

# Apply the configuration
terraform apply

# Note the outputs (especially the assume role ARN)
terraform output
```

### Step 4: Configure kubectl Access

```bash
# Update kubeconfig for EKS cluster
aws eks update-kubeconfig --region us-east-1 --name my-eks-cluster

# Verify cluster access (using your deployment IAM user/role)
kubectl get nodes
kubectl get namespaces
```

### Step 5: Assume the Admin Role

For users in the `eksadmins` IAM group to access the cluster:

```bash
# Get the admin role ARN from Terraform outputs
ADMIN_ROLE_ARN=$(terraform output -raw eks_admin_role_arn)

# Assume the role (replace with actual values)
aws sts assume-role \
  --role-arn "arn:aws:iam::123456789012:role/hr-dev-eks-admin-role" \
  --role-session-name "admin-session"

# Export the credentials (from assume-role output)
export AWS_ACCESS_KEY_ID="ASIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."

# Update kubeconfig with assumed role
aws eks update-kubeconfig --region us-east-1 --name my-eks-cluster

# Verify admin access
kubectl get nodes
kubectl get all -A
kubectl auth can-i "*" "*"  # Should return 'yes'
```

### Step 6: Configure AWS CLI Profile for Role Assumption

For easier access, configure an AWS CLI profile:

```bash
# Edit ~/.aws/config
cat >> ~/.aws/config << EOF

[profile eks-admin]
role_arn = arn:aws:iam::123456789012:role/hr-dev-eks-admin-role
source_profile = default
region = us-east-1
output = json
EOF

# Use the profile
export AWS_PROFILE=eks-admin

# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name my-eks-cluster

# Test access
kubectl get nodes
```

### Step 7: Test Administrative Access

```bash
# Create a test namespace
kubectl create namespace test-admin

# Deploy a sample application
kubectl create deployment nginx --image=nginx -n test-admin

# Create a service
kubectl expose deployment nginx --port=80 --type=ClusterIP -n test-admin

# View all resources across all namespaces
kubectl get all -A

# Check RBAC permissions
kubectl auth can-i create deployments
kubectl auth can-i delete namespaces
kubectl auth can-i get secrets -A

# All should return 'yes' for admin users
```

### Step 8: Add Additional Admin Users

To add more admin users:

```bash
# Create a new IAM user
aws iam create-user --user-name john-admin

# Add user to eksadmins group
aws iam add-user-to-group \
  --user-name john-admin \
  --group-name hr-dev-eksadmins

# Create access keys
aws iam create-access-key --user-name john-admin

# User can now assume the admin role
```

## Configuration

### IAM Role Configuration

The admin IAM role is defined in Terraform with trust policy and permissions:

```hcl
resource "aws_iam_role" "eks_admin_role" {
  name = "${local.name}-eks-admin-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
      }
    ]
  })
}
```

### IAM Group Policy

The group policy allows members to assume the admin role:

```hcl
resource "aws_iam_group_policy" "eksadmins_assume_policy" {
  name  = "${local.name}-eksadmins-group-policy"
  group = aws_iam_group.eksadmins_group.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = ["sts:AssumeRole"]
        Effect = "Allow"
        Resource = aws_iam_role.eks_admin_role.arn
      }
    ]
  })
}
```

### aws-auth ConfigMap Mapping

The IAM role is mapped to Kubernetes RBAC:

```hcl
locals {
  configmap_roles = [
    {
      rolearn  = aws_iam_role.eks_admin_role.arn
      username = "eks-admin"
      groups   = ["system:masters"]
    }
  ]
}

resource "kubernetes_config_map_v1" "aws_auth" {
  metadata {
    name      = "aws-auth"
    namespace = "kube-system"
  }
  data = {
    mapRoles = yamlencode(local.configmap_roles)
  }
}
```

### Customizing Admin Permissions

To modify admin permissions:

1. **Add AWS Service Permissions**: Edit `eks-full-access-policy.json`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:ListRoles",
        "eks:*",
        "ssm:GetParameter",
        "s3:*",              // Add S3 access
        "rds:Describe*",     // Add RDS read access
        "ec2:Describe*"      // Add EC2 read access
      ],
      "Resource": "*"
    }
  ]
}
```

2. **Restrict Kubernetes Permissions**: Use custom ClusterRole instead of `system:masters`

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: eks-custom-admin
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]
- nonResourceURLs: ["*"]
  verbs: ["*"]

# Update aws-auth mapping to use custom group
groups: ["eks-custom-admins"]
```

## Features

### Security Features

- **Role Assumption**: Temporary credentials instead of long-lived access keys
- **Audit Trail**: All role assumptions logged in CloudTrail
- **MFA Support**: Can require MFA for role assumption
- **Session Duration**: Control how long admin sessions last
- **Principle of Least Privilege**: Granular control over permissions

### Administrative Capabilities

- **Full Cluster Access**: Complete control over all Kubernetes resources
- **Namespace Management**: Create, modify, and delete namespaces
- **RBAC Management**: Manage roles and role bindings
- **Resource Deployment**: Deploy any Kubernetes resource
- **Node Management**: Drain, cordon, and manage nodes
- **Secret Access**: Read and write secrets across all namespaces

### Management Features

- **Centralized Access Control**: Manage admins through IAM groups
- **Easy Onboarding**: Add users to group for instant admin access
- **Revocation**: Remove from group to revoke access
- **Cross-Account Access**: Support for cross-account role assumption
- **AWS Console Integration**: Works with AWS EKS console

## Troubleshooting

### Unable to Assume Role

**Problem**: Getting "User is not authorized to perform: sts:AssumeRole"

**Solutions**:

```bash
# Verify user is in the correct group
aws iam get-group --group-name hr-dev-eksadmins

# Check group policy
aws iam list-group-policies --group-name hr-dev-eksadmins
aws iam get-group-policy --group-name hr-dev-eksadmins --policy-name <policy-name>

# Verify role trust policy
aws iam get-role --role-name hr-dev-eks-admin-role

# Check if trust policy allows your account
# Should see: "Principal": { "AWS": "arn:aws:iam::123456789012:root" }
```

### kubectl Access Denied

**Problem**: After assuming role, kubectl commands return "Unauthorized" or "Forbidden"

**Solutions**:

```bash
# Verify aws-auth ConfigMap
kubectl get configmap aws-auth -n kube-system -o yaml

# Check if role ARN is correctly mapped
# Should see your role ARN in mapRoles section

# Verify kubectl is using the correct AWS credentials
aws sts get-caller-identity

# Should show the assumed role ARN

# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name my-eks-cluster

# Test specific permissions
kubectl auth can-i get pods
kubectl auth can-i create deployments
kubectl auth can-i delete nodes
```

### Wrong IAM Principal

**Problem**: aws-auth ConfigMap shows wrong ARN or username

**Solutions**:

```bash
# Check the ConfigMap
kubectl edit configmap aws-auth -n kube-system

# Verify the role ARN format
# Correct format: arn:aws:iam::123456789012:role/role-name

# Update using Terraform
cd ekscluster-terraform-manifests
terraform apply -auto-approve

# Or manually edit (not recommended)
kubectl edit configmap aws-auth -n kube-system
```

### Session Expired

**Problem**: Admin session expires after a period of time

**Solutions**:

```bash
# Check session expiration
aws sts get-caller-identity

# If expired, re-assume the role
aws sts assume-role \
  --role-arn "arn:aws:iam::123456789012:role/hr-dev-eks-admin-role" \
  --role-session-name "admin-session" \
  --duration-seconds 43200  # 12 hours (max)

# Update credentials
export AWS_ACCESS_KEY_ID="ASIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."

# Or use AWS CLI profile which auto-refreshes
export AWS_PROFILE=eks-admin
```

### Multiple EKS Clusters

**Problem**: Managing admin access to multiple clusters

**Solutions**:

```bash
# Create separate roles for each cluster
aws iam create-role --role-name eks-cluster1-admin-role --assume-role-policy-document file://trust-policy.json
aws iam create-role --role-name eks-cluster2-admin-role --assume-role-policy-document file://trust-policy.json

# Configure separate profiles
cat >> ~/.aws/config << EOF
[profile eks-cluster1-admin]
role_arn = arn:aws:iam::123456789012:role/eks-cluster1-admin-role
source_profile = default

[profile eks-cluster2-admin]
role_arn = arn:aws:iam::123456789012:role/eks-cluster2-admin-role
source_profile = default
EOF

# Switch between clusters
export AWS_PROFILE=eks-cluster1-admin
aws eks update-kubeconfig --name cluster1 --region us-east-1

export AWS_PROFILE=eks-cluster2-admin
aws eks update-kubeconfig --name cluster2 --region us-east-1
```

### IAM Role Not Showing in EKS Console

**Problem**: Role doesn't appear in AWS EKS console access management

**Solutions**:

```bash
# Ensure user has EKS describe permissions
aws eks describe-cluster --name my-eks-cluster

# Add EKS console permissions to IAM role
aws iam attach-role-policy \
  --role-name hr-dev-eks-admin-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSClusterPolicy

# Verify aws-auth ConfigMap is correct
kubectl get configmap aws-auth -n kube-system -o yaml
```

## Best Practices

### 1. Security Best Practices

- **MFA for Role Assumption**: Require MFA for assuming admin roles

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::123456789012:role/eks-admin-role",
      "Condition": {
        "Bool": {
          "aws:MultiFactorAuthPresent": "true"
        }
      }
    }
  ]
}
```

- **Limit Session Duration**: Reduce role session time for production

```bash
# Set max session duration to 4 hours
aws iam update-role \
  --role-name eks-admin-role \
  --max-session-duration 14400
```

- **External ID**: Use external ID for cross-account access
- **Condition Keys**: Add IP restrictions or time-based conditions
- **Separate Roles**: Use different roles for dev/staging/prod

### 2. Operational Best Practices

- **Naming Convention**: Use consistent naming for roles and groups
- **Tagging**: Tag all IAM resources for cost allocation and compliance
- **Documentation**: Document who has access and why
- **Regular Audits**: Review group membership quarterly
- **Automated Provisioning**: Use Terraform for all IAM changes

### 3. Monitoring and Auditing

- **CloudTrail**: Enable CloudTrail for all API calls

```bash
# Query role assumptions
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AssumeRole \
  --max-items 100
```

- **CloudWatch Alarms**: Alert on admin role assumptions

```bash
# Create metric filter for role assumptions
aws logs put-metric-filter \
  --log-group-name CloudTrail/logs \
  --filter-name EKSAdminRoleAssumptions \
  --filter-pattern '{ $.eventName = "AssumeRole" && $.requestParameters.roleArn = "*eks-admin-role" }' \
  --metric-transformations \
    metricName=EKSAdminAssumeRole,metricNamespace=Security,metricValue=1
```

- **Access Analyzer**: Use IAM Access Analyzer
- **Config Rules**: Monitor IAM role changes with AWS Config

### 4. Access Management

- **Least Privilege**: Start with minimal permissions, add as needed
- **Temporary Access**: Use time-limited credentials
- **Break Glass**: Have emergency access procedure documented
- **Service Accounts**: Use IRSA for pod-level access, not admin roles
- **Group-Based**: Always use groups, never attach policies to users directly

### 5. High Availability

- **Multiple Admins**: Ensure multiple people have admin access
- **Cross-Region**: Consider cross-region role access
- **Break Glass Account**: Maintain emergency root-like access
- **Documentation**: Keep runbooks for emergency scenarios

### 6. Compliance

- **Audit Logging**: Enable all CloudTrail logs
- **Retention**: Set appropriate log retention (90+ days)
- **Encryption**: Encrypt CloudTrail logs with KMS
- **Compliance Mapping**: Map roles to compliance requirements
- **Regular Reviews**: Conduct access reviews

### 7. Cost Optimization

- **Unused Roles**: Remove unused roles and users
- **CloudTrail Costs**: Use S3 lifecycle policies for log retention
- **Consolidate**: Use single role for multiple environments if appropriate
- **Session Length**: Shorter sessions reduce risk but may increase API calls

### 8. Terraform Best Practices

- **State Backend**: Use remote state with locking
- **Modules**: Create reusable modules for IAM roles
- **Variable Validation**: Add validation to prevent errors
- **Outputs**: Export role ARNs for easy reference
- **Dependencies**: Use explicit dependencies for aws-auth ConfigMap

```hcl
# Example output
output "eks_admin_role_arn" {
  description = "ARN of the EKS admin IAM role"
  value       = aws_iam_role.eks_admin_role.arn
}

output "eks_admin_assume_role_command" {
  description = "Command to assume the admin role"
  value       = "aws sts assume-role --role-arn ${aws_iam_role.eks_admin_role.arn} --role-session-name admin-session"
}
```
