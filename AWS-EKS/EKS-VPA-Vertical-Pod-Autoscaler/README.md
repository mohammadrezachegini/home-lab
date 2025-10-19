# EKS Vertical Pod Autoscaler (VPA)

## Overview

This project demonstrates the implementation of Kubernetes Vertical Pod Autoscaler (VPA) on Amazon EKS. VPA automatically adjusts the CPU and memory requests and limits for containers based on historical resource usage patterns and current demands.

Unlike Horizontal Pod Autoscaler (HPA) which scales the number of pods, VPA scales the resources allocated to each pod. It monitors resource utilization over time, learns from historical patterns, and provides recommendations or automatically applies resource adjustments to optimize pod performance and cluster efficiency.

## Architecture

### How VPA Works

```
┌─────────────────────────────────────────────────────────────┐
│                   VPA Architecture                          │
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │   VPA        │      │   VPA        │                   │
│  │   Recommender│─────>│   Updater    │                   │
│  │              │      │              │                   │
│  │ (Analyzes    │      │ (Evicts pods │                   │
│  │  metrics)    │      │  if needed)  │                   │
│  └──────┬───────┘      └──────────────┘                   │
│         │                                                   │
│         │ Writes recommendations                            │
│         ▼                                                   │
│  ┌──────────────┐                                          │
│  │   VPA        │      ┌──────────────┐                   │
│  │   Admission  │<─────│  API Server  │                   │
│  │   Controller │      │              │                   │
│  │              │      │              │                   │
│  │ (Mutates pod │      │ (Pod create/ │                   │
│  │  requests)   │      │  update)     │                   │
│  └──────────────┘      └──────────────┘                   │
│         │                      ▲                            │
│         │                      │                            │
│         │   Applies resources  │                            │
│         └──────────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
           ┌─────────────────────────┐
           │   Pod with Optimized    │
           │   Resource Requests     │
           └─────────────────────────┘
```

### VPA Components

1. **VPA Recommender**: Monitors resource usage and provides recommendations
2. **VPA Updater**: Evicts pods that need to be updated with new resources
3. **VPA Admission Controller**: Mutates pod specs at creation time
4. **Metrics Server**: Provides current resource usage data

### Update Modes

VPA supports four update modes:

| Mode | Behavior | Use Case |
|------|----------|----------|
| **Off** | Only provides recommendations, no updates | Testing and observation |
| **Initial** | Applies recommendations only at pod creation | Avoid disrupting running pods |
| **Recreate** | Evicts and recreates pods with new resources | Production use (default) |
| **Auto** | Currently same as Recreate | Future enhancements |

## Prerequisites

### Required Tools
- AWS CLI (v2.x or later)
- kubectl (v1.24 or later)
- helm (v3.x or later)
- An existing EKS cluster with worker nodes

### Cluster Requirements
- EKS cluster version 1.24 or later
- Metrics Server installed and running
- Sufficient RBAC permissions to install VPA

### Install Metrics Server

VPA requires Metrics Server for current resource usage:

```bash
# Deploy Metrics Server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# For EKS, patch with required flags
kubectl patch deployment metrics-server -n kube-system --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'

# Verify Metrics Server
kubectl get deployment metrics-server -n kube-system
kubectl top nodes
```

## Project Structure

```
EKS-VPA-Vertical-Pod-Autoscaler/
├── README.md
└── kube-manifests/
    ├── 01-VPA-DemoApplication.yml    # Demo nginx deployment
    └── 02-VPA-Manifest.yml           # VPA configuration
```

### File Descriptions

- **01-VPA-DemoApplication.yml**: Sample nginx deployment with minimal resource requests to demonstrate VPA recommendations
- **02-VPA-Manifest.yml**: VPA manifest with resource policies and constraints

## Usage

### Step 1: Install VPA

#### Option A: Using the official installer script

```bash
# Clone the VPA repository
git clone https://github.com/kubernetes/autoscaler.git
cd autoscaler/vertical-pod-autoscaler

# Install VPA components
./hack/vpa-up.sh

# Verify VPA installation
kubectl get pods -n kube-system | grep vpa
# Expected output:
# vpa-admission-controller-xxxx   1/1     Running   0          1m
# vpa-recommender-xxxx            1/1     Running   0          1m
# vpa-updater-xxxx                1/1     Running   0          1m
```

#### Option B: Using Helm

```bash
# Add the FairwindsOps Helm repository
helm repo add fairwinds-stable https://charts.fairwinds.com/stable
helm repo update

# Install VPA
helm install vpa fairwinds-stable/vpa \
  --namespace kube-system \
  --set recommender.enabled=true \
  --set updater.enabled=true \
  --set admissionController.enabled=true

# Verify installation
kubectl get pods -n kube-system -l app.kubernetes.io/name=vpa
```

### Step 2: Verify VPA Installation

```bash
# Check VPA CRD is installed
kubectl get crd | grep verticalpodautoscaler

# Expected output:
# verticalpodautoscalercheckpoints.autoscaling.k8s.io
# verticalpodautoscalers.autoscaling.k8s.io

# Check VPA components
kubectl get deploy -n kube-system | grep vpa

# Check VPA API version
kubectl api-versions | grep autoscaling
```

### Step 3: Deploy Demo Application

```bash
# Deploy the demo nginx application with minimal resources
kubectl apply -f kube-manifests/01-VPA-DemoApplication.yml

# Verify deployment
kubectl get deployments vpa-demo-deployment
kubectl get pods -l app=vpa-nginx
kubectl get svc vpa-demo-service-nginx

# Check initial resource allocation
kubectl describe pods -l app=vpa-nginx | grep -A 5 "Requests:"
```

### Step 4: Create VPA Resource

```bash
# Apply the VPA configuration
kubectl apply -f kube-manifests/02-VPA-Manifest.yml

# Verify VPA is created
kubectl get vpa

# Expected output:
# NAME           MODE   CPU   MEM       PROVIDED   AGE
# kubengix-vpa   Auto   5m    5Mi       True       10s
```

### Step 5: View VPA Recommendations

```bash
# Get VPA status and recommendations
kubectl describe vpa kubengix-vpa

# Expected output includes:
# Recommendation:
#   Container Recommendations:
#     Container Name:  vpa-nginx
#     Lower Bound:
#       Cpu:     25m
#       Memory:  262144k
#     Target:
#       Cpu:     25m
#       Memory:  262144k
#     Uncapped Target:
#       Cpu:     25m
#       Memory:  262144k
#     Upper Bound:
#       Cpu:     230m
#       Memory:  262144k

# View in JSON for detailed analysis
kubectl get vpa kubengix-vpa -o json | jq '.status.recommendation'
```

### Step 6: Generate Load to Influence Recommendations

```bash
# Create load generator to increase resource usage
kubectl run load-generator \
  --image=busybox \
  --restart=Never \
  -- /bin/sh -c "while true; do wget -q -O- http://vpa-demo-service-nginx; done"

# Or create multiple load generators
for i in {1..5}; do
  kubectl run load-gen-$i --image=busybox --restart=Never -- \
    /bin/sh -c "while true; do wget -q -O- http://vpa-demo-service-nginx; done"
done

# Monitor pod resource usage
kubectl top pods -l app=vpa-nginx

# Wait a few minutes and check updated recommendations
kubectl describe vpa kubengix-vpa
```

### Step 7: Observe VPA Updates (Recreate Mode)

In Recreate mode, VPA will evict and recreate pods with new resource requests:

```bash
# Watch pods being evicted and recreated
kubectl get pods -l app=vpa-nginx -w

# Check VPA updater logs
kubectl logs -n kube-system -l app=vpa-updater

# Verify new resource requests
kubectl describe pods -l app=vpa-nginx | grep -A 5 "Requests:"

# Compare with original requests (5m CPU, 5Mi memory)
# New requests should be higher based on observed usage
```

### Step 8: Test Different VPA Modes

#### Test "Off" Mode (Recommendations Only)

```bash
# Update VPA to Off mode
kubectl patch vpa kubengix-vpa --type='json' \
  -p='[{"op": "replace", "path": "/spec/updatePolicy/updateMode", "value": "Off"}]'

# VPA will provide recommendations but not update pods
kubectl describe vpa kubengix-vpa

# Pods will NOT be evicted
kubectl get pods -l app=vpa-nginx
```

#### Test "Initial" Mode

```bash
# Update VPA to Initial mode
kubectl patch vpa kubengix-vpa --type='json' \
  -p='[{"op": "replace", "path": "/spec/updatePolicy/updateMode", "value": "Initial"}]'

# Existing pods are not affected
kubectl get pods -l app=vpa-nginx

# Delete a pod to test Initial mode
kubectl delete pod -l app=vpa-nginx --force

# New pod will be created with VPA recommendations
kubectl describe pods -l app=vpa-nginx | grep -A 5 "Requests:"
```

### Step 9: Clean Up Load Generators

```bash
# Remove load generator pods
kubectl delete pod load-generator
kubectl delete pod -l run=load-gen
```

## Configuration

### VPA Manifest Breakdown

```yaml
apiVersion: "autoscaling.k8s.io/v1beta2"
kind: VerticalPodAutoscaler
metadata:
  name: kubengix-vpa
spec:
  # Target resource to monitor and update
  targetRef:
    apiVersion: "apps/v1"
    kind: Deployment
    name: vpa-demo-deployment

  # Resource policies and constraints
  resourcePolicy:
    containerPolicies:
    - containerName: '*'              # Apply to all containers
      minAllowed:                     # Minimum resources
        cpu: 5m
        memory: 5Mi
      maxAllowed:                     # Maximum resources
        cpu: 1
        memory: 500Mi
      controlledResources:            # Which resources to manage
        - cpu
        - memory
```

### Update Policy Configuration

```yaml
spec:
  updatePolicy:
    updateMode: "Auto"    # Options: Off, Initial, Recreate, Auto
```

**Update Modes Explained:**

```yaml
# Off - Only provide recommendations
updatePolicy:
  updateMode: "Off"

# Initial - Apply only at pod creation
updatePolicy:
  updateMode: "Initial"

# Recreate - Evict and recreate pods (default)
updatePolicy:
  updateMode: "Recreate"

# Auto - Currently same as Recreate
updatePolicy:
  updateMode: "Auto"
```

### Advanced Resource Policies

#### Per-Container Policies

```yaml
resourcePolicy:
  containerPolicies:
  # Policy for specific container
  - containerName: 'nginx'
    minAllowed:
      cpu: 10m
      memory: 10Mi
    maxAllowed:
      cpu: 2
      memory: 2Gi
    controlledResources: ["cpu", "memory"]
    mode: "Auto"  # Override for this container

  # Policy for sidecar container
  - containerName: 'sidecar'
    mode: "Off"  # Don't autoscale sidecar
```

#### Control Specific Resources

```yaml
resourcePolicy:
  containerPolicies:
  - containerName: '*'
    # Only manage CPU, leave memory unchanged
    controlledResources: ["cpu"]
    minAllowed:
      cpu: 10m
    maxAllowed:
      cpu: 2
```

#### Scaling Modes

```yaml
resourcePolicy:
  containerPolicies:
  - containerName: '*'
    mode: "Auto"  # Auto-update this container (default)
    controlledResources: ["cpu", "memory"]

  - containerName: 'database'
    mode: "Off"   # Don't auto-update database container
```

### Recommendation Policies

Configure how recommendations are calculated:

```yaml
spec:
  recommenders:
  - name: 'alternative-recommender'  # Use custom recommender
```

### Understanding VPA Recommendations

VPA provides four recommendation values:

```yaml
Status:
  Recommendation:
    Container Recommendations:
      Container Name:  nginx
      Lower Bound:     # Minimum viable resources
        Cpu:     25m
        Memory:  100Mi
      Target:          # Recommended resources (used by Admission Controller)
        Cpu:     50m
        Memory:  200Mi
      Uncapped Target: # Recommendation without min/max constraints
        Cpu:     75m
        Memory:  300Mi
      Upper Bound:     # Maximum necessary resources
        Cpu:     100m
        Memory:  500Mi
```

**Recommendation Meanings:**
- **Lower Bound**: Minimal resources needed; pods may fail with less
- **Target**: Optimal resources recommended for the pod
- **Uncapped Target**: Target without min/max policy constraints
- **Upper Bound**: Maximum resources that would be beneficial

## Features

### Automatic Resource Optimization
- Monitors historical resource usage patterns
- Provides data-driven resource recommendations
- Automatically updates pod resource requests

### Multiple Update Modes
- **Off**: Recommendation-only mode for analysis
- **Initial**: Apply recommendations at pod creation only
- **Recreate**: Actively update running pods
- **Auto**: Intelligent update mode (future enhancements)

### Flexible Resource Policies
- Set minimum and maximum resource boundaries
- Control which resources to manage (CPU, memory, or both)
- Define per-container policies
- Support for wildcard container matching

### Integration with Kubernetes
- Works with Deployments, StatefulSets, DaemonSets
- Respects PodDisruptionBudgets during updates
- Integrates with Admission Controller for seamless updates

### Cost and Performance Optimization
- Reduces over-provisioning of resources
- Prevents under-provisioning that causes OOM kills
- Optimizes cluster resource utilization
- Lowers infrastructure costs

## Troubleshooting

### Issue: VPA Shows No Recommendations

**Symptoms:**
```bash
kubectl describe vpa kubengix-vpa
# Recommendation: <none>
```

**Solutions:**

```bash
# Check if VPA recommender is running
kubectl get pods -n kube-system -l app=vpa-recommender

# Check recommender logs
kubectl logs -n kube-system -l app=vpa-recommender

# Verify Metrics Server is working
kubectl top pods -l app=vpa-nginx

# VPA needs several minutes of metrics to generate recommendations
# Wait 5-10 minutes after deploying

# Check if pods have resource requests defined
kubectl get pods -l app=vpa-nginx -o yaml | grep -A 5 resources:

# Ensure VPA targetRef is correct
kubectl get vpa kubengix-vpa -o yaml | grep -A 5 targetRef
```

### Issue: Pods Not Being Updated

**Symptoms:**
- VPA shows recommendations
- Pods not being evicted/recreated
- Resource requests unchanged

**Solutions:**

```bash
# Check VPA update mode
kubectl get vpa kubengix-vpa -o jsonpath='{.spec.updatePolicy.updateMode}'

# If "Off" or "Initial", pods won't be updated
# Change to "Recreate" or "Auto"
kubectl patch vpa kubengix-vpa --type='json' \
  -p='[{"op": "replace", "path": "/spec/updatePolicy/updateMode", "value": "Auto"}]'

# Check VPA updater is running
kubectl get pods -n kube-system -l app=vpa-updater

# Check updater logs
kubectl logs -n kube-system -l app=vpa-updater

# Verify admission controller is running
kubectl get pods -n kube-system -l app=vpa-admission-controller

# Check for PodDisruptionBudgets that may prevent eviction
kubectl get pdb
```

### Issue: VPA Admission Controller Errors

**Symptoms:**
- Pods fail to start
- Error: "failed calling webhook"
- Admission controller rejecting pods

**Solutions:**

```bash
# Check admission controller status
kubectl get pods -n kube-system -l app=vpa-admission-controller

# View admission controller logs
kubectl logs -n kube-system -l app=vpa-admission-controller

# Check webhook configuration
kubectl get validatingwebhookconfigurations
kubectl get mutatingwebhookconfigurations

# Common issue: webhook configuration pointing to wrong service
kubectl get mutatingwebhookconfigurations vpa-webhook-config -o yaml

# Reinstall VPA if webhook is misconfigured
cd autoscaler/vertical-pod-autoscaler
./hack/vpa-down.sh
./hack/vpa-up.sh
```

### Issue: Recommendations Exceed Max Allowed

**Symptoms:**
```bash
kubectl describe vpa kubengix-vpa
# Uncapped Target shows higher values than Target
# Target is capped by maxAllowed
```

**Solutions:**

```bash
# This is normal behavior - maxAllowed is working as intended
# If you want higher resources, increase maxAllowed

kubectl edit vpa kubengix-vpa

# Increase maxAllowed values:
resourcePolicy:
  containerPolicies:
  - containerName: '*'
    maxAllowed:
      cpu: 2        # Increased from 1
      memory: 1Gi   # Increased from 500Mi

# Or remove maxAllowed to allow unlimited recommendations
# (not recommended for production)
```

### Issue: VPA and HPA Conflict

**Symptoms:**
- Both VPA and HPA configured for same deployment
- Unpredictable scaling behavior
- Resource thrashing

**Solutions:**

```bash
# VPA and HPA should NOT both manage CPU
# Option 1: Use VPA for memory, HPA for CPU

# VPA configuration
resourcePolicy:
  containerPolicies:
  - containerName: '*'
    controlledResources: ["memory"]  # Only memory

# HPA configuration
metrics:
- type: Resource
  resource:
    name: cpu  # Only CPU
    target:
      type: Utilization
      averageUtilization: 50

# Option 2: Use only one autoscaler
# Choose based on workload:
# - Variable traffic: Use HPA
# - Stable traffic with resource optimization: Use VPA
```

### Issue: Pods Evicted Too Frequently

**Symptoms:**
- Constant pod evictions
- Application instability
- Frequent restarts

**Solutions:**

```bash
# Switch to "Initial" mode to prevent eviction of running pods
kubectl patch vpa kubengix-vpa --type='json' \
  -p='[{"op": "replace", "path": "/spec/updatePolicy/updateMode", "value": "Initial"}]'

# Or use "Off" mode and manually apply recommendations
kubectl patch vpa kubengix-vpa --type='json' \
  -p='[{"op": "replace", "path": "/spec/updatePolicy/updateMode", "value": "Off"}]'

# Manually update deployment with recommended resources
kubectl get vpa kubengix-vpa -o json | jq '.status.recommendation'

# Update deployment resource requests based on Target values
kubectl edit deployment vpa-demo-deployment
```

### Issue: OOM Kills Despite VPA

**Symptoms:**
- Pods being OOMKilled
- VPA recommendations seem appropriate
- Memory limits too restrictive

**Solutions:**

```bash
# Check if memory limits are set too low
kubectl describe pods -l app=vpa-nginx | grep -A 10 "Limits:"

# VPA updates requests but NOT limits by default
# Option 1: Remove memory limits
kubectl edit deployment vpa-demo-deployment
# Delete the memory limit

# Option 2: Set limits higher than VPA maxAllowed
resources:
  limits:
    memory: "1Gi"  # Higher than VPA maxAllowed (500Mi)

# Check for memory leaks in application
kubectl top pods -l app=vpa-nginx --sort-by=memory
```

### Debug Commands

```bash
# View all VPA resources
kubectl get vpa --all-namespaces

# Detailed VPA status
kubectl describe vpa kubengix-vpa

# Check VPA components health
kubectl get pods -n kube-system | grep vpa

# View recommender logs
kubectl logs -n kube-system -l app=vpa-recommender --tail=100

# View updater logs
kubectl logs -n kube-system -l app=vpa-updater --tail=100

# View admission controller logs
kubectl logs -n kube-system -l app=vpa-admission-controller --tail=100

# Get current pod resources
kubectl get pods -l app=vpa-nginx -o json | jq '.items[].spec.containers[].resources'

# Compare with VPA recommendations
kubectl get vpa kubengix-vpa -o json | jq '.status.recommendation.containerRecommendations'

# Check VPA events
kubectl get events --field-selector involvedObject.kind=VerticalPodAutoscaler

# Test webhook
kubectl run test-pod --image=nginx --dry-run=server -o yaml
```

## Best Practices

### 1. Start with "Off" Mode for Observation

```yaml
spec:
  updatePolicy:
    updateMode: "Off"
```

Monitor recommendations for several days before enabling automatic updates:

```bash
# Collect recommendations over time
kubectl get vpa kubengix-vpa -o json | jq '.status.recommendation' > vpa-recommendations-$(date +%Y%m%d).json

# Analyze trends before enabling Auto mode
```

### 2. Set Appropriate Min and Max Boundaries

```yaml
resourcePolicy:
  containerPolicies:
  - containerName: '*'
    minAllowed:
      cpu: 10m         # Minimum to run the app
      memory: 10Mi
    maxAllowed:
      cpu: 4           # Budget/node capacity limit
      memory: 8Gi
```

**Guidelines:**
- **minAllowed**: Absolute minimum for application to function
- **maxAllowed**: Based on budget, node capacity, or business constraints

### 3. Use VPA with StatefulSets Carefully

```yaml
# For StatefulSets, prefer "Initial" mode
spec:
  updatePolicy:
    updateMode: "Initial"
```

**Reason:** StatefulSets have strict ordering requirements; evicting pods can disrupt stateful applications.

### 4. Don't Mix VPA and HPA on Same Resource

```yaml
# WRONG: Both VPA and HPA managing CPU
# VPA:
controlledResources: ["cpu", "memory"]
# HPA:
metrics:
  - type: Resource
    resource:
      name: cpu

# CORRECT: Separate resources
# VPA:
controlledResources: ["memory"]
# HPA:
metrics:
  - type: Resource
    resource:
      name: cpu
```

### 5. Define Resource Requests Initially

Even with VPA, define initial requests:

```yaml
resources:
  requests:
    cpu: "100m"     # Starting point
    memory: "128Mi"
  limits:
    memory: "1Gi"   # Safety limit (higher than maxAllowed)
```

VPA works better with a reasonable starting point.

### 6. Monitor VPA Recommendations Regularly

```bash
# Create monitoring script
cat << 'EOF' > monitor-vpa.sh
#!/bin/bash
echo "VPA Recommendations Monitor"
echo "============================"
kubectl get vpa -o custom-columns=\
NAME:.metadata.name,\
MODE:.spec.updatePolicy.updateMode,\
TARGET-CPU:.status.recommendation.containerRecommendations[0].target.cpu,\
TARGET-MEM:.status.recommendation.containerRecommendations[0].target.memory
EOF

chmod +x monitor-vpa.sh
./monitor-vpa.sh
```

### 7. Use PodDisruptionBudgets with VPA

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: vpa-demo-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: vpa-nginx
```

Ensures availability during VPA-triggered evictions.

### 8. Test VPA in Non-Production First

```bash
# Deploy to development environment
kubectl apply -f kube-manifests/ --namespace=dev

# Monitor for 1-2 weeks
kubectl get vpa -n dev -w

# Analyze recommendations
kubectl describe vpa kubengix-vpa -n dev

# Gradually roll out to production
```

### 9. Consider Update Mode Based on Workload

| Workload Type | Recommended Mode | Reason |
|---------------|-----------------|--------|
| Stateless web apps | Auto/Recreate | Can tolerate pod restarts |
| Databases | Initial or Off | Avoid disrupting connections |
| Batch jobs | Off | Resources vary per job |
| Cron jobs | Initial | Resources set at job start |
| Development | Auto | Optimize frequently |

### 10. Review Historical Recommendations

```bash
# Export VPA recommendations for analysis
kubectl get vpa kubengix-vpa -o json | \
  jq '{
    timestamp: now,
    target_cpu: .status.recommendation.containerRecommendations[0].target.cpu,
    target_memory: .status.recommendation.containerRecommendations[0].target.memory,
    lower_cpu: .status.recommendation.containerRecommendations[0].lowerBound.cpu,
    lower_memory: .status.recommendation.containerRecommendations[0].lowerBound.memory,
    upper_cpu: .status.recommendation.containerRecommendations[0].upperBound.cpu,
    upper_memory: .status.recommendation.containerRecommendations[0].upperBound.memory
  }' >> vpa-history.json

# Run periodically (e.g., daily cron job)
```

### 11. Adjust for Application Lifecycle

```yaml
# For applications with warm-up period
resourcePolicy:
  containerPolicies:
  - containerName: '*'
    minAllowed:
      cpu: 100m      # Higher minimum during startup
      memory: 256Mi
```

### 12. Use Namespace-Level Policies

```yaml
# Create VPA for entire namespace (multiple deployments)
apiVersion: autoscaling.k8s.io/v1beta2
kind: VerticalPodAutoscaler
metadata:
  name: namespace-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: "*"  # All deployments
  updatePolicy:
    updateMode: "Off"  # Recommendation only for safety
```

### 13. Document VPA Decisions

```yaml
apiVersion: autoscaling.k8s.io/v1beta2
kind: VerticalPodAutoscaler
metadata:
  name: kubengix-vpa
  annotations:
    vpa.kubernetes.io/mode: "auto"
    vpa.kubernetes.io/reason: "Memory optimization - reduced OOM kills by 90%"
    vpa.kubernetes.io/reviewed-date: "2025-10-18"
spec:
  # ... rest of config
```

## Related Projects

### In This Repository
- **EKS-Autoscaling-Cluster-Autoscaler**: Scales cluster nodes based on pod demands
- **EKS-HPA-Horizontal-Pod-Autoscaler**: Scales pod replicas based on metrics
- **EKS-Metrics-Server**: Provides resource metrics for autoscaling

### Complementary Projects
- **EKS-Goldilocks**: VPA recommendation dashboard
- **EKS-Cost-Analyzer**: Cost implications of VPA recommendations
- **EKS-Resource-Quotas**: Namespace-level resource management

### Autoscaling Strategy Comparison

| Aspect | VPA | HPA | Cluster Autoscaler |
|--------|-----|-----|-------------------|
| **What it scales** | Pod resources | Pod replicas | Nodes (EC2) |
| **When to scale** | Resource mismatch | Load changes | Insufficient capacity |
| **Response time** | Hours to days | Seconds to minutes | Minutes |
| **Disruption** | Pod restart | None | None |
| **Best for** | Right-sizing | Traffic spikes | Cluster capacity |
| **Metrics used** | Historical usage | Current usage | Pending pods |

### Combined Autoscaling Strategy

```yaml
# Recommended approach for comprehensive autoscaling:

# 1. VPA for resource optimization (long-term)
#    - Mode: Initial or Off
#    - Review recommendations weekly
#    - Manually adjust or use Auto for non-critical apps

# 2. HPA for traffic handling (short-term)
#    - Target: CPU or custom metrics
#    - minReplicas: 2 (high availability)
#    - maxReplicas: 50 (budget limit)

# 3. Cluster Autoscaler for capacity (medium-term)
#    - Min nodes: 2 (availability)
#    - Max nodes: 20 (budget)
#    - Scale-down delay: 10 minutes
```

**Example Combined Configuration:**

```yaml
# VPA - Optimize memory only
apiVersion: autoscaling.k8s.io/v1beta2
kind: VerticalPodAutoscaler
metadata:
  name: app-vpa
spec:
  targetRef:
    kind: Deployment
    name: myapp
  updatePolicy:
    updateMode: "Initial"
  resourcePolicy:
    containerPolicies:
    - containerName: '*'
      controlledResources: ["memory"]  # VPA manages memory
---
# HPA - Scale replicas based on CPU
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
spec:
  scaleTargetRef:
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu  # HPA manages replica count based on CPU
      target:
        type: Utilization
        averageUtilization: 70
```
