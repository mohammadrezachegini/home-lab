# Ecommerce Platform - Helm Chart

Complete Helm chart for the Microservices E-Commerce Platform.
Manages all 5 microservices, PostgreSQL, NGINX Ingress, Prometheus, Grafana, and Jenkins.

---

## Prerequisites

```bash
# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verify
helm version
```

---

## Directory Structure

```
ecommerce-helm/
├── Chart.yaml                          # Chart metadata
├── values.yaml                         # Default values (home lab / local images)
├── values-dev.yaml                     # Dev overrides (1 replica, no monitoring)
├── values-prod.yaml                    # Prod overrides (3 replicas, Docker Hub)
└── templates/
    ├── _helpers.tpl                    # Reusable template helpers
    ├── config/
    │   ├── namespace.yaml              # ecommerce, monitoring, jenkins namespaces
    │   ├── configmap.yaml              # Shared env vars
    │   └── secret.yaml                 # DB credentials
    ├── services/
    │   ├── product/deployment.yaml     # Deployment + Service
    │   ├── user/deployment.yaml
    │   ├── order/deployment.yaml
    │   ├── payment/deployment.yaml
    │   └── inventory/deployment.yaml
    ├── postgres/
    │   └── statefulset.yaml            # StatefulSet + PVC + Service
    ├── ingress/
    │   └── ingress.yaml                # NGINX Ingress for all services
    ├── monitoring/
    │   ├── prometheus.yaml             # Prometheus RBAC + ConfigMap + Deployment
    │   └── grafana.yaml                # Grafana Deployment + Service
    └── jenkins/
        ├── deployment.yaml             # Jenkins Deployment + Service
        └── rbac.yaml                   # ServiceAccount + ClusterRole
```

---

## Quick Start (Home Lab - Local Images)

```bash
# 1. Go to helm chart directory
cd ecommerce-helm/

# 2. Validate the chart (dry run - shows all rendered templates)
helm template ecommerce . | head -100

# 3. Install everything
helm install ecommerce . --create-namespace

# 4. Check status
helm status ecommerce
kubectl get pods -n ecommerce
kubectl get pods -n monitoring
kubectl get pods -n jenkins
```

---

## Upgrade (After Code Changes)

```bash
# Upgrade with same values
helm upgrade ecommerce .

# Upgrade with new image tag
helm upgrade ecommerce . --set image.tag=v2

# Upgrade only product service replicas
helm upgrade ecommerce . --set services.product.replicas=3
```

---

## Environment Deployments

```bash
# Dev environment (1 replica, no monitoring, no jenkins)
helm install ecommerce-dev . -f values-dev.yaml --create-namespace

# Production environment (3 replicas, Docker Hub images)
helm install ecommerce-prod . -f values-prod.yaml \
  --set database.password=YOUR_SECURE_PASSWORD \
  --set database.secretKey=YOUR_SECRET_KEY \
  --create-namespace
```

---

## Useful Commands

```bash
# See all rendered YAML without installing
helm template ecommerce .

# Validate chart for errors
helm lint .

# Show current values in use
helm get values ecommerce

# Show what changed before upgrading
helm diff upgrade ecommerce . --set image.tag=v2

# Rollback to previous version
helm rollback ecommerce 1

# See release history
helm history ecommerce

# Uninstall everything
helm uninstall ecommerce
```

---

## Access URLs (Home Lab)

| Service    | URL                              |
|------------|----------------------------------|
| Products   | http://localhost/products/       |
| Users      | http://localhost/users/          |
| Orders     | http://localhost/orders/         |
| Payments   | http://localhost/payments/       |
| Inventory  | http://localhost/inventory/      |
| Prometheus | http://localhost:30090           |
| Grafana    | http://localhost:30300 (admin/admin123) |
| Jenkins    | http://localhost:30000           |

---

## Switching to Docker Hub Images

When deploying to cloud (EKS), update image settings:

```bash
helm upgrade ecommerce . \
  --set image.registry=rezaops \
  --set image.tag=latest \
  --set image.pullPolicy=Always
```

Or edit `values-prod.yaml` and set `image.registry: "rezaops"`.
