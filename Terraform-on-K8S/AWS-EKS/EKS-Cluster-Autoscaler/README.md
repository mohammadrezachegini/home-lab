# EKS Cluster Autoscaler Installation

## Overview

This project provides a complete Terraform-based solution for installing and configuring the Kubernetes Cluster Autoscaler on Amazon EKS. The Cluster Autoscaler automatically adjusts the number of nodes in your EKS cluster based on pod resource requests and node utilization. When pods fail to schedule due to insufficient resources, the autoscaler adds nodes. When nodes are underutilized, it removes them to optimize costs.

The implementation uses Helm to deploy the Cluster Autoscaler with proper IAM roles and IRSA (IAM Roles for Service Accounts) configuration, ensuring secure access to AWS Auto Scaling APIs.

## Architecture

### Components

1. **IAM Policy**: Grants permissions for autoscaling operations
2. **IAM Role**: Uses IRSA to provide secure, temporary credentials to the Cluster Autoscaler pod
3. **Helm Chart**: Deploys the Cluster Autoscaler application to the kube-system namespace
4. **Service Account**: Kubernetes service account annotated with the IAM role ARN
5. **EKS Node Groups**: Tagged for auto-discovery by the Cluster Autoscaler

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                        EKS Cluster                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              kube-system namespace                     │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │     Cluster Autoscaler Pod                       │  │ │
│  │  │  - Monitors unschedulable pods                   │  │ │
│  │  │  - Uses Service Account with IRSA               │  │ │
│  │  │  - Calls AWS Auto Scaling APIs                  │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              EKS Node Groups                           │ │
│  │  - Tagged for auto-discovery                          │ │
│  │  - Min/Max/Desired capacity configured                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ IRSA (AssumeRoleWithWebIdentity)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      AWS IAM                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  IAM Role for Cluster Autoscaler                      │ │
│  │  - Trust policy with OIDC provider                    │ │
│  │  - Scoped to specific service account                 │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  IAM Policy                                            │ │
│  │  - autoscaling:DescribeAutoScalingGroups              │ │
│  │  - autoscaling:SetDesiredCapacity                     │ │
│  │  - autoscaling:TerminateInstanceInAutoScalingGroup    │ │
│  │  - ec2:DescribeLaunchTemplateVersions                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ AWS API Calls
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  AWS Auto Scaling Groups                    │
│  - Manages EC2 instances for node groups                   │
│  - Scales up/down based on Cluster Autoscaler requests     │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

### Required Tools

- Terraform >= 1.6.0
- AWS CLI configured with appropriate credentials
- kubectl configured to access your EKS cluster
- Helm (for manual verification)

### Required Providers

```hcl
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.74.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "2.16.1"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "2.33.0"
    }
  }
}
```

### EKS Cluster Requirements

1. **Existing EKS Cluster**: The cluster must be provisioned before installing the Cluster Autoscaler
2. **OIDC Provider**: IAM OIDC provider must be configured for IRSA
3. **Node Group Tags**: Node groups must have the following tags:
   - `k8s.io/cluster-autoscaler/<cluster-name>`: `owned`
   - `k8s.io/cluster-autoscaler/enabled`: `TRUE`

### Remote State Configuration

This project requires access to the EKS cluster's Terraform state:

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

## Project Structure

```
EKS-Cluster-Autoscaler/
├── cluster-autoscaler-install-terraform-manifests/
│   ├── c1-versions.tf                          # Terraform and provider versions
│   ├── c2-remote-state-datasource.tf           # Remote state data source for EKS
│   ├── c3-01-generic-variables.tf              # Input variables (region, environment)
│   ├── c3-02-local-values.tf                   # Local values for naming
│   ├── c4-01-cluster-autoscaler-iam-policy-and-role.tf  # IAM resources
│   ├── c4-02-cluster-autoscaler-helm-provider.tf        # Helm provider configuration
│   ├── c4-03-cluster-autoscaler-install.tf              # Helm release
│   ├── c4-04-cluster-autoscaler-outputs.tf              # Terraform outputs
│   └── terraform.tfvars                        # Variable values
└── ekscluster-terraform-manifests/             # EKS cluster configuration
    └── (EKS cluster Terraform files)
```

## Usage

### Step 1: Configure Variables

Edit `terraform.tfvars` to match your environment:

```hcl
# Generic Variables
aws_region       = "us-east-1"
environment      = "dev"
business_divsion = "hr"
```

### Step 2: Update Remote State Configuration

Modify `c2-remote-state-datasource.tf` to point to your EKS cluster's state:

```hcl
data "terraform_remote_state" "eks" {
  backend = "s3"
  config = {
    bucket = "your-terraform-state-bucket"
    key    = "dev/eks-cluster/terraform.tfstate"
    region = "us-east-1"
  }
}
```

### Step 3: Initialize Terraform

```bash
cd cluster-autoscaler-install-terraform-manifests
terraform init
```

### Step 4: Review the Plan

```bash
terraform plan
```

Expected resources to be created:
- 1 IAM Policy
- 1 IAM Role
- 1 IAM Role Policy Attachment
- 1 Helm Release

### Step 5: Apply Configuration

```bash
terraform apply -auto-approve
```

### Step 6: Verify Installation

```bash
# Check Cluster Autoscaler deployment
kubectl get deployment cluster-autoscaler -n kube-system

# Check Cluster Autoscaler pod
kubectl get pods -n kube-system | grep cluster-autoscaler

# View Cluster Autoscaler logs
kubectl logs -f deployment/cluster-autoscaler -n kube-system

# Check service account
kubectl get sa cluster-autoscaler -n kube-system -o yaml
```

### Step 7: Verify IAM Role Annotation

```bash
kubectl describe sa cluster-autoscaler -n kube-system
```

Expected output should include:
```
Annotations: eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT_ID:role/CLUSTER_NAME-cluster-autoscaler
```

## Configuration

### IAM Policy Details

The Cluster Autoscaler requires the following AWS permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "autoscaling:DescribeAutoScalingGroups",
        "autoscaling:DescribeAutoScalingInstances",
        "autoscaling:DescribeInstances",
        "autoscaling:DescribeLaunchConfigurations",
        "autoscaling:DescribeTags",
        "autoscaling:SetDesiredCapacity",
        "autoscaling:TerminateInstanceInAutoScalingGroup",
        "ec2:DescribeLaunchTemplateVersions",
        "ec2:DescribeInstanceTypes"
      ],
      "Resource": "*",
      "Effect": "Allow"
    }
  ]
}
```

**Permission Breakdown**:

- **Read Permissions**:
  - `autoscaling:Describe*`: Discover and monitor Auto Scaling groups
  - `ec2:DescribeLaunchTemplateVersions`: Understand instance configurations
  - `ec2:DescribeInstanceTypes`: Determine instance capabilities

- **Write Permissions**:
  - `autoscaling:SetDesiredCapacity`: Adjust the number of nodes
  - `autoscaling:TerminateInstanceInAutoScalingGroup`: Remove underutilized nodes

### IAM Role with IRSA

The IAM role uses IRSA for secure authentication:

```hcl
resource "aws_iam_role" "cluster_autoscaler_iam_role" {
  name = "${local.name}-cluster-autoscaler"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::ACCOUNT_ID:oidc-provider/oidc.eks.REGION.amazonaws.com/id/OIDC_ID"
        }
        Condition = {
          StringEquals = {
            "oidc.eks.REGION.amazonaws.com/id/OIDC_ID:sub": "system:serviceaccount:kube-system:cluster-autoscaler"
          }
        }
      }
    ]
  })
}
```

**Key Features**:
- Uses `AssumeRoleWithWebIdentity` for secure, temporary credentials
- Scoped to the `cluster-autoscaler` service account in `kube-system` namespace
- No long-lived credentials stored in Kubernetes

### Helm Chart Configuration

```hcl
resource "helm_release" "cluster_autoscaler_release" {
  name       = "${local.name}-ca"
  repository = "https://kubernetes.github.io/autoscaler"
  chart      = "cluster-autoscaler"
  namespace  = "kube-system"

  set {
    name  = "cloudProvider"
    value = "aws"
  }

  set {
    name  = "autoDiscovery.clusterName"
    value = data.terraform_remote_state.eks.outputs.cluster_id
  }

  set {
    name  = "awsRegion"
    value = var.aws_region
  }

  set {
    name  = "rbac.serviceAccount.create"
    value = "true"
  }

  set {
    name  = "rbac.serviceAccount.name"
    value = "cluster-autoscaler"
  }

  set {
    name  = "rbac.serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = aws_iam_role.cluster_autoscaler_iam_role.arn
  }
}
```

**Configuration Options**:

- `cloudProvider`: Set to `aws` for EKS
- `autoDiscovery.clusterName`: Enables automatic discovery of node groups
- `awsRegion`: AWS region for API calls
- `rbac.serviceAccount.annotations`: Links the service account to the IAM role

### Node Group Tags

Ensure your EKS node groups have these tags:

```hcl
resource "aws_eks_node_group" "eks_ng_private" {
  # ... other configuration ...

  tags = {
    "k8s.io/cluster-autoscaler/${local.eks_cluster_name}" = "owned"
    "k8s.io/cluster-autoscaler/enabled" = "TRUE"
  }
}
```

### Scaling Configuration

Node group scaling limits:

```hcl
scaling_config {
  desired_size = 2
  min_size     = 2
  max_size     = 3
}
```

**Important**: The Cluster Autoscaler respects these limits and will never scale beyond the `max_size`.

### Optional: Advanced Configuration

You can add additional arguments to fine-tune the Cluster Autoscaler:

```hcl
# In c4-03-cluster-autoscaler-install.tf
set {
  name  = "extraArgs.scan-interval"
  value = "20s"
}

set {
  name  = "extraArgs.scale-down-delay-after-add"
  value = "10m"
}

set {
  name  = "extraArgs.scale-down-unneeded-time"
  value = "10m"
}

set {
  name  = "extraArgs.skip-nodes-with-local-storage"
  value = "false"
}
```

## Features

### 1. Automatic Node Scaling

- **Scale Up**: Automatically adds nodes when pods are unschedulable
- **Scale Down**: Removes underutilized nodes to optimize costs
- **Respects PDB**: Honors Pod Disruption Budgets during scale-down
- **Safe Deletion**: Only removes nodes that can be safely drained

### 2. Auto-Discovery

- Automatically discovers node groups tagged with cluster-autoscaler tags
- No need to manually specify Auto Scaling group names
- Works with multiple node groups

### 3. IRSA Security

- No long-lived AWS credentials in the cluster
- Temporary credentials automatically rotated
- Fine-grained IAM permissions
- Audit trail via CloudTrail

### 4. High Availability

- Deployed as a single replica (leader election enabled)
- Monitors cluster continuously
- Configurable scan interval

### 5. Cost Optimization

- Removes underutilized nodes after configurable delay
- Balances performance and cost
- Respects workload requirements

## Troubleshooting

### Common Issues

#### 1. Cluster Autoscaler Pod Not Starting

**Symptoms**: Pod is in `Pending` or `CrashLoopBackOff` state

**Diagnosis**:
```bash
kubectl describe pod -n kube-system -l app.kubernetes.io/name=aws-cluster-autoscaler
kubectl logs -n kube-system -l app.kubernetes.io/name=aws-cluster-autoscaler
```

**Common Causes**:
- Insufficient resources in the cluster
- Image pull errors
- RBAC permission issues

**Solution**:
```bash
# Check for events
kubectl get events -n kube-system --sort-by='.lastTimestamp'

# Verify service account
kubectl get sa cluster-autoscaler -n kube-system
```

#### 2. IAM Permission Errors

**Symptoms**: Logs show `AccessDenied` or `UnauthorizedOperation` errors

**Diagnosis**:
```bash
kubectl logs -n kube-system -l app.kubernetes.io/name=aws-cluster-autoscaler | grep -i error
```

**Solution**:
```bash
# Verify IAM role annotation
kubectl get sa cluster-autoscaler -n kube-system -o yaml | grep role-arn

# Check IAM role trust policy
aws iam get-role --role-name CLUSTER_NAME-cluster-autoscaler

# Verify IAM policy permissions
aws iam list-attached-role-policies --role-name CLUSTER_NAME-cluster-autoscaler
```

#### 3. Nodes Not Scaling Up

**Symptoms**: Pods remain unschedulable but no new nodes are added

**Diagnosis**:
```bash
# Check Cluster Autoscaler logs
kubectl logs -n kube-system -l app.kubernetes.io/name=aws-cluster-autoscaler

# Check pending pods
kubectl get pods --all-namespaces --field-selector=status.phase=Pending
```

**Common Causes**:
- Max size reached for node groups
- Insufficient EC2 capacity in availability zone
- Instance type not available
- Node group tags missing or incorrect

**Solution**:
```bash
# Verify node group tags
aws autoscaling describe-auto-scaling-groups \
  --query "AutoScalingGroups[?Tags[?Key=='k8s.io/cluster-autoscaler/enabled']].AutoScalingGroupName"

# Check current vs max size
kubectl describe configmap cluster-autoscaler-status -n kube-system

# Increase max_size in node group if needed
```

#### 4. Nodes Not Scaling Down

**Symptoms**: Underutilized nodes remain in the cluster

**Diagnosis**:
```bash
# Check Cluster Autoscaler status
kubectl logs -n kube-system -l app.kubernetes.io/name=aws-cluster-autoscaler | grep "scale down"
```

**Common Causes**:
- Pods with local storage on nodes
- Pods without a controller (bare pods)
- Pods with anti-affinity rules
- Pods with `cluster-autoscaler.kubernetes.io/safe-to-evict: "false"` annotation
- Nodes recently added
- System pods not managed by DaemonSets

**Solution**:
```bash
# Check for pods preventing scale-down
kubectl get pods --all-namespaces -o wide

# Add safe-to-evict annotation if appropriate
kubectl annotate pod POD_NAME cluster-autoscaler.kubernetes.io/safe-to-evict="true"
```

#### 5. OIDC Provider Issues

**Symptoms**: Service account cannot assume IAM role

**Diagnosis**:
```bash
# Check OIDC provider
aws iam list-open-id-connect-providers

# Verify cluster OIDC issuer
aws eks describe-cluster --name CLUSTER_NAME --query "cluster.identity.oidc.issuer"
```

**Solution**:
- Ensure OIDC provider is created and matches cluster issuer
- Verify IAM role trust policy references correct OIDC provider
- Check that service account namespace and name match trust policy condition

### Debugging Commands

```bash
# View Cluster Autoscaler configuration
kubectl get cm cluster-autoscaler-status -n kube-system -o yaml

# Check Cluster Autoscaler version
kubectl describe deployment cluster-autoscaler -n kube-system | grep Image

# View all autoscaling events
kubectl get events --all-namespaces | grep -i autoscal

# Check node utilization
kubectl top nodes

# Describe nodes for autoscaler annotations
kubectl describe nodes | grep -A 5 "cluster-autoscaler"
```

### Log Analysis

Enable verbose logging for detailed troubleshooting:

```hcl
# In c4-03-cluster-autoscaler-install.tf
set {
  name  = "extraArgs.v"
  value = "4"  # Verbosity level (0-10)
}

set {
  name  = "extraArgs.logtostderr"
  value = "true"
}
```

## Best Practices

### 1. Right-Size Node Groups

```hcl
scaling_config {
  desired_size = 2     # Start with stable baseline
  min_size     = 2     # Maintain minimum for availability
  max_size     = 10    # Set reasonable maximum for cost control
}
```

### 2. Use Multiple Node Groups

- Create separate node groups for different workload types
- Use node selectors and taints/tolerations
- Enable better bin-packing and cost optimization

### 3. Configure Pod Resource Requests

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      containers:
      - name: app
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
```

**Why**: Cluster Autoscaler makes scaling decisions based on resource requests, not actual usage.

### 4. Set Pod Disruption Budgets

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: my-app
```

**Why**: Ensures application availability during node scale-down events.

### 5. Configure Scale-Down Parameters

```hcl
set {
  name  = "extraArgs.scale-down-delay-after-add"
  value = "10m"
}

set {
  name  = "extraArgs.scale-down-unneeded-time"
  value = "10m"
}

set {
  name  = "extraArgs.scale-down-utilization-threshold"
  value = "0.5"
}
```

**Why**: Prevents frequent scaling up and down (flapping).

### 6. Monitor Cluster Autoscaler

```bash
# Set up CloudWatch alerts for:
# - Failed scaling operations
# - Node group at max capacity
# - Pending pods for extended time

# Use Prometheus metrics if available
kubectl port-forward -n kube-system deployment/cluster-autoscaler 8085:8085
curl http://localhost:8085/metrics
```

### 7. Tag Resources Properly

```hcl
tags = {
  "k8s.io/cluster-autoscaler/${local.eks_cluster_name}" = "owned"
  "k8s.io/cluster-autoscaler/enabled" = "TRUE"
  "Environment" = var.environment
  "ManagedBy" = "Terraform"
}
```

### 8. Use Node Affinity for Critical Workloads

```yaml
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
      - matchExpressions:
        - key: workload-type
          operator: In
          values:
          - critical
```

### 9. Regular Updates

- Keep Cluster Autoscaler version compatible with Kubernetes version
- Review AWS IAM policy for new required permissions
- Monitor release notes for breaking changes

### 10. Cost Optimization

- Use Spot instances for fault-tolerant workloads
- Configure appropriate scale-down delay
- Monitor and adjust max_size based on actual needs
- Use mixed instance types with priority-based scaling
