# Microservices Canary Deployments

## Overview

This project demonstrates advanced canary deployment strategies for microservices on Amazon EKS. Canary deployments are a progressive delivery pattern that reduces risk by gradually rolling out changes to a small subset of users before making them available to everyone. This approach enables early detection of issues in production with minimal impact.

The implementation showcases how to deploy multiple versions of a microservice simultaneously, control traffic distribution between versions, and validate new releases with real production traffic. This pattern is essential for achieving zero-downtime deployments and maintaining high availability in production environments.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Internet / Users                                 │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ 100% Traffic
                                 │
                    ┌────────────▼────────────┐
                    │   Route 53 (DNS)        │
                    │  services.rezaops.com   │
                    └────────────┬────────────┘
                                 │
                                 │
                    ┌────────────▼─────────────┐
                    │ Application Load         │
                    │    Balancer (ALB)        │
                    │  - SSL Termination       │
                    │  - Health Checks         │
                    └────────────┬─────────────┘
                                 │
┌────────────────────────────────┼─────────────────────────────────────────┐
│                         EKS Cluster                                      │
│                                │                                          │
│                    ┌───────────▼──────────┐                              │
│                    │   Ingress Resource   │                              │
│                    │  - Path routing      │                              │
│                    │  - SSL redirect      │                              │
│                    └───────────┬──────────┘                              │
│                                │                                          │
│                                │                                          │
│         ┌──────────────────────┴──────────────────────┐                 │
│         │                                              │                 │
│  ┌──────▼───────────────┐                  ┌──────────▼──────────┐     │
│  │  User Management     │                  │   Notification      │     │
│  │   Microservice       │                  │   Service (CANARY)  │     │
│  │    (Stable V1)       │                  │                     │     │
│  │                      │                  │  ┌──────────────┐  │     │
│  │  ┌────────────────┐  │                  │  │  ClusterIP   │  │     │
│  │  │  NodePort      │  │                  │  │  Service     │  │     │
│  │  │  Service       │  │  HTTP (8096)     │  │              │  │     │
│  │  │  Port: 8095    │◄─┼──────────────────┼──┤  Port: 8096  │  │     │
│  │  └────────┬───────┘  │                  │  │              │  │     │
│  │           │          │                  │  │  Selector:   │  │     │
│  │  ┌────────▼───────┐  │                  │  │  app=notif   │  │     │
│  │  │  Pods (V1)     │  │                  │  │  (NO version)│  │     │
│  │  └────────────────┘  │                  │  └──────┬───────┘  │     │
│  └──────────────────────┘                  │         │          │     │
│                                             │         ▼          │     │
│                                             │  ┌──────────────┐ │     │
│                                             │  │              │ │     │
│  ┌──────────────────────────────────────┐  │  │ V1 Pods (90%)│ │     │
│  │   External Services                  │  │  │ Stable       │ │     │
│  │                                      │  │  │ Image: 1.0.0 │ │     │
│  │  ┌────────────┐  ┌────────────────┐ │  │  │ Replicas: 9  │ │     │
│  │  │ MySQL      │  │  AWS SES       │ │  │  └──────────────┘ │     │
│  │  │ (RDS)      │  │  (SMTP)        │ │  │                    │     │
│  │  │ExternalName│  │  ExternalName  │ │  │  ┌──────────────┐ │     │
│  │  └────────────┘  └────────────────┘ │  │  │              │ │     │
│  └──────────────────────────────────────┘  │  │ V2 Pods (10%)│ │     │
│                                             │  │ Canary       │ │     │
│                                             │  │ Image: 2.0.0 │ │     │
│                                             │  │ Replicas: 1  │ │     │
│                                             │  └──────────────┘ │     │
│                                             │                    │     │
│                                             └────────────────────┘     │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                     Traffic Distribution                          │ │
│  │                                                                   │ │
│  │  ┌────────────────────────────────────────────────────────────┐ │ │
│  │  │ Phase 1: Initial Canary (10% V2, 90% V1)                   │ │ │
│  │  │   V1 Pods: 9 replicas  ████████████████████ 90%            │ │ │
│  │  │   V2 Pods: 1 replica   ██ 10%                              │ │ │
│  │  └────────────────────────────────────────────────────────────┘ │ │
│  │                                                                   │ │
│  │  ┌────────────────────────────────────────────────────────────┐ │ │
│  │  │ Phase 2: Increase Canary (25% V2, 75% V1)                  │ │ │
│  │  │   V1 Pods: 7 replicas  ███████████████ 75%                 │ │ │
│  │  │   V2 Pods: 3 replicas  █████ 25%                           │ │ │
│  │  └────────────────────────────────────────────────────────────┘ │ │
│  │                                                                   │ │
│  │  ┌────────────────────────────────────────────────────────────┐ │ │
│  │  │ Phase 3: Majority Canary (50% V2, 50% V1)                  │ │ │
│  │  │   V1 Pods: 5 replicas  ██████████ 50%                      │ │ │
│  │  │   V2 Pods: 5 replicas  ██████████ 50%                      │ │ │
│  │  └────────────────────────────────────────────────────────────┘ │ │
│  │                                                                   │ │
│  │  ┌────────────────────────────────────────────────────────────┐ │ │
│  │  │ Phase 4: Full Rollout (100% V2)                            │ │ │
│  │  │   V1 Pods: 0 replicas  (deleted)                           │ │ │
│  │  │   V2 Pods: 10 replicas ████████████████████████ 100%       │ │ │
│  │  └────────────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Stable Version (V1)**: Currently running production version
2. **Canary Version (V2)**: New version being tested with limited traffic
3. **Single Service**: ClusterIP service without version selector (routes to both versions)
4. **Traffic Distribution**: Controlled by replica count ratio
5. **Monitoring**: Metrics collection from both versions
6. **Rollback Capability**: Quick revert to V1 if issues detected

### Canary Deployment Phases

1. **Initial Deployment**: 100% traffic to V1 (stable)
2. **Canary Introduction**: 10% traffic to V2, 90% to V1
3. **Gradual Increase**: 25% → 50% → 75% to V2
4. **Full Rollout**: 100% traffic to V2
5. **Cleanup**: Remove V1 deployment

## Prerequisites

### AWS Resources
- **EKS Cluster** running (version 1.21 or later)
- **Amazon RDS MySQL** instance configured
- **AWS SES** configured for email notifications
- **ACM Certificate** for SSL/TLS
- **Route53 Hosted Zone** for domain
- **CloudWatch** for monitoring

### Kubernetes Prerequisites
- **AWS Load Balancer Controller** installed
- **ExternalDNS** configured
- **Metrics Server** installed (for monitoring)
- **kubectl** configured with cluster access

### Install Metrics Server

```bash
# Install metrics server for resource monitoring
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Verify installation
kubectl get deployment metrics-server -n kube-system
kubectl top nodes
```

### Monitoring Tools (Optional but Recommended)

```bash
# Install Prometheus and Grafana for advanced monitoring
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --create-namespace
```

## Project Structure

```
Microservices-Canary-Deployments/
├── README.md
├── kube-manifests/
│   ├── 01-MySQL-externalName-Service.yml
│   ├── 02-UserManagementMicroservice-Deployment.yml
│   ├── 03-UserManagement-NodePort-Service.yml
│   ├── 04-NotificationMicroservice-Deployment.yml          # V1 - Stable
│   ├── 05-NotificationMicroservice-SMTP-externalName-Service.yml
│   ├── 06-NotificationMicroservice-ClusterIP-Service.yml   # No version selector
│   ├── 07-ALB-Ingress-SSL-Redirect-ExternalDNS.yml
│   └── 08-V2-NotificationMicroservice--Deployment.yml      # V2 - Canary
└── AWS-EKS-Masterclass-Microservices.postman_collection.json
```

### Key Files for Canary Deployment

| File | Description | Version |
|------|-------------|---------|
| `04-NotificationMicroservice-Deployment.yml` | Stable production version | V1 (1.0.0) |
| `08-V2-NotificationMicroservice--Deployment.yml` | Canary test version | V2 (4.0.0) |
| `06-NotificationMicroservice-ClusterIP-Service.yml` | Service routing to both V1 and V2 | - |

## Usage

### Step 1: Deploy Base Infrastructure

```bash
# Navigate to project directory
cd /Users/reza/home-lab/AWS-EKS/Microservices-Canary-Deployments/kube-manifests

# Create database secret
kubectl create secret generic mysql-db-password \
  --from-literal=db-password=your-db-password

# Deploy external services
kubectl apply -f 01-MySQL-externalName-Service.yml
kubectl apply -f 05-NotificationMicroservice-SMTP-externalName-Service.yml

# Deploy User Management service
kubectl apply -f 02-UserManagementMicroservice-Deployment.yml
kubectl apply -f 03-UserManagement-NodePort-Service.yml

# Verify base deployment
kubectl get all
```

### Step 2: Deploy Stable Version (V1)

```bash
# Deploy V1 (stable version) with initial replica count
kubectl apply -f 04-NotificationMicroservice-Deployment.yml

# Create service (without version selector)
kubectl apply -f 06-NotificationMicroservice-ClusterIP-Service.yml

# Verify V1 deployment
kubectl get pods -l app=notification-restapp
kubectl describe deployment notification-microservice

# Check initial replica count
kubectl get deployment notification-microservice
```

**V1 Deployment Configuration:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-microservice
  labels:
    app: notification-restapp
spec:
  replicas: 10  # Start with higher count
  selector:
    matchLabels:
      app: notification-restapp
  template:
    metadata:
      labels:
        app: notification-restapp
        version: v1  # Version label for identification
    spec:
      containers:
      - name: notification-service
        image: stacksimplify/kube-notifications-microservice:1.0.0
```

### Step 3: Deploy Ingress and Test Stable Version

```bash
# Deploy ingress
kubectl apply -f 07-ALB-Ingress-SSL-Redirect-ExternalDNS.yml

# Wait for ALB provisioning
kubectl get ingress -w

# Test V1 endpoints
curl https://services.rezaops.com/notification/health
curl -X POST https://services.rezaops.com/usermgmt/user \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com"}'

# Monitor logs
kubectl logs -f deployment/notification-microservice
```

### Step 4: Deploy Canary Version (V2) - Phase 1 (10%)

```bash
# Deploy V2 with minimal replicas (canary)
kubectl apply -f 08-V2-NotificationMicroservice--Deployment.yml

# Verify both versions running
kubectl get pods -l app=notification-restapp --show-labels

# Check traffic distribution
kubectl get pods -l app=notification-restapp -o wide

# Expected output:
# NAME                                             READY   VERSION
# notification-microservice-v1-xxx                 1/1     v1
# notification-microservice-v1-xxx                 1/1     v1
# notification-microservice-v1-xxx                 1/1     v1
# notification-microservice-v1-xxx                 1/1     v1
# notification-microservice-v1-xxx                 1/1     v1
# notification-microservice-v1-xxx                 1/1     v1
# notification-microservice-v1-xxx                 1/1     v1
# notification-microservice-v1-xxx                 1/1     v1
# notification-microservice-v1-xxx                 1/1     v1
# notification-v2-microservice-xxx                 1/1     v2
# Total: 9 V1 pods (90%) + 1 V2 pod (10%)
```

**V2 Deployment Configuration:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-v2-microservice
  labels:
    app: notification-restapp
spec:
  replicas: 1  # Start with 1 pod (10% if V1 has 9 pods)
  selector:
    matchLabels:
      app: notification-restapp
      version: v2
  template:
    metadata:
      labels:
        app: notification-restapp
        version: v2
    spec:
      containers:
      - name: notification-service
        image: stacksimplify/kube-notifications-microservice:4.0.0-AWS-XRay
```

### Step 5: Monitor Canary Performance

```bash
# Monitor both versions simultaneously
kubectl logs -f -l app=notification-restapp,version=v1
kubectl logs -f -l app=notification-restapp,version=v2

# Check resource usage
kubectl top pods -l app=notification-restapp

# Monitor error rates
kubectl get events --field-selector involvedObject.kind=Pod

# Check endpoint responses
for i in {1..100}; do
  curl -s https://services.rezaops.com/notification/health | grep version
  sleep 1
done

# Monitor metrics (if Prometheus installed)
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
# Access: http://localhost:9090
# Query: rate(http_requests_total{version="v2"}[5m])
```

### Step 6: Gradually Increase Canary Traffic

**Phase 2: Increase to 25% (3 V2 pods, 7 V1 pods)**

```bash
# Scale V1 down
kubectl scale deployment notification-microservice --replicas=7

# Scale V2 up
kubectl scale deployment notification-v2-microservice --replicas=3

# Verify distribution
kubectl get pods -l app=notification-restapp -o wide

# Monitor for 15-30 minutes
# Check error rates, latency, resource usage
```

**Phase 3: Increase to 50% (5 V2 pods, 5 V1 pods)**

```bash
# Equal distribution
kubectl scale deployment notification-microservice --replicas=5
kubectl scale deployment notification-v2-microservice --replicas=5

# Monitor A/B comparison
# Compare metrics between V1 and V2
```

**Phase 4: Increase to 75% (7 V2 pods, 3 V1 pods)**

```bash
# Majority to V2
kubectl scale deployment notification-microservice --replicas=3
kubectl scale deployment notification-v2-microservice --replicas=7

# Final validation before full rollout
```

### Step 7: Complete Rollout or Rollback

**Option A: Complete Rollout (V2 Success)**

```bash
# Scale V2 to 100%
kubectl scale deployment notification-v2-microservice --replicas=10

# Scale V1 to 0
kubectl scale deployment notification-microservice --replicas=0

# Verify all traffic on V2
kubectl get pods -l app=notification-restapp

# Wait for traffic validation (1-2 hours)

# Delete V1 deployment
kubectl delete deployment notification-microservice

# Rename V2 to stable (optional)
kubectl patch deployment notification-v2-microservice -p '{"metadata":{"name":"notification-microservice"}}'
```

**Option B: Rollback (V2 Issues Detected)**

```bash
# Immediately scale V2 to 0
kubectl scale deployment notification-v2-microservice --replicas=0

# Scale V1 back to full capacity
kubectl scale deployment notification-microservice --replicas=10

# Verify rollback
kubectl get pods -l app=notification-restapp

# Investigate V2 issues
kubectl logs -l app=notification-restapp,version=v2 --previous

# Delete V2 deployment
kubectl delete deployment notification-v2-microservice
```

### Step 8: Automated Canary with Scripts

Create a canary deployment script:

```bash
#!/bin/bash
# canary-deploy.sh

set -e

V1_DEPLOYMENT="notification-microservice"
V2_DEPLOYMENT="notification-v2-microservice"
TOTAL_REPLICAS=10
PHASES=(1 3 5 7 10)  # Canary percentages: 10%, 30%, 50%, 70%, 100%
WAIT_TIME=300  # 5 minutes between phases

for i in "${!PHASES[@]}"; do
    V2_REPLICAS=${PHASES[$i]}
    V1_REPLICAS=$((TOTAL_REPLICAS - V2_REPLICAS))

    echo "Phase $((i+1)): Scaling V2 to $V2_REPLICAS replicas (${PHASES[$i]}0%)"

    kubectl scale deployment $V2_DEPLOYMENT --replicas=$V2_REPLICAS
    kubectl scale deployment $V1_DEPLOYMENT --replicas=$V1_REPLICAS

    echo "Waiting for pods to be ready..."
    kubectl wait --for=condition=ready pod -l app=notification-restapp,version=v2 --timeout=120s

    echo "Current distribution:"
    kubectl get pods -l app=notification-restapp -o wide

    if [ $V2_REPLICAS -lt $TOTAL_REPLICAS ]; then
        echo "Monitoring for $WAIT_TIME seconds..."
        sleep $WAIT_TIME

        # Check for errors
        ERROR_COUNT=$(kubectl get events --field-selector involvedObject.kind=Pod,reason=BackOff | grep -c "notification-v2" || true)
        if [ $ERROR_COUNT -gt 0 ]; then
            echo "Errors detected! Rolling back..."
            kubectl scale deployment $V2_DEPLOYMENT --replicas=0
            kubectl scale deployment $V1_DEPLOYMENT --replicas=$TOTAL_REPLICAS
            exit 1
        fi
    fi
done

echo "Canary deployment complete! V2 is now at 100%"
echo "Monitor for stability before removing V1"
```

```bash
# Make script executable
chmod +x canary-deploy.sh

# Run canary deployment
./canary-deploy.sh
```

## Configuration

### Service Configuration (Version-Agnostic)

The key to canary deployments is a service that selects pods from both versions:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: notification-clusterip-service
spec:
  type: ClusterIP
  selector:
    app: notification-restapp  # No version selector!
  ports:
  - port: 8096
    targetPort: 8096
```

This service routes traffic to all pods with `app=notification-restapp` label, regardless of version.

### Deployment Labels Strategy

**V1 Deployment:**
```yaml
metadata:
  labels:
    app: notification-restapp
    version: v1
spec:
  selector:
    matchLabels:
      app: notification-restapp
      version: v1
  template:
    metadata:
      labels:
        app: notification-restapp
        version: v1
```

**V2 Deployment:**
```yaml
metadata:
  labels:
    app: notification-restapp
    version: v2
spec:
  selector:
    matchLabels:
      app: notification-restapp
      version: v2
  template:
    metadata:
      labels:
        app: notification-restapp
        version: v2
```

### Traffic Distribution Calculation

Traffic percentage = (Version Replicas / Total Replicas) × 100

**Examples:**

| V1 Replicas | V2 Replicas | Total | V1 % | V2 % |
|-------------|-------------|-------|------|------|
| 10 | 0 | 10 | 100% | 0% |
| 9 | 1 | 10 | 90% | 10% |
| 7 | 3 | 10 | 70% | 30% |
| 5 | 5 | 10 | 50% | 50% |
| 3 | 7 | 10 | 30% | 70% |
| 0 | 10 | 10 | 0% | 100% |

### Health Check Configuration

Ensure both versions have identical health checks:

```yaml
livenessProbe:
  httpGet:
    path: /notification/health
    port: 8096
  initialDelaySeconds: 60
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /notification/ready
    port: 8096
  initialDelaySeconds: 30
  periodSeconds: 5
```

## Features

### 1. Progressive Traffic Shifting

Gradually increase traffic to new version:
- Start: 10% canary, 90% stable
- Increment: Increase by 15-25% intervals
- Monitor: Check metrics at each phase
- Validate: Ensure no regressions
- Complete: Full rollout or rollback

### 2. Risk Mitigation

**Blast Radius Control:**
- Limited initial exposure (10%)
- Quick rollback capability
- Production traffic validation
- Real user feedback

**Rollback Scenarios:**
```bash
# Immediate rollback (< 1 minute)
kubectl scale deployment notification-v2-microservice --replicas=0
kubectl scale deployment notification-microservice --replicas=10

# Gradual rollback
kubectl scale deployment notification-v2-microservice --replicas=3
kubectl scale deployment notification-microservice --replicas=7
# Continue scaling down V2
```

### 3. A/B Comparison

Compare versions side-by-side:

```bash
# V1 metrics
kubectl top pods -l version=v1

# V2 metrics
kubectl top pods -l version=v2

# Compare error rates
kubectl logs -l version=v1 | grep ERROR | wc -l
kubectl logs -l version=v2 | grep ERROR | wc -l

# Compare response times (if instrumented)
```

### 4. Version-Specific Monitoring

```yaml
# Prometheus ServiceMonitor for V1
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: notification-v1-metrics
spec:
  selector:
    matchLabels:
      app: notification-restapp
      version: v1
  endpoints:
  - port: metrics

# Prometheus ServiceMonitor for V2
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: notification-v2-metrics
spec:
  selector:
    matchLabels:
      app: notification-restapp
      version: v2
  endpoints:
  - port: metrics
```

### 5. Automated Canary Analysis

**Using Flagger (GitOps Approach):**

```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: notification-canary
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: notification-microservice
  service:
    port: 8096
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
      interval: 1m
    - name: request-duration
      thresholdRange:
        max: 500
      interval: 1m
```

### 6. Feature Flags Integration

Combine canary with feature flags for granular control:

```yaml
env:
- name: FEATURE_NEW_EMAIL_TEMPLATE
  value: "true"  # Enable in V2
- name: FEATURE_FLAG_SERVICE_URL
  value: "http://feature-flag-service:8080"
```

## Troubleshooting

### Uneven Traffic Distribution

```bash
# Check actual pod count
kubectl get pods -l app=notification-restapp -o wide

# Verify service endpoints
kubectl get endpoints notification-clusterip-service

# Check if all pods are ready
kubectl get pods -l app=notification-restapp -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.phase}{"\n"}{end}'

# Ensure readiness probes pass
kubectl describe pod -l version=v2 | grep -A 10 "Readiness"
```

### Canary Version Not Receiving Traffic

```bash
# Verify labels match service selector
kubectl get svc notification-clusterip-service -o yaml | grep selector
kubectl get pods -l app=notification-restapp --show-labels

# Check pod readiness
kubectl get pods -l version=v2 -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.conditions[?(@.type=="Ready")].status}{"\n"}{end}'

# Test direct pod connection
kubectl port-forward <v2-pod-name> 8096:8096
curl http://localhost:8096/notification/health
```

### High Error Rate in Canary

```bash
# Immediately reduce canary traffic
kubectl scale deployment notification-v2-microservice --replicas=1
kubectl scale deployment notification-microservice --replicas=9

# Analyze errors
kubectl logs -l version=v2 --tail=100 | grep -i error

# Compare with V1
kubectl logs -l version=v1 --tail=100 | grep -i error

# Check resource constraints
kubectl top pods -l version=v2
kubectl describe pod -l version=v2 | grep -A 5 "Limits\|Requests"

# If critical, rollback immediately
kubectl scale deployment notification-v2-microservice --replicas=0
kubectl scale deployment notification-microservice --replicas=10
```

### Metrics Not Available

```bash
# Check metrics server
kubectl get deployment metrics-server -n kube-system

# Verify metrics API
kubectl get --raw /apis/metrics.k8s.io/v1beta1/pods

# Check Prometheus (if installed)
kubectl get pods -n monitoring
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Verify ServiceMonitors
kubectl get servicemonitor -n monitoring
```

### Canary Stuck During Rollout

```bash
# Check for stuck pods
kubectl get pods -l app=notification-restapp -o wide

# Check for image pull errors
kubectl describe pod -l version=v2 | grep -A 10 "Events"

# Verify image exists
docker pull stacksimplify/kube-notifications-microservice:4.0.0-AWS-XRay

# Check resource quotas
kubectl describe resourcequota

# Force pod recreation
kubectl delete pod -l version=v2
```

## Best Practices

### 1. Canary Deployment Strategy

**Define Clear Phases:**
```
Phase 0: Baseline (V1 100%)
Phase 1: Initial Canary (V2 10%)      → Monitor 15-30 min
Phase 2: Expand (V2 25%)              → Monitor 15-30 min
Phase 3: Majority (V2 50%)            → Monitor 30-60 min
Phase 4: Dominant (V2 75%)            → Monitor 30-60 min
Phase 5: Complete (V2 100%)           → Monitor 2-4 hours
Phase 6: Cleanup (Remove V1)
```

**Set Success Criteria:**
- Error rate < 0.1%
- P95 latency < baseline + 10%
- CPU/Memory within limits
- No increase in timeout errors
- Business metrics unchanged

### 2. Monitoring and Metrics

**Essential Metrics to Track:**

```yaml
# Request Rate
rate(http_requests_total{version="v2"}[5m])

# Error Rate
rate(http_requests_total{version="v2",status=~"5.."}[5m])
/
rate(http_requests_total{version="v2"}[5m])

# Latency (P95, P99)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{version="v2"}[5m]))

# Resource Usage
container_cpu_usage_seconds_total{pod=~"notification-v2.*"}
container_memory_usage_bytes{pod=~"notification-v2.*"}
```

**Create Comparison Dashboard:**
```yaml
# Grafana Dashboard JSON snippet
{
  "panels": [
    {
      "title": "Request Rate by Version",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total{version=\"v1\"}[5m]))",
          "legendFormat": "V1"
        },
        {
          "expr": "sum(rate(http_requests_total{version=\"v2\"}[5m]))",
          "legendFormat": "V2"
        }
      ]
    }
  ]
}
```

### 3. Rollback Criteria

**Automatic Rollback Triggers:**
- Error rate > 1%
- P95 latency > 2x baseline
- Pod crash loops
- Memory/CPU exceeds limits
- Failed health checks

**Manual Rollback Decision:**
```bash
# Quick health check
if kubectl logs -l version=v2 --since=5m | grep -c ERROR > 10; then
    echo "High error rate detected, rolling back..."
    kubectl scale deployment notification-v2-microservice --replicas=0
    kubectl scale deployment notification-microservice --replicas=10
fi
```

### 4. Testing Before Canary

**Pre-Production Validation:**
```bash
# Staging environment testing
kubectl apply -f 08-V2-NotificationMicroservice--Deployment.yml -n staging

# Load testing
kubectl run load-test --image=williamyeh/wrk --rm -it --restart=Never -- \
  -t 4 -c 100 -d 60s https://staging.rezaops.com/notification/health

# Integration testing
kubectl apply -f integration-tests.yml
```

### 5. Communication and Documentation

**Change Documentation:**
```markdown
## Canary Deployment: Notification Service V2

**Date:** 2024-01-15
**Version:** 4.0.0-AWS-XRay
**Changes:**
- Added AWS X-Ray tracing
- Improved error handling
- Updated dependencies

**Rollout Plan:**
- 10:00 AM - Deploy V2 at 10%
- 10:30 AM - Increase to 25% (if metrics good)
- 11:00 AM - Increase to 50%
- 12:00 PM - Increase to 75%
- 02:00 PM - Complete rollout to 100%
- 04:00 PM - Remove V1

**Rollback Plan:**
- Scale V2 to 0 replicas
- Scale V1 to 10 replicas
- Investigate issues

**Success Metrics:**
- Error rate < 0.1%
- Latency P95 < 200ms
- No OOM errors
```

### 6. Advanced Patterns

**Header-Based Routing (requires Service Mesh):**
```yaml
# Istio VirtualService for canary
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: notification-canary
spec:
  hosts:
  - notification-service
  http:
  - match:
    - headers:
        x-canary:
          exact: "true"
    route:
    - destination:
        host: notification-service
        subset: v2
  - route:
    - destination:
        host: notification-service
        subset: v1
      weight: 90
    - destination:
        host: notification-service
        subset: v2
      weight: 10
```

**User-Based Canary (Beta Users):**
```yaml
# Feature flag integration
env:
- name: CANARY_USER_PERCENTAGE
  value: "10"
- name: CANARY_USER_IDS
  value: "user1,user2,user3"
```

### 7. Cost Optimization

**During Canary:**
- Keep total replica count constant
- Use Spot instances for canary pods (if acceptable)
- Limit canary duration
- Clean up promptly after validation

```yaml
# Spot instance node affinity for canary
affinity:
  nodeAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      preference:
        matchExpressions:
        - key: kubernetes.io/lifecycle
          operator: In
          values:
          - spot
```
