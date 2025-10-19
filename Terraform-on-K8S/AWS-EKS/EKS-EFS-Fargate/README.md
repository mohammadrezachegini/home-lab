# Amazon EFS with EKS Fargate

## Overview

This project demonstrates how to use Amazon EFS storage with AWS Fargate pods on Amazon EKS. Fargate is a serverless compute engine for containers that eliminates the need to provision and manage EC2 worker nodes. However, running stateful workloads on Fargate requires special configuration for persistent storage.

This implementation shows both static and dynamic provisioning approaches for EFS storage with Fargate, including the necessary Fargate profile configuration, IAM policies, and pod specifications. Fargate pods have specific requirements for storage drivers and networking that differ from standard node-based deployments.

## Architecture

### Component Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        EKS Control Plane                          │
│  - API Server                                                     │
│  - Scheduler (with Fargate Profile awareness)                    │
│  - Controller Manager                                             │
└──────────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  EC2 Nodes    │  │ Fargate Pod 1 │  │ Fargate Pod 2 │
│  (Optional)   │  │               │  │               │
│               │  │ ┌───────────┐ │  │ ┌───────────┐ │
│               │  │ │ Container │ │  │ │ Container │ │
│               │  │ │   + EFS   │ │  │ │   + EFS   │ │
│               │  │ │   Mount   │ │  │ │   Mount   │ │
│               │  │ └─────┬─────┘ │  │ └─────┬─────┘ │
└───────────────┘  └───────┼───────┘  └───────┼───────┘
                           │                   │
                           │   NFS (Port 2049) │
                           ▼                   ▼
        ┌──────────────────────────────────────────────┐
        │     Amazon EFS File System (fs-xxxxxx)       │
        │  ┌────────────────────────────────────────┐  │
        │  │ Dynamic Provisioning                   │  │
        │  │  /dynamic_provisioning/                │  │
        │  │    ├── pvc-aaa/ (Access Point 1)      │  │
        │  │    └── pvc-bbb/ (Access Point 2)      │  │
        │  └────────────────────────────────────────┘  │
        │  ┌────────────────────────────────────────┐  │
        │  │ Static Provisioning                    │  │
        │  │  /static/                              │  │
        │  │    └── [Shared Data]                   │  │
        │  └────────────────────────────────────────┘  │
        │                                              │
        │  ┌──────────────┐      ┌──────────────┐    │
        │  │Mount Target  │      │Mount Target  │    │
        │  │  (AZ-1)      │      │  (AZ-2)      │    │
        │  │Private Subnet│      │Private Subnet│    │
        │  └──────────────┘      └──────────────┘    │
        └──────────────────────────────────────────────┘
```

### Fargate-Specific Architecture Components

#### Fargate Profile

```
┌─────────────────────────────────────────────────────┐
│              EKS Fargate Profile                     │
│  - Selector: namespace = "fp-ns-app1"               │
│  - Pod Execution Role (IAM)                         │
│  - Subnet Selection (Private only)                  │
│  - Tags and Labels                                  │
└─────────────────────────────────────────────────────┘
                       │
                       │ Matches pods in namespace
                       ▼
┌─────────────────────────────────────────────────────┐
│        Kubernetes Namespace: fp-ns-app1             │
│  ┌───────────────────────────────────────────────┐ │
│  │ Pods (automatically run on Fargate)           │ │
│  │ - No node selector needed                     │ │
│  │ - Automatic Fargate scheduling                │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Data Flow

1. **Fargate Profile Creation**: Defines which pods run on Fargate based on namespace selectors
2. **Pod Scheduling**: Pods in matching namespace automatically scheduled on Fargate
3. **Networking**: Fargate pod gets ENI in VPC subnet
4. **Storage Mount**: EFS CSI driver mounts EFS via NFS to Fargate pod
5. **Application Access**: Container accesses EFS storage at mount path

## Prerequisites

### Required Resources

1. **EKS Cluster**: Running EKS cluster with OIDC provider
2. **EFS CSI Driver**: Installed via `EKS-EFS-CSI-Install` project
3. **VPC with Private Subnets**: Fargate requires private subnets
4. **Terraform**: Version 1.0 or higher
5. **AWS CLI**: Configured with appropriate credentials
6. **kubectl**: For cluster interaction

### Fargate-Specific Requirements

1. **Private Subnets**: Fargate pods must run in private subnets
2. **NAT Gateway or VPC Endpoints**: For internet/AWS API access
3. **Security Groups**: Allow NFS traffic (port 2049) to EFS
4. **Pod Execution Role**: IAM role for Fargate pod execution

### Network Requirements

- **Private Subnets**: At least 2 for high availability
- **Route Tables**: Routes to NAT Gateway or VPC endpoints
- **Security Groups**:
  - Allow outbound from Fargate pods to EFS mount targets (port 2049)
  - Allow inbound to EFS mount targets from Fargate pod security group

### Fargate Limitations

- **No DaemonSets**: Cannot run DaemonSet workloads
- **No Privileged Containers**: Security restrictions
- **No HostPath Volumes**: Only PVC/ConfigMap/Secret volumes
- **No HostNetwork**: Pods cannot use host network
- **Fixed Resources**: CPU/Memory in predefined configurations

## Project Structure

```
EKS-EFS-Fargate/
├── ekscluster-terraform-manifests/        # EKS cluster setup
│   └── [Standard EKS cluster files...]
│
├── efs-install-terraform-manifests/       # EFS CSI driver installation
│   ├── c1-versions.tf
│   ├── c2-remote-state-datasource.tf
│   ├── c3-01-generic-variables.tf
│   ├── c3-02-local-values.tf
│   ├── c4-01-efs-csi-datasources.tf
│   ├── c4-02-efs-csi-iam-policy-and-role.tf
│   ├── c4-03-efs-helm-provider.tf
│   ├── c4-04-efs-csi-install.tf
│   ├── c4-05-efs-outputs.tf
│   └── terraform.tfvars
│
├── fargate-profiles-terraform-manifests/  # Fargate profile configuration
│   ├── c1-versions.tf                     # Terraform versions
│   ├── c2-remote-state-datasource.tf      # Remote state for EKS
│   ├── c3-01-generic-variables.tf         # Generic variables
│   ├── c3-02-local-values.tf              # Local values
│   ├── c4-01-kubernetes-provider.tf       # Kubernetes provider
│   ├── c4-02-kubernetes-namespace.tf      # Namespace for Fargate pods
│   ├── c5-01-fargate-profile-iam-role-and-policy.tf # Fargate IAM role
│   ├── c5-02-fargate-profile.tf           # Fargate profile resource
│   ├── c5-03-fargate-profile-outputs.tf   # Outputs
│   └── terraform.tfvars
│
├── efs-static-prov-terraform-manifests/   # Static provisioning for Fargate
│   ├── c1-versions.tf
│   ├── c2-remote-state-datasource.tf
│   ├── c3-providers.tf
│   ├── c4-01-efs-resource.tf              # EFS file system
│   ├── c4-02-storage-class.tf             # StorageClass
│   ├── c4-03-persistent-volume-claim.tf   # PVC
│   ├── c4-04-persistent-volume.tf         # PV
│   ├── c5-write-to-efs-pod.tf             # Test pod
│   ├── c6-01-myapp1-deployment.tf         # Sample application
│   ├── c6-02-myapp1-loadbalancer-service.tf # Load Balancer
│   └── c6-03-myapp1-network-loadbalancer-service.tf # NLB
│
└── efs-dynamic-prov-terraform-manifests/  # Dynamic provisioning for Fargate
    ├── c1-versions.tf
    ├── c2-remote-state-datasource.tf
    ├── c3-providers.tf
    ├── c4-01-efs-resource.tf              # EFS file system
    ├── c4-02-storage-class.tf             # StorageClass with efs-ap
    ├── c4-03-persistent-volume-claim.tf   # PVC (triggers Access Point)
    ├── c5-write-to-efs-pod.tf             # Test pod
    ├── c6-01-myapp1-deployment.tf         # Sample application
    ├── c6-02-myapp1-loadbalancer-service.tf # Load Balancer
    └── c6-03-myapp1-network-loadbalancer-service.tf # NLB
```

## Usage

### Step 1: Deploy EKS Cluster and EFS CSI Driver

```bash
# Deploy EKS cluster
cd ekscluster-terraform-manifests
terraform init && terraform apply -auto-approve

# Install EFS CSI driver
cd ../efs-install-terraform-manifests
terraform init && terraform apply -auto-approve
```

### Step 2: Create Fargate Profile

```bash
cd ../fargate-profiles-terraform-manifests

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# This creates:
# - IAM role for Fargate pod execution
# - Fargate profile with namespace selector
# - Kubernetes namespace for Fargate pods

# Apply the configuration
terraform apply -auto-approve
```

### Step 3: Verify Fargate Profile

```bash
# Configure kubectl
aws eks update-kubeconfig --name <cluster-name> --region us-east-1

# List Fargate profiles
aws eks list-fargate-profiles --cluster-name <cluster-name>

# Describe Fargate profile
aws eks describe-fargate-profile \
  --cluster-name <cluster-name> \
  --fargate-profile-name <profile-name>

# Verify namespace created
kubectl get namespace fp-ns-app1

# Check namespace labels
kubectl describe namespace fp-ns-app1
```

### Step 4: Deploy with Static Provisioning (Option A)

```bash
cd ../efs-static-prov-terraform-manifests

# Initialize and apply
terraform init
terraform plan
terraform apply -auto-approve

# This creates:
# - EFS file system
# - Security groups
# - Mount targets
# - StorageClass, PV, PVC
# - Pods in Fargate namespace
```

### Step 5: Deploy with Dynamic Provisioning (Option B)

```bash
cd ../efs-dynamic-prov-terraform-manifests

# Initialize and apply
terraform init
terraform plan
terraform apply -auto-approve

# This creates:
# - EFS file system
# - Security groups
# - Mount targets
# - StorageClass with efs-ap mode
# - PVC (triggers Access Point creation)
# - Pods in Fargate namespace
```

### Step 6: Verify Fargate Pods

```bash
# List pods in Fargate namespace
kubectl get pods -n fp-ns-app1

# Check pod is running on Fargate (no node name)
kubectl get pods -n fp-ns-app1 -o wide
# NODE column will show: fargate-ip-xxx-xxx-xxx-xxx.region.compute.internal

# Describe pod to see Fargate details
kubectl describe pod <pod-name> -n fp-ns-app1

# Check pod's compute resources
kubectl get pod <pod-name> -n fp-ns-app1 -o jsonpath='{.spec.containers[0].resources}'

# Verify EFS mount
kubectl exec -n fp-ns-app1 <pod-name> -- df -h | grep efs
kubectl exec -n fp-ns-app1 <pod-name> -- mount | grep efs
```

### Step 7: Test EFS Storage on Fargate

```bash
# For static provisioning
kubectl exec -n fp-ns-app1 efs-write-app -- cat /data/efs-static.txt

# For dynamic provisioning
kubectl exec -n fp-ns-app1 efs-write-app -- cat /data/efs-dynamic.txt

# Verify data persists across pod restarts
kubectl delete pod -n fp-ns-app1 efs-write-app

# Wait for pod to restart on Fargate
kubectl get pods -n fp-ns-app1 -w

# Data should still be there
kubectl exec -n fp-ns-app1 efs-write-app -- cat /data/efs-*.txt
```

### Step 8: Test Application Access

```bash
# Get Load Balancer endpoint
kubectl get svc -n fp-ns-app1 myapp1-lb-service

# Access application
curl http://<load-balancer-dns>/efs/efs-static.txt
# or
curl http://<load-balancer-dns>/efs/efs-dynamic.txt

# Scale deployment to test multi-pod EFS access
kubectl scale deployment -n fp-ns-app1 myapp1 --replicas=3

# All pods run on Fargate with shared EFS access
kubectl get pods -n fp-ns-app1 -o wide
```

### Step 9: Monitor Fargate Pods

```bash
# View pod logs
kubectl logs -n fp-ns-app1 <pod-name>

# Stream logs
kubectl logs -n fp-ns-app1 <pod-name> -f

# Check events
kubectl get events -n fp-ns-app1 --sort-by=.metadata.creationTimestamp

# View pod resource usage (requires metrics-server)
kubectl top pods -n fp-ns-app1
```

## Configuration

### Fargate Profile Configuration

#### c5-01-fargate-profile-iam-role-and-policy.tf

Creates IAM role for Fargate pod execution:

```hcl
# IAM Role for Fargate Profile
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

# Attach required policy
resource "aws_iam_role_policy_attachment" "eks_fargate_pod_execution_role_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSFargatePodExecutionRolePolicy"
  role       = aws_iam_role.fargate_profile_role.name
}
```

**Required Policy**: `AmazonEKSFargatePodExecutionRolePolicy`

This managed policy includes:
- ECR image pull permissions
- CloudWatch Logs permissions
- EKS API permissions

#### c5-02-fargate-profile.tf

Creates Fargate profile with namespace selector:

```hcl
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

**Key Configuration**:
- **cluster_name**: Target EKS cluster
- **pod_execution_role_arn**: IAM role for Fargate
- **subnet_ids**: Must be private subnets
- **selector**: Namespace-based pod matching

**Multiple Selectors** (optional):

```hcl
selector {
  namespace = "fargate-ns-1"
  labels = {
    app = "myapp"
  }
}

selector {
  namespace = "fargate-ns-2"
}
```

#### c4-02-kubernetes-namespace.tf

Creates namespace for Fargate pods:

```hcl
resource "kubernetes_namespace_v1" "fp_ns_app1" {
  metadata {
    name = "fp-ns-app1"

    labels = {
      name = "fp-ns-app1"
      environment = "fargate"
    }
  }
}
```

### EFS Configuration for Fargate

The EFS configuration is identical to standard deployments, but pods run on Fargate:

#### Static Provisioning - c4-02-storage-class.tf

```hcl
resource "kubernetes_storage_class_v1" "efs_sc" {
  metadata {
    name = "efs-sc"
  }
  storage_provisioner = "efs.csi.aws.com"
}
```

#### Dynamic Provisioning - c4-02-storage-class.tf

```hcl
resource "kubernetes_storage_class_v1" "efs_sc" {
  metadata {
    name = "efs-sc"
  }
  storage_provisioner = "efs.csi.aws.com"

  parameters = {
    provisioningMode = "efs-ap"
    fileSystemId     = aws_efs_file_system.efs_file_system.id
    directoryPerms   = "700"
    gidRangeStart    = "1000"
    gidRangeEnd      = "2000"
    basePath         = "/dynamic_provisioning"
  }
}
```

### Application Deployment for Fargate

The pod specification is the same, but pods are automatically scheduled on Fargate:

```hcl
resource "kubernetes_deployment_v1" "myapp1" {
  metadata {
    name      = "myapp1"
    namespace = "fp-ns-app1"  # Must match Fargate profile selector
  }
  spec {
    replicas = 2
    selector {
      match_labels = {
        app = "myapp1"
      }
    }
    template {
      metadata {
        labels = {
          app = "myapp1"
        }
      }
      spec {
        container {
          name  = "myapp1-container"
          image = "stacksimplify/kubenginx:1.0.0"

          # Resource requests/limits for Fargate
          resources {
            requests = {
              cpu    = "250m"
              memory = "512Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "1Gi"
            }
          }

          port {
            container_port = 80
          }

          volume_mount {
            name       = "persistent-storage"
            mount_path = "/usr/share/nginx/html/efs"
          }
        }

        volume {
          name = "persistent-storage"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim_v1.efs_pvc.metadata[0].name
          }
        }
      }
    }
  }
}
```

**Important**: Fargate pods must specify resource requests to determine pod size.

### Fargate Pod Sizing

Fargate provides fixed CPU/Memory configurations:

| vCPU | Memory Options (GB) |
|------|-------------------|
| 0.25 | 0.5, 1, 2 |
| 0.5  | 1, 2, 3, 4 |
| 1    | 2, 3, 4, 5, 6, 7, 8 |
| 2    | 4-16 (1 GB increments) |
| 4    | 8-30 (1 GB increments) |
| 8    | 16-60 (4 GB increments) |
| 16   | 32-120 (8 GB increments) |

Fargate rounds up to nearest configuration based on your requests.

## Features

### 1. Serverless Container Compute

No EC2 nodes to manage:
- Automatic infrastructure provisioning
- Pay per pod
- No node maintenance
- Automatic OS patching

### 2. Enhanced Security Isolation

Each Fargate pod runs in isolated compute environment:
- Dedicated kernel
- Dedicated ENI
- No multi-tenancy at VM level

### 3. Simplified Scaling

Pods scale independently:
- No cluster auto-scaling needed
- No node group capacity planning
- Instant pod scheduling

### 4. EFS Integration

Full EFS support with Fargate:
- ReadWriteMany volumes
- Shared storage across Fargate pods
- Both static and dynamic provisioning

### 5. Namespace-Based Scheduling

Flexible pod placement:
- Namespace selectors
- Label selectors
- Mix Fargate and EC2 workloads

### 6. VPC Networking

Native VPC integration:
- Pods get VPC IP addresses
- Security group support
- Direct VPC connectivity

### 7. CloudWatch Integration

Built-in logging and monitoring:
- Container logs to CloudWatch
- No need for logging DaemonSets
- Automatic log retention

## Troubleshooting

### Issue: Pods Stuck in Pending in Fargate Namespace

**Symptoms:**
```bash
kubectl get pods -n fp-ns-app1
# Pods show Pending status
```

**Solutions:**

1. **Check Fargate profile exists:**
```bash
aws eks list-fargate-profiles --cluster-name <cluster-name>
aws eks describe-fargate-profile \
  --cluster-name <cluster-name> \
  --fargate-profile-name <profile-name>
```

2. **Verify namespace matches selector:**
```bash
# Check Fargate profile selector
aws eks describe-fargate-profile \
  --cluster-name <cluster-name> \
  --fargate-profile-name <profile-name> \
  --query 'fargateProfile.selectors'

# Verify pod namespace
kubectl get pod <pod-name> -n fp-ns-app1 -o jsonpath='{.metadata.namespace}'
```

3. **Check pod events:**
```bash
kubectl describe pod <pod-name> -n fp-ns-app1
# Look for: "No Fargate profile matches the pod"
```

4. **Verify private subnets:**
```bash
# Fargate requires private subnets
aws eks describe-fargate-profile \
  --cluster-name <cluster-name> \
  --fargate-profile-name <profile-name> \
  --query 'fargateProfile.subnets'
```

5. **Check subnet availability:**
```bash
# Ensure subnets have available IPs
aws ec2 describe-subnets --subnet-ids <subnet-id> \
  --query 'Subnets[0].AvailableIpAddressCount'
```

### Issue: EFS Mount Fails on Fargate Pod

**Symptoms:**
```bash
kubectl describe pod <pod-name> -n fp-ns-app1
# Events show: "MountVolume.MountDevice failed"
```

**Solutions:**

1. **Verify EFS CSI driver pods are running:**
```bash
kubectl get pods -n kube-system | grep efs-csi
# Both controller and node drivers needed
```

2. **Check security groups:**
```bash
# Fargate pod security group must allow outbound to EFS
# EFS security group must allow inbound from Fargate

# Get Fargate pod ENI security group
kubectl get pod <pod-name> -n fp-ns-app1 -o jsonpath='{.status.podIP}'
aws ec2 describe-network-interfaces \
  --filters "Name=addresses.private-ip-address,Values=<pod-ip>" \
  --query 'NetworkInterfaces[0].Groups[*].GroupId'

# Verify NFS access
aws ec2 describe-security-groups --group-ids <efs-sg-id> | grep 2049
```

3. **Verify mount targets in pod's AZ:**
```bash
# Check which AZ the pod is in
kubectl get pod <pod-name> -n fp-ns-app1 -o wide

# List EFS mount targets
aws efs describe-mount-targets --file-system-id <fs-id>
```

4. **Check PVC is bound:**
```bash
kubectl get pvc -n fp-ns-app1
# Status should be "Bound"
```

### Issue: Fargate Profile Creation Fails

**Symptoms:**
```bash
terraform apply
# Error: error creating EKS Fargate Profile
```

**Solutions:**

1. **Verify IAM role has correct trust policy:**
```bash
aws iam get-role --role-name <fargate-role-name> \
  --query 'Role.AssumeRolePolicyDocument'

# Should include:
# Service: "eks-fargate-pods.amazonaws.com"
```

2. **Check required policy is attached:**
```bash
aws iam list-attached-role-policies --role-name <fargate-role-name>
# Should include: AmazonEKSFargatePodExecutionRolePolicy
```

3. **Verify cluster exists:**
```bash
aws eks describe-cluster --name <cluster-name>
```

4. **Check subnet tags:**
```bash
# Subnets must be tagged for EKS
aws ec2 describe-subnets --subnet-ids <subnet-id> \
  --query 'Subnets[0].Tags'

# Required tag:
# kubernetes.io/cluster/<cluster-name> = shared
```

### Issue: Pods Not Getting Scheduled on Fargate

**Symptoms:**
- Pods scheduled on EC2 nodes instead of Fargate

**Solutions:**

1. **Verify pod is in correct namespace:**
```bash
kubectl get pod <pod-name> -o jsonpath='{.metadata.namespace}'
# Must match Fargate profile selector
```

2. **Check for node selectors:**
```bash
kubectl get pod <pod-name> -o jsonpath='{.spec.nodeSelector}'
# Node selectors prevent Fargate scheduling
```

3. **Check for taints/tolerations:**
```bash
kubectl get pod <pod-name> -o jsonpath='{.spec.tolerations}'
```

4. **Verify Fargate profile is active:**
```bash
aws eks describe-fargate-profile \
  --cluster-name <cluster-name> \
  --fargate-profile-name <profile-name> \
  --query 'fargateProfile.status'
# Should return: ACTIVE
```

### Issue: Performance Issues with EFS on Fargate

**Symptoms:**
- Slow file operations
- High latency

**Solutions:**

1. **Check EFS performance mode:**
```bash
aws efs describe-file-systems --file-system-id <fs-id> \
  --query 'FileSystems[0].PerformanceMode'

# Consider "maxIO" for parallel workloads
```

2. **Monitor EFS metrics:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/EFS \
  --metric-name BurstCreditBalance \
  --dimensions Name=FileSystemId,Value=<fs-id> \
  --start-time <start> \
  --end-time <end> \
  --period 300 \
  --statistics Average
```

3. **Enable provisioned throughput:**
```hcl
resource "aws_efs_file_system" "efs_file_system" {
  throughput_mode                 = "provisioned"
  provisioned_throughput_in_mibps = 100
}
```

4. **Check network connectivity:**
```bash
# From Fargate pod
kubectl exec -n fp-ns-app1 <pod-name> -- ping <mount-target-ip>
```

### Issue: Cannot Access Pod Logs

**Symptoms:**
```bash
kubectl logs -n fp-ns-app1 <pod-name>
# No output or errors
```

**Solutions:**

1. **Verify CloudWatch Logs permissions:**
```bash
aws iam get-role-policy --role-name <fargate-role-name>
# Should include logs:CreateLogStream, logs:PutLogEvents
```

2. **Check log group exists:**
```bash
aws logs describe-log-groups --log-group-name-prefix "/aws/eks/<cluster-name>/cluster"
```

3. **View logs in CloudWatch console:**
- Navigate to CloudWatch > Log groups
- Find: `/aws/eks/<cluster-name>/cluster`
- Select log stream for your pod

### Debugging Commands

```bash
# Check Fargate profile details
aws eks describe-fargate-profile \
  --cluster-name <cluster-name> \
  --fargate-profile-name <profile-name> \
  --output table

# List all pods and their compute type
kubectl get pods --all-namespaces -o wide

# Check pod is on Fargate
kubectl get pod <pod-name> -n fp-ns-app1 -o jsonpath='{.spec.nodeName}'
# Should show: fargate-ip-xxx...

# View Fargate pod compute resources
kubectl get pod <pod-name> -n fp-ns-app1 -o jsonpath='{.spec.containers[0].resources}'

# Check EFS mount in pod
kubectl exec -n fp-ns-app1 <pod-name> -- df -h
kubectl exec -n fp-ns-app1 <pod-name> -- mount | grep nfs

# View pod's ENI
kubectl get pod <pod-name> -n fp-ns-app1 -o jsonpath='{.status.podIP}'
aws ec2 describe-network-interfaces \
  --filters "Name=addresses.private-ip-address,Values=<pod-ip>"

# Check security groups on pod ENI
aws ec2 describe-network-interfaces \
  --filters "Name=addresses.private-ip-address,Values=<pod-ip>" \
  --query 'NetworkInterfaces[0].Groups'

# Monitor Fargate pod events
kubectl get events -n fp-ns-app1 --watch

# Check Fargate profile quota
aws service-quotas get-service-quota \
  --service-code eks \
  --quota-code L-00D98EE3  # Fargate profiles per cluster
```

## Best Practices

### 1. Use Private Subnets Only

Fargate requires private subnets:

```hcl
resource "aws_eks_fargate_profile" "fargate_profile" {
  subnet_ids = data.terraform_remote_state.eks.outputs.private_subnets
  # Not public subnets
}
```

### 2. Specify Resource Requests

Always define CPU/Memory requests for proper sizing:

```yaml
resources:
  requests:
    cpu: "250m"
    memory: "512Mi"
  limits:
    cpu: "500m"
    memory: "1Gi"
```

### 3. Use Appropriate Fargate Pod Size

Choose pod size based on workload:

```yaml
# Small workload
requests:
  cpu: "250m"
  memory: "512Mi"

# Medium workload
requests:
  cpu: "1"
  memory: "2Gi"

# Large workload
requests:
  cpu: "4"
  memory: "8Gi"
```

### 4. Implement Namespace Strategy

Organize workloads by namespace:

```
- default: EC2 node workloads
- fp-ns-app1: Fargate application 1
- fp-ns-app2: Fargate application 2
- fp-ns-batch: Fargate batch jobs
```

### 5. Configure CloudWatch Logging

Enable log retention:

```bash
aws logs put-retention-policy \
  --log-group-name "/aws/eks/<cluster-name>/cluster" \
  --retention-in-days 7
```

### 6. Use EFS Access Points for Isolation

In dynamic provisioning, each Fargate pod can get isolated storage:

```hcl
parameters = {
  provisioningMode = "efs-ap"
  directoryPerms   = "700"
}
```

### 7. Monitor Fargate Costs

Track costs with tags:

```hcl
tags = {
  Environment = "production"
  Team        = "platform"
  CostCenter  = "engineering"
}
```

Enable AWS Cost Explorer filtering by Fargate usage.

### 8. Implement Pod Disruption Budgets

Protect applications during updates:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: myapp1-pdb
  namespace: fp-ns-app1
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: myapp1
```

### 9. Use Multiple Fargate Profiles

Separate profiles for different use cases:

```hcl
# Application profile
resource "aws_eks_fargate_profile" "apps" {
  fargate_profile_name = "fp-apps"
  selector {
    namespace = "applications"
  }
}

# Batch job profile
resource "aws_eks_fargate_profile" "batch" {
  fargate_profile_name = "fp-batch"
  selector {
    namespace = "batch-jobs"
  }
}
```

### 10. Enable VPC Flow Logs

Monitor Fargate pod network traffic:

```bash
aws ec2 create-flow-logs \
  --resource-type VPC \
  --resource-ids <vpc-id> \
  --traffic-type ALL \
  --log-destination-type cloud-watch-logs \
  --log-group-name /aws/vpc/flowlogs
```

### 11. Secure EFS Access

Use IAM authorization with EFS:

```hcl
resource "aws_efs_file_system" "efs_file_system" {
  encrypted = true

  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }
}

resource "aws_efs_file_system_policy" "policy" {
  file_system_id = aws_efs_file_system.efs_file_system.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        AWS = aws_iam_role.fargate_profile_role.arn
      }
      Action = [
        "elasticfilesystem:ClientMount",
        "elasticfilesystem:ClientWrite"
      ]
      Resource = aws_efs_file_system.efs_file_system.arn
    }]
  })
}
```

### 12. Test Disaster Recovery

Regularly test pod recovery:

```bash
# Delete pod
kubectl delete pod <pod-name> -n fp-ns-app1

# Verify new pod starts and mounts EFS
kubectl get pods -n fp-ns-app1 -w

# Verify data persists
kubectl exec -n fp-ns-app1 <new-pod> -- cat /data/efs-*.txt
```
