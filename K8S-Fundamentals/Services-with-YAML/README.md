# Kubernetes Services with YAML

## Overview

This project demonstrates Kubernetes Services - the abstraction that provides stable networking and load balancing for Pods. Services solve the problem of how to access Pods reliably, given that Pods are ephemeral and have changing IP addresses. This project showcases different Service types (ClusterIP and NodePort) and demonstrates how to build a multi-tier application with frontend and backend components.

## Kubernetes Concepts

### What is a Service?

A **Service** is a Kubernetes abstraction that defines a logical set of Pods and a policy to access them. Services provide:

- **Stable Endpoint**: Fixed IP address and DNS name, even as Pods come and go
- **Load Balancing**: Distributes traffic across multiple Pod replicas
- **Service Discovery**: Pods can find each other using DNS
- **Decoupling**: Separates frontend from backend concerns

**Key Characteristics:**

- **Permanent IP Address**: Doesn't change throughout Service lifetime
- **DNS Name**: Automatically registered in cluster DNS
- **Label Selectors**: Dynamically discovers and routes to matching Pods
- **Multiple Service Types**: ClusterIP, NodePort, LoadBalancer, ExternalName
- **Session Affinity**: Optional sticky sessions

### The Problem Services Solve

**Without Services:**
- Pods have dynamic IP addresses (change on restart)
- How does frontend find backend Pods?
- How to load balance across replicas?
- What happens when Pods are recreated?

**With Services:**
- Service gets a stable IP and DNS name
- Service automatically discovers Pods via labels
- Service load balances across all healthy Pods
- Applications use Service DNS name

### Service Types

#### 1. ClusterIP (Default)

- **Internal only**: Accessible only within the cluster
- **Use case**: Backend services, databases, internal APIs
- **IP address**: Gets a cluster-internal IP
- **DNS**: Accessible via `<service-name>.<namespace>.svc.cluster.local`

#### 2. NodePort

- **External access**: Exposes Service on each Node's IP at a static port
- **Use case**: Development, testing, or when LoadBalancer unavailable
- **Port range**: 30000-32767
- **Access**: `<NodeIP>:<NodePort>`
- **Also gets**: ClusterIP for internal access

#### 3. LoadBalancer

- **Cloud integration**: Provisions external load balancer
- **Use case**: Production external services
- **Requires**: Cloud provider support (AWS ELB, GCP LB, Azure LB)
- **Also gets**: ClusterIP and NodePort

#### 4. ExternalName

- **DNS alias**: Maps Service to external DNS name
- **Use case**: External databases, third-party APIs
- **No proxying**: Returns CNAME record

### How Services Work

1. **Label Selector**: Service uses selector to find matching Pods
2. **Endpoints**: Kubernetes creates Endpoint objects with Pod IPs
3. **Load Balancing**: kube-proxy configures iptables/IPVS rules
4. **Traffic Routing**: Requests to Service IP are distributed to Pod IPs
5. **Dynamic Updates**: Endpoints update automatically as Pods change

### Service Discovery

Pods can discover Services via:

**1. Environment Variables** (injected at Pod creation):
```bash
MY_BACKEND_SERVICE_SERVICE_HOST=10.96.100.50
MY_BACKEND_SERVICE_SERVICE_PORT=8080
```

**2. DNS** (recommended):
```bash
# Same namespace
http://my-backend-service

# Different namespace
http://my-backend-service.default.svc.cluster.local

# Full FQDN
http://my-backend-service.default.svc.cluster.local:8080
```

## Prerequisites

Before working with this project, ensure you have:

- **Kubernetes Cluster**: A running Kubernetes cluster (minikube, kind, Docker Desktop, or cloud provider)
- **kubectl**: Kubernetes command-line tool installed and configured
- **Prior Knowledge**:
  - Understanding of Pods (PODs-with-YAML project)
  - Understanding of ReplicaSets (ReplicaSets-with-YAML project)
  - Understanding of Deployments (Deployments-with-YAML project)
- **Network Access**: Ability to access NodePort services for testing

Verify your setup:
```bash
kubectl version --client
kubectl cluster-info
kubectl get nodes
```

## Project Structure

```
Services-with-YAML/
├── README.md
└── kube-manifests/
    ├── 00-kube-base-definition.yml          # Template showing base structure
    ├── 01-backend-deployment.yml            # Backend Deployment (3 replicas)
    ├── 02-backend-clusterip-service.yml     # ClusterIP Service for backend
    ├── 03-frontend-deployment.yml           # Frontend Deployment (3 replicas)
    └── 04-frontend-nodeport-service.yml     # NodePort Service for frontend
```

### Application Architecture

This project demonstrates a **two-tier application**:

```
External Users
      |
      | (NodePort 31234)
      v
Frontend Service (NodePort)
      |
      v
Frontend Pods (nginx)
      |
      | (Internal ClusterIP)
      v
Backend Service (ClusterIP)
      |
      v
Backend Pods (REST API)
```

## YAML Manifests

### 1. Base Definition Template (00-kube-base-definition.yml)

Basic Kubernetes YAML structure:

```yaml
apiVersion:
kind:
metadata:

spec:
```

### 2. Backend Deployment (01-backend-deployment.yml)

Creates the backend REST API application:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-restapp
  labels:
    app: backend-restapp
    tier: backend

spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend-restapp
  template:
    metadata:
      labels:
        app: backend-restapp
        tier: backend
    spec:
      containers:
      - name: backend-restapp
        image: stacksimplify/kube-helloworld:1.0.0
        ports:
        - containerPort: 8080
```

**Key Elements:**

- **replicas: 3**: Three backend Pod instances
- **labels**: Both `app` and `tier` labels for organization
- **image**: REST API application
- **containerPort: 8080**: Backend listens on port 8080

### 3. Backend ClusterIP Service (02-backend-clusterip-service.yml)

Exposes backend internally within the cluster:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-backend-service
  labels:
    app: backend-restapp
    tier: backend
spec:
  #type: ClusterIP is a default service
  selector:
    app: backend-restapp
  ports:
  - name: http
    port: 8080
    targetPort: 8080
```

**Key Elements:**

- **type: ClusterIP**: Default type (commented, but implied)
  - Only accessible within cluster
  - Gets cluster-internal IP
- **selector.app: backend-restapp**: Routes to backend Pods
- **port: 8080**: Service port (what clients use)
- **targetPort: 8080**: Container port (where traffic goes)
- **No nodePort**: Not exposed externally

**Access Pattern:**
```bash
# From within cluster:
curl http://my-backend-service:8080

# From other namespace:
curl http://my-backend-service.default.svc.cluster.local:8080
```

### 4. Frontend Deployment (03-frontend-deployment.yml)

Creates the frontend Nginx application:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-nginxapp
  labels:
    app: frontend-nginxapp
    tier: frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend-nginxapp
  template:
    metadata:
      labels:
        app: frontend-nginxapp
        tier: frontend
    spec:
      containers:
      - name: frontend-nginxapp
        image: stacksimplify/kube-frontend-nginx:1.0.0
        ports:
        - containerPort: 80
```

**Key Elements:**

- **replicas: 3**: Three frontend Pod instances
- **tier: frontend**: Label indicating frontend tier
- **image**: Nginx frontend configured to call backend
- **containerPort: 80**: Frontend listens on HTTP port 80

### 5. Frontend NodePort Service (04-frontend-nodeport-service.yml)

Exposes frontend externally via NodePort:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-nginxapp-nodeport-service
  labels:
    app: frontend-nginxapp
    tier: frontend
spec:
  type: NodePort
  selector:
    app: frontend-nginxapp
  ports:
  - name: http
    port: 80
    targetPort: 80
    nodePort: 31234
```

**Key Elements:**

- **type: NodePort**: Exposes externally
  - Also gets ClusterIP for internal access
  - Accessible on all Nodes
- **selector.app: frontend-nginxapp**: Routes to frontend Pods
- **port: 80**: Service port
- **targetPort: 80**: Container port
- **nodePort: 31234**: External port on each Node

**Access Pattern:**
```bash
# External access:
curl http://<NodeIP>:31234

# Internal access (from within cluster):
curl http://frontend-nginxapp-nodeport-service
```

## Usage

### Step 1: Deploy the Backend

Create backend Deployment and Service:

```bash
# Navigate to the manifests directory
cd /Users/reza/home-lab/K8S-Fundamentals/Services-with-YAML/kube-manifests

# Create backend Deployment
kubectl apply -f 01-backend-deployment.yml

# Verify backend Deployment
kubectl get deployment backend-restapp
kubectl get pods -l app=backend-restapp

# Create backend Service
kubectl apply -f 02-backend-clusterip-service.yml

# Verify backend Service
kubectl get service my-backend-service
kubectl describe service my-backend-service

# Check Service endpoints (should show 3 backend Pod IPs)
kubectl get endpoints my-backend-service
```

**Expected Output:**
```bash
# Service details
NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
my-backend-service   ClusterIP   10.96.100.50    <none>        8080/TCP   10s

# Endpoints
NAME                 ENDPOINTS                                         AGE
my-backend-service   10.244.0.5:8080,10.244.0.6:8080,10.244.0.7:8080   10s
```

### Step 2: Test Backend Service Internally

Test the backend Service from within the cluster:

```bash
# Create a test Pod
kubectl run test-pod --image=busybox --rm -it --restart=Never -- sh

# Inside the test Pod:
# Test using Service name
wget -qO- http://my-backend-service:8080

# Test using Service FQDN
wget -qO- http://my-backend-service.default.svc.cluster.local:8080

# Exit the test Pod
exit

# Alternative: Use kubectl run with command
kubectl run test --image=busybox --rm -it --restart=Never \
  -- wget -qO- http://my-backend-service:8080
```

### Step 3: Deploy the Frontend

Create frontend Deployment and Service:

```bash
# Create frontend Deployment
kubectl apply -f 03-frontend-deployment.yml

# Verify frontend Deployment
kubectl get deployment frontend-nginxapp
kubectl get pods -l app=frontend-nginxapp

# Create frontend Service
kubectl apply -f 04-frontend-nodeport-service.yml

# Verify frontend Service
kubectl get service frontend-nginxapp-nodeport-service
kubectl describe service frontend-nginxapp-nodeport-service

# Check Service endpoints (should show 3 frontend Pod IPs)
kubectl get endpoints frontend-nginxapp-nodeport-service
```

**Expected Output:**
```bash
NAME                                  TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
frontend-nginxapp-nodeport-service    NodePort   10.96.200.100   <none>        80:31234/TCP   10s
```

### Step 4: Access the Application

Access the frontend from outside the cluster:

```bash
# For minikube
minikube ip
# Then access: http://<MINIKUBE-IP>:31234

# Or use minikube service command
minikube service frontend-nginxapp-nodeport-service

# For Docker Desktop
curl http://localhost:31234
# Or open browser: http://localhost:31234

# For cloud or bare metal
# Get any Node IP
kubectl get nodes -o wide
# Access: http://<NODE-IP>:31234
```

**Testing Load Balancing:**
```bash
# Multiple requests to see different Pods responding
for i in {1..10}; do
  curl http://localhost:31234
  echo ""
  sleep 1
done

# You should see responses from different frontend Pods
# Frontend will also call backend Service internally
```

### Step 5: Verify Service Discovery

Check how Services are discovered:

```bash
# Get Service DNS names
kubectl get services

# Test DNS resolution from a Pod
kubectl run dnstest --image=busybox --rm -it --restart=Never -- nslookup my-backend-service

# Should return:
# Name:      my-backend-service
# Address:   10.96.100.50 (ClusterIP)

# Test frontend Service DNS
kubectl run dnstest --image=busybox --rm -it --restart=Never \
  -- nslookup frontend-nginxapp-nodeport-service

# Check environment variables in a Pod
kubectl exec -it <frontend-pod-name> -- env | grep SERVICE
```

### Step 6: Observe Service Load Balancing

Watch how Services distribute traffic:

```bash
# Terminal 1: Watch backend Pod logs
kubectl logs -f -l app=backend-restapp

# Terminal 2: Make requests to frontend
for i in {1..20}; do
  curl http://localhost:31234
  sleep 1
done

# You'll see different backend Pods handling requests
# Service automatically load balances across all 3 replicas
```

### Step 7: Test Service Self-Healing

Delete a Pod and see Service adaptation:

```bash
# Get current endpoints
kubectl get endpoints my-backend-service

# Delete one backend Pod
kubectl delete pod -l app=backend-restapp --force --grace-period=0 | head -1

# Check endpoints immediately
kubectl get endpoints my-backend-service

# You'll see:
# 1. Deleted Pod IP removed from endpoints
# 2. New Pod IP added when replacement starts
# 3. Service continues working throughout

# Test that Service still works
kubectl run test --image=busybox --rm -it --restart=Never \
  -- wget -qO- http://my-backend-service:8080
```

### Step 8: View All Resources

See the complete application:

```bash
# View all resources
kubectl get all

# View with labels
kubectl get all --show-labels

# View by tier
kubectl get all -l tier=backend
kubectl get all -l tier=frontend

# View Services specifically
kubectl get svc
kubectl get svc -o wide

# View detailed Service info
kubectl describe svc my-backend-service
kubectl describe svc frontend-nginxapp-nodeport-service
```

### Step 9: Inspect Service Details

Get detailed Service information:

```bash
# Get Service YAML
kubectl get svc my-backend-service -o yaml
kubectl get svc frontend-nginxapp-nodeport-service -o yaml

# Get Service IP addresses
kubectl get svc -o custom-columns=NAME:.metadata.name,TYPE:.spec.type,CLUSTER-IP:.spec.clusterIP,EXTERNAL-IP:.status.loadBalancer.ingress

# View Service endpoints
kubectl get endpoints

# Describe endpoints
kubectl describe endpoints my-backend-service
```

### Step 10: Test Multi-Tier Communication

Verify frontend can communicate with backend:

```bash
# Get into a frontend Pod
kubectl exec -it <frontend-pod-name> -- /bin/sh

# Inside the frontend Pod:
# Test backend Service
curl http://my-backend-service:8080

# Check DNS resolution
nslookup my-backend-service

# Check environment variables
env | grep BACKEND

# Exit
exit
```

### Step 11: Scale and Observe

Scale Deployments and watch Service adaptation:

```bash
# Scale backend up
kubectl scale deployment backend-restapp --replicas=5

# Watch endpoints update
kubectl get endpoints my-backend-service -w

# Check new endpoint count
kubectl get endpoints my-backend-service

# Scale frontend down
kubectl scale deployment frontend-nginxapp --replicas=2

# Verify frontend endpoints
kubectl get endpoints frontend-nginxapp-nodeport-service

# Services automatically adapt to new Pod count
```

### Step 12: Apply All at Once

For future deployments:

```bash
# Deploy everything at once
kubectl apply -f .

# Verify all resources
kubectl get all

# Or deploy in order (recommended for clarity)
kubectl apply -f 01-backend-deployment.yml
kubectl apply -f 02-backend-clusterip-service.yml
kubectl apply -f 03-frontend-deployment.yml
kubectl apply -f 04-frontend-nodeport-service.yml
```

### Step 13: Cleanup

Remove all resources:

```bash
# Delete all manifests
kubectl delete -f .

# Or delete individually
kubectl delete -f 04-frontend-nodeport-service.yml
kubectl delete -f 03-frontend-deployment.yml
kubectl delete -f 02-backend-clusterip-service.yml
kubectl delete -f 01-backend-deployment.yml

# Verify deletion
kubectl get all
kubectl get services
kubectl get endpoints
```

## Key Features

### 1. Service Abstraction

Stable endpoint for dynamic Pods:
- Pods can be created/destroyed
- Service IP remains constant
- DNS name never changes
- Applications use Service name, not Pod IPs

### 2. Automatic Load Balancing

Traffic distributed across Pods:
- Round-robin by default
- Only healthy Pods receive traffic
- Readiness probes determine health
- Automatic endpoint updates

### 3. Service Discovery

Multiple ways to find Services:

**DNS (Recommended):**
```bash
http://my-backend-service              # Same namespace
http://my-backend-service.default      # Specify namespace
http://my-backend-service.default.svc  # Include svc
```

**Environment Variables:**
```bash
MY_BACKEND_SERVICE_SERVICE_HOST
MY_BACKEND_SERVICE_SERVICE_PORT
```

### 4. Multi-Tier Architecture

Separate concerns:
- **Frontend Tier**: User-facing, NodePort Service
- **Backend Tier**: Internal logic, ClusterIP Service
- **Database Tier**: Data storage, ClusterIP Service (not in this example)

### 5. Network Isolation

Control access:
- ClusterIP: Internal only, secure by default
- NodePort: External access when needed
- Network Policies: Additional security (advanced)

### 6. Session Affinity

Sticky sessions (optional):
```yaml
spec:
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800
```

### 7. Headless Services

For direct Pod access:
```yaml
spec:
  clusterIP: None  # Headless Service
  # Returns Pod IPs directly, no load balancing
```

## Troubleshooting

### Cannot Access Service

**Problem**: Service exists but not accessible

```bash
# Check Service
kubectl get svc my-backend-service

# Check if endpoints exist
kubectl get endpoints my-backend-service

# If no endpoints, labels don't match
kubectl get pods --show-labels
kubectl get svc my-backend-service -o yaml | grep -A 5 selector
```

**Solutions:**
- Verify Pod labels match Service selector exactly
- Ensure Pods are in Running state
- Check that containerPort matches targetPort

### Service Has No Endpoints

**Problem**: Service created but no endpoints

```bash
kubectl describe svc my-backend-service
# Shows: Endpoints: <none>
```

**Common Causes:**
1. **Label Mismatch**: Pod labels don't match Service selector
2. **No Running Pods**: All Pods are Pending/Failed
3. **Wrong Namespace**: Pods in different namespace

**Solutions:**
```bash
# Check Pod labels
kubectl get pods -l app=backend-restapp --show-labels

# Verify Service selector
kubectl get svc my-backend-service -o jsonpath='{.spec.selector}'

# Ensure labels match
# Update Deployment or Service as needed
```

### NodePort Service Not Accessible

**Problem**: Cannot access Service via NodePort

```bash
# Verify Service type
kubectl get svc frontend-nginxapp-nodeport-service

# Check NodePort number
kubectl get svc frontend-nginxapp-nodeport-service -o jsonpath='{.spec.ports[0].nodePort}'
```

**Solutions:**
```bash
# For minikube
minikube service frontend-nginxapp-nodeport-service --url

# Check firewall rules
# Ensure NodePort (31234) is open

# Verify correct Node IP
kubectl get nodes -o wide

# Test from within cluster first
kubectl run test --image=busybox --rm -it --restart=Never \
  -- wget -qO- http://frontend-nginxapp-nodeport-service
```

### DNS Resolution Failures

**Problem**: Service DNS name doesn't resolve

```bash
# Test DNS
kubectl run dnstest --image=busybox --rm -it --restart=Never \
  -- nslookup my-backend-service

# Check CoreDNS
kubectl get pods -n kube-system -l k8s-app=kube-dns
```

**Solutions:**
```bash
# Ensure CoreDNS is running
kubectl get pods -n kube-system | grep coredns

# Check Service name spelling
kubectl get svc

# Use fully qualified name
# http://my-backend-service.default.svc.cluster.local:8080

# Restart CoreDNS if needed
kubectl rollout restart deployment/coredns -n kube-system
```

### Load Balancing Not Working

**Problem**: All traffic going to one Pod

```bash
# Check endpoints
kubectl get endpoints my-backend-service

# Should show multiple Pod IPs
```

**Solutions:**
- Ensure multiple Pods are Running
- Verify all Pods are Ready (readiness probes)
- Check if sessionAffinity is set (might be intentional)

### Service Timeout or Connection Refused

**Problem**: Service responds but application doesn't

```bash
# Check Pod logs
kubectl logs -l app=backend-restapp

# Check if container is listening on correct port
kubectl exec -it <pod-name> -- netstat -tulpn

# Verify targetPort matches containerPort
kubectl get deployment backend-restapp -o yaml | grep containerPort
kubectl get svc my-backend-service -o yaml | grep targetPort
```

**Solutions:**
- Ensure application is running and healthy
- Verify port numbers match
- Check application logs for errors
- Add readiness and liveness probes

## Best Practices

### 1. Use ClusterIP for Internal Services

Default to ClusterIP for internal communication:

```yaml
# Backend, databases, internal APIs
spec:
  type: ClusterIP  # or omit (default)
```

Only use NodePort/LoadBalancer for external access.

### 2. Use Meaningful Service Names

Names become DNS entries:

```yaml
# GOOD: Descriptive, clear purpose
metadata:
  name: user-authentication-service
  name: payment-processing-api
  name: product-catalog-db

# AVOID: Vague names
metadata:
  name: service1
  name: my-service
```

### 3. Match Port Names

Use consistent port naming:

```yaml
# In Deployment
ports:
- name: http
  containerPort: 8080

# In Service
ports:
- name: http
  port: 8080
  targetPort: http  # Reference by name
```

### 4. Add Health Checks

Services only route to healthy Pods:

```yaml
spec:
  containers:
  - name: backend-restapp
    image: stacksimplify/kube-helloworld:1.0.0
    readinessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 10
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 15
      periodSeconds: 20
```

### 5. Use Labels Consistently

Organize Services and Pods:

```yaml
metadata:
  labels:
    app: backend-restapp
    tier: backend
    version: "1.0.0"
    environment: production
```

### 6. Document Service Purpose

Use annotations:

```yaml
metadata:
  name: my-backend-service
  annotations:
    description: "REST API for user management"
    owner: "platform-team@example.com"
    documentation: "https://docs.example.com/backend-api"
```

### 7. Set Resource Limits

Ensure predictable performance:

```yaml
spec:
  containers:
  - name: backend-restapp
    resources:
      requests:
        memory: "128Mi"
        cpu: "250m"
      limits:
        memory: "256Mi"
        cpu: "500m"
```

### 8. Use Network Policies

Add security layer (advanced):

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-network-policy
spec:
  podSelector:
    matchLabels:
      app: backend-restapp
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          tier: frontend
    ports:
    - protocol: TCP
      port: 8080
```

### 9. Avoid NodePort in Production

Use LoadBalancer or Ingress instead:

```yaml
# Development: NodePort is fine
spec:
  type: NodePort

# Production: Use LoadBalancer
spec:
  type: LoadBalancer

# Or use Ingress (better for HTTP/S)
```

### 10. Monitor Services

Track Service health:
- Monitor endpoint count
- Track request rates
- Alert on Service errors
- Monitor latency

### 11. Use Service Mesh for Advanced Cases

For complex microservices:
- **Istio**: Traffic management, security, observability
- **Linkerd**: Lightweight service mesh
- **Consul**: Service mesh and service discovery

### 12. DNS-Based Service Discovery

Always use DNS, not IPs:

```bash
# GOOD
http://my-backend-service:8080

# BAD
http://10.96.100.50:8080
```
