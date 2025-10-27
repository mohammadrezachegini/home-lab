# Kubernetes ReplicaSets with YAML

## Overview

This project demonstrates Kubernetes ReplicaSets, a fundamental controller that ensures a specified number of identical Pod replicas are running at all times. ReplicaSets provide high availability, fault tolerance, and scalability by automatically maintaining the desired number of Pods. This project builds upon Pod concepts and introduces the critical concept of self-healing and scaling in Kubernetes.

## Kubernetes Concepts

### What is a ReplicaSet?

A **ReplicaSet** is a Kubernetes controller that maintains a stable set of replica Pods running at any given time. It's primarily used to guarantee the availability of a specified number of identical Pods.

**Key Characteristics:**

- **Desired State Management**: Maintains the specified number of Pod replicas
- **Self-Healing**: Automatically replaces Pods that fail, get deleted, or are terminated
- **Scaling**: Easily scale up or down by changing the replica count
- **Label Selectors**: Uses selectors to identify which Pods it manages
- **Pod Template**: Contains the specification for creating new Pods

### ReplicaSet vs Pod

| Feature | Pod | ReplicaSet |
|---------|-----|------------|
| Purpose | Single instance | Multiple identical instances |
| Self-healing | No | Yes |
| Scaling | Manual | Automatic |
| High Availability | No | Yes |
| Production Use | Not recommended | Better (but use Deployments) |

### How ReplicaSets Work

1. **Continuous Monitoring**: ReplicaSet controller constantly monitors the number of running Pods
2. **Comparison**: Compares actual state with desired state (replica count)
3. **Reconciliation**: If Pods are missing, creates new ones; if extra exist, deletes them
4. **Label Matching**: Uses label selectors to identify which Pods belong to it

### ReplicaSet Components

- **replicas**: The desired number of Pod copies
- **selector**: Defines how to identify Pods to manage
- **template**: Pod template used to create new Pods
- **matchLabels**: Simple equality-based selector

## Prerequisites

Before working with this project, ensure you have:

- **Kubernetes Cluster**: A running Kubernetes cluster (minikube, kind, Docker Desktop, or cloud provider)
- **kubectl**: Kubernetes command-line tool installed and configured
- **Basic Pod Knowledge**: Understanding of Pods from the PODs-with-YAML project
- **Network Access**: Ability to access NodePort services for testing

Verify your setup:
```bash
kubectl version --client
kubectl cluster-info
kubectl get nodes
```

## Project Structure

```
ReplicaSets-with-YAML/
├── README.md
└── kube-manifests/
    ├── 01-kube-base-definition.yml    # Template showing base Kubernetes YAML structure
    ├── 02-replicaset-definition.yml   # ReplicaSet manifest with 3 replicas
    └── 03-replicaset-nodeport.yml     # NodePort Service to expose ReplicaSet Pods
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

This reminds us that every Kubernetes resource requires these four top-level fields.

### 2. ReplicaSet Definition (02-replicaset-definition.yml)

This manifest creates a ReplicaSet managing 3 identical Nginx Pods:

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: myapp2-rs
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp2
  template:
    metadata:
      name: myapp2-pod
      labels:
        app: myapp2
    spec:
      containers:
      - name: myapp2-container
        image: stacksimplify/kubenginx:2.0.0
        ports:
        - containerPort: 80
```

**Key Elements:**

- **apiVersion: apps/v1**: ReplicaSets are in the apps/v1 API group
- **kind: ReplicaSet**: Specifies this is a ReplicaSet resource
- **metadata.name**: Unique name for the ReplicaSet (myapp2-rs)
- **spec.replicas: 3**: Desired number of Pod replicas
- **spec.selector.matchLabels**: How ReplicaSet identifies its Pods
- **spec.template**: Pod template used to create new Pods
  - Must include labels that match the selector
  - Contains complete Pod specification
- **Important**: Template labels MUST match selector labels

### 3. NodePort Service (03-replicaset-nodeport.yml)

This Service load balances traffic across all ReplicaSet Pods:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: replicaset-nodeport-service

spec:
  type: NodePort
  selector:
    app: myapp2
  ports:
  - name: http
    port: 80
    targetPort: 80
    nodePort: 31232
```

**Key Elements:**

- **selector.app: myapp2**: Matches all Pods with label `app: myapp2`
- **type: NodePort**: Exposes Service on each Node's IP at a static port
- **nodePort: 31232**: External port (different from Pod example to avoid conflicts)
- **Load Balancing**: Automatically distributes traffic across all 3 Pod replicas

## Usage

### Step 1: Create the ReplicaSet

Apply the ReplicaSet manifest:

```bash
# Navigate to the manifests directory
cd /Users/reza/home-lab/K8S-Fundamentals/ReplicaSets-with-YAML/kube-manifests

# Create the ReplicaSet
kubectl apply -f 02-replicaset-definition.yml

# Verify ReplicaSet creation
kubectl get replicasets
kubectl get rs myapp2-rs

# Check detailed ReplicaSet status
kubectl describe rs myapp2-rs

# View the Pods created by ReplicaSet
kubectl get pods
kubectl get pods -l app=myapp2
kubectl get pods -o wide
```

**Expected Output:**
```
NAME               DESIRED   CURRENT   READY   AGE
myapp2-rs          3         3         3       10s
```

### Step 2: Observe Self-Healing

Test the self-healing capability by deleting a Pod:

```bash
# List current Pods
kubectl get pods -l app=myapp2

# Delete one Pod
kubectl delete pod <POD-NAME>

# Immediately check Pods again
kubectl get pods -l app=myapp2 -w

# You'll see:
# - Deleted Pod shows Terminating status
# - New Pod automatically created by ReplicaSet
# - Total count maintained at 3
```

**What Happens:**
1. You delete a Pod manually
2. ReplicaSet controller detects only 2 Pods exist (desired: 3)
3. Controller automatically creates a new Pod
4. System returns to desired state of 3 replicas

### Step 3: Create the NodePort Service

Expose the ReplicaSet through a Service:

```bash
# Create the Service
kubectl apply -f 03-replicaset-nodeport.yml

# Verify Service creation
kubectl get services
kubectl get svc replicaset-nodeport-service

# Check Service endpoints (should show 3 Pod IPs)
kubectl get endpoints replicaset-nodeport-service

# Describe the Service
kubectl describe svc replicaset-nodeport-service
```

### Step 4: Test Load Balancing

Access the application and observe load balancing:

```bash
# Get Node IP (for minikube)
minikube ip

# Access multiple times to see load balancing
curl http://<NODE_IP>:31232
curl http://<NODE_IP>:31232
curl http://<NODE_IP>:31232

# Or use a loop
for i in {1..10}; do curl http://<NODE_IP>:31232; sleep 1; done

# For minikube, use service command
minikube service replicaset-nodeport-service

# For Docker Desktop
curl http://localhost:31232
```

Each request may be served by a different Pod (round-robin load balancing).

### Step 5: Scale the ReplicaSet

There are multiple ways to scale a ReplicaSet:

**Method 1: Using kubectl scale command**
```bash
# Scale up to 5 replicas
kubectl scale replicaset myapp2-rs --replicas=5

# Verify scaling
kubectl get rs myapp2-rs
kubectl get pods -l app=myapp2

# Scale down to 2 replicas
kubectl scale rs myapp2-rs --replicas=2

# Watch the scaling in real-time
kubectl get pods -l app=myapp2 -w
```

**Method 2: Edit the ReplicaSet directly**
```bash
# Edit live ReplicaSet
kubectl edit rs myapp2-rs

# Change replicas: 3 to replicas: 4
# Save and exit
# Pods will be created/deleted automatically
```

**Method 3: Update YAML file and reapply (Recommended)**
```bash
# Edit 02-replicaset-definition.yml
# Change replicas: 3 to replicas: 6

# Apply the changes
kubectl apply -f 02-replicaset-definition.yml

# Verify
kubectl get rs myapp2-rs
kubectl get pods -l app=myapp2
```

### Step 6: Update Pod Template

Update the container image in the ReplicaSet:

```bash
# Edit the YAML file
# Change image from stacksimplify/kubenginx:2.0.0 to :3.0.0

# Apply changes
kubectl apply -f 02-replicaset-definition.yml

# IMPORTANT: Existing Pods are NOT automatically updated
kubectl get pods -l app=myapp2 -o wide

# To update Pods, you must delete them manually
# ReplicaSet will recreate them with new template
kubectl delete pod -l app=myapp2

# Watch new Pods being created with new image
kubectl get pods -l app=myapp2 -w
```

**Note**: This limitation is why Deployments are preferred in production - they handle rolling updates automatically.

### Step 7: Inspect and Debug

Common inspection commands:

```bash
# Get ReplicaSet YAML
kubectl get rs myapp2-rs -o yaml

# Check ReplicaSet events
kubectl describe rs myapp2-rs

# View all Pods managed by ReplicaSet
kubectl get pods -l app=myapp2 --show-labels

# Check which node each Pod is on
kubectl get pods -l app=myapp2 -o wide

# View logs from all Pods
kubectl logs -l app=myapp2

# View logs from specific Pod
kubectl logs <POD-NAME>

# Execute command in a specific Pod
kubectl exec -it <POD-NAME> -- /bin/sh
```

### Step 8: Cleanup

Remove all resources when done:

```bash
# Delete Service
kubectl delete -f 03-replicaset-nodeport.yml

# Delete ReplicaSet (this also deletes all Pods)
kubectl delete -f 02-replicaset-definition.yml

# Or delete by name
kubectl delete rs myapp2-rs
kubectl delete svc replicaset-nodeport-service

# Verify deletion
kubectl get rs
kubectl get pods
kubectl get svc
```

## Key Features

### 1. High Availability

ReplicaSets ensure your application remains available:
- If a Pod crashes, a new one is created automatically
- If a Node fails, Pods are rescheduled on healthy Nodes
- No manual intervention required

### 2. Automatic Scaling

Easy horizontal scaling:
```bash
# Scale up during high traffic
kubectl scale rs myapp2-rs --replicas=10

# Scale down during low traffic
kubectl scale rs myapp2-rs --replicas=2
```

### 3. Load Distribution

Multiple replicas distribute load:
- Service load balances across all healthy Pods
- Better resource utilization across cluster
- Improved application performance

### 4. Self-Healing

Automatic recovery from failures:
- Pod crashes: Automatically restarted
- Pod deletion: Automatically recreated
- Unhealthy Pods: Replaced with healthy ones

### 5. Declarative Configuration

Infrastructure as Code:
- YAML manifests in version control
- Reproducible deployments
- Easy to review changes

### 6. Label-Based Management

Flexible Pod selection:
```yaml
selector:
  matchLabels:
    app: myapp2
    environment: production
```

## Troubleshooting

### ReplicaSet Not Creating Pods

**Problem**: ReplicaSet exists but Pods not created

```bash
# Check ReplicaSet status
kubectl describe rs myapp2-rs

# Look for events at the bottom
# Common issues:
# - Insufficient cluster resources
# - Invalid Pod template
# - Image pull errors
```

**Solutions**:
```bash
# Check cluster resources
kubectl top nodes
kubectl describe nodes

# Validate YAML syntax
kubectl apply -f 02-replicaset-definition.yml --dry-run=client

# Check for image availability
docker pull stacksimplify/kubenginx:2.0.0
```

### Pods Not Matching ReplicaSet

**Problem**: Standalone Pods exist but ReplicaSet creates additional ones

```bash
# Check all Pods with the label
kubectl get pods -l app=myapp2 --show-labels

# If standalone Pod has matching labels, ReplicaSet adopts it
# If it has different labels, ReplicaSet ignores it
```

**Solution**: Ensure Pod labels match ReplicaSet selector exactly:
```yaml
# ReplicaSet selector
selector:
  matchLabels:
    app: myapp2

# Pod labels (must match)
template:
  metadata:
    labels:
      app: myapp2
```

### Unable to Scale

**Problem**: Scaling command executes but replica count doesn't change

```bash
# Check ReplicaSet status
kubectl get rs myapp2-rs
kubectl describe rs myapp2-rs

# Common causes:
# - Resource constraints (CPU/Memory)
# - Node capacity limits
# - Pod scheduling constraints
```

**Solutions**:
```bash
# Check pending Pods
kubectl get pods -l app=myapp2

# Describe pending Pod
kubectl describe pod <PENDING-POD>

# Check Events section for scheduling failures
# Look for: Insufficient cpu, Insufficient memory, etc.
```

### Pods Stuck in Terminating

**Problem**: Pods show Terminating status but don't delete

```bash
# Check Pod status
kubectl get pods -l app=myapp2

# Describe the stuck Pod
kubectl describe pod <POD-NAME>
```

**Solutions**:
```bash
# Grace period may be long, wait or force delete
kubectl delete pod <POD-NAME> --grace-period=0 --force

# Check for finalizers
kubectl get pod <POD-NAME> -o yaml | grep finalizers -A 5

# If stuck, patch to remove finalizers
kubectl patch pod <POD-NAME> -p '{"metadata":{"finalizers":null}}'
```

### Service Not Load Balancing

**Problem**: All traffic going to one Pod

```bash
# Check Service endpoints
kubectl get endpoints replicaset-nodeport-service

# Should show multiple Pod IPs
# If only one IP, labels may not match
```

**Solutions**:
```bash
# Verify Pod labels
kubectl get pods -l app=myapp2 --show-labels

# Verify Service selector
kubectl get svc replicaset-nodeport-service -o yaml | grep -A 5 selector

# Labels must match exactly
```

### ReplicaSet Not Self-Healing

**Problem**: Deleted Pod not recreated

```bash
# Check ReplicaSet status
kubectl get rs myapp2-rs

# Verify Pod labels
kubectl get pod <POD-NAME> --show-labels
```

**Solution**: Pod must have labels matching ReplicaSet selector. If labels don't match, ReplicaSet won't manage it.

## Best Practices

### 1. Always Use Controllers

Never create standalone Pods in production:
```bash
# DON'T: Create standalone Pod
kubectl run myapp --image=nginx

# DO: Use ReplicaSet or (better) Deployment
kubectl apply -f 02-replicaset-definition.yml
```

### 2. Use Deployments Instead

In production, prefer Deployments over ReplicaSets:
- Deployments manage ReplicaSets automatically
- Support for rolling updates
- Rollback capabilities
- Better for production workloads

```yaml
# Deployment automatically creates and manages ReplicaSets
apiVersion: apps/v1
kind: Deployment  # Not ReplicaSet
metadata:
  name: myapp
spec:
  replicas: 3
  # ... rest is similar to ReplicaSet
```

### 3. Set Appropriate Replica Counts

Consider your application needs:
- **High availability**: Minimum 2-3 replicas
- **Load distribution**: Based on expected traffic
- **Resource constraints**: Don't exceed cluster capacity
- **Cost optimization**: Balance availability and cost

### 4. Always Set Resource Requests/Limits

Ensure predictable behavior:
```yaml
template:
  spec:
    containers:
    - name: myapp2-container
      image: stacksimplify/kubenginx:2.0.0
      resources:
        requests:
          memory: "64Mi"
          cpu: "250m"
        limits:
          memory: "128Mi"
          cpu: "500m"
```

### 5. Use Health Checks

Add probes for better reliability:
```yaml
template:
  spec:
    containers:
    - name: myapp2-container
      image: stacksimplify/kubenginx:2.0.0
      livenessProbe:
        httpGet:
          path: /
          port: 80
        initialDelaySeconds: 30
        periodSeconds: 10
      readinessProbe:
        httpGet:
          path: /
          port: 80
        initialDelaySeconds: 5
        periodSeconds: 5
```

### 6. Use Meaningful Labels

Apply descriptive labels:
```yaml
metadata:
  labels:
    app: myapp2
    version: "2.0.0"
    environment: production
    team: platform
    component: backend
```

### 7. Pod Disruption Budgets

For critical applications, use PodDisruptionBudgets:
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: myapp2-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: myapp2
```

### 8. Anti-Affinity Rules

Distribute Pods across Nodes:
```yaml
template:
  spec:
    affinity:
      podAntiAffinity:
        preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            labelSelector:
              matchLabels:
                app: myapp2
            topologyKey: kubernetes.io/hostname
```

### 9. Monitor and Alert

Set up monitoring:
- Watch replica counts
- Monitor Pod restart rates
- Alert on scheduling failures
- Track resource utilization

### 10. Use GitOps

Manage manifests in Git:
```bash
# Store in version control
git add kube-manifests/
git commit -m "Update replica count to 5"
git push

# Apply from repository
kubectl apply -f https://raw.githubusercontent.com/user/repo/main/02-replicaset-definition.yml
```
