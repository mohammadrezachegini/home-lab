# EKS Vertical Pod Autoscaler (VPA)

## Overview

This project demonstrates the implementation of Kubernetes Vertical Pod Autoscaler (VPA) on Amazon EKS. VPA automatically adjusts the CPU and memory requests and limits for containers based on historical usage patterns and current resource utilization. Unlike HPA which scales the number of replicas, VPA optimizes the resources allocated to each pod.

VPA consists of three main components:
- **Recommender**: Monitors resource usage and provides recommendations
- **Updater**: Evicts pods that need to be updated with new resource recommendations
- **Admission Controller**: Sets resource requests on new or recreated pods

This implementation includes VPA installation scripts, demo applications, and comprehensive examples using both Terraform and native Kubernetes manifests.

## Architecture

The architecture consists of the following components:

```
┌──────────────────────────────────────────────────────────────────┐
│                         AWS EKS Cluster                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              VPA Components (kube-system)              │    │
│  │                                                        │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │    │
│  │  │ VPA          │  │ VPA          │  │ VPA         │ │    │
│  │  │ Recommender  │  │ Updater      │  │ Admission   │ │    │
│  │  │              │  │              │  │ Controller  │ │    │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │    │
│  │         │                  │                 │        │    │
│  └─────────┼──────────────────┼─────────────────┼────────┘    │
│            │                  │                 │             │
│            │ Analyzes         │ Evicts Pods     │ Injects     │
│            │ Metrics          │ for Updates     │ Resources   │
│            ▼                  ▼                 ▼             │
│  ┌──────────────────────────────────────────────────────┐    │
│  │         VPA Resource (my-app-vpa)                    │    │
│  │  Target: vpa-demo-deployment                         │    │
│  │  Update Mode: Auto                                   │    │
│  │  Min: cpu=5m, memory=5Mi                             │    │
│  │  Max: cpu=20m, memory=20Mi                           │    │
│  └─────────────────────┬────────────────────────────────┘    │
│                        │                                     │
│                        ▼ Monitors & Updates                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │        vpa-demo-deployment (4 replicas)             │    │
│  │                                                     │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌────┐ │    │
│  │  │  Pod 1    │ │  Pod 2    │ │  Pod 3    │ │... │ │    │
│  │  │  Initial: │ │  Updated: │ │  Updated: │ │    │ │    │
│  │  │  5m/5Mi   │ │  8m/12Mi  │ │  8m/12Mi  │ │    │ │    │
│  │  └───────────┘ └───────────┘ └───────────┘ └────┘ │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                        ▲                                     │
│                        │                                     │
│  ┌─────────────────────┴─────────────────────────────┐      │
│  │         Metrics Server (kube-system)              │      │
│  │         Collects Pod Resource Metrics             │      │
│  └───────────────────────────────────────────────────┘      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Key Components:

1. **VPA Recommender**: Analyzes current and past resource consumption and provides recommended values for containers' CPU and memory requests
2. **VPA Updater**: Checks which pods have correct resources set and evicts those that need to be updated
3. **VPA Admission Controller**: Sets the correct resource requests on new pods (during creation or after eviction)
4. **VPA Resource**: Custom resource that defines the target deployment and resource policies
5. **Metrics Server**: Provides resource usage metrics to VPA components

## Prerequisites

Before deploying this project, ensure you have:

- **AWS Account** with appropriate permissions to create EKS resources
- **AWS CLI** configured with valid credentials
- **kubectl** (v1.21 or higher)
- **Terraform** (v1.0 or higher)
- **Existing EKS Cluster** - deployed via the ekscluster-terraform-manifests
- **Metrics Server** installed and running on the cluster
- **OpenSSL** (version 1.1.1 or higher) - required for VPA installation certificates
- **Git** - for cloning the VPA installation repository
- **IAM Permissions** to create and manage EKS resources
- **Network Access** to clone GitHub repositories (for VPA installation)

### Important Prerequisites Notes:

1. **OpenSSL Version**: VPA installation requires OpenSSL 1.1.1+ for generating certificates
   ```bash
   openssl version
   # Should show: OpenSSL 1.1.1 or higher
   ```

2. **kubectl Configuration**: Ensure kubectl is configured to access your EKS cluster
   ```bash
   kubectl get nodes
   ```

3. **Metrics Server**: VPA requires Metrics Server to be installed first
   ```bash
   kubectl get deployment metrics-server -n kube-system
   ```

## Project Structure

```
EKS-Vertical-Pod-Autoscaler-Install/
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
├── vpa-install-terraform-manifests/    # VPA installation using Terraform
│   ├── c1-versions.tf                  # Terraform versions
│   └── c2-vpa-install.tf               # VPA installation via null_resource
│
├── vpa-demo-terraform-manifests/       # VPA demo using Terraform
│   ├── c1-versions.tf                  # Terraform versions
│   ├── c2-remote-state-datasource.tf   # Remote state from EKS cluster
│   ├── c3-01-generic-variables.tf      # Variables
│   ├── c3-02-local-values.tf           # Local values
│   ├── c4-01-terraform-providers.tf    # Kubernetes and kubectl providers
│   ├── c4-02-vpa-sample-app-deployment.tf  # Sample application deployment
│   ├── c4-03-vpa-sample-app-service.tf # ClusterIP service
│   ├── c4-04-vpa-resource.tf           # VPA resource definition
│   └── terraform.tfvars                # Variable values
│
├── vpa-demo-yaml/                      # VPA demo using YAML manifests
│   ├── 01-vpa-demo-app.yaml            # Application deployment and service
│   └── 02-vpa-resource.yaml            # VPA configuration
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

VPA requires Metrics Server to be installed:

```bash
cd ../k8s-metrics-server-terraform-manifests

# Initialize Terraform
terraform init

# Apply the configuration
terraform apply -auto-approve

# Verify Metrics Server installation
kubectl get deployment metrics-server -n kube-system

# Wait for Metrics Server to be ready
kubectl wait --for=condition=available --timeout=300s deployment/metrics-server -n kube-system

# Test metrics collection
kubectl top nodes
```

### Step 3: Verify Prerequisites

Before installing VPA, verify all prerequisites:

```bash
# Check OpenSSL version (must be 1.1.1+)
openssl version

# Check kubectl access
kubectl get nodes

# Check Metrics Server
kubectl top nodes

# Check if VPA is already installed
kubectl get pods -n kube-system | grep vpa
```

### Step 4: Install VPA

#### Option A: Using Terraform (Automated)

```bash
cd ../vpa-install-terraform-manifests

# Initialize Terraform
terraform init

# Review the installation plan
terraform plan

# Install VPA
terraform apply -auto-approve

# The terraform script will:
# 1. Clone the kubernetes/autoscaler repository
# 2. Run the vpa-up.sh script to install VPA components
# 3. Clean up the cloned repository
```

#### Option B: Manual Installation

```bash
# Clone the autoscaler repository
git clone https://github.com/kubernetes/autoscaler.git

# Navigate to VPA directory
cd autoscaler/vertical-pod-autoscaler

# Install VPA
./hack/vpa-up.sh

# The script installs:
# - VPA CRDs (Custom Resource Definitions)
# - VPA Admission Controller
# - VPA Recommender
# - VPA Updater

# Verify installation
kubectl get pods -n kube-system | grep vpa
```

### Step 5: Verify VPA Installation

```bash
# Check VPA components are running
kubectl get pods -n kube-system | grep vpa

# Expected output:
# vpa-admission-controller-xxxxxxxxx-xxxxx   1/1     Running   0          2m
# vpa-recommender-xxxxxxxxx-xxxxx            1/1     Running   0          2m
# vpa-updater-xxxxxxxxx-xxxxx                1/1     Running   0          2m

# Check VPA CRDs
kubectl get crd | grep verticalpodautoscaler

# Expected output:
# verticalpodautoscalercheckpoints.autoscaling.k8s.io
# verticalpodautoscalers.autoscaling.k8s.io

# Verify VPA API
kubectl api-resources | grep verticalpodautoscaler
```

### Step 6: Deploy VPA Demo Application

#### Option A: Using Terraform

```bash
cd ../vpa-demo-terraform-manifests

# Initialize Terraform
terraform init

# Review the configuration
terraform plan

# Deploy the application and VPA
terraform apply -auto-approve

# Verify deployment
kubectl get deployment vpa-demo-deployment
kubectl get service vpa-demo-service-nginx
kubectl get vpa my-app-vpa
```

#### Option B: Using YAML Manifests

```bash
cd ../vpa-demo-yaml

# Deploy the application and service
kubectl apply -f 01-vpa-demo-app.yaml

# Deploy the VPA resource
kubectl apply -f 02-vpa-resource.yaml

# Verify deployment
kubectl get deployment vpa-demo-deployment
kubectl get service vpa-demo-service-nginx
kubectl get vpa my-app-vpa
```

### Step 7: Monitor VPA Recommendations

```bash
# View VPA status
kubectl get vpa my-app-vpa

# Detailed VPA description with recommendations
kubectl describe vpa my-app-vpa

# Example output:
# Name:         my-app-vpa
# Namespace:    default
# API Version:  autoscaling.k8s.io/v1
# Kind:         VerticalPodAutoscaler
# Spec:
#   Target Ref:
#     API Version:  apps/v1
#     Kind:         Deployment
#     Name:         vpa-demo-deployment
#   Update Policy:
#     Update Mode:  Auto
# Status:
#   Conditions:
#     Status:  True
#     Type:    RecommendationProvided
#   Recommendation:
#     Container Recommendations:
#       Container Name:  vpa-nginx
#       Lower Bound:
#         Cpu:     5m
#         Memory:  6Mi
#       Target:
#         Cpu:     8m
#         Memory:  12Mi
#       Uncapped Target:
#         Cpu:     8m
#         Memory:  12Mi
#       Upper Bound:
#         Cpu:     20m
#         Memory:  20Mi

# Watch VPA recommendations in real-time
kubectl get vpa my-app-vpa --watch

# Check pod resource requests
kubectl get pods -o custom-columns=NAME:.metadata.name,CPU_REQUEST:.spec.containers[0].resources.requests.cpu,MEMORY_REQUEST:.spec.containers[0].resources.requests.memory
```

### Step 8: Observe VPA in Action

VPA will automatically update pod resources. Monitor the process:

```bash
# Watch pods being updated
kubectl get pods -w

# In "Auto" mode, VPA will:
# 1. Generate recommendations (takes a few minutes)
# 2. Evict pods that need resource updates
# 3. Kubernetes recreates the pods
# 4. Admission Controller injects new resource values
# 5. New pods start with updated resources

# Compare initial vs updated resources
kubectl describe deployment vpa-demo-deployment | grep -A 10 "Requests:"

# Check VPA events
kubectl get events --sort-by=.metadata.creationTimestamp | grep vpa
```

### Step 9: Test Different VPA Update Modes

Edit the VPA to try different update modes:

```bash
# Edit VPA resource
kubectl edit vpa my-app-vpa

# Change updateMode to one of:
# - "Off": Only provides recommendations, doesn't update pods
# - "Initial": Sets resources only on pod creation
# - "Recreate": Updates resources by recreating pods (older mode)
# - "Auto": Automatically updates resources (default)

# Example: Set to "Off" for recommendation-only mode
spec:
  updatePolicy:
    updateMode: "Off"

# Then check recommendations without pod recreation
kubectl describe vpa my-app-vpa
```

## Configuration

### VPA Resource Configuration (YAML)

#### Basic VPA Configuration

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: my-app-vpa
spec:
  targetRef:
    apiVersion: "apps/v1"
    kind: Deployment
    name: vpa-demo-deployment
  updatePolicy:
    updateMode: "Auto"  # Auto, Initial, Recreate, or Off
```

#### VPA with Resource Policies

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: my-app-vpa
spec:
  targetRef:
    apiVersion: "apps/v1"
    kind: Deployment
    name: vpa-demo-deployment
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: "vpa-nginx"
      minAllowed:          # Minimum resources VPA can set
        cpu: "5m"
        memory: "5Mi"
      maxAllowed:          # Maximum resources VPA can set
        cpu: "20m"
        memory: "20Mi"
      controlledResources: ["cpu", "memory"]  # Which resources to control
      controlledValues: RequestsAndLimits     # RequestsOnly or RequestsAndLimits
```

### VPA Configuration (Terraform)

```hcl
resource "kubectl_manifest" "vpa_resource" {
  yaml_body = <<YAML
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: my-app-vpa
spec:
  targetRef:
    apiVersion: "apps/v1"
    kind: Deployment
    name: vpa-demo-deployment
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: "vpa-nginx"
      minAllowed:
        cpu: "5m"
        memory: "5Mi"
      maxAllowed:
        cpu: "20m"
        memory: "20Mi"
YAML
}
```

### Sample Application Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vpa-demo-deployment
  labels:
    app: vpa-nginx
spec:
  replicas: 4
  selector:
    matchLabels:
      app: vpa-nginx
  template:
    metadata:
      labels:
        app: vpa-nginx
    spec:
      containers:
      - name: vpa-nginx
        image: stacksimplify/kubenginx:1.0.0
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: "5m"      # Initial request - VPA will adjust
            memory: "5Mi"  # Initial request - VPA will adjust
```

### VPA Update Modes Explained

1. **Off**: VPA only provides recommendations, doesn't make changes
   ```yaml
   updatePolicy:
     updateMode: "Off"
   ```
   Use case: Want to see recommendations before enabling automatic updates

2. **Initial**: VPA sets resources only when pods are created
   ```yaml
   updatePolicy:
     updateMode: "Initial"
   ```
   Use case: Want VPA to set initial resources but not update running pods

3. **Recreate**: VPA updates resources by evicting and recreating pods (legacy mode)
   ```yaml
   updatePolicy:
     updateMode: "Recreate"
   ```
   Use case: Older VPA mode, use "Auto" instead

4. **Auto**: VPA automatically updates resources (recommended for production)
   ```yaml
   updatePolicy:
     updateMode: "Auto"
   ```
   Use case: Production workloads where you want automatic resource optimization

### VPA Installation Script (Terraform)

```hcl
# Resource-1: Clone GitHub Repository
resource "null_resource" "git_clone" {
  provisioner "local-exec" {
    command = "git clone https://github.com/kubernetes/autoscaler.git"
  }
}

# Resource-2: Install Vertical Pod Autoscaler
resource "null_resource" "install_vpa" {
  depends_on = [null_resource.git_clone]
  provisioner "local-exec" {
    command = "${path.module}/autoscaler/vertical-pod-autoscaler/hack/vpa-up.sh"
  }
}

# Resource-3: Remove autoscaler folder on destroy
resource "null_resource" "remove_git_clone_autoscaler_folder" {
  provisioner "local-exec" {
    command = "rm -rf ${path.module}/autoscaler"
    when = destroy
  }
}

# Resource-4: Uninstall VPA on destroy
resource "null_resource" "uninstall_vpa" {
  depends_on = [null_resource.remove_git_clone_autoscaler_folder]
  provisioner "local-exec" {
    command = "${path.module}/autoscaler/vertical-pod-autoscaler/hack/vpa-down.sh"
    when = destroy
  }
}
```

## Features

### Current Implementation

- **Automatic Resource Optimization**: Automatically adjusts CPU and memory requests based on actual usage
- **Three Update Modes**: Off, Initial, Recreate, and Auto modes for different use cases
- **Resource Policies**: Set minimum and maximum resource boundaries
- **Multi-Container Support**: Can manage multiple containers in a pod
- **Recommendation Engine**: Provides recommendations even in "Off" mode
- **Terraform Automation**: Complete infrastructure as code using Terraform
- **YAML Manifests**: Alternative deployment using native Kubernetes YAML
- **EKS Integration**: Optimized for Amazon EKS clusters

### VPA Components

1. **VPA Recommender**
   - Monitors resource usage over time
   - Analyzes historical metrics
   - Calculates optimal resource requests
   - Provides lower bound, target, and upper bound recommendations

2. **VPA Updater**
   - Watches for pods with outdated resource requirements
   - Evicts pods that need updates (in Auto mode)
   - Respects PodDisruptionBudgets
   - Handles rolling updates gracefully

3. **VPA Admission Controller**
   - Intercepts pod creation requests
   - Injects recommended resource values
   - Applies resource policies
   - Ensures pods start with optimal resources

### Recommendation Types

- **Lower Bound**: Minimum recommended resources (guaranteed to work)
- **Target**: Ideal resource allocation (recommended)
- **Uncapped Target**: Target without considering resource policies
- **Upper Bound**: Maximum reasonable resources (usually too much)

## Troubleshooting

### Common Issues and Solutions

#### 1. VPA Components Not Starting

**Symptoms:**
```bash
kubectl get pods -n kube-system | grep vpa
# Shows no pods or pods in Error/CrashLoopBackOff state
```

**Solutions:**

Check if VPA CRDs exist:
```bash
kubectl get crd | grep verticalpodautoscaler
```

If CRDs are missing, reinstall VPA:
```bash
cd autoscaler/vertical-pod-autoscaler
./hack/vpa-down.sh
./hack/vpa-up.sh
```

Check OpenSSL version:
```bash
openssl version
# Must be 1.1.1 or higher
```

Check VPA component logs:
```bash
kubectl logs -n kube-system -l app=vpa-recommender
kubectl logs -n kube-system -l app=vpa-updater
kubectl logs -n kube-system -l app=vpa-admission-controller
```

#### 2. No Recommendations Provided

**Symptoms:**
```bash
kubectl describe vpa my-app-vpa
# Shows no recommendations or empty recommendation section
```

**Solutions:**

Wait for VPA to collect data (takes 3-5 minutes):
```bash
# VPA needs time to analyze metrics
sleep 300
kubectl describe vpa my-app-vpa
```

Check if Metrics Server is running:
```bash
kubectl get deployment metrics-server -n kube-system
kubectl top pods
```

Verify pods have resource requests defined:
```bash
kubectl get deployment vpa-demo-deployment -o yaml | grep -A 5 resources
```

Check VPA Recommender logs:
```bash
kubectl logs -n kube-system -l app=vpa-recommender --tail=50
```

#### 3. VPA Not Updating Pod Resources

**Symptoms:**
- VPA shows recommendations
- Update mode is "Auto"
- Pods are not being evicted/updated

**Solutions:**

Check VPA update mode:
```bash
kubectl get vpa my-app-vpa -o yaml | grep updateMode
# Should show: updateMode: Auto
```

Check VPA status:
```bash
kubectl describe vpa my-app-vpa
```

Look for VPA Updater logs:
```bash
kubectl logs -n kube-system -l app=vpa-updater --tail=50
```

Check for PodDisruptionBudgets that might prevent evictions:
```bash
kubectl get pdb --all-namespaces
```

Verify VPA Admission Controller is working:
```bash
kubectl logs -n kube-system -l app=vpa-admission-controller --tail=50
```

#### 4. Pods Stuck in Pending After VPA Update

**Symptoms:**
- VPA evicts pods
- New pods stay in Pending state
- Resources not available

**Solutions:**

Check pod events:
```bash
kubectl describe pod <pod-name>
```

Verify node resources:
```bash
kubectl describe nodes
kubectl top nodes
```

Check if VPA recommendations exceed node capacity:
```bash
kubectl describe vpa my-app-vpa
kubectl describe nodes | grep -A 5 "Allocated resources"
```

Adjust VPA maxAllowed values:
```yaml
resourcePolicy:
  containerPolicies:
  - containerName: "vpa-nginx"
    maxAllowed:
      cpu: "100m"     # Reduce if too high
      memory: "128Mi"  # Reduce if too high
```

#### 5. VPA Conflicting with HPA

**Symptoms:**
- Both VPA and HPA are configured for the same deployment
- Unexpected scaling behavior
- Resources constantly changing

**Solutions:**

Don't use VPA in Auto mode with HPA on the same deployment:
```bash
# Check for HPA
kubectl get hpa

# If using both, configure VPA for memory only
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
spec:
  resourcePolicy:
    containerPolicies:
    - containerName: "*"
      controlledResources: ["memory"]  # VPA handles memory
      # Let HPA handle CPU-based horizontal scaling
```

Best practice: Use VPA for memory, HPA for CPU-based replica scaling

#### 6. VPA Recommendations Too High/Low

**Symptoms:**
- VPA recommends resources that don't match workload needs
- Over-provisioning or under-provisioning

**Solutions:**

Set appropriate resource policies:
```yaml
resourcePolicy:
  containerPolicies:
  - containerName: "vpa-nginx"
    minAllowed:
      cpu: "10m"
      memory: "10Mi"
    maxAllowed:
      cpu: "500m"
      memory: "512Mi"
    controlledResources: ["cpu", "memory"]
```

Use "Off" mode to review recommendations first:
```yaml
updatePolicy:
  updateMode: "Off"
```

Wait longer for VPA to learn patterns (1-2 days for production workloads)

#### 7. Certificate Errors During Installation

**Symptoms:**
```
Error: unable to generate certificate
OpenSSL version incompatible
```

**Solutions:**

Update OpenSSL:
```bash
# macOS
brew install openssl@1.1

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install openssl

# Verify version
openssl version
```

Ensure OpenSSL is in PATH:
```bash
which openssl
export PATH="/usr/local/opt/openssl@1.1/bin:$PATH"
```

### Debug Commands

```bash
# Check all VPA resources
kubectl get vpa --all-namespaces

# Detailed VPA status
kubectl describe vpa my-app-vpa

# Check VPA components
kubectl get pods -n kube-system | grep vpa

# View VPA Recommender logs
kubectl logs -n kube-system -l app=vpa-recommender --tail=100

# View VPA Updater logs
kubectl logs -n kube-system -l app=vpa-updater --tail=100

# View VPA Admission Controller logs
kubectl logs -n kube-system -l app=vpa-admission-controller --tail=100

# Check VPA CRDs
kubectl get crd | grep verticalpodautoscaler

# Check VPA API resources
kubectl api-resources | grep verticalpodautoscaler

# View VPA events
kubectl get events --sort-by=.metadata.creationTimestamp | grep vpa

# Check pod resources
kubectl get pods -o custom-columns=NAME:.metadata.name,CPU_REQ:.spec.containers[0].resources.requests.cpu,MEM_REQ:.spec.containers[0].resources.requests.memory

# Compare original vs updated resources
kubectl get deployment vpa-demo-deployment -o yaml | grep -A 10 resources

# Test VPA webhook
kubectl get validatingwebhookconfigurations | grep vpa
kubectl get mutatingwebhookconfigurations | grep vpa
```

## Best Practices

### 1. Start with "Off" Mode

Begin with update mode "Off" to review recommendations:

```yaml
updatePolicy:
  updateMode: "Off"
```

Monitor recommendations for a few days, then enable "Auto" mode when comfortable.

### 2. Set Resource Policies

Always define min and max boundaries:

```yaml
resourcePolicy:
  containerPolicies:
  - containerName: "myapp"
    minAllowed:
      cpu: "10m"
      memory: "10Mi"
    maxAllowed:
      cpu: "1000m"
      memory: "1Gi"
```

This prevents VPA from setting unrealistic values.

### 3. Don't Use VPA with HPA on CPU

If using both VPA and HPA:
- VPA: Manage memory resources
- HPA: Scale replicas based on CPU

```yaml
# VPA configuration
resourcePolicy:
  containerPolicies:
  - containerName: "*"
    controlledResources: ["memory"]  # Only memory

# HPA configuration
metrics:
- type: Resource
  resource:
    name: cpu  # Only CPU
    target:
      type: Utilization
      averageUtilization: 70
```

### 4. Use PodDisruptionBudgets

Protect critical workloads from excessive evictions:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: myapp-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: myapp
```

### 5. Monitor VPA Recommendations

Regularly review VPA recommendations:

```bash
# Create a monitoring script
kubectl get vpa --all-namespaces -o custom-columns=\
NAME:.metadata.name,\
NAMESPACE:.metadata.namespace,\
TARGET_CPU:.status.recommendation.containerRecommendations[0].target.cpu,\
TARGET_MEM:.status.recommendation.containerRecommendations[0].target.memory
```

### 6. Use Initial Mode for Batch Jobs

For CronJobs and batch workloads, use "Initial" mode:

```yaml
updatePolicy:
  updateMode: "Initial"
```

This sets resources on job creation without disrupting running pods.

### 7. Consider Application Startup Time

For applications with long startup times, be cautious with VPA updates:

```yaml
# Longer grace period
spec:
  template:
    spec:
      terminationGracePeriodSeconds: 60
```

Or use "Initial" mode instead of "Auto".

### 8. Test VPA in Non-Production First

Always test VPA behavior in development/staging:

```bash
# Deploy to staging first
kubectl apply -f vpa-resource.yaml --namespace=staging

# Monitor for a week
kubectl describe vpa my-app-vpa -n staging

# Check for issues
kubectl get events -n staging | grep vpa
```

### 9. Configure Proper Resource Requests Initially

Start with reasonable initial requests:

```yaml
resources:
  requests:
    cpu: "100m"     # Start reasonable, not too low
    memory: "128Mi" # Start reasonable, not too low
```

VPA will optimize from there.

### 10. Use ControlledValues Wisely

Control whether VPA updates requests, limits, or both:

```yaml
resourcePolicy:
  containerPolicies:
  - containerName: "*"
    controlledValues: RequestsAndLimits  # Options: RequestsOnly, RequestsAndLimits
```

For most cases, `RequestsOnly` is safer.

### 11. Monitor for Resource Waste

VPA might over-provision. Monitor and adjust:

```bash
# Check actual usage vs requests
kubectl top pods
kubectl describe pod <pod-name> | grep -A 5 "Requests"

# Look for significant gaps
```

### 12. Document VPA Configuration

Keep documentation of VPA decisions:

```yaml
metadata:
  annotations:
    description: "VPA configured for memory optimization"
    last-reviewed: "2025-01-15"
    min-max-rationale: "Based on 30-day production metrics"
```
