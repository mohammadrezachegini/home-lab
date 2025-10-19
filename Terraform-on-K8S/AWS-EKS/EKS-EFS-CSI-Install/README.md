# Amazon EFS CSI Driver Installation on EKS

## Overview

This project provides Terraform automation to install and configure the AWS EFS (Elastic File System) CSI (Container Storage Interface) driver on Amazon EKS clusters. The EFS CSI driver enables Kubernetes applications to leverage Amazon EFS for persistent, elastic, and shared file storage across multiple pods and availability zones.

The installation configures the necessary IAM roles and policies, deploys the EFS CSI driver using Helm, and integrates it with EKS using IAM Roles for Service Accounts (IRSA) for secure AWS API authentication.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                     EKS Cluster                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │            kube-system namespace                  │  │
│  │  ┌──────────────────────────────────────────┐    │  │
│  │  │   EFS CSI Driver Controller              │    │  │
│  │  │   - Service Account: efs-csi-controller-sa   │
│  │  │   - Annotated with IAM Role ARN          │    │  │
│  │  └──────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            │ IRSA (IAM Roles for Service Accounts)
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   AWS IAM                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  IAM Role: efs-csi-iam-role                      │  │
│  │  - Trust Policy: OIDC Provider                   │  │
│  │  - Policy: AmazonEKS_EFS_CSI_Driver_Policy       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            │ EFS API Calls
                            ▼
┌─────────────────────────────────────────────────────────┐
│                Amazon EFS Service                        │
│  - Create/Delete File Systems                           │
│  - Create/Delete Access Points                          │
│  - Mount/Unmount Operations                             │
└─────────────────────────────────────────────────────────┘
```

### Key Features

- **Helm-based Installation**: Deploys EFS CSI driver using the official Helm chart
- **IRSA Integration**: Uses IAM Roles for Service Accounts for secure AWS authentication
- **Regional Configuration**: Automatically configures the correct ECR image repository for your AWS region
- **Remote State Management**: Integrates with existing EKS cluster via Terraform remote state

## Prerequisites

### Required Resources

1. **Existing EKS Cluster**: A running EKS cluster with OIDC provider enabled
2. **Terraform**: Version 1.0 or higher
3. **AWS CLI**: Configured with appropriate credentials
4. **kubectl**: For verifying the installation
5. **Helm**: Version 3.x (managed by Terraform provider)

### Required Permissions

Your AWS credentials must have permissions to:
- Create and manage IAM roles and policies
- Access EKS cluster details
- Deploy resources via Helm to the EKS cluster
- Read from S3 (for remote state access)

### Network Requirements

- EKS cluster must have internet access or VPC endpoints for:
  - Amazon ECR (to pull EFS CSI driver images)
  - Amazon EFS (for future file system operations)

## Project Structure

```
EKS-EFS-CSI-Install/
├── ekscluster-terraform-manifests/      # EKS cluster setup
│   ├── c1-versions.tf                    # Terraform and provider versions
│   ├── c2-01-generic-variables.tf        # Generic input variables
│   ├── c2-02-local-values.tf             # Local value computations
│   ├── c3-01-vpc-variables.tf            # VPC configuration variables
│   ├── c3-02-vpc-module.tf               # VPC module configuration
│   ├── c3-03-vpc-outputs.tf              # VPC outputs
│   ├── c4-01-ec2bastion-variables.tf     # Bastion host variables
│   ├── c4-02-ec2bastion-outputs.tf       # Bastion host outputs
│   ├── c4-03-ec2bastion-securitygroups.tf # Bastion security groups
│   ├── c4-04-ami-datasource.tf           # AMI data source
│   ├── c4-05-ec2bastion-instance.tf      # Bastion host instance
│   ├── c4-06-ec2bastion-elasticip.tf     # Bastion Elastic IP
│   ├── c4-07-ec2bastion-provisioners.tf  # Bastion provisioners
│   ├── c5-01-eks-variables.tf            # EKS cluster variables
│   ├── c5-02-eks-outputs.tf              # EKS cluster outputs
│   ├── c5-03-iamrole-for-eks-cluster.tf  # EKS cluster IAM role
│   ├── c5-04-iamrole-for-eks-nodegroup.tf # Node group IAM role
│   ├── c5-05-securitygroups-eks.tf       # EKS security groups
│   ├── c5-06-eks-cluster.tf              # EKS cluster resource
│   ├── c5-07-eks-node-group-public.tf    # Public node group
│   ├── c5-08-eks-node-group-private.tf   # Private node group
│   ├── c6-01-iam-oidc-connect-provider-variables.tf # OIDC variables
│   ├── c6-02-iam-oidc-connect-provider.tf # OIDC provider
│   ├── c7-01-kubernetes-provider.tf      # Kubernetes provider config
│   ├── c7-02-kubernetes-configmap.tf     # aws-auth ConfigMap
│   ├── c8-01-iam-admin-user.tf           # IAM admin user
│   ├── c8-02-iam-basic-user.tf           # IAM basic user
│   ├── c9-01-iam-role-eksadmins.tf       # EKS admins IAM role
│   ├── c9-02-iam-group-and-user-eksadmins.tf # EKS admins IAM group
│   ├── c10-01-iam-role-eksreadonly.tf    # EKS read-only IAM role
│   ├── c10-02-iam-group-and-user-eksreadonly.tf # Read-only group
│   ├── c10-03-k8s-clusterrole-clusterrolebinding.tf # Read-only RBAC
│   ├── c11-01-iam-role-eksdeveloper.tf   # EKS developer IAM role
│   ├── c11-02-iam-group-and-user-eksdeveloper.tf # Developer group
│   ├── c11-03-k8s-clusterrole-clusterrolebinding.tf # Developer RBAC
│   ├── c11-04-namespaces.tf              # Kubernetes namespaces
│   ├── c11-05-k8s-role-rolebinding.tf    # Developer Role/RoleBinding
│   ├── terraform.tfvars                   # Variable values
│   ├── vpc.auto.tfvars                    # VPC auto-loaded variables
│   ├── eks.auto.tfvars                    # EKS auto-loaded variables
│   └── ec2bastion.auto.tfvars            # Bastion auto-loaded variables
│
└── efs-install-terraform-manifests/      # EFS CSI driver installation
    ├── c1-versions.tf                     # Terraform and provider versions
    ├── c2-remote-state-datasource.tf      # Remote state data source
    ├── c3-01-generic-variables.tf         # Generic input variables
    ├── c3-02-local-values.tf              # Local value computations
    ├── c4-01-efs-csi-datasources.tf       # EFS CSI IAM policy datasource
    ├── c4-02-efs-csi-iam-policy-and-role.tf # IAM policy and role
    ├── c4-03-efs-helm-provider.tf         # Helm provider configuration
    ├── c4-04-efs-csi-install.tf           # EFS CSI Helm installation
    ├── c4-05-efs-outputs.tf               # EFS CSI outputs
    └── terraform.tfvars                    # Variable values
```

## Usage

### Step 1: Deploy EKS Cluster

First, deploy the EKS cluster if not already present:

```bash
cd ekscluster-terraform-manifests

# Initialize Terraform
terraform init

# Review the execution plan
terraform plan

# Apply the configuration
terraform apply -auto-approve

# Save cluster state to S3 for remote state access
# Configure S3 backend in your configuration
```

### Step 2: Install EFS CSI Driver

Once the EKS cluster is running:

```bash
cd ../efs-install-terraform-manifests

# Initialize Terraform
terraform init

# Review the installation plan
terraform plan

# Install the EFS CSI driver
terraform apply -auto-approve
```

### Step 3: Verify Installation

```bash
# Configure kubectl to use your EKS cluster
aws eks update-kubeconfig --name <cluster-name> --region us-east-1

# Verify the EFS CSI driver pods are running
kubectl get pods -n kube-system | grep efs-csi

# Expected output:
# efs-csi-controller-xxxx   3/3     Running   0          2m
# efs-csi-node-xxxx         3/3     Running   0          2m
# efs-csi-node-yyyy         3/3     Running   0          2m

# Check the CSI driver
kubectl get csidrivers

# Expected output should include:
# efs.csi.aws.com

# Verify the service account and IAM role annotation
kubectl describe sa efs-csi-controller-sa -n kube-system

# Look for the annotation:
# eks.amazonaws.com/role-arn: arn:aws:iam::<account-id>:role/<role-name>
```

### Step 4: View Driver Logs

```bash
# View controller logs
kubectl logs -n kube-system -l app=efs-csi-controller -c csi-driver --tail=20

# View node driver logs
kubectl logs -n kube-system -l app=efs-csi-node -c csi-driver --tail=20
```

## Configuration

### Key Configuration Files

#### c4-01-efs-csi-datasources.tf

Retrieves the latest EFS CSI driver IAM policy from the official GitHub repository:

```hcl
data "http" "efs_csi_iam_policy" {
  url = "https://raw.githubusercontent.com/kubernetes-sigs/aws-efs-csi-driver/master/docs/iam-policy-example.json"

  request_headers = {
    Accept = "application/json"
  }
}
```

#### c4-02-efs-csi-iam-policy-and-role.tf

Creates the IAM policy and role with IRSA trust relationship:

```hcl
# Create IAM policy from fetched JSON
resource "aws_iam_policy" "efs_csi_iam_policy" {
  name        = "${local.name}-AmazonEKS_EFS_CSI_Driver_Policy"
  path        = "/"
  description = "EFS CSI IAM Policy"
  policy      = data.http.efs_csi_iam_policy.response_body
}

# Create IAM role with OIDC trust policy
resource "aws_iam_role" "efs_csi_iam_role" {
  name = "${local.name}-efs-csi-iam-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Federated = "${data.terraform_remote_state.eks.outputs.aws_iam_openid_connect_provider_arn}"
        }
        Condition = {
          StringEquals = {
            "${data.terraform_remote_state.eks.outputs.aws_iam_openid_connect_provider_extract_from_arn}:sub": "system:serviceaccount:kube-system:efs-csi-controller-sa"
          }
        }
      },
    ]
  })

  tags = {
    tag-key = "efs-csi"
  }
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "efs_csi_iam_role_policy_attach" {
  policy_arn = aws_iam_policy.efs_csi_iam_policy.arn
  role       = aws_iam_role.efs_csi_iam_role.name
}
```

#### c4-04-efs-csi-install.tf

Installs the EFS CSI driver using Helm:

```hcl
resource "helm_release" "efs_csi_driver" {
  depends_on = [aws_iam_role.efs_csi_iam_role]
  name       = "aws-efs-csi-driver"

  repository = "https://kubernetes-sigs.github.io/aws-efs-csi-driver"
  chart      = "aws-efs-csi-driver"

  namespace = "kube-system"

  # Regional ECR image repository
  set {
    name  = "image.repository"
    value = "602401143452.dkr.ecr.us-east-1.amazonaws.com/eks/aws-efs-csi-driver"
  }

  # Create and configure service account
  set {
    name  = "controller.serviceAccount.create"
    value = "true"
  }

  set {
    name  = "controller.serviceAccount.name"
    value = "efs-csi-controller-sa"
  }

  # Annotate service account with IAM role
  set {
    name  = "controller.serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = "${aws_iam_role.efs_csi_iam_role.arn}"
  }
}
```

### IAM Policy Permissions

The EFS CSI driver requires the following AWS permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "elasticfilesystem:DescribeAccessPoints",
        "elasticfilesystem:DescribeFileSystems",
        "elasticfilesystem:DescribeMountTargets",
        "ec2:DescribeAvailabilityZones"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticfilesystem:CreateAccessPoint"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "aws:RequestTag/efs.csi.aws.com/cluster": "true"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": "elasticfilesystem:DeleteAccessPoint",
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:ResourceTag/efs.csi.aws.com/cluster": "true"
        }
      }
    }
  ]
}
```

### Regional ECR Repositories

The EFS CSI driver image must be pulled from the regional ECR repository:

| Region | ECR Repository |
|--------|----------------|
| us-east-1 | 602401143452.dkr.ecr.us-east-1.amazonaws.com/eks/aws-efs-csi-driver |
| us-west-2 | 602401143452.dkr.ecr.us-west-2.amazonaws.com/eks/aws-efs-csi-driver |
| eu-west-1 | 602401143452.dkr.ecr.eu-west-1.amazonaws.com/eks/aws-efs-csi-driver |
| ap-southeast-1 | 602401143452.dkr.ecr.ap-southeast-1.amazonaws.com/eks/aws-efs-csi-driver |

Refer to [AWS EKS Add-ons Images](https://docs.aws.amazon.com/eks/latest/userguide/add-ons-images.html) for complete list.

### Remote State Configuration

The EFS CSI installation references the EKS cluster using Terraform remote state:

```hcl
data "terraform_remote_state" "eks" {
  backend = "s3"
  config = {
    bucket = "terraform-on-aws-eks-381492238320"
    key    = "dev/eks-cluster/terraform.tfstate"
    region = "us-east-1"
  }
}
```

Update the bucket name, key, and region to match your configuration.

## Features

### 1. IAM Roles for Service Accounts (IRSA)

The driver uses IRSA for secure authentication to AWS EFS APIs without requiring static credentials:

- Service account: `efs-csi-controller-sa`
- Namespace: `kube-system`
- IAM role ARN annotation enables automatic credential injection

### 2. Automatic Policy Updates

The IAM policy is fetched from the official repository at deployment time, ensuring you always have the latest required permissions.

### 3. Helm Chart Management

Using Helm provides:
- Easy upgrades and rollbacks
- Consistent configuration management
- Community-maintained best practices

### 4. Multi-AZ Support

The EFS CSI driver automatically supports multi-AZ deployments, allowing pods in different availability zones to access the same file system.

### 5. Security Best Practices

- Uses service accounts instead of node IAM roles
- Follows principle of least privilege
- No static credentials stored in the cluster

## Troubleshooting

### Issue: EFS CSI Controller Pod Not Starting

**Symptoms:**
```bash
kubectl get pods -n kube-system | grep efs-csi-controller
# Shows pods in CrashLoopBackOff or ImagePullBackOff
```

**Solutions:**

1. **Check image repository for your region:**
```bash
kubectl describe pod -n kube-system <efs-csi-controller-pod>
# Look for image pull errors
```
Update the ECR repository URL in `c4-04-efs-csi-install.tf` to match your AWS region.

2. **Verify IAM role exists:**
```bash
aws iam get-role --role-name <efs-csi-iam-role-name>
```

3. **Check IAM role annotation:**
```bash
kubectl describe sa efs-csi-controller-sa -n kube-system
# Verify eks.amazonaws.com/role-arn annotation is present
```

### Issue: Permission Denied Errors

**Symptoms:**
```bash
kubectl logs -n kube-system <efs-csi-controller-pod> -c csi-driver
# Shows AccessDenied errors
```

**Solutions:**

1. **Verify IAM policy is attached:**
```bash
aws iam list-attached-role-policies --role-name <efs-csi-iam-role-name>
```

2. **Check OIDC provider trust relationship:**
```bash
aws iam get-role --role-name <efs-csi-iam-role-name> --query 'Role.AssumeRolePolicyDocument'
```

3. **Verify OIDC provider exists:**
```bash
aws iam list-open-id-connect-providers
# Check that your EKS cluster's OIDC provider is listed
```

### Issue: CSI Driver Not Registered

**Symptoms:**
```bash
kubectl get csidrivers
# efs.csi.aws.com not listed
```

**Solutions:**

1. **Check controller pods are running:**
```bash
kubectl get pods -n kube-system -l app=efs-csi-controller
```

2. **Restart the controller:**
```bash
kubectl rollout restart deployment efs-csi-controller -n kube-system
```

3. **Check driver registration logs:**
```bash
kubectl logs -n kube-system -l app=efs-csi-controller -c csi-driver | grep -i register
```

### Issue: Helm Release Failed

**Symptoms:**
```bash
terraform apply
# Shows Helm release creation failed
```

**Solutions:**

1. **Verify kubectl context:**
```bash
kubectl config current-context
# Should point to your EKS cluster
```

2. **Check Helm repository:**
```bash
helm repo add aws-efs-csi-driver https://kubernetes-sigs.github.io/aws-efs-csi-driver
helm repo update
helm search repo aws-efs-csi-driver
```

3. **Manually install to test:**
```bash
helm install aws-efs-csi-driver aws-efs-csi-driver/aws-efs-csi-driver \
  --namespace kube-system \
  --set image.repository=602401143452.dkr.ecr.us-east-1.amazonaws.com/eks/aws-efs-csi-driver
```

### Debugging Commands

```bash
# Check all EFS CSI resources
kubectl get all -n kube-system -l app.kubernetes.io/name=aws-efs-csi-driver

# View detailed pod information
kubectl describe pod -n kube-system -l app=efs-csi-controller

# Check CSI node driver on specific node
kubectl logs -n kube-system -l app=efs-csi-node -c csi-driver --tail=50

# Verify service account token projection
kubectl get sa efs-csi-controller-sa -n kube-system -o yaml

# Check for CSI driver metrics
kubectl get --raw /metrics | grep efs_csi
```

## Best Practices

### 1. Use Remote State for Multi-Team Collaboration

Store EKS cluster state in S3 backend to enable EFS CSI installation by different teams:

```hcl
terraform {
  backend "s3" {
    bucket = "your-terraform-state-bucket"
    key    = "dev/eks-cluster/terraform.tfstate"
    region = "us-east-1"
  }
}
```

### 2. Enable Encryption at Rest

When creating EFS file systems (in subsequent projects), always enable encryption:

```hcl
resource "aws_efs_file_system" "example" {
  encrypted = true
  kms_key_id = aws_kms_key.efs.arn
}
```

### 3. Use Tags for Resource Management

Tag all resources consistently:

```hcl
tags = {
  Environment = "dev"
  ManagedBy   = "terraform"
  Project     = "eks-efs"
}
```

### 4. Monitor Driver Health

Set up CloudWatch alarms for EFS CSI driver metrics:
- Pod restart counts
- API call failures
- Mount operation failures

### 5. Version Pinning

Pin Helm chart versions for production:

```hcl
resource "helm_release" "efs_csi_driver" {
  chart   = "aws-efs-csi-driver"
  version = "2.4.0"  # Specify exact version
}
```

### 6. Regular Updates

Keep the EFS CSI driver updated:

```bash
# Check for updates
helm repo update
helm search repo aws-efs-csi-driver --versions

# Update in Terraform
terraform plan
terraform apply
```

### 7. Least Privilege IAM Policies

Only grant necessary permissions. Avoid using wildcards in resource ARNs when possible.

### 8. Enable Container Insights

Monitor EFS CSI driver performance using CloudWatch Container Insights:

```bash
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluentd-quickstart.yaml
```

### 9. Document Configuration Changes

Maintain a CHANGELOG.md for tracking driver versions and configuration updates.

### 10. Test in Non-Production First

Always test EFS CSI driver upgrades in development/staging before production.
