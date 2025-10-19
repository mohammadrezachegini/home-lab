# EKS Cluster Autoscaler

## Overview

This project demonstrates the implementation of Kubernetes Cluster Autoscaler on Amazon EKS. Cluster Autoscaler automatically adjusts the size of the Kubernetes cluster when pods fail to launch due to insufficient resources or when nodes in the cluster are underutilized for an extended period.

The Cluster Autoscaler works at the node level, adding or removing EC2 instances from your EKS node groups based on resource demands. It integrates with AWS Auto Scaling Groups to provision or terminate nodes dynamically.

## Architecture

### How Cluster Autoscaler Works

```
┌─────────────────────────────────────────────────────────────┐
│                      EKS Cluster                            │
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │   Pod (Pending)        │  Cluster     │                │
│  │   Insufficient         │  Autoscaler  │                │
│  │   Resources   │        │  Controller  │                │
│  └──────┬────────┘        └──────┬───────┘                │
│         │                         │                         │
│         │   1. Detects Pending    │                         │
│         └────────────────────────>│                         │
│                                   │                         │
│                      2. Requests  │                         │
│                      Scale Up     │                         │
└───────────────────────────────────┼─────────────────────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │  AWS Auto Scaling     │
                        │  Group                │
                        │                       │
                        │  3. Launches New      │
                        │     EC2 Instance      │
                        └───────────────────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │  New Node Joins       │
                        │  Cluster              │
                        │                       │
                        │  4. Pod Scheduled     │
                        └───────────────────────┘
```

### Key Components

1. **Cluster Autoscaler Pod**: Runs as a deployment in the kube-system namespace
2. **AWS Auto Scaling Groups**: EC2 instances managed by ASG
3. **IAM Roles**: Permissions for Cluster Autoscaler to modify ASG
4. **Demo Application**: Sample nginx deployment to test scaling behavior

### Scaling Decisions

**Scale Up Triggered When:**
- Pods are in Pending state due to insufficient CPU/memory
- No suitable node exists to schedule the pod
- Adding a node would help schedule the pending pods

**Scale Down Triggered When:**
- Node utilization falls below threshold (default: 50%)
- All pods on the node can be moved to other nodes
- Node has been underutilized for a period (default: 10 minutes)

## Prerequisites

### Required Tools
- AWS CLI (v2.x or later)
- kubectl (v1.24 or later)
- eksctl (v0.140.0 or later)
- An existing EKS cluster with managed node groups

### AWS Permissions

The Cluster Autoscaler requires an IAM role with the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "autoscaling:DescribeAutoScalingGroups",
        "autoscaling:DescribeAutoScalingInstances",
        "autoscaling:DescribeLaunchConfigurations",
        "autoscaling:DescribeScalingActivities",
        "autoscaling:DescribeTags",
        "autoscaling:SetDesiredCapacity",
        "autoscaling:TerminateInstanceInAutoScalingGroup",
        "ec2:DescribeImages",
        "ec2:DescribeInstanceTypes",
        "ec2:DescribeLaunchTemplateVersions",
        "ec2:GetInstanceTypesFromInstanceRequirements",
        "eks:DescribeNodegroup"
      ],
      "Resource": ["*"]
    }
  ]
}
```

### Cluster Requirements
- EKS cluster version 1.24 or later
- Managed node groups with Auto Scaling enabled
- Metrics Server installed (for resource monitoring)

## Project Structure

```
EKS-Autoscaling-Cluster-Autoscaler/
├── README.md
└── kube-manifests/
    └── 01-kubenginx-Deployment-Service.yml    # Demo application for testing
```

### File Descriptions

- **01-kubenginx-Deployment-Service.yml**: Sample nginx deployment with defined resource requests to demonstrate cluster autoscaling behavior

## Usage

### Step 1: Install Cluster Autoscaler

#### Option A: Using eksctl (Recommended)

```bash
# Create an IAM service account for Cluster Autoscaler
eksctl create iamserviceaccount \
  --cluster=<your-cluster-name> \
  --namespace=kube-system \
  --name=cluster-autoscaler \
  --attach-policy-arn=arn:aws:iam::<account-id>:policy/AmazonEKSClusterAutoscalerPolicy \
  --override-existing-serviceaccounts \
  --approve

# Deploy Cluster Autoscaler
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/cluster-autoscaler/cloudprovider/aws/examples/cluster-autoscaler-autodiscover.yaml

# Patch the deployment with your cluster name
kubectl patch deployment cluster-autoscaler \
  -n kube-system \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"cluster-autoscaler","command":["./cluster-autoscaler","--v=4","--stderrthreshold=info","--cloud-provider=aws","--skip-nodes-with-local-storage=false","--expander=least-waste","--node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/<YOUR-CLUSTER-NAME>","--balance-similar-node-groups","--skip-nodes-with-system-pods=false"]}]}}}}'

# Set the image to a version matching your cluster
kubectl set image deployment cluster-autoscaler \
  -n kube-system \
  cluster-autoscaler=registry.k8s.io/autoscaling/cluster-autoscaler:v1.28.0
```

#### Option B: Using Helm

```bash
# Add the autoscaler Helm repository
helm repo add autoscaler https://kubernetes.github.io/autoscaler
helm repo update

# Install Cluster Autoscaler
helm install cluster-autoscaler autoscaler/cluster-autoscaler \
  --namespace kube-system \
  --set autoDiscovery.clusterName=<your-cluster-name> \
  --set awsRegion=<your-region> \
  --set rbac.serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=arn:aws:iam::<account-id>:role/<role-name>
```

### Step 2: Verify Cluster Autoscaler Installation

```bash
# Check if Cluster Autoscaler pod is running
kubectl get pods -n kube-system | grep cluster-autoscaler

# View Cluster Autoscaler logs
kubectl logs -f deployment/cluster-autoscaler -n kube-system

# Expected log output:
# I1018 10:00:00.000000       1 auto_scaling_groups.go:123] Regenerating instance to ASG map
# I1018 10:00:00.000000       1 auto_scaling_groups.go:456] Registering ASG eks-nodegroup-xxxxx
```

### Step 3: Configure Node Groups

Ensure your node groups have the required tags:

```bash
# Tag your Auto Scaling Group
aws autoscaling create-or-update-tags \
  --tags \
  ResourceId=<asg-name>,ResourceType=auto-scaling-group,Key=k8s.io/cluster-autoscaler/<cluster-name>,Value=owned,PropagateAtLaunch=true \
  ResourceId=<asg-name>,ResourceType=auto-scaling-group,Key=k8s.io/cluster-autoscaler/enabled,Value=true,PropagateAtLaunch=true
```

### Step 4: Deploy Demo Application

```bash
# Deploy the demo nginx application
kubectl apply -f kube-manifests/01-kubenginx-Deployment-Service.yml

# Verify deployment
kubectl get deployments
kubectl get pods
kubectl get svc
```

### Step 5: Test Scale Up

```bash
# Scale the deployment to trigger node addition
kubectl scale deployment ca-demo-deployment --replicas=50

# Watch the pods (many will be Pending initially)
kubectl get pods -w

# In another terminal, watch nodes being added
kubectl get nodes -w

# Check Cluster Autoscaler activity
kubectl logs -f deployment/cluster-autoscaler -n kube-system

# Expected log output:
# I1018 10:05:00.000000       1 scale_up.go:468] Scale-up: setting group eks-nodegroup-xxxxx size to 3
```

### Step 6: Test Scale Down

```bash
# Scale the deployment back down
kubectl scale deployment ca-demo-deployment --replicas=1

# Wait 10-15 minutes for scale-down cooldown period
# Watch nodes being removed
kubectl get nodes -w

# Monitor Cluster Autoscaler logs
kubectl logs -f deployment/cluster-autoscaler -n kube-system
```

### Step 7: Access Demo Application

```bash
# Get the node external IP
kubectl get nodes -o wide

# Access the application
curl http://<node-external-ip>:31233
```

## Configuration

### Cluster Autoscaler Configuration Options

Edit the Cluster Autoscaler deployment to customize behavior:

```yaml
command:
  - ./cluster-autoscaler
  - --v=4                                    # Verbosity level (0-4)
  - --stderrthreshold=info
  - --cloud-provider=aws
  - --skip-nodes-with-local-storage=false
  - --expander=least-waste                   # Node selection strategy
  - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/<cluster-name>
  - --balance-similar-node-groups           # Balance across AZs
  - --skip-nodes-with-system-pods=false
  - --scale-down-delay-after-add=10m        # Wait time after scale-up
  - --scale-down-unneeded-time=10m          # Time before scale-down
  - --scale-down-utilization-threshold=0.5   # Node utilization threshold
```

### Important Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `--scale-down-delay-after-add` | Wait time after adding node before considering scale down | 10m |
| `--scale-down-unneeded-time` | How long a node should be unneeded before it is eligible for scale down | 10m |
| `--scale-down-utilization-threshold` | Node utilization level below which a node can be considered for scale down | 0.5 |
| `--max-node-provision-time` | Maximum time autoscaler waits for node to be provisioned | 15m |
| `--expander` | Strategy for selecting which node group to expand (random, most-pods, least-waste, priority) | random |

### Expander Strategies

1. **least-waste**: Selects the node group that will have the least idle CPU after scale-up
2. **most-pods**: Selects the node group that can schedule the most pods
3. **priority**: Selects based on priorities you assign to node groups
4. **random**: Selects a random node group

### Demo Application Configuration

The demo deployment (`01-kubenginx-Deployment-Service.yml`) includes:

```yaml
resources:
  requests:
    cpu: "200m"       # 200 millicores per pod
    memory: "200Mi"   # 200 MiB per pod
```

**Resource Calculation:**
- Standard t3.medium node: 2 vCPU, 4 GB RAM
- Each pod requires: 200m CPU, 200Mi memory
- Approximate pods per node: ~8-9 pods (accounting for system overhead)

## Features

### Automatic Node Provisioning
- Detects pending pods due to insufficient resources
- Automatically provisions new nodes from Auto Scaling Groups
- Supports multiple node groups with different instance types

### Intelligent Scale Down
- Removes underutilized nodes to reduce costs
- Respects PodDisruptionBudgets during scale-down
- Drains nodes gracefully before termination

### Multi-AZ Support
- Balances nodes across availability zones
- Supports zone-based Auto Scaling Groups
- Maintains high availability during scaling


### Safe Pod Eviction
- Respects pod anti-affinity rules
- Honors PodDisruptionBudgets
- Skips pods with local storage (configurable)
- Avoids evicting system pods (configurable)

## Troubleshooting

### Issue: Cluster Autoscaler Not Scaling Up

**Symptoms:**
- Pods stuck in Pending state
- No new nodes being added
- Cluster Autoscaler logs show "No expansion option available"

**Solutions:**

```bash
# Check Cluster Autoscaler logs
kubectl logs deployment/cluster-autoscaler -n kube-system | grep -i "scale"

# Verify IAM permissions
kubectl describe sa cluster-autoscaler -n kube-system

# Check Auto Scaling Group limits
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names <asg-name> \
  --query 'AutoScalingGroups[*].[MinSize,MaxSize,DesiredCapacity]'

# Ensure MaxSize is not reached
# Update MaxSize if needed:
aws autoscaling update-auto-scaling-group \
  --auto-scaling-group-name <asg-name> \
  --max-size 10
```

### Issue: Nodes Not Scaling Down

**Symptoms:**
- Underutilized nodes remain in cluster
- Scale-down not happening after pods are removed

**Solutions:**

```bash
# Check for pods preventing scale-down
kubectl get pods --all-namespaces -o wide

# Look for pods with local storage or system pods
kubectl describe node <node-name> | grep -A 10 "Non-terminated Pods"

# Check scale-down candidate nodes
kubectl logs deployment/cluster-autoscaler -n kube-system | grep "scale-down"

# Common blockers:
# 1. Pods without controller (standalone pods)
# 2. Pods with local storage
# 3. System pods without PodDisruptionBudget
# 4. Pods with restrictive PodDisruptionBudget

# Force allow system pod eviction (use with caution):
kubectl patch deployment cluster-autoscaler -n kube-system --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/command/-", "value": "--skip-nodes-with-system-pods=false"}]'
```

### Issue: IAM Permission Errors

**Symptoms:**
- Cluster Autoscaler logs show "AccessDenied" errors
- Scale operations fail

**Solutions:**

```bash
# Verify service account annotation
kubectl describe sa cluster-autoscaler -n kube-system

# Check IAM role trust relationship
aws iam get-role --role-name <role-name> --query 'Role.AssumeRolePolicyDocument'

# Verify IAM policy is attached
aws iam list-attached-role-policies --role-name <role-name>

# Re-create service account if needed
eksctl delete iamserviceaccount --cluster=<cluster-name> --name=cluster-autoscaler --namespace=kube-system
eksctl create iamserviceaccount --cluster=<cluster-name> --name=cluster-autoscaler --namespace=kube-system --attach-policy-arn=<policy-arn> --approve
```

### Issue: Wrong Cluster Autoscaler Version

**Symptoms:**
- API compatibility errors
- Unexpected behavior

**Solutions:**

```bash
# Check your EKS version
kubectl version --short

# Use matching Cluster Autoscaler version
# EKS 1.28 -> CA v1.28.x
# EKS 1.27 -> CA v1.27.x
# EKS 1.26 -> CA v1.26.x

# Update to correct version
kubectl set image deployment/cluster-autoscaler \
  -n kube-system \
  cluster-autoscaler=registry.k8s.io/autoscaling/cluster-autoscaler:v1.28.0
```

### Issue: Nodes Added but Pods Still Pending

**Symptoms:**
- New nodes join the cluster
- Pods remain in Pending state

**Solutions:**

```bash
# Check pod events
kubectl describe pod <pod-name>

# Common causes:
# 1. Node selector/affinity mismatch
# 2. Taints and tolerations
# 3. Resource requests too large for node type

# Verify node labels
kubectl get nodes --show-labels

# Check node taints
kubectl describe node <node-name> | grep Taints

# Review pod scheduling constraints
kubectl get pod <pod-name> -o yaml | grep -A 10 "nodeSelector\|affinity"
```

### Debug Commands

```bash
# Enable debug logging
kubectl edit deployment cluster-autoscaler -n kube-system
# Change --v=4 to --v=5 for more verbose output

# Watch autoscaler events
kubectl get events --all-namespaces --sort-by='.lastTimestamp' | grep -i autoscal

# Check node resource allocation
kubectl describe nodes | grep -A 5 "Allocated resources"

# View Auto Scaling Group activities
aws autoscaling describe-scaling-activities \
  --auto-scaling-group-name <asg-name> \
  --max-records 20

# Test with simpler pod
kubectl run test-pod --image=nginx --requests='cpu=100m,memory=128Mi'
```

## Best Practices

### 1. Resource Requests Are Mandatory

Always define resource requests for all containers:

```yaml
resources:
  requests:
    cpu: "200m"
    memory: "200Mi"
  limits:
    cpu: "500m"
    memory: "500Mi"
```

Without requests, Cluster Autoscaler cannot determine pod resource requirements.

### 2. Set Appropriate ASG Limits

```bash
# Configure realistic min/max values
aws autoscaling update-auto-scaling-group \
  --auto-scaling-group-name <asg-name> \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 2
```

- **Min Size**: Ensures minimum availability (usually 2-3)
- **Max Size**: Prevents runaway costs (set based on budget)
- **Desired Capacity**: Starting point for the cluster

### 3. Use PodDisruptionBudgets

Protect critical applications during scale-down:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: ca-demo-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: ca-nginx
```

### 4. Use Multiple Node Groups

Separate node groups for different workload types:

```bash
# Create node group for general workloads
eksctl create nodegroup \
  --cluster=<cluster-name> \
  --name=general-workloads \
  --node-type=t3.medium \
  --nodes-min=2 \
  --nodes-max=10

# Create node group for memory-intensive workloads
eksctl create nodegroup \
  --cluster=<cluster-name> \
  --name=memory-intensive \
  --node-type=r5.large \
  --nodes-min=0 \
  --nodes-max=5
```

### 5. Monitor Cluster Autoscaler Metrics

```bash
# Install Prometheus and Grafana
kubectl create namespace monitoring

# Deploy kube-prometheus-stack
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring

# Access Grafana dashboard
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Import Cluster Autoscaler dashboard (ID: 3831)
```

### 6. Configure Proper Cooldown Periods

Adjust based on your workload patterns:

```yaml
# For stable workloads - longer cooldown
--scale-down-delay-after-add=15m
--scale-down-unneeded-time=15m

# For variable workloads - shorter cooldown
--scale-down-delay-after-add=5m
--scale-down-unneeded-time=5m
```

### 7. Use Expander Strategy Wisely

```yaml
# For cost optimization
--expander=least-waste

# For maximum pod density
--expander=most-pods

# For custom priorities
--expander=priority
```

### 8. Tag Resources Properly

Ensure all resources have proper tags:

```bash
# Node group tags
k8s.io/cluster-autoscaler/<cluster-name>: owned
k8s.io/cluster-autoscaler/enabled: true

# Additional tags for organization
Environment: production
Team: platform
ManagedBy: cluster-autoscaler
```

### 9. Test Autoscaling Regularly

```bash
# Create a test script
cat << 'EOF' > test-autoscaling.sh
#!/bin/bash
echo "Testing scale up..."
kubectl scale deployment ca-demo-deployment --replicas=50
sleep 300

echo "Checking nodes..."
kubectl get nodes

echo "Testing scale down..."
kubectl scale deployment ca-demo-deployment --replicas=1
sleep 900

echo "Final node count..."
kubectl get nodes
EOF

chmod +x test-autoscaling.sh
./test-autoscaling.sh
```

### 10. Implement Cost Controls

```bash
# Use Spot instances for cost savings
eksctl create nodegroup \
  --cluster=<cluster-name> \
  --name=spot-nodes \
  --spot \
  --instance-types=t3.medium,t3a.medium \
  --nodes-min=0 \
  --nodes-max=10

# Set budget alerts
aws budgets create-budget \
  --account-id <account-id> \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

## Related Projects

### In This Repository
- **EKS-HPA-Horizontal-Pod-Autoscaler**: Scales pods based on CPU/memory metrics
- **EKS-VPA-Vertical-Pod-Autoscaler**: Adjusts pod resource requests/limits

### Complementary Projects
- **EKS-Karpenter**: Modern alternative to Cluster Autoscaler with faster provisioning
- **EKS-Metrics-Server**: Required for HPA and resource monitoring
- **EKS-Prometheus-Monitoring**: Monitoring and alerting for autoscaling events

### Scaling Strategy Comparison

| Aspect | Cluster Autoscaler | HPA | VPA |
|--------|-------------------|-----|-----|
| **What it scales** | Nodes (EC2 instances) | Pod replicas | Pod resources |
| **Trigger** | Pending pods | CPU/Memory metrics | Resource utilization |
| **Response time** | 2-5 minutes | 30-60 seconds | Minutes to hours |
| **Use case** | Cluster capacity | Traffic spikes | Resource optimization |

**Combined Strategy:**
1. HPA scales pods for traffic spikes (fast)
2. Cluster Autoscaler adds nodes when needed (medium)
3. VPA optimizes resource requests over time (slow)

