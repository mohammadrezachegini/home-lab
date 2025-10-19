# Amazon EFS Static Provisioning on EKS

## Overview

This project demonstrates how to use Amazon EFS (Elastic File System) with Amazon EKS using static provisioning. Static provisioning involves pre-creating an EFS file system and manually defining Kubernetes Persistent Volume (PV) resources that reference it. This approach gives you full control over the EFS file system configuration and is ideal for scenarios where you need to manage file systems independently of Kubernetes lifecycle.

The project includes a complete implementation with security groups, storage classes, persistent volumes, persistent volume claims, and sample applications that demonstrate ReadWriteMany access patterns across multiple pods.

## Architecture

### Component Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                         EKS Cluster                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Kubernetes Resources                   │  │
│  │                                                           │  │
│  │  ┌─────────────────┐         ┌──────────────────┐       │  │
│  │  │ StorageClass    │         │  PersistentVolume│       │  │
│  │  │   efs-sc        │◄────────│     efs-pv       │       │  │
│  │  └─────────────────┘         │ volumeHandle:    │       │  │
│  │                               │   fs-xxxxxx      │       │  │
│  │  ┌─────────────────┐         └──────────────────┘       │  │
│  │  │      PVC        │                  ▲                  │  │
│  │  │   efs-claim     │──────────────────┘                  │  │
│  │  └─────────────────┘                                     │  │
│  │          ▲                                                │  │
│  │          │                                                │  │
│  │  ┌───────┴───────────────────────────────────┐          │  │
│  │  │                                            │          │  │
│  │  │  Pod 1 (myapp1)    Pod 2 (myapp1)        │          │  │
│  │  │  /usr/share/       /usr/share/            │          │  │
│  │  │   nginx/html/efs    nginx/html/efs       │          │  │
│  │  │                                            │          │  │
│  │  │  Pod 3 (efs-write-app)                    │          │  │
│  │  │  /data (writes test data)                 │          │  │
│  │  └────────────────────────────────────────────┘          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                            │
                            │ NFS Protocol (Port 2049)
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                    Amazon EFS File System                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  File System: fs-xxxxxx                                  │  │
│  │  - Encryption: Optional                                  │  │
│  │  - Performance Mode: General Purpose / Max I/O          │  │
│  │  - Throughput Mode: Bursting / Provisioned              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐     │
│  │  Mount Target (AZ-1)    │  │  Mount Target (AZ-2)    │     │
│  │  - Private Subnet 1     │  │  - Private Subnet 2     │     │
│  │  - Security Group       │  │  - Security Group       │     │
│  └─────────────────────────┘  └─────────────────────────┘     │
└────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Pre-provisioning Phase**:
   - Terraform creates EFS file system with security group
   - Mount targets created in private subnets
   - Security group allows NFS traffic (port 2049) from VPC CIDR

2. **Storage Configuration Phase**:
   - StorageClass created with `efs.csi.aws.com` provisioner
   - PersistentVolume created with EFS file system ID
   - PersistentVolumeClaim binds to PV

3. **Application Phase**:
   - Pods reference PVC in volume definitions
   - EFS CSI driver mounts EFS file system into pods
   - Multiple pods share same file system (ReadWriteMany)

## Prerequisites

### Required Resources

1. **EKS Cluster with EFS CSI Driver**: Complete the `EKS-EFS-CSI-Install` project first
2. **Terraform**: Version 1.0 or higher
3. **AWS CLI**: Configured with appropriate credentials
4. **kubectl**: For cluster interaction and verification

### Required Permissions

- Create and manage EFS file systems
- Create and manage security groups
- Create Kubernetes resources (StorageClass, PV, PVC, Pods, Deployments)
- Describe VPC resources

### Network Requirements

- EKS cluster VPC with private subnets
- Network connectivity between EKS nodes and EFS mount targets
- Security groups allowing NFS traffic (TCP port 2049)

## Project Structure

```
EKS-EFS-Static-Provisioning/
├── ekscluster-terraform-manifests/      # EKS cluster setup (same as CSI Install)
│   └── [Standard EKS cluster files...]
│
└── efs-static-prov-terraform-manifests/ # EFS static provisioning
    ├── c1-versions.tf                    # Terraform and provider versions
    ├── c2-remote-state-datasource.tf     # Remote state for EKS cluster
    ├── c3-providers.tf                   # Kubernetes and Helm providers
    ├── c4-01-efs-resource.tf             # EFS file system and security group
    ├── c4-02-storage-class.tf            # Kubernetes StorageClass
    ├── c4-03-persistent-volume-claim.tf  # PVC definition
    ├── c4-04-persistent-volume.tf        # PV with EFS volume handle
    ├── c5-write-to-efs-pod.tf            # Test pod that writes to EFS
    ├── c6-01-myapp1-deployment.tf        # Sample application deployment
    ├── c6-02-myapp1-loadbalancer-service.tf # Classic Load Balancer service
    └── c6-03-myapp1-network-loadbalancer-service.tf # NLB service
```

## Usage

### Step 1: Deploy EKS Cluster and EFS CSI Driver

Ensure you have completed the prerequisites:

```bash
# Deploy EKS cluster (if not already done)
cd ekscluster-terraform-manifests
terraform init && terraform apply -auto-approve

# Install EFS CSI driver (if not already done)
cd ../efs-install-terraform-manifests
terraform init && terraform apply -auto-approve
```

### Step 2: Deploy EFS File System with Static Provisioning

```bash
cd efs-static-prov-terraform-manifests

# Initialize Terraform
terraform init

# Review the execution plan
terraform plan

# Apply the configuration
terraform apply -auto-approve
```

### Step 3: Verify EFS File System

```bash
# Get EFS file system ID
terraform output efs_file_system_id

# Check EFS file system in AWS
aws efs describe-file-systems --file-system-id <fs-id>

# Verify mount targets
aws efs describe-mount-targets --file-system-id <fs-id>

# Check security group rules
aws ec2 describe-security-groups --group-ids <security-group-id>
```

### Step 4: Verify Kubernetes Resources

```bash
# Configure kubectl
aws eks update-kubeconfig --name <cluster-name> --region us-east-1

# Check StorageClass
kubectl get storageclass efs-sc
kubectl describe storageclass efs-sc

# Check PersistentVolume
kubectl get pv
kubectl describe pv efs-pv

# Check PersistentVolumeClaim
kubectl get pvc
kubectl describe pvc efs-claim
# Status should be "Bound"

# Check application pods
kubectl get pods
kubectl get deployment myapp1

# Expected output:
# NAME                    READY   STATUS    RESTARTS   AGE
# efs-write-app           1/1     Running   0          2m
# myapp1-xxxxxxxx-xxxxx   1/1     Running   0          2m
# myapp1-xxxxxxxx-xxxxx   1/1     Running   0          2m
```

### Step 5: Test Shared File System

```bash
# Check what the write pod is writing
kubectl exec efs-write-app -- cat /data/efs-static.txt

# Expected output: Multiple timestamped entries
# EFS Kubernetes Static Provisioning Test Sat Jan 01 00:00:00 UTC 2025
# EFS Kubernetes Static Provisioning Test Sat Jan 01 00:00:05 UTC 2025

# Verify myapp1 pods can see the same data
kubectl exec deployment/myapp1 -- ls -la /usr/share/nginx/html/efs/
kubectl exec deployment/myapp1 -- cat /usr/share/nginx/html/efs/efs-static.txt

# Access via LoadBalancer (if deployed)
kubectl get svc myapp1-lb-service
# Access the ELB endpoint in browser: http://<elb-dns>/efs/efs-static.txt
```

### Step 6: Test ReadWriteMany Capability

```bash
# Scale the deployment
kubectl scale deployment myapp1 --replicas=5

# Watch pods come up
kubectl get pods -w

# Write to EFS from one pod
kubectl exec deployment/myapp1 -- sh -c "echo 'Test from pod' >> /usr/share/nginx/html/efs/test.txt"

# Read from a different pod
kubectl exec deployment/myapp1 -- cat /usr/share/nginx/html/efs/test.txt

# All pods should see the same data
```

## Configuration

### EFS File System Configuration

#### c4-01-efs-resource.tf

Creates the EFS file system, security group, and mount targets:

```hcl
# Security Group - Allow NFS traffic from EKS VPC
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
  tags = {
    Name = "efs-demo"
  }
}

# Mount Targets in Private Subnets
resource "aws_efs_mount_target" "efs_mount_target" {
  count              = 2
  file_system_id     = aws_efs_file_system.efs_file_system.id
  subnet_id          = data.terraform_remote_state.eks.outputs.private_subnets[count.index]
  security_groups    = [aws_security_group.efs_allow_access.id]
}
```

**Key Configuration Options**:

- **creation_token**: Unique identifier for idempotent creation
- **encrypted**: Enable encryption at rest (recommended for production)
- **kms_key_id**: Custom KMS key for encryption
- **performance_mode**: `generalPurpose` (default) or `maxIO` for high throughput
- **throughput_mode**: `bursting` (default) or `provisioned`

### StorageClass Configuration

#### c4-02-storage-class.tf

```hcl
resource "kubernetes_storage_class_v1" "efs_sc" {
  metadata {
    name = "efs-sc"
  }
  storage_provisioner = "efs.csi.aws.com"
}
```

**Note**: For static provisioning, the StorageClass doesn't include parameters since the file system is pre-created.

### PersistentVolume Configuration

#### c4-04-persistent-volume.tf

```hcl
resource "kubernetes_persistent_volume_v1" "efs_pv" {
  metadata {
    name = "efs-pv"
  }
  spec {
    capacity = {
      storage = "5Gi"
    }
    volume_mode                      = "Filesystem"
    access_modes                     = ["ReadWriteMany"]
    persistent_volume_reclaim_policy = "Retain"
    storage_class_name               = kubernetes_storage_class_v1.efs_sc.metadata[0].name

    persistent_volume_source {
      csi {
        driver        = "efs.csi.aws.com"
        volume_handle = aws_efs_file_system.efs_file_system.id
      }
    }
  }
}
```

**Important Notes**:

- **capacity.storage**: Required by Kubernetes but not enforced by EFS (elastic sizing)
- **access_modes**: `ReadWriteMany` allows multiple pods to mount simultaneously
- **reclaim_policy**: `Retain` keeps the EFS file system when PV is deleted
- **volume_handle**: Must be the EFS file system ID (fs-xxxxxxxx)

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
        storage = "5Gi"
      }
    }
  }
}
```

The PVC automatically binds to the PV because:
1. Both reference the same StorageClass
2. Access modes match
3. Storage request is satisfied

### Application Configuration

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

**Volume Mount Explanation**:
- Each pod gets EFS mounted at `/usr/share/nginx/html/efs`
- All pods see identical content (shared storage)
- Changes by one pod visible to all others immediately

#### c5-write-to-efs-pod.tf

```hcl
resource "kubernetes_pod_v1" "efs_write_app_pod" {
  depends_on = [aws_efs_mount_target.efs_mount_target]
  metadata {
    name = "efs-write-app"
  }
  spec {
    container {
      name    = "efs-write-app"
      image   = "busybox"
      command = ["/bin/sh"]
      args    = ["-c", "while true; do echo EFS Kubernetes Static Provisioning Test $(date -u) >> /data/efs-static.txt; sleep 5; done"]
      volume_mount {
        name       = "persistent-storage"
        mount_path = "/data"
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
```

This pod continuously writes timestamped entries to test file persistence and sharing.

## Features

### 1. ReadWriteMany Access Mode

Multiple pods can simultaneously read and write to the same EFS file system:

```yaml
accessModes:
  - ReadWriteMany
```

This is unique to EFS and not supported by EBS volumes.

### 2. Elastic Storage

EFS automatically scales storage capacity:
- No need to pre-allocate space
- Pay only for what you use
- No capacity planning required

### 3. Multi-AZ Availability

Mount targets in multiple availability zones provide:
- High availability
- Automatic failover
- Regional durability

### 4. Shared State Across Pods

Perfect for use cases requiring shared file access:
- Content management systems
- Shared configuration files
- Machine learning model storage
- Log aggregation
- Development environments

### 5. Data Persistence

Data persists beyond pod lifecycle:
- Pod deletion doesn't affect data
- Deployment restarts maintain data
- Cluster rebuilds can remount same EFS

### 6. Performance Options

Choose performance characteristics:
- **General Purpose**: Low latency for most workloads
- **Max I/O**: Higher aggregate throughput for parallelized workloads

### 7. File System Locking

NFS file locking support for coordinated access:
- Prevents concurrent write conflicts
- Enables database file storage (with limitations)

## Troubleshooting

### Issue: PVC Stuck in Pending State

**Symptoms:**
```bash
kubectl get pvc
# NAME        STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS
# efs-claim   Pending                                      efs-sc
```

**Solutions:**

1. **Check if PV exists:**
```bash
kubectl get pv
# PV should exist with status "Available"
```

2. **Verify StorageClass matches:**
```bash
kubectl get pv efs-pv -o yaml | grep storageClassName
kubectl get pvc efs-claim -o yaml | grep storageClassName
# Both should show "efs-sc"
```

3. **Check access modes compatibility:**
```bash
kubectl describe pv efs-pv
kubectl describe pvc efs-claim
# Access modes must match
```

4. **Look for binding errors:**
```bash
kubectl describe pvc efs-claim
# Check Events section for errors
```

### Issue: Pods Can't Mount EFS Volume

**Symptoms:**
```bash
kubectl get pods
# Pods showing ContainerCreating or MountVolume errors

kubectl describe pod <pod-name>
# Events show: "MountVolume.MountDevice failed"
```

**Solutions:**

1. **Verify EFS CSI driver is running:**
```bash
kubectl get pods -n kube-system | grep efs-csi
# Both controller and node drivers should be running
```

2. **Check security group rules:**
```bash
aws ec2 describe-security-groups --group-ids <security-group-id>
# Verify port 2049 is open from VPC CIDR
```

3. **Verify mount targets are available:**
```bash
aws efs describe-mount-targets --file-system-id <fs-id>
# LifeCycleState should be "available"
```

4. **Check node security groups:**
```bash
# Node security groups must allow outbound traffic to EFS
aws ec2 describe-security-groups --group-ids <node-security-group-id>
```

5. **Verify subnet connectivity:**
```bash
# Ensure mount targets are in subnets accessible from node subnets
aws efs describe-mount-targets --file-system-id <fs-id>
```

### Issue: Mount Operation Timeout

**Symptoms:**
```bash
kubectl logs <pod-name>
# Shows: "mount.nfs: Connection timed out"
```

**Solutions:**

1. **Test network connectivity from node:**
```bash
# SSH to worker node
sudo mount -t nfs4 <fs-id>.efs.<region>.amazonaws.com:/ /mnt/efs-test

# If it fails, check:
# - Security groups
# - Route tables
# - Network ACLs
```

2. **Verify DNS resolution:**
```bash
# From worker node
nslookup <fs-id>.efs.<region>.amazonaws.com
```

3. **Check if NFS is blocked:**
```bash
# Test telnet to mount target
telnet <mount-target-ip> 2049
```

### Issue: Permission Denied Errors

**Symptoms:**
```bash
kubectl exec <pod-name> -- ls /data
# Shows: "Permission denied"
```

**Solutions:**

1. **Check EFS file system permissions:**
```bash
# From a pod with root access
kubectl run -it --rm debug --image=busybox --restart=Never -- sh
# In the pod, mount EFS and check permissions
```

2. **Use EFS Access Points for permission management** (see Dynamic Provisioning project)

3. **Modify container securityContext:**
```yaml
securityContext:
  fsGroup: 1000
  runAsUser: 1000
```

### Issue: Data Not Visible Across Pods

**Symptoms:**
- One pod writes data but other pods don't see it

**Solutions:**

1. **Verify all pods use same PVC:**
```bash
kubectl get pods -o yaml | grep claimName
# All should show the same claim name
```

2. **Check if pods are mounting same path:**
```bash
kubectl exec <pod-1> -- ls /data
kubectl exec <pod-2> -- ls /data
```

3. **Check for file system caching issues:**
```bash
# Force a sync
kubectl exec <pod-name> -- sync
```

4. **Verify mount paths in pod specs:**
```bash
kubectl get deployment myapp1 -o yaml | grep -A 5 volumeMount
```

### Issue: Slow Performance

**Symptoms:**
- High latency for file operations
- Slow application response times

**Solutions:**

1. **Check EFS metrics in CloudWatch:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/EFS \
  --metric-name PermittedThroughput \
  --dimensions Name=FileSystemId,Value=<fs-id> \
  --start-time <start> \
  --end-time <end> \
  --period 300 \
  --statistics Average
```

2. **Consider Max I/O performance mode:**
```hcl
resource "aws_efs_file_system" "efs_file_system" {
  performance_mode = "maxIO"
}
```

3. **Enable provisioned throughput:**
```hcl
resource "aws_efs_file_system" "efs_file_system" {
  throughput_mode                 = "provisioned"
  provisioned_throughput_in_mibps = 100
}
```

4. **Use EFS Intelligent-Tiering:**
```hcl
resource "aws_efs_file_system" "efs_file_system" {
  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }
}
```

### Debugging Commands

```bash
# Get detailed PVC information
kubectl get pvc efs-claim -o yaml

# Check PV to PVC binding
kubectl get pv efs-pv -o jsonpath='{.spec.claimRef}'

# View CSI driver logs for mount operations
kubectl logs -n kube-system -l app=efs-csi-node -c csi-driver --tail=100

# Check events for mount errors
kubectl get events --sort-by=.metadata.creationTimestamp

# Describe node for volume attachments
kubectl describe node <node-name> | grep -A 10 "Attached Volumes"

# Check EFS file system status
aws efs describe-file-systems --file-system-id <fs-id> --query 'FileSystems[0].LifeCycleState'

# View mount target details
aws efs describe-mount-targets --file-system-id <fs-id> --output table

# Test NFS mount manually from node
sudo mount -t nfs4 -o nfsvers=4.1 <fs-id>.efs.<region>.amazonaws.com:/ /mnt/test
```

## Best Practices

### 1. Enable Encryption at Rest

Always encrypt EFS file systems:

```hcl
resource "aws_efs_file_system" "efs_file_system" {
  creation_token = "efs-demo"
  encrypted      = true
  kms_key_id     = aws_kms_key.efs.arn
}
```

### 2. Use Private Subnets for Mount Targets

Never place mount targets in public subnets:

```hcl
resource "aws_efs_mount_target" "efs_mount_target" {
  subnet_id = data.terraform_remote_state.eks.outputs.private_subnets[count.index]
  # Not public subnets
}
```

### 3. Implement Least Privilege Security Groups

Restrict NFS access to specific CIDR blocks:

```hcl
ingress {
  from_port   = 2049
  to_port     = 2049
  protocol    = "tcp"
  cidr_blocks = [data.terraform_remote_state.eks.outputs.vpc_cidr_block]
  # Not 0.0.0.0/0
}
```

### 4. Use Retain Reclaim Policy

Prevent accidental data loss:

```hcl
persistent_volume_reclaim_policy = "Retain"
# Not "Delete" for production data
```

### 5. Create Mount Targets in All AZs

Ensure high availability:

```hcl
resource "aws_efs_mount_target" "efs_mount_target" {
  count = length(data.terraform_remote_state.eks.outputs.private_subnets)
  # Create in all subnets where nodes may run
}
```

### 6. Tag Resources Appropriately

Enable cost tracking and management:

```hcl
tags = {
  Name        = "efs-demo"
  Environment = "production"
  ManagedBy   = "terraform"
  Project     = "eks-efs"
  CostCenter  = "engineering"
}
```

### 7. Monitor EFS Metrics

Set up CloudWatch alarms for:
- **PermittedThroughput**: Alert when hitting limits
- **BurstCreditBalance**: Warn before exhaustion
- **ClientConnections**: Monitor for unusual spikes
- **DataReadIOBytes/DataWriteIOBytes**: Track usage patterns

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name efs-low-burst-credits \
  --metric-name BurstCreditBalance \
  --namespace AWS/EFS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 1000000000000 \
  --comparison-operator LessThanThreshold \
  --dimensions Name=FileSystemId,Value=<fs-id>
```

### 8. Use EFS Lifecycle Management

Reduce costs by moving infrequently accessed files:

```hcl
resource "aws_efs_file_system" "efs_file_system" {
  lifecycle_policy {
    transition_to_ia = "AFTER_30_DAYS"
  }

  lifecycle_policy {
    transition_to_primary_storage_class = "AFTER_1_ACCESS"
  }
}
```

### 9. Implement Backup Strategy

Enable AWS Backup for EFS:

```hcl
resource "aws_backup_plan" "efs_backup" {
  name = "efs-backup-plan"

  rule {
    rule_name         = "daily_backup"
    target_vault_name = aws_backup_vault.efs_vault.name
    schedule          = "cron(0 2 * * ? *)"

    lifecycle {
      delete_after = 30
    }
  }
}

resource "aws_backup_selection" "efs_backup_selection" {
  plan_id      = aws_backup_plan.efs_backup.id
  name         = "efs_backup_selection"
  iam_role_arn = aws_iam_role.backup_role.arn

  resources = [
    aws_efs_file_system.efs_file_system.arn
  ]
}
```

### 10. Document File System Layout

Maintain documentation of directory structure and purpose:

```
/
├── app1/          # Application 1 data
├── app2/          # Application 2 data
├── shared/        # Shared configuration
└── logs/          # Centralized logs
```

### 11. Use Sub-paths for Multi-tenant Scenarios

Mount different paths per application:

```yaml
volumeMounts:
  - name: efs-storage
    mountPath: /data
    subPath: app1  # Isolate data per application
```

### 12. Test Disaster Recovery

Regularly test EFS restoration:

```bash
# Create manual backup
aws efs create-backup --file-system-id <fs-id>

# Test restore to new file system
aws efs restore-backup --backup-id <backup-id>
```
