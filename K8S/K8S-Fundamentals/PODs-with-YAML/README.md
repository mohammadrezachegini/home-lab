# Kubernetes Pods with YAML

## Overview

This project demonstrates the fundamentals of Kubernetes Pods - the smallest deployable units in Kubernetes. It provides hands-on examples of creating and managing Pods using YAML manifests, along with exposing them through a NodePort Service. This is an essential starting point for anyone learning Kubernetes, as Pods are the foundation upon which all other Kubernetes workload resources are built.

## Kubernetes Concepts

### What is a Pod?

A **Pod** is the smallest and simplest unit in the Kubernetes object model. It represents a single instance of a running process in your cluster. Key characteristics:

- **Single or Multiple Containers**: A Pod can contain one or more containers that share storage, network resources, and specifications
- **Shared Resources**: Containers in a Pod share the same IP address, port space, and storage volumes
- **Atomic Unit**: Pods are created, scheduled, and managed as a single entity
- **Ephemeral**: Pods are designed to be disposable and replaceable

### Pod Lifecycle

Pods go through several phases:
- **Pending**: Pod has been accepted but containers are not yet running
- **Running**: Pod has been bound to a node and all containers are created
- **Succeeded**: All containers terminated successfully
- **Failed**: All containers terminated, at least one failed
- **Unknown**: Pod state cannot be determined

### NodePort Service

A **NodePort Service** exposes the Pod on each Node's IP at a static port (NodePort). This allows external traffic to access your Pod from outside the cluster using `<NodeIP>:<NodePort>`.

## Prerequisites

Before working with this project, ensure you have:

- **Kubernetes Cluster**: A running Kubernetes cluster (minikube, kind, Docker Desktop, or cloud provider)
- **kubectl**: Kubernetes command-line tool installed and configured
- **Basic Knowledge**: Understanding of containers and Docker concepts
- **Network Access**: Ability to access your cluster nodes for testing NodePort services

Verify your setup:
```bash
kubectl version --client
kubectl cluster-info
kubectl get nodes
```

## Project Structure

```
PODs-with-YAML/
├── README.md
└── kube-manifests/
    ├── 01-kube-base-definition.yml    # Template showing base Kubernetes YAML structure
    ├── 02-pod-definition.yml          # Pod manifest with container specification
    └── 03-pod-nodeport-service.yml    # NodePort Service to expose the Pod
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

Every Kubernetes resource requires these four top-level fields:
- **apiVersion**: The version of the Kubernetes API you're using
- **kind**: The type of resource you want to create
- **metadata**: Data that helps uniquely identify the object
- **spec**: The desired state of the resource

### 2. Pod Definition (02-pod-definition.yml)

This manifest creates a single Pod running an Nginx web server:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
  labels:
    app: myapp
spec:
  containers:
    - name: myapp
      image: stacksimplify/kubenginx:1.0.0
      ports:
      - containerPort: 80
```

**Key Elements:**
- **apiVersion: v1**: Pods are in the core v1 API group
- **kind: Pod**: Specifies this is a Pod resource
- **metadata.name**: Unique name for the Pod (myapp-pod)
- **metadata.labels**: Key-value pairs for organizing and selecting resources
- **spec.containers**: List of containers to run in the Pod
- **containerPort**: Port the container exposes (80 for HTTP)

### 3. NodePort Service (03-pod-nodeport-service.yml)

This Service exposes the Pod externally through a NodePort:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-pod-nodeport-service
spec:
  type: NodePort
  selector:
    app: myapp
  ports:
  - name: http
    port: 80
    targetPort: 80
    nodePort: 31231
```

**Key Elements:**
- **type: NodePort**: Service type that exposes on each Node's IP
- **selector**: Matches Pods with label `app: myapp`
- **port**: Service port (80)
- **targetPort**: Container port to forward traffic to (80)
- **nodePort**: External port on Node (31231, range: 30000-32767)

## Usage

### Step 1: Create the Pod

Apply the Pod manifest to create the Pod:

```bash
# Navigate to the manifests directory
cd /Users/reza/home-lab/K8S-Fundamentals/PODs-with-YAML/kube-manifests

# Create the Pod
kubectl apply -f 02-pod-definition.yml

# Verify Pod creation
kubectl get pods
kubectl get pods -o wide

# Check Pod details
kubectl describe pod myapp-pod

# View Pod logs
kubectl logs myapp-pod
```

### Step 2: Create the NodePort Service

Expose the Pod using the NodePort Service:

```bash
# Create the Service
kubectl apply -f 03-pod-nodeport-service.yml

# Verify Service creation
kubectl get services
kubectl get svc myapp-pod-nodeport-service

# Describe the Service
kubectl describe svc myapp-pod-nodeport-service
```

### Step 3: Access the Application

Access the application through the NodePort:

```bash
# Get Node IP (for minikube)
minikube ip

# Access the application
curl http://<NODE_IP>:31231

# Or open in browser
# minikube: minikube service myapp-pod-nodeport-service
# Docker Desktop: http://localhost:31231
```

### Step 4: Inspect and Debug

Common inspection commands:

```bash
# Check Pod status
kubectl get pod myapp-pod -o yaml

# Execute commands inside the Pod
kubectl exec -it myapp-pod -- /bin/sh

# Port-forward for local testing (alternative to NodePort)
kubectl port-forward pod/myapp-pod 8080:80
# Access at http://localhost:8080

# View Pod events
kubectl get events --sort-by='.lastTimestamp'
```

### Step 5: Update the Pod

Pods are immutable - to update, you must delete and recreate:

```bash
# Edit the YAML file (change image version, environment variables, etc.)
# Then apply changes
kubectl delete -f 02-pod-definition.yml
kubectl apply -f 02-pod-definition.yml

# Or use replace (if Pod exists)
kubectl replace -f 02-pod-definition.yml --force
```

### Step 6: Cleanup

Remove all resources when done:

```bash
# Delete individual resources
kubectl delete -f 03-pod-nodeport-service.yml
kubectl delete -f 02-pod-definition.yml

# Or delete all at once
kubectl delete -f .

# Verify deletion
kubectl get pods
kubectl get services
```

## Key Features

### 1. Declarative Configuration
- YAML manifests define desired state
- Kubernetes ensures actual state matches desired state
- Version control friendly for GitOps workflows

### 2. Labels and Selectors
- Labels organize and categorize resources
- Selectors enable Services to find and route to Pods
- Foundation for Kubernetes service discovery

### 3. Container Specifications
- Define image, ports, and resource requirements
- Support for multiple containers per Pod
- Container-level configurations (env vars, volumes, etc.)

### 4. Service Discovery
- NodePort Service provides external access
- Service acts as a stable endpoint for ephemeral Pods
- Built-in load balancing across Pod endpoints

### 5. Observability
- Pod logs accessible via kubectl
- Events tracking for troubleshooting
- Health checks and readiness probes support

## Troubleshooting

### Pod Not Starting

**Problem**: Pod stuck in Pending or ContainerCreating state

```bash
# Check Pod events
kubectl describe pod myapp-pod

# Common causes:
# - Image pull errors (check image name and registry access)
# - Insufficient cluster resources
# - Volume mount issues
```

**Solutions**:
```bash
# Check if image exists and is accessible
docker pull stacksimplify/kubenginx:1.0.0

# Verify cluster resources
kubectl top nodes
kubectl describe nodes
```

### Pod Crashing (CrashLoopBackOff)

**Problem**: Pod continuously restarting

```bash
# Check logs from current container
kubectl logs myapp-pod

# Check logs from previous container instance
kubectl logs myapp-pod --previous

# Common causes:
# - Application errors
# - Missing dependencies
# - Incorrect command or arguments
```

### Cannot Access Service

**Problem**: NodePort Service not accessible

```bash
# Verify Service is created
kubectl get svc myapp-pod-nodeport-service

# Check Service endpoints
kubectl get endpoints myapp-pod-nodeport-service

# Verify Pod labels match Service selector
kubectl get pod myapp-pod --show-labels

# Test from within cluster
kubectl run test-pod --image=busybox --rm -it -- wget -O- http://myapp-pod-nodeport-service
```

**Solutions**:
- Ensure Pod labels match Service selector
- Verify NodePort is accessible (firewall rules, security groups)
- Check if Pod is in Running state
- Confirm port mappings are correct

### Image Pull Errors

**Problem**: ImagePullBackOff or ErrImagePull

```bash
kubectl describe pod myapp-pod

# Common causes:
# - Typo in image name
# - Private registry without credentials
# - Network issues
# - Image doesn't exist
```

**Solutions**:
```yaml
# For private registries, create imagePullSecrets
spec:
  containers:
  - name: myapp
    image: stacksimplify/kubenginx:1.0.0
  imagePullSecrets:
  - name: regcred
```

### Pod Running but Not Responding

**Problem**: Pod status is Running but application not working

```bash
# Check if container is actually running
kubectl exec -it myapp-pod -- ps aux

# Test connectivity from within Pod
kubectl exec -it myapp-pod -- wget -O- localhost:80

# Check application logs
kubectl logs myapp-pod -f

# Verify port configuration
kubectl get pod myapp-pod -o yaml | grep -i port
```

## Best Practices

### 1. Resource Management

Always specify resource requests and limits:

```yaml
spec:
  containers:
  - name: myapp
    image: stacksimplify/kubenginx:1.0.0
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
```

### 2. Health Checks

Add liveness and readiness probes:

```yaml
spec:
  containers:
  - name: myapp
    image: stacksimplify/kubenginx:1.0.0
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

### 3. Use Labels Effectively

Apply meaningful labels for organization:

```yaml
metadata:
  labels:
    app: myapp
    environment: dev
    version: "1.0.0"
    team: platform
```

### 4. Avoid Standalone Pods

In production, use higher-level controllers:
- Use **Deployments** for stateless applications
- Use **StatefulSets** for stateful applications
- Use **DaemonSets** for node-level services
- Standalone Pods are not rescheduled if they fail

### 5. Security Practices

```yaml
spec:
  containers:
  - name: myapp
    image: stacksimplify/kubenginx:1.0.0
    securityContext:
      runAsNonRoot: true
      runAsUser: 1000
      readOnlyRootFilesystem: true
      allowPrivilegeEscalation: false
```

### 6. Use Namespaces

Organize resources using namespaces:

```bash
# Create namespace
kubectl create namespace dev

# Deploy to specific namespace
kubectl apply -f 02-pod-definition.yml -n dev

# Set default namespace
kubectl config set-context --current --namespace=dev
```

### 7. Configuration Management

Externalize configuration using ConfigMaps and Secrets:

```yaml
spec:
  containers:
  - name: myapp
    image: stacksimplify/kubenginx:1.0.0
    envFrom:
    - configMapRef:
        name: myapp-config
    - secretRef:
        name: myapp-secrets
```

### 8. Documentation

- Use comments in YAML files
- Document special configurations
- Maintain README files for complex setups
- Use descriptive names for resources

### 9. Version Control

- Store all YAML manifests in Git
- Use meaningful commit messages
- Tag releases appropriately
- Review changes before applying

### 10. Testing

Always test in development before production:

```bash
# Dry run to validate YAML
kubectl apply -f 02-pod-definition.yml --dry-run=client

# Validate YAML syntax
kubectl apply -f 02-pod-definition.yml --validate=true --dry-run=server

# Use different namespaces for environments
kubectl apply -f 02-pod-definition.yml -n dev
```
