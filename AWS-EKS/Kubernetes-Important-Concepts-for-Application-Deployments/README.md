# Kubernetes Important Concepts for Application Deployments

## Overview

This project provides comprehensive hands-on examples of essential Kubernetes concepts critical for production application deployments on Amazon EKS. It covers fundamental building blocks including Init Containers, Namespaces with Resource Quotas and Limit Ranges, Resource Requests and Limits, and Secrets management.

These concepts are fundamental for building robust, secure, and efficient Kubernetes applications. Understanding and properly implementing these patterns ensures application reliability, resource efficiency, security, and operational excellence in production environments.

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                     EKS Cluster Architecture                        │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    Namespace: default                        │ │
│  │  (No resource constraints - development/testing)             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              Namespace: dev1 (with LimitRange)               │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │  LimitRange: default-cpu-mem-limit-range               │ │ │
│  │  │  - Default CPU: 500m                                   │ │ │
│  │  │  - Default Memory: 512Mi                               │ │ │
│  │  │  - Default Request CPU: 300m                           │ │ │
│  │  │  - Default Request Memory: 256Mi                       │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  │                                                              │ │
│  │  ┌─────────────────────────────────────────────┐           │ │
│  │  │  Pod: usermgmt-microservice                 │           │ │
│  │  │  ┌───────────────────────────────────────┐  │           │ │
│  │  │  │  Init Container: init-db              │  │           │ │
│  │  │  │  - Waits for MySQL availability       │  │           │ │
│  │  │  │  - Health check: nc -z mysql 3306     │  │           │ │
│  │  │  └──────────────┬────────────────────────┘  │           │ │
│  │  │                 │                            │           │ │
│  │  │                 ▼ (completes)                │           │ │
│  │  │  ┌───────────────────────────────────────┐  │           │ │
│  │  │  │  Main Container: usermgmt-restapp     │  │           │ │
│  │  │  │  - Resources: 128m CPU, 100Mi memory  │  │           │ │
│  │  │  │  - Limits: 500m CPU, 1000m memory     │  │           │ │
│  │  │  │  - Env from ConfigMap & Secrets       │  │           │ │
│  │  │  │  - Liveness & Readiness Probes        │  │           │ │
│  │  │  └───────────────────────────────────────┘  │           │ │
│  │  └─────────────────────────────────────────────┘           │ │
│  │                                                              │ │
│  │  ┌─────────────────────────────────────────────┐           │ │
│  │  │  Pod: mysql                                 │           │ │
│  │  │  - Storage: EBS via StorageClass            │           │ │
│  │  │  - Secrets: mysql-db-password               │           │ │
│  │  │  - ConfigMap: usermgmt-dbcreation-script    │           │ │
│  │  └─────────────────────────────────────────────┘           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │           Namespace: dev2 (with ResourceQuota)               │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │  ResourceQuota: ns-resource-quota                      │ │ │
│  │  │  - Max Requests: CPU: 2, Memory: 2Gi                   │ │ │
│  │  │  - Max Limits: CPU: 4, Memory: 4Gi                     │ │ │
│  │  │  - Max Pods: 10                                        │ │ │
│  │  │  - Max ConfigMaps: 10, Secrets: 10                     │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  │                                                              │ │
│  │  [Pods limited by namespace quota]                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              Storage Layer (AWS EBS)                         │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │ │
│  │  │  gp2 SSD   │  │  gp3 SSD   │  │  io1 SSD   │            │ │
│  │  │  (default) │  │  (faster)  │  │  (IOPS)    │            │ │
│  │  └────────────┘  └────────────┘  └────────────┘            │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              Secrets Management                              │ │
│  │  ┌────────────────────────────────────────────────────────┐ │ │
│  │  │  Kubernetes Secrets (Base64 encoded)                   │ │ │
│  │  │  - mysql-db-password                                   │ │ │
│  │  │  - Application credentials                             │ │ │
│  │  │  ↓ Mounted as environment variables or volumes         │ │ │
│  │  └────────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Init Containers**: Pre-initialization tasks (DB health checks, migrations)
2. **Namespaces**: Logical cluster partitioning for multi-tenancy
3. **LimitRange**: Default resource limits for pods in a namespace
4. **ResourceQuota**: Aggregate resource consumption limits per namespace
5. **Resource Requests/Limits**: Container-level resource allocation
6. **Secrets**: Secure storage and injection of sensitive data
7. **ConfigMaps**: Configuration data management
8. **Probes**: Liveness and readiness health checks

## Prerequisites

### AWS and Kubernetes Requirements
- **EKS Cluster** running (version 1.21 or later)
- **kubectl** configured with cluster access
- **AWS CLI** version 2.x installed and configured
- **EBS CSI Driver** installed on EKS cluster

### Installing EBS CSI Driver

```bash
# Create IAM OIDC provider
eksctl utils associate-iam-oidc-provider \
  --region us-east-1 \
  --cluster eksdemo1 \
  --approve

# Create IAM service account for EBS CSI driver
eksctl create iamserviceaccount \
  --name ebs-csi-controller-sa \
  --namespace kube-system \
  --cluster eksdemo1 \
  --attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy \
  --approve \
  --role-only \
  --role-name AmazonEKS_EBS_CSI_DriverRole

# Install EBS CSI driver as EKS add-on
aws eks create-addon \
  --cluster-name eksdemo1 \
  --addon-name aws-ebs-csi-driver \
  --service-account-role-arn arn:aws:iam::<AWS_ACCOUNT_ID>:role/AmazonEKS_EBS_CSI_DriverRole

# Verify installation
kubectl get pods -n kube-system -l app=ebs-csi-controller
```

### Required Knowledge
- Basic Kubernetes concepts (Pods, Deployments, Services)
- Understanding of container resource management
- Familiarity with YAML syntax
- Basic Linux command-line skills

## Project Structure

```
Kubernetes-Important-Concepts-for-Application-Deployments/
├── README.md
├── Kubernetes-Init-Containers/
│   └── Kube-manifests/
│       ├── 01-storage-class.yml
│       ├── 02-persistent-volume-claim.yml
│       ├── 03-UserManagement-ConfigMap.yml
│       ├── 04-mysql-deployment.yml
│       ├── 05-mysql-clusterip-service.yml
│       ├── 06-UserManagementMicroservice-Deployment-Service.yml
│       ├── 07-UserManagement-Service.yml
│       └── 08-Kubernetes-Secrets.yml
├── Kubernetes-Namespaces/
│   ├── Namespaces-LimitRange-default/
│   │   └── Kube-manifests/
│   │       ├── 00-namespace-LimitRange-default.yml
│   │       └── [application manifests 01-08]
│   └── Namespaces-ResourceQuota/
│       └── Kube-manifests/
│           ├── 00-namespace-ResourceQuota.yml
│           └── [application manifests 01-08]
├── Kubernetes-Requests-Limits/
│   └── Kube-manifests/
│       ├── 01-storage-class.yml
│       ├── 02-persistent-volume-claim.yml
│       ├── 03-UserManagement-ConfigMap.yml
│       ├── 04-mysql-deployment.yml
│       ├── 05-mysql-clusterip-service.yml
│       ├── 06-UserManagementMicroservice-Deployment-Service.yml
│       ├── 07-UserManagement-Service.yml
│       └── 08-Kubernetes-Secrets.yml
└── Kubernetes-Secrets/
    └── kube-manifests/
        ├── 01-storage-class.yml
        ├── 02-persistent-volume-claim.yml
        ├── 03-UserManagement-ConfigMap.yml
        ├── 04-mysql-deployment.yml
        ├── 05-mysql-clusterip-service.yml
        ├── 06-UserManagementMicroservice-Deployment-Service.yml
        ├── 07-UserManagement-Service.yml
        └── 08-Kubernetes-Secrets.yml
```

### Module Descriptions

#### Kubernetes-Init-Containers
Demonstrates using init containers to perform pre-startup tasks like database availability checks before starting the main application container.

#### Kubernetes-Namespaces
Shows namespace isolation with two approaches:
- **LimitRange**: Sets default resource requests/limits for containers
- **ResourceQuota**: Sets aggregate resource limits for entire namespace

#### Kubernetes-Requests-Limits
Demonstrates proper resource request and limit configuration for containers to ensure quality of service and prevent resource exhaustion.

#### Kubernetes-Secrets
Shows secure management of sensitive data like database passwords using Kubernetes Secrets.

## Usage

### Module 1: Init Containers

Init containers run to completion before the main application container starts.

```bash
# Navigate to init containers directory
cd /Users/reza/home-lab/AWS-EKS/Kubernetes-Important-Concepts-for-Application-Deployments/Kubernetes-Init-Containers/Kube-manifests

# Deploy all resources
kubectl apply -f .

# Watch init container execution
kubectl get pods -w

# Check init container logs
kubectl logs <pod-name> -c init-db

# Verify main container started after init completion
kubectl describe pod <pod-name>
```

**Key Init Container Configuration:**
```yaml
initContainers:
- name: init-db
  image: busybox:1.31
  command:
  - 'sh'
  - '-c'
  - 'echo -e "Checking for the availability of MySQL Server deployment";
     while ! nc -z mysql 3306; do sleep 1; printf "-"; done;
     echo -e "  >> MySQL DB Server has started";'
```

**Use Cases for Init Containers:**
- Wait for dependent services to be ready
- Database schema migrations
- Download configuration files
- Clone Git repositories
- Register with external systems
- Warm up caches

### Module 2: Namespaces with LimitRange

LimitRange sets default resource requests and limits for containers in a namespace.

```bash
# Navigate to LimitRange directory
cd /Users/reza/home-lab/AWS-EKS/Kubernetes-Important-Concepts-for-Application-Deployments/Kubernetes-Namespaces/Namespaces-LimitRange-default/Kube-manifests

# Create namespace with LimitRange
kubectl apply -f 00-namespace-LimitRange-default.yml

# Verify LimitRange
kubectl describe limitrange default-cpu-mem-limit-range -n dev3

# Deploy application
kubectl apply -f .

# Check that defaults were applied
kubectl describe pod <pod-name> -n dev3 | grep -A 10 "Limits\|Requests"

# Clean up
kubectl delete namespace dev3
```

**LimitRange Configuration Example:**
```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-cpu-mem-limit-range
  namespace: dev3
spec:
  limits:
  - default:
      cpu: "500m"
      memory: "512Mi"
    defaultRequest:
      cpu: "300m"
      memory: "256Mi"
    type: Container
```

**Benefits:**
- Prevents resource hogging
- Sets sensible defaults for teams
- Ensures QoS for pods
- Simplifies pod specifications

### Module 3: Namespaces with ResourceQuota

ResourceQuota limits aggregate resource consumption in a namespace.

```bash
# Navigate to ResourceQuota directory
cd /Users/reza/home-lab/AWS-EKS/Kubernetes-Important-Concepts-for-Application-Deployments/Kubernetes-Namespaces/Namespaces-ResourceQuota/Kube-manifests

# Create namespace with ResourceQuota
kubectl apply -f 00-namespace-ResourceQuota.yml

# View quota details
kubectl describe resourcequota ns-resource-quota -n dev2

# Deploy applications
kubectl apply -f .

# Monitor quota usage
kubectl get resourcequota -n dev2

# View detailed usage
kubectl describe resourcequota ns-resource-quota -n dev2

# Try to exceed quota (will fail)
kubectl scale deployment usermgmt-microservice --replicas=20 -n dev2

# Clean up
kubectl delete namespace dev2
```

**ResourceQuota Configuration Example:**
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ns-resource-quota
  namespace: dev2
spec:
  hard:
    requests.cpu: "2"
    requests.memory: 2Gi
    limits.cpu: "4"
    limits.memory: 4Gi
    pods: "10"
    configmaps: "10"
    secrets: "10"
    services: "5"
```

**Common Quota Types:**
- **Compute**: `requests.cpu`, `requests.memory`, `limits.cpu`, `limits.memory`
- **Storage**: `requests.storage`, `persistentvolumeclaims`
- **Object Count**: `pods`, `services`, `configmaps`, `secrets`
- **Extended Resources**: `requests.nvidia.com/gpu`

### Module 4: Resource Requests and Limits

Properly configure resource requests and limits for predictable application performance.

```bash
# Navigate to requests/limits directory
cd /Users/reza/home-lab/AWS-EKS/Kubernetes-Important-Concepts-for-Application-Deployments/Kubernetes-Requests-Limits/Kube-manifests

# Deploy all resources
kubectl apply -f .

# Check resource allocation
kubectl describe nodes | grep -A 5 "Allocated resources"

# Monitor resource usage
kubectl top pods

# Check QoS class assigned to pods
kubectl get pods -o custom-columns=NAME:.metadata.name,QOS:.status.qosClass

# Describe pod to see requests/limits
kubectl describe pod <pod-name> | grep -A 10 "Limits\|Requests"

# Clean up
kubectl delete -f .
```

**Resource Configuration Example:**
```yaml
resources:
  requests:
    cpu: "128Mi"      # Minimum guaranteed
    memory: "100Mm"
  limits:
    cpu: "500Mi"      # Maximum allowed
    memory: "1000m"
```

**QoS Classes:**

1. **Guaranteed**: requests == limits (highest priority)
```yaml
resources:
  requests:
    cpu: "500m"
    memory: "512Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```

2. **Burstable**: requests < limits (medium priority)
```yaml
resources:
  requests:
    cpu: "250m"
    memory: "256Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```

3. **BestEffort**: no requests or limits (lowest priority)
```yaml
# No resources specified
```

### Module 5: Kubernetes Secrets

Securely manage sensitive information like passwords, tokens, and keys.

```bash
# Navigate to secrets directory
cd /Users/reza/home-lab/AWS-EKS/Kubernetes-Important-Concepts-for-Application-Deployments/Kubernetes-Secrets/kube-manifests

# Deploy all resources (includes secret)
kubectl apply -f .

# View secrets (values are hidden)
kubectl get secrets

# Describe secret
kubectl describe secret mysql-db-password

# View secret in base64 (decode to see actual value)
kubectl get secret mysql-db-password -o jsonpath='{.data.db-password}' | base64 --decode

# Check secret mounted in pod
kubectl exec -it <usermgmt-pod-name> -- env | grep DB_PASSWORD

# Clean up
kubectl delete -f .
```

**Creating Secrets:**

**Method 1: From Literal**
```bash
kubectl create secret generic mysql-db-password \
  --from-literal=db-password=dbpassword11
```

**Method 2: From File**
```bash
echo -n 'dbpassword11' > password.txt
kubectl create secret generic mysql-db-password \
  --from-file=db-password=password.txt
```

**Method 3: From YAML**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysql-db-password
type: Opaque
data:
  # echo -n 'dbpassword11' | base64
  db-password: ZGJwYXNzd29yZDEx
```

**Using Secrets in Pods:**

**As Environment Variables:**
```yaml
env:
- name: DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: mysql-db-password
      key: db-password
```

**As Volume Mounts:**
```yaml
volumes:
- name: secret-volume
  secret:
    secretName: mysql-db-password
volumeMounts:
- name: secret-volume
  mountPath: /etc/secrets
  readOnly: true
```

### Complete Application Deployment

Deploy the full user management microservice with all concepts:

```bash
# Choose a module directory (e.g., Init Containers)
cd /Users/reza/home-lab/AWS-EKS/Kubernetes-Important-Concepts-for-Application-Deployments/Kubernetes-Init-Containers/Kube-manifests

# Deploy in order
kubectl apply -f 01-storage-class.yml
kubectl apply -f 02-persistent-volume-claim.yml
kubectl apply -f 03-UserManagement-ConfigMap.yml
kubectl apply -f 04-mysql-deployment.yml
kubectl apply -f 05-mysql-clusterip-service.yml
kubectl apply -f 08-Kubernetes-Secrets.yml
kubectl apply -f 06-UserManagementMicroservice-Deployment-Service.yml
kubectl apply -f 07-UserManagement-Service.yml

# Verify all resources
kubectl get all
kubectl get pvc
kubectl get configmap
kubectl get secrets

# Check application health
kubectl get pods
kubectl logs <usermgmt-pod-name>

# Test the application
kubectl port-forward service/usermgmt-restapp-service 8095:8095

# In another terminal
curl http://localhost:8095/usermgmt/health-status
```

## Configuration

### Storage Class Configuration

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ebs-sc
provisioner: ebs.csi.aws.com
volumeBindingMode: WaitForFirstConsumer
parameters:
  type: gp3               # gp2, gp3, io1, io2
  encrypted: "true"
  iops: "3000"           # For gp3/io1/io2
  throughput: "125"      # For gp3 (MB/s)
```

### PersistentVolumeClaim Configuration

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ebs-mysql-pv-claim
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: ebs-sc
  resources:
    requests:
      storage: 4Gi
```

### ConfigMap for Application Configuration

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: usermgmt-dbcreation-script
data:
  mysql_usermgmt.sql: |
    CREATE DATABASE IF NOT EXISTS usermgmt;
    USE usermgmt;
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      email VARCHAR(100) NOT NULL
    );
```

### Health Probes Configuration

**Liveness Probe** (restart container if fails):
```yaml
livenessProbe:
  exec:
    command:
    - /bin/bash
    - -c
    - nc -z localhost 8095
  initialDelaySeconds: 60
  periodSeconds: 10
  failureThreshold: 3
```

**Readiness Probe** (remove from service if fails):
```yaml
readinessProbe:
  httpGet:
    path: /usermgmt/health-status
    port: 8095
  initialDelaySeconds: 60
  periodSeconds: 10
  failureThreshold: 3
```

## Features

### 1. Init Container Patterns

**Database Migration Init Container:**
```yaml
initContainers:
- name: db-migration
  image: flyway/flyway
  command: ['flyway', 'migrate']
  env:
  - name: FLYWAY_URL
    value: "jdbc:mysql://mysql:3306/mydb"
```

**Configuration Download:**
```yaml
initContainers:
- name: config-downloader
  image: curlimages/curl
  command:
  - 'sh'
  - '-c'
  - 'curl -o /config/app.conf https://config.example.com/app.conf'
  volumeMounts:
  - name: config
    mountPath: /config
```

### 2. Namespace Resource Management

**Multi-Tenant Namespace Strategy:**
```yaml
# Production namespace
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    environment: production
---
# Development namespace with quotas
apiVersion: v1
kind: Namespace
metadata:
  name: development
  labels:
    environment: development
```

### 3. Resource Optimization

**CPU and Memory Tuning Guidelines:**

| Workload Type | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---------------|-------------|-----------|----------------|--------------|
| Web Frontend | 100m-250m | 500m-1000m | 128Mi-256Mi | 512Mi-1Gi |
| API Service | 250m-500m | 1000m-2000m | 256Mi-512Mi | 1Gi-2Gi |
| Database | 500m-1000m | 2000m-4000m | 512Mi-1Gi | 2Gi-4Gi |
| Background Job | 100m-250m | 500m-1000m | 128Mi-512Mi | 1Gi-2Gi |

### 4. Secret Management Best Practices

**External Secrets Operator (for AWS Secrets Manager):**
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: mysql-db-password
  data:
  - secretKey: db-password
    remoteRef:
      key: prod/mysql/password
```

### 5. Advanced Health Checks

**Startup Probe** (for slow-starting containers):
```yaml
startupProbe:
  httpGet:
    path: /health
    port: 8080
  failureThreshold: 30
  periodSeconds: 10
```

## Troubleshooting

### Init Container Failures

```bash
# Check init container status
kubectl get pods

# View init container logs
kubectl logs <pod-name> -c init-db

# Describe pod for detailed events
kubectl describe pod <pod-name>

# Common issues:
# 1. Service not available (check service exists)
kubectl get svc mysql

# 2. Network policy blocking (check network policies)
kubectl get networkpolicies

# 3. DNS resolution (test from busybox pod)
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup mysql
```

### Resource Quota Exceeded

```bash
# Check current quota usage
kubectl describe resourcequota -n <namespace>

# View resource usage by pods
kubectl top pods -n <namespace>

# List all pods with resources
kubectl get pods -n <namespace> -o custom-columns=\
NAME:.metadata.name,\
CPU-REQ:.spec.containers[*].resources.requests.cpu,\
MEM-REQ:.spec.containers[*].resources.requests.memory

# Increase quota if needed
kubectl edit resourcequota <quota-name> -n <namespace>
```

### Pod OOMKilled (Out of Memory)

```bash
# Check pod status
kubectl get pods

# Describe pod to see reason
kubectl describe pod <pod-name>

# Check logs before crash
kubectl logs <pod-name> --previous

# View actual memory usage
kubectl top pod <pod-name>

# Solutions:
# 1. Increase memory limits
# 2. Fix memory leaks in application
# 3. Adjust JVM heap size (for Java apps)
```

### Secret Not Found

```bash
# List secrets
kubectl get secrets

# Check secret exists in correct namespace
kubectl get secrets -n <namespace>

# Verify secret data
kubectl describe secret <secret-name>

# Check pod events for mount errors
kubectl describe pod <pod-name>

# Recreate secret if corrupted
kubectl delete secret <secret-name>
kubectl create secret generic <secret-name> --from-literal=key=value
```

### Storage Issues

```bash
# Check PVC status
kubectl get pvc

# Describe PVC for errors
kubectl describe pvc <pvc-name>

# Check storage class
kubectl get storageclass

# Verify EBS CSI driver is running
kubectl get pods -n kube-system -l app=ebs-csi-controller

# Check EBS volume in AWS
aws ec2 describe-volumes --filters "Name=tag:kubernetes.io/cluster/<cluster-name>,Values=owned"
```

### CPU Throttling

```bash
# Check if container is being throttled
kubectl top pods

# View detailed metrics (if metrics-server installed)
kubectl get --raw /apis/metrics.k8s.io/v1beta1/namespaces/<namespace>/pods/<pod-name>

# Check for throttling in cgroup (exec into container)
kubectl exec <pod-name> -- cat /sys/fs/cgroup/cpu/cpu.stat

# Solutions:
# 1. Increase CPU limits
# 2. Optimize application code
# 3. Use HPA for scaling
```

## Best Practices

### 1. Resource Management

**Always Set Requests and Limits:**
```yaml
# ✅ Good
resources:
  requests:
    cpu: "250m"
    memory: "256Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"

# ❌ Bad - No resource specifications
# (leads to BestEffort QoS and unpredictable behavior)
```

**Right-Size Your Resources:**
```bash
# Monitor actual usage
kubectl top pods --containers

# Use Vertical Pod Autoscaler for recommendations
kubectl describe vpa <vpa-name>
```

### 2. Namespace Organization

**Namespace Hierarchy:**
```
├── production          (strict quotas, monitoring)
├── staging            (moderate quotas)
├── development        (relaxed quotas)
├── monitoring         (observability tools)
└── kube-system        (cluster components)
```

**Namespace Labels:**
```yaml
metadata:
  name: production
  labels:
    environment: production
    team: platform
    cost-center: "12345"
```

### 3. Secret Management

**DO:**
- Use external secret managers (AWS Secrets Manager, HashiCorp Vault)
- Enable encryption at rest for etcd
- Implement RBAC for secret access
- Rotate secrets regularly
- Use namespace isolation

**DON'T:**
- Commit secrets to Git
- Use secrets in ConfigMaps
- Share secrets across namespaces
- Use plain text environment variables for sensitive data

**External Secrets Pattern:**
```bash
# Install External Secrets Operator
helm install external-secrets \
  external-secrets/external-secrets \
  -n external-secrets-system \
  --create-namespace
```

### 4. Init Container Patterns

**Use Cases:**
- ✅ Wait for dependent services
- ✅ Database migrations
- ✅ Configuration fetching
- ✅ Pre-warming caches
- ❌ Long-running processes (use sidecar instead)
- ❌ Application logic (belongs in main container)

### 5. Health Check Strategy

**Configure All Three Probes:**
```yaml
startupProbe:        # For slow-starting applications
  httpGet:
    path: /startup
    port: 8080
  failureThreshold: 30
  periodSeconds: 10

livenessProbe:       # Detect and restart deadlocked containers
  httpGet:
    path: /health
    port: 8080
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:      # Control traffic routing
  httpGet:
    path: /ready
    port: 8080
  periodSeconds: 5
  failureThreshold: 3
```

### 6. Storage Best Practices

**Use Appropriate Storage Classes:**
```yaml
# For databases - high IOPS
storageClassName: io2-sc

# For general workloads - balanced
storageClassName: gp3-sc

# For throughput-intensive - optimized
storageClassName: st1-sc
```

**PVC Best Practices:**
- Use dynamic provisioning
- Enable encryption
- Set appropriate storage sizes
- Implement backup strategies
- Use volume snapshots for backups

### 7. ConfigMap Usage

**DO:**
```yaml
# Store non-sensitive configuration
data:
  app.properties: |
    server.port=8080
    logging.level=INFO
```

**DON'T:**
```yaml
# ❌ Never store secrets
data:
  password: "secret123"  # Use Secret instead!
```
