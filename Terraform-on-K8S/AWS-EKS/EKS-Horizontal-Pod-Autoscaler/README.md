# EKS Horizontal Pod Autoscaler (HPA)

## Overview

This project demonstrates the implementation of Kubernetes Horizontal Pod Autoscaler (HPA) on Amazon EKS. HPA automatically scales the number of pod replicas in a deployment based on observed CPU utilization or custom metrics. This implementation includes the complete setup of the Kubernetes Metrics Server and HPA configuration using both Terraform and native Kubernetes manifests.

HPA works by periodically querying the Metrics Server for resource utilization and automatically adjusting the number of replicas to match the target utilization specified in the HPA configuration.

## Architecture

The architecture consists of the following components:

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS EKS Cluster                     │
│                                                             │
│  ┌──────────────────┐      ┌─────────────────────────┐    │
│  │  Metrics Server  │◄─────│  HPA Controller         │    │
│  │  (kube-system)   │      │  (watches metrics)      │    │
│  └────────▲─────────┘      └───────┬─────────────────┘    │
│           │                        │                       │
│           │ Scrapes Metrics        │ Scales Deployment     │
│           │                        ▼                       │
│  ┌────────┴─────────┐      ┌─────────────────────────┐    │
│  │  Application     │      │  app3-nginx-deployment  │    │
│  │  Pods (1-10)     │◄─────│  Replicas: 1-10         │    │
│  │  CPU: 200m req   │      │  Target: 50% CPU        │    │
│  │       500m limit │      └─────────────────────────┘    │
│  └──────────────────┘                                     │
│           ▲                                                │
│           │                                                │
│  ┌────────┴─────────┐                                     │
│  │  ClusterIP Svc   │                                     │
│  │  Port 80         │                                     │
│  └──────────────────┘                                     │
└─────────────────────────────────────────────────────────────┘
```

### Key Components:

1. **Metrics Server**: Collects resource metrics from Kubelets and provides them through the Kubernetes Metrics API
2. **HPA Controller**: Monitors pod metrics and adjusts replica count based on target utilization
3. **Application Deployment**: Sample nginx application with defined resource requests and limits
4. **ClusterIP Service**: Internal service exposing the application pods

## Prerequisites

Before deploying this project, ensure you have:

- **AWS Account** with appropriate permissions to create EKS resources
- **AWS CLI** configured with valid credentials
- **kubectl** (v1.21 or higher)
- **Terraform** (v1.0 or higher)
- **Helm** (v3.0 or higher) - for Metrics Server installation
- **Existing EKS Cluster** - deployed via the ekscluster-terraform-manifests
- **IAM Permissions** to create and manage EKS resources
- **VPC and Networking** configured for EKS
- **EC2 Bastion Host** (optional, for cluster access)

## Project Structure

```
EKS-Horizontal-Pod-Autoscaler/
├── ekscluster-terraform-manifests/     # EKS cluster infrastructure
│   ├── c1-versions.tf                  # Terraform and provider versions
│   ├── c2-01-generic-variables.tf      # Generic input variables
│   ├── c2-02-local-values.tf           # Local values and naming
│   ├── c3-01-vpc-variables.tf          # VPC configuration variables
│   ├── c3-02-vpc.tf                    # VPC module configuration
│   ├── c3-03-vpc-outputs.tf            # VPC outputs
│   ├── c4-*-ec2bastion-*.tf            # Bastion host configuration
│   ├── c5-*-eks-*.tf                   # EKS cluster configuration
│   ├── c6-02-iam-oidc-connect-provider.tf  # OIDC provider for IRSA
│   ├── c7-02-kubernetes-configmap.tf   # ConfigMap for aws-auth
│   ├── c8-02-iam-basic-user.tf         # IAM basic user
│   ├── c9-*-iam-*-eksadmins.tf         # EKS admin IAM resources
│   └── c11-*-iam-*-eksdeveloper.tf     # EKS developer IAM resources
│
├── k8s-metrics-server-terraform-manifests/  # Metrics Server deployment
│   ├── c1-versions.tf                  # Terraform versions
│   ├── c2-remote-state-datasource.tf   # Remote state from EKS cluster
│   ├── c3-01-generic-variables.tf      # Variables
│   ├── c3-02-local-values.tf           # Local values
│   ├── c4-01-helm-provider.tf          # Helm provider configuration
│   ├── c4-02-metrics-server-install.tf # Metrics Server Helm release
│   ├── c4-03-metrics-server-outputs.tf # Outputs
│   └── terraform.tfvars                # Variable values
│
├── hpa-demo-terraform-manifests/       # HPA demo using Terraform
│   ├── c1-versions.tf                  # Terraform versions
│   ├── c2-remote-state-datasource.tf   # Remote state from EKS cluster
│   ├── c3-providers.tf                 # Kubernetes provider
│   ├── c4-kubernetes-app3-deployment.tf # Application deployment
│   ├── c5-kubernetes-app3-clusterip-service.tf # ClusterIP service
│   └── c6-hpa-resource.tf              # HPA resource definition
│
├── hpa-demo-yaml/                      # HPA demo using YAML manifests
│   ├── 01-deployment.yaml              # Application deployment
│   ├── 02-service.yaml                 # ClusterIP service
│   └── 03-hpa.yaml                     # HPA configuration
│
└── README.md                           # This file
```

## Usage

### Step 1: Deploy EKS Cluster

First, deploy the EKS cluster infrastructure:

```bash
cd ekscluster-terraform-manifests

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the configuration
terraform apply -auto-approve

# Configure kubectl
aws eks update-kubeconfig --region <region> --name <cluster-name>

# Verify cluster access
kubectl get nodes
```

### Step 2: Install Metrics Server

The Metrics Server is required for HPA to function. Deploy it using Terraform:

```bash
cd ../k8s-metrics-server-terraform-manifests

# Initialize Terraform
terraform init

# Apply the configuration
terraform apply -auto-approve

# Verify Metrics Server installation
kubectl get deployment metrics-server -n kube-system
kubectl get apiservice v1beta1.metrics.k8s.io

# Wait for Metrics Server to be ready (may take 1-2 minutes)
kubectl wait --for=condition=available --timeout=300s deployment/metrics-server -n kube-system

# Test metrics collection
kubectl top nodes
kubectl top pods -A
```

### Step 3: Deploy HPA Demo Application

#### Option A: Using Terraform

```bash
cd ../hpa-demo-terraform-manifests

# Initialize Terraform
terraform init

# Review the configuration
terraform plan

# Deploy the application and HPA
terraform apply -auto-approve

# Verify deployment
kubectl get deployment app3-nginx-deployment
kubectl get service app3-nginx-cip-service
kubectl get hpa hpa-app3
```

#### Option B: Using YAML Manifests

```bash
cd ../hpa-demo-yaml

# Deploy the application
kubectl apply -f 01-deployment.yaml

# Deploy the service
kubectl apply -f 02-service.yaml

# Deploy the HPA
kubectl apply -f 03-hpa.yaml

# Verify deployment
kubectl get deployment app3-nginx-deployment
kubectl get service app3-nginx-cip-service
kubectl get hpa hpa-app3
```

### Step 4: Monitor HPA Status

```bash
# Watch HPA status
kubectl get hpa hpa-app3 --watch

# Detailed HPA description
kubectl describe hpa hpa-app3

# Check current replicas
kubectl get deployment app3-nginx-deployment

# Monitor pod metrics
kubectl top pods -l app=app3-nginx-deployment
```

### Step 5: Test Autoscaling

Generate load to trigger autoscaling:

```bash
# Get the service endpoint
kubectl get service app3-nginx-cip-service

# Create a load generator pod
kubectl run load-generator --image=busybox --restart=Never -- /bin/sh -c "while sleep 0.01; do wget -q -O- http://app3-nginx-cip-service; done"

# In another terminal, watch the HPA scale up
kubectl get hpa hpa-app3 --watch

# You should see output like:
# NAME       REFERENCE                          TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
# hpa-app3   Deployment/app3-nginx-deployment   0%/50%    1         10        1          2m
# hpa-app3   Deployment/app3-nginx-deployment   98%/50%   1         10        1          3m
# hpa-app3   Deployment/app3-nginx-deployment   98%/50%   1         10        2          3m30s
# hpa-app3   Deployment/app3-nginx-deployment   85%/50%   1         10        4          4m
```

Stop the load test:

```bash
# Delete the load generator
kubectl delete pod load-generator

# Watch as HPA scales down (this takes 5 minutes by default)
kubectl get hpa hpa-app3 --watch
```

## Configuration

### HPA Configuration (YAML)

```yaml
apiVersion: autoscaling/v1
kind: HorizontalPodAutoscaler
metadata:
  name: hpa-app3
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app3-nginx-deployment
  minReplicas: 1          # Minimum number of replicas
  maxReplicas: 10         # Maximum number of replicas
  targetCPUUtilizationPercentage: 50  # Target CPU utilization
```

### HPA Configuration (Terraform)

```hcl
resource "kubernetes_horizontal_pod_autoscaler_v1" "hpa_myapp3" {
  metadata {
    name = "hpa-app3"
  }
  spec {
    max_replicas = 10
    min_replicas = 1
    scale_target_ref {
      api_version = "apps/v1"
      kind = "Deployment"
      name = kubernetes_deployment_v1.myapp3.metadata[0].name
    }
    target_cpu_utilization_percentage = 50
  }
}
```

### Application Deployment with Resource Limits

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app3-nginx-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: app3-nginx-deployment
  template:
    metadata:
      labels:
        app: app3-nginx-deployment
    spec:
      containers:
      - name: app3-nginx-deployment
        image: k8s.gcr.io/hpa-example
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: 200m        # CPU request (required for HPA)
          limits:
            cpu: 500m        # CPU limit
```

### Metrics Server Helm Configuration

```hcl
resource "helm_release" "metrics_server_release" {
  name       = "${local.name}-metrics-server"
  repository = "https://kubernetes-sigs.github.io/metrics-server/"
  chart      = "metrics-server"
  namespace  = "kube-system"
}
```

### Advanced HPA Configuration (v2)

For more advanced scenarios using HPA v2 with multiple metrics:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: hpa-app3-advanced
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app3-nginx-deployment
  minReplicas: 1
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 70
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5 minutes before scaling down
      policies:
      - type: Percent
        value: 50
        periodSeconds: 15
      - type: Pods
        value: 2
        periodSeconds: 15
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
```

## Features

### Current Implementation

- **Automatic Horizontal Scaling**: Automatically scales pod replicas based on CPU utilization
- **Configurable Thresholds**: Set minimum (1) and maximum (10) replica counts
- **CPU-Based Scaling**: Scales when average CPU utilization exceeds 50%
- **Metrics Server Integration**: Full integration with Kubernetes Metrics Server
- **Terraform Automation**: Complete infrastructure as code using Terraform
- **YAML Manifests**: Alternative deployment using native Kubernetes YAML
- **EKS Integration**: Optimized for Amazon EKS clusters

### Scaling Algorithm

HPA uses the following algorithm to calculate the desired number of replicas:

```
desiredReplicas = ceil[currentReplicas * (currentMetricValue / targetMetricValue)]
```

For example:
- Current replicas: 2
- Current CPU utilization: 100%
- Target CPU utilization: 50%
- Desired replicas: ceil[2 * (100 / 50)] = ceil[4] = 4

### Scaling Behavior

- **Scale Up**: Happens immediately when CPU exceeds target
- **Scale Down**: Has a 5-minute cooldown period by default to prevent flapping
- **Metrics Collection**: HPA queries metrics every 15 seconds (default)
- **Scaling Decision**: HPA makes scaling decisions every 15 seconds

## Troubleshooting

### Common Issues and Solutions

#### 1. HPA Shows "unknown" for Metrics

**Symptoms:**
```bash
kubectl get hpa
# NAME       REFERENCE                          TARGETS         MINPODS   MAXPODS   REPLICAS
# hpa-app3   Deployment/app3-nginx-deployment   <unknown>/50%   1         10        0
```

**Solutions:**

Check if Metrics Server is running:
```bash
kubectl get deployment metrics-server -n kube-system
kubectl get pods -n kube-system -l k8s-app=metrics-server
```

Verify Metrics API is available:
```bash
kubectl get apiservice v1beta1.metrics.k8s.io
kubectl top nodes
```

Check pod resource requests are defined:
```bash
kubectl get deployment app3-nginx-deployment -o yaml | grep -A 5 resources
```

#### 2. Metrics Server Not Starting

**Symptoms:**
```bash
kubectl get pods -n kube-system -l k8s-app=metrics-server
# Shows CrashLoopBackOff or Error state
```

**Solutions:**

Check Metrics Server logs:
```bash
kubectl logs -n kube-system -l k8s-app=metrics-server
```

For EKS, ensure the Metrics Server has proper flags:
```bash
kubectl edit deployment metrics-server -n kube-system

# Add these args if missing:
# - --kubelet-preferred-address-types=InternalIP
# - --kubelet-insecure-tls
```

#### 3. HPA Not Scaling

**Symptoms:**
- HPA shows correct metrics but doesn't scale
- CPU is above threshold but replicas don't increase

**Solutions:**

Check HPA events:
```bash
kubectl describe hpa hpa-app3
```

Verify deployment can scale:
```bash
kubectl scale deployment app3-nginx-deployment --replicas=3
kubectl get deployment app3-nginx-deployment
```

Check for resource quotas:
```bash
kubectl describe resourcequota
kubectl describe limitrange
```

#### 4. Pods Not Receiving Traffic

**Symptoms:**
- HPA scales up pods
- New pods are running but load test doesn't utilize them

**Solutions:**

Check service endpoints:
```bash
kubectl get endpoints app3-nginx-cip-service
kubectl describe service app3-nginx-cip-service
```

Verify pod labels match service selector:
```bash
kubectl get pods --show-labels
kubectl get service app3-nginx-cip-service -o yaml | grep selector -A 2
```

#### 5. Slow Scale Down

**Symptoms:**
- Pods take too long to scale down after load decreases

**Solutions:**

This is expected behavior. Default scale-down stabilization is 5 minutes. To adjust:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: hpa-app3
spec:
  # ... other config ...
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 60  # Reduce from 300 to 60 seconds
```

#### 6. Missing Resource Requests

**Symptoms:**
```
Error: missing request for cpu
```

**Solution:**

Ensure all containers have CPU requests defined:
```yaml
resources:
  requests:
    cpu: 200m  # Required for CPU-based HPA
  limits:
    cpu: 500m
```

### Debug Commands

```bash
# Check all HPA resources
kubectl get hpa --all-namespaces

# Detailed HPA status
kubectl describe hpa hpa-app3

# Check HPA events
kubectl get events --sort-by=.metadata.creationTimestamp | grep HorizontalPodAutoscaler

# View Metrics Server logs
kubectl logs -n kube-system -l k8s-app=metrics-server --tail=50

# Test metrics collection
kubectl top nodes
kubectl top pods

# Check API server connectivity
kubectl get --raw /apis/metrics.k8s.io/v1beta1/nodes
kubectl get --raw /apis/metrics.k8s.io/v1beta1/pods

# Monitor scaling in real-time
kubectl get hpa,deployment -w
```

## Best Practices

### 1. Resource Requests and Limits

Always define resource requests for containers that will be autoscaled:

```yaml
resources:
  requests:
    cpu: 200m      # Required for HPA
    memory: 128Mi  # Recommended
  limits:
    cpu: 500m
    memory: 256Mi
```

### 2. Appropriate Target Utilization

- **CPU Target**: Set between 50-80% for most workloads
- **Too Low (<50%)**: Results in over-provisioning and wasted resources
- **Too High (>80%)**: May cause performance issues during traffic spikes

```yaml
targetCPUUtilizationPercentage: 70  # Good balance
```

### 3. Min/Max Replicas

Set appropriate boundaries:

```yaml
minReplicas: 2   # At least 2 for high availability
maxReplicas: 50  # Reasonable upper bound based on your workload
```

### 4. Use HPA v2 for Production

For production workloads, use HPA v2 with multiple metrics:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 5. Configure Scaling Behavior

Control how quickly your application scales:

```yaml
behavior:
  scaleUp:
    stabilizationWindowSeconds: 0      # Scale up immediately
    policies:
    - type: Pods
      value: 4
      periodSeconds: 60                # Add max 4 pods per minute
  scaleDown:
    stabilizationWindowSeconds: 300    # Wait 5 minutes before scaling down
    policies:
    - type: Percent
      value: 50
      periodSeconds: 60                # Remove max 50% of pods per minute
```

### 6. Monitor and Alert

Set up monitoring for HPA metrics:

```bash
# Prometheus metrics to monitor
kube_horizontalpodautoscaler_status_desired_replicas
kube_horizontalpodautoscaler_status_current_replicas
kube_horizontalpodautoscaler_spec_max_replicas
kube_horizontalpodautoscaler_spec_min_replicas
```

### 7. Test Autoscaling Regularly

Regularly test your HPA configuration:

```bash
# Load testing script
kubectl run load-generator \
  --image=busybox \
  --restart=Never \
  -- /bin/sh -c "while true; do wget -q -O- http://app3-nginx-cip-service; done"

# Watch the scaling
kubectl get hpa --watch
```

### 8. Combine with Cluster Autoscaler

For complete autoscaling, use HPA with Cluster Autoscaler:

- **HPA**: Scales pods within nodes
- **Cluster Autoscaler**: Scales nodes when pods can't be scheduled

### 9. Avoid Conflicting Controllers

Don't use HPA with:
- Manual scaling: `kubectl scale`
- Other autoscalers on the same deployment
- VPA in "Auto" mode (can conflict with HPA)

### 10. Use Readiness Probes

Ensure pods have readiness probes so HPA only counts ready pods:

```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 80
  initialDelaySeconds: 5
  periodSeconds: 5
```
