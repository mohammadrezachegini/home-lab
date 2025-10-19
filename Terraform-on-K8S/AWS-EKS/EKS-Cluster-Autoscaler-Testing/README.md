# EKS Cluster Autoscaler Testing

## Overview

This project provides a comprehensive testing environment for validating the Kubernetes Cluster Autoscaler functionality on Amazon EKS. It includes a sample application designed to trigger autoscaling events, allowing you to observe and verify the Cluster Autoscaler's behavior in real-world scenarios.

The testing suite demonstrates both scale-up and scale-down operations by deploying applications with specific resource requirements that exceed or fall below current cluster capacity. This helps validate that the Cluster Autoscaler is properly configured and functioning as expected.

## Architecture

### Test Scenario Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Initial State                           │
│  EKS Cluster: 2 nodes (min: 2, max: 3)                         │
│  Available Resources: ~2000m CPU, ~4Gi Memory                  │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ Deploy sample app (30 replicas)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Resource Pressure Created                    │
│  Required: 30 pods × 200m CPU = 6000m CPU                      │
│  Required: 30 pods × 200Mi Memory = 6000Mi Memory              │
│  Current: ~2000m CPU available                                 │
│                                                                 │
│  Result: ~20 pods Pending (Insufficient CPU)                   │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ Cluster Autoscaler detects
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Scale-Up Triggered                         │
│  Cluster Autoscaler:                                            │
│  1. Detects unschedulable pods                                 │
│  2. Calculates required capacity                               │
│  3. Requests new node from Auto Scaling group                  │
│  4. Waits for node to become Ready                             │
│                                                                 │
│  New Cluster State: 3 nodes (at max)                           │
│  Available Resources: ~3000m CPU, ~6Gi Memory                  │
│  Result: All 30 pods Running                                   │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ Scale replicas to 1
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Low Utilization Created                      │
│  Required: 1 pod × 200m CPU = 200m CPU                         │
│  Available: ~3000m CPU (3 nodes)                               │
│  Node Utilization: < 50% on all nodes                         │
│                                                                 │
│  Cluster Autoscaler monitors for 10 minutes                    │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ After scale-down delay
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Scale-Down Triggered                        │
│  Cluster Autoscaler:                                            │
│  1. Identifies underutilized nodes                             │
│  2. Simulates pod migration                                    │
│  3. Drains node safely (respects PDB)                          │
│  4. Terminates instance in Auto Scaling group                  │
│                                                                 │
│  Final Cluster State: 2 nodes (at min)                        │
│  Result: Cost optimized, all pods still Running                │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

### Required Infrastructure

1. **EKS Cluster**: Fully deployed and configured
2. **Cluster Autoscaler**: Installed and running
3. **Node Groups**: Configured with appropriate min/max settings
4. **IAM Roles**: IRSA properly configured

### Required Tools

- kubectl configured to access your EKS cluster
- Terraform >= 1.6.0 (for infrastructure)
- AWS CLI
- watch (optional, for monitoring)

### Verify Prerequisites

```bash
# Check EKS cluster is accessible
kubectl cluster-info

# Verify Cluster Autoscaler is running
kubectl get deployment cluster-autoscaler -n kube-system

# Check Cluster Autoscaler logs
kubectl logs -n kube-system deployment/cluster-autoscaler

# Verify node group configuration
aws eks describe-nodegroup --cluster-name CLUSTER_NAME --nodegroup-name NODE_GROUP_NAME

# Check current node count
kubectl get nodes
```

## Project Structure

```
EKS-Cluster-Autoscaler-Testing/
├── cluster-autoscaler-install-terraform-manifests/
│   ├── c1-versions.tf                          # Terraform and provider versions
│   ├── c2-remote-state-datasource.tf           # Remote state for EKS cluster
│   ├── c3-01-generic-variables.tf              # Input variables
│   ├── c3-02-local-values.tf                   # Local values
│   ├── c4-01-cluster-autoscaler-iam-policy-and-role.tf  # IAM configuration
│   ├── c4-02-cluster-autoscaler-helm-provider.tf        # Helm provider
│   ├── c4-03-cluster-autoscaler-install.tf              # Cluster Autoscaler
│   ├── c4-04-cluster-autoscaler-outputs.tf              # Outputs
│   └── terraform.tfvars                        # Variable values
├── cluster-autoscaler-sample-app/
│   └── cluster-autoscaler-sample-app.yaml      # Test application manifest
└── ekscluster-terraform-manifests/             # EKS cluster configuration
    └── (EKS cluster Terraform files)
```

## Usage

### Test Scenario 1: Scale-Up Testing

This test validates that the Cluster Autoscaler correctly adds nodes when pods cannot be scheduled.

#### Step 1: Check Initial State

```bash
# View current nodes
kubectl get nodes

# Check node resource capacity
kubectl describe nodes | grep -A 5 "Allocated resources"

# Expected: 2 nodes running (min_size = 2)
```

#### Step 2: Deploy Sample Application

```bash
cd cluster-autoscaler-sample-app

# Apply the test deployment
kubectl apply -f cluster-autoscaler-sample-app.yaml
```

**Application Details**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ca-demo-deployment
spec:
  replicas: 30  # Intentionally high to trigger scaling
  template:
    spec:
      containers:
      - name: ca-nginx
        image: stacksimplify/kubenginx:1.0.0
        resources:
          requests:
            cpu: "200m"      # 200 millicores per pod
            memory: "200Mi"  # 200 MiB per pod
```

**Resource Calculation**:
- Total CPU required: 30 pods × 200m = 6000m (6 cores)
- Total Memory required: 30 pods × 200Mi = 6000Mi (~6 GB)
- Current capacity (2 nodes): ~2000m CPU, ~4Gi Memory
- Result: Many pods will be Pending

#### Step 3: Monitor Pod Status

```bash
# Watch pod creation
kubectl get pods -w

# Check pending pods
kubectl get pods --field-selector=status.phase=Pending

# View pod events
kubectl describe pod ca-demo-deployment-XXXXX
```

Expected output:
```
NAME                                 READY   STATUS    RESTARTS   AGE
ca-demo-deployment-abc123-xxxxx      1/1     Running   0          1m
ca-demo-deployment-abc123-yyyyy      0/1     Pending   0          1m
...
(~20 pods in Pending state due to insufficient CPU)
```

#### Step 4: Monitor Cluster Autoscaler

```bash
# Watch Cluster Autoscaler logs
kubectl logs -f -n kube-system deployment/cluster-autoscaler

# Expected log entries:
# "Pod ca-demo-deployment-xxx is unschedulable"
# "Scale-up: setting group size to 3"
```

#### Step 5: Observe Scale-Up

```bash
# Watch nodes being added
kubectl get nodes -w

# Monitor in separate terminal
watch -n 5 'kubectl get nodes'
```

**Timeline**:
- T+0m: Application deployed, pods pending
- T+1m: Cluster Autoscaler detects unschedulable pods
- T+2m: Cluster Autoscaler requests new node
- T+3-5m: New EC2 instance launching
- T+5-7m: Node joins cluster and becomes Ready
- T+8m: Pending pods scheduled on new node

#### Step 6: Verify Scale-Up Success

```bash
# Verify all nodes are running
kubectl get nodes
# Expected: 3 nodes (max_size = 3)

# Verify all pods are running
kubectl get pods | grep ca-demo
# Expected: 30 pods in Running state

# Check the service
kubectl get svc ca-demo-service-nginx
```

#### Step 7: Access the Application

```bash
# Get LoadBalancer URL
kubectl get svc ca-demo-service-nginx -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Access the application
curl http://LOAD_BALANCER_URL

# Expected: nginx welcome page
```

### Test Scenario 2: Scale-Down Testing

This test validates that the Cluster Autoscaler removes underutilized nodes to optimize costs.

#### Step 1: Reduce Application Load

```bash
# Scale down to 1 replica
kubectl scale deployment ca-demo-deployment --replicas=1

# Verify scaling
kubectl get pods
# Expected: Only 1 pod running
```

#### Step 2: Monitor Cluster Autoscaler Evaluation

```bash
# Watch Cluster Autoscaler logs
kubectl logs -f -n kube-system deployment/cluster-autoscaler | grep -i "scale down"

# Expected log entries:
# "Node X is unneeded since..."
# "Scale-down: node X may be removed"
```

**Scale-Down Criteria**:
- Node utilization below threshold (default 50%)
- All pods can be moved to other nodes
- No pods with local storage (unless configured)
- No standalone pods (must have a controller)
- Scale-down delay elapsed (default 10 minutes)

#### Step 3: Wait for Scale-Down Delay

The Cluster Autoscaler waits before removing nodes to prevent flapping:

```bash
# Monitor node status
watch -n 30 'kubectl get nodes'

# Check node utilization
kubectl top nodes
```

**Default Delays**:
- `scale-down-delay-after-add`: 10 minutes (after node added)
- `scale-down-unneeded-time`: 10 minutes (node underutilized)

#### Step 4: Observe Scale-Down

After the delay period:

```bash
# Watch nodes being removed
kubectl get nodes -w

# Monitor Cluster Autoscaler
kubectl logs -n kube-system deployment/cluster-autoscaler | tail -50
```

**Timeline**:
- T+0m: Deployment scaled to 1 replica
- T+0-10m: Cluster Autoscaler evaluates nodes
- T+10m: Scale-down decision made
- T+11m: Node cordoned (new pods won't schedule)
- T+11m: Pods on node drained safely
- T+12m: Node removed from cluster
- T+13m: EC2 instance terminated

#### Step 5: Verify Scale-Down Success

```bash
# Verify node count
kubectl get nodes
# Expected: 2 nodes (min_size = 2)

# Verify pod is still running
kubectl get pods
# Expected: 1 pod running on remaining nodes

# Verify service still accessible
kubectl get svc ca-demo-service-nginx
curl http://LOAD_BALANCER_URL
```

### Test Scenario 3: Maximum Capacity Testing

This test validates that the Cluster Autoscaler respects the `max_size` limit.

#### Step 1: Exceed Maximum Capacity

```bash
# Scale to a very high number
kubectl scale deployment ca-demo-deployment --replicas=100

# Monitor pods
kubectl get pods | grep Pending | wc -l
```

#### Step 2: Observe Cluster Autoscaler Behavior

```bash
# Watch logs
kubectl logs -n kube-system deployment/cluster-autoscaler | grep -i "max\|limit"

# Expected log entries:
# "max node group size reached"
# "skipping node group - max size reached"
```

#### Step 3: Verify Limit Enforcement

```bash
# Check node count
kubectl get nodes
# Expected: Still 3 nodes (max_size = 3)

# Check pending pods
kubectl get pods --field-selector=status.phase=Pending
# Expected: Many pods still pending due to max capacity reached
```

### Test Scenario 4: Node Affinity and Constraints

This test validates scaling with node selectors and affinity rules.

#### Step 1: Label Nodes

```bash
# Label specific nodes
kubectl label nodes NODE_NAME workload-type=test

# Verify labels
kubectl get nodes --show-labels
```

#### Step 2: Deploy with Node Selector

Create a test manifest with node selector:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ca-demo-affinity
spec:
  replicas: 10
  selector:
    matchLabels:
      app: ca-nginx-affinity
  template:
    metadata:
      labels:
        app: ca-nginx-affinity
    spec:
      nodeSelector:
        workload-type: test
      containers:
      - name: ca-nginx
        image: stacksimplify/kubenginx:1.0.0
        resources:
          requests:
            cpu: "200m"
            memory: "200Mi"
```

#### Step 3: Monitor Behavior

```bash
# Apply deployment
kubectl apply -f ca-demo-affinity.yaml

# Watch pod scheduling
kubectl get pods -l app=ca-nginx-affinity -o wide
```

## Configuration

### Sample Application Manifest

The test application is a simple nginx deployment with specific resource requirements:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ca-demo-deployment
  labels:
    app: ca-nginx
spec:
  replicas: 30  # Adjust based on test scenario
  selector:
    matchLabels:
      app: ca-nginx
  template:
    metadata:
      labels:
        app: ca-nginx
    spec:
      containers:
      - name: ca-nginx
        image: stacksimplify/kubenginx:1.0.0
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: "200m"      # 0.2 CPU cores
            memory: "200Mi"  # 200 Megabytes
---
apiVersion: v1
kind: Service
metadata:
  name: ca-demo-service-nginx
  labels:
    app: ca-nginx
spec:
  type: LoadBalancer
  selector:
    app: ca-nginx
  ports:
  - port: 80
    targetPort: 80
```

### Key Configuration Points

**Deployment**:
- `replicas: 30`: Creates enough load to trigger scaling
- `cpu: "200m"`: Each pod requests 200 millicores
- `memory: "200Mi"`: Each pod requests 200 MiB RAM

**Service**:
- `type: LoadBalancer`: Creates AWS ELB for external access
- `port: 80`: Standard HTTP port

### Node Group Configuration

The EKS node groups should be configured with these settings for testing:

```hcl
scaling_config {
  desired_size = 2
  min_size     = 2
  max_size     = 3
}

instance_types = ["t3.large"]  # ~2 vCPU, ~8 GiB memory per node

tags = {
  "k8s.io/cluster-autoscaler/${cluster_name}" = "owned"
  "k8s.io/cluster-autoscaler/enabled" = "TRUE"
}
```

**Capacity Per Node (t3.large)**:
- CPU: ~1900m allocatable (after system reservations)
- Memory: ~7.5Gi allocatable

**Total Capacity**:
- 2 nodes: ~3800m CPU, ~15Gi memory
- 3 nodes: ~5700m CPU, ~22.5Gi memory

### Cluster Autoscaler Configuration

Key parameters that affect testing behavior:

```hcl
# In cluster-autoscaler-install.tf
set {
  name  = "extraArgs.scale-down-delay-after-add"
  value = "10m"  # Wait 10 min after scale-up before scale-down
}

set {
  name  = "extraArgs.scale-down-unneeded-time"
  value = "10m"  # Node must be unneeded for 10 min
}

set {
  name  = "extraArgs.scale-down-utilization-threshold"
  value = "0.5"  # Node utilization below 50%
}

set {
  name  = "extraArgs.scan-interval"
  value = "10s"  # How often to evaluate cluster
}
```

## Features

### 1. Realistic Load Testing

- Uses actual containerized application
- Simulates real-world resource requirements
- Tests both CPU and memory constraints

### 2. Observable Behavior

- Clear logging and events
- Easy to monitor with kubectl
- Visual confirmation of scaling actions

### 3. Multiple Test Scenarios

- Scale-up from resource pressure
- Scale-down from underutilization
- Maximum capacity limits
- Node affinity and constraints

### 4. Production-Like Configuration

- Uses LoadBalancer service
- Implements resource requests
- Follows Kubernetes best practices

### 5. Repeatable Tests

- Deterministic behavior
- Easy cleanup
- Documented procedures

## Troubleshooting

### Common Test Issues

#### 1. Pods Not Triggering Scale-Up

**Symptoms**: 30 pods deployed but all are Running on 2 nodes

**Diagnosis**:
```bash
kubectl get pods -o wide
kubectl top nodes
```

**Possible Causes**:
- Resource requests too small for cluster capacity
- Node capacity larger than expected
- Other workloads removed, freeing resources

**Solution**:
```bash
# Increase replicas or resource requests
kubectl scale deployment ca-demo-deployment --replicas=50

# Or edit resource requests
kubectl edit deployment ca-demo-deployment
# Change cpu: "500m" and memory: "500Mi"
```

#### 2. Scale-Up Stuck at Max Capacity

**Symptoms**: Nodes scaled to 3 but many pods still Pending

**Expected Behavior**: This is correct - demonstrates max_size limit

**Verification**:
```bash
# Check Cluster Autoscaler logs
kubectl logs -n kube-system deployment/cluster-autoscaler | grep -i "max"

# Expected: "skipping node group - max size reached"
```

**Solution**: This validates the max_size configuration is working

#### 3. Nodes Not Scaling Down

**Symptoms**: After reducing replicas, cluster stays at 3 nodes

**Diagnosis**:
```bash
# Check Cluster Autoscaler logs
kubectl logs -n kube-system deployment/cluster-autoscaler | grep -i "scale down"

# Check pod distribution
kubectl get pods -o wide

# Check for blocking conditions
kubectl describe node NODE_NAME
```

**Common Causes**:

**a) Insufficient Time Elapsed**
```bash
# Solution: Wait for scale-down delays (default 10 minutes)
# Monitor with:
kubectl logs -n kube-system deployment/cluster-autoscaler | grep -i "unneeded"
```

**b) Pods Without Controllers**
```bash
# Check for bare pods
kubectl get pods --all-namespaces --field-selector=metadata.ownerReferences==null

# Solution: Delete or recreate with a controller
```

**c) System Pods on Node**
```bash
# Check what's running on each node
kubectl get pods --all-namespaces -o wide | grep NODE_NAME

# DaemonSet pods are OK, but other system pods might prevent scale-down
```

**d) Pod Disruption Budget**
```bash
# Check for PDBs
kubectl get pdb --all-namespaces

# Solution: Adjust PDB or wait
```

**e) Local Storage**
```bash
# Check for pods with local storage
kubectl get pods --all-namespaces -o json | jq '.items[] | select(.spec.volumes[]?.hostPath != null)'

# Solution: Add annotation to allow eviction
kubectl annotate pod POD_NAME cluster-autoscaler.kubernetes.io/safe-to-evict="true"
```

#### 4. Service LoadBalancer Not Available

**Symptoms**: Service stuck in Pending state, no external IP

**Diagnosis**:
```bash
kubectl describe svc ca-demo-service-nginx
kubectl get events --all-namespaces | grep -i loadbalancer
```

**Solutions**:

```bash
# Check AWS Load Balancer Controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Verify service account has correct permissions
kubectl get sa -n kube-system aws-load-balancer-controller -o yaml

# Check security groups allow traffic
aws ec2 describe-security-groups --filters "Name=tag:kubernetes.io/cluster/CLUSTER_NAME,Values=owned"
```

#### 5. All Pods Scheduled on Same Node

**Symptoms**: Pods not distributed, no scale-up triggered

**Diagnosis**:
```bash
kubectl get pods -o wide
```

**Possible Cause**: Anti-affinity not configured, bin-packing too efficient

**Solution**:
```bash
# Add pod anti-affinity to spread pods
kubectl edit deployment ca-demo-deployment

# Add to spec.template.spec:
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values:
            - ca-nginx
        topologyKey: kubernetes.io/hostname
```

#### 6. Cluster Autoscaler Not Responding

**Symptoms**: No scaling events despite pending pods

**Diagnosis**:
```bash
# Check Cluster Autoscaler status
kubectl get deployment cluster-autoscaler -n kube-system
kubectl get pods -n kube-system | grep cluster-autoscaler

# Check logs for errors
kubectl logs -n kube-system deployment/cluster-autoscaler
```

**Common Issues**:

```bash
# IAM permission errors
# Look for: "AccessDenied" in logs
# Solution: Verify IAM role and policy

# OIDC provider issues
# Look for: "AssumeRole" errors
# Solution: Check OIDC provider configuration

# Node group tag issues
# Look for: "No node groups found"
# Solution: Verify tags on Auto Scaling groups
aws autoscaling describe-auto-scaling-groups \
  --query "AutoScalingGroups[?Tags[?Key=='k8s.io/cluster-autoscaler/enabled']].AutoScalingGroupName"
```

### Debugging Commands

```bash
# Comprehensive cluster status
kubectl get nodes,pods,svc,deployment

# Resource utilization
kubectl top nodes
kubectl top pods

# Cluster Autoscaler status
kubectl describe configmap cluster-autoscaler-status -n kube-system

# Events timeline
kubectl get events --all-namespaces --sort-by='.lastTimestamp' | tail -50

# Pod placement
kubectl get pods -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName,STATUS:.status.phase

# Detailed node information
kubectl describe nodes

# Auto Scaling group status
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names $(aws eks describe-nodegroup \
    --cluster-name CLUSTER_NAME \
    --nodegroup-name NODE_GROUP_NAME \
    --query 'nodegroup.resources.autoScalingGroups[0].name' \
    --output text)
```

### Monitoring Scale Events

```bash
# Real-time monitoring script
#!/bin/bash
watch -n 5 '
echo "=== NODES ==="
kubectl get nodes
echo ""
echo "=== PODS ==="
kubectl get pods | grep ca-demo
echo ""
echo "=== AUTOSCALER LOGS (last 5 lines) ==="
kubectl logs -n kube-system deployment/cluster-autoscaler --tail=5
'
```

## Best Practices

### 1. Start with Small Tests

```bash
# Begin with fewer replicas to understand baseline
kubectl apply -f cluster-autoscaler-sample-app.yaml
kubectl scale deployment ca-demo-deployment --replicas=5

# Gradually increase
kubectl scale deployment ca-demo-deployment --replicas=15
kubectl scale deployment ca-demo-deployment --replicas=30
```

### 2. Monitor During Tests

```bash
# Always watch logs during testing
kubectl logs -f -n kube-system deployment/cluster-autoscaler

# Monitor in separate terminals:
# Terminal 1: kubectl get pods -w
# Terminal 2: kubectl get nodes -w
# Terminal 3: kubectl logs -f -n kube-system deployment/cluster-autoscaler
```

### 3. Document Test Results

Record observations:
- Time to detect unschedulable pods
- Time to provision new node
- Time to drain and remove node
- Any errors or unexpected behavior

### 4. Clean Up After Tests

```bash
# Remove test deployment
kubectl delete -f cluster-autoscaler-sample-app.yaml

# Verify cleanup
kubectl get pods
kubectl get svc

# Wait for scale-down to minimum
kubectl get nodes -w
```

### 5. Test Edge Cases

```bash
# Test rapid scaling
kubectl scale deployment ca-demo-deployment --replicas=50
sleep 60
kubectl scale deployment ca-demo-deployment --replicas=1

# Test with different resource profiles
# Edit deployment to use different CPU/memory requests

# Test with pod disruption budgets
kubectl apply -f - <<EOF
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: ca-demo-pdb
spec:
  minAvailable: 5
  selector:
    matchLabels:
      app: ca-nginx
EOF
```

### 6. Validate Cost Impact

```bash
# Check EC2 instance costs
# t3.large on-demand pricing: ~$0.0832/hour

# Calculate test costs:
# 2 nodes (baseline): $0.1664/hour
# 3 nodes (scaled): $0.2496/hour

# Monitor actual scaling duration
# Total cost = (baseline hours × 2) + (scaled hours × 1)
```

### 7. Test in Non-Production First

- Use separate test cluster or namespace
- Validate configuration before production deployment
- Document expected vs actual behavior
- Test during maintenance windows

### 8. Automate Testing

Create a test script:

```bash
#!/bin/bash
# cluster-autoscaler-test.sh

echo "Starting Cluster Autoscaler Test"
echo "================================="

# Check prerequisites
echo "Checking prerequisites..."
kubectl get deployment cluster-autoscaler -n kube-system || exit 1

# Record initial state
echo "Initial node count:"
kubectl get nodes | grep Ready | wc -l

# Deploy test app
echo "Deploying test application..."
kubectl apply -f cluster-autoscaler-sample-app.yaml

# Wait for scale-up
echo "Waiting for scale-up (this may take 5-7 minutes)..."
for i in {1..20}; do
  NODE_COUNT=$(kubectl get nodes | grep Ready | wc -l)
  echo "Current node count: $NODE_COUNT"
  if [ $NODE_COUNT -ge 3 ]; then
    echo "Scale-up successful!"
    break
  fi
  sleep 30
done

# Verify all pods running
RUNNING_PODS=$(kubectl get pods | grep ca-demo | grep Running | wc -l)
echo "Running pods: $RUNNING_PODS / 30"

# Test scale-down
echo "Testing scale-down..."
kubectl scale deployment ca-demo-deployment --replicas=1

echo "Waiting for scale-down (this may take 10-15 minutes)..."
sleep 600

NODE_COUNT=$(kubectl get nodes | grep Ready | wc -l)
echo "Final node count: $NODE_COUNT"

echo "Test complete!"
```

### 9. Understand Timing

**Typical Timings**:
- Cluster Autoscaler scan interval: 10 seconds
- Detection of unschedulable pods: < 1 minute
- AWS API call to add node: < 1 minute
- EC2 instance launch: 2-4 minutes
- Node join and ready: 1-2 minutes
- **Total scale-up time: 5-7 minutes**

- Scale-down delay after add: 10 minutes
- Scale-down unneeded time: 10 minutes
- Node drain: 1-2 minutes
- **Total scale-down time: 20-25 minutes**

### 10. Test Failure Scenarios

```bash
# Temporarily break IAM permissions (in test environment only)
# Observe error handling

# Delete Cluster Autoscaler pod
kubectl delete pod -n kube-system -l app.kubernetes.io/name=aws-cluster-autoscaler
# Verify it recovers

# Manually cordon a node
kubectl cordon NODE_NAME
# Deploy test app and verify scheduling works
```
