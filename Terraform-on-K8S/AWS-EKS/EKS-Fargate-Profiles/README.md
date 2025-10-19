# EKS Fargate Profiles

## Overview

This project demonstrates how to create and configure AWS Fargate profiles for Amazon EKS clusters. AWS Fargate is a serverless compute engine for containers that eliminates the need to provision and manage EC2 instances for running Kubernetes pods. This implementation shows how to add Fargate profiles to an existing EKS cluster that already has managed node groups, enabling a hybrid architecture where you can run workloads on both EC2 nodes and Fargate.

Fargate profiles define which pods should run on Fargate based on namespace and optional label selectors. When a pod matches a Fargate profile selector, the EKS control plane automatically schedules it on Fargate infrastructure.

## Architecture

This project provisions:

- **EKS Cluster with Managed Node Groups**: Standard EKS cluster with public and private EC2 node groups
- **VPC Infrastructure**: Multi-AZ VPC with public and private subnets
- **Fargate Profile**: Custom profile targeting the `fp-ns-app1` namespace
- **IAM Roles and Policies**: Pod execution role with required permissions for Fargate
- **AWS Load Balancer Controller (LBC)**: For managing ALB ingress resources
- **ExternalDNS**: For automatic Route53 DNS record management
- **Bastion Host**: EC2 instance for cluster access and management

### Key Components

```
EKS Cluster (Hybrid)
├── EC2 Managed Node Groups
│   ├── Public Node Group
│   └── Private Node Group
└── Fargate Profiles
    └── fp-ns-app1 (Custom Application Namespace)

Supporting Infrastructure
├── VPC with Public/Private Subnets (Multi-AZ)
├── IAM Roles (Fargate Pod Execution Role)
├── Load Balancer Controller
├── ExternalDNS
└── EC2 Bastion Host
```

## Prerequisites

### Required Tools

- **Terraform**: >= 1.0
- **AWS CLI**: Configured with appropriate credentials
- **kubectl**: For Kubernetes cluster interaction
- **eksctl**: (Optional) For additional EKS management

### AWS Requirements

- AWS Account with appropriate permissions
- IAM permissions to create:
  - EKS clusters and Fargate profiles
  - VPC, subnets, route tables, NAT gateways
  - IAM roles and policies
  - EC2 instances (bastion and node groups)
  - Load balancers and security groups
- Route53 hosted zone (for ExternalDNS)
- ACM certificate (for HTTPS ingress)

### Knowledge Prerequisites

- Understanding of Kubernetes concepts (pods, namespaces, deployments)
- Familiarity with AWS EKS and Fargate
- Basic Terraform knowledge
- Understanding of AWS networking (VPC, subnets, security groups)

## Project Structure

```
EKS-Fargate-Profiles/
├── ekscluster-terraform-manifests/     # Base EKS cluster with node groups
│   ├── c1-versions.tf                  # Provider configurations
│   ├── c2-01-generic-variables.tf      # Common variables
│   ├── c2-02-local-values.tf           # Local values
│   ├── c3-01-vpc-variables.tf          # VPC variables
│   ├── c3-02-vpc-module.tf             # VPC module configuration
│   ├── c3-03-vpc-outputs.tf            # VPC outputs
│   ├── c4-01-ec2bastion-variables.tf   # Bastion host variables
│   ├── c4-03-ec2bastion-securitygroups.tf
│   ├── c4-05-ec2bastion-instance.tf    # Bastion EC2 instance
│   ├── c5-03-iamrole-for-eks-cluster.tf
│   ├── c5-04-iamrole-for-eks-nodegroup.tf
│   ├── c5-06-eks-cluster.tf            # EKS cluster resource
│   ├── c5-07-eks-node-group-public.tf  # Public node group
│   ├── c5-08-eks-node-group-private.tf # Private node group
│   ├── c6-02-iam-oidc-connect-provider.tf
│   ├── c7-01-kubernetes-provider.tf    # K8s provider
│   └── vpc.auto.tfvars, eks.auto.tfvars
│
├── fargate-profiles-terraform-manifests/  # Fargate profile configuration
│   ├── c1-versions.tf                  # Provider versions
│   ├── c2-remote-state-datasource.tf   # Remote state reference
│   ├── c3-01-generic-variables.tf      # Variables
│   ├── c3-02-local-values.tf           # Local values
│   ├── c4-01-kubernetes-provider.tf    # Kubernetes provider
│   ├── c4-02-kubernetes-namespace.tf   # fp-ns-app1 namespace
│   ├── c5-01-fargate-profile-iam-role-and-policy.tf  # IAM role
│   ├── c5-02-fargate-profile.tf        # Fargate profile resource
│   ├── c5-03-fargate-profile-outputs.tf # Outputs
│   └── terraform.tfvars
│
├── lbc-install-terraform-manifests/    # Load Balancer Controller
│   ├── c4-01-lbc-datasources.tf
│   ├── c4-02-lbc-iam-policy-and-role.tf
│   ├── c4-03-lbc-helm-provider.tf
│   └── c4-04-lbc-install.tf
│
└── externaldns-install-terraform-manifests/  # ExternalDNS
    ├── c4-01-externaldns-iam-policy-and-role.tf
    ├── c4-02-externaldns-helm-provider.tf
    └── c4-03-externaldns-install.tf
```

## Usage

### Step 1: Deploy Base EKS Cluster

```bash
cd ekscluster-terraform-manifests

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply configuration
terraform apply -auto-approve

# Update kubeconfig
aws eks update-kubeconfig --region <region> --name <cluster-name>

# Verify cluster access
kubectl get nodes
```

### Step 2: Create Fargate Profile

```bash
cd ../fargate-profiles-terraform-manifests

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply configuration - creates namespace and Fargate profile
terraform apply -auto-approve

# Verify Fargate profile
aws eks describe-fargate-profile \
  --cluster-name <cluster-name> \
  --fargate-profile-name <profile-name>

# List all Fargate profiles
aws eks list-fargate-profiles --cluster-name <cluster-name>
```

### Step 3: Install AWS Load Balancer Controller

```bash
cd ../lbc-install-terraform-manifests

terraform init
terraform plan
terraform apply -auto-approve

# Verify LBC installation
kubectl get deployment -n kube-system aws-load-balancer-controller
```

### Step 4: Install ExternalDNS

```bash
cd ../externaldns-install-terraform-manifests

terraform init
terraform plan
terraform apply -auto-approve

# Verify ExternalDNS installation
kubectl get deployment -n external-dns
```

### Step 5: Deploy Application to Fargate

Deploy a sample application to the `fp-ns-app1` namespace:

```bash
# Create deployment
kubectl create deployment nginx --image=nginx --namespace=fp-ns-app1

# Verify pod is running on Fargate
kubectl get pods -n fp-ns-app1 -o wide

# Check pod details - should show fargate compute type
kubectl describe pod <pod-name> -n fp-ns-app1
```

### Step 6: Cleanup

```bash
# Remove applications first
kubectl delete all --all -n fp-ns-app1

# Destroy in reverse order
cd ../externaldns-install-terraform-manifests
terraform destroy -auto-approve

cd ../lbc-install-terraform-manifests
terraform destroy -auto-approve

cd ../fargate-profiles-terraform-manifests
terraform destroy -auto-approve

cd ../ekscluster-terraform-manifests
terraform destroy -auto-approve
```

## Configuration

### Fargate Profile Configuration

#### IAM Role for Pod Execution

```hcl
# fargate-profiles-terraform-manifests/c5-01-fargate-profile-iam-role-and-policy.tf

resource "aws_iam_role" "fargate_profile_role" {
  name = "${local.name}-eks-fargate-profile-role-apps"

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

#### Fargate Profile with Namespace Selector

```hcl
# fargate-profiles-terraform-manifests/c5-02-fargate-profile.tf

resource "aws_eks_fargate_profile" "fargate_profile" {
  cluster_name           = data.terraform_remote_state.eks.outputs.cluster_id
  fargate_profile_name   = "${local.name}-fp-app1"
  pod_execution_role_arn = aws_iam_role.fargate_profile_role.arn
  subnet_ids             = data.terraform_remote_state.eks.outputs.private_subnets

  selector {
    namespace = kubernetes_namespace_v1.fp_ns_app1.metadata[0].name
  }
}
```

#### Namespace Creation

```hcl
# fargate-profiles-terraform-manifests/c4-02-kubernetes-namespace.tf

resource "kubernetes_namespace_v1" "fp_ns_app1" {
  metadata {
    name = "fp-ns-app1"
  }
}
```

### Advanced Selector Configuration

#### Using Label Selectors

```hcl
resource "aws_eks_fargate_profile" "fargate_profile_with_labels" {
  cluster_name           = aws_eks_cluster.cluster.id
  fargate_profile_name   = "app-with-labels"
  pod_execution_role_arn = aws_iam_role.fargate_profile_role.arn
  subnet_ids             = var.private_subnet_ids

  selector {
    namespace = "production"
    labels = {
      environment = "prod"
      tier        = "backend"
    }
  }
}
```

#### Multiple Selectors

```hcl
resource "aws_eks_fargate_profile" "fargate_profile_multi_selector" {
  cluster_name           = aws_eks_cluster.cluster.id
  fargate_profile_name   = "multi-namespace"
  pod_execution_role_arn = aws_iam_role.fargate_profile_role.arn
  subnet_ids             = var.private_subnet_ids

  # First selector
  selector {
    namespace = "namespace-1"
  }

  # Second selector
  selector {
    namespace = "namespace-2"
    labels = {
      app = "critical"
    }
  }
}
```

### Networking Configuration

Fargate profiles must use **private subnets** only. The pods get private IP addresses from the VPC.

```hcl
# Correct - using private subnets
subnet_ids = data.terraform_remote_state.eks.outputs.private_subnets

# Incorrect - Fargate doesn't support public subnets
# subnet_ids = data.terraform_remote_state.eks.outputs.public_subnets
```

### Variables Configuration

#### terraform.tfvars

```hcl
# Generic Variables
aws_region       = "us-east-1"
business_division = "hr"
environment      = "dev"
```

## Features

### Hybrid Architecture Support

- Run some workloads on EC2 managed node groups
- Run other workloads on Fargate based on namespace selectors
- Seamless integration between both compute types

### Namespace-based Pod Scheduling

- Automatic scheduling of pods to Fargate based on namespace
- Support for label selectors for fine-grained control
- No changes required to application manifests

### Serverless Container Execution

- No EC2 instance management for Fargate pods
- Automatic scaling and right-sizing
- Pay only for pod resources consumed

### Security and Isolation

- Pod-level isolation (each pod runs on dedicated infrastructure)
- Separate IAM pod execution role
- Network isolation through security groups and VPC

### Integration Capabilities

- Works with AWS Load Balancer Controller
- Compatible with ExternalDNS for DNS management
- Supports CloudWatch Container Insights
- Works with EBS and EFS storage (with limitations)

## Troubleshooting

### Issue: Pods Not Scheduling on Fargate

**Symptoms:**
```bash
kubectl get pods -n fp-ns-app1
# Pods stuck in Pending state
```

**Diagnosis:**
```bash
# Check pod events
kubectl describe pod <pod-name> -n fp-ns-app1

# Verify Fargate profile exists and is active
aws eks describe-fargate-profile \
  --cluster-name <cluster-name> \
  --fargate-profile-name <profile-name> \
  --query 'fargateProfile.status'
```

**Solutions:**

1. Verify namespace matches selector:
```bash
# Check Fargate profile selectors
aws eks describe-fargate-profile \
  --cluster-name <cluster-name> \
  --fargate-profile-name <profile-name> \
  --query 'fargateProfile.selectors'
```

2. Ensure pods are in the correct namespace:
```bash
kubectl get pods -n fp-ns-app1
```

3. Check if pod has labels that don't match selector:
```bash
kubectl get pod <pod-name> -n fp-ns-app1 --show-labels
```

### Issue: Fargate Profile Creation Fails

**Error:**
```
Error: error creating EKS Fargate Profile: InvalidParameterException: Subnet subnet-xxx is a public subnet
```

**Solution:**
Fargate profiles only support private subnets:

```hcl
# Update to use private subnets
resource "aws_eks_fargate_profile" "fargate_profile" {
  subnet_ids = var.private_subnet_ids  # Must be private subnets
}
```

### Issue: CoreDNS Pods Not Running

**Problem:**
After creating cluster, CoreDNS pods might not schedule if no node groups exist.

**Solution:**
Create Fargate profile for kube-system namespace:

```hcl
resource "aws_eks_fargate_profile" "kube_system" {
  cluster_name           = aws_eks_cluster.cluster.id
  fargate_profile_name   = "kube-system"
  pod_execution_role_arn = aws_iam_role.fargate_profile_role.arn
  subnet_ids             = var.private_subnet_ids

  selector {
    namespace = "kube-system"
    labels = {
      "k8s-app" = "kube-dns"
    }
  }
}

# Restart CoreDNS after profile creation
# kubectl rollout restart deployment coredns -n kube-system
```

### Issue: Pod Execution Role Permissions

**Error:**
```
Failed to pull image: unable to retrieve ECR authorization token
```

**Solution:**
Add ECR access to pod execution role:

```hcl
resource "aws_iam_role_policy_attachment" "fargate_ecr_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.fargate_profile_role.name
}
```

### Issue: Load Balancer Target Type

**Problem:**
ALB cannot reach Fargate pods with instance target type.

**Solution:**
Use IP target type for Fargate workloads:

```yaml
# In ingress annotation
alb.ingress.kubernetes.io/target-type: ip
```

### Issue: Insufficient Capacity

**Error:**
```
0/0 nodes are available: Insufficient capacity
```

**Diagnosis:**
```bash
kubectl get events -n fp-ns-app1 --sort-by='.lastTimestamp'
```

**Solutions:**

1. Check Fargate service quotas:
```bash
aws service-quotas get-service-quota \
  --service-code fargate \
  --quota-code L-3032A538
```

2. Verify subnet has available IP addresses:
```bash
aws ec2 describe-subnets --subnet-ids <subnet-id> \
  --query 'Subnets[0].AvailableIpAddressCount'
```

3. Request quota increase if needed through AWS console

### Debugging Commands

```bash
# List all Fargate profiles
aws eks list-fargate-profiles --cluster-name <cluster-name>

# Describe Fargate profile
aws eks describe-fargate-profile \
  --cluster-name <cluster-name> \
  --fargate-profile-name <profile-name>

# Check pod compute type
kubectl get pods -n fp-ns-app1 -o=jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.nodeName}{"\n"}{end}'

# View pod execution role
kubectl describe pod <pod-name> -n fp-ns-app1 | grep "node.kubernetes.io/instance-type"

# Check Fargate profile status
kubectl get nodes -l eks.amazonaws.com/compute-type=fargate

# View pod events
kubectl get events -n fp-ns-app1 --sort-by='.lastTimestamp'
```

## Best Practices

### 1. Namespace Organization

Organize workloads by namespace for clear Fargate scheduling:

```hcl
# Separate profiles for different environments
resource "aws_eks_fargate_profile" "production" {
  fargate_profile_name = "production-apps"
  selector {
    namespace = "production"
  }
}

resource "aws_eks_fargate_profile" "staging" {
  fargate_profile_name = "staging-apps"
  selector {
    namespace = "staging"
  }
}
```

### 2. Use Private Subnets

Always use private subnets for Fargate profiles:

```hcl
# Good practice
subnet_ids = module.vpc.private_subnets

# Enable NAT gateway for outbound internet access
enable_nat_gateway = true
single_nat_gateway = false  # Use one per AZ for HA
```

### 3. Right-size Pod Resources

Specify resource requests to control Fargate compute size:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
  namespace: fp-ns-app1
spec:
  containers:
  - name: app
    image: my-app:latest
    resources:
      requests:
        cpu: "250m"      # Determines Fargate CPU
        memory: "512Mi"  # Determines Fargate memory
      limits:
        cpu: "500m"
        memory: "1Gi"
```

Fargate CPU and memory combinations:
- 0.25 vCPU: 0.5 GB, 1 GB, 2 GB
- 0.5 vCPU: 1 GB - 4 GB (1 GB increments)
- 1 vCPU: 2 GB - 8 GB (1 GB increments)
- 2 vCPU: 4 GB - 16 GB (1 GB increments)
- 4 vCPU: 8 GB - 30 GB (1 GB increments)

### 4. Use Label Selectors for Fine-grained Control

```hcl
resource "aws_eks_fargate_profile" "critical_workloads" {
  fargate_profile_name = "critical-only"

  selector {
    namespace = "production"
    labels = {
      priority = "critical"
      tier     = "frontend"
    }
  }
}
```

### 5. IAM Pod Execution Role Management

Keep pod execution role minimal:

```hcl
# Required base policy
resource "aws_iam_role_policy_attachment" "fargate_pod_execution_role_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSFargatePodExecutionRolePolicy"
  role       = aws_iam_role.fargate_profile_role.name
}

# Add only necessary additional permissions
resource "aws_iam_role_policy_attachment" "additional_policy" {
  policy_arn = aws_iam_policy.app_specific_policy.arn
  role       = aws_iam_role.fargate_profile_role.name
}
```

### 6. Monitoring and Logging

Enable Container Insights:

```bash
# Install CloudWatch Insights
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/cloudwatch-namespace.yaml

# For Fargate, use FluentBit configuration
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/fluent-bit/fluent-bit.yaml
```

### 7. Use IP Target Type for Load Balancers

Always use IP target type with Fargate:

```yaml
annotations:
  alb.ingress.kubernetes.io/target-type: ip  # Required for Fargate
```

### 8. Tagging for Cost Allocation

```hcl
resource "aws_eks_fargate_profile" "fargate_profile" {
  # ... other configuration ...

  tags = {
    Environment = var.environment
    CostCenter  = "engineering"
    ManagedBy   = "terraform"
    Workload    = "application"
  }
}
```

### 9. High Availability Configuration

Ensure Fargate profiles use subnets across multiple AZs:

```hcl
resource "aws_eks_fargate_profile" "fargate_profile" {
  subnet_ids = [
    aws_subnet.private_az1.id,
    aws_subnet.private_az2.id,
    aws_subnet.private_az3.id,
  ]
}
```

### 10. Security Group Configuration

Fargate pods use the cluster security group by default. For additional security:

```hcl
# Custom security group for pods
resource "aws_security_group" "fargate_pods" {
  name_prefix = "${var.cluster_name}-fargate-pods"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.cluster_name}-fargate-pods"
  }
}
```

## Cost Comparison: Fargate vs EC2 Nodes

### Fargate Pricing Model

Fargate charges based on vCPU and memory resources consumed:

**Example Pricing (us-east-1, as of 2024):**
- Per vCPU per hour: $0.04048
- Per GB memory per hour: $0.004445

**Sample Application Cost:**
- Pod Request: 0.25 vCPU, 0.5 GB memory
- Hourly Cost: (0.25 × $0.04048) + (0.5 × $0.004445) = $0.01234/hour
- Monthly Cost (730 hours): $9.01/month per pod

### EC2 Node Group Pricing Model

**t3.medium Instance (2 vCPU, 4 GB RAM):**
- On-Demand: ~$0.0416/hour = $30.37/month
- Can run ~8-10 small pods
- Cost per pod: ~$3-4/month

**Cost Comparison Table:**

| Workload Type | Fargate Cost | EC2 Cost | Best Choice |
|---------------|--------------|----------|-------------|
| Batch jobs (1hr/day) | $0.37/month | $30.37/month* | Fargate |
| 24/7 production app | $9.01/month | $3-4/month | EC2 |
| Variable load | Variable | Fixed | Fargate |
| Consistent load | Higher | Lower | EC2 |

*EC2 cost is fixed regardless of utilization

### When to Use Fargate

- **Batch processing**: Jobs that run periodically
- **Variable workloads**: Unpredictable traffic patterns
- **Development/Testing**: On-demand environments
- **Microservices**: Small, isolated services
- **Burst workloads**: Temporary scale-out scenarios
- **Security-critical**: Applications requiring pod-level isolation

### When to Use EC2 Nodes

- **Steady-state workloads**: Consistent 24/7 operations
- **High-density deployments**: Many small pods
- **Cost optimization**: Large-scale deployments
- **DaemonSets**: System-level services
- **Stateful applications**: With local storage requirements
- **GPU workloads**: ML/AI applications

### Hybrid Strategy

Optimal cost efficiency often comes from combining both:

```hcl
# EC2 for baseline, always-on workloads
resource "aws_eks_node_group" "baseline" {
  cluster_name = aws_eks_cluster.cluster.name
  node_group_name = "baseline-workloads"

  scaling_config {
    desired_size = 3
    max_size     = 5
    min_size     = 2
  }

  instance_types = ["t3.medium"]
}

# Fargate for burst and batch workloads
resource "aws_eks_fargate_profile" "batch_jobs" {
  cluster_name = aws_eks_cluster.cluster.id
  fargate_profile_name = "batch-processing"

  selector {
    namespace = "batch-jobs"
  }
}
```

## Fargate Limitations

### 1. Storage Limitations

**Ephemeral Storage Only (20GB Default):**
```yaml
# Fargate provides 20GB ephemeral storage
# Cannot use hostPath volumes
# EBS volumes are NOT supported
```

**Supported Storage Options:**
- EmptyDir volumes (ephemeral)
- ConfigMaps and Secrets
- EFS (Elastic File System) via CSI driver
- Projected volumes

```yaml
# Example: Using EFS with Fargate
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: efs-claim
  namespace: fp-ns-app1
spec:
  accessModes:
    - ReadWriteMany
  storageClassName: efs-sc
  resources:
    requests:
      storage: 5Gi
```

### 2. No DaemonSets Support

Fargate doesn't support DaemonSets because there are no nodes:

```yaml
# This will NOT work on Fargate
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: monitoring-agent
spec:
  # ... DaemonSet spec
```

**Alternative:** Use sidecar containers:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-with-monitoring
spec:
  template:
    spec:
      containers:
      - name: application
        image: my-app:latest
      - name: monitoring-sidecar  # Sidecar for monitoring
        image: monitoring-agent:latest
```

### 3. No Privileged Containers

```yaml
# This will fail on Fargate
spec:
  containers:
  - name: privileged-app
    securityContext:
      privileged: true  # NOT supported
```

### 4. No HostNetwork or HostPort

```yaml
# These configurations are not supported
spec:
  hostNetwork: true  # NOT supported
  containers:
  - name: app
    ports:
    - containerPort: 80
      hostPort: 8080   # NOT supported
```

### 5. Limited Resource Configurations

Only specific CPU/Memory combinations are supported:

```yaml
# Supported
resources:
  requests:
    cpu: "250m"     # 0.25 vCPU
    memory: "512Mi" # 0.5 GB

# Not Supported
resources:
  requests:
    cpu: "300m"     # Must be 0.25, 0.5, 1, 2, or 4 vCPU
    memory: "600Mi" # Must match allowed combinations
```

### 6. No GPU Support

Fargate doesn't support GPU workloads:

```yaml
# This will NOT work on Fargate
resources:
  limits:
    nvidia.com/gpu: 1  # GPUs not supported
```

### 7. Pod Startup Time

Fargate pods take longer to start (30-60 seconds vs 5-10 seconds for EC2):
- Infrastructure provisioning time
- ENI attachment
- Image pull

**Mitigation:**
- Use smaller container images
- Leverage image caching
- Design for eventual consistency

### 8. Networking Constraints

- One ENI per pod (IP address consumption)
- Security groups applied at pod level (via security group policy)
- Cannot use host networking

### 9. No Load Balancer Node Ports

Must use IP target type:

```yaml
# Required for Fargate
annotations:
  alb.ingress.kubernetes.io/target-type: ip

# This will NOT work
annotations:
  alb.ingress.kubernetes.io/target-type: instance
```

### 10. Service Quotas

Default Fargate quotas:
- Fargate On-Demand vCPU: 6 vCPU per region (default)
- Fargate Spot vCPU: 6 vCPU per region (default)

Check quotas:
```bash
aws service-quotas list-service-quotas \
  --service-code fargate \
  --query 'Quotas[*].[QuotaName,Value]' \
  --output table
```
