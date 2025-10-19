# AWS EKS - Classic Network Load Balancer (Legacy Implementation)

## Overview

This project demonstrates the classic (legacy) Network Load Balancer implementation for Amazon EKS using the Kubernetes in-tree cloud provider. This approach uses a simple annotation-based configuration to provision AWS Network Load Balancers (NLB) for Kubernetes LoadBalancer services.

**Important Note**: This is the legacy approach for creating NLBs. For new deployments, consider using the [AWS Load Balancer Controller](/Users/reza/home-lab/AWS-EKS/ELB-Network-LoadBalancers-with-LBC/) which provides more features, better control, and is actively maintained.

This example showcases a complete microservices application with:
- User Management REST API backend
- AWS RDS MySQL database accessed via ExternalName service
- Network Load Balancer for external access
- Kubernetes Secrets for database credentials
- Health checks (liveness and readiness probes)
- InitContainer for database availability check

## Architecture

### Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│         Network Load Balancer (NLB)                          │
│         (Classic - In-Tree Provider)                         │
│                                                              │
│  Listener: Port 80 → Target Group: Port 30080 (NodePort)    │
│  Health Check: TCP on port 30080                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  EKS Cluster                                 │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Service: nlb-usermgmt-restapp (LoadBalancer)          │ │
│  │  Type: LoadBalancer (with NLB annotation)              │ │
│  │  Port: 80 → NodePort: 30080 → TargetPort: 8095        │ │
│  └──────────────────┬─────────────────────────────────────┘ │
│                     │                                        │
│  ┌──────────────────▼────────────────────────────────────┐  │
│  │  Deployment: usermgmt-microservice                    │  │
│  │  ┌──────────────────────────────────────────────┐     │  │
│  │  │  InitContainer: Wait for MySQL               │     │  │
│  │  │  - Checks MySQL connectivity before starting │     │  │
│  │  └──────────────────────────────────────────────┘     │  │
│  │  ┌──────────────────────────────────────────────┐     │  │
│  │  │  Container: usermgmt-restapp                 │     │  │
│  │  │  - Spring Boot REST API                      │     │  │
│  │  │  - Port: 8095                                │     │  │
│  │  │  - Liveness Probe: TCP check                 │     │  │
│  │  │  - Readiness Probe: HTTP /usermgmt/health   │     │  │
│  │  └──────────────────┬───────────────────────────┘     │  │
│  └─────────────────────┼───────────────────────────────────┘  │
│                        │                                       │
│  ┌─────────────────────▼──────────────────────────────────┐  │
│  │  Service: mysql (ExternalName)                         │  │
│  │  externalName: usermgmtdb.xxx.rds.amazonaws.com        │  │
│  └─────────────────────┬──────────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────────┘
                         │
┌────────────────────────▼──────────────────────────────────────┐
│                  AWS RDS MySQL Database                        │
│  Endpoint: usermgmtdb.cxojydmxwly6.us-east-1.rds.amazonaws.com│
│  Port: 3306                                                   │
│  Database: usermgmt                                           │
└───────────────────────────────────────────────────────────────┘
```

### Traffic Flow

1. **Client Request**: User sends HTTP request to NLB DNS name
2. **NLB**: Receives request on port 80, forwards to NodePort (30080)
3. **NodePort**: Kubernetes routes to any healthy pod on port 8095
4. **Application Pod**: Spring Boot REST API processes request
5. **Database Access**: Pod connects to RDS MySQL via ExternalName service
6. **Response**: Flows back through the same path to client

### Key Components

1. **Network Load Balancer (Classic)**: Layer 4 TCP load balancer created by Kubernetes cloud provider
2. **LoadBalancer Service**: Kubernetes service that triggers NLB creation
3. **User Management Microservice**: Spring Boot REST API for user CRUD operations
4. **ExternalName Service**: DNS-based service pointing to RDS endpoint
5. **RDS MySQL**: Managed MySQL database for data persistence
6. **Kubernetes Secrets**: Secure storage for database password
7. **InitContainer**: Ensures database is available before starting application
8. **Health Probes**: Liveness and readiness checks for pod health

## Prerequisites

### Required Components

1. **Amazon EKS Cluster** (v1.19+)
   ```bash
   eksctl create cluster --name=eksdemo1 \
     --region=us-east-1 \
     --zones=us-east-1a,us-east-1b \
     --without-nodegroup
   ```

2. **EC2 Node Group** (Classic NLB requires EC2 nodes)
   ```bash
   eksctl create nodegroup --cluster=eksdemo1 \
     --region=us-east-1 \
     --name=eksdemo1-ng-public \
     --node-type=t3.medium \
     --nodes=2 \
     --nodes-min=2 \
     --nodes-max=4 \
     --node-volume-size=20 \
     --managed \
     --asg-access \
     --external-dns-access \
     --alb-ingress-access
   ```

3. **kubectl** configured
   ```bash
   aws eks update-kubeconfig --name eksdemo1 --region us-east-1
   ```

4. **AWS RDS MySQL Database**
   ```bash
   # Create RDS MySQL instance (or use existing)
   # Security group must allow traffic from EKS worker nodes
   # Note the endpoint URL
   ```

5. **IAM Permissions**
   - Worker nodes need IAM role with permissions to:
     - Create/Delete Network Load Balancers
     - Manage Target Groups
     - Configure Security Groups

### Network Requirements

- VPC with public subnets for NLB
- EKS worker nodes in public or private subnets
- Security groups:
  - NLB → Worker Nodes: Allow NodePort range (30000-32767)
  - Worker Nodes → RDS: Allow MySQL (3306)
  - Internet → NLB: Allow application port (80)

### Database Requirements

- RDS MySQL instance running and accessible
- Database created: `usermgmt`
- Database user: `dbadmin`
- Database password (stored in Kubernetes Secret)

## Project Structure

```
Network-LoadBalancers/
├── README.md
└── kube-manifests/
    ├── 01-MySQL-externalName-Service.yml      # ExternalName service for RDS
    ├── 02-UserManagementMicroservice-Deployment-Service.yml  # App & NLB service
    ├── 03-Kubernetes-Secrets.yml              # Database password
    └── 04-NetworkLoadBalancer.yml             # Standalone NLB service definition
```

### File Descriptions

1. **01-MySQL-externalName-Service.yml**
   - Creates an ExternalName service pointing to RDS endpoint
   - Allows pods to use `mysql` as hostname instead of full RDS endpoint
   - No selector, no ports (DNS-only service)

2. **02-UserManagementMicroservice-Deployment-Service.yml**
   - Combined deployment and service manifest
   - Includes InitContainer for MySQL availability check
   - Liveness and readiness probes
   - LoadBalancer service with NLB annotation

3. **03-Kubernetes-Secrets.yml**
   - Stores base64-encoded database password
   - Used by deployment for DB_PASSWORD environment variable

4. **04-NetworkLoadBalancer.yml**
   - Standalone NLB service definition
   - Alternative/reference implementation

## Usage

### 1. Configure Database Connection

First, update the RDS endpoint in the ExternalName service:

```bash
# Edit 01-MySQL-externalName-Service.yml
# Replace with your RDS endpoint
vim kube-manifests/01-MySQL-externalName-Service.yml
```

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql
spec:
  type: ExternalName
  externalName: your-rds-endpoint.region.rds.amazonaws.com  # Update this
```

### 2. Create Database Password Secret

Update the database password in the secret:

```bash
# Create base64-encoded password
echo -n "YourPassword" | base64
# Output: WW91clBhc3N3b3Jk

# Edit 03-Kubernetes-Secrets.yml
vim kube-manifests/03-Kubernetes-Secrets.yml
```

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysql-db-password
type: Opaque
data:
  db-password: WW91clBhc3N3b3Jk  # Your base64-encoded password
```

### 3. Deploy the Application

Deploy all components:

```bash
# Apply all manifests
kubectl apply -f kube-manifests/

# Or apply individually in order
kubectl apply -f kube-manifests/01-MySQL-externalName-Service.yml
kubectl apply -f kube-manifests/03-Kubernetes-Secrets.yml
kubectl apply -f kube-manifests/02-UserManagementMicroservice-Deployment-Service.yml
```

### 4. Verify Deployment

```bash
# Check all resources
kubectl get all

# Check services
kubectl get svc
# You should see:
# - mysql (ExternalName)
# - nlb-usermgmt-restapp (LoadBalancer with external IP)

# Check deployment
kubectl get deployment usermgmt-microservice

# Check pods
kubectl get pods
# Verify pod is Running (not in Init state)

# Check pod logs
kubectl logs deployment/usermgmt-microservice

# Check InitContainer logs
kubectl logs <pod-name> -c init-db
```

### 5. Get NLB Endpoint

```bash
# Get NLB DNS name
kubectl get svc nlb-usermgmt-restapp

# Or extract just the hostname
NLB_DNS=$(kubectl get svc nlb-usermgmt-restapp -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo $NLB_DNS
```

Wait a few minutes for NLB to provision and become healthy.

### 6. Test the Application

Once the NLB is ready, test the REST API:

```bash
# Health check endpoint
curl http://$NLB_DNS/usermgmt/health-status

# List all users (GET)
curl http://$NLB_DNS/usermgmt/users

# Get specific user (GET)
curl http://$NLB_DNS/usermgmt/users/1

# Create user (POST)
curl -X POST http://$NLB_DNS/usermgmt/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john.doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Update user (PUT)
curl -X PUT http://$NLB_DNS/usermgmt/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john.doe",
    "email": "john.updated@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Delete user (DELETE)
curl -X DELETE http://$NLB_DNS/usermgmt/users/1
```

### 7. Monitor Application Health

```bash
# Watch pod status
kubectl get pods -w

# Check pod events
kubectl describe pod <pod-name>

# View application logs
kubectl logs -f deployment/usermgmt-microservice

# Check liveness probe status
kubectl describe pod <pod-name> | grep -A 5 Liveness

# Check readiness probe status
kubectl describe pod <pod-name> | grep -A 5 Readiness
```

### 8. Verify NLB Configuration

```bash
# Describe service
kubectl describe svc nlb-usermgmt-restapp

# Check NLB in AWS Console
# Or via AWS CLI
NLB_NAME=$(aws elbv2 describe-load-balancers \
  --query 'LoadBalancers[?Type==`network`].LoadBalancerName' \
  --output text)

aws elbv2 describe-load-balancers --names $NLB_NAME

# Check target group
aws elbv2 describe-target-groups --load-balancer-arn <nlb-arn>

# Check target health
aws elbv2 describe-target-health --target-group-arn <tg-arn>
```

### 9. Cleanup

```bash
# Delete all resources
kubectl delete -f kube-manifests/

# Verify NLB is deleted
kubectl get svc
aws elbv2 describe-load-balancers

# Note: ExternalName service and Secrets will also be deleted
```

## Configuration

### Service Configuration (Classic NLB)

The key configuration for creating an NLB with the in-tree cloud provider:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nlb-usermgmt-restapp
  labels:
    app: usermgmt-restapp
  annotations:
    # This single annotation creates an NLB instead of CLB
    service.beta.kubernetes.io/aws-load-balancer-type: nlb
spec:
  type: LoadBalancer  # Required
  selector:
    app: usermgmt-restapp
  ports:
  - port: 80           # External port on NLB
    targetPort: 8095   # Container port
```

**How it works**:
1. `type: LoadBalancer` triggers cloud provider to create a load balancer
2. Without annotation: Creates Classic Load Balancer (CLB)
3. With `nlb` annotation: Creates Network Load Balancer (NLB)
4. Kubernetes automatically allocates a NodePort (e.g., 30080)
5. NLB forwards traffic to NodePort on all worker nodes
6. NodePort routes to pods via kube-proxy

### Deployment Configuration

Complete deployment with all components:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: usermgmt-microservice
  labels:
    app: usermgmt-restapp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: usermgmt-restapp
  template:
    metadata:
      labels:
        app: usermgmt-restapp
    spec:
      # InitContainer: Wait for database
      initContainers:
      - name: init-db
        image: busybox:1.31
        command:
          - 'sh'
          - '-c'
          - 'echo -e "Checking for the availability of MySQL Server deployment";
             while ! nc -z mysql 3306; do sleep 1; printf "-"; done;
             echo -e "  >> MySQL DB Server has started";'

      # Main application container
      containers:
      - name: usermgmt-restapp
        image: stacksimplify/kube-usermanagement-microservice:1.0.0
        ports:
        - containerPort: 8095

        # Environment variables
        env:
        - name: DB_HOSTNAME
          value: "mysql"  # Uses ExternalName service
        - name: DB_PORT
          value: "3306"
        - name: DB_NAME
          value: "usermgmt"
        - name: DB_USERNAME
          value: "dbadmin"
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-db-password
              key: db-password

        # Liveness probe: Is container alive?
        livenessProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - nc -z localhost 8095
          initialDelaySeconds: 60
          periodSeconds: 10

        # Readiness probe: Is container ready to serve traffic?
        readinessProbe:
          httpGet:
            path: /usermgmt/health-status
            port: 8095
          initialDelaySeconds: 60
          periodSeconds: 10
```

### ExternalName Service for RDS

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql
spec:
  type: ExternalName
  externalName: usermgmtdb.cxojydmxwly6.us-east-1.rds.amazonaws.com
```

**How it works**:
- Creates a CNAME DNS record in cluster DNS
- Pods can use `mysql` as hostname
- DNS resolves to RDS endpoint
- No proxying (direct connection from pod to RDS)
- No selectors or ports needed

**Benefits**:
- Decouples application from database endpoint
- Easy to change database endpoint (update service, restart pods)
- Consistent naming across environments
- No need to update application configuration

### Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysql-db-password
type: Opaque
data:
  db-password: ZGJwYXNzd29yZDEx  # base64-encoded
```

**Creating base64-encoded values**:
```bash
# Encode
echo -n "dbpassword11" | base64
# Output: ZGJwYXNzd29yZDEx

# Decode (to verify)
echo "ZGJwYXNzd29yZDEx" | base64 -d
# Output: dbpassword11
```

**Using in pods**:
```yaml
env:
- name: DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: mysql-db-password
      key: db-password
```

## Features

### 1. Network Load Balancer (Classic)

**Characteristics**:
- Layer 4 (TCP) load balancer
- Ultra-low latency
- Static IP per availability zone
- Connection-based routing
- Preserves client IP (with proxy protocol)

**Limitations (vs AWS Load Balancer Controller)**:
- Fewer configuration options
- No IP target type (NodePort only)
- No Elastic IP support
- No advanced health check options
- No TLS termination configuration
- No ExternalDNS integration annotations

### 2. ExternalName Service

**Use Cases**:
- Connect to external databases (RDS, Aurora)
- Connect to external APIs
- Multi-cluster service discovery
- Legacy system integration

**How DNS Resolution Works**:
```
Pod query for "mysql"
  → CoreDNS/kube-dns
  → Returns CNAME: usermgmtdb.xxx.rds.amazonaws.com
  → Pod connects to RDS directly
```

### 3. InitContainers

**Purpose**: Ensure dependencies are ready before starting main container

**In this example**:
- Waits for MySQL to be available on port 3306
- Prevents application errors due to database unavailability
- Uses `nc` (netcat) to check TCP connectivity

**Pattern**:
```yaml
initContainers:
- name: wait-for-dependency
  image: busybox
  command: ['sh', '-c', 'until nc -z service port; do sleep 1; done']
```

### 4. Health Probes

**Liveness Probe**:
- Determines if container is alive
- If fails: Kubernetes restarts container
- Example: TCP check on port 8095

**Readiness Probe**:
- Determines if container is ready for traffic
- If fails: Pod removed from service endpoints
- Example: HTTP GET /usermgmt/health-status

**Benefits**:
- Automatic recovery from failures
- Zero-downtime deployments
- Better reliability

### 5. Environment-Based Configuration

Configuration via environment variables:
```yaml
env:
- name: DB_HOSTNAME
  value: "mysql"
- name: DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: mysql-db-password
      key: db-password
```

**Benefits**:
- 12-factor app compliance
- Easy to change per environment
- Secrets kept secure
- No code changes needed

## Troubleshooting

### NLB Not Created

**Symptoms**: Service stays in pending state

```bash
kubectl get svc nlb-usermgmt-restapp
# STATUS shows <pending>
```

**Check**:
```bash
# Describe service for events
kubectl describe svc nlb-usermgmt-restapp

# Check events
kubectl get events --sort-by='.lastTimestamp'
```

**Common Issues**:

1. **Missing NLB annotation**
   ```yaml
   annotations:
     service.beta.kubernetes.io/aws-load-balancer-type: nlb  # Required
   ```

2. **IAM permissions**
   - Worker node IAM role needs permissions to create NLB
   - Check CloudTrail for denied API calls

3. **Subnet tags missing**
   - Public subnets need tag: `kubernetes.io/role/elb=1`
   ```bash
   aws ec2 create-tags --resources subnet-xxx \
     --tags Key=kubernetes.io/role/elb,Value=1
   ```

### Pod Stuck in Init State

**Symptoms**: Pod shows `Init:0/1` state

```bash
kubectl get pods
# Shows: usermgmt-microservice-xxx  0/1  Init:0/1
```

**Diagnosis**:
```bash
# Check InitContainer logs
kubectl logs <pod-name> -c init-db

# Check if MySQL service exists
kubectl get svc mysql

# Check DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup mysql
```

**Common Issues**:

1. **RDS not accessible**
   - Security group doesn't allow traffic from EKS nodes
   - RDS endpoint incorrect in ExternalName service
   - RDS in different VPC without peering

2. **ExternalName service not created**
   ```bash
   kubectl apply -f 01-MySQL-externalName-Service.yml
   ```

3. **Network connectivity issue**
   ```bash
   # Test from a pod
   kubectl run -it --rm debug --image=busybox --restart=Never -- nc -zv mysql 3306
   ```

**Solution**:
```bash
# Verify RDS security group allows MySQL (3306) from EKS worker nodes
# Get worker node security group
kubectl get nodes -o wide

# Update RDS security group to allow traffic
```

### Health Check Failures

**Symptoms**: Targets showing unhealthy in NLB target group

```bash
# Check target health
aws elbv2 describe-target-health --target-group-arn <arn>
```

**Check Pod Health**:
```bash
# Describe pod
kubectl describe pod <pod-name>

# Check readiness probe
kubectl describe pod <pod-name> | grep -A 10 Readiness

# Check liveness probe
kubectl describe pod <pod-name> | grep -A 10 Liveness

# Test health endpoint manually
kubectl port-forward <pod-name> 8095:8095
curl http://localhost:8095/usermgmt/health-status
```

**Common Issues**:

1. **Application not ready**
   - Check application logs: `kubectl logs <pod-name>`
   - Verify database connection works
   - Increase `initialDelaySeconds` if app starts slowly

2. **Wrong health check path**
   - Verify `/usermgmt/health-status` exists
   - Test endpoint directly

3. **Security group blocking health checks**
   - NLB health checks come from NLB nodes
   - Ensure NodePort range (30000-32767) is open

### Database Connection Issues

**Symptoms**: Application logs show database connection errors

```bash
kubectl logs deployment/usermgmt-microservice
```

**Check**:
```bash
# Verify ExternalName service
kubectl get svc mysql -o yaml

# Test DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup mysql

# Test MySQL connectivity
kubectl run -it --rm mysql-client --image=mysql:8.0 --restart=Never -- \
  mysql -h mysql -u dbadmin -p
```

**Common Issues**:

1. **Wrong RDS endpoint**
   - Verify endpoint in ExternalName service matches actual RDS endpoint
   ```bash
   aws rds describe-db-instances --db-instance-identifier usermgmtdb
   ```

2. **Wrong credentials**
   - Verify secret is correct
   ```bash
   kubectl get secret mysql-db-password -o jsonpath='{.data.db-password}' | base64 -d
   ```

3. **Database doesn't exist**
   - Create `usermgmt` database in RDS
   ```sql
   CREATE DATABASE usermgmt;
   ```

4. **Security group**
   - RDS security group must allow MySQL (3306) from EKS worker nodes

### NLB Connectivity Issues

**Symptoms**: Cannot access application via NLB DNS

```bash
curl http://<nlb-dns>
# Connection timeout or refused
```

**Check**:
```bash
# Verify NLB is active
aws elbv2 describe-load-balancers --names <nlb-name>

# Check target health
aws elbv2 describe-target-health --target-group-arn <arn>

# Verify NodePort is accessible
kubectl get svc nlb-usermgmt-restapp
# Note the NodePort (e.g., 30080)

# SSH to worker node and test
curl http://localhost:30080/usermgmt/health-status
```

**Common Issues**:

1. **Targets unhealthy**
   - See "Health Check Failures" section above

2. **Security group**
   - NLB security group must allow port 80 from internet (0.0.0.0/0)
   - Worker node security group must allow NodePort from NLB

3. **NLB in wrong subnets**
   - Should be in public subnets with internet gateway

## Best Practices

### 1. Use AWS Load Balancer Controller for New Projects

**This classic approach is legacy**. For new deployments:

```bash
# Use AWS Load Balancer Controller instead
# See: /Users/reza/home-lab/AWS-EKS/ELB-Network-LoadBalancers-with-LBC/
```

**Benefits of AWS Load Balancer Controller**:
- IP target type (better performance)
- TLS termination at NLB
- Elastic IP support
- Better health check control
- ExternalDNS integration
- Active development and support

### 2. Use ExternalName for External Services

For RDS, external APIs, or any service outside the cluster:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: external-service
spec:
  type: ExternalName
  externalName: external-api.example.com
```

**Benefits**:
- Decouple applications from external endpoints
- Easy to change endpoints
- Consistent naming
- Works with service mesh

### 3. Always Use InitContainers for Dependencies

```yaml
initContainers:
- name: wait-for-db
  image: busybox
  command: ['sh', '-c', 'until nc -z mysql 3306; do sleep 1; done']
```

**Benefits**:
- Prevents application errors
- Better startup reliability
- Clear dependency management

### 4. Implement Both Liveness and Readiness Probes

```yaml
# Liveness: Is the app alive?
livenessProbe:
  exec:
    command: ['/bin/sh', '-c', 'nc -z localhost 8095']
  initialDelaySeconds: 60
  periodSeconds: 10

# Readiness: Is the app ready for traffic?
readinessProbe:
  httpGet:
    path: /health
    port: 8095
  initialDelaySeconds: 60
  periodSeconds: 10
```

**Benefits**:
- Automatic recovery
- Zero-downtime deployments
- Better reliability

### 5. Use Kubernetes Secrets for Sensitive Data

Never hardcode passwords:

```yaml
# Bad
env:
- name: DB_PASSWORD
  value: "mypassword"  # DON'T DO THIS

# Good
env:
- name: DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: mysql-db-password
      key: db-password
```

**Better Options**:
- AWS Secrets Manager with External Secrets Operator
- HashiCorp Vault
- Sealed Secrets

### 6. Tag Subnets Correctly

For automatic subnet discovery:

```bash
# Public subnets (for internet-facing NLB)
aws ec2 create-tags --resources subnet-xxx \
  --tags Key=kubernetes.io/role/elb,Value=1

# Private subnets (for internal NLB)
aws ec2 create-tags --resources subnet-xxx \
  --tags Key=kubernetes.io/role/internal-elb,Value=1
```

### 7. Configure Appropriate Timeouts

```yaml
# Give application enough time to start
readinessProbe:
  initialDelaySeconds: 60  # Adjust based on your app
  periodSeconds: 10
  failureThreshold: 3
```

**For slow-starting applications**:
- Increase `initialDelaySeconds`
- Increase `failureThreshold`
- Consider using startup probes (K8s 1.18+)

### 8. Use Resource Requests and Limits

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

**Benefits**:
- Better scheduling
- Prevents resource starvation
- Cost optimization

### 9. Implement Graceful Shutdown

```yaml
lifecycle:
  preStop:
    exec:
      command: ["/bin/sh", "-c", "sleep 15"]
```

**Benefits**:
- Complete in-flight requests
- Clean database connection closure
- Better user experience

### 10. Monitor and Log

```bash
# Application logs
kubectl logs -f deployment/usermgmt-microservice

# Events
kubectl get events --sort-by='.lastTimestamp'

# Metrics (if metrics-server installed)
kubectl top pods
```

**Set up**:
- CloudWatch Container Insights
- Prometheus + Grafana
- ELK/EFK stack

### Troubleshooting Tools

```bash
# Check service
kubectl get svc nlb-usermgmt-restapp -o yaml

# Describe service (shows events)
kubectl describe svc nlb-usermgmt-restapp

# Check endpoints
kubectl get endpoints nlb-usermgmt-restapp

# Check pods
kubectl get pods -l app=usermgmt-restapp

# Pod logs
kubectl logs <pod-name>
kubectl logs <pod-name> -c init-db  # InitContainer logs

# Pod shell
kubectl exec -it <pod-name> -- /bin/sh

# DNS check
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup mysql

# Network check
kubectl run -it --rm debug --image=busybox --restart=Never -- nc -zv mysql 3306

# AWS NLB status
aws elbv2 describe-load-balancers
aws elbv2 describe-target-health --target-group-arn <arn>
```


---

## Quick Reference

### Common kubectl Commands

```bash
# Deploy
kubectl apply -f kube-manifests/

# Check services
kubectl get svc

# Get NLB DNS
kubectl get svc nlb-usermgmt-restapp -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Check pods
kubectl get pods

# Pod logs
kubectl logs deployment/usermgmt-microservice

# InitContainer logs
kubectl logs <pod-name> -c init-db

# Describe service
kubectl describe svc nlb-usermgmt-restapp

# Delete
kubectl delete -f kube-manifests/
```
