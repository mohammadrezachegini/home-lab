# EKS Read-Only Access with IAM Users

## Overview

This project implements read-only access to Amazon EKS clusters using AWS IAM users and Kubernetes RBAC (Role-Based Access Control). This solution is ideal for auditors, viewers, managers, and support staff who need to observe cluster state and troubleshoot issues without the ability to make any changes.

Read-only users can:

- **View all cluster resources**: nodes, namespaces, pods, deployments, services
- **List workloads**: see all deployments, daemonsets, statefulsets, replicasets
- **View jobs**: inspect batch jobs across the cluster
- **Monitor events**: observe Kubernetes events for troubleshooting
- **No modification rights**: cannot create, update, or delete any resources

This approach follows the principle of least privilege and provides safe, auditable access for stakeholders who need visibility into cluster operations without the risk of accidental changes.

## Architecture

### Access Flow

```
AWS IAM User
      |
      | Added to IAM Group
      ↓
IAM Group: eksreadonly
      |
      | Inline Policy: AssumeRole
      ↓
IAM Role: eks-readonly-role
      |
      | mapped via aws-auth ConfigMap
      ↓
Kubernetes Group: eks-readonly-group
      |
      | ClusterRole: eksreadonly-clusterrole
      ↓
Read-Only Cluster Access
```

### RBAC Architecture

1. **ClusterRole** (`eksreadonly-clusterrole`): Read-only permissions
   - Verbs: `get`, `list` only (no create, update, delete)
   - Resources: nodes, namespaces, pods, events, deployments, jobs

2. **ClusterRoleBinding** (`eksreadonly-clusterrolebinding`): Maps role to group
   - Binds `eks-readonly-group` to the ClusterRole

3. **IAM Role**: Provides AWS-level authentication
   - Trust policy allows user assumption
   - Inline policy for EKS API access

4. **IAM Group**: Centralizes user management
   - Group policy allows role assumption
   - Easy user onboarding/offboarding

### Security Boundary

```
Allowed Operations:
├── get nodes
├── list namespaces
├── get pods (all namespaces)
├── list deployments
├── get events
├── list services
└── view jobs

Blocked Operations:
├── create (any resource)
├── update/patch (any resource)
├── delete (any resource)
├── exec into pods
├── port-forward
└── modify RBAC
```

## Prerequisites

### Required Tools

- **Terraform** >= 1.0.0
- **AWS CLI** v2.x configured with credentials
- **kubectl** v1.24+
- **aws-iam-authenticator** or AWS CLI v1.16.156+ for kubectl authentication

### AWS Requirements

- AWS Account with IAM permissions
- Ability to create IAM roles, users, and groups
- Existing or new EKS cluster
- OIDC provider configured for the cluster

### Required IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:CreateGroup",
        "iam:CreateUser",
        "iam:PutRolePolicy",
        "iam:PutGroupPolicy",
        "iam:AddUserToGroup",
        "eks:*",
        "ec2:*"
      ],
      "Resource": "*"
    }
  ]
}
```

## Project Structure

```
EKS-ReadOnly-IAM-Users/
│
├── ekscluster-terraform-manifests/
│   ├── c1-versions.tf                    # Terraform versions
│   ├── c2-01-generic-variables.tf        # Common variables
│   ├── c2-02-local-values.tf             # Local values and tags
│   ├── c3-01-vpc-variables.tf            # VPC configuration
│   ├── c3-02-vpc-module.tf               # VPC module
│   ├── c3-03-vpc-outputs.tf              # VPC outputs
│   ├── c4-xx-ec2bastion-*.tf             # Bastion host files
│   ├── c5-xx-eks-*.tf                    # EKS cluster files
│   ├── c6-xx-iam-oidc-*.tf               # OIDC provider
│   ├── c7-01-kubernetes-provider.tf      # Kubernetes provider
│   ├── c7-02-kubernetes-configmap.tf     # aws-auth ConfigMap
│   ├── c8-01-iam-admin-user.tf           # Admin user
│   ├── c8-02-iam-basic-user.tf           # Basic user
│   ├── c9-xx-iam-role-eksadmins.tf       # Admin role files
│   ├── c10-01-iam-role-eksreadonly.tf    # Read-only IAM role ⭐
│   ├── c10-02-iam-group-and-user-eksreadonly.tf # Read-only group/user ⭐
│   └── c10-03-k8s-clusterrole-clusterrolebinding.tf # RBAC config ⭐
│
└── kube-manifests-crb-cr/
    └── eks-readonly-access.yaml          # Standalone RBAC manifest
```

## Usage

### Step 1: Deploy EKS Cluster with Read-Only RBAC

```bash
# Navigate to manifests directory
cd ekscluster-terraform-manifests

# Initialize Terraform
terraform init

# Review the execution plan
terraform plan

# Deploy the infrastructure
terraform apply

# Note the outputs
terraform output
```

### Step 2: Configure kubectl Access

```bash
# Update kubeconfig for the cluster
aws eks update-kubeconfig --region us-east-1 --name <cluster-name>

# Verify cluster access (as admin)
kubectl get nodes
kubectl get namespaces
```

### Step 3: Verify IAM Resources

```bash
# Check IAM role
aws iam get-role --role-name hr-dev-eks-readonly-role

# Check IAM group
aws iam get-group --group-name hr-dev-eksreadonly

# List users in group
aws iam get-group --group-name hr-dev-eksreadonly --query 'Users[*].UserName'

# Check role inline policy
aws iam list-role-policies --role-name hr-dev-eks-readonly-role
aws iam get-role-policy \
  --role-name hr-dev-eks-readonly-role \
  --policy-name eks-readonly-access-policy
```

### Step 4: Verify Kubernetes RBAC

```bash
# Check ClusterRole
kubectl get clusterrole eksreadonly-clusterrole
kubectl describe clusterrole eksreadonly-clusterrole

# Check ClusterRoleBinding
kubectl get clusterrolebinding eksreadonly-clusterrolebinding
kubectl describe clusterrolebinding eksreadonly-clusterrolebinding

# Verify group mapping in aws-auth
kubectl get configmap aws-auth -n kube-system -o yaml | grep -A 5 readonly
```

### Step 5: Configure Read-Only User AWS CLI Profile

Create an AWS CLI profile for the read-only user:

```bash
# Edit ~/.aws/config
cat >> ~/.aws/config << EOF

[profile eks-readonly]
role_arn = arn:aws:iam::123456789012:role/hr-dev-eks-readonly-role
source_profile = readonly-user
region = us-east-1
output = json
EOF

# Edit ~/.aws/credentials for the user
cat >> ~/.aws/credentials << EOF

[readonly-user]
aws_access_key_id = AKIA...
aws_secret_access_key = ...
EOF
```

### Step 6: Assume Read-Only Role and Test Access

```bash
# Switch to read-only profile
export AWS_PROFILE=eks-readonly

# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name <cluster-name>

# Verify identity
aws sts get-caller-identity
kubectl config current-context

# Test read access (should work)
kubectl get nodes
kubectl get namespaces
kubectl get pods -A
kubectl get deployments -A
kubectl get services -A
kubectl get events -A

# Test write access (should fail)
kubectl create namespace test-ns
# Error: User "eks-readonly" cannot create resource "namespaces" at the cluster scope

kubectl delete pod <pod-name> -n default
# Error: User "eks-readonly" cannot delete resource "pods" in namespace "default"

kubectl scale deployment nginx --replicas=3
# Error: User "eks-readonly" cannot update resource "deployments/scale"

# Test exec access (should fail)
kubectl exec -it <pod-name> -- /bin/bash
# Error: User "eks-readonly" cannot create resource "pods/exec"
```

### Step 7: Test Permission Boundaries

```bash
# Test what read-only user can do
kubectl auth can-i get nodes                    # yes
kubectl auth can-i list namespaces              # yes
kubectl auth can-i get pods -A                  # yes
kubectl auth can-i list deployments -A          # yes
kubectl auth can-i get events -A                # yes
kubectl auth can-i list jobs -A                 # yes

# Test what read-only user cannot do
kubectl auth can-i create namespaces            # no
kubectl auth can-i delete pods                  # no
kubectl auth can-i update deployments           # no
kubectl auth can-i patch services               # no
kubectl auth can-i create secrets               # no
kubectl auth can-i exec pods                    # no (not included in RBAC)
```

### Step 8: View Cluster Resources (Read-Only)

```bash
# As read-only user
export AWS_PROFILE=eks-readonly

# View cluster nodes
kubectl get nodes
kubectl describe node <node-name>

# View all pods
kubectl get pods -A
kubectl get pods -A -o wide

# View deployments
kubectl get deployments -A
kubectl describe deployment <deployment-name> -n <namespace>

# View services
kubectl get services -A
kubectl describe service <service-name> -n <namespace>

# View events (useful for troubleshooting)
kubectl get events -A --sort-by='.lastTimestamp'
kubectl get events -n <namespace>

# View jobs
kubectl get jobs -A
kubectl describe job <job-name> -n <namespace>

# View daemonsets
kubectl get daemonsets -A

# View statefulsets
kubectl get statefulsets -A

# View replicasets
kubectl get replicasets -A

# View logs (if pod logs are accessible via get pods/log)
# Note: The default RBAC does not include pods/log
# Add this to ClusterRole if needed:
# - apiGroups: [""]
#   resources: ["pods/log"]
#   verbs: ["get", "list"]
```

### Step 9: Add Additional Read-Only Users

```bash
# Create new read-only user
aws iam create-user --user-name auditor1

# Add to read-only group
aws iam add-user-to-group \
  --user-name auditor1 \
  --group-name hr-dev-eksreadonly

# Create access keys
aws iam create-access-key --user-name auditor1

# User can now assume the read-only role
```

## Configuration

### IAM Role - Read-Only Access

The read-only IAM role (`c10-01-iam-role-eksreadonly.tf`):

```hcl
resource "aws_iam_role" "eks_readonly_role" {
  name = "${local.name}-eks-readonly-role"

  # Trust policy
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

  # Inline policy for EKS access
  inline_policy {
    name = "eks-readonly-access-policy"

    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Action = [
            "iam:ListRoles",
            "ssm:GetParameter",
            "eks:DescribeNodegroup",
            "eks:ListNodegroups",
            "eks:DescribeCluster",
            "eks:ListClusters",
            "eks:AccessKubernetesApi",
            "eks:ListUpdates",
            "eks:ListFargateProfiles",
            "eks:ListIdentityProviderConfigs",
            "eks:ListAddons",
            "eks:DescribeAddonVersions"
          ]
          Effect   = "Allow"
          Resource = "*"
        }
      ]
    })
  }

  tags = {
    tag-key = "${local.name}-eks-readonly-role"
  }
}
```

### IAM Group and User Configuration

The read-only group and user (`c10-02-iam-group-and-user-eksreadonly.tf`):

```hcl
# IAM Group
resource "aws_iam_group" "eksreadonly_iam_group" {
  name = "${local.name}-eksreadonly"
  path = "/"
}

# Group Policy - Allow AssumeRole
resource "aws_iam_group_policy" "eksreadonly_iam_group_assumerole_policy" {
  name  = "${local.name}-eksreadonly-group-policy"
  group = aws_iam_group.eksreadonly_iam_group.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["sts:AssumeRole"]
        Effect   = "Allow"
        Resource = aws_iam_role.eks_readonly_role.arn
      }
    ]
  })
}

# IAM User
resource "aws_iam_user" "eksreadonly_user" {
  name          = "${local.name}-eksreadonly1"
  path          = "/"
  force_destroy = true
  tags          = local.common_tags
}

# Group Membership
resource "aws_iam_group_membership" "eksreadonly" {
  name  = "${local.name}-eksreadonly-group-membership"
  users = [aws_iam_user.eksreadonly_user.name]
  group = aws_iam_group.eksreadonly_iam_group.name
}
```

### ClusterRole - Read-Only Permissions

The ClusterRole configuration (`c10-03-k8s-clusterrole-clusterrolebinding.tf`):

```hcl
resource "kubernetes_cluster_role_v1" "eksreadonly_clusterrole" {
  metadata {
    name = "eksreadonly-clusterrole"
  }

  # Rule-1: Core resources read access
  rule {
    api_groups = [""]
    resources  = ["nodes", "namespaces", "pods", "events"]
    verbs      = ["get", "list"]
  }

  # Rule-2: Apps resources read access
  rule {
    api_groups = ["apps"]
    resources  = ["deployments", "daemonsets", "statefulsets", "replicasets"]
    verbs      = ["get", "list"]
  }

  # Rule-3: Batch resources read access
  rule {
    api_groups = ["batch"]
    resources  = ["jobs"]
    verbs      = ["get", "list"]
  }
}

resource "kubernetes_cluster_role_binding_v1" "eksreadonly_clusterrolebinding" {
  metadata {
    name = "eksreadonly-clusterrolebinding"
  }
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = kubernetes_cluster_role_v1.eksreadonly_clusterrole.metadata[0].name
  }
  subject {
    kind      = "Group"
    name      = "eks-readonly-group"
    api_group = "rbac.authorization.k8s.io"
  }
}
```

### Standalone RBAC Manifest

The `kube-manifests-crb-cr/eks-readonly-access.yaml` provides a kubectl-based alternative:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: eksreadonly-clusterrole
rules:
- apiGroups:
  - ""
  resources:
  - nodes
  - namespaces
  - pods
  - events
  verbs:
  - get
  - list
- apiGroups:
  - apps
  resources:
  - deployments
  - daemonsets
  - statefulsets
  - replicasets
  verbs:
  - get
  - list
- apiGroups:
  - batch
  resources:
  - jobs
  verbs:
  - get
  - list
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: eksreadonly-clusterrolebinding
roleRef:
  kind: ClusterRole
  name: eksreadonly-clusterrole
  apiGroup: rbac.authorization.k8s.io
subjects:
- kind: Group
  name: eks-readonly-group
  apiGroup: rbac.authorization.k8s.io
```

### aws-auth ConfigMap Mapping

The read-only role is mapped in aws-auth (`c7-02-kubernetes-configmap.tf`):

```hcl
locals {
  configmap_roles = [
    # ... other roles ...
    {
      rolearn  = aws_iam_role.eks_readonly_role.arn
      username = "eks-readonly"
      groups   = [kubernetes_cluster_role_binding_v1.eksreadonly_clusterrolebinding.subject[0].name]
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

### Customizing Read-Only Permissions

#### Add Pod Log Access

```hcl
# Add to ClusterRole
rule {
  api_groups = [""]
  resources  = ["pods/log"]
  verbs      = ["get", "list"]
}
```

#### Add Service and ConfigMap Read Access

```hcl
# Add to ClusterRole
rule {
  api_groups = [""]
  resources  = ["services", "configmaps", "endpoints"]
  verbs      = ["get", "list"]
}
```

#### Add Ingress and NetworkPolicy Read Access

```hcl
# Add to ClusterRole
rule {
  api_groups = ["networking.k8s.io"]
  resources  = ["ingresses", "networkpolicies"]
  verbs      = ["get", "list"]
}
```

#### Add PersistentVolume Read Access

```hcl
# Add to ClusterRole
rule {
  api_groups = [""]
  resources  = ["persistentvolumes", "persistentvolumeclaims"]
  verbs      = ["get", "list"]
}
```

#### Comprehensive Read-Only Role

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: eksreadonly-comprehensive-clusterrole
rules:
# Core resources
- apiGroups: [""]
  resources:
  - nodes
  - namespaces
  - pods
  - pods/log
  - services
  - endpoints
  - configmaps
  - secrets  # Consider if secrets should be readable
  - persistentvolumes
  - persistentvolumeclaims
  - events
  - serviceaccounts
  verbs: ["get", "list", "watch"]

# Apps
- apiGroups: ["apps"]
  resources:
  - deployments
  - daemonsets
  - statefulsets
  - replicasets
  verbs: ["get", "list", "watch"]

# Batch
- apiGroups: ["batch"]
  resources:
  - jobs
  - cronjobs
  verbs: ["get", "list", "watch"]

# Networking
- apiGroups: ["networking.k8s.io"]
  resources:
  - ingresses
  - networkpolicies
  verbs: ["get", "list", "watch"]

# RBAC (read-only)
- apiGroups: ["rbac.authorization.k8s.io"]
  resources:
  - roles
  - rolebindings
  - clusterroles
  - clusterrolebindings
  verbs: ["get", "list", "watch"]

# Storage
- apiGroups: ["storage.k8s.io"]
  resources:
  - storageclasses
  - volumeattachments
  verbs: ["get", "list", "watch"]

# Autoscaling
- apiGroups: ["autoscaling"]
  resources:
  - horizontalpodautoscalers
  verbs: ["get", "list", "watch"]
```

## Features

### Read-Only Capabilities

- **Cluster Visibility**: View all nodes and their status
- **Namespace Listing**: See all namespaces in the cluster
- **Pod Inspection**: View pods across all namespaces
- **Deployment Review**: Inspect deployment configurations
- **Event Monitoring**: View events for troubleshooting
- **Job Tracking**: Monitor batch jobs and their status
- **Service Discovery**: View all services in the cluster

### Security Features

- **No Modification Rights**: Cannot create, update, or delete resources
- **Audit Trail**: All API calls logged via CloudTrail
- **Temporary Credentials**: Role assumption provides time-limited access
- **Group-Based Management**: Easy user management via IAM groups
- **Principle of Least Privilege**: Only read permissions granted

### Use Cases

- **Auditors**: Security and compliance auditing
- **Managers**: Oversight and monitoring
- **Support Staff**: Troubleshooting without risk of changes
- **Monitoring Tools**: Integration with external monitoring
- **Interns/Trainees**: Safe learning environment
- **Cross-Team Visibility**: Allow other teams to view cluster state

## Troubleshooting

### Cannot Assume Read-Only Role

**Problem**: "AccessDenied" when assuming role

**Solutions**:

```bash
# Verify user is in group
aws iam get-group --group-name hr-dev-eksreadonly

# Check group policy
aws iam get-group-policy \
  --group-name hr-dev-eksreadonly \
  --policy-name hr-dev-eksreadonly-group-policy

# Verify role trust policy
aws iam get-role --role-name hr-dev-eks-readonly-role

# Test assumption
aws sts assume-role \
  --role-arn arn:aws:iam::123456789012:role/hr-dev-eks-readonly-role \
  --role-session-name test
```

### "Forbidden" Errors on Read Operations

**Problem**: Cannot view resources despite read-only role

**Solutions**:

```bash
# Verify aws-auth ConfigMap
kubectl get configmap aws-auth -n kube-system -o yaml

# Check ClusterRole
kubectl describe clusterrole eksreadonly-clusterrole

# Verify ClusterRoleBinding
kubectl describe clusterrolebinding eksreadonly-clusterrolebinding

# Check group name matches
kubectl get clusterrolebinding eksreadonly-clusterrolebinding -o yaml | grep "name:"

# Verify current identity
aws sts get-caller-identity
kubectl auth whoami
```

### Can Modify Resources (Should Not Happen)

**Problem**: Read-only user can create/update/delete resources

**Solutions**:

```bash
# This indicates RBAC misconfiguration

# Check ClusterRole verbs (should only be get, list)
kubectl get clusterrole eksreadonly-clusterrole -o yaml

# Verify no additional RoleBindings
kubectl get rolebindings -A | grep eks-readonly

# Check for admin ClusterRoleBindings
kubectl get clusterrolebindings | grep eks-readonly

# Should only see eksreadonly-clusterrolebinding
```

### Cannot View Logs

**Problem**: User cannot view pod logs

**Solution**:

```bash
# Pod logs require specific permission
# Check if pods/log is in ClusterRole
kubectl get clusterrole eksreadonly-clusterrole -o yaml | grep "pods/log"

# Add if missing
kubectl edit clusterrole eksreadonly-clusterrole

# Add this rule:
# - apiGroups: [""]
#   resources: ["pods/log"]
#   verbs: ["get", "list"]
```

### Wrong Group Name in Mapping

**Problem**: Group name mismatch between aws-auth and ClusterRoleBinding

**Solutions**:

```bash
# Check aws-auth group name
kubectl get configmap aws-auth -n kube-system -o jsonpath='{.data.mapRoles}' | grep -A 2 readonly

# Check ClusterRoleBinding group name
kubectl get clusterrolebinding eksreadonly-clusterrolebinding -o yaml | grep "name:"

# Must match: eks-readonly-group

# Fix aws-auth if needed
kubectl edit configmap aws-auth -n kube-system

# Or fix ClusterRoleBinding
kubectl edit clusterrolebinding eksreadonly-clusterrolebinding
```

## Best Practices

### 1. Security Best Practices

- **Least Privilege**: Only grant read permissions needed
- **Exclude Secrets**: Consider excluding secret read access
- **MFA for Sensitive Environments**: Require MFA for production access
- **Regular Audits**: Review who has read-only access quarterly
- **Session Duration**: Limit role session duration

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::123456789012:role/eks-readonly-role",
      "Condition": {
        "Bool": {
          "aws:MultiFactorAuthPresent": "true"
        },
        "IpAddress": {
          "aws:SourceIp": ["10.0.0.0/8", "172.16.0.0/12"]
        }
      }
    }
  ]
}
```

### 2. Access Management

- **Group-Based**: Always use groups, not individual users
- **Naming Convention**: Use clear naming (auditor, viewer, monitor)
- **Documentation**: Document who has access and why
- **Temporary Access**: Use time-limited credentials
- **Offboarding**: Remove users from group immediately upon departure

### 3. Monitoring and Auditing

- **CloudTrail**: Enable logging for all API calls
- **Alerts**: Alert on unusual read patterns
- **Access Reviews**: Quarterly access reviews
- **Compliance**: Map to compliance requirements

```bash
# CloudWatch alarm for unusual API calls
aws cloudwatch put-metric-alarm \
  --alarm-name readonly-high-api-calls \
  --alarm-description "Alert on high API call volume" \
  --metric-name CallCount \
  --namespace AWS/Usage \
  --statistic Sum \
  --period 300 \
  --threshold 1000 \
  --comparison-operator GreaterThanThreshold
```

### 4. Operational Practices

- **Training**: Train users on what they can/cannot do
- **Documentation**: Provide clear guides on using read-only access
- **Support**: Have escalation path for when read-only isn't enough
- **Tool Integration**: Integrate with monitoring and dashboards

### 5. RBAC Configuration

- **Watch Verb**: Consider adding "watch" for real-time monitoring
- **Resource Scope**: Be explicit about which resources are readable
- **API Groups**: Include all relevant API groups
- **Subresources**: Consider pods/log, pods/status, etc.

### 6. Compliance Requirements

- **PCI-DSS**: Read-only access for auditors
- **HIPAA**: Controlled access to healthcare data
- **SOC 2**: Audit logging and access reviews
- **GDPR**: Data access logging and controls

### 7. Cost Optimization

- **API Call Limits**: Monitor for excessive API calls
- **Caching**: Use client-side caching where possible
- **Efficient Queries**: Use label selectors to reduce data transfer

### 8. Integration with Tools

```bash
# Use with monitoring tools
# Example: Prometheus read-only access
kubectl create serviceaccount prometheus-reader -n monitoring

kubectl create clusterrolebinding prometheus-reader \
  --clusterrole=eksreadonly-clusterrole \
  --serviceaccount=monitoring:prometheus-reader
```
