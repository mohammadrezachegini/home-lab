# Amazon EFS Dynamic Provisioning on EKS

## Overview

This project demonstrates dynamic provisioning of Amazon EFS storage for Kubernetes workloads on Amazon EKS. Unlike static provisioning where you manually create EFS file systems and Persistent Volumes, dynamic provisioning automatically creates EFS Access Points on-demand when a PersistentVolumeClaim (PVC) is created.

Dynamic provisioning leverages the EFS CSI driver's ability to create isolated directories (via EFS Access Points) within a single EFS file system, providing automatic namespace isolation, per-application access control, and simplified storage management. This approach is ideal for multi-tenant environments and automated deployment pipelines.

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         EKS Cluster                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Kubernetes Storage Resources                  │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────┐            │  │
│  │  │ StorageClass: efs-sc                     │            │  │
│  │  │ provisioner: efs.csi.aws.com             │            │  │
│  │  │ parameters:                               │            │  │
│  │  │   provisioningMode: efs-ap               │            │  │
│  │  │   fileSystemId: fs-xxxxxx                │            │  │
│  │  │   directoryPerms: 700                    │            │  │
│  │  │   gidRangeStart: 1000                    │            │  │
│  │  │   gidRangeEnd: 2000                      │            │  │
│  │  │   basePath: /dynamic_provisioning        │            │  │
│  │  └──────────────────────────────────────────┘            │  │
│  │                      │                                     │  │
│  │                      │ PVC Created                        │  │
│  │                      ▼                                     │  │
│  │  ┌──────────────────────────────────────────┐            │  │
│  │  │ PersistentVolumeClaim: efs-claim         │            │  │
│  │  │   storage: 5Gi                           │            │  │
│  │  │   storageClassName: efs-sc               │            │  │
│  │  └──────────────────────────────────────────┘            │  │
│  │                      │                                     │  │
│  │          ┌───────────┴──────────┐                        │  │
│  │          │ EFS CSI Driver        │                        │  │
│  │          │ Auto-creates:         │                        │  │
│  │          │ 1. Access Point       │                        │  │
│  │          │ 2. PV with handle     │                        │  │
│  │          └───────────┬──────────┘                        │  │
│  │                      │                                     │  │
│  │                      ▼                                     │  │
│  │  ┌──────────────────────────────────────────┐            │  │
│  │  │ PersistentVolume (auto-created)          │            │  │
│  │  │   volumeHandle: fs-xxx::fsap-yyy         │            │  │
│  │  └──────────────────────────────────────────┘            │  │
│  │                      │                                     │  │
│  │                      │ Volume Mount                       │  │
│  │                      ▼                                     │  │
│  │  ┌──────────────────────────────────────────┐            │  │
│  │  │ Pods (myapp1, efs-write-app)             │            │  │
│  │  │ - Mount path: /data or /usr/share/...    │            │  │
│  │  └──────────────────────────────────────────┘            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ NFS + IAM Auth
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                Amazon EFS File System (fs-xxxxxx)                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Root Directory: /                                          │  │
│  │  └── dynamic_provisioning/ (basePath)                     │  │
│  │       ├── pvc-111-uuid/ (Access Point 1)                  │  │
│  │       │   └── [App 1 Data]                                │  │
│  │       ├── pvc-222-uuid/ (Access Point 2)                  │  │
│  │       │   └── [App 2 Data]                                │  │
│  │       └── pvc-333-uuid/ (Access Point 3)                  │  │
│  │           └── [App 3 Data]                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐           │
│  │ Access Point: fsap-1 │  │ Access Point: fsap-2 │           │
│  │ Path: /pvc-111-uuid  │  │ Path: /pvc-222-uuid  │           │
│  │ Owner: UID:GID       │  │ Owner: UID:GID       │           │
│  │ Permissions: 700     │  │ Permissions: 700     │           │
│  └──────────────────────┘  └──────────────────────┘           │
│                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────┐     │
│  │  Mount Target (AZ-1)    │  │  Mount Target (AZ-2)    │     │
│  │  - Private Subnet 1     │  │  - Private Subnet 2     │     │
│  │  - Security Group       │  │  - Security Group       │     │
│  └─────────────────────────┘  └─────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### Dynamic Provisioning Workflow

1. **StorageClass Definition**: Administrator creates StorageClass with EFS file system ID and provisioning parameters
2. **PVC Creation**: Application/User creates PVC referencing the StorageClass
3. **CSI Driver Action**: EFS CSI driver automatically:
   - Creates an EFS Access Point with specified parameters
   - Creates a directory under `basePath` with unique name
   - Sets permissions and ownership as configured
   - Creates a PV with volume handle pointing to Access Point
4. **Binding**: PVC automatically binds to the newly created PV
5. **Pod Mount**: Pods mount the Access Point, seeing only their isolated directory
6. **Cleanup**: When PVC is deleted, Access Point is automatically removed (if reclaimPolicy is Delete)

## Prerequisites

### Required Resources

1. **EKS Cluster with EFS CSI Driver**: Complete the `EKS-EFS-CSI-Install` project first
2. **Terraform**: Version 1.0 or higher
3. **AWS CLI**: Configured with appropriate credentials
4. **kubectl**: For cluster interaction and verification

### Required IAM Permissions

Beyond basic EFS permissions, dynamic provisioning requires:
- `elasticfilesystem:CreateAccessPoint`
- `elasticfilesystem:DeleteAccessPoint`
- `elasticfilesystem:TagResource`
- `elasticfilesystem:DescribeAccessPoints`

These are included in the standard EFS CSI driver IAM policy.

### Network Requirements

- EKS cluster VPC with private subnets
- Security groups allowing NFS traffic (TCP port 2049)
- Mount targets in subnets where pods will run

## Project Structure

```
EKS-EFS-Dynamic-Provisioning/
├── ekscluster-terraform-manifests/       # EKS cluster setup
│   └── [Standard EKS cluster files...]
│
├── efs-install-terraform-manifests/      # EFS CSI driver installation
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
└── efs-dynamic-prov-terraform-manifests/  # Dynamic provisioning setup
    ├── c1-versions.tf                     # Terraform and provider versions
    ├── c2-remote-state-datasource.tf      # Remote state for EKS cluster
    ├── c3-providers.tf                    # Kubernetes provider config
    ├── c4-01-efs-resource.tf              # EFS file system and security group
    ├── c4-02-storage-class.tf             # StorageClass with dynamic parameters
    ├── c4-03-persistent-volume-claim.tf   # PVC (triggers dynamic provisioning)
    ├── c5-write-to-efs-pod.tf             # Test pod that writes to EFS
    ├── c6-01-myapp1-deployment.tf         # Sample application deployment
    ├── c6-02-myapp1-loadbalancer-service.tf # Classic Load Balancer service
    └── c6-03-myapp1-network-loadbalancer-service.tf # NLB service
```

## Usage

### Step 1: Prerequisites Setup

Ensure EKS cluster and EFS CSI driver are deployed:

```bash
# Deploy EKS cluster (if not already done)
cd ekscluster-terraform-manifests
terraform init && terraform apply -auto-approve

# Install EFS CSI driver (if not already done)
cd ../efs-install-terraform-manifests
terraform init && terraform apply -auto-approve
```

### Step 2: Deploy Dynamic Provisioning

```bash
cd efs-dynamic-prov-terraform-manifests

# Initialize Terraform
terraform init

# Review the execution plan
terraform plan

# Note: This will create:
# - EFS file system
# - Security group
# - Mount targets
# - StorageClass with dynamic provisioning parameters
# - PVC (which triggers Access Point creation)
# - Sample applications

# Apply the configuration
terraform apply -auto-approve
```

### Step 3: Verify EFS File System and Access Points

```bash
# Get EFS file system ID
terraform output efs_file_system_id
# Output: fs-0abcd1234efgh5678

# Verify file system
aws efs describe-file-systems --file-system-id <fs-id>

# List Access Points (should see automatically created one)
aws efs describe-access-points --file-system-id <fs-id>

# Example output:
# {
#     "AccessPoints": [
#         {
#             "AccessPointId": "fsap-0123456789abcdef0",
#             "FileSystemId": "fs-0abcd1234efgh5678",
#             "PosixUser": {
#                 "Uid": 1000,
#                 "Gid": 1000
#             },
#             "RootDirectory": {
#                 "Path": "/dynamic_provisioning/pvc-xxx-uuid",
#                 "CreationInfo": {
#                     "OwnerUid": 1000,
#                     "OwnerGid": 1000,
#                     "Permissions": "700"
#                 }
#             },
#             "Tags": [
#                 {
#                     "Key": "efs.csi.aws.com/cluster",
#                     "Value": "true"
#                 }
#             ]
#         }
#     ]
# }
```

### Step 4: Verify Kubernetes Resources

```bash
# Configure kubectl
aws eks update-kubeconfig --name <cluster-name> --region us-east-1

# Check StorageClass
kubectl get storageclass efs-sc
kubectl describe storageclass efs-sc

# Verify PVC is Bound (not Pending)
kubectl get pvc efs-claim
# NAME        STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS
# efs-claim   Bound    pvc-xxx-xxx-xxx-xxx-xxx                   5Gi        RWX            efs-sc

# Check auto-created PersistentVolume
kubectl get pv
kubectl describe pv <pv-name>

# Look for the volumeHandle in format: fs-xxx::fsap-yyy
kubectl get pv <pv-name> -o jsonpath='{.spec.csi.volumeHandle}'
# Output: fs-0abcd1234efgh5678::fsap-0123456789abcdef0

# Check application pods
kubectl get pods
kubectl get deployment myapp1

# Expected pods:
# NAME                      READY   STATUS    RESTARTS   AGE
# efs-write-app             1/1     Running   0          2m
# myapp1-xxxxxxxx-xxxxx     1/1     Running   0          2m
# myapp1-xxxxxxxx-xxxxx     1/1     Running   0          2m
```

### Step 5: Test Dynamic Provisioning

```bash
# Verify data written by test pod
kubectl exec efs-write-app -- cat /data/efs-dynamic.txt

# Expected output: Timestamped entries
# EFS Kubernetes Dynamic Provisioning Test Sat Jan 01 00:00:00 UTC 2025
# EFS Kubernetes Dynamic Provisioning Test Sat Jan 01 00:00:05 UTC 2025

# Check data is accessible from application pods
kubectl exec deployment/myapp1 -- ls -la /usr/share/nginx/html/efs/
kubectl exec deployment/myapp1 -- cat /usr/share/nginx/html/efs/efs-dynamic.txt

# Access via LoadBalancer (if deployed)
kubectl get svc myapp1-lb-service
# Access: http://<elb-dns>/efs/efs-dynamic.txt
```

### Step 6: Test Multiple PVC Creation

Create additional PVCs to see dynamic provisioning in action:

```bash
# Create another PVC
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: efs-claim-2
spec:
  accessModes:
    - ReadWriteMany
  storageClassName: efs-sc
  resources:
    requests:
      storage: 5Gi
EOF

# Wait for binding
kubectl get pvc efs-claim-2 -w

# List all PVCs and PVs
kubectl get pvc,pv

# Check Access Points - should now see 2
aws efs describe-access-points --file-system-id <fs-id>

# Each PVC gets its own isolated Access Point
```

### Step 7: Verify Isolation

```bash
# Deploy a pod using the second PVC
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: test-isolation
spec:
  containers:
  - name: app
    image: busybox
    command: ["/bin/sh"]
    args: ["-c", "echo 'Data in PVC 2' > /data/test.txt; sleep 3600"]
    volumeMounts:
    - name: storage
      mountPath: /data
  volumes:
  - name: storage
    persistentVolumeClaim:
      claimName: efs-claim-2
EOF

# Check data in first PVC
kubectl exec efs-write-app -- ls /data/
# Should NOT see test.txt (isolated)

# Check data in second PVC
kubectl exec test-isolation -- ls /data/
# Should see test.txt

# Cleanup test resources
kubectl delete pod test-isolation
kubectl delete pvc efs-claim-2
```

## Configuration

### StorageClass with Dynamic Provisioning Parameters

#### c4-02-storage-class.tf

This is the key difference from static provisioning:

```hcl
resource "kubernetes_storage_class_v1" "efs_sc" {
  metadata {
    name = "efs-sc"
  }
  storage_provisioner = "efs.csi.aws.com"

  parameters = {
    provisioningMode = "efs-ap"                          # Enable Access Point mode
    fileSystemId     = aws_efs_file_system.efs_file_system.id  # EFS file system ID
    directoryPerms   = "700"                             # Directory permissions
    gidRangeStart    = "1000"                           # GID range start (optional)
    gidRangeEnd      = "2000"                           # GID range end (optional)
    basePath         = "/dynamic_provisioning"          # Base directory path (optional)
  }
}
```

### StorageClass Parameters Explained

| Parameter | Required | Description | Default | Example |
|-----------|----------|-------------|---------|---------|
| **provisioningMode** | Yes | Set to `efs-ap` for dynamic provisioning | - | `efs-ap` |
| **fileSystemId** | Yes | EFS file system ID | - | `fs-0abc123` |
| **directoryPerms** | No | Directory permissions in octal | `755` | `700`, `770`, `755` |
| **gidRangeStart** | No | Starting GID for allocation | `50000` | `1000` |
| **gidRangeEnd** | No | Ending GID for allocation | `7000000` | `2000` |
| **basePath** | No | Base path for all Access Points | `/` | `/dynamic_provisioning` |
| **uid** | No | Fixed UID for all Access Points | - | `1000` |
| **gid** | No | Fixed GID for all Access Points | - | `1000` |
| **gidRangeStart** + **gidRangeEnd** | No | Auto-assign GID from range | - | `1000-2000` |
| **azName** | No | Restrict to specific AZ | All AZs | `us-east-1a` |

### EFS File System Configuration

#### c4-01-efs-resource.tf

Similar to static provisioning, but the file system will host multiple Access Points:

```hcl
# Security Group
resource "aws_security_group" "efs_allow_access" {
  name        = "efs-allow-nfs-from-eks-vpc"
  description = "Allow Inbound NFS Traffic from EKS VPC CIDR"
  vpc_id      = data.terraform_remote_state.eks.outputs.vpc_id

  ingress {
    description = "Allow Inbound NFS Traffic from EKS VPC CIDR to EFS File System"
    from_port   = 2049
    to_port     = 2049
    protocol    = "tcp"
    cidr_blocks = [data.terraform_remote_state.eks.outputs.vpc_cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "allow_nfs_from_eks_vpc"
  }
}

# EFS File System
resource "aws_efs_file_system" "efs_file_system" {
  creation_token = "efs-demo"

  # Optional: Enable encryption
  encrypted  = true
  kms_key_id = aws_kms_key.efs.arn  # If using custom KMS key

  # Optional: Performance settings
  performance_mode = "generalPurpose"  # or "maxIO"
  throughput_mode  = "bursting"        # or "provisioned"

  # Optional: Lifecycle management
  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }

  tags = {
    Name = "efs-demo-dynamic"
  }
}

# Mount Targets
resource "aws_efs_mount_target" "efs_mount_target" {
  count              = 2
  file_system_id     = aws_efs_file_system.efs_file_system.id
  subnet_id          = data.terraform_remote_state.eks.outputs.private_subnets[count.index]
  security_groups    = [aws_security_group.efs_allow_access.id]
}
```

### PersistentVolumeClaim Configuration

#### c4-03-persistent-volume-claim.tf

```hcl
resource "kubernetes_persistent_volume_claim_v1" "efs_pvc" {
  metadata {
    name = "efs-claim"
  }
  spec {
    access_modes       = ["ReadWriteMany"]
    storage_class_name = kubernetes_storage_class_v1.efs_sc.metadata[0].name
    resources {
      requests = {
        storage = "5Gi"  # Size is not enforced by EFS
      }
    }
  }
}
```

**Key Points**:
- No need to create PersistentVolume manually
- PV is automatically created by CSI driver
- Creating this PVC triggers Access Point creation

### Application Using Dynamic Storage

#### c6-01-myapp1-deployment.tf

```hcl
resource "kubernetes_deployment_v1" "myapp1" {
  depends_on = [aws_efs_mount_target.efs_mount_target]
  metadata {
    name = "myapp1"
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
        name = "myapp1-pod"
        labels = {
          app = "myapp1"
        }
      }
      spec {
        container {
          name  = "myapp1-container"
          image = "stacksimplify/kubenginx:1.0.0"
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

The pod configuration is identical to static provisioning, but the underlying PV points to an Access Point.

## Features

### 1. Automatic Access Point Management

The EFS CSI driver automatically:
- Creates Access Points when PVCs are created
- Configures POSIX user/group ownership
- Sets directory permissions
- Deletes Access Points when PVCs are deleted (if reclaimPolicy is Delete)

### 2. Namespace Isolation

Each PVC gets an isolated directory:
```
/dynamic_provisioning/
  ├── pvc-111111-uuid/  # PVC 1 sees only this
  ├── pvc-222222-uuid/  # PVC 2 sees only this
  └── pvc-333333-uuid/  # PVC 3 sees only this
```

### 3. Per-Application Access Control

Access Points enforce:
- User/Group ID
- Directory permissions
- Root directory squashing

### 4. GID Auto-Assignment

Automatically assign unique GIDs from a range:
```hcl
parameters = {
  gidRangeStart = "1000"
  gidRangeEnd   = "2000"
}
```

### 5. Simplified Multi-Tenant Storage

Perfect for:
- Multiple applications on same cluster
- Per-namespace storage isolation
- Automated CI/CD pipelines
- Development/staging environments

### 6. Cost Efficiency

Share one EFS file system across multiple applications:
- Single file system reduces AWS resource count
- Consolidated billing
- Shared throughput and burst credits

### 7. Lifecycle Management

Automatically clean up storage:
```hcl
reclaim_policy = "Delete"  # Access Point deleted when PVC is deleted
# or
reclaim_policy = "Retain"  # Access Point preserved for data recovery
```

## Troubleshooting

### Issue: PVC Stuck in Pending After Creation

**Symptoms:**
```bash
kubectl get pvc efs-claim
# STATUS: Pending for more than a few seconds
```

**Solutions:**

1. **Check CSI controller logs:**
```bash
kubectl logs -n kube-system -l app=efs-csi-controller -c csi-provisioner --tail=50
# Look for provisioning errors
```

2. **Verify StorageClass parameters:**
```bash
kubectl describe storageclass efs-sc
# Ensure fileSystemId is correct and file system exists
aws efs describe-file-systems --file-system-id <fs-id>
```

3. **Check IAM permissions:**
```bash
# Verify EFS CSI driver can create Access Points
kubectl logs -n kube-system -l app=efs-csi-controller -c csi-driver --tail=50 | grep -i "access.*denied\|permission"
```

4. **Verify file system is available:**
```bash
aws efs describe-file-systems --file-system-id <fs-id> --query 'FileSystems[0].LifeCycleState'
# Should return "available"
```

### Issue: Access Point Creation Fails

**Symptoms:**
```bash
kubectl describe pvc efs-claim
# Events show: "Failed to provision volume"

kubectl logs -n kube-system -l app=efs-csi-controller -c csi-provisioner
# Shows: "cannot create access point"
```

**Solutions:**

1. **Check IAM policy includes Access Point permissions:**
```bash
aws iam get-policy-version \
  --policy-arn <efs-csi-policy-arn> \
  --version-id v1 | grep -i accesspoint

# Should include:
# - elasticfilesystem:CreateAccessPoint
# - elasticfilesystem:DeleteAccessPoint
# - elasticfilesystem:DescribeAccessPoints
```

2. **Verify EFS resource tags:**
```bash
# Access Points created by CSI driver should have specific tags
aws efs describe-access-points --file-system-id <fs-id>
# Look for tag: efs.csi.aws.com/cluster=true
```

3. **Check Access Point limits:**
```bash
# AWS limit: 120 Access Points per file system
aws efs describe-access-points --file-system-id <fs-id> | jq '.AccessPoints | length'
```

### Issue: Permission Denied Inside Container

**Symptoms:**
```bash
kubectl exec <pod-name> -- touch /data/test.txt
# Returns: Permission denied
```

**Solutions:**

1. **Check directory permissions in StorageClass:**
```bash
kubectl get storageclass efs-sc -o yaml | grep directoryPerms
# Should be 700, 755, or 777 depending on requirements
```

2. **Verify pod securityContext matches Access Point UID/GID:**
```yaml
spec:
  securityContext:
    fsGroup: 1000      # Must match GID in Access Point
    runAsUser: 1000    # Must match UID in Access Point
  containers:
  - name: app
    securityContext:
      runAsUser: 1000
```

3. **Check Access Point configuration:**
```bash
aws efs describe-access-points --access-point-id <fsap-id>
# Verify PosixUser UID/GID and RootDirectory permissions
```

4. **Use fixed UID/GID in StorageClass:**
```hcl
parameters = {
  provisioningMode = "efs-ap"
  fileSystemId     = aws_efs_file_system.efs_file_system.id
  uid              = "1000"
  gid              = "1000"
  directoryPerms   = "755"
}
```

### Issue: Cannot List or See Files from Other PVCs

**Symptoms:**
- Pod can only see its own PVC data
- Cannot access data from other Access Points

**Solution:**

This is **expected behavior**. Access Points provide isolation:
- Each PVC is mounted to a specific Access Point
- Access Point shows only its root directory path
- This is a feature, not a bug (security isolation)

If you need shared access across applications, use **static provisioning** with a single PV.

### Issue: Access Point Not Deleted After PVC Deletion

**Symptoms:**
```bash
kubectl delete pvc efs-claim
# PVC deleted but Access Point remains

aws efs describe-access-points --file-system-id <fs-id>
# Access Point still exists
```

**Solutions:**

1. **Check PV reclaim policy:**
```bash
kubectl get pv <pv-name> -o jsonpath='{.spec.persistentVolumeReclaimPolicy}'
# Should be "Delete" for automatic cleanup
```

2. **Verify PV was deleted:**
```bash
kubectl get pv <pv-name>
# If PV still exists, it won't trigger Access Point deletion
```

3. **Check CSI driver logs:**
```bash
kubectl logs -n kube-system -l app=efs-csi-controller -c csi-driver --tail=50 | grep -i delete
```

4. **Manually delete Access Point if needed:**
```bash
aws efs delete-access-point --access-point-id <fsap-id>
```

### Issue: Mount Failed - Access Point Not Found

**Symptoms:**
```bash
kubectl describe pod <pod-name>
# Events show: "access point not found"
```

**Solutions:**

1. **Verify Access Point exists:**
```bash
# Extract fsap-id from PV volume handle
kubectl get pv <pv-name> -o jsonpath='{.spec.csi.volumeHandle}'
# Format: fs-xxx::fsap-yyy

aws efs describe-access-points --access-point-id fsap-yyy
```

2. **Check Access Point lifecycle state:**
```bash
aws efs describe-access-points --access-point-id <fsap-id> --query 'AccessPoints[0].LifeCycleState'
# Should be "available"
```

3. **Ensure mount targets are available:**
```bash
aws efs describe-mount-targets --file-system-id <fs-id>
```

### Debugging Commands

```bash
# List all Access Points for file system
aws efs describe-access-points --file-system-id <fs-id> --output table

# Get detailed Access Point info
aws efs describe-access-points --access-point-id <fsap-id>

# Check CSI provisioner logs
kubectl logs -n kube-system -l app=efs-csi-controller -c csi-provisioner -f

# Check CSI driver logs
kubectl logs -n kube-system -l app=efs-csi-controller -c csi-driver -f

# Get PV volume handle (contains Access Point ID)
kubectl get pv -o custom-columns=NAME:.metadata.name,VOLUMEHANDLE:.spec.csi.volumeHandle

# Check PVC annotations
kubectl get pvc <pvc-name> -o yaml | grep -A 5 annotations

# View StorageClass parameters
kubectl get storageclass efs-sc -o yaml

# Check PV reclaim policy
kubectl get pv -o custom-columns=NAME:.metadata.name,RECLAIMPOLICY:.spec.persistentVolumeReclaimPolicy

# Monitor PVC creation
kubectl get pvc -w

# Check events for errors
kubectl get events --sort-by=.metadata.creationTimestamp | grep -i "efs\|pvc\|pv"
```

## Best Practices

### 1. Use Meaningful Base Paths

Organize Access Points with clear base paths:

```hcl
parameters = {
  basePath = "/apps/${var.environment}/${var.team_name}"
  # Results in: /apps/production/platform-team/pvc-xxx/
}
```

### 2. Set Appropriate Directory Permissions

Choose permissions based on security requirements:

```hcl
# Development - permissive
directoryPerms = "777"

# Production - restrictive
directoryPerms = "700"

# Shared team access
directoryPerms = "770"
```

### 3. Use GID Ranges for Multi-Tenancy

Assign GID ranges per namespace or team:

```hcl
# Team A
gidRangeStart = "1000"
gidRangeEnd   = "1999"

# Team B
gidRangeStart = "2000"
gidRangeEnd   = "2999"
```

### 4. Implement Namespace Quotas

Limit PVC creation per namespace:

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: storage-quota
  namespace: my-namespace
spec:
  hard:
    persistentvolumeclaims: "10"
    requests.storage: "100Gi"
```

### 5. Tag Resources for Cost Tracking

Add tags to identify Access Point owners:

```bash
aws efs tag-resource \
  --resource-id fsap-xxx \
  --tags Key=Team,Value=platform Key=CostCenter,Value=engineering
```

### 6. Monitor Access Point Limits

Set up CloudWatch alerts for Access Point count:

```bash
# Current count
aws efs describe-access-points --file-system-id <fs-id> | jq '.AccessPoints | length'

# Alert when approaching limit (120 per file system)
```

### 7. Use Reclaim Policy Wisely

```hcl
# Development/Testing - auto cleanup
reclaim_policy = "Delete"

# Production - manual cleanup for safety
reclaim_policy = "Retain"
```

### 8. Create StorageClass per Environment

```hcl
resource "kubernetes_storage_class_v1" "efs_sc_dev" {
  metadata {
    name = "efs-sc-dev"
  }
  parameters = {
    basePath = "/dev"
    directoryPerms = "777"
  }
}

resource "kubernetes_storage_class_v1" "efs_sc_prod" {
  metadata {
    name = "efs-sc-prod"
  }
  parameters = {
    basePath = "/prod"
    directoryPerms = "700"
  }
}
```

### 9. Document Access Point Lifecycle

Maintain documentation of:
- Which applications use which Access Points
- PVC to Access Point mappings
- Data retention policies
- Backup schedules

### 10. Implement Backup Strategy

```bash
# List all Access Points for backup
aws efs describe-access-points --file-system-id <fs-id> \
  --query 'AccessPoints[*].[AccessPointId,Name]' \
  --output text > access-points-backup-list.txt

# Enable AWS Backup for entire file system
# All Access Points are included in file system backups
```

### 11. Use Appropriate Performance Mode

```hcl
# For < 7000 ops/sec (most applications)
performance_mode = "generalPurpose"

# For parallel workloads > 7000 ops/sec
performance_mode = "maxIO"
```

### 12. Enable Encryption

```hcl
resource "aws_efs_file_system" "efs_file_system" {
  encrypted  = true
  kms_key_id = aws_kms_key.efs.arn

  tags = {
    Name = "efs-dynamic-encrypted"
  }
}
```
