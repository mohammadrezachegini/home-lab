# Fargate-Only EKS Cluster

## Overview

This project demonstrates how to build a completely serverless Amazon EKS cluster that runs exclusively on AWS Fargate without any EC2 worker nodes. Unlike hybrid architectures that combine EC2 node groups with Fargate profiles, this implementation provisions all cluster workloads - including system components like CoreDNS - on Fargate infrastructure.

This fully serverless approach eliminates EC2 instance management entirely, providing automatic scaling, enhanced security through pod-level isolation, and a true pay-per-pod pricing model. The project showcases how to configure Fargate profiles for the `kube-system`, `default`, and custom application namespaces to ensure all Kubernetes components run on Fargate compute.

## Architecture

This project creates a complete serverless EKS infrastructure:

```
Serverless EKS Cluster Architecture
════════════════════════════════════

Internet
    |
    v
Route53 DNS (ExternalDNS)
    |
    v
Application Load Balancer (ALB)
    |
    +-- HTTPS:443 (SSL/TLS Termination)
    +-- HTTP:80 (Redirect to HTTPS)
    |
    v
ALB Ingress Controller (Fargate Pod)
    |
    +-- Path Routing to Services
    |
    v
Application Pods (All on Fargate)
    |
    +-- fp-ns-app1 namespace
    |   ├── App1 Deployment
    |   ├── App2 Deployment
    |   └── App3 Deployment
    |
    +-- default namespace (Fargate)
    |
    +-- kube-system namespace (Fargate)
        ├── CoreDNS
        ├── aws-load-balancer-controller
        └── Other system pods

EKS Control Plane (Managed by AWS)
    |
    +-- API Server
    +-- Scheduler
    +-- Controller Manager

Fargate Profiles (3 Total)
├── 1. kube-system Profile
│   └── Selector: namespace = kube-system
├── 2. default Profile
│   └── Selector: namespace = default
└── 3. fp-ns-app1 Profile
    └── Selector: namespace = fp-ns-app1

Supporting Infrastructure
├── VPC (Multi-AZ)
│   ├── Public Subnets (for ALB)
│   └── Private Subnets (for Fargate Pods)
├── IAM Roles
│   ├── EKS Cluster Role
│   ├── Fargate Pod Execution Role
│   ├── LBC IRSA Role
│   └── ExternalDNS IRSA Role
└── OIDC Provider (for IRSA)
```

### Key Architectural Differences from Hybrid Clusters

| Aspect | Fargate-Only | Hybrid (EC2 + Fargate) |
|--------|--------------|------------------------|
| Worker Nodes | Zero EC2 nodes | EC2 node groups |
| System Pods | Run on Fargate | Usually on EC2 |
| CoreDNS | Fargate profile required | Runs on EC2 |
| Management Overhead | Minimal | Moderate (node patching) |
| Cost Model | Per-pod consumption | Fixed EC2 + per-pod |
| Security | Pod-level isolation | Node-level isolation |
| Startup Time | 30-60 seconds | 5-10 seconds |

## Prerequisites

### Required Tools

- **Terraform**: >= 1.0
- **AWS CLI**: >= 2.0 (configured with credentials)
- **kubectl**: >= 1.21
- **eksctl**: (Optional) For cluster validation

### AWS Requirements

- **AWS Account** with permissions to create:
  - EKS clusters and Fargate profiles
  - VPC infrastructure (VPC, subnets, NAT gateways, internet gateways)
  - IAM roles and policies
  - OIDC providers
  - Application Load Balancers
  - Route53 records
  - ACM certificates
  - CloudWatch log groups

### Domain Requirements

- **Route53 Hosted Zone**: For DNS management
- **Domain Name**: Registered domain
- **ACM Certificate**: SSL/TLS certificate (can be created via Terraform)

### Important Considerations

- **No Bastion Host**: This cluster has no EC2 nodes (no bastion access)
- **Private Subnet Access**: Fargate pods run in private subnets only
- **NAT Gateway Required**: For outbound internet connectivity
- **Longer Pod Startup**: Expect 30-60 second pod startup times

## Project Structure

```
Fargate-Only-EKS-Cluster/
├── ekscluster-terraform-manifests/        # Serverless EKS cluster
│   ├── c1-versions.tf                     # Provider versions
│   ├── c2-01-generic-variables.tf         # Common variables
│   ├── c2-02-local-values.tf              # Local computed values
│   ├── c3-01-vpc-variables.tf             # VPC configuration variables
│   ├── c3-02-vpc-module.tf                # VPC module (public/private subnets)
│   ├── c3-03-vpc-outputs.tf               # VPC outputs
│   ├── c4-01-eks-variables.tf             # EKS variables
│   ├── c4-02-eks-outputs.tf               # EKS outputs
│   ├── c4-03-iamrole-for-eks-cluster.tf   # EKS cluster IAM role
│   ├── c4-04-eks-cluster.tf               # EKS cluster resource (no node groups!)
│   ├── c4-05-fargate-profile-iam-role-and-policy.tf  # Shared pod execution role
│   ├── c4-06-fargate-profile-kube-system-namespace.tf  # Critical!
│   ├── c4-07-fargate-profile-default-namespace.tf
│   ├── c4-08-fargate-profile-fp-ns-app1-namespace.tf
│   ├── c5-01-iam-oidc-connect-provider-variables.tf
│   ├── c5-02-iam-oidc-connect-provider.tf # For IRSA
│   ├── terraform.tfvars
│   ├── vpc.auto.tfvars
│   └── eks.auto.tfvars
│
├── lbc-install-terraform-manifests/       # Load Balancer Controller
│   ├── c1-versions.tf
│   ├── c2-remote-state-datasource.tf      # Reference to cluster state
│   ├── c3-01-generic-variables.tf
│   ├── c3-02-local-values.tf
│   ├── c4-01-lbc-datasources.tf           # LBC IAM policy
│   ├── c4-02-lbc-iam-policy-and-role.tf   # IRSA for LBC
│   ├── c4-03-lbc-helm-provider.tf
│   ├── c4-04-lbc-install.tf               # Helm chart installation
│   ├── c4-05-lbc-outputs.tf
│   ├── c5-01-kubernetes-provider.tf
│   ├── c5-02-ingress-class.tf
│   └── terraform.tfvars
│
├── externaldns-install-terraform-manifests/  # ExternalDNS
│   ├── c1-versions.tf
│   ├── c2-remote-state-datasource.tf
│   ├── c3-01-generic-variables.tf
│   ├── c3-02-local-values.tf
│   ├── c4-01-externaldns-iam-policy-and-role.tf
│   ├── c4-02-externaldns-helm-provider.tf
│   ├── c4-03-externaldns-install.tf
│   ├── c4-04-externaldns-outputs.tf
│   └── terraform.tfvars
│
└── run-on-fargate-terraform-manifests/    # Application deployment
    ├── c1-versions.tf
    ├── c2-remote-state-datasource.tf
    ├── c3-providers.tf
    ├── c4-kubernetes-app1-deployment.tf   # App1 on Fargate
    ├── c5-kubernetes-app2-deployment.tf   # App2 on Fargate
    ├── c6-kubernetes-app3-deployment.tf   # App3 on Fargate
    ├── c7-kubernetes-app1-nodeport-service.tf
    ├── c8-kubernetes-app2-nodeport-service.tf
    ├── c9-kubernetes-app3-nodeport-service.tf
    ├── c10-kubernetes-ingress-service.tf  # ALB ingress (IP target)
    └── c11-acm-certificate.tf             # SSL certificate
```

### Critical File: Fargate Profile for kube-system

The most important configuration in this project:

**c4-06-fargate-profile-kube-system-namespace.tf**
- Ensures system pods (CoreDNS, etc.) run on Fargate
- Without this, cluster will not function properly
- Must be created during cluster provisioning

## Usage

### Step 1: Deploy Serverless EKS Cluster

```bash
cd ekscluster-terraform-manifests

# Review configuration
cat eks.auto.tfvars
cat vpc.auto.tfvars

# Initialize Terraform
terraform init

# Review plan - note NO node groups, only Fargate profiles
terraform plan

# Apply configuration
terraform apply -auto-approve

# This creates:
# - VPC with public/private subnets
# - EKS cluster control plane
# - 3 Fargate profiles (kube-system, default, fp-ns-app1)
# - OIDC provider for IRSA
# - IAM roles

# Update kubeconfig
aws eks update-kubeconfig \
  --region us-east-1 \
  --name hr-dev-eksdemo

# Verify cluster (no EC2 nodes!)
kubectl get nodes
# Should show NO nodes initially

# Wait for CoreDNS to start on Fargate (may take 2-3 minutes)
kubectl get pods -n kube-system -w

# After CoreDNS is running, Fargate nodes will appear
kubectl get nodes
# Shows fargate-<random> nodes
```

### Step 2: Verify Fargate Profiles

```bash
# List all Fargate profiles
aws eks list-fargate-profiles --cluster-name hr-dev-eksdemo

# Should return:
# - hr-dev-fp-kube-system
# - hr-dev-fp-default
# - hr-dev-fp-ns-app1

# Describe kube-system profile (most critical)
aws eks describe-fargate-profile \
  --cluster-name hr-dev-eksdemo \
  --fargate-profile-name hr-dev-fp-kube-system

# Verify CoreDNS is on Fargate
kubectl get pods -n kube-system -o wide
# Node column should show fargate-xxx

# Check node labels
kubectl get nodes --show-labels
# Should see: eks.amazonaws.com/compute-type=fargate
```

### Step 3: Install AWS Load Balancer Controller

```bash
cd ../lbc-install-terraform-manifests

terraform init
terraform plan
terraform apply -auto-approve

# Wait for LBC to be ready
kubectl get deployment -n kube-system aws-load-balancer-controller
kubectl wait --for=condition=available \
  --timeout=300s \
  deployment/aws-load-balancer-controller \
  -n kube-system

# Verify LBC is running on Fargate
kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller -o wide

# Check ingress class
kubectl get ingressclass
```

### Step 4: Install ExternalDNS

```bash
cd ../externaldns-install-terraform-manifests

# Update terraform.tfvars with your domain
terraform init
terraform plan
terraform apply -auto-approve

# Verify ExternalDNS
kubectl get deployment -n external-dns
kubectl get pods -n external-dns -o wide
# Should show Fargate nodes

# Check logs
kubectl logs -n external-dns deployment/external-dns
```

### Step 5: Deploy Applications

```bash
cd ../run-on-fargate-terraform-manifests

# Update domain and certificate ARN in:
# - c11-acm-certificate.tf
# - c10-kubernetes-ingress-service.tf

terraform init
terraform plan
terraform apply -auto-approve

# Monitor application pods starting on Fargate
kubectl get pods -n fp-ns-app1 -w

# Verify all pods are on Fargate
kubectl get pods -n fp-ns-app1 -o wide
kubectl get nodes -l eks.amazonaws.com/compute-type=fargate
```

### Step 6: Verify Complete Serverless Deployment

```bash
# Count total pods
kubectl get pods --all-namespaces

# Verify ALL pods are on Fargate nodes
kubectl get pods --all-namespaces -o wide

# Get all nodes (should all be Fargate)
kubectl get nodes
kubectl get nodes -l eks.amazonaws.com/compute-type=fargate

# Verify no EC2 instances in Auto Scaling Groups
aws autoscaling describe-auto-scaling-groups \
  --query "AutoScalingGroups[?contains(AutoScalingGroupName, 'eks')].AutoScalingGroupName"
# Should return empty or no EKS-related ASGs

# Check ingress
kubectl get ingress -n fp-ns-app1

# Get ALB URL
kubectl get ingress fargate-profile-demo -n fp-ns-app1 \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

### Step 7: Test Applications

```bash
# Get ALB DNS
ALB_DNS=$(kubectl get ingress fargate-profile-demo -n fp-ns-app1 \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Test via ALB
curl https://$ALB_DNS/app1/index.html
curl https://$ALB_DNS/app2/index.html
curl https://$ALB_DNS/

# Test via domain (after DNS propagation)
curl https://fargate-profile-demo-501.yourdomain.com/app1/index.html
curl https://fargate-profile-demo-501.yourdomain.com/app2/index.html

# Verify SSL
openssl s_client -connect fargate-profile-demo-501.yourdomain.com:443 -servername fargate-profile-demo-501.yourdomain.com
```

### Step 8: Monitor Serverless Cluster

```bash
# View all resources
kubectl get all --all-namespaces

# Check resource consumption
kubectl top nodes  # May not work without metrics-server
kubectl top pods --all-namespaces

# View events
kubectl get events --all-namespaces --sort-by='.lastTimestamp'

# Check Fargate profile statuses
for profile in $(aws eks list-fargate-profiles --cluster-name hr-dev-eksdemo --query 'fargateProfileNames[]' --output text); do
  echo "Profile: $profile"
  aws eks describe-fargate-profile \
    --cluster-name hr-dev-eksdemo \
    --fargate-profile-name $profile \
    --query 'fargateProfile.status'
done
```

### Step 9: Cleanup

```bash
# IMPORTANT: Delete in reverse order

# Delete applications first
cd run-on-fargate-terraform-manifests
terraform destroy -auto-approve

# Verify ingress is deleted (ALB removed)
kubectl get ingress -n fp-ns-app1
# Wait until empty

# Delete ExternalDNS
cd ../externaldns-install-terraform-manifests
terraform destroy -auto-approve

# Delete LBC
cd ../lbc-install-terraform-manifests
terraform destroy -auto-approve

# Wait for all system resources to be cleaned up
kubectl get all --all-namespaces

# Finally, delete cluster and Fargate profiles
cd ../ekscluster-terraform-manifests
terraform destroy -auto-approve

# Verify cluster deletion
aws eks list-clusters
```

## Configuration

### EKS Cluster (Serverless) Configuration

```hcl
# ekscluster-terraform-manifests/c4-04-eks-cluster.tf

resource "aws_eks_cluster" "eks_cluster" {
  name     = "${local.name}-${var.cluster_name}"
  role_arn = aws_iam_role.eks_master_role.arn
  version  = var.cluster_version

  vpc_config {
    # Using PUBLIC subnets for cluster endpoint
    # Fargate pods will still use private subnets
    subnet_ids              = module.vpc.public_subnets
    endpoint_private_access = var.cluster_endpoint_private_access
    endpoint_public_access  = var.cluster_endpoint_public_access
    public_access_cidrs     = var.cluster_endpoint_public_access_cidrs
  }

  kubernetes_network_config {
    service_ipv4_cidr = var.cluster_service_ipv4_cidr
  }

  # Enable comprehensive logging
  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  depends_on = [
    aws_iam_role_policy_attachment.eks-AmazonEKSClusterPolicy,
    aws_iam_role_policy_attachment.eks-AmazonEKSVPCResourceController,
  ]
}

# NOTE: No aws_eks_node_group resources - that's the key difference!
```

### Fargate Pod Execution Role (Shared)

```hcl
# ekscluster-terraform-manifests/c4-05-fargate-profile-iam-role-and-policy.tf

resource "aws_iam_role" "fargate_profile_role" {
  name = "${local.name}-eks-fargate-profile-role"

  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks-fargate-pods.amazonaws.com"
      }
    }]
    Version = "2012-10-17"
  })
}

resource "aws_iam_role_policy_attachment" "eks_fargate_pod_execution_role_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSFargatePodExecutionRolePolicy"
  role       = aws_iam_role.fargate_profile_role.name
}
```

### Critical: Fargate Profile for kube-system

```hcl
# ekscluster-terraform-manifests/c4-06-fargate-profile-kube-system-namespace.tf

resource "aws_eks_fargate_profile" "fargate_profile_kube_system" {
  cluster_name           = aws_eks_cluster.eks_cluster.id
  fargate_profile_name   = "${local.name}-fp-kube-system"
  pod_execution_role_arn = aws_iam_role.fargate_profile_role.arn
  subnet_ids             = module.vpc.private_subnets  # MUST be private

  selector {
    namespace = "kube-system"

    # Optional: Run ONLY CoreDNS on Fargate
    # Uncomment to restrict to CoreDNS only
    #labels = {
    #  "k8s-app" = "kube-dns"
    #}
  }
}

# Without this profile, CoreDNS cannot start, and the cluster is non-functional!
```

### Fargate Profile for default Namespace

```hcl
# ekscluster-terraform-manifests/c4-07-fargate-profile-default-namespace.tf

resource "aws_eks_fargate_profile" "fargate_profile_default" {
  cluster_name           = aws_eks_cluster.eks_cluster.id
  fargate_profile_name   = "${local.name}-fp-default"
  pod_execution_role_arn = aws_iam_role.fargate_profile_role.arn
  subnet_ids             = module.vpc.private_subnets

  selector {
    namespace = "default"
  }
}
```

### Fargate Profile for Application Namespace

```hcl
# ekscluster-terraform-manifests/c4-08-fargate-profile-fp-ns-app1-namespace.tf

# Kubernetes Provider (inline configuration)
provider "kubernetes" {
  host                   = aws_eks_cluster.eks_cluster.endpoint
  cluster_ca_certificate = base64decode(aws_eks_cluster.eks_cluster.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.cluster.token
}

# Create namespace
resource "kubernetes_namespace_v1" "fp_ns_app1" {
  metadata {
    name = "fp-ns-app1"
  }
}

# Fargate profile for namespace
resource "aws_eks_fargate_profile" "fargate_profile_apps" {
  cluster_name           = aws_eks_cluster.eks_cluster.id
  fargate_profile_name   = "${local.name}-fp-ns-app1"
  pod_execution_role_arn = aws_iam_role.fargate_profile_role.arn
  subnet_ids             = module.vpc.private_subnets

  selector {
    namespace = kubernetes_namespace_v1.fp_ns_app1.metadata[0].name
  }
}
```

### VPC Configuration for Fargate-Only Cluster

```hcl
# ekscluster-terraform-manifests/c3-02-vpc-module.tf

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${local.name}-${var.vpc_name}"
  cidr = var.vpc_cidr_block

  azs             = var.vpc_availability_zones
  public_subnets  = var.vpc_public_subnets
  private_subnets = var.vpc_private_subnets

  # Critical for Fargate
  enable_nat_gateway = true  # Required for Fargate outbound connectivity
  single_nat_gateway = false # Use multiple for HA
  enable_dns_hostnames = true
  enable_dns_support   = true

  # Public subnet tags (for ALB)
  public_subnet_tags = {
    Type                                              = "Public Subnets"
    "kubernetes.io/role/elb"                          = "1"
    "kubernetes.io/cluster/${local.name}-${var.cluster_name}" = "shared"
  }

  # Private subnet tags (for Fargate pods)
  private_subnet_tags = {
    Type                                              = "Private Subnets"
    "kubernetes.io/role/internal-elb"                 = "1"
    "kubernetes.io/cluster/${local.name}-${var.cluster_name}" = "shared"
  }

  tags     = local.common_tags
  vpc_tags = local.common_tags
}
```

### Variables Configuration

#### eks.auto.tfvars

```hcl
cluster_name                          = "eksdemo"
cluster_service_ipv4_cidr             = "172.20.0.0/16"
cluster_version                       = "1.28"
cluster_endpoint_private_access       = false
cluster_endpoint_public_access        = true
cluster_endpoint_public_access_cidrs  = ["0.0.0.0/0"]

# Note: No node group variables!
```

#### vpc.auto.tfvars

```hcl
vpc_name               = "myvpc"
vpc_cidr_block         = "10.0.0.0/16"
vpc_availability_zones = ["us-east-1a", "us-east-1b"]
vpc_public_subnets     = ["10.0.101.0/24", "10.0.102.0/24"]
vpc_private_subnets    = ["10.0.1.0/24", "10.0.2.0/24"]

# Ensure NAT gateways are enabled
vpc_enable_nat_gateway = true
vpc_single_nat_gateway = false
```

## Features

### 1. Complete Serverless Infrastructure

- **Zero EC2 Management**: No worker nodes to patch, update, or scale
- **Automatic Scaling**: Fargate provisions compute automatically
- **Pod-Level Billing**: Pay only for running pods
- **Enhanced Security**: Pod-level isolation by default

### 2. System Components on Fargate

All Kubernetes system components run on Fargate:
- CoreDNS
- AWS Load Balancer Controller
- ExternalDNS
- Metrics server (if installed)
- Any custom system services

### 3. Multi-Namespace Fargate Support

Separate Fargate profiles for:
- `kube-system`: System components
- `default`: Default workload namespace
- `fp-ns-app1`: Custom application namespace

### 4. Production-Ready Networking

- Multi-AZ VPC with public and private subnets
- NAT gateways for outbound connectivity
- Proper subnet tagging for ALB and internal load balancers
- Security group management via Fargate

### 5. IRSA (IAM Roles for Service Accounts)

- OIDC provider integration
- Fine-grained IAM permissions for pods
- No instance profiles needed

### 6. Application Load Balancer Integration

- IP target type (required for Fargate)
- Path-based routing
- SSL/TLS termination
- Health checks

### 7. Automatic DNS Management

- ExternalDNS for Route53 integration
- Automatic A record creation
- DNS lifecycle management

## Troubleshooting

### Issue: Cluster Created but No Nodes

**Symptoms:**
```bash
kubectl get nodes
# No resources found
```

**Diagnosis:**
```bash
# Check if Fargate profiles exist
aws eks list-fargate-profiles --cluster-name hr-dev-eksdemo

# Check kube-system pods
kubectl get pods -n kube-system
# CoreDNS pods might be Pending
```

**Root Cause:**
Fargate nodes only appear after pods are scheduled. If no pods are running, no Fargate nodes exist.

**Solution:**
```bash
# Wait for CoreDNS to start (may take 2-3 minutes)
kubectl get pods -n kube-system -w

# Once CoreDNS is running, nodes will appear
kubectl get nodes

# If CoreDNS stays pending, check Fargate profile
aws eks describe-fargate-profile \
  --cluster-name hr-dev-eksdemo \
  --fargate-profile-name hr-dev-fp-kube-system \
  --query 'fargateProfile.status'
```

### Issue: CoreDNS Pods Not Starting

**Symptoms:**
```bash
kubectl get pods -n kube-system
# coredns pods in Pending state
```

**Diagnosis:**
```bash
kubectl describe pod <coredns-pod> -n kube-system
# Check Events section

# Verify kube-system Fargate profile
aws eks describe-fargate-profile \
  --cluster-name hr-dev-eksdemo \
  --fargate-profile-name hr-dev-fp-kube-system
```

**Common Causes:**

1. **Fargate profile not created:**
```bash
# Check if profile exists
aws eks list-fargate-profiles --cluster-name hr-dev-eksdemo | grep kube-system
```

2. **Profile uses public subnets:**
```bash
# Verify private subnets are used
aws eks describe-fargate-profile \
  --cluster-name hr-dev-eksdemo \
  --fargate-profile-name hr-dev-fp-kube-system \
  --query 'fargateProfile.subnets'

# Must return private subnet IDs
```

3. **Insufficient IP addresses:**
```bash
# Check subnet capacity
aws ec2 describe-subnets --subnet-ids <subnet-id> \
  --query 'Subnets[0].AvailableIpAddressCount'
```

**Solution:**

Recreate Fargate profile with correct configuration:
```bash
cd ekscluster-terraform-manifests
terraform destroy -target=aws_eks_fargate_profile.fargate_profile_kube_system
terraform apply -auto-approve

# Restart CoreDNS
kubectl rollout restart deployment coredns -n kube-system
```

### Issue: Pods Scheduled on EC2 Instead of Fargate

**Symptoms:**
Pods running on EC2 nodes despite Fargate profile.

**Diagnosis:**
```bash
kubectl get pods -n fp-ns-app1 -o wide
# Check NODE column
```

**Root Cause:**
- Namespace doesn't match Fargate profile selector
- Pod has labels that don't match selector
- EC2 node group still exists

**Solution:**

1. Verify namespace:
```bash
kubectl get pods -n fp-ns-app1 -o jsonpath='{.items[0].metadata.namespace}'
```

2. Check Fargate profile selector:
```bash
aws eks describe-fargate-profile \
  --cluster-name hr-dev-eksdemo \
  --fargate-profile-name hr-dev-fp-ns-app1 \
  --query 'fargateProfile.selectors'
```

3. Verify no EC2 node groups exist:
```bash
aws eks list-nodegroups --cluster-name hr-dev-eksdemo
# Should return empty
```

### Issue: ALB Not Created

**Symptoms:**
```bash
kubectl get ingress -n fp-ns-app1
# No ADDRESS/hostname
```

**Diagnosis:**
```bash
# Check LBC logs
kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller --tail=100

# Check LBC pod status
kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller
```

**Common Causes:**

1. **LBC not running on Fargate:**
```bash
kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller -o wide
# Check if pods are running
```

2. **Missing IP target type:**
```bash
kubectl describe ingress fargate-profile-demo -n fp-ns-app1 | grep target-type
# Must show: ip
```

3. **IAM permissions issue:**
```bash
# Check IRSA annotation
kubectl get sa aws-load-balancer-controller -n kube-system \
  -o jsonpath='{.metadata.annotations.eks\.amazonaws\.com/role-arn}'
```

**Solution:**

Update ingress with IP target type:
```bash
kubectl annotate ingress fargate-profile-demo -n fp-ns-app1 \
  alb.ingress.kubernetes.io/target-type=ip --overwrite
```

### Issue: Long Pod Startup Times

**Symptoms:**
Pods take 30-60 seconds to start.

**Explanation:**
This is normal for Fargate:
- Fargate provisions dedicated infrastructure per pod
- ENI attachment takes time
- Container image pull

**Mitigation:**

1. Use smaller container images:
```dockerfile
# Use Alpine-based images
FROM nginx:alpine
```

2. Pre-warm by maintaining minimum replicas:
```yaml
spec:
  replicas: 2  # Keep minimum pods running
```

3. Implement readiness probes appropriately:
```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 80
  initialDelaySeconds: 30  # Account for Fargate startup
  periodSeconds: 10
```

### Issue: Cannot Access Pods from Bastion

**Problem:**
No bastion host exists in Fargate-only cluster.

**Solution:**

Use `kubectl port-forward`:
```bash
# Forward pod port to local machine
kubectl port-forward -n fp-ns-app1 pod/<pod-name> 8080:80

# Access via localhost
curl http://localhost:8080
```

Or use AWS Systems Manager Session Manager:
```bash
# Start session to any EC2 instance in VPC (if exists)
aws ssm start-session --target <instance-id>
```

### Issue: High Costs

**Symptoms:**
Fargate costs higher than expected.

**Diagnosis:**
```bash
# Count running pods
kubectl get pods --all-namespaces | wc -l

# Check resource requests
kubectl get pods --all-namespaces -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].resources.requests}{"\n"}{end}'
```

**Cost Optimization:**

1. Right-size resource requests:
```yaml
resources:
  requests:
    cpu: "250m"     # Minimize CPU
    memory: "512Mi" # Minimize memory
```

2. Scale down non-production:
```bash
kubectl scale deployment <deployment> --replicas=0 -n fp-ns-app1
```

3. Use Fargate Spot (if available):
```hcl
# Note: Not available for all regions/workloads
```

4. Consider hybrid architecture for always-on workloads:
```hcl
# Use EC2 for baseline, Fargate for bursts
```

### Debugging Commands

```bash
# Cluster information
kubectl cluster-info
kubectl get componentstatuses

# All Fargate profiles
aws eks list-fargate-profiles --cluster-name hr-dev-eksdemo

# Describe each profile
for profile in $(aws eks list-fargate-profiles --cluster-name hr-dev-eksdemo --query 'fargateProfileNames[]' --output text); do
  echo "=== $profile ==="
  aws eks describe-fargate-profile --cluster-name hr-dev-eksdemo --fargate-profile-name $profile
done

# All pods across namespaces
kubectl get pods --all-namespaces -o wide

# Fargate nodes
kubectl get nodes -l eks.amazonaws.com/compute-type=fargate

# Check OIDC provider
aws iam list-open-id-connect-providers

# Verify VPC configuration
aws eks describe-cluster --name hr-dev-eksdemo --query 'cluster.resourcesVpcConfig'

# Check NAT gateway status
aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=<vpc-id>"
```

## Best Practices

### 1. Always Create kube-system Fargate Profile First

**Critical for cluster functionality:**

```hcl
resource "aws_eks_fargate_profile" "fargate_profile_kube_system" {
  cluster_name           = aws_eks_cluster.eks_cluster.id
  fargate_profile_name   = "${local.name}-fp-kube-system"
  pod_execution_role_arn = aws_iam_role.fargate_profile_role.arn
  subnet_ids             = module.vpc.private_subnets

  selector {
    namespace = "kube-system"
  }
}

# This MUST exist before cluster is usable
```

### 2. Use Private Subnets with NAT Gateways

**Required configuration:**

```hcl
module "vpc" {
  # ... other config

  enable_nat_gateway = true
  single_nat_gateway = false  # Multiple NAT for HA

  # Fargate pods MUST use private subnets
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
}
```

### 3. Enable Multi-AZ for High Availability

```hcl
vpc_availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
vpc_private_subnets    = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]

# Fargate profiles will use all subnets
resource "aws_eks_fargate_profile" "profile" {
  subnet_ids = module.vpc.private_subnets  # All AZs
}
```

### 4. Right-Size Pod Resources

**Control Fargate compute size:**

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: app
        resources:
          requests:
            cpu: "250m"     # Controls Fargate vCPU
            memory: "512Mi" # Controls Fargate memory
          limits:
            cpu: "500m"
            memory: "1Gi"
```

**Fargate sizing:**
- Requests determine Fargate compute
- Choose from allowed CPU/memory combinations
- Minimize requests to control costs

### 5. Use IRSA for Pod Permissions

**Never use pod execution role for application permissions:**

```hcl
# Good: Separate service account with IRSA
resource "aws_iam_role" "app_role" {
  name = "app-specific-role"

  assume_role_policy = jsonencode({
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.oidc.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${replace(aws_iam_openid_connect_provider.oidc.url, "https://", "")}:sub" = "system:serviceaccount:fp-ns-app1:my-app-sa"
        }
      }
    }]
  })
}

# Annotate service account
resource "kubernetes_service_account" "app_sa" {
  metadata {
    name      = "my-app-sa"
    namespace = "fp-ns-app1"
    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.app_role.arn
    }
  }
}
```

### 6. Implement Proper Logging

**Enable comprehensive logging:**

```hcl
resource "aws_eks_cluster" "eks_cluster" {
  enabled_cluster_log_types = [
    "api",
    "audit",
    "authenticator",
    "controllerManager",
    "scheduler"
  ]
}
```

**Configure Fluent Bit for Fargate:**

```bash
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/cloudwatch-namespace.yaml

kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/fluent-bit/fluent-bit.yaml
```

### 7. Tag All Resources

```hcl
locals {
  common_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "fargate-only-eks"
    CostCenter  = "engineering"
    Serverless  = "true"
  }
}

resource "aws_eks_cluster" "eks_cluster" {
  tags = local.common_tags
}

resource "aws_eks_fargate_profile" "profile" {
  tags = merge(local.common_tags, {
    FargateProfile = "kube-system"
  })
}
```

### 8. Plan for Sufficient IP Addresses

**Calculate IP requirements:**

```
IPs needed = (Max pods per namespace) × (Number of namespaces) × 1.2
```

**Example:**
- 3 namespaces
- 10 pods max per namespace
- IPs needed: 3 × 10 × 1.2 = 36 IPs per AZ

```hcl
# Use /24 subnets (251 usable IPs per subnet)
vpc_private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
```

### 9. Use Separate Fargate Profiles per Environment

```hcl
# Production profile
resource "aws_eks_fargate_profile" "production" {
  fargate_profile_name = "production-workloads"
  selector {
    namespace = "production"
  }
  tags = {
    Environment = "production"
  }
}

# Staging profile
resource "aws_eks_fargate_profile" "staging" {
  fargate_profile_name = "staging-workloads"
  selector {
    namespace = "staging"
  }
  tags = {
    Environment = "staging"
  }
}
```

### 10. Implement Health Checks and Readiness Probes

**Account for longer startup times:**

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: app
        livenessProbe:
          httpGet:
            path: /healthz
            port: 80
          initialDelaySeconds: 60  # Longer for Fargate
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 5
```

## Cost Comparison: Fargate-Only vs Hybrid

### Fargate-Only Cluster Costs

**Example Workload:**
- 10 pods running 24/7
- Each pod: 0.25 vCPU, 0.5 GB memory

**Fargate Pricing (us-east-1):**
- vCPU: $0.04048/hour
- Memory: $0.004445/GB/hour

**Calculation:**
```
Per pod/hour: (0.25 × $0.04048) + (0.5 × $0.004445) = $0.01234
Per pod/month: $0.01234 × 730 hours = $9.01
Total (10 pods): $9.01 × 10 = $90.10/month
```

**Additional costs:**
- NAT Gateway: ~$32/month per AZ
- Data transfer: Variable
- Control plane: Free

**Total Fargate-Only:** ~$154/month (2 NAT gateways)

### Hybrid Cluster Costs

**Example Workload:**
- 2 t3.medium EC2 nodes (2 vCPU, 4 GB each)
- Same 10 pods

**EC2 Pricing:**
- t3.medium On-Demand: $0.0416/hour = $30.37/month
- Total (2 nodes): $60.74/month

**Additional costs:**
- NAT Gateway: ~$32/month per AZ
- Data transfer: Variable
- Control plane: Free

**Total Hybrid:** ~$125/month (2 NAT gateways)

### Cost Analysis

| Factor | Fargate-Only | Hybrid (EC2) | Winner |
|--------|--------------|--------------|--------|
| Compute | $90/month | $61/month | Hybrid |
| Management | $0 (serverless) | Admin time | Fargate |
| Scaling | Automatic | Manual/ASG setup | Fargate |
| Security patching | Automatic | Manual effort | Fargate |
| Pod isolation | High | Shared nodes | Fargate |
| Startup time | 30-60s | 5-10s | Hybrid |
| Variable loads | Pay per pod | Fixed cost | Fargate |
| Burst capacity | Unlimited | Limited by nodes | Fargate |

### When Fargate-Only is More Cost-Effective

1. **Variable workloads**: Traffic varies significantly
2. **Batch jobs**: Running only during business hours
3. **Development/Test**: Clusters used intermittently
4. **Low pod count**: Few pods running continuously
5. **Security requirements**: Need pod-level isolation
6. **No ops team**: No dedicated infrastructure team

### When Hybrid is More Cost-Effective

1. **Consistent workloads**: 24/7 steady-state operation
2. **High pod density**: Many small pods
3. **Cost-sensitive**: Every dollar counts
4. **Existing expertise**: Team familiar with EC2
5. **Special requirements**: GPU, high CPU/memory ratios

### Optimization Strategies

**Fargate-Only Optimization:**
```yaml
# Right-size pods
resources:
  requests:
    cpu: "250m"     # Minimize
    memory: "512Mi" # Minimize

# Use Fargate Spot (when available)
# Scale to zero when not needed
```

**Hybrid Optimization:**
```hcl
# Use EC2 for baseline
resource "aws_eks_node_group" "baseline" {
  desired_size = 2
  instance_types = ["t3.medium"]
}

# Add Fargate for bursts
resource "aws_eks_fargate_profile" "burst" {
  selector {
    namespace = "burst-workloads"
  }
}
```

## Fargate-Only Limitations

### 1. No DaemonSets

**Not Supported:**
```yaml
apiVersion: apps/v1
kind: DaemonSet  # Cannot run on Fargate
```

**Alternative: Sidecar Pattern:**
```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: main-app
        image: my-app:latest
      - name: logging-sidecar  # Instead of DaemonSet
        image: fluent-bit:latest
      - name: monitoring-sidecar
        image: prometheus-exporter:latest
```

### 2. No Privileged Containers

```yaml
# Not supported on Fargate
securityContext:
  privileged: true
```

### 3. No HostNetwork, HostPort, or HostPath

```yaml
# All of these are NOT supported
spec:
  hostNetwork: true
  hostPort: 8080
  volumes:
  - name: host-volume
    hostPath:
      path: /data
```

### 4. No GPUs

Fargate doesn't support GPU workloads. Use EC2 node groups for:
- Machine learning training
- GPU-accelerated applications
- CUDA workloads

### 5. Limited Storage Options

**Supported:**
- EmptyDir (20 GB ephemeral)
- EFS via CSI driver
- ConfigMaps and Secrets

**Not Supported:**
- EBS volumes
- Local storage
- HostPath volumes

### 6. Longer Pod Startup Time

- Fargate: 30-60 seconds
- EC2: 5-10 seconds

**Impact:**
- Slower auto-scaling response
- Longer deployment times
- Not suitable for rapid burst scenarios

### 7. No Custom AMIs

- Cannot customize node OS
- Cannot install system-level packages
- Limited to AWS-provided Fargate environment

### 8. IP Address Consumption

Each Fargate pod consumes:
- 1 private IP from VPC subnet
- 1 ENI (Elastic Network Interface)

**Planning required for:**
- Large pod counts
- Subnet sizing
- ENI quotas

### 9. Cost at Scale

For high-density, always-on workloads, Fargate can be more expensive than EC2.

### 10. No SSH Access

- No nodes to SSH into
- Must use `kubectl exec` for debugging
- No system-level troubleshooting
