# Microservices Deployment on EKS

## Overview

This project demonstrates a production-ready microservices architecture deployment on Amazon EKS. It implements a user management system consisting of two microservices: a User Management service and a Notification service, integrated with external dependencies including MySQL (RDS) and AWS SES for email notifications.

The architecture showcases key microservices patterns including service-to-service communication, external service integration, ingress-based routing, SSL/TLS termination, and DNS management. This implementation serves as a foundation for building scalable, cloud-native microservices applications on Kubernetes.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            Internet                                      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ HTTPS (443)
                                 │
                    ┌────────────▼────────────┐
                    │   Route 53 (DNS)        │
                    │  services.rezaops.com   │
                    │  ums.rezaops.com        │
                    └────────────┬────────────┘
                                 │
                                 │
                    ┌────────────▼─────────────┐
                    │ Application Load         │
                    │    Balancer (ALB)        │
                    │  - SSL Termination       │
                    │  - Health Checks         │
                    │  - Path-based Routing    │
                    └────────────┬─────────────┘
                                 │
┌────────────────────────────────┼─────────────────────────────────────────┐
│                         EKS Cluster                                      │
│                                │                                          │
│                    ┌───────────▼──────────┐                              │
│                    │   Ingress Resource   │                              │
│                    │  - SSL Redirect      │                              │
│                    │  - ExternalDNS       │                              │
│                    └───────────┬──────────┘                              │
│                                │                                          │
│                                │                                          │
│         ┌──────────────────────┴──────────────────────┐                 │
│         │                                              │                 │
│  ┌──────▼───────────────┐                  ┌──────────▼──────────┐     │
│  │  User Management     │                  │   Notification      │     │
│  │   Microservice       │                  │   Microservice      │     │
│  │                      │                  │                     │     │
│  │  ┌────────────────┐  │                  │  ┌──────────────┐  │     │
│  │  │  NodePort      │  │                  │  │  ClusterIP   │  │     │
│  │  │  Service       │  │  HTTP (8096)     │  │  Service     │  │     │
│  │  │  Port: 8095    │◄─┼──────────────────┼──┤  Port: 8096  │  │     │
│  │  └────────┬───────┘  │                  │  └──────┬───────┘  │     │
│  │           │          │                  │         │          │     │
│  │  ┌────────▼───────┐  │                  │  ┌──────▼───────┐  │     │
│  │  │  Pods (1+)     │  │                  │  │  Pods (1+)   │  │     │
│  │  │  Port: 8095    │  │                  │  │  Port: 8096  │  │     │
│  │  │  - Health      │  │                  │  │  - Email     │  │     │
│  │  │  - User CRUD   │  │                  │  │    sending   │  │     │
│  │  │  - REST API    │  │                  │  │  - REST API  │  │     │
│  │  └────────┬───────┘  │                  │  └──────┬───────┘  │     │
│  └───────────┼──────────┘                  └─────────┼──────────┘     │
│              │                                        │                 │
│              │                                        │                 │
│       ┌──────▼────────┐                      ┌───────▼────────┐       │
│       │  ExternalName │                      │  ExternalName  │       │
│       │   Service     │                      │   Service      │       │
│       │   mysql       │                      │  smtp-service  │       │
│       └──────┬────────┘                      └───────┬────────┘       │
│              │                                        │                 │
└──────────────┼────────────────────────────────────────┼────────────────┘
               │                                        │
               │                                        │
    ┌──────────▼──────────┐              ┌────────────▼────────────┐
    │    Amazon RDS       │              │      AWS SES            │
    │    (MySQL)          │              │  (Email Service)        │
    │  - Database         │              │  - SMTP Server          │
    │  - User data        │              │  - Email delivery       │
    └─────────────────────┘              └─────────────────────────┘
```

### Key Components

1. **User Management Microservice**: REST API for user CRUD operations
2. **Notification Microservice**: Email notification service using AWS SES
3. **ExternalName Services**: Bridge to external dependencies (RDS, SES)
4. **Application Load Balancer**: Ingress traffic management with SSL
5. **ExternalDNS**: Automatic Route53 DNS record management
6. **Amazon RDS**: Managed MySQL database
7. **AWS SES**: Managed email service

### Communication Flow

1. Client makes HTTPS request to `ums.rezaops.com`
2. Route53 resolves to ALB endpoint
3. ALB terminates SSL and routes to Ingress
4. Ingress forwards to User Management Service (NodePort)
5. User Management Service processes request
6. For notifications, calls Notification Service (ClusterIP)
7. Notification Service sends email via AWS SES
8. User data persisted to RDS MySQL

## Prerequisites

### AWS Resources
- **EKS Cluster** running (version 1.21 or later)
- **Amazon RDS MySQL** instance configured and accessible
- **AWS SES** configured with verified email addresses
- **ACM Certificate** for SSL/TLS
- **Route53 Hosted Zone** for domain management
- **VPC** with proper subnet configuration

### AWS Services Setup

#### 1. Amazon RDS MySQL Setup
```bash
# Create RDS MySQL instance
aws rds create-db-instance \
  --db-instance-identifier eks-mysql-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --engine-version 8.0.35 \
  --master-username dbadmin \
  --master-user-password <password> \
  --allocated-storage 20 \
  --vpc-security-group-ids <sg-id> \
  --db-subnet-group-name <subnet-group> \
  --publicly-accessible \
  --backup-retention-period 7

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier eks-mysql-db \
  --query 'DBInstances[0].Endpoint.Address'
```

#### 2. AWS SES Setup
```bash
# Verify email address
aws ses verify-email-identity --email-address your-email@example.com

# Generate SMTP credentials (in SES Console)
# Navigate to: SES → SMTP Settings → Create SMTP Credentials

# Move out of SES sandbox (for production)
# Request production access in SES Console
```

#### 3. ACM Certificate
```bash
# Request certificate
aws acm request-certificate \
  --domain-name "*.rezaops.com" \
  --validation-method DNS \
  --region us-east-1

# Validate using DNS records in Route53
```

### Kubernetes Prerequisites
- **AWS Load Balancer Controller** installed
- **ExternalDNS** configured
- **kubectl** configured with cluster access

### Tools
```bash
# AWS CLI
aws --version

# kubectl
kubectl version --client

# eksctl (optional)
eksctl version

# curl (for testing)
curl --version
```

## Project Structure

```
Microservices-Deployment-on-EKS/
├── README.md
├── kube-manifests/
│   ├── 01-MySQL-externalName-Service.yml
│   ├── 02-UserManagementMicroservice-Deployment.yml
│   ├── 03-UserManagement-NodePort-Service.yml
│   ├── 04-NotificationMicroservice-Deployment.yml
│   ├── 05-NotificationMicroservice-SMTP-externalName-Service.yml
│   ├── 06-NotificationMicroservice-ClusterIP-Service.yml
│   └── 07-ALB-Ingress-SSL-Redirect-ExternalDNS.yml
└── AWS-EKS-Masterclass-Microservices.postman_collection.json
```

### File Descriptions

| File | Description |
|------|-------------|
| `01-MySQL-externalName-Service.yml` | ExternalName service mapping to RDS endpoint |
| `02-UserManagementMicroservice-Deployment.yml` | User Management service deployment with secrets |
| `03-UserManagement-NodePort-Service.yml` | NodePort service for external access |
| `04-NotificationMicroservice-Deployment.yml` | Notification service deployment |
| `05-NotificationMicroservice-SMTP-externalName-Service.yml` | ExternalName service for AWS SES SMTP |
| `06-NotificationMicroservice-ClusterIP-Service.yml` | Internal ClusterIP service |
| `07-ALB-Ingress-SSL-Redirect-ExternalDNS.yml` | Ingress with ALB, SSL, and DNS configuration |
| `AWS-EKS-Masterclass-Microservices.postman_collection.json` | Postman collection for API testing |

## Usage

### Step 1: Create Kubernetes Secret for Database

```bash
# Create secret for MySQL password
kubectl create secret generic mysql-db-password \
  --from-literal=db-password=your-db-password

# Verify secret
kubectl get secrets
kubectl describe secret mysql-db-password
```

### Step 2: Deploy MySQL ExternalName Service

```bash
# Navigate to project directory
cd /Users/reza/home-lab/AWS-EKS/Microservices-Deployment-on-EKS/kube-manifests

# Update MySQL endpoint in 01-MySQL-externalName-Service.yml
# Replace with your RDS endpoint

# Deploy ExternalName service
kubectl apply -f 01-MySQL-externalName-Service.yml

# Verify service
kubectl get svc mysql
kubectl describe svc mysql
```

**Configuration Example:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql
spec:
  type: ExternalName
  externalName: eks-mysql-db.c123456.us-east-1.rds.amazonaws.com
```

### Step 3: Deploy User Management Microservice

```bash
# Deploy User Management service
kubectl apply -f 02-UserManagementMicroservice-Deployment.yml

# Create NodePort service
kubectl apply -f 03-UserManagement-NodePort-Service.yml

# Verify deployment
kubectl get deployments
kubectl get pods
kubectl logs <usermgmt-pod-name>

# Check service
kubectl get svc usermgmt-restapp-nodeport-service
```

**Key Configuration:**
```yaml
env:
- name: DB_HOSTNAME
  value: "mysql"
- name: DB_PORT
  value: "3306"
- name: DB_NAME
  value: "umgmt"
- name: DB_USERNAME
  value: "dbadmin"
- name: DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: mysql-db-password
      key: db-password
- name: NOTIFICATION_SERVICE_HOST
  value: "notification-clusterip-service"
- name: NOTIFICATION_SERVICE_PORT
  value: "8096"
```

### Step 4: Deploy Notification Microservice

```bash
# Update SMTP credentials in 04-NotificationMicroservice-Deployment.yml
# Add your AWS SES SMTP username, password, and verified email

# Deploy SMTP ExternalName service
kubectl apply -f 05-NotificationMicroservice-SMTP-externalName-Service.yml

# Deploy Notification microservice
kubectl apply -f 04-NotificationMicroservice-Deployment.yml

# Create ClusterIP service
kubectl apply -f 06-NotificationMicroservice-ClusterIP-Service.yml

# Verify deployment
kubectl get deployments notification-microservice
kubectl get pods -l app=notification-restapp
kubectl logs <notification-pod-name>
```

**SMTP Configuration:**
```yaml
env:
- name: AWS_MAIL_SERVER_HOST
  value: "smtp-service"
- name: AWS_MAIL_SERVER_USERNAME
  value: "YOUR_SMTP_USERNAME"
- name: AWS_MAIL_SERVER_PASSWORD
  value: "YOUR_SMTP_PASSWORD"
- name: AWS_MAIL_SERVER_FROM_ADDRESS
  value: "your-verified-email@example.com"
```

**Note**: For production, use Kubernetes Secrets for SMTP credentials instead of environment variables.

### Step 5: Configure and Deploy Ingress

```bash
# Update 07-ALB-Ingress-SSL-Redirect-ExternalDNS.yml with:
# - Your ACM certificate ARN
# - Your domain name
# - Load balancer name

# Deploy ingress
kubectl apply -f 07-ALB-Ingress-SSL-Redirect-ExternalDNS.yml

# Wait for ALB provisioning (2-3 minutes)
kubectl get ingress -w

# Get ALB DNS name
kubectl get ingress eks-microservices-demo -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Verify Route53 record created
aws route53 list-resource-record-sets \
  --hosted-zone-id <YOUR_ZONE_ID> \
  --query "ResourceRecordSets[?Name=='ums.rezaops.com.']"
```

**Ingress Configuration:**
```yaml
annotations:
  alb.ingress.kubernetes.io/load-balancer-name: eks-microservices-demo
  alb.ingress.kubernetes.io/scheme: internet-facing
  alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}, {"HTTP":80}]'
  alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:region:account:certificate/xxx
  alb.ingress.kubernetes.io/ssl-redirect: '443'
  external-dns.alpha.kubernetes.io/hostname: services.rezaops.com, ums.rezaops.com
```

### Step 6: Test the Microservices

#### Test Using curl

```bash
# Health check
curl https://ums.rezaops.com/usermgmt/health-status

# Create user
curl -X POST https://ums.rezaops.com/usermgmt/user \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "firstname": "John",
    "lastname": "Doe"
  }'

# Get all users
curl https://ums.rezaops.com/usermgmt/users

# Get specific user
curl https://ums.rezaops.com/usermgmt/user/{userId}

# Update user
curl -X PUT https://ums.rezaops.com/usermgmt/user \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "username": "john_doe_updated",
    "email": "john.updated@example.com"
  }'

# Delete user
curl -X DELETE https://ums.rezaops.com/usermgmt/user/{userId}

# Test notification (sends email)
curl -X POST https://ums.rezaops.com/usermgmt/notification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "recipient@example.com",
    "subject": "Test Notification",
    "body": "This is a test message"
  }'
```

#### Test Using Postman

```bash
# Import Postman collection
# File: AWS-EKS-Masterclass-Microservices.postman_collection.json

# Update environment variables:
# - base_url: https://ums.rezaops.com
# - Execute requests in order
```

### Step 7: Monitor and Debug

```bash
# Check all resources
kubectl get all

# View logs
kubectl logs -f deployment/usermgmt-microservice
kubectl logs -f deployment/notification-microservice

# Check ingress details
kubectl describe ingress eks-microservices-demo

# Verify ALB targets
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>

# Check pod health
kubectl get pods
kubectl describe pod <pod-name>

# Test internal service communication
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://notification-clusterip-service:8096/notification/health
```

## Configuration

### ExternalName Service Pattern

ExternalName services provide DNS aliasing for external services:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql
spec:
  type: ExternalName
  externalName: your-rds-endpoint.rds.amazonaws.com
```

**Benefits:**
- Abstract external endpoint details
- Easy to update endpoints without changing deployments
- Works with internal Kubernetes DNS
- No iptables rules or kube-proxy involvement

### Service Types Comparison

| Service Type | Use Case | Access Level |
|--------------|----------|--------------|
| **ClusterIP** | Internal microservice communication | Cluster-internal only |
| **NodePort** | External access via node IP:port | Cluster-external via nodes |
| **LoadBalancer** | Production external access | Provisioned cloud LB |
| **ExternalName** | Alias to external DNS name | DNS CNAME |

### Microservice Communication

**Internal (ClusterIP):**
```yaml
# Notification service - internal only
apiVersion: v1
kind: Service
metadata:
  name: notification-clusterip-service
spec:
  type: ClusterIP
  selector:
    app: notification-restapp
  ports:
  - port: 8096
    targetPort: 8096
```

**External (NodePort):**
```yaml
# User Management - exposed via Ingress
apiVersion: v1
kind: Service
metadata:
  name: usermgmt-restapp-nodeport-service
  annotations:
    alb.ingress.kubernetes.io/healthcheck-path: /usermgmt/health-status
spec:
  type: NodePort
  selector:
    app: usermgmt-restapp
  ports:
  - port: 8095
    targetPort: 8095
```

### Health Checks Configuration

```yaml
livenessProbe:
  exec:
    command:
    - /bin/sh
    - -c
    - nc -z localhost 8095
  initialDelaySeconds: 60
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /usermgmt/health-status
    port: 8095
  initialDelaySeconds: 60
  periodSeconds: 10
```

### Environment-Based Configuration

```yaml
# Development
env:
- name: SPRING_PROFILES_ACTIVE
  value: "dev"
- name: LOG_LEVEL
  value: "DEBUG"

# Production
env:
- name: SPRING_PROFILES_ACTIVE
  value: "prod"
- name: LOG_LEVEL
  value: "INFO"
```

## Features

### 1. Microservices Architecture

**Service Independence:**
- Each microservice is independently deployable
- Separate scaling policies
- Independent release cycles
- Technology diversity support

**Service Discovery:**
- Kubernetes DNS for service discovery
- Internal service-to-service communication via ClusterIP
- ExternalName for external dependencies

### 2. API Gateway Pattern (via Ingress)

```yaml
# Path-based routing
spec:
  rules:
  - http:
      paths:
      - path: /usermgmt
        pathType: Prefix
        backend:
          service:
            name: usermgmt-restapp-nodeport-service
            port:
              number: 8095
      - path: /notification
        pathType: Prefix
        backend:
          service:
            name: notification-nodeport-service
            port:
              number: 8096
```

### 3. External Service Integration

**RDS Integration:**
- ExternalName service for database
- Connection pooling
- Credential management via Secrets

**SES Integration:**
- SMTP configuration
- Email template support
- Retry mechanisms

### 4. Security Features

**SSL/TLS:**
- Certificate management via ACM
- Automatic HTTP to HTTPS redirect
- TLS 1.2+ enforcement

**Secrets Management:**
```bash
# Best practice: Use AWS Secrets Manager
kubectl create secret generic db-credentials \
  --from-literal=username=dbadmin \
  --from-literal=password=SecurePassword123
```

**Network Security:**
- Security groups for RDS access
- VPC network isolation
- Pod-to-pod communication policies

### 5. Observability

**Logging:**
```yaml
# Structured logging configuration
env:
- name: LOGGING_PATTERN_CONSOLE
  value: "%d{yyyy-MM-dd HH:mm:ss} - %logger{36} - %msg%n"
```

**Metrics:**
- Application-level metrics
- JVM metrics (for Java apps)
- Custom business metrics

**Health Endpoints:**
- `/health` - Application health
- `/metrics` - Prometheus-compatible metrics
- `/info` - Application information

### 6. Scalability

**Horizontal Pod Autoscaling:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: usermgmt-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: usermgmt-microservice
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Troubleshooting

### Service Communication Issues

```bash
# Test DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  nslookup notification-clusterip-service

# Test service connectivity
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://notification-clusterip-service:8096/health

# Check endpoints
kubectl get endpoints notification-clusterip-service

# Verify service selector matches pod labels
kubectl get pods --show-labels
kubectl describe svc notification-clusterip-service
```

### Database Connection Errors

```bash
# Test RDS connectivity from pod
kubectl exec -it <usermgmt-pod> -- nc -zv mysql 3306

# Check ExternalName resolution
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  nslookup mysql

# Verify security group rules
aws ec2 describe-security-groups --group-ids <rds-sg-id>

# Check database credentials
kubectl get secret mysql-db-password -o jsonpath='{.data.db-password}' | base64 --decode

# View database logs
kubectl logs <usermgmt-pod> | grep -i "database\|mysql"
```

### Email Not Sending (SES Issues)

```bash
# Check notification service logs
kubectl logs -f deployment/notification-microservice

# Verify SES sending limits
aws ses get-send-quota

# Check email verification status
aws ses list-verified-email-addresses

# Test SMTP connectivity
kubectl exec -it <notification-pod> -- \
  nc -zv email-smtp.us-east-1.amazonaws.com 587

# Common issues:
# 1. Email not verified in SES
# 2. Account in SES sandbox (verify recipient emails)
# 3. Incorrect SMTP credentials
# 4. Security group blocking port 587
```

### Ingress/ALB Not Working

```bash
# Check ingress status
kubectl describe ingress eks-microservices-demo

# View ALB controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Verify target group health
aws elbv2 describe-target-health \
  --target-group-arn $(kubectl get ingress eks-microservices-demo \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' | \
  xargs aws elbv2 describe-load-balancers --names --query \
  'LoadBalancers[0].LoadBalancerArn')

# Check security group rules
kubectl get ingress eks-microservices-demo -o yaml | grep security-groups

# Verify certificate
aws acm describe-certificate --certificate-arn <cert-arn>
```

### DNS Records Not Created

```bash
# Check ExternalDNS logs
kubectl logs -n default deployment/external-dns

# Verify Route53 permissions
aws sts get-caller-identity
aws route53 list-hosted-zones

# Check ingress annotations
kubectl get ingress eks-microservices-demo -o yaml | grep external-dns

# Manually verify DNS propagation
nslookup ums.rezaops.com
dig ums.rezaops.com
```

### Pod Crashes or Restarts

```bash
# Check pod status
kubectl get pods
kubectl describe pod <pod-name>

# View logs
kubectl logs <pod-name>
kubectl logs <pod-name> --previous

# Check events
kubectl get events --sort-by='.lastTimestamp'

# Verify resource limits
kubectl top pods
kubectl describe pod <pod-name> | grep -A 5 "Limits\|Requests"

# Check health probe failures
kubectl describe pod <pod-name> | grep -A 10 "Liveness\|Readiness"
```

## Best Practices

### 1. Microservice Design Principles

**Single Responsibility:**
- Each service owns a specific business capability
- Clear service boundaries
- Minimal dependencies

**API Design:**
```yaml
# RESTful endpoints
GET    /usermgmt/users          # List users
POST   /usermgmt/user           # Create user
GET    /usermgmt/user/{id}      # Get user
PUT    /usermgmt/user           # Update user
DELETE /usermgmt/user/{id}      # Delete user
```

**Versioning:**
```yaml
# API versioning
GET /api/v1/users
GET /api/v2/users
```

### 2. Service Communication

**Synchronous (HTTP/REST):**
```yaml
# Use for:
# - Request-response patterns
# - Real-time operations
# - Simple queries
```

**Asynchronous (Message Queue):**
```yaml
# Use for:
# - Event-driven architecture
# - Long-running operations
# - Decoupling services
# Example: SQS, SNS, EventBridge
```

### 3. Configuration Management

**Externalize Configuration:**
```yaml
# Use ConfigMaps for non-sensitive data
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  database.url: "mysql:3306"
  feature.flags: "feature1=true,feature2=false"
```

**Environment-Specific:**
```yaml
# Development
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: development
data:
  log.level: "DEBUG"

# Production
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
data:
  log.level: "INFO"
```

### 4. Security Best Practices

**Secrets Management:**
```bash
# Use AWS Secrets Manager instead of Kubernetes Secrets
# Install External Secrets Operator
helm install external-secrets \
  external-secrets/external-secrets \
  -n external-secrets-system \
  --create-namespace

# Create ExternalSecret
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
spec:
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: mysql-db-password
  data:
  - secretKey: db-password
    remoteRef:
      key: prod/mysql/password
```

**Network Policies:**
```yaml
# Restrict traffic between services
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: notification-policy
spec:
  podSelector:
    matchLabels:
      app: notification-restapp
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: usermgmt-restapp
    ports:
    - protocol: TCP
      port: 8096
```

### 5. Resilience Patterns

**Circuit Breaker:**
```java
// Using Resilience4j
@CircuitBreaker(name = "notificationService", fallbackMethod = "fallbackNotification")
public void sendNotification(NotificationRequest request) {
    // Call notification service
}

public void fallbackNotification(NotificationRequest request, Exception e) {
    // Fallback logic
    log.error("Notification service unavailable, queuing for retry");
}
```

**Retry Logic:**
```yaml
# Configure retry in Spring Boot
spring:
  cloud:
    circuitbreaker:
      resilience4j:
        enabled: true
    retry:
      instances:
        notificationService:
          maxAttempts: 3
          waitDuration: 1000
```

**Timeout Configuration:**
```yaml
# Set appropriate timeouts
env:
- name: HTTP_CLIENT_TIMEOUT
  value: "5000"
- name: DATABASE_TIMEOUT
  value: "30000"
```

### 6. Observability Strategy

**Distributed Tracing:**
- Implement correlation IDs
- Use AWS X-Ray or Jaeger
- Trace requests across services

**Centralized Logging:**
```yaml
# Use structured logging
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "service": "user-management",
  "trace_id": "abc123",
  "message": "User created successfully",
  "user_id": "12345"
}
```

**Metrics Collection:**
```yaml
# Expose Prometheus metrics
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  metrics:
    export:
      prometheus:
        enabled: true
```

### 7. Deployment Strategies

**Rolling Update:**
```yaml
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

**Blue-Green Deployment:**
```bash
# Deploy new version with different label
kubectl apply -f deployment-v2.yml

# Test new version
# Switch service to new version
kubectl patch service usermgmt-service -p '{"spec":{"selector":{"version":"v2"}}}'
```

### 8. Cost Optimization

**Right-Size Resources:**
```yaml
resources:
  requests:
    cpu: "250m"
    memory: "512Mi"
  limits:
    cpu: "500m"
    memory: "1Gi"
```

**Use HPA:**
```yaml
# Scale based on demand
minReplicas: 2
maxReplicas: 10
targetCPUUtilizationPercentage: 70
```

**Implement PodDisruptionBudget:**
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: usermgmt-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: usermgmt-restapp
```
