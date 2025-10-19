# EKS Horizontal Pod Autoscaler (HPA)

## Overview

This project demonstrates the implementation of Kubernetes Horizontal Pod Autoscaler (HPA) on Amazon EKS. HPA automatically scales the number of pod replicas in a deployment, replica set, or stateful set based on observed CPU utilization, memory usage, or custom metrics.

HPA works at the pod level, adjusting the number of replicas to match the current workload demands. It continuously monitors resource metrics and makes scaling decisions every 15 seconds by default, providing rapid response to traffic fluctuations.

## Architecture

### How HPA Works

```
┌─────────────────────────────────────────────────────────────┐
│                    Metrics Server                           │
│              (Collects CPU/Memory Metrics)                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ 1. Queries Metrics
                  ▼
┌─────────────────────────────────────────────────────────────┐
│           HPA Controller                                    │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │ Desired Replicas = ceil[current replicas *   │          │
│  │   (current metric / target metric)]          │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ 2. Calculates Desired Replicas
                  │ 3. Updates Deployment
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     Deployment                              │
│                                                             │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐                       │
│  │ Pod │  │ Pod │  │ Pod │  │ Pod │  ... (scaled)          │
│  └─────┘  └─────┘  └─────┘  └─────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### Scaling Algorithm

The HPA controller uses the following formula to calculate desired replicas:

```
desiredReplicas = ceil[currentReplicas * (currentMetricValue / targetMetricValue)]
```

**Example:**
- Current replicas: 2
- Current CPU usage: 80%
- Target CPU usage: 50%
- Desired replicas: ceil[2 * (80 / 50)] = ceil[3.2] = 4 pods

### Key Components

1. **Metrics Server**: Collects resource metrics from Kubelets
2. **HPA Controller**: Monitors metrics and adjusts replica count
3. **Target Resource**: Deployment/ReplicaSet/StatefulSet being scaled
4. **Scaling Policies**: Rules defining scale-up and scale-down behavior

## Prerequisites

### Required Tools
- AWS CLI (v2.x or later)
- kubectl (v1.24 or later)
- An existing EKS cluster with worker nodes

### Cluster Requirements
- EKS cluster version 1.24 or later
- Metrics Server installed and running
- Sufficient cluster capacity for scaling

### Install Metrics Server

```bash
# Deploy Metrics Server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Verify Metrics Server is running
kubectl get deployment metrics-server -n kube-system

# Test metrics collection
kubectl top nodes
kubectl top pods
```

If `kubectl top` commands fail, the Metrics Server may need additional configuration for EKS:

```bash
# Edit Metrics Server deployment
kubectl edit deployment metrics-server -n kube-system

# Add the following args:
# - --kubelet-insecure-tls
# - --kubelet-preferred-address-types=InternalIP
```

## Project Structure

```
EKS-HPA-Horizontal-Pod-Autoscaler/
├── README.md
└── kube-manifests/
    ├── 01-HPA-Demo.yml    # Demo application deployment and service
    └── hpa.yaml           # HPA configuration with scaling policies
```

### File Descriptions

- **01-HPA-Demo.yml**: Sample nginx deployment with defined resource requests/limits for HPA
- **hpa.yaml**: HPA manifest with CPU-based scaling and behavior policies

## Usage

### Step 1: Deploy Demo Application

```bash
# Deploy the nginx application with resource specifications
kubectl apply -f kube-manifests/01-HPA-Demo.yml

# Verify deployment
kubectl get deployments
kubectl get pods
kubectl get svc

# Expected output:
# NAME                  READY   UP-TO-DATE   AVAILABLE   AGE
# hpa-demo-deployment   1/1     1            1           10s
```

### Step 2: Create Horizontal Pod Autoscaler

```bash
# Apply the HPA configuration
kubectl apply -f kube-manifests/hpa.yaml

# Verify HPA is created
kubectl get hpa

# Expected output:
# NAME           REFERENCE                        TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
# hpa-demo-hpa   Deployment/hpa-demo-deployment   0%/50%    1         10        1          10s
```

### Step 3: View HPA Details

```bash
# Get detailed HPA information
kubectl describe hpa hpa-demo-hpa

# Watch HPA status in real-time
kubectl get hpa -w

# Check current metrics
kubectl top pods -l app=hpa-nginx
```

### Step 4: Generate Load to Trigger Scale-Up

#### Option A: Using kubectl run

```bash
# Create a load generator pod
kubectl run load-generator \
  --image=busybox \
  --restart=Never \
  -- /bin/sh -c "while true; do wget -q -O- http://hpa-demo-service-nginx; done"

# Watch pods being created
kubectl get pods -l app=hpa-nginx -w

# Watch HPA scaling
kubectl get hpa hpa-demo-hpa -w
```

#### Option B: Using Apache Bench

```bash
# Install Apache Bench (if not already installed)
# macOS: brew install apache2
# Linux: apt-get install apache2-utils

# Get the service endpoint
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}')
NODE_PORT=31231

# Generate load (1000 requests, 10 concurrent)
ab -n 1000 -c 10 http://${NODE_IP}:${NODE_PORT}/
```

#### Option C: Using multiple load generators

```bash
# Create multiple load generators for sustained load
for i in {1..5}; do
  kubectl run load-generator-$i \
    --image=busybox \
    --restart=Never \
    -- /bin/sh -c "while true; do wget -q -O- http://hpa-demo-service-nginx; done"
done

# Monitor the scaling
watch kubectl get hpa,pods -l app=hpa-nginx
```

### Step 5: Observe Scaling Behavior

```bash
# Watch HPA make scaling decisions
kubectl get hpa hpa-demo-hpa -w

# Expected progression:
# NAME           REFERENCE                        TARGETS    MINPODS   MAXPODS   REPLICAS
# hpa-demo-hpa   Deployment/hpa-demo-deployment   0%/50%     1         10        1
# hpa-demo-hpa   Deployment/hpa-demo-deployment   85%/50%    1         10        1
# hpa-demo-hpa   Deployment/hpa-demo-deployment   85%/50%    1         10        2
# hpa-demo-hpa   Deployment/hpa-demo-deployment   72%/50%    1         10        2
# hpa-demo-hpa   Deployment/hpa-demo-deployment   72%/50%    1         10        3

# Check HPA events
kubectl describe hpa hpa-demo-hpa

# View events:
# Events:
#   Type    Reason             Age   From                       Message
#   ----    ------             ----  ----                       -------
#   Normal  SuccessfulRescale  2m    horizontal-pod-autoscaler  New size: 2; reason: cpu resource utilization (percentage of request) above target
#   Normal  SuccessfulRescale  1m    horizontal-pod-autoscaler  New size: 3; reason: cpu resource utilization (percentage of request) above target
```

### Step 6: Test Scale-Down

```bash
# Stop load generators
kubectl delete pod load-generator
# Or for multiple generators:
kubectl delete pod -l run=load-generator

# Wait for stabilization window (5 minutes by default in this config)
# Watch pods being terminated
kubectl get pods -l app=hpa-nginx -w

# Monitor HPA
kubectl get hpa hpa-demo-hpa -w

# Expected progression:
# hpa-demo-hpa   Deployment/hpa-demo-deployment   45%/50%    1         10        3
# hpa-demo-hpa   Deployment/hpa-demo-deployment   12%/50%    1         10        3
# (wait 5 minutes)
# hpa-demo-hpa   Deployment/hpa-demo-deployment   8%/50%     1         10        2
# hpa-demo-hpa   Deployment/hpa-demo-deployment   5%/50%     1         10        1
```

### Step 7: Create HPA Using kubectl (Alternative Method)

Instead of using a manifest file, you can create HPA directly:

```bash
# Create HPA with kubectl autoscale
kubectl autoscale deployment hpa-demo-deployment \
  --cpu-percent=50 \
  --min=1 \
  --max=10

# This creates a basic HPA without advanced behavior policies
```

## Configuration

### HPA Manifest Breakdown

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: hpa-demo-hpa
spec:
  # Target resource to scale
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: hpa-demo-deployment

  # Replica boundaries
  minReplicas: 1
  maxReplicas: 10

  # Metrics for scaling decisions
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50  # Target 50% CPU utilization

  # Scaling behavior policies
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5 minutes before scale-down
      policies:
      - type: Percent
        value: 100           # Can remove up to 100% of pods
        periodSeconds: 15    # Every 15 seconds
    scaleUp:
      stabilizationWindowSeconds: 0    # Scale up immediately
      policies:
      - type: Percent
        value: 100           # Can add up to 100% of current pods
        periodSeconds: 15    # Every 15 seconds
```

### Understanding Scaling Policies

#### Scale-Up Policies

```yaml
scaleUp:
  stabilizationWindowSeconds: 0  # No delay for scale-up
  policies:
  - type: Percent
    value: 100                   # Double pods each cycle
    periodSeconds: 15
  - type: Pods
    value: 4                     # Or add 4 pods
    periodSeconds: 15
  selectPolicy: Max              # Use whichever adds more pods
```

**Policy Types:**
- **Percent**: Scale by percentage of current replicas
- **Pods**: Scale by absolute number of pods

**Select Policies:**
- **Max**: Use the policy that scales more aggressively
- **Min**: Use the policy that scales more conservatively
- **Disabled**: Disable scaling in this direction

#### Scale-Down Policies

```yaml
scaleDown:
  stabilizationWindowSeconds: 300  # Wait 5 minutes
  policies:
  - type: Percent
    value: 50                      # Remove up to 50% of pods
    periodSeconds: 60              # Check every minute
  - type: Pods
    value: 2                       # Or remove 2 pods
    periodSeconds: 60
  selectPolicy: Min                # Use whichever removes fewer pods
```

### Multiple Metrics Configuration

HPA supports multiple metrics simultaneously:

```yaml
metrics:
# CPU metric
- type: Resource
  resource:
    name: cpu
    target:
      type: Utilization
      averageUtilization: 50

# Memory metric
- type: Resource
  resource:
    name: memory
    target:
      type: Utilization
      averageUtilization: 80

# Custom metric (requests per second)
- type: Pods
  pods:
    metric:
      name: http_requests_per_second
    target:
      type: AverageValue
      averageValue: "1000"
```

When multiple metrics are specified, HPA calculates desired replicas for each metric and uses the highest value.

### Deployment Resource Configuration

Critical for HPA functionality:

```yaml
resources:
  requests:
    memory: "128Mi"  # Required for memory-based HPA
    cpu: "100m"      # Required for CPU-based HPA
  limits:
    memory: "500Mi"  # Prevents OOM kills
    cpu: "200m"      # Prevents CPU throttling
```

**Important:** HPA requires resource requests to be defined. Without them, HPA cannot calculate utilization percentages.

## Features

### Automatic Pod Scaling
- Scales pods up during traffic spikes
- Scales pods down during low traffic
- Maintains application availability

### Multiple Metric Support
- CPU utilization
- Memory utilization
- Custom metrics (via custom metrics API)
- External metrics (via external metrics API)

### Flexible Scaling Policies
- Control scale-up and scale-down rates independently
- Set stabilization windows to prevent flapping
- Define multiple policies with selection strategies

### Integration with Kubernetes
- Works with Deployments, ReplicaSets, and StatefulSets
- Respects PodDisruptionBudgets
- Integrates with cluster autoscaler for node scaling

### Rapid Response
- Default evaluation interval: 15 seconds
- Quick response to load changes
- Configurable behavior for different workload patterns

## Troubleshooting

### Issue: HPA Shows "unknown" for Metrics

**Symptoms:**
```bash
kubectl get hpa
# NAME           REFERENCE                        TARGETS         MINPODS   MAXPODS   REPLICAS
# hpa-demo-hpa   Deployment/hpa-demo-deployment   <unknown>/50%   1         10        1
```

**Solutions:**

```bash
# Check if Metrics Server is running
kubectl get deployment metrics-server -n kube-system

# Check Metrics Server logs
kubectl logs -n kube-system deployment/metrics-server

# Verify metrics are available
kubectl top nodes
kubectl top pods

# If metrics are unavailable, reinstall Metrics Server
kubectl delete -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# For EKS, patch Metrics Server with additional args
kubectl patch deployment metrics-server -n kube-system --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'
```

### Issue: HPA Not Scaling Despite High CPU

**Symptoms:**
- CPU usage above target
- Replica count remains unchanged
- No scaling events in HPA description

**Solutions:**

```bash
# Check HPA status
kubectl describe hpa hpa-demo-hpa

# Verify resource requests are defined
kubectl get deployment hpa-demo-deployment -o yaml | grep -A 4 resources

# Ensure pods are Ready
kubectl get pods -l app=hpa-nginx

# Check for PodDisruptionBudgets blocking scale-down
kubectl get pdb

# Review HPA events
kubectl get events --field-selector involvedObject.name=hpa-demo-hpa

# Common issues:
# 1. Missing resource requests in pod spec
# 2. Metrics Server not collecting data
# 3. HPA at max replicas already
# 4. Insufficient cluster capacity for new pods
```

### Issue: Pods Scaling Too Aggressively

**Symptoms:**
- Rapid scaling up and down
- Pod churn and instability
- Unnecessary scaling events

**Solutions:**

```bash
# Adjust stabilization windows
kubectl edit hpa hpa-demo-hpa

# Increase stabilization window for scale-down
behavior:
  scaleDown:
    stabilizationWindowSeconds: 600  # Wait 10 minutes

# Adjust scale-up to be less aggressive
  scaleUp:
    policies:
    - type: Percent
      value: 50           # Only add 50% of current pods
      periodSeconds: 30   # Check every 30 seconds

# Increase target threshold
metrics:
- type: Resource
  resource:
    name: cpu
    target:
      type: Utilization
      averageUtilization: 70  # Higher threshold
```

### Issue: Scale-Down Not Happening

**Symptoms:**
- CPU usage below target
- Pods remain at high count
- No scale-down events

**Solutions:**

```bash
# Check scale-down delay
kubectl describe hpa hpa-demo-hpa | grep -A 10 "Scale Down"

# Verify current metrics
kubectl top pods -l app=hpa-nginx

# Check if within stabilization window
kubectl get events --field-selector involvedObject.name=hpa-demo-hpa

# Force immediate scale-down (for testing)
kubectl edit hpa hpa-demo-hpa
# Set stabilizationWindowSeconds: 0 for scaleDown

# Check for minimum replicas constraint
kubectl get hpa hpa-demo-hpa -o yaml | grep minReplicas
```

### Issue: HPA API Version Error

**Symptoms:**
```
error: unable to recognize "hpa.yaml": no matches for kind "HorizontalPodAutoscaler" in version "autoscaling/v2"
```

**Solutions:**

```bash
# Check supported HPA versions
kubectl api-versions | grep autoscaling

# For older Kubernetes versions, use v2beta2
apiVersion: autoscaling/v2beta2

# Or use v1 for basic HPA
apiVersion: autoscaling/v1
kind: HorizontalPodAutoscaler
metadata:
  name: hpa-demo-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: hpa-demo-deployment
  minReplicas: 1
  maxReplicas: 10
  targetCPUUtilizationPercentage: 50
```

### Issue: Insufficient Cluster Capacity

**Symptoms:**
- HPA wants to scale up
- New pods stuck in Pending state
- Events show "Insufficient cpu/memory"

**Solutions:**

```bash
# Check node capacity
kubectl describe nodes | grep -A 5 "Allocated resources"

# Use Cluster Autoscaler to add nodes automatically
# See ../EKS-Autoscaling-Cluster-Autoscaler/README.md

# Or manually add nodes
eksctl scale nodegroup --cluster=<cluster-name> --name=<nodegroup-name> --nodes=5

# Reduce resource requests to fit more pods per node
kubectl edit deployment hpa-demo-deployment
# Reduce requests:
#   cpu: "50m"      # Reduced from 100m
#   memory: "64Mi"  # Reduced from 128Mi
```

### Debug Commands

```bash
# Comprehensive HPA debugging
kubectl get hpa hpa-demo-hpa -o yaml

# Check HPA controller logs
kubectl logs -n kube-system -l k8s-app=kube-controller-manager | grep -i hpa

# View all scaling events
kubectl get events --all-namespaces --sort-by='.lastTimestamp' | grep -i horizontalpodautoscaler

# Test metrics manually
kubectl get --raw "/apis/metrics.k8s.io/v1beta1/namespaces/default/pods" | jq .

# Check current replica count
kubectl get deployment hpa-demo-deployment -o jsonpath='{.spec.replicas}'

# Simulate load for testing
kubectl run -it --rm load-generator --image=busybox --restart=Never -- /bin/sh
# Then inside the pod:
# while true; do wget -q -O- http://hpa-demo-service-nginx; done
```

## Best Practices

### 1. Always Define Resource Requests and Limits

```yaml
resources:
  requests:
    cpu: "100m"      # HPA calculates based on this
    memory: "128Mi"
  limits:
    cpu: "200m"      # Prevents CPU throttling
    memory: "500Mi"  # Prevents OOM kills
```

**Why:**
- HPA uses requests to calculate utilization percentage
- Limits prevent resource overconsumption
- Proper sizing ensures predictable scaling behavior

### 2. Set Realistic Min and Max Replicas

```yaml
minReplicas: 2   # Never go below 2 for availability
maxReplicas: 50  # Cap based on budget and capacity
```

**Considerations:**
- Min replicas: Ensure high availability (usually 2-3)
- Max replicas: Prevent runaway costs
- Consider cluster capacity when setting max

### 3. Use Appropriate Scaling Thresholds

```yaml
# For CPU-intensive applications
averageUtilization: 70

# For memory-intensive applications
averageUtilization: 80

# For latency-sensitive applications
averageUtilization: 50
```

**Guidelines:**
- Lower thresholds (40-50%): More headroom, higher cost
- Medium thresholds (60-70%): Balanced approach
- Higher thresholds (80-90%): Cost-efficient, less headroom

### 4. Configure Stabilization Windows

```yaml
behavior:
  scaleDown:
    stabilizationWindowSeconds: 300  # 5 minutes for production
  scaleUp:
    stabilizationWindowSeconds: 0    # Immediate for responsiveness
```

**Recommendations:**
- Scale-up: 0-60 seconds (respond quickly to load)
- Scale-down: 300-600 seconds (avoid flapping)
- Adjust based on workload variability

### 5. Use Multiple Metrics When Appropriate

```yaml
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

HPA will scale based on whichever metric requires more replicas.

### 6. Combine with PodDisruptionBudgets

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: hpa-demo-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: hpa-nginx
```

Ensures availability during scale-down and rolling updates.

### 7. Monitor HPA Behavior

```bash
# Set up monitoring
kubectl get hpa -w

# Create alerts for scaling events
# Example Prometheus alert:
# - alert: HPAMaxedOut
#   expr: kube_hpa_status_current_replicas == kube_hpa_spec_max_replicas
#   for: 15m
#   annotations:
#     summary: "HPA {{ $labels.hpa }} is at max replicas"
```

### 8. Test Scaling Behavior

Create a load testing script:

```bash
#!/bin/bash
echo "Starting load test..."

# Create load generators
for i in {1..10}; do
  kubectl run load-gen-$i --image=busybox --restart=Never -- \
    /bin/sh -c "while true; do wget -q -O- http://hpa-demo-service-nginx; done" &
done

echo "Load generators created. Monitoring HPA..."
kubectl get hpa hpa-demo-hpa -w
```

### 9. Use Appropriate Scaling Policies

```yaml
# For gradual scaling
scaleUp:
  policies:
  - type: Percent
    value: 50
    periodSeconds: 60

# For aggressive scaling
scaleUp:
  policies:
  - type: Percent
    value: 100
    periodSeconds: 15
```

Match policies to your application's characteristics:
- Gradual: Long startup times, expensive instances
- Aggressive: Fast startup, handling traffic spikes

### 10. Coordinate with Cluster Autoscaler

```yaml
# HPA handles pod scaling
# Cluster Autoscaler handles node scaling
# Together they provide complete autoscaling

# Best practice: Set HPA max replicas considering cluster capacity
# Example:
# - Node capacity: 10 pods per node
# - Cluster max nodes: 5
# - HPA max replicas: 40 (10 * 5 - buffer for system pods)
```

### 11. Consider Application Startup Time

```yaml
behavior:
  scaleUp:
    # If your app takes 2 minutes to start, scale up aggressively
    stabilizationWindowSeconds: 0
    policies:
    - type: Pods
      value: 4          # Add 4 pods at once
      periodSeconds: 60
```

### 12. Use Custom Metrics for Better Decisions

For HTTP applications, use requests per second:

```yaml
metrics:
- type: Pods
  pods:
    metric:
      name: http_requests_per_second
    target:
      type: AverageValue
      averageValue: "1000"
```

Requires Prometheus Adapter or similar for custom metrics.

## Related Projects

### In This Repository
- **EKS-Autoscaling-Cluster-Autoscaler**: Scales cluster nodes based on pod demands
- **EKS-VPA-Vertical-Pod-Autoscaler**: Adjusts pod resource requests/limits
- **EKS-Metrics-Server**: Provides resource metrics for HPA

### Complementary Projects
- **EKS-KEDA**: Kubernetes Event-Driven Autoscaling for event-based scaling
- **EKS-Prometheus-Adapter**: Exposes custom metrics for HPA
- **EKS-Service-Mesh**: Istio/App Mesh for advanced traffic management

### Scaling Strategies Comparison

| Aspect | HPA | Cluster Autoscaler | VPA |
|--------|-----|-------------------|-----|
| **What it scales** | Pod replicas | Nodes (EC2) | Pod resources |
| **Response time** | 15-60 seconds | 2-5 minutes | Hours to days |
| **Best for** | Traffic spikes | Cluster capacity | Resource optimization |
| **Trigger** | Metrics | Pending pods | Historical usage |
| **Disruption** | None | None | Requires pod restart |

**Recommended Combination:**
1. **HPA** - Handle variable traffic (fast response)
2. **Cluster Autoscaler** - Ensure sufficient nodes (medium response)
3. **VPA** - Optimize resource requests (long-term)
