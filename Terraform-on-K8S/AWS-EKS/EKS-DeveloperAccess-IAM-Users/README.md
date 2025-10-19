# EKS Developer Access with IAM Users and Namespace Restrictions

## Overview

This project implements namespace-restricted developer access to Amazon EKS clusters using AWS IAM users and Kubernetes RBAC (Role-Based Access Control). Unlike admin access that provides full cluster control, this solution creates a secure developer environment where users have:

- **Read-only access** at the cluster level (view nodes, namespaces, pods)
- **Full administrative access** within specific namespaces (create, update, delete resources)
- **No access** to cluster-wide resources or other namespaces

This approach follows the principle of least privilege, ensuring developers can work effectively in their designated namespaces without risking cluster-wide changes or accessing other teams' resources.

## Architecture

### Access Flow

```
AWS IAM User
      |
      | Added to IAM Group
      ↓
IAM Group: eksdeveloper
      |
      | Inline Policy: AssumeRole
      ↓
IAM Role: eks-developer-role
      |
      | mapped via aws-auth ConfigMap
      ↓
Kubernetes Group: eks-developer-group
      |
      +-- ClusterRole: eksdeveloper-clusterrole (Read-Only)
      |        |
      |        +-- Permissions: get, list (nodes, namespaces, pods, deployments)
      |
      +-- Role: dev-ns-role (in 'dev' namespace)
               |
               +-- Permissions: * (all verbs on all resources in 'dev' namespace)
```

### RBAC Architecture

1. **ClusterRole** (`eksdeveloper-clusterrole`): Read-only cluster-wide access
   - View nodes, namespaces, pods, events
   - List deployments, daemonsets, statefulsets
   - View jobs across the cluster

2. **ClusterRoleBinding** (`eksdeveloper-clusterrolebinding`): Binds ClusterRole to group
   - Maps `eks-developer-group` to the ClusterRole

3. **Role** (`dev-ns-role`): Full access within `dev` namespace
   - All verbs (* ) on all resources
   - Create, update, delete deployments, services, pods
   - Manage jobs and cronjobs

4. **RoleBinding** (`dev-ns-rolebinding`): Binds Role to group in namespace
   - Maps `eks-developer-group` to Role in `dev` namespace

### Security Boundary

```
Cluster Scope:
├── ClusterRole: Read-Only
│   ├── Nodes: get, list
│   ├── Namespaces: get, list
│   └── Cluster Resources: get, list
│
Namespace Scope (dev):
└── Role: Full Access
    ├── Deployments: * (create, update, delete, etc.)
    ├── Services: * (all operations)
    ├── Pods: * (all operations)
    └── All Resources: * (complete control)

Blocked:
├── Other Namespaces: No access
├── Cluster-wide Changes: No access
└── System Namespaces: No access
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
        "iam:AttachRolePolicy",
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
EKS-DeveloperAccess-IAM-Users/
│
├── ekscluster-terraform-manifests/
│   ├── c1-versions.tf                    # Terraform versions
│   ├── c2-01-generic-variables.tf        # Common variables
│   ├── c2-02-local-values.tf             # Local values and tags
│   ├── c3-01-vpc-variables.tf            # VPC configuration
│   ├── c3-02-vpc-module.tf               # VPC module
│   ├── c3-03-vpc-outputs.tf              # VPC outputs
│   ├── c4-xx-ec2bastion-*.tf             # Bastion host configuration
│   ├── c5-xx-eks-*.tf                    # EKS cluster configuration
│   ├── c6-xx-iam-oidc-*.tf               # OIDC provider
│   ├── c7-01-kubernetes-provider.tf      # Kubernetes provider
│   ├── c7-02-kubernetes-configmap.tf     # aws-auth ConfigMap
│   ├── c8-01-iam-admin-user.tf           # Admin user
│   ├── c8-02-iam-basic-user.tf           # Basic user
│   ├── c9-xx-iam-role-eksadmins.tf       # Admin role configuration
│   ├── c10-xx-iam-role-eksreadonly.tf    # Read-only role
│   ├── c11-01-iam-role-eksdeveloper.tf   # Developer IAM role ⭐
│   ├── c11-02-iam-group-and-user-eksdeveloper.tf # Developer group/user ⭐
│   ├── c11-03-k8s-clusterrole-clusterrolebinding.tf # Cluster-level RBAC ⭐
│   ├── c11-04-namespaces.tf              # Kubernetes namespaces ⭐
│   └── c11-05-k8s-role-rolebinding.tf    # Namespace-level RBAC ⭐
│
├── k8sresources-terraform-manifests/
│   ├── c1-versions.tf
│   ├── c2-remote-state-datasource.tf     # Remote state from EKS
│   ├── c3-providers.tf
│   ├── c4-kubernetes-deployment.tf        # Sample deployment
│   ├── c5-kubernetes-loadbalancer-service-clb.tf
│   ├── c6-kubernetes-nodeport-service.tf
│   └── c7-kubernetes-loadbalancer-service-nlb.tf
│
├── app1-kube-manifests/
│   ├── 01-Deployment.yaml                # Test application
│   ├── 02-CLB-LoadBalancer-Service.yaml  # Classic LoadBalancer
│   ├── 03-NodePort-Service.yaml          # NodePort service
│   └── 04-NLB-LoadBalancer-Service.yaml  # Network LoadBalancer
│
└── kube-manifests-crb-cr/
    ├── 00-k8s-dev-namespace.yaml         # Dev namespace creation
    ├── 01-k8s-clusterrole-clusterrolebinding.yaml # Cluster RBAC
    └── 02-k8s-role-rolebinding-dev-namespace.yaml # Namespace RBAC
```

## Usage

### Step 1: Deploy EKS Cluster with Developer RBAC

```bash
# Navigate to manifests directory
cd ekscluster-terraform-manifests

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Deploy the infrastructure
terraform apply

# Note the outputs
terraform output
```

### Step 2: Configure kubectl Access

```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name <cluster-name>

# Verify cluster access (as admin)
kubectl get nodes
kubectl get namespaces
```

### Step 3: Verify Developer IAM Resources

```bash
# Check IAM role
aws iam get-role --role-name hr-dev-eks-developer-role

# Check IAM group
aws iam get-group --group-name hr-dev-eksdeveloper

# List users in group
aws iam get-group --group-name hr-dev-eksdeveloper --query 'Users[*].UserName'

# Verify role policies
aws iam list-role-policies --role-name hr-dev-eks-developer-role
```

### Step 4: Verify Kubernetes RBAC Configuration

```bash
# Check ClusterRole
kubectl get clusterrole eksdeveloper-clusterrole
kubectl describe clusterrole eksdeveloper-clusterrole

# Check ClusterRoleBinding
kubectl get clusterrolebinding eksdeveloper-clusterrolebinding
kubectl describe clusterrolebinding eksdeveloper-clusterrolebinding

# Check dev namespace
kubectl get namespace dev

# Check Role in dev namespace
kubectl get role -n dev
kubectl describe role dev-ns-role -n dev

# Check RoleBinding in dev namespace
kubectl get rolebinding -n dev
kubectl describe rolebinding dev-ns-rolebinding -n dev
```

### Step 5: Configure Developer AWS CLI Profile

Create an AWS CLI profile for the developer user:

```bash
# Edit ~/.aws/config
cat >> ~/.aws/config << EOF

[profile eks-developer]
role_arn = arn:aws:iam::123456789012:role/hr-dev-eks-developer-role
source_profile = developer-user
region = us-east-1
output = json
EOF

# Edit ~/.aws/credentials for the developer user
cat >> ~/.aws/credentials << EOF

[developer-user]
aws_access_key_id = AKIA...
aws_secret_access_key = ...
EOF
```

### Step 6: Assume Developer Role and Test Access

```bash
# Switch to developer profile
export AWS_PROFILE=eks-developer

# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name <cluster-name>

# Verify identity
aws sts get-caller-identity
kubectl config current-context

# Test cluster-level read access (should work)
kubectl get nodes
kubectl get namespaces
kubectl get pods -A

# Test cluster-level write access (should fail)
kubectl create namespace test-ns
# Error: User "eks-developer" cannot create resource "namespaces" at the cluster scope

# Test dev namespace read access (should work)
kubectl get all -n dev

# Test dev namespace write access (should work)
kubectl create deployment nginx --image=nginx -n dev
kubectl get deployments -n dev

# Test access to other namespaces (should fail)
kubectl get pods -n default
# Error: User "eks-developer" cannot list resource "pods" in namespace "default"

kubectl create deployment nginx --image=nginx -n default
# Error: User "eks-developer" cannot create resource "deployments" in namespace "default"
```

### Step 7: Deploy Application to Dev Namespace

```bash
# As developer user
export AWS_PROFILE=eks-developer

# Navigate to app manifests
cd ../app1-kube-manifests

# Deploy to dev namespace
kubectl apply -f 01-Deployment.yaml -n dev
kubectl apply -f 03-NodePort-Service.yaml -n dev

# Verify deployment
kubectl get all -n dev

# View logs
kubectl logs -n dev -l app=myapp1

# Scale deployment
kubectl scale deployment myapp1-deployment --replicas=3 -n dev

# Update deployment
kubectl set image deployment/myapp1-deployment myapp1=nginx:1.21 -n dev
```

### Step 8: Test Permission Boundaries

```bash
# Test what developer can do
kubectl auth can-i get nodes                    # yes (cluster read)
kubectl auth can-i list namespaces              # yes (cluster read)
kubectl auth can-i create deployments -n dev    # yes (namespace admin)
kubectl auth can-i delete pods -n dev           # yes (namespace admin)
kubectl auth can-i get secrets -n dev           # yes (namespace admin)

# Test what developer cannot do
kubectl auth can-i create namespaces            # no (cluster write)
kubectl auth can-i delete nodes                 # no (cluster write)
kubectl auth can-i create deployments -n default # no (other namespace)
kubectl auth can-i get secrets -n kube-system   # no (other namespace)
```

### Step 9: Add Additional Developer Users

```bash
# Create new developer user
aws iam create-user --user-name jane-developer

# Add to developer group
aws iam add-user-to-group \
  --user-name jane-developer \
  --group-name hr-dev-eksdeveloper

# Create access keys
aws iam create-access-key --user-name jane-developer

# User can now assume the developer role and access dev namespace
```

## Configuration

### IAM Role - Developer Access

The developer IAM role (`c11-01-iam-role-eksdeveloper.tf`):

```hcl
resource "aws_iam_role" "eks_developer_role" {
  name = "${local.name}-eks-developer-role"

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

  inline_policy {
    name = "eks-developer-access-policy"
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
}

# Additional AWS service permissions
resource "aws_iam_role_policy_attachment" "eks_developer_s3" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
  role       = aws_iam_role.eks_developer_role.name
}

resource "aws_iam_role_policy_attachment" "eks_developer_dynamodb" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
  role       = aws_iam_role.eks_developer_role.name
}
```

### IAM Group and User Configuration

The developer group and user (`c11-02-iam-group-and-user-eksdeveloper.tf`):

```hcl
# IAM Group
resource "aws_iam_group" "eksdeveloper_iam_group" {
  name = "${local.name}-eksdeveloper"
  path = "/"
}

# Group Policy - Allow AssumeRole
resource "aws_iam_group_policy" "eksdeveloper_iam_group_assumerole_policy" {
  name  = "${local.name}-eksdeveloper-group-policy"
  group = aws_iam_group.eksdeveloper_iam_group.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = ["sts:AssumeRole"]
        Effect   = "Allow"
        Resource = aws_iam_role.eks_developer_role.arn
      }
    ]
  })
}

# IAM User
resource "aws_iam_user" "eksdeveloper_user" {
  name          = "${local.name}-eksdeveloper1"
  path          = "/"
  force_destroy = true
  tags          = local.common_tags
}

# Group Membership
resource "aws_iam_group_membership" "eksdeveloper" {
  name  = "${local.name}-eksdeveloper-group-membership"
  users = [aws_iam_user.eksdeveloper_user.name]
  group = aws_iam_group.eksdeveloper_iam_group.name
}
```

### ClusterRole - Read-Only Cluster Access

The ClusterRole (`c11-03-k8s-clusterrole-clusterrolebinding.tf`):

```hcl
resource "kubernetes_cluster_role_v1" "eksdeveloper_clusterrole" {
  metadata {
    name = "eksdeveloper-clusterrole"
  }

  # Rule-1: Cluster-wide read access
  rule {
    api_groups = [""]
    resources  = ["nodes", "namespaces", "pods", "events"]
    verbs      = ["get", "list"]
  }

  # Rule-2: Apps read access
  rule {
    api_groups = ["apps"]
    resources  = ["deployments", "daemonsets", "statefulsets", "replicasets"]
    verbs      = ["get", "list"]
  }

  # Rule-3: Batch read access
  rule {
    api_groups = ["batch"]
    resources  = ["jobs"]
    verbs      = ["get", "list"]
  }
}

resource "kubernetes_cluster_role_binding_v1" "eksdeveloper_clusterrolebinding" {
  metadata {
    name = "eksdeveloper-clusterrolebinding"
  }
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = kubernetes_cluster_role_v1.eksdeveloper_clusterrole.metadata[0].name
  }
  subject {
    kind      = "Group"
    name      = "eks-developer-group"
    api_group = "rbac.authorization.k8s.io"
  }
}
```

### Namespace and Role - Full Access in Dev Namespace

The namespace and role configuration (`c11-04-namespaces.tf` and `c11-05-k8s-role-rolebinding.tf`):

```hcl
# Create dev namespace
resource "kubernetes_namespace_v1" "dev" {
  metadata {
    name = "dev"
  }
}

# Role with full access in dev namespace
resource "kubernetes_role_v1" "eksdeveloper_role" {
  metadata {
    name      = "dev-ns-role"
    namespace = kubernetes_namespace_v1.dev.metadata[0].name
  }

  # Rule-1: Full access to all core resources
  rule {
    api_groups = ["", "extensions", "apps"]
    resources  = ["*"]
    verbs      = ["*"]
  }

  # Rule-2: Full access to batch resources
  rule {
    api_groups = ["batch"]
    resources  = ["jobs", "cronjobs"]
    verbs      = ["*"]
  }
}

# RoleBinding
resource "kubernetes_role_binding_v1" "eksdeveloper_rolebinding" {
  metadata {
    name      = "dev-ns-rolebinding"
    namespace = kubernetes_namespace_v1.dev.metadata[0].name
  }
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "Role"
    name      = kubernetes_role_v1.eksdeveloper_role.metadata[0].name
  }
  subject {
    kind      = "Group"
    name      = "eks-developer-group"
    namespace = kubernetes_namespace_v1.dev.metadata[0].name
    api_group = "rbac.authorization.k8s.io"
  }
}
```

### aws-auth ConfigMap Mapping

The developer role is mapped in the aws-auth ConfigMap (`c7-02-kubernetes-configmap.tf`):

```hcl
locals {
  configmap_roles = [
    # ... other roles ...
    {
      rolearn  = aws_iam_role.eks_developer_role.arn
      username = "eks-developer"
      groups   = [kubernetes_role_binding_v1.eksdeveloper_rolebinding.subject[0].name]
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

### Customizing Developer Permissions

#### Add More Namespaces

```hcl
# Create additional namespaces
resource "kubernetes_namespace_v1" "staging" {
  metadata {
    name = "staging"
  }
}

# Create role for staging namespace
resource "kubernetes_role_v1" "eksdeveloper_staging_role" {
  metadata {
    name      = "staging-ns-role"
    namespace = kubernetes_namespace_v1.staging.metadata[0].name
  }
  rule {
    api_groups = ["", "extensions", "apps"]
    resources  = ["*"]
    verbs      = ["*"]
  }
}

# Create rolebinding for staging
resource "kubernetes_role_binding_v1" "eksdeveloper_staging_rolebinding" {
  metadata {
    name      = "staging-ns-rolebinding"
    namespace = kubernetes_namespace_v1.staging.metadata[0].name
  }
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "Role"
    name      = kubernetes_role_v1.eksdeveloper_staging_role.metadata[0].name
  }
  subject {
    kind      = "Group"
    name      = "eks-developer-group"
    api_group = "rbac.authorization.k8s.io"
  }
}
```

#### Restrict Namespace Permissions

```hcl
# Example: Limit to deployments and services only
resource "kubernetes_role_v1" "eksdeveloper_limited_role" {
  metadata {
    name      = "dev-ns-limited-role"
    namespace = kubernetes_namespace_v1.dev.metadata[0].name
  }

  # Only deployments
  rule {
    api_groups = ["apps"]
    resources  = ["deployments"]
    verbs      = ["get", "list", "create", "update", "patch", "delete"]
  }

  # Only services
  rule {
    api_groups = [""]
    resources  = ["services"]
    verbs      = ["get", "list", "create", "update", "patch", "delete"]
  }

  # Read-only pods
  rule {
    api_groups = [""]
    resources  = ["pods", "pods/log"]
    verbs      = ["get", "list", "watch"]
  }
}
```

## Features

### Developer Capabilities

- **Cluster Visibility**: View nodes, namespaces, and cluster-wide resources
- **Namespace Admin**: Full control within assigned namespaces
- **Resource Management**: Create, update, delete deployments, services, pods
- **Log Access**: View logs for pods in assigned namespaces
- **Secret Management**: Manage secrets within assigned namespaces
- **Resource Quotas**: Subject to namespace resource quotas and limits

### Security Features

- **Namespace Isolation**: Cannot access other namespaces
- **Cluster Protection**: Cannot modify cluster-wide resources
- **Audit Trail**: All actions logged via CloudTrail and Kubernetes audit logs
- **Temporary Credentials**: Role assumption provides temporary access
- **Group-Based Management**: Easy user onboarding via IAM groups

### Operational Features

- **Self-Service**: Developers manage their own namespace
- **CI/CD Integration**: Roles work with CI/CD pipelines
- **AWS Service Access**: Optional S3, DynamoDB access for applications
- **Console Access**: Works with AWS EKS console
- **kubectl Integration**: Standard kubectl workflows

## Troubleshooting

### Cannot Assume Developer Role

**Problem**: User gets "AccessDenied" when assuming role

**Solutions**:

```bash
# Verify user is in the group
aws iam get-group --group-name hr-dev-eksdeveloper

# Check group policy
aws iam get-group-policy \
  --group-name hr-dev-eksdeveloper \
  --policy-name hr-dev-eksdeveloper-group-policy

# Verify role trust policy
aws iam get-role --role-name hr-dev-eks-developer-role

# Test role assumption
aws sts assume-role \
  --role-arn arn:aws:iam::123456789012:role/hr-dev-eks-developer-role \
  --role-session-name test
```

### Cannot Create Resources in Dev Namespace

**Problem**: "User cannot create resource in namespace dev"

**Solutions**:

```bash
# Verify role mapping in aws-auth
kubectl get configmap aws-auth -n kube-system -o yaml

# Check RoleBinding
kubectl describe rolebinding dev-ns-rolebinding -n dev

# Verify group name matches
kubectl get rolebinding dev-ns-rolebinding -n dev -o yaml | grep "name:"

# Check current user identity
kubectl auth whoami
aws sts get-caller-identity

# Test permissions
kubectl auth can-i create deployments -n dev
kubectl auth can-i get pods -n dev
```

### Can Access Other Namespaces

**Problem**: Developer can access resources in default or other namespaces

**Solutions**:

```bash
# This should NOT be possible - check RBAC configuration

# Verify ClusterRole only has get/list verbs
kubectl get clusterrole eksdeveloper-clusterrole -o yaml

# Check for any additional RoleBindings
kubectl get rolebindings -A | grep eks-developer

# Verify no admin ClusterRoleBindings
kubectl get clusterrolebindings | grep eks-developer

# Should only see eksdeveloper-clusterrolebinding
```

### Wrong Group Name in RBAC

**Problem**: Role bindings reference incorrect group name

**Solutions**:

```bash
# Check group name in aws-auth ConfigMap
kubectl get configmap aws-auth -n kube-system -o jsonpath='{.data.mapRoles}' | grep -A 2 developer

# Check group name in ClusterRoleBinding
kubectl get clusterrolebinding eksdeveloper-clusterrolebinding -o yaml | grep "name:"

# Check group name in RoleBinding
kubectl get rolebinding dev-ns-rolebinding -n dev -o yaml | grep "name:"

# All should match: eks-developer-group

# Update if needed
kubectl edit rolebinding dev-ns-rolebinding -n dev
```

### Developer Cannot View Cluster Resources

**Problem**: Cannot list nodes or namespaces

**Solutions**:

```bash
# Verify ClusterRole exists
kubectl get clusterrole eksdeveloper-clusterrole

# Check ClusterRole permissions
kubectl describe clusterrole eksdeveloper-clusterrole

# Verify ClusterRoleBinding
kubectl get clusterrolebinding eksdeveloper-clusterrolebinding

# Check binding details
kubectl describe clusterrolebinding eksdeveloper-clusterrolebinding

# Test specific permissions
kubectl auth can-i get nodes --as=eks-developer
kubectl auth can-i list namespaces --as=eks-developer
```

### Namespace Resource Quota Errors

**Problem**: Cannot create resources due to quota limits

**Solutions**:

```bash
# Check namespace resource quota
kubectl get resourcequota -n dev
kubectl describe resourcequota -n dev

# Check current usage
kubectl describe namespace dev

# Request quota increase or clean up resources
kubectl delete deployment <unused-deployment> -n dev

# View all resources in namespace
kubectl get all -n dev
```

## Best Practices

### 1. Security Best Practices

- **Principle of Least Privilege**: Grant only necessary permissions
- **Namespace Isolation**: One namespace per team or environment
- **Secret Management**: Use AWS Secrets Manager or External Secrets Operator
- **Network Policies**: Implement network policies for namespace isolation
- **Pod Security**: Apply Pod Security Standards to namespaces

```yaml
# Apply Pod Security Standard to dev namespace
apiVersion: v1
kind: Namespace
metadata:
  name: dev
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

### 2. Resource Management

- **Resource Quotas**: Set quotas for CPU, memory, and object counts
- **Limit Ranges**: Define default and maximum resource limits
- **Storage Classes**: Restrict storage class usage
- **Load Balancer Limits**: Control number of LoadBalancer services

```yaml
# Resource Quota for dev namespace
apiVersion: v1
kind: ResourceQuota
metadata:
  name: dev-resource-quota
  namespace: dev
spec:
  hard:
    requests.cpu: "10"
    requests.memory: "20Gi"
    limits.cpu: "20"
    limits.memory: "40Gi"
    pods: "50"
    services.loadbalancers: "3"
```

### 3. Access Management

- **Group-Based Access**: Always use IAM groups, not individual users
- **Role Naming**: Use clear, descriptive role names
- **Regular Audits**: Review access permissions quarterly
- **Temporary Access**: Use time-limited credentials
- **MFA**: Require MFA for role assumption in production

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::123456789012:role/eks-developer-role",
      "Condition": {
        "Bool": {
          "aws:MultiFactorAuthPresent": "true"
        }
      }
    }
  ]
}
```

### 4. Namespace Organization

- **Naming Convention**: Use consistent namespace naming (dev, staging, prod)
- **Resource Labels**: Apply standard labels to all resources
- **Multiple Namespaces**: Create separate namespaces for teams
- **Environment Separation**: Different namespaces for dev/staging/prod

```yaml
# Labels for resources
metadata:
  labels:
    app: myapp
    team: platform
    environment: dev
    managed-by: terraform
```

### 5. Monitoring and Auditing

- **CloudTrail**: Enable CloudTrail for all API calls
- **Kubernetes Audit**: Enable audit logging
- **CloudWatch**: Monitor namespace resource usage
- **Alerts**: Set up alerts for quota limits

```bash
# Create CloudWatch alarm for namespace CPU usage
aws cloudwatch put-metric-alarm \
  --alarm-name dev-namespace-high-cpu \
  --alarm-description "Alert when dev namespace CPU exceeds 80%" \
  --metric-name namespace_cpu_usage \
  --namespace ContainerInsights \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=Namespace,Value=dev
```

### 6. CI/CD Integration

- **Service Accounts**: Use Kubernetes service accounts for CI/CD
- **IRSA**: Implement IRSA for pod-level AWS permissions
- **Secrets**: Store CI/CD credentials in AWS Secrets Manager
- **Deployment Automation**: Use GitOps tools like ArgoCD or Flux

```yaml
# Service Account for CI/CD
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cicd-deployer
  namespace: dev
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/cicd-deployer-role
```

### 7. Cost Optimization

- **Resource Limits**: Set appropriate resource limits
- **Horizontal Pod Autoscaling**: Use HPA for efficient scaling
- **Spot Instances**: Use spot instances for dev workloads
- **Clean Up**: Regularly clean up unused resources

```bash
# Find unused resources
kubectl get deployments -n dev -o json | jq '.items[] | select(.spec.replicas==0) | .metadata.name'

# Delete unused deployments
kubectl delete deployment <deployment-name> -n dev
```

### 8. Documentation

- **Access Procedures**: Document how to request access
- **Namespace Guidelines**: Provide guidelines for namespace usage
- **Troubleshooting**: Maintain troubleshooting runbooks
- **Training**: Train developers on RBAC and security
