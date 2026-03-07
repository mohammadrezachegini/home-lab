# Kubernetes Manifests — E-Commerce Platform

This directory contains all Kubernetes manifests for deploying the microservices e-commerce platform on a K3s cluster. It covers the application services, PostgreSQL database, NGINX Ingress routing, Prometheus + Grafana monitoring stack, and a Jenkins CI/CD pipeline.

---

## Directory Structure

```
k8s/
├── base/
│   ├── namespace.yaml                   # ecommerce namespace
│   ├── configmap.yaml                   # Shared non-sensitive config
│   ├── secret.yaml                      # DB credentials + secret key
│   ├── combined-ingress.yaml            # Single ingress for all services (no auth)
│   ├── combined-ingress-auth.yaml       # Single ingress for all services (basic auth)
│   ├── authenticated-ingress.yaml       # Auth ingress (partial example)
│   ├── auth                             # htpasswd file for basic auth secret
│   │
│   ├── postgres/
│   │   ├── statefulset.yaml             # PostgreSQL 15 StatefulSet
│   │   ├── service.yaml                 # Headless ClusterIP service
│   │   └── pvc.yaml                     # 5Gi PersistentVolumeClaim (local-path)
│   │
│   ├── product-service/
│   │   ├── deployment.yaml              # 2 replicas, resource limits, probes
│   │   ├── service.yaml                 # ClusterIP on port 8001
│   │   └── ingress.yaml                 # /products → product-service
│   │
│   ├── user-service/
│   │   ├── deployment.yaml              # 2 replicas, resource limits, probes
│   │   ├── service.yaml                 # ClusterIP on port 8002
│   │   └── ingress.yaml                 # /users → user-service
│   │
│   ├── order-service/
│   │   ├── deployment.yaml              # 2 replicas, resource limits, probes
│   │   ├── service.yaml                 # ClusterIP on port 8003
│   │   └── ingress.yaml                 # /orders → order-service
│   │
│   ├── payment-service/
│   │   ├── deployment.yaml              # 2 replicas, resource limits, probes
│   │   ├── service.yaml                 # ClusterIP on port 8004
│   │   └── ingress.yaml                 # /payments → payment-service
│   │
│   └── inventory-service/
│       ├── deployment.yaml              # 2 replicas, resource limits, probes
│       ├── service.yaml                 # ClusterIP on port 8005
│       ├── ingress.yaml                 # /inventory → inventory-service
│       └── auth                         # htpasswd file for service-level auth
│
├── monitoring/
│   ├── prometheus-config.yaml           # Prometheus scrape config (ConfigMap)
│   ├── prometheus-deployment.yaml       # Prometheus deployment
│   ├── prometheus-service.yaml          # NodePort 30090
│   ├── prometheus-rbac.yaml             # ServiceAccount + ClusterRole
│   ├── grafana-deployment.yaml          # Grafana deployment
│   └── grafana-service.yaml             # NodePort 30300
│
└── jenkins/
    ├── deployment.yaml                  # Jenkins LTS with Docker + kubectl access
    ├── service.yaml                     # NodePort 30000
    ├── pvc.yaml                         # 5Gi PersistentVolumeClaim (local-path)
    └── rbac.yaml                        # ServiceAccount + ClusterRole for deployments
```

---

## Namespaces

| Namespace    | Purpose                                      |
|--------------|----------------------------------------------|
| `ecommerce`  | All application services + PostgreSQL        |
| `monitoring` | Prometheus and Grafana                       |
| `jenkins`    | Jenkins CI/CD server                         |

---

## Deploying the Platform

### Prerequisites

- K3s cluster running
- `kubectl` configured to point at the cluster
- Docker images built and loaded into K3s (`imagePullPolicy: Never`)

### 1. Create the namespace

```bash
kubectl apply -f k8s/base/namespace.yaml
```

### 2. Apply shared config and secrets

```bash
kubectl apply -f k8s/base/configmap.yaml
kubectl apply -f k8s/base/secret.yaml
```

### 3. Deploy PostgreSQL

```bash
kubectl apply -f k8s/base/postgres/
```

Wait for the database to be ready before deploying services:

```bash
kubectl wait --for=condition=ready pod -l app=postgres -n ecommerce --timeout=60s
```

### 4. Deploy all microservices

```bash
kubectl apply -f k8s/base/product-service/
kubectl apply -f k8s/base/user-service/
kubectl apply -f k8s/base/order-service/
kubectl apply -f k8s/base/payment-service/
kubectl apply -f k8s/base/inventory-service/
```

Or apply everything in base at once:

```bash
kubectl apply -R -f k8s/base/
```

### 5. Apply Ingress

Choose one ingress strategy (see [Ingress section](#ingress) below):

```bash
# No authentication
kubectl apply -f k8s/base/combined-ingress.yaml

# With basic authentication
kubectl apply -f k8s/base/combined-ingress-auth.yaml
```

### 6. Deploy monitoring stack

```bash
kubectl apply -f k8s/monitoring/
```

### 7. Deploy Jenkins

```bash
kubectl apply -f k8s/jenkins/
```

---

## Configuration

### ConfigMap (`base/configmap.yaml`)

Shared non-sensitive configuration injected into all service pods:

| Key              | Value               | Description                        |
|------------------|---------------------|------------------------------------|
| `DB_HOST`        | `postgres-service`  | PostgreSQL service DNS name        |
| `DB_PORT`        | `5432`              | PostgreSQL port                    |
| `DB_NAME`        | `ecommerce`         | Database name                      |
| `PRODUCT_PORT`   | `8001`              | Product service port               |
| `USER_PORT`      | `8002`              | User service port                  |
| `ORDER_PORT`     | `8003`              | Order service port                 |
| `PAYMENT_PORT`   | `8004`              | Payment service port               |
| `INVENTORY_PORT` | `8005`              | Inventory service port             |
| `ENVIRONMENT`    | `production`        | Environment label (Python services)|
| `NODE_ENV`       | `production`        | Environment label (Node.js services)|

### Secret (`base/secret.yaml`)

Sensitive values stored as a Kubernetes Secret:

| Key          | Description                                     |
|--------------|-------------------------------------------------|
| `DB_USER`    | Base64-encoded PostgreSQL username (`postgres`) |
| `DB_PASSWORD`| Base64-encoded PostgreSQL password (`postgres`) |
| `SECRET_KEY` | Plain text app secret key (change in production)|

> **Important:** Update `DB_PASSWORD` and `SECRET_KEY` before deploying to any real environment. To encode a new value: `echo -n 'yourvalue' | base64`

---

## Microservice Deployments

All five application services share the same deployment pattern:

- **2 replicas** for high availability
- **`imagePullPolicy: Never`** — uses locally built images (K3s home lab setup)
- **Environment variables** injected from ConfigMap (`DB_HOST`, `DB_PORT`, `DB_NAME`, `NODE_ENV`) and Secret (`DB_USER`, `DB_PASSWORD`)
- **Liveness probe** on `/health` — restarts the container if it becomes unhealthy
- **Readiness probe** on `/health` — gates traffic until the service is ready
- **ClusterIP service** — internal-only, traffic routed via Ingress

### Resource Limits per Service

| Service           | Memory Request | Memory Limit | CPU Request | CPU Limit |
|-------------------|---------------|--------------|-------------|-----------|
| product-service   | 128Mi         | 256Mi        | 100m        | 200m      |
| user-service      | 128Mi         | 256Mi        | 100m        | 200m      |
| order-service     | 64Mi          | 128Mi        | 50m         | 100m      |
| payment-service   | 128Mi         | 256Mi        | 100m        | 200m      |
| inventory-service | 128Mi         | 256Mi        | 100m        | 200m      |

> The order service (Go binary) has a smaller footprint than the Python and Node.js services, reflected in its lower resource requests.

### Probe Timing

| Service           | Liveness initialDelay | Readiness initialDelay |
|-------------------|-----------------------|------------------------|
| product-service   | 30s                   | 5s                     |
| user-service      | 30s                   | 5s                     |
| order-service     | 20s                   | 5s                     |
| payment-service   | 30s                   | 5s                     |
| inventory-service | 30s                   | 5s                     |

---

## PostgreSQL

PostgreSQL is deployed as a **StatefulSet** to ensure stable network identity and persistent storage:

- **Image:** `postgres:15-alpine`
- **Storage:** 5Gi PVC using the K3s `local-path` storage class
- **Service type:** Headless ClusterIP (`clusterIP: None`) — required for StatefulSet DNS
- **DNS name inside cluster:** `postgres-service.ecommerce.svc.cluster.local`
- **Health checks:** `pg_isready` exec probes for both liveness and readiness
- **Credentials:** Injected from `ecommerce-secret`
- **Data path:** `/var/lib/postgresql/data/pgdata`

---

## Ingress

All services are exposed through NGINX Ingress using path-based routing with regex rewriting. Three ingress configurations are provided:

### `combined-ingress.yaml` — No authentication

Routes all five services by path prefix with CORS enabled:

| Path prefix    | Backend service     | Port   |
|----------------|---------------------|--------|
| `/products`    | `product-service`   | `8001` |
| `/users`       | `user-service`      | `8002` |
| `/orders`      | `order-service`     | `8003` |
| `/payments`    | `payment-service`   | `8004` |
| `/inventory`   | `inventory-service` | `8005` |

### `combined-ingress-auth.yaml` — Basic authentication

Same routing as above but with HTTP Basic Auth enforced on all paths. Credentials are loaded from the `basic-auth` Kubernetes Secret (created from the `auth` htpasswd file).

### Per-service ingresses (`*/ingress.yaml`)

Each service directory also contains its own individual ingress, useful for deploying services independently or testing routing in isolation.

### Path Rewriting

All ingresses use:
```
nginx.ingress.kubernetes.io/rewrite-target: /$2
```
with the capture pattern `/service-name(/|$)(.*)`, so a request to `/products/api/products` is rewritten to `/api/products` before reaching the pod.

### Creating the Basic Auth Secret

```bash
# Install htpasswd if needed
sudo apt-get install apache2-utils

# Create the htpasswd file
htpasswd -c auth admin

# Create the Kubernetes secret
kubectl create secret generic basic-auth \
  --from-file=auth \
  -n ecommerce
```

---

## Monitoring

### Prometheus

- **Namespace:** `monitoring`
- **Access:** `http://<node-ip>:30090`
- **Config:** Mounted from `prometheus-config` ConfigMap

**Scrape targets configured:**

| Job | Targets |
|-----|---------|
| `prometheus` | `localhost:9090` (self) |
| `kubernetes-nodes` | All cluster nodes via Kubernetes SD |
| `kubernetes-pods` | Pods with `prometheus.io/scrape: "true"` annotation |
| `ecommerce-services` | All 5 microservices via cluster DNS |

All 5 microservices are scraped at their `/metrics` endpoints using internal cluster DNS:

```
product-service.ecommerce.svc.cluster.local:8001
user-service.ecommerce.svc.cluster.local:8002
order-service.ecommerce.svc.cluster.local:8003
payment-service.ecommerce.svc.cluster.local:8004
inventory-service.ecommerce.svc.cluster.local:8005
```

Prometheus uses a dedicated `ServiceAccount` with a `ClusterRole` granting read access to nodes, pods, services, and endpoints.

### Grafana

- **Namespace:** `monitoring`
- **Access:** `http://<node-ip>:30300`
- **Default credentials:** `admin` / `admin123`
- **Storage:** `emptyDir` (dashboards are not persisted between pod restarts — use a PVC or provisioned dashboards for production)

> To connect Grafana to Prometheus, add a data source with URL `http://prometheus:9090`.

---

## Jenkins CI/CD

- **Namespace:** `jenkins`
- **Access:** `http://<node-ip>:30000`
- **Image:** `jenkins/jenkins:lts-jdk17`
- **Storage:** 5Gi PVC at `/opt/jenkins-data` (hostPath via `local-path`)

### Host Mounts

Jenkins has direct access to the host's Docker daemon and kubectl:

| Mount | Host Path | Purpose |
|-------|-----------|---------|
| `/var/run/docker.sock` | `/var/run/docker.sock` | Build Docker images |
| `/usr/local/bin/docker` | `/usr/bin/docker` | Run Docker CLI commands |
| `/usr/local/bin/kubectl` | `/usr/local/bin/kubectl` | Deploy to Kubernetes |
| `/var/jenkins_home/.kube` | `/home/reza/.kube` | Cluster access via kubeconfig |

### RBAC

Jenkins runs as a dedicated `ServiceAccount` with a `ClusterRole` allowing:

- Full CRUD on `pods`, `deployments`, `replicasets`
- Read access to `services`, `endpoints`, `configmaps`, `secrets`

This allows Jenkins pipelines to build images, push them into K3s, and trigger rolling deployments using `kubectl set image` or `kubectl apply`.

---

## Useful kubectl Commands

```bash
# Check all pods in the ecommerce namespace
kubectl get pods -n ecommerce

# Watch rollout status
kubectl rollout status deployment/product-service -n ecommerce

# View logs for a service
kubectl logs -l app=order-service -n ecommerce --tail=50

# Describe a pod (useful for debugging probe failures)
kubectl describe pod -l app=payment-service -n ecommerce

# Check all services and their cluster IPs
kubectl get svc -n ecommerce

# Check ingress routing
kubectl get ingress -n ecommerce

# View Prometheus and Grafana services
kubectl get svc -n monitoring

# Restart a deployment (rolling restart)
kubectl rollout restart deployment/inventory-service -n ecommerce

# Scale a deployment manually
kubectl scale deployment/product-service --replicas=3 -n ecommerce

# Check resource usage (requires metrics-server)
kubectl top pods -n ecommerce
```

---

## Loading Local Docker Images into K3s

Since all deployments use `imagePullPolicy: Never`, images must be imported into K3s's container runtime before deploying:

```bash
# Build the image
docker build -t product-service:v1 ./src/product-service

# Import into K3s
sudo k3s ctr images import <(docker save product-service:v1)
```

Repeat for each service (`user-service:v1`, `order-service:v1`, `payment-service:v1`, `inventory-service:v1`).