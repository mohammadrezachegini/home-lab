# Kubernetes Deployments with YAML

## Overview

This project demonstrates Kubernetes Deployments, the recommended way to deploy and manage stateless applications in production. Deployments provide declarative updates for Pods and ReplicaSets, along with powerful features like rolling updates, rollbacks, and version history. This is the production-grade controller you should use for most stateless workloads in Kubernetes.

## Kubernetes Concepts

### What is a Deployment?

A **Deployment** is a higher-level Kubernetes controller that manages ReplicaSets and provides declarative updates to Pods. It's the standard way to deploy applications in Kubernetes.

**Key Characteristics:**

- **Declarative Updates**: Describe the desired state, Kubernetes makes it happen
- **Rolling Updates**: Update Pods gradually with zero downtime
- **Rollback Capability**: Easily revert to previous versions
- **Version History**: Maintains history of ReplicaSet versions
- **Automatic ReplicaSet Management**: Creates and manages ReplicaSets automatically
- **Self-Healing**: Inherits all ReplicaSet self-healing capabilities
- **Scaling**: Horizontal scaling with one command

### Deployment vs ReplicaSet vs Pod

| Feature | Pod | ReplicaSet | Deployment |
|---------|-----|------------|------------|
| Self-Healing | No | Yes | Yes |
| Scaling | No | Yes | Yes |
| Rolling Updates | No | No | Yes |
| Rollback | No | No | Yes |
| Version History | No | No | Yes |
| Production Use | No | Not recommended | Yes (Recommended) |

### How Deployments Work

1. **You define** a Deployment with desired Pod template and replica count
2. **Deployment creates** a ReplicaSet with that specification
3. **ReplicaSet creates** the specified number of Pods
4. **When you update** the Deployment, it creates a new ReplicaSet
5. **Gradually scales** new ReplicaSet up and old ReplicaSet down
6. **Maintains availability** throughout the update process

### Deployment Strategies

**RollingUpdate (Default)**
- Updates Pods gradually
- Maintains minimum availability
- Zero downtime deployments
- Configurable rollout speed

**Recreate**
- Terminates all old Pods
- Then creates new Pods
- Causes downtime
- Useful for applications that can't run multiple versions

### Deployment Status

- **Progressing**: Deployment is in the process of rolling out
- **Complete**: All replicas updated successfully
- **Failed**: Update failed, often with rollback

## Prerequisites

Before working with this project, ensure you have:

- **Kubernetes Cluster**: A running Kubernetes cluster (minikube, kind, Docker Desktop, or cloud provider)
- **kubectl**: Kubernetes command-line tool installed and configured
- **Prior Knowledge**:
  - Understanding of Pods (PODs-with-YAML project)
  - Understanding of ReplicaSets (ReplicaSets-with-YAML project)
- **Network Access**: Ability to access NodePort services for testing

Verify your setup:
```bash
kubectl version --client
kubectl cluster-info
kubectl get nodes
```

## Project Structure

```
Deployments-with-YAML/
├── README.md
└── kube-manifests/
    ├── 01-kube-base-definition.yml    # Template showing base Kubernetes YAML structure
    ├── 02-deployment-definition.yml   # Deployment manifest with 3 replicas
    └── 03-deployment-nodeport.yml     # NodePort Service to expose Deployment Pods
```

## YAML Manifests

### 1. Base Definition Template (01-kube-base-definition.yml)

This file serves as a template showing the basic structure of any Kubernetes YAML manifest:

```yaml
apiVersion:
kind:
metadata:

spec:
```

### 2. Deployment Definition (02-deployment-definition.yml)

This manifest creates a Deployment managing 3 identical Nginx Pods:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp3-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp3
  template:
    metadata:
      name: myapp3-pod
      labels:
        app: myapp3
    spec:
      containers:
      - name: myapp3-container
        image: stacksimplify/kubenginx:3.0.0
        ports:
        - containerPort: 80
```

**Key Elements:**

- **apiVersion: apps/v1**: Deployments are in the apps/v1 API group
- **kind: Deployment**: Specifies this is a Deployment resource
- **metadata.name**: Unique name for the Deployment (myapp3-deployment)
- **spec.replicas: 3**: Desired number of Pod replicas
- **spec.selector.matchLabels**: How Deployment identifies its Pods
- **spec.template**: Pod template (identical to ReplicaSet template)
  - Contains complete Pod specification
  - Labels must match selector

**Deployment-Specific Fields** (with defaults):
```yaml
spec:
  strategy:
    type: RollingUpdate  # Default strategy
    rollingUpdate:
      maxSurge: 25%       # Max extra Pods during update
      maxUnavailable: 25% # Max unavailable Pods during update
  revisionHistoryLimit: 10  # Number of old ReplicaSets to retain
```

### 3. NodePort Service (03-deployment-nodeport.yml)

This Service load balances traffic across all Deployment Pods:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: deployment-nodeport-service

spec:
  type: NodePort
  selector:
    app: myapp3
  ports:
  - name: http
    port: 80
    targetPort: 80
    nodePort: 31233
```

**Key Elements:**

- **selector.app: myapp3**: Matches all Pods with label `app: myapp3`
- **type: NodePort**: Exposes Service on each Node's IP
- **nodePort: 31233**: External port (unique from other examples)
- **Automatic Updates**: Service automatically includes new Pods from updates

## Usage

### Step 1: Create the Deployment

Apply the Deployment manifest:

```bash
# Navigate to the manifests directory
cd /Users/reza/home-lab/K8S-Fundamentals/Deployments-with-YAML/kube-manifests

# Create the Deployment
kubectl apply -f 02-deployment-definition.yml

# Verify Deployment creation
kubectl get deployments
kubectl get deploy myapp3-deployment

# Check detailed Deployment status
kubectl describe deploy myapp3-deployment

# View the ReplicaSet created by Deployment
kubectl get replicasets
kubectl get rs -l app=myapp3

# View the Pods created by Deployment
kubectl get pods
kubectl get pods -l app=myapp3
kubectl get pods -o wide
```

**Expected Output:**
```
NAME                 READY   UP-TO-DATE   AVAILABLE   AGE
myapp3-deployment    3/3     3            3           10s
```

**Understanding the Output:**
- **READY**: Number of ready Pods / desired Pods
- **UP-TO-DATE**: Pods updated to latest template
- **AVAILABLE**: Pods available to users
- **AGE**: Time since Deployment created

### Step 2: Observe the Hierarchy

See how Deployment, ReplicaSet, and Pods are related:

```bash
# View all related resources
kubectl get all -l app=myapp3

# See the ownership chain
kubectl get pods -l app=myapp3 -o yaml | grep -A 10 ownerReferences

# Deployment owns ReplicaSet
# ReplicaSet owns Pods
```

**Resource Naming:**
- Deployment: `myapp3-deployment`
- ReplicaSet: `myapp3-deployment-<hash>` (auto-generated)
- Pods: `myapp3-deployment-<hash>-<random>` (auto-generated)

### Step 3: Create the NodePort Service

Expose the Deployment through a Service:

```bash
# Create the Service
kubectl apply -f 03-deployment-nodeport.yml

# Verify Service creation
kubectl get services
kubectl get svc deployment-nodeport-service

# Check Service endpoints (should show 3 Pod IPs)
kubectl get endpoints deployment-nodeport-service

# Describe the Service
kubectl describe svc deployment-nodeport-service
```

### Step 4: Access the Application

Test the application:

```bash
# Get Node IP (for minikube)
minikube ip

# Access the application
curl http://<NODE_IP>:31233

# For minikube, use service command
minikube service deployment-nodeport-service

# For Docker Desktop
curl http://localhost:31233

# Test load balancing
for i in {1..10}; do curl http://<NODE_IP>:31233; sleep 1; done
```

### Step 5: Perform a Rolling Update

Update the application to a new version with zero downtime:

**Method 1: Update YAML and reapply**
```bash
# Edit 02-deployment-definition.yml
# Change image from stacksimplify/kubenginx:3.0.0 to :4.0.0

# Apply the update
kubectl apply -f 02-deployment-definition.yml

# Watch the rolling update in real-time
kubectl rollout status deployment myapp3-deployment

# In another terminal, watch Pods
kubectl get pods -l app=myapp3 -w

# You'll see:
# - New Pods being created
# - Old Pods being terminated
# - Process happens gradually
```

**Method 2: Use kubectl set image**
```bash
# Update image directly
kubectl set image deployment/myapp3-deployment \
  myapp3-container=stacksimplify/kubenginx:4.0.0

# Watch the rollout
kubectl rollout status deployment/myapp3-deployment

# Check rollout history
kubectl rollout history deployment/myapp3-deployment
```

**What Happens During Rolling Update:**
1. Deployment creates new ReplicaSet with new template
2. Scales up new ReplicaSet by 1 (or based on maxSurge)
3. Scales down old ReplicaSet by 1 (or based on maxUnavailable)
4. Repeats until all Pods are updated
5. Maintains minimum availability throughout

### Step 6: View Rollout History

Check the version history:

```bash
# View all revisions
kubectl rollout history deployment/myapp3-deployment

# View specific revision details
kubectl rollout history deployment/myapp3-deployment --revision=1
kubectl rollout history deployment/myapp3-deployment --revision=2

# See the differences
# Each revision shows the Pod template
```

**Annotate changes for better tracking:**
```bash
# Record the change reason
kubectl apply -f 02-deployment-definition.yml --record

# Or when using set image
kubectl set image deployment/myapp3-deployment \
  myapp3-container=stacksimplify/kubenginx:4.0.0 \
  --record

# Note: --record flag is deprecated but still useful
# Better practice: Use annotations in YAML
```

### Step 7: Rollback to Previous Version

Undo an update if something goes wrong:

```bash
# Rollback to previous revision
kubectl rollout undo deployment/myapp3-deployment

# Watch the rollback
kubectl rollout status deployment/myapp3-deployment

# Verify the image version
kubectl get deployment myapp3-deployment -o yaml | grep image:

# Rollback to specific revision
kubectl rollout undo deployment/myapp3-deployment --to-revision=1

# Check rollout history after rollback
kubectl rollout history deployment/myapp3-deployment
```

**What Happens During Rollback:**
1. Deployment finds the old ReplicaSet (still exists)
2. Scales up old ReplicaSet
3. Scales down current ReplicaSet
4. Same rolling update process in reverse

### Step 8: Scale the Deployment

Scale up or down easily:

```bash
# Scale up to 5 replicas
kubectl scale deployment myapp3-deployment --replicas=5

# Verify scaling
kubectl get deployment myapp3-deployment
kubectl get pods -l app=myapp3

# Scale down to 2 replicas
kubectl scale deployment myapp3-deployment --replicas=2

# Or update YAML file and reapply
# Change replicas: 3 to replicas: 4
kubectl apply -f 02-deployment-definition.yml
```

### Step 9: Pause and Resume Rollouts

Pause rollouts for multiple changes:

```bash
# Pause the deployment
kubectl rollout pause deployment/myapp3-deployment

# Make multiple changes
kubectl set image deployment/myapp3-deployment \
  myapp3-container=stacksimplify/kubenginx:5.0.0
kubectl set resources deployment/myapp3-deployment \
  -c=myapp3-container --limits=cpu=200m,memory=128Mi

# No rollout happens yet

# Resume when ready
kubectl rollout resume deployment/myapp3-deployment

# Now all changes roll out together
kubectl rollout status deployment/myapp3-deployment
```

### Step 10: Advanced Deployment Operations

**Check Deployment details:**
```bash
# Get full YAML
kubectl get deployment myapp3-deployment -o yaml

# Get JSON output
kubectl get deployment myapp3-deployment -o json

# Get specific fields
kubectl get deployment myapp3-deployment -o jsonpath='{.spec.replicas}'

# View all ReplicaSets (including old ones)
kubectl get rs -l app=myapp3

# See which ReplicaSet is active
kubectl get rs -l app=myapp3 -o wide
```

**Monitor in real-time:**
```bash
# Watch Deployment status
kubectl get deployment myapp3-deployment -w

# Watch Pods
kubectl get pods -l app=myapp3 -w

# Watch events
kubectl get events -w
```

### Step 11: Cleanup

Remove all resources when done:

```bash
# Delete Service
kubectl delete -f 03-deployment-nodeport.yml

# Delete Deployment (this also deletes ReplicaSet and Pods)
kubectl delete -f 02-deployment-definition.yml

# Or delete by name
kubectl delete deployment myapp3-deployment
kubectl delete service deployment-nodeport-service

# Verify deletion
kubectl get deployments
kubectl get rs
kubectl get pods
kubectl get svc
```

## Key Features

### 1. Rolling Updates

Update applications with zero downtime:
- Gradual replacement of old Pods with new ones
- Configurable rollout speed
- Automatic health checking
- Stops rollout if errors occur

### 2. Rollback Capability

Easily revert problematic updates:
- One command to rollback
- Maintains revision history
- Can rollback to any previous version
- Fast recovery from bad deployments

### 3. Declarative Management

Infrastructure as Code:
- Describe desired state in YAML
- Kubernetes handles the how
- Version control friendly
- Reproducible deployments

### 4. High Availability

Inherits all ReplicaSet benefits:
- Self-healing
- Multiple replicas
- Automatic Pod replacement
- Distribution across Nodes

### 5. Progressive Delivery

Control rollout speed:
```yaml
strategy:
  rollingUpdate:
    maxSurge: 1        # Add 1 Pod at a time
    maxUnavailable: 0  # Keep all Pods available
```

### 6. Revision History

Track deployment versions:
- Default: 10 revisions kept
- View changes between revisions
- Audit trail for updates
- Compliance and debugging

### 7. Pause and Resume

Make multiple changes as one rollout:
- Pause deployments
- Make several updates
- Resume for single rollout
- Reduces churn

## Troubleshooting

### Deployment Stuck in Progress

**Problem**: Deployment shows "Progressing" for a long time

```bash
# Check Deployment status
kubectl rollout status deployment/myapp3-deployment

# Describe Deployment for events
kubectl describe deployment myapp3-deployment

# Check Pod status
kubectl get pods -l app=myapp3

# Common causes:
# - Image pull errors
# - Insufficient resources
# - Failed health checks
# - Node issues
```

**Solutions**:
```bash
# Check specific Pod
kubectl describe pod <POD-NAME>

# View Pod logs
kubectl logs <POD-NAME>

# Check events
kubectl get events --sort-by='.lastTimestamp' | head -20

# If stuck, you can rollback
kubectl rollout undo deployment/myapp3-deployment
```

### Failed Rollout

**Problem**: Update fails and Deployment shows "Failed"

```bash
# Check rollout status
kubectl rollout status deployment/myapp3-deployment

# View Deployment conditions
kubectl get deployment myapp3-deployment -o yaml | grep -A 10 conditions
```

**Solutions**:
```bash
# Rollback immediately
kubectl rollout undo deployment/myapp3-deployment

# Fix the issue in YAML
# Then reapply
kubectl apply -f 02-deployment-definition.yml
```

### Pods Not Updating

**Problem**: Applied changes but Pods show old version

```bash
# Check if Deployment was updated
kubectl describe deployment myapp3-deployment

# Verify Pod template
kubectl get deployment myapp3-deployment -o yaml | grep -A 20 template
```

**Possible Causes**:
1. **No actual change**: Deployment only rolls out if template changes
2. **Paused**: Deployment might be paused

**Solutions**:
```bash
# Check if paused
kubectl get deployment myapp3-deployment -o yaml | grep paused

# Resume if paused
kubectl rollout resume deployment/myapp3-deployment

# Force rollout (restart Pods)
kubectl rollout restart deployment/myapp3-deployment
```

### Rollback Not Working

**Problem**: Rollback command succeeds but nothing happens

```bash
# Check rollout history
kubectl rollout history deployment/myapp3-deployment

# If only one revision exists, can't rollback
```

**Solution**: Rollback requires at least 2 revisions in history.

### ImagePullBackOff After Update

**Problem**: New Pods can't pull updated image

```bash
# Check Pod status
kubectl get pods -l app=myapp3

# Describe failing Pod
kubectl describe pod <POD-NAME>

# Common causes:
# - Typo in new image name
# - Image doesn't exist
# - Registry authentication issues
```

**Solutions**:
```bash
# Rollback to working version
kubectl rollout undo deployment/myapp3-deployment

# Fix image name and reapply
kubectl apply -f 02-deployment-definition.yml

# Or use correct image with set image
kubectl set image deployment/myapp3-deployment \
  myapp3-container=stacksimplify/kubenginx:3.0.0
```

### Deployment Progressing Slowly

**Problem**: Update taking too long

```bash
# Check rollout settings
kubectl get deployment myapp3-deployment -o yaml | grep -A 5 rollingUpdate
```

**Solution**: Adjust rolling update parameters:
```yaml
strategy:
  rollingUpdate:
    maxSurge: 2        # Create more Pods at once
    maxUnavailable: 1  # Allow more downtime
```

## Best Practices

### 1. Always Use Deployments for Stateless Apps

Don't use ReplicaSets or Pods directly:
```bash
# DON'T: Create ReplicaSet directly
kubectl create -f replicaset.yml

# DO: Use Deployment
kubectl create -f deployment.yml
```

### 2. Set Resource Requests and Limits

Ensure predictable behavior:
```yaml
spec:
  template:
    spec:
      containers:
      - name: myapp3-container
        image: stacksimplify/kubenginx:3.0.0
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
```

### 3. Configure Health Checks

Add probes for reliable updates:
```yaml
spec:
  template:
    spec:
      containers:
      - name: myapp3-container
        image: stacksimplify/kubenginx:3.0.0
        livenessProbe:
          httpGet:
            path: /healthz
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
```

**Why Important:**
- Readiness probe ensures only healthy Pods receive traffic
- Liveness probe restarts unhealthy Pods
- Critical for zero-downtime rolling updates

### 4. Use Appropriate Rolling Update Strategy

Configure for your use case:

**Zero Downtime (Conservative):**
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

**Faster Rollout:**
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 25%
    maxUnavailable: 25%
```

**Quick Replace (with downtime):**
```yaml
strategy:
  type: Recreate
```

### 5. Use Labels and Annotations

Organize and document:
```yaml
metadata:
  labels:
    app: myapp3
    version: "3.0.0"
    environment: production
    tier: frontend
  annotations:
    description: "Main application frontend"
    contact: "team@example.com"
    kubernetes.io/change-cause: "Update to version 3.0.0"
```

### 6. Set Revision History Limit

Control storage usage:
```yaml
spec:
  revisionHistoryLimit: 5  # Keep only 5 old ReplicaSets
```

- Default is 10
- Set based on your rollback needs
- Lower number saves resources
- Don't set to 0 (can't rollback)

### 7. Use Progressive Rollouts

For critical updates:
```yaml
strategy:
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
spec:
  minReadySeconds: 30  # Wait 30s before marking Pod ready
```

### 8. Implement Pod Disruption Budgets

Protect availability during updates:
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: myapp3-pdb
spec:
  minAvailable: 2  # Always keep at least 2 Pods
  selector:
    matchLabels:
      app: myapp3
```

### 9. Version Your Images

Never use `:latest` tag:
```yaml
# DON'T
image: stacksimplify/kubenginx:latest

# DO
image: stacksimplify/kubenginx:3.0.0
```

**Reasons:**
- `:latest` may pull different versions
- Hard to track what's deployed
- Rollbacks become unreliable
- Not reproducible

### 10. Test Before Production

Use multiple environments:
```bash
# Deploy to dev
kubectl apply -f deployment.yml -n dev

# Test thoroughly
# Promote to staging
kubectl apply -f deployment.yml -n staging

# Final testing
# Deploy to production
kubectl apply -f deployment.yml -n production
```

### 11. Use GitOps

Manage deployments through Git:
```bash
# Store in version control
git add kube-manifests/
git commit -m "Update to version 3.0.0"
git push

# Use tools like ArgoCD or Flux
# They automatically sync Git to cluster
```

### 12. Monitor Deployments

Set up observability:
```bash
# Watch rollout status
kubectl rollout status deployment/myapp3-deployment

# Check Deployment health
kubectl get deployment myapp3-deployment

# Monitor in Prometheus/Grafana
# Set alerts for:
# - Failed deployments
# - Slow rollouts
# - Rollbacks
```

### 13. Document Changes

Use annotations to track changes:
```yaml
metadata:
  annotations:
    kubernetes.io/change-cause: "Update nginx to 3.0.0 for security patch"
    deployment.kubernetes.io/revision: "2"
    description: "Security update for CVE-2024-XXXX"
```
