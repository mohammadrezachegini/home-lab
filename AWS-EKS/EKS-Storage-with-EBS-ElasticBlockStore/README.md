# EKS Persistent Storage with Amazon EBS

## Overview

This project demonstrates how to implement persistent storage in Amazon Elastic Kubernetes Service (EKS) using Amazon Elastic Block Store (EBS) volumes. It showcases a complete implementation of the EBS CSI (Container Storage Interface) driver to provision dynamic EBS volumes for stateful applications running on Kubernetes.

The implementation features a MySQL database with persistent EBS storage, a user management microservice application, and demonstrates the use of StorageClass, PersistentVolumeClaim (PVC), and ConfigMaps to manage stateful workloads in EKS. The application is exposed through both NodePort and Ingress configurations with health checks and proper database initialization.

## Architecture

The solution consists of the following components:

- **Amazon EBS CSI Driver**: Provisions and manages EBS volumes dynamically
- **StorageClass**: Defines the EBS storage provisioner and binding mode
- **PersistentVolumeClaim (PVC)**: Requests storage from the StorageClass
- **MySQL Database**: Stateful application with persistent EBS volume
- **ConfigMap**: Database initialization scripts
- **User Management Microservice**: Spring Boot application connecting to MySQL
- **Kubernetes Services**: ClusterIP for MySQL and NodePort for the application

```
┌─────────────────────────────────────┐
│         EKS Cluster                 │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  User Management Service     │  │
│  │  (Spring Boot App)           │  │
│  │  - NodePort: 31231           │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│             ▼                       │
│  ┌──────────────────────────────┐  │
│  │  MySQL Pod                   │  │
│  │  - ClusterIP Service         │  │
│  │  - Port: 3306                │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│             ▼                       │
│  ┌──────────────────────────────┐  │
│  │  PersistentVolumeClaim       │  │
│  │  (4Gi EBS Volume)            │  │
│  └──────────┬───────────────────┘  │
│             │                       │
└─────────────┼───────────────────────┘
              ▼
   ┌──────────────────────┐
   │  Amazon EBS Volume   │
   │  (gp2/gp3)           │
   │  Availability Zone   │
   └──────────────────────┘
```

## Prerequisites

### Required Tools
- AWS CLI (v2.x or higher) configured with appropriate credentials
- kubectl (v1.21 or higher)
- eksctl (v0.100.0 or higher)
- Helm 3.x (for EBS CSI driver installation)

### AWS Resources
- An existing EKS cluster (v1.21 or higher)
- EBS CSI driver installed on the cluster
- OIDC provider configured for the EKS cluster
- IAM role for the EBS CSI driver with required permissions

### Required IAM Permissions

The EBS CSI driver requires an IAM role with the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateSnapshot",
        "ec2:AttachVolume",
        "ec2:DetachVolume",
        "ec2:ModifyVolume",
        "ec2:DescribeAvailabilityZones",
        "ec2:DescribeInstances",
        "ec2:DescribeSnapshots",
        "ec2:DescribeTags",
        "ec2:DescribeVolumes",
        "ec2:DescribeVolumesModifications"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateTags"
      ],
      "Resource": [
        "arn:aws:ec2:*:*:volume/*",
        "arn:aws:ec2:*:*:snapshot/*"
      ],
      "Condition": {
        "StringEquals": {
          "ec2:CreateAction": [
            "CreateVolume",
            "CreateSnapshot"
          ]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DeleteTags"
      ],
      "Resource": [
        "arn:aws:ec2:*:*:volume/*",
        "arn:aws:ec2:*:*:snapshot/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateVolume"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "aws:RequestTag/ebs.csi.aws.com/cluster": "true"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateVolume"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "aws:RequestTag/CSIVolumeName": "*"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DeleteVolume"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "ec2:ResourceTag/ebs.csi.aws.com/cluster": "true"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DeleteVolume"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "ec2:ResourceTag/CSIVolumeName": "*"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DeleteVolume"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "ec2:ResourceTag/kubernetes.io/created-for/pvc/name": "*"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DeleteSnapshot"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "ec2:ResourceTag/CSIVolumeSnapshotName": "*"
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DeleteSnapshot"
      ],
      "Resource": "*",
      "Condition": {
        "StringLike": {
          "ec2:ResourceTag/ebs.csi.aws.com/cluster": "true"
        }
      }
    }
  ]
}
```

## Project Structure

```
EKS-Storage-with-EBS-ElasticBlockStore/
├── README.md
└── SC-PVC-ConfigMap-MySQL/
    └── kube-manifests/
        ├── 01-storage-class.yml                      # EBS StorageClass definition
        ├── 02-persistent-volume-claim.yml            # 4Gi PVC for MySQL
        ├── 03-UserManagement-ConfigMap.yml           # Database initialization script
        ├── 04-mysql-deployment.yml                   # MySQL deployment with EBS volume
        ├── 05-mysql-clusterip-service.yml            # MySQL internal service
        ├── 06-UserManagementMicroservice-Deployment-Service.yml  # Application deployment
        └── 07-UserManagement-Service.yml             # NodePort service for app
```

## Usage

### Step 1: Install EBS CSI Driver

```bash
# Set environment variables
export CLUSTER_NAME=your-cluster-name
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create IAM OIDC provider for your cluster (if not already created)
eksctl utils associate-iam-oidc-provider \
    --cluster=$CLUSTER_NAME \
    --region=$AWS_REGION \
    --approve

# Create IAM service account for EBS CSI driver
eksctl create iamserviceaccount \
    --name ebs-csi-controller-sa \
    --namespace kube-system \
    --cluster $CLUSTER_NAME \
    --region $AWS_REGION \
    --attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy \
    --approve \
    --role-only \
    --role-name AmazonEKS_EBS_CSI_DriverRole

# Install EBS CSI driver using EKS add-on
aws eks create-addon \
    --cluster-name $CLUSTER_NAME \
    --addon-name aws-ebs-csi-driver \
    --service-account-role-arn arn:aws:iam::$AWS_ACCOUNT_ID:role/AmazonEKS_EBS_CSI_DriverRole \
    --region $AWS_REGION

# Verify installation
kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-ebs-csi-driver
```

Alternative installation using Helm:

```bash
# Add the AWS EBS CSI driver Helm repository
helm repo add aws-ebs-csi-driver https://kubernetes-sigs.github.io/aws-ebs-csi-driver
helm repo update

# Install the driver
helm upgrade --install aws-ebs-csi-driver \
    --namespace kube-system \
    aws-ebs-csi-driver/aws-ebs-csi-driver
```

### Step 2: Deploy Storage Infrastructure

```bash
# Navigate to the manifests directory
cd SC-PVC-ConfigMap-MySQL/kube-manifests/

# Create StorageClass
kubectl apply -f 01-storage-class.yml

# Create PersistentVolumeClaim
kubectl apply -f 02-persistent-volume-claim.yml

# Verify PVC (should be in Pending state until bound by a pod)
kubectl get pvc ebs-mysql-pv-claim

# Create ConfigMap with database initialization script
kubectl apply -f 03-UserManagement-ConfigMap.yml

# Verify ConfigMap
kubectl get configmap usermanagement-dbcreation-script
kubectl describe configmap usermanagement-dbcreation-script
```

### Step 3: Deploy MySQL Database

```bash
# Deploy MySQL with persistent storage
kubectl apply -f 04-mysql-deployment.yml

# Deploy MySQL ClusterIP service
kubectl apply -f 05-mysql-clusterip-service.yml

# Verify MySQL deployment
kubectl get deployment mysql
kubectl get pods -l app=mysql

# Check PVC binding (should now be Bound)
kubectl get pvc ebs-mysql-pv-claim

# View PersistentVolume (automatically created)
kubectl get pv

# Verify EBS volume created in AWS
aws ec2 describe-volumes \
    --filters "Name=tag:kubernetes.io/created-for/pvc/name,Values=ebs-mysql-pv-claim" \
    --region $AWS_REGION
```

### Step 4: Deploy User Management Application

```bash
# Deploy the user management microservice
kubectl apply -f 06-UserManagementMicroservice-Deployment-Service.yml

# Deploy NodePort service
kubectl apply -f 07-UserManagement-Service.yml

# Verify application deployment
kubectl get deployment usermgmt-microservice
kubectl get pods -l app=usermgmt-restapp
kubectl get svc usermgmt-restapp-service

# Check application logs
kubectl logs -l app=usermgmt-restapp --tail=50
```

### Step 5: Test the Application

```bash
# Get the NodePort
kubectl get svc usermgmt-restapp-service
# Note the NodePort (should be 31231)

# Get a worker node's external IP
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}')

# Test the application health endpoint
curl http://$NODE_IP:31231/usermgmt/health-status

# Create a test user
curl -X POST http://$NODE_IP:31231/usermgmt/api/users \
    -H "Content-Type: application/json" \
    -d '{
        "username": "testuser",
        "email": "test@example.com",
        "firstName": "Test",
        "lastName": "User"
    }'

# List all users
curl http://$NODE_IP:31231/usermgmt/api/users

# Get specific user
curl http://$NODE_IP:31231/usermgmt/api/users/testuser
```

### Step 6: Verify Data Persistence

```bash
# Connect to MySQL pod
kubectl exec -it <mysql-pod-name> -- mysql -u root -pdbpassword11

# Inside MySQL shell
USE usermgmt;
SHOW TABLES;
SELECT * FROM users;
EXIT;

# Test persistence by deleting and recreating the MySQL pod
kubectl delete pod -l app=mysql

# Wait for new pod to come up
kubectl get pods -l app=mysql -w

# Verify data persists after pod restart
kubectl exec -it <new-mysql-pod-name> -- mysql -u root -pdbpassword11 -e "SELECT * FROM usermgmt.users;"
```

### Step 7: Clean Up Resources

```bash
# Delete application resources
kubectl delete -f 07-UserManagement-Service.yml
kubectl delete -f 06-UserManagementMicroservice-Deployment-Service.yml

# Delete MySQL resources
kubectl delete -f 05-mysql-clusterip-service.yml
kubectl delete -f 04-mysql-deployment.yml

# Delete ConfigMap
kubectl delete -f 03-UserManagement-ConfigMap.yml

# Delete PVC (this will also delete the EBS volume)
kubectl delete -f 02-persistent-volume-claim.yml

# Delete StorageClass (optional, doesn't delete volumes)
kubectl delete -f 01-storage-class.yml

# Verify EBS volume deletion in AWS
aws ec2 describe-volumes \
    --filters "Name=tag:kubernetes.io/created-for/pvc/name,Values=ebs-mysql-pv-claim" \
    --region $AWS_REGION
```

## Configuration

### StorageClass Configuration

The StorageClass defines how EBS volumes are provisioned:

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ebs-sc
provisioner: ebs.csi.aws.com
volumeBindingMode: WaitForFirstConsumer
```

**Key Parameters:**
- `provisioner: ebs.csi.aws.com` - Uses the EBS CSI driver
- `volumeBindingMode: WaitForFirstConsumer` - Delays volume binding until a pod using the PVC is scheduled, ensuring the volume is created in the same AZ as the pod

**Optional Parameters:**

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ebs-sc-custom
provisioner: ebs.csi.aws.com
parameters:
  type: gp3              # Volume type: gp2, gp3, io1, io2, sc1, st1
  iops: "3000"           # IOPS (for io1, io2, gp3)
  throughput: "125"      # Throughput in MiB/s (for gp3)
  encrypted: "true"      # Enable encryption
  kmsKeyId: "arn:aws:kms:region:account:key/key-id"  # Custom KMS key
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Delete    # Delete or Retain
```

### PersistentVolumeClaim Configuration

The PVC requests storage from the StorageClass:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ebs-mysql-pv-claim
spec:
  accessModes:
  - ReadWriteOnce        # EBS volumes support only RWO
  storageClassName: ebs-sc
  resources:
    requests:
      storage: 4Gi
```

**Access Modes for EBS:**
- `ReadWriteOnce` (RWO) - Volume can be mounted as read-write by a single node (only mode supported by EBS)

### MySQL Deployment Configuration

The MySQL deployment uses the PVC for persistent storage:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
spec:
  replicas: 1            # Must be 1 for RWO volumes
  strategy:
    type: Recreate       # Required for stateful apps with RWO volumes
  template:
    spec:
      containers:
      - name: mysql
        image: mysql:5.6
        env:
        - name: MYSQL_ROOT_PASSWORD
          value: dbpassword11
        volumeMounts:
        - name: mysql-persistent-storage
          mountPath: /var/lib/mysql
        - name: usermanagement-dbcreation-script
          mountPath: /docker-entrypoint-initdb.d
      volumes:
      - name: mysql-persistent-storage
        persistentVolumeClaim:
          claimName: ebs-mysql-pv-claim
      - name: usermanagement-dbcreation-script
        configMap:
          name: usermanagement-dbcreation-script
```

**Important Notes:**
- Replicas must be 1 because EBS volumes are ReadWriteOnce
- Strategy must be `Recreate` to ensure old pod is terminated before new pod starts
- ConfigMap mounted to `/docker-entrypoint-initdb.d` for automatic database initialization

### Application Configuration

The user management microservice connects to MySQL:

```yaml
env:
- name: DB_HOSTNAME
  value: "mysql"         # Service name
- name: DB_PORT
  value: "3306"
- name: DB_NAME
  value: "usermgmt"
- name: DB_USERNAME
  value: "root"
- name: DB_PASSWORD
  value: "dbpassword11"
```

**Security Best Practice:** Use Kubernetes Secrets instead of plain text for passwords:

```yaml
env:
- name: DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: mysql-secret
      key: password
```

## Features

### 1. Dynamic Volume Provisioning
- Automatic EBS volume creation when PVC is created
- No manual EBS volume management required
- Volumes automatically tagged with Kubernetes metadata
- Supports volume expansion (if enabled in StorageClass)

### 2. Data Persistence
- Database data survives pod restarts and rescheduling
- Volumes remain even after pod deletion (until PVC is deleted)
- Snapshots can be created for backup and recovery
- Support for volume cloning from snapshots

### 3. Topology-Aware Scheduling
- `WaitForFirstConsumer` ensures volume and pod are in the same AZ
- Prevents cross-AZ attachment issues
- Optimizes network latency and cost
- Automatic zone placement

### 4. Storage Class Flexibility
- Multiple StorageClasses for different performance tiers
- Support for different EBS volume types (gp2, gp3, io1, io2, etc.)
- Configurable IOPS and throughput for gp3 and io volumes
- Encryption support with KMS integration

### 5. Volume Lifecycle Management
- Automatic volume attachment and detachment
- Reclaim policies (Delete or Retain)
- Volume expansion support (resize without data loss)
- Snapshot and restore capabilities

### 6. Database Initialization
- ConfigMap-based database initialization
- Automatic schema creation on first start
- Support for complex initialization scripts
- SQL scripts executed in alphabetical order

### 7. Application Health Monitoring
- Health check endpoints for application monitoring
- Database connection validation
- Readiness and liveness probes (can be added)
- Logging and debugging support

## Troubleshooting

### Issue: PVC Stuck in Pending State

**Symptoms:**
```bash
kubectl get pvc
# STATUS shows Pending
```

**Solutions:**

1. Check if EBS CSI driver is running:
```bash
kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-ebs-csi-driver
```

2. Verify StorageClass exists:
```bash
kubectl get storageclass ebs-sc
```

3. If using `WaitForFirstConsumer`, PVC will remain Pending until a pod uses it:
```bash
# Deploy a pod that uses the PVC
kubectl apply -f 04-mysql-deployment.yml

# PVC should transition to Bound
kubectl get pvc ebs-mysql-pv-claim
```

4. Check events for errors:
```bash
kubectl describe pvc ebs-mysql-pv-claim
```

### Issue: Volume Mount Fails with Permission Denied

**Symptoms:**
```bash
kubectl logs <mysql-pod>
# Shows permission errors accessing /var/lib/mysql
```

**Solutions:**

1. Add security context to MySQL deployment:
```yaml
spec:
  template:
    spec:
      securityContext:
        fsGroup: 999  # MySQL user ID
      containers:
      - name: mysql
        securityContext:
          runAsUser: 999
```

2. Verify volume is properly mounted:
```bash
kubectl describe pod <mysql-pod>
# Check Mounts and Volumes sections
```

### Issue: Pod Cannot Mount Volume (Multi-Attach Error)

**Symptoms:**
```bash
kubectl describe pod <mysql-pod>
# Warning: FailedAttachVolume ... Volume is already attached to another node
```

**Solutions:**

1. This occurs with ReadWriteOnce volumes when pod is rescheduled. EBS CSI driver should automatically detach from old node. Wait a few minutes:
```bash
kubectl get pods -l app=mysql -w
```

2. If stuck, manually force delete the old pod:
```bash
kubectl delete pod <old-pod-name> --grace-period=0 --force
```

3. Check EBS volume attachment status in AWS:
```bash
aws ec2 describe-volumes \
    --filters "Name=tag:kubernetes.io/created-for/pvc/name,Values=ebs-mysql-pv-claim" \
    --region $AWS_REGION \
    --query 'Volumes[0].Attachments'
```

### Issue: MySQL Pod CrashLoopBackOff

**Symptoms:**
```bash
kubectl get pods -l app=mysql
# Shows CrashLoopBackOff
```

**Solutions:**

1. Check MySQL logs:
```bash
kubectl logs <mysql-pod>
```

2. Verify environment variables are correct:
```bash
kubectl describe deployment mysql
```

3. Check if initialization script is valid:
```bash
kubectl get configmap usermanagement-dbcreation-script -o yaml
```

4. Verify volume is mounted correctly:
```bash
kubectl exec -it <mysql-pod> -- df -h
kubectl exec -it <mysql-pod> -- ls -la /var/lib/mysql
```

### Issue: Application Cannot Connect to MySQL

**Symptoms:**
```bash
kubectl logs <usermgmt-pod>
# Connection refused or timeout errors
```

**Solutions:**

1. Verify MySQL service exists:
```bash
kubectl get svc mysql
```

2. Test connectivity from application pod:
```bash
kubectl exec -it <usermgmt-pod> -- nc -zv mysql 3306
```

3. Check MySQL is accepting connections:
```bash
kubectl exec -it <mysql-pod> -- mysql -u root -pdbpassword11 -e "SHOW DATABASES;"
```

4. Verify environment variables in application:
```bash
kubectl exec -it <usermgmt-pod> -- env | grep DB_
```

### Issue: EBS Volume Not Deleted After PVC Deletion

**Symptoms:**
- PVC deleted but EBS volume still exists in AWS

**Solutions:**

1. Check StorageClass reclaim policy:
```bash
kubectl get storageclass ebs-sc -o yaml | grep reclaimPolicy
```

2. If policy is `Retain`, manually delete the PV and EBS volume:
```bash
# Delete PV
kubectl delete pv <pv-name>

# Delete EBS volume in AWS
aws ec2 delete-volume --volume-id <volume-id> --region $AWS_REGION
```

3. To change reclaim policy:
```bash
kubectl patch pv <pv-name> -p '{"spec":{"persistentVolumeReclaimPolicy":"Delete"}}'
```

### Issue: Volume Expansion Fails

**Symptoms:**
- PVC resize requested but volume size doesn't change

**Solutions:**

1. Verify StorageClass allows volume expansion:
```bash
kubectl get storageclass ebs-sc -o yaml | grep allowVolumeExpansion
```

2. If not set, edit StorageClass:
```bash
kubectl patch storageclass ebs-sc -p '{"allowVolumeExpansion": true}'
```

3. Resize PVC:
```bash
kubectl patch pvc ebs-mysql-pv-claim -p '{"spec":{"resources":{"requests":{"storage":"8Gi"}}}}'
```

4. Restart pod to trigger filesystem resize:
```bash
kubectl delete pod <mysql-pod>
```

5. Verify new size:
```bash
kubectl exec -it <new-mysql-pod> -- df -h /var/lib/mysql
```

## Best Practices

### 1. Storage Class Configuration
- Use `WaitForFirstConsumer` for topology-aware provisioning
- Enable `allowVolumeExpansion` for future growth
- Set appropriate reclaim policy (Delete for dev, Retain for prod)
- Use encrypted volumes for sensitive data

Example production StorageClass:
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ebs-sc-prod
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
  encrypted: "true"
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Retain
```

### 2. Volume Sizing and Performance
- Choose appropriate volume type based on workload:
  - `gp3`: General purpose, cost-effective (default)
  - `gp2`: Legacy general purpose
  - `io1/io2`: High IOPS for databases
  - `st1`: Throughput-optimized for big data
  - `sc1`: Cold storage for infrequent access

- Size volumes appropriately:
  - Start with realistic estimates
  - Monitor usage and expand as needed
  - Consider growth over 6-12 months

### 3. Security Configuration
- Always use Kubernetes Secrets for sensitive data:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysql-secret
type: Opaque
stringData:
  password: "your-secure-password"
  root-password: "your-root-password"
```

- Enable volume encryption:
```yaml
parameters:
  encrypted: "true"
  kmsKeyId: "arn:aws:kms:region:account:key/key-id"
```

- Use IAM roles for service accounts (IRSA) for EBS CSI driver
- Implement pod security policies or pod security standards
- Use network policies to restrict database access

### 4. High Availability Considerations
- EBS volumes are single-AZ resources
- For multi-AZ HA, use:
  - Database replication (master-slave)
  - StatefulSets with multiple replicas
  - Cross-AZ snapshot backups
  - Consider RDS for managed HA

Example StatefulSet for multi-AZ:
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  serviceName: mysql
  replicas: 3
  volumeClaimTemplates:
  - metadata:
      name: mysql-data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: ebs-sc
      resources:
        requests:
          storage: 10Gi
```

### 5. Backup and Disaster Recovery
- Implement regular snapshots:
```bash
# Create VolumeSnapshot CRD
kubectl apply -f - <<EOF
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: mysql-snapshot-$(date +%Y%m%d)
spec:
  volumeSnapshotClassName: csi-aws-vsc
  source:
    persistentVolumeClaimName: ebs-mysql-pv-claim
EOF
```

- Automate backups with CronJobs
- Test restore procedures regularly
- Store snapshots in different regions for DR
- Document recovery time objectives (RTO) and recovery point objectives (RPO)

### 6. Monitoring and Alerting
- Monitor EBS volume metrics:
  - Volume read/write IOPS
  - Volume throughput
  - Volume queue length
  - Burst balance (for gp2 volumes)

- Set up CloudWatch alarms:
```bash
aws cloudwatch put-metric-alarm \
    --alarm-name ebs-volume-high-iops \
    --metric-name VolumeReadOps \
    --namespace AWS/EBS \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 10000
```

- Monitor PVC and PV status in Kubernetes
- Track storage capacity usage
- Alert on mount failures or volume issues

### 7. Cost Optimization
- Right-size volumes based on actual usage
- Use gp3 instead of gp2 for cost savings (up to 20%)
- Delete unused volumes and snapshots
- Implement lifecycle policies for snapshots
- Consider volume type based on IOPS requirements
- Use Reserved Instances for predictable workloads

### 8. Performance Optimization
- Provision IOPS appropriately for your workload
- Use gp3 with custom IOPS/throughput for better performance
- Monitor and tune MySQL configuration
- Implement connection pooling in applications
- Use read replicas for read-heavy workloads

Example MySQL optimization:
```yaml
env:
- name: MYSQL_INNODB_BUFFER_POOL_SIZE
  value: "1G"
- name: MYSQL_MAX_CONNECTIONS
  value: "200"
```

### 9. Application Design Patterns
- Implement proper database connection handling
- Use init containers to wait for database availability
- Implement retry logic with exponential backoff
- Use health checks and readiness probes
- Graceful shutdown for data consistency

Example init container:
```yaml
initContainers:
- name: wait-for-mysql
  image: busybox:1.31
  command:
  - sh
  - -c
  - |
    until nc -z mysql 3306; do
      echo "Waiting for MySQL..."
      sleep 2
    done
```

### 10. Migration and Upgrades
- Test volume migrations in non-production first
- Plan for MySQL version upgrades
- Backup before major changes
- Use blue-green deployments for zero downtime
- Document rollback procedures
