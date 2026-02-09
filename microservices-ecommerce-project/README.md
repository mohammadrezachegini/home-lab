# 🛒 Microservices E-Commerce Platform

**A production-ready microservices architecture deployed on Kubernetes with automated CI/CD pipelines and comprehensive monitoring.**

![Kubernetes](https://img.shields.io/badge/kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)
![Docker](https://img.shields.io/badge/docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Jenkins](https://img.shields.io/badge/jenkins-D24939?style=for-the-badge&logo=jenkins&logoColor=white)
![Prometheus](https://img.shields.io/badge/prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white)

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Detailed Setup](#-detailed-setup)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Monitoring](#-monitoring)
- [API Endpoints](#-api-endpoints)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Project Highlights](#-project-highlights)

---

## 🎯 Project Overview

This project demonstrates a complete microservices-based e-commerce platform built from scratch, showcasing modern DevOps practices and cloud-native technologies. The system consists of five independent microservices written in different programming languages, orchestrated on Kubernetes with full automation and observability.

### **Business Context**
An e-commerce platform handling product catalogs, user management, order processing, payments, and inventory tracking - all designed to scale independently based on demand.

### **Key Features**
- ✅ **Multi-language microservices** (Node.js, Python, Go)
- ✅ **Kubernetes orchestration** with K3s
- ✅ **Automated CI/CD** with Jenkins
- ✅ **Full observability** with Prometheus & Grafana
- ✅ **Zero-downtime deployments** with rolling updates
- ✅ **Production-ready** infrastructure patterns

---

## 🏗️ Architecture
```
                                    ┌─────────────────┐
                                    │  NGINX Ingress  │
                                    │   Controller    │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
            ┌───────▼────────┐      ┌───────▼────────┐      ┌───────▼────────┐
            │  Product Svc   │      │   User Svc     │      │  Order Svc     │
            │   (Node.js)    │      │   (Python)     │      │   (Node.js)    │
            │   Port 8001    │      │   Port 8002    │      │   Port 8003    │
            └───────┬────────┘      └───────┬────────┘      └───────┬────────┘
                    │                        │                        │
                    └────────────────────────┼────────────────────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
            ┌───────▼────────┐      ┌───────▼────────┐      ┌───────▼────────┐
            │  Payment Svc   │      │ Inventory Svc  │      │   PostgreSQL   │
            │     (Go)       │      │   (Node.js)    │      │   StatefulSet  │
            │   Port 8004    │      │   Port 8005    │      │   Port 5432    │
            └────────────────┘      └────────────────┘      └────────────────┘

                                ┌──────────────────────┐
                                │  Monitoring Stack    │
                                ├──────────────────────┤
                                │  Prometheus (30090)  │
                                │  Grafana (30300)     │
                                └──────────────────────┘

                                ┌──────────────────────┐
                                │     CI/CD Layer      │
                                ├──────────────────────┤
                                │  Jenkins (30000)     │
                                │  - Build & Test      │
                                │  - Docker Push       │
                                │  - K8s Deployment    │
                                └──────────────────────┘
```

### **Service Communication Flow**
```
User Request → NGINX Ingress → Service Router → Microservice → PostgreSQL
                     ↓
              Prometheus (scrapes metrics)
                     ↓
              Grafana (visualizes)
```

---

## 🛠️ Tech Stack

### **Microservices**
| Service | Language | Framework | Port | Purpose |
|---------|----------|-----------|------|---------|
| Product | Node.js | Express | 8001 | Product catalog management |
| User | Python | Flask | 8002 | User authentication & profiles |
| Order | Node.js | Express | 8003 | Order processing & tracking |
| Payment | Go | Gin | 8004 | Payment processing |
| Inventory | Node.js | Express | 8005 | Stock management |

### **Infrastructure**
- **Kubernetes**: K3s (lightweight Kubernetes)
- **Container Runtime**: Docker
- **Ingress Controller**: NGINX
- **Database**: PostgreSQL 14
- **Registry**: Docker Hub

### **CI/CD**
- **Jenkins**: Automated pipelines (build, test, deploy)
- **SCM**: Git/GitHub
- **Image Registry**: Docker Hub

### **Monitoring & Observability**
- **Prometheus**: Metrics collection & alerting
- **Grafana**: Visualization & dashboards
- **Metrics Format**: Prometheus exposition format

---

## 📦 Prerequisites

### **System Requirements**
```bash
# Minimum specs
- CPU: 4 cores
- RAM: 8GB
- Disk: 50GB free space
- OS: Linux (Ubuntu 20.04+ or Arch Linux)
```

### **Required Software**
```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# K3s (Kubernetes)
curl -sfL https://get.k3s.io | sh -

# kubectl
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config

# Verify installations
docker --version          # Docker 24.0+
kubectl version --short   # v1.28+
k3s --version            # v1.28+

# Git
sudo apt install git -y   # Ubuntu/Debian
sudo pacman -S git        # Arch Linux
```

---

## 🚀 Quick Start

### **1. Clone Repository**
```bash
git clone https://github.com/mohammadrezachegini/home-lab.git
cd home-lab/microservices-ecommerce-project
```

### **2. Start K3s Cluster**
```bash
# Start K3s (if not running)
sudo systemctl start k3s

# Verify cluster is ready
kubectl get nodes
# Expected: STATUS = Ready

# Create namespaces
kubectl create namespace ecommerce
kubectl create namespace jenkins
kubectl create namespace monitoring
```

### **3. Deploy Database**
```bash
# Deploy PostgreSQL StatefulSet
kubectl apply -f k8s/postgres-statefulset.yaml -n ecommerce

# Wait for database to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n ecommerce --timeout=120s

# Verify
kubectl get pods -n ecommerce
# Expected: postgres-0  1/1  Running
```

### **4. Deploy Microservices**
```bash
# Deploy all services
kubectl apply -f k8s/product-service.yaml -n ecommerce
kubectl apply -f k8s/user-service.yaml -n ecommerce
kubectl apply -f k8s/order-service.yaml -n ecommerce
kubectl apply -f k8s/payment-service.yaml -n ecommerce
kubectl apply -f k8s/inventory-service.yaml -n ecommerce

# Wait for all pods to be ready
kubectl wait --for=condition=ready pod --all -n ecommerce --timeout=180s

# Verify all services
kubectl get pods -n ecommerce
# Expected: All pods Running (1/1)
```

### **5. Deploy NGINX Ingress**
```bash
# Apply ingress rules
kubectl apply -f k8s/ingress.yaml -n ecommerce

# Verify ingress
kubectl get ingress -n ecommerce
# Expected: ADDRESS should show IP
```

### **6. Test Services**
```bash
# Test all health endpoints
curl http://localhost/products/health
curl http://localhost/users/health
curl http://localhost/orders/health
curl http://localhost/payments/health
curl http://localhost/inventory/health

# Expected: {"status": "healthy"} from all services ✅

# Test API endpoints
curl http://localhost/products          # List products
curl http://localhost/users             # List users
curl http://localhost/orders            # List orders
```

### **7. Deploy Monitoring Stack**
```bash
# Deploy Prometheus
kubectl apply -f k8s/monitoring/prometheus-rbac.yaml
kubectl apply -f k8s/monitoring/prometheus-config.yaml
kubectl apply -f k8s/monitoring/prometheus-deployment.yaml
kubectl apply -f k8s/monitoring/prometheus-service.yaml

# Deploy Grafana
kubectl apply -f k8s/monitoring/grafana-deployment.yaml
kubectl apply -f k8s/monitoring/grafana-service.yaml

# Wait for monitoring pods
kubectl wait --for=condition=ready pod --all -n monitoring --timeout=120s

# Access monitoring
echo "Prometheus: http://localhost:30090"
echo "Grafana: http://localhost:30300 (admin/admin123)"
```

### **8. Deploy Jenkins**
```bash
# Deploy Jenkins
kubectl apply -f k8s/jenkins/jenkins-deployment.yaml -n jenkins
kubectl apply -f k8s/jenkins/jenkins-service.yaml -n jenkins

# Wait for Jenkins
kubectl wait --for=condition=ready pod -l app=jenkins -n jenkins --timeout=180s

# Access Jenkins
echo "Jenkins: http://localhost:30000 (admin/admin123)"
```

---

## 🔧 Detailed Setup

### **Database Configuration**
```yaml
# k8s/postgres-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:14
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: ecommerce
        - name: POSTGRES_USER
          value: postgres
        - name: POSTGRES_PASSWORD
          value: postgres123
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 5Gi
```

### **Service Deployment Example**
```yaml
# k8s/product-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: product-service
  template:
    metadata:
      labels:
        app: product-service
    spec:
      containers:
      - name: product-service
        image: lowyiiii/product-service:latest
        ports:
        - containerPort: 8001
        env:
        - name: PORT
          value: "8001"
        - name: DB_HOST
          value: postgres.ecommerce.svc.cluster.local
        - name: DB_PORT
          value: "5432"
        - name: DB_NAME
          value: ecommerce
        - name: DB_USER
          value: postgres
        - name: DB_PASSWORD
          value: postgres123
        livenessProbe:
          httpGet:
            path: /health
            port: 8001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8001
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: product-service
spec:
  selector:
    app: product-service
  ports:
  - protocol: TCP
    port: 8001
    targetPort: 8001
  type: ClusterIP
```

### **NGINX Ingress Configuration**
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ecommerce-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  ingressClassName: nginx
  rules:
  - http:
      paths:
      - path: /products(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: product-service
            port:
              number: 8001
      - path: /users(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: user-service
            port:
              number: 8002
      - path: /orders(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: order-service
            port:
              number: 8003
      - path: /payments(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: payment-service
            port:
              number: 8004
      - path: /inventory(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: inventory-service
            port:
              number: 8005
```

---

## 🔄 CI/CD Pipeline

### **Jenkins Pipeline Architecture**
```
GitHub Repository
      ↓
  [Git Clone]
      ↓
┌─────────────────┐
│  Build Stage    │
│  - npm install  │
│  - pip install  │
│  - go mod       │
└────────┬────────┘
         ↓
┌─────────────────┐
│   Test Stage    │
│  - Unit tests   │
│  - Linting      │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Docker Build   │
│  - Build images │
│  - Tag with SHA │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Docker Push    │
│  - Push to Hub  │
└────────┬────────┘
         ↓
┌─────────────────┐
│  K8s Deploy     │
│  - Apply YAML   │
│  - Rolling Updt │
└─────────────────┘
```

### **Jenkins Setup**
```bash
# 1. Access Jenkins
open http://localhost:30000

# 2. Install Required Plugins
# Dashboard → Manage Jenkins → Plugins
# - Docker Pipeline
# - Kubernetes
# - Git
# - Pipeline

# 3. Configure Docker Hub Credentials
# Dashboard → Manage Jenkins → Credentials → System → Global credentials
# Add: Username with password
# ID: dockerhub-credentials
# Username: lowyiiii
# Password: [your-docker-hub-password]

# 4. Configure Kubernetes
# Dashboard → Manage Jenkins → Clouds → New cloud
# Type: Kubernetes
# Kubernetes URL: https://kubernetes.default.svc
# Jenkins URL: http://jenkins.jenkins.svc.cluster.local:8080
```

### **Jenkinsfile Example**
```groovy
pipeline {
    agent any
    
    environment {
        DOCKER_HUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_HUB_REPO = 'lowyiiii'
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'master',
                    url: 'https://github.com/mohammadrezachegini/home-lab.git'
            }
        }
        
        stage('Build Services') {
            parallel {
                stage('Product Service') {
                    steps {
                        dir('microservices-ecommerce-project/product-service') {
                            sh 'npm install'
                            sh 'npm test'
                        }
                    }
                }
                stage('User Service') {
                    steps {
                        dir('microservices-ecommerce-project/user-service') {
                            sh 'pip install -r requirements.txt'
                            sh 'pytest'
                        }
                    }
                }
                stage('Order Service') {
                    steps {
                        dir('microservices-ecommerce-project/order-service') {
                            sh 'npm install'
                            sh 'npm test'
                        }
                    }
                }
                stage('Payment Service') {
                    steps {
                        dir('microservices-ecommerce-project/payment-service') {
                            sh 'go mod download'
                            sh 'go test ./...'
                        }
                    }
                }
                stage('Inventory Service') {
                    steps {
                        dir('microservices-ecommerce-project/inventory-service') {
                            sh 'npm install'
                            sh 'npm test'
                        }
                    }
                }
            }
        }
        
        stage('Docker Build & Push') {
            steps {
                script {
                    def services = ['product', 'user', 'order', 'payment', 'inventory']
                    
                    docker.withRegistry('', 'dockerhub-credentials') {
                        services.each { service ->
                            dir("microservices-ecommerce-project/${service}-service") {
                                def image = docker.build("${DOCKER_HUB_REPO}/${service}-service:${BUILD_NUMBER}")
                                image.push()
                                image.push('latest')
                            }
                        }
                    }
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    def services = ['product', 'user', 'order', 'payment', 'inventory']
                    
                    services.each { service ->
                        sh """
                            kubectl set image deployment/${service}-service \
                                ${service}-service=${DOCKER_HUB_REPO}/${service}-service:${BUILD_NUMBER} \
                                -n ecommerce
                            kubectl rollout status deployment/${service}-service -n ecommerce
                        """
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline executed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
```

### **Manual CI/CD Execution**
```bash
# Build Docker images
cd microservices-ecommerce-project

# Build all services
docker build -t lowyiiii/product-service:latest ./product-service
docker build -t lowyiiii/user-service:latest ./user-service
docker build -t lowyiiii/order-service:latest ./order-service
docker build -t lowyiiii/payment-service:latest ./payment-service
docker build -t lowyiiii/inventory-service:latest ./inventory-service

# Login to Docker Hub
docker login -u lowyiiii

# Push images
docker push lowyiiii/product-service:latest
docker push lowyiiii/user-service:latest
docker push lowyiiii/order-service:latest
docker push lowyiiii/payment-service:latest
docker push lowyiiii/inventory-service:latest

# Deploy to Kubernetes
kubectl set image deployment/product-service product-service=lowyiiii/product-service:latest -n ecommerce
kubectl set image deployment/user-service user-service=lowyiiii/user-service:latest -n ecommerce
kubectl set image deployment/order-service order-service=lowyiiii/order-service:latest -n ecommerce
kubectl set image deployment/payment-service payment-service=lowyiiii/payment-service:latest -n ecommerce
kubectl set image deployment/inventory-service inventory-service=lowyiiii/inventory-service:latest -n ecommerce

# Verify rolling updates
kubectl rollout status deployment/product-service -n ecommerce
kubectl rollout status deployment/user-service -n ecommerce
kubectl rollout status deployment/order-service -n ecommerce
kubectl rollout status deployment/payment-service -n ecommerce
kubectl rollout status deployment/inventory-service -n ecommerce
```

---

## 📊 Monitoring

### **Prometheus Configuration**
```yaml
# k8s/monitoring/prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    scrape_configs:
      - job_name: 'product-service'
        static_configs:
          - targets: ['product-service.ecommerce.svc.cluster.local:8001']
        metrics_path: '/metrics'
      
      - job_name: 'user-service'
        static_configs:
          - targets: ['user-service.ecommerce.svc.cluster.local:8002']
        metrics_path: '/metrics'
      
      - job_name: 'order-service'
        static_configs:
          - targets: ['order-service.ecommerce.svc.cluster.local:8003']
        metrics_path: '/metrics'
      
      - job_name: 'payment-service'
        static_configs:
          - targets: ['payment-service.ecommerce.svc.cluster.local:8004']
        metrics_path: '/metrics'
      
      - job_name: 'inventory-service'
        static_configs:
          - targets: ['inventory-service.ecommerce.svc.cluster.local:8005']
        metrics_path: '/metrics'
      
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__
```

### **Access Monitoring Dashboards**
```bash
# Prometheus
open http://localhost:30090

# Grafana
open http://localhost:30300
# Login: admin / admin123

# Check Prometheus targets
curl http://localhost:30090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# Sample queries in Prometheus:
# - http_requests_total
# - rate(http_requests_total[5m])
# - histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### **Grafana Dashboard Setup**
```bash
# 1. Access Grafana
open http://localhost:30300

# 2. Add Prometheus Data Source
# Configuration → Data Sources → Add data source
# Type: Prometheus
# URL: http://prometheus.monitoring.svc.cluster.local:9090
# Save & Test

# 3. Import Dashboard
# Dashboards → Import
# Upload JSON or use dashboard ID: 3662 (Prometheus 2.0 Stats)

# 4. Create Custom Dashboard
# Panel 1: Request Rate
# Query: rate(http_requests_total[5m])

# Panel 2: Error Rate
# Query: rate(http_requests_total{status=~"5.."}[5m])

# Panel 3: Latency (95th percentile)
# Query: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Panel 4: Active Connections
# Query: http_active_connections
```

### **Metrics Available**

Each service exposes these metrics at `/metrics`:
```
# HTTP Request metrics
http_requests_total{method="GET",route="/products",status="200"} 1250
http_requests_total{method="POST",route="/products",status="201"} 340

# Request duration histogram
http_request_duration_seconds_bucket{le="0.1"} 980
http_request_duration_seconds_bucket{le="0.5"} 1190
http_request_duration_seconds_bucket{le="1.0"} 1250

# Node.js/Python default metrics
process_cpu_seconds_total
process_resident_memory_bytes
nodejs_heap_size_total_bytes
```

### **Generate Test Traffic**
```bash
# Install Apache Bench (if needed)
sudo apt install apache2-utils -y

# Generate load on product service
ab -n 1000 -c 10 http://localhost/products/

# Generate load on all services
for service in products users orders payments inventory; do
    echo "Testing $service..."
    ab -n 500 -c 5 http://localhost/$service/ &
done
wait

# Check metrics
curl http://localhost:30090/api/v1/query?query=rate(http_requests_total[5m])
```

---

## 📡 API Endpoints

### **Product Service (Port 8001)**
```bash
# Health check
GET http://localhost/products/health
Response: {"status": "healthy", "timestamp": "2025-02-09T12:00:00Z"}

# List all products
GET http://localhost/products
Response: [
  {
    "id": 1,
    "name": "Laptop",
    "price": 999.99,
    "category": "Electronics",
    "stock": 50
  }
]

# Get product by ID
GET http://localhost/products/1
Response: {
  "id": 1,
  "name": "Laptop",
  "price": 999.99,
  "description": "High-performance laptop",
  "category": "Electronics",
  "stock": 50
}

# Create product
POST http://localhost/products
Body: {
  "name": "Smartphone",
  "price": 699.99,
  "category": "Electronics",
  "stock": 100
}
Response: {"id": 2, "message": "Product created successfully"}

# Update product
PUT http://localhost/products/1
Body: {
  "name": "Gaming Laptop",
  "price": 1299.99,
  "stock": 30
}
Response: {"message": "Product updated successfully"}

# Delete product
DELETE http://localhost/products/1
Response: {"message": "Product deleted successfully"}

# Metrics endpoint
GET http://localhost/products/metrics
Response: Prometheus format metrics
```

### **User Service (Port 8002)**
```bash
# Health check
GET http://localhost/users/health

# List all users
GET http://localhost/users

# Get user by ID
GET http://localhost/users/1

# Register user
POST http://localhost/users/register
Body: {
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepass123"
}

# Login user
POST http://localhost/users/login
Body: {
  "email": "john@example.com",
  "password": "securepass123"
}
Response: {"token": "eyJhbGci...", "user_id": 1}

# Update user profile
PUT http://localhost/users/1
Body: {
  "email": "newemail@example.com",
  "phone": "+1234567890"
}

# Delete user
DELETE http://localhost/users/1

# Metrics
GET http://localhost/users/metrics
```

### **Order Service (Port 8003)**
```bash
# Health check
GET http://localhost/orders/health

# List all orders
GET http://localhost/orders

# Get order by ID
GET http://localhost/orders/1

# Create order
POST http://localhost/orders
Body: {
  "user_id": 1,
  "items": [
    {"product_id": 1, "quantity": 2},
    {"product_id": 2, "quantity": 1}
  ],
  "total_amount": 2699.97
}

# Get orders by user
GET http://localhost/orders/user/1

# Update order status
PUT http://localhost/orders/1/status
Body: {
  "status": "shipped"
}

# Cancel order
DELETE http://localhost/orders/1

# Metrics
GET http://localhost/orders/metrics
```

### **Payment Service (Port 8004)**
```bash
# Health check
GET http://localhost/payments/health

# Process payment
POST http://localhost/payments/process
Body: {
  "order_id": 1,
  "amount": 2699.97,
  "payment_method": "credit_card",
  "card_details": {
    "number": "4111111111111111",
    "expiry": "12/25",
    "cvv": "123"
  }
}
Response: {
  "transaction_id": "txn_abc123",
  "status": "success",
  "amount": 2699.97
}

# Get payment status
GET http://localhost/payments/transaction/txn_abc123

# Refund payment
POST http://localhost/payments/refund
Body: {
  "transaction_id": "txn_abc123",
  "amount": 2699.97
}

# Metrics
GET http://localhost/payments/metrics
```

### **Inventory Service (Port 8005)**
```bash
# Health check
GET http://localhost/inventory/health

# Check stock
GET http://localhost/inventory/stock/1
Response: {
  "product_id": 1,
  "quantity": 50,
  "reserved": 5,
  "available": 45
}

# Reserve stock
POST http://localhost/inventory/reserve
Body: {
  "product_id": 1,
  "quantity": 2,
  "order_id": 1
}

# Release stock
POST http://localhost/inventory/release
Body: {
  "product_id": 1,
  "quantity": 2,
  "order_id": 1
}

# Update stock
PUT http://localhost/inventory/stock/1
Body: {
  "quantity": 100
}

# Metrics
GET http://localhost/inventory/metrics
```

---

## 🧪 Testing

### **Health Checks**
```bash
# Test all services health
for service in products users orders payments inventory; do
    echo "Testing $service..."
    curl -s http://localhost/$service/health | jq
done

# Expected output for each:
# {
#   "status": "healthy",
#   "timestamp": "2025-02-09T12:00:00Z",
#   "service": "product-service",
#   "version": "1.0.0"
# }
```

### **End-to-End Test Flow**
```bash
# 1. Register a user
curl -X POST http://localhost/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "test123"
  }'

# 2. Create products
curl -X POST http://localhost/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "price": 99.99,
    "category": "Test",
    "stock": 100
  }'

# 3. Check inventory
curl http://localhost/inventory/stock/1

# 4. Create an order
curl -X POST http://localhost/orders \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "items": [{"product_id": 1, "quantity": 2}],
    "total_amount": 199.98
  }'

# 5. Process payment
curl -X POST http://localhost/payments/process \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 1,
    "amount": 199.98,
    "payment_method": "credit_card"
  }'

# 6. Verify order status
curl http://localhost/orders/1

# 7. Check updated inventory
curl http://localhost/inventory/stock/1
```

### **Load Testing**
```bash
# Install k6 (load testing tool)
sudo apt install k6 -y

# Create load test script
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

export default function() {
  let res = http.get('http://localhost/products');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
EOF

# Run load test
k6 run load-test.js

# Watch metrics in Grafana during load test
open http://localhost:30300
```

### **Kubernetes Health Checks**
```bash
# Check all pods
kubectl get pods --all-namespaces

# Check pod logs
kubectl logs -f deployment/product-service -n ecommerce

# Check events
kubectl get events -n ecommerce --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods -n ecommerce

# Check service endpoints
kubectl get endpoints -n ecommerce

# Describe pod (detailed info)
kubectl describe pod <pod-name> -n ecommerce
```

---

## 🔍 Troubleshooting

### **Common Issues**

#### **1. Pods Not Starting**
```bash
# Check pod status
kubectl get pods -n ecommerce

# Check pod logs
kubectl logs <pod-name> -n ecommerce

# Describe pod for events
kubectl describe pod <pod-name> -n ecommerce

# Common fixes:
# - Image pull errors: Check Docker Hub credentials
# - CrashLoopBackOff: Check application logs
# - Pending: Check resource availability (kubectl describe node)
```

#### **2. Services Not Accessible**
```bash
# Check service exists
kubectl get svc -n ecommerce

# Check endpoints
kubectl get endpoints -n ecommerce

# Check ingress
kubectl get ingress -n ecommerce
kubectl describe ingress ecommerce-ingress -n ecommerce

# Test service internally
kubectl run test-pod --rm -it --image=curlimages/curl -- sh
# Inside pod:
curl http://product-service.ecommerce.svc.cluster.local:8001/health
```

#### **3. Database Connection Issues**
```bash
# Check PostgreSQL pod
kubectl get pods -l app=postgres -n ecommerce

# Check PostgreSQL logs
kubectl logs postgres-0 -n ecommerce

# Test database connection
kubectl exec -it postgres-0 -n ecommerce -- psql -U postgres -d ecommerce

# Inside PostgreSQL:
\l              # List databases
\c ecommerce    # Connect to database
\dt             # List tables
SELECT * FROM products;  # Query data
```

#### **4. Jenkins Pipeline Failures**
```bash
# Check Jenkins pod
kubectl get pods -n jenkins

# Check Jenkins logs
kubectl logs -f deployment/jenkins -n jenkins

# Access Jenkins
open http://localhost:30000

# Common fixes:
# - Docker credentials: Re-add in Jenkins credentials
# - Kubernetes connection: Check kubeconfig in Jenkins
# - Git authentication: Add GitHub credentials
```

#### **5. Monitoring Not Working**
```bash
# Check Prometheus
kubectl get pods -n monitoring
kubectl logs -f deployment/prometheus -n monitoring

# Check Prometheus targets
curl http://localhost:30090/api/v1/targets | jq

# Check service discovery
kubectl get servicemonitors -n monitoring

# Verify metrics endpoints
for service in product user order payment inventory; do
    kubectl port-forward -n ecommerce svc/${service}-service 8080:800$((++i))
    curl http://localhost:8080/metrics
done
```

### **Reset Everything**
```bash
# Delete all namespaces (nuclear option)
kubectl delete namespace ecommerce
kubectl delete namespace jenkins
kubectl delete namespace monitoring

# Recreate and redeploy
kubectl create namespace ecommerce
kubectl create namespace jenkins
kubectl create namespace monitoring

# Redeploy everything (follow Quick Start section)
```

### **Debugging Commands**
```bash
# Get all resources in namespace
kubectl get all -n ecommerce

# Check pod resource usage
kubectl top pods -n ecommerce

# Check node resource usage
kubectl top nodes

# Get pod YAML
kubectl get pod <pod-name> -n ecommerce -o yaml

# Execute command in pod
kubectl exec -it <pod-name> -n ecommerce -- /bin/sh

# Port forward to service
kubectl port-forward -n ecommerce svc/product-service 8001:8001

# Check DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup product-service.ecommerce.svc.cluster.local
```

---



### **Next Steps**
- [ ] Add Helm charts for easier deployment
- [ ] Implement service mesh (Istio/Linkerd)
- [ ] Add distributed tracing (Jaeger/Zipkin)
- [ ] Implement API Gateway (Kong/Ambassador)
- [ ] Add caching layer (Redis)
- [ ] Implement message queue (RabbitMQ/Kafka)
- [ ] Add security scanning (Trivy/Snyk)
- [ ] Implement GitOps with ArgoCD/Flux

---

## 📝 License

This project is open-source and available for educational purposes.

---

## 👤 Author

**Reza Chegini**
- DevOps Engineer
- Location: Burnaby, BC, Canada
- LinkedIn: [Reza Chegini](https://www.linkedin.com/in/mohammadrezachegini/)
- GitHub: [@mohammadrezachegini](https://github.com/mohammadrezachegini)
- Blog: [Newsletter](https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7385555567827804160)

---

## 🙏 Acknowledgments

Special thanks to:
- Brian Hanley (EA Engineer) for gaming industry CI/CD guidance
- Anthropic Claude for DevOps best practices consultation
- The Kubernetes community for excellent documentation

---

**⭐ If this project helped you, please give it a star!**

**🔗 Connect with me on LinkedIn and let's discuss DevOps!**

---

*Last Updated: February 9, 2026*
