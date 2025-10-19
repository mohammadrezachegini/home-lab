# EKS IAM Roles for Service Accounts (IRSA)

This project demonstrates how to configure IAM Roles for Service Accounts (IRSA) on Amazon EKS, enabling Kubernetes pods to assume AWS IAM roles securely without using static credentials.

## Overview

IRSA provides fine-grained IAM permissions to Kubernetes pods:
- No need for IAM user access keys
- Automatic credential rotation
- Audit trail via CloudTrail
- Follows AWS security best practices
- Per-pod IAM permissions

## Architecture

```
Kubernetes Pod
    ↓
Service Account (with IAM role annotation)
    ↓
OIDC Identity Provider
    ↓
IAM Role (with trust policy)
    ↓
AWS Services (S3, DynamoDB, etc.)
```

## How IRSA Works

1. **EKS creates OIDC provider** for the cluster
2. **Service Account** is annotated with IAM role ARN
3. **Pod** uses the service account
4. **Kubernetes** injects AWS credentials as environment variables
5. **Pod** uses AWS SDK to access AWS services
6. **AWS STS** validates the OIDC token and provides temporary credentials

## Prerequisites

- EKS cluster with OIDC provider enabled
- Terraform >= 1.0
- kubectl configured
- AWS CLI

## Project Structure

```
├── ekscluster-terraform-manifests/
│   ├── c6-01-iam-oidc-connect-provider-variables.tf
│   └── c6-02-iam-oidc-connect-provider.tf
└── irsa-demo/
    ├── iam-role.tf               # IAM role with trust policy
    ├── iam-policy.tf             # IAM permissions
    ├── kubernetes-sa.tf          # Service account
    └── sample-pod.yaml           # Test pod
```

## Setup Steps

### 1. Enable OIDC Provider on EKS

```hcl
data "tls_certificate" "eks" {
  url = aws_eks_cluster.cluster.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.cluster.identity[0].oidc[0].issuer
}
```

### 2. Create IAM Policy

```hcl
resource "aws_iam_policy" "s3_read" {
  name        = "EKS-Pod-S3-Read-Policy"
  description = "Allow pods to read from S3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::my-bucket",
          "arn:aws:s3:::my-bucket/*"
        ]
      }
    ]
  })
}
```

### 3. Create IAM Role with Trust Policy

```hcl
resource "aws_iam_role" "irsa_role" {
  name = "EKS-Pod-S3-Access-Role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.eks.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub" = "system:serviceaccount:default:s3-reader"
            "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud" = "sts.amazonaws.com"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "irsa_policy" {
  role       = aws_iam_role.irsa_role.name
  policy_arn = aws_iam_policy.s3_read.arn
}
```

### 4. Create Kubernetes Service Account

```hcl
resource "kubernetes_service_account" "s3_reader" {
  metadata {
    name      = "s3-reader"
    namespace = "default"
    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.irsa_role.arn
    }
  }
}
```

### 5. Deploy Pod with Service Account

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: s3-reader-pod
spec:
  serviceAccountName: s3-reader
  containers:
    - name: aws-cli
      image: amazon/aws-cli
      command:
        - sleep
        - "3600"
```

## Usage

### Deploy IRSA Configuration

```bash
cd irsa-demo
terraform init
terraform apply
```

### Test IRSA

```bash
# Deploy test pod
kubectl apply -f sample-pod.yaml

# Verify environment variables are injected
kubectl exec -it s3-reader-pod -- env | grep AWS

# Test AWS access
kubectl exec -it s3-reader-pod -- aws s3 ls s3://my-bucket/

# Verify IAM role
kubectl exec -it s3-reader-pod -- aws sts get-caller-identity
```

## Environment Variables Injected

When using IRSA, Kubernetes automatically injects:

```bash
AWS_ROLE_ARN=arn:aws:iam::123456789012:role/EKS-Pod-S3-Access-Role
AWS_WEB_IDENTITY_TOKEN_FILE=/var/run/secrets/eks.amazonaws.com/serviceaccount/token
```

## Common Use Cases

### 1. S3 Access
```hcl
# Policy for S3 bucket access
{
  "Effect": "Allow",
  "Action": ["s3:*"],
  "Resource": ["arn:aws:s3:::bucket-name/*"]
}
```

### 2. DynamoDB Access
```hcl
# Policy for DynamoDB table access
{
  "Effect": "Allow",
  "Action": ["dynamodb:*"],
  "Resource": ["arn:aws:dynamodb:*:*:table/table-name"]
}
```

### 3. Secrets Manager
```hcl
# Policy for Secrets Manager
{
  "Effect": "Allow",
  "Action": ["secretsmanager:GetSecretValue"],
  "Resource": ["arn:aws:secretsmanager:*:*:secret:*"]
}
```

### 4. EKS Add-ons
- AWS Load Balancer Controller
- EBS CSI Driver
- EFS CSI Driver
- Cluster Autoscaler
- External DNS

## Trust Policy Conditions

### Specific Service Account
```json
"Condition": {
  "StringEquals": {
    "oidc.eks.region.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE:sub": "system:serviceaccount:namespace:sa-name"
  }
}
```

### All Service Accounts in Namespace
```json
"Condition": {
  "StringLike": {
    "oidc.eks.region.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE:sub": "system:serviceaccount:namespace:*"
  }
}
```

### Multiple Service Accounts
```json
"Condition": {
  "StringEquals": {
    "oidc.eks.region.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE:sub": [
      "system:serviceaccount:namespace1:sa1",
      "system:serviceaccount:namespace2:sa2"
    ]
  }
}
```

## Troubleshooting

### Pod Cannot Assume Role

```bash
# Check service account annotation
kubectl describe sa <service-account-name>

# Verify environment variables in pod
kubectl exec <pod-name> -- env | grep AWS

# Check IAM role trust policy
aws iam get-role --role-name <role-name>
```

### OIDC Provider Issues

```bash
# Verify OIDC provider exists
aws iam list-open-id-connect-providers

# Check OIDC issuer URL
aws eks describe-cluster --name <cluster-name> \
  --query "cluster.identity.oidc.issuer" \
  --output text
```

### Access Denied Errors

```bash
# Test IAM permissions
kubectl exec <pod-name> -- aws sts get-caller-identity

# Check CloudTrail for detailed error
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceName,AttributeValue=<role-name>
```

## Best Practices

1. **Least Privilege** - Grant minimum required permissions
2. **Namespace Isolation** - Use separate service accounts per namespace
3. **Specific Resources** - Limit access to specific ARNs
4. **Audit Regularly** - Review IAM policies and CloudTrail logs
5. **Use Conditions** - Add conditions to trust policies
6. **Avoid Wildcards** - Be specific with resource ARNs

## Security Considerations

### Do's
- ✅ Use specific service account conditions
- ✅ Limit IAM permissions to required resources
- ✅ Enable CloudTrail for auditing
- ✅ Use separate roles for different workloads
- ✅ Rotate credentials (happens automatically)

### Don'ts
- ❌ Don't use overly permissive policies (*)
- ❌ Don't share service accounts across apps
- ❌ Don't use IAM user access keys in pods
- ❌ Don't allow assume role for all service accounts

## Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `cluster_name` | EKS cluster name | - |
| `namespace` | Kubernetes namespace | default |
| `service_account_name` | Service account name | - |

## Outputs

- IAM role ARN
- OIDC provider ARN
- Service account name

## Verification Checklist

- [ ] OIDC provider created and active
- [ ] IAM role has correct trust policy
- [ ] IAM policy has required permissions
- [ ] Service account has IAM role annotation
- [ ] Pod uses the correct service account
- [ ] Environment variables injected correctly
- [ ] Pod can access AWS services
