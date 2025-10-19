# EKS Integration with Amazon RDS Database

## Overview

This project demonstrates how to connect applications running in Amazon Elastic Kubernetes Service (EKS) to Amazon Relational Database Service (RDS) for managed database services. It showcases the integration pattern using Kubernetes ExternalName services to provide a stable internal DNS name for external RDS endpoints, along with proper secret management, health checks, and database connectivity patterns.

The implementation features a Spring Boot user management microservice that connects to a MySQL RDS instance, demonstrating production-ready patterns including init containers for dependency checking, liveness and readiness probes, and secure credential management using Kubernetes Secrets.

## Architecture

The solution consists of the following components:

- **Amazon RDS MySQL**: Managed database service running outside the EKS cluster
- **Kubernetes ExternalName Service**: Maps internal service name to external RDS endpoint
- **Kubernetes Secrets**: Securely stores database credentials
- **User Management Microservice**: Spring Boot REST API connecting to RDS
- **Init Container**: Validates database connectivity before application starts
- **NodePort Service**: Exposes the application externally for testing

```
┌───────────────────────────────────────┐
│         EKS Cluster                   │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │  User Management Service        │ │
│  │  (Spring Boot App)              │ │
│  │  - NodePort: 31231              │ │
│  │  - Readiness Probe              │ │
│  │  - Liveness Probe               │ │
│  └──────────┬──────────────────────┘ │
│             │                         │
│             │ DB Connection           │
│             ▼                         │
│  ┌─────────────────────────────────┐ │
│  │  MySQL ExternalName Service     │ │
│  │  Name: mysql                    │ │
│  │  ┌───────────────────────────┐  │ │
│  │  │ externalName: RDS endpoint│  │ │
│  │  └───────────────────────────┘  │ │
│  └──────────┬──────────────────────┘ │
│             │                         │
│  ┌──────────▼──────────────────────┐ │
│  │  Kubernetes Secret              │ │
│  │  mysql-db-password              │ │
│  └─────────────────────────────────┘ │
│                                       │
└───────────────┼───────────────────────┘
                │
                │ Port 3306
                ▼
   ┌────────────────────────────┐
   │  Amazon RDS MySQL          │
   │  - Multi-AZ (optional)     │
   │  - Automated Backups       │
   │  - Encryption at Rest      │
   │  - VPC Security Groups     │
   └────────────────────────────┘
```

## Prerequisites

### Required Tools
- AWS CLI (v2.x or higher) configured with appropriate credentials
- kubectl (v1.21 or higher)
- eksctl (v0.100.0 or higher)
- MySQL client (for testing)
- Base64 utility (for encoding secrets)

### AWS Resources
- An existing EKS cluster
- An Amazon RDS MySQL instance
- VPC Security Groups configured to allow traffic from EKS to RDS
- Proper network connectivity between EKS and RDS (same VPC or VPC peering)

### Network Prerequisites
- EKS cluster and RDS instance should be in the same VPC, or VPCs should be peered
- RDS security group must allow inbound traffic on port 3306 from EKS node security group
- RDS instance must be accessible from EKS nodes (not public unless specifically required)

### Required AWS Permissions
- Create and manage RDS instances
- Modify security groups
- Create and manage secrets (if using AWS Secrets Manager)

## Project Structure

```
EKS-Storage-with-RDS-Database/
├── README.md
└── kube-manifests/
    ├── 01-MySQL-externalName-Service.yml                # ExternalName service mapping
    ├── 02-UserManagementMicroservice-Deployment-Service.yml  # Application deployment
    ├── 03-UserManagement-Service.yml                    # NodePort service
    └── 04-Kubernetes-Secrets.yml                        # Database credentials
```

## Usage

### Step 1: Create RDS MySQL Instance

```bash
# Set environment variables
export AWS_REGION=us-east-1
export DB_INSTANCE_ID=usermgmtdb
export DB_NAME=usermgmt
export DB_USERNAME=dbadmin
export DB_PASSWORD=your-secure-password
export VPC_SECURITY_GROUP_ID=sg-xxxxxxxxx  # Your EKS node security group

# Create DB subnet group (if not exists)
aws rds create-db-subnet-group \
    --db-subnet-group-name eks-db-subnet-group \
    --db-subnet-group-description "Subnet group for EKS RDS" \
    --subnet-ids subnet-xxxxx subnet-yyyyy subnet-zzzzz \
    --region $AWS_REGION

# Create RDS MySQL instance
aws rds create-db-instance \
    --db-instance-identifier $DB_INSTANCE_ID \
    --db-instance-class db.t3.micro \
    --engine mysql \
    --engine-version 5.7.44 \
    --master-username $DB_USERNAME \
    --master-user-password $DB_PASSWORD \
    --allocated-storage 20 \
    --storage-type gp2 \
    --db-name $DB_NAME \
    --vpc-security-group-ids $VPC_SECURITY_GROUP_ID \
    --db-subnet-group-name eks-db-subnet-group \
    --backup-retention-period 7 \
    --preferred-backup-window "03:00-04:00" \
    --preferred-maintenance-window "mon:04:00-mon:05:00" \
    --no-publicly-accessible \
    --region $AWS_REGION

# Wait for RDS instance to be available (takes 5-10 minutes)
aws rds wait db-instance-available \
    --db-instance-identifier $DB_INSTANCE_ID \
    --region $AWS_REGION

# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_ID \
    --region $AWS_REGION \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

echo "RDS Endpoint: $RDS_ENDPOINT"
```

### Step 2: Configure Security Groups

```bash
# Get EKS node security group ID
NODE_SG=$(aws eks describe-cluster \
    --name your-cluster-name \
    --region $AWS_REGION \
    --query 'cluster.resourcesVpcConfig.clusterSecurityGroupId' \
    --output text)

# Get RDS security group ID
RDS_SG=$(aws rds describe-db-instances \
    --db-instance-identifier $DB_INSTANCE_ID \
    --region $AWS_REGION \
    --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' \
    --output text)

# Add inbound rule to RDS security group to allow traffic from EKS nodes
aws ec2 authorize-security-group-ingress \
    --group-id $RDS_SG \
    --protocol tcp \
    --port 3306 \
    --source-group $NODE_SG \
    --region $AWS_REGION

# Verify security group rule
aws ec2 describe-security-groups \
    --group-ids $RDS_SG \
    --region $AWS_REGION \
    --query 'SecurityGroups[0].IpPermissions'
```

### Step 3: Test RDS Connectivity from EKS

```bash
# Deploy a test pod
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never -- /bin/bash

# Inside the pod, test connectivity
mysql -h $RDS_ENDPOINT -u $DB_USERNAME -p$DB_PASSWORD -e "SHOW DATABASES;"

# Exit the pod
exit
```

### Step 4: Create Kubernetes Secret

```bash
# Encode the database password in base64
DB_PASSWORD_BASE64=$(echo -n "your-secure-password" | base64)
echo $DB_PASSWORD_BASE64

# Update the secret manifest (04-Kubernetes-Secrets.yml) with the base64 encoded password
# Or create the secret directly using kubectl
kubectl create secret generic mysql-db-password \
    --from-literal=db-password=your-secure-password

# Verify secret creation
kubectl get secret mysql-db-password
kubectl describe secret mysql-db-password
```

### Step 5: Deploy ExternalName Service

Update `01-MySQL-externalName-Service.yml` with your RDS endpoint:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql
spec:
  type: ExternalName
  externalName: usermgmtdb.czasg4cict9w.us-east-1.rds.amazonaws.com  # Replace with your RDS endpoint
```

Apply the service:

```bash
# Navigate to manifests directory
cd kube-manifests/

# Apply ExternalName service
kubectl apply -f 01-MySQL-externalName-Service.yml

# Verify service creation
kubectl get svc mysql
kubectl describe svc mysql
```

### Step 6: Deploy User Management Application

```bash
# Apply the application deployment
kubectl apply -f 02-UserManagementMicroservice-Deployment-Service.yml

# Apply the NodePort service
kubectl apply -f 03-UserManagement-Service.yml

# Verify deployment
kubectl get deployment usermgmt-microservice
kubectl get pods -l app=usermgmt-restapp

# Check init container logs (should show MySQL connection check)
kubectl logs <pod-name> -c init-db

# Check application logs
kubectl logs <pod-name> -c usermgmt-restapp

# Verify services
kubectl get svc usermgmt-restapp-service
```

### Step 7: Test the Application

```bash
# Get a worker node's external IP
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}')

# If nodes don't have external IPs, get internal IP and use port forwarding instead
kubectl port-forward svc/usermgmt-restapp-service 8095:8095

# Test health endpoint
curl http://localhost:8095/usermgmt/health-status
# Or with node IP:
curl http://$NODE_IP:31231/usermgmt/health-status

# Create a test user
curl -X POST http://localhost:8095/usermgmt/api/users \
    -H "Content-Type: application/json" \
    -d '{
        "username": "johndoe",
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "admin",
        "enabled": true
    }'

# List all users
curl http://localhost:8095/usermgmt/api/users | jq .

# Get specific user
curl http://localhost:8095/usermgmt/api/users/johndoe | jq .

# Update user
curl -X PUT http://localhost:8095/usermgmt/api/users/johndoe \
    -H "Content-Type: application/json" \
    -d '{
        "username": "johndoe",
        "email": "john.doe@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "user",
        "enabled": true
    }'

# Delete user
curl -X DELETE http://localhost:8095/usermgmt/api/users/johndoe
```

### Step 8: Verify Data in RDS

```bash
# Connect to RDS from a bastion host or kubectl run
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never -- \
    mysql -h $RDS_ENDPOINT -u $DB_USERNAME -p$DB_PASSWORD

# Inside MySQL shell
USE usermgmt;
SHOW TABLES;
SELECT * FROM users;
DESCRIBE users;
EXIT;
```

### Step 9: Monitoring and Logs

```bash
# View application logs
kubectl logs -l app=usermgmt-restapp --tail=100 -f

# View recent events
kubectl get events --sort-by='.lastTimestamp' | grep usermgmt

# Check pod status
kubectl describe pod -l app=usermgmt-restapp

# Check readiness and liveness probe status
kubectl get pods -l app=usermgmt-restapp -o wide

# View RDS metrics in CloudWatch
aws cloudwatch get-metric-statistics \
    --namespace AWS/RDS \
    --metric-name DatabaseConnections \
    --dimensions Name=DBInstanceIdentifier,Value=$DB_INSTANCE_ID \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --statistics Average \
    --region $AWS_REGION
```

### Step 10: Clean Up Resources

```bash
# Delete Kubernetes resources
kubectl delete -f 03-UserManagement-Service.yml
kubectl delete -f 02-UserManagementMicroservice-Deployment-Service.yml
kubectl delete -f 01-MySQL-externalName-Service.yml
kubectl delete secret mysql-db-password

# Delete RDS instance (with final snapshot)
aws rds delete-db-instance \
    --db-instance-identifier $DB_INSTANCE_ID \
    --final-db-snapshot-identifier $DB_INSTANCE_ID-final-snapshot \
    --region $AWS_REGION

# Or delete without final snapshot (NOT recommended for production)
aws rds delete-db-instance \
    --db-instance-identifier $DB_INSTANCE_ID \
    --skip-final-snapshot \
    --region $AWS_REGION

# Delete DB subnet group (after RDS is deleted)
aws rds delete-db-subnet-group \
    --db-subnet-group-name eks-db-subnet-group \
    --region $AWS_REGION
```

## Configuration

### ExternalName Service Configuration

The ExternalName service provides DNS mapping from internal service name to external RDS endpoint:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql
spec:
  type: ExternalName
  externalName: usermgmtdb.czasg4cict9w.us-east-1.rds.amazonaws.com
```

**Key Concepts:**
- `type: ExternalName` - Creates a CNAME DNS record
- `externalName` - The fully qualified domain name (FQDN) of the RDS endpoint
- No selectors or ports needed - pure DNS mapping
- Applications reference "mysql" instead of the full RDS endpoint
- Enables easy switching between RDS instances without changing application configs

**How it works:**
```
Application connects to "mysql:3306"
  ↓
Kubernetes DNS resolves "mysql"
  ↓
Returns CNAME: usermgmtdb.czasg4cict9w.us-east-1.rds.amazonaws.com
  ↓
Application connects to RDS endpoint
```

### Kubernetes Secret Configuration

Secrets securely store sensitive database credentials:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysql-db-password
type: Opaque
data:
  db-password: ZGJwYXNzd29yZDEx  # Base64 encoded password
```

**Creating Secrets:**

Method 1 - From literal values:
```bash
kubectl create secret generic mysql-db-password \
    --from-literal=db-password=your-password \
    --from-literal=db-username=dbadmin
```

Method 2 - From file:
```bash
echo -n 'your-password' > ./password.txt
kubectl create secret generic mysql-db-password \
    --from-file=db-password=./password.txt
rm ./password.txt
```

Method 3 - From YAML (encode first):
```bash
echo -n 'your-password' | base64
# Use output in YAML file
```

**Security Best Practices:**
- Never commit secrets to version control
- Use AWS Secrets Manager or External Secrets Operator for production
- Rotate credentials regularly
- Use RBAC to restrict secret access
- Enable encryption at rest for etcd

### Application Deployment Configuration

The deployment includes several production-ready features:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: usermgmt-microservice
spec:
  replicas: 1
  template:
    spec:
      # Init container waits for MySQL to be available
      initContainers:
      - name: init-db
        image: busybox:1.31
        command:
        - sh
        - -c
        - |
          echo "Checking for the availability of MySQL Server deployment"
          while ! nc -z mysql 3306; do
            sleep 1
            printf "-"
          done
          echo "MySQL DB Server has started"

      containers:
      - name: usermgmt-restapp
        image: stacksimplify/kube-usermanagement-microservice:1.0.0
        ports:
        - containerPort: 8095

        # Environment variables for database connection
        env:
        - name: DB_HOSTNAME
          value: "mysql"           # ExternalName service name
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

        # Liveness probe - restart pod if failing
        livenessProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - nc -z localhost 8095
          initialDelaySeconds: 60
          periodSeconds: 10

        # Readiness probe - remove from service if not ready
        readinessProbe:
          httpGet:
            path: /usermgmt/health-status
            port: 8095
          initialDelaySeconds: 60
          periodSeconds: 10
```

**Key Features:**

1. **Init Container**: Ensures database is reachable before starting the application
2. **Secret References**: Securely injects database password from Kubernetes Secret
3. **Liveness Probe**: TCP check on port 8095 to ensure application is running
4. **Readiness Probe**: HTTP check on health endpoint to ensure application is ready to serve traffic
5. **Environment Variables**: Configure database connection without hardcoding values

### RDS Configuration Best Practices

When creating RDS instances for EKS workloads:

```bash
aws rds create-db-instance \
    --db-instance-identifier usermgmtdb \
    --db-instance-class db.t3.small \           # Right-size for your workload
    --engine mysql \
    --engine-version 5.7.44 \
    --master-username dbadmin \
    --master-user-password <secure-password> \
    --allocated-storage 20 \
    --storage-type gp3 \                        # Use gp3 for better performance/cost
    --iops 3000 \                               # For gp3 volumes
    --storage-encrypted \                       # Enable encryption at rest
    --kms-key-id <kms-key-arn> \               # Custom KMS key
    --db-name usermgmt \
    --vpc-security-group-ids <sg-id> \
    --db-subnet-group-name eks-db-subnet-group \
    --multi-az \                                # Enable Multi-AZ for HA
    --backup-retention-period 7 \               # 7-day backup retention
    --preferred-backup-window "03:00-04:00" \   # Backup during low usage
    --preferred-maintenance-window "mon:04:00-mon:05:00" \
    --enable-cloudwatch-logs-exports '["error","general","slowquery"]' \
    --monitoring-interval 60 \                  # Enhanced monitoring
    --monitoring-role-arn <monitoring-role-arn> \
    --enable-performance-insights \             # Enable Performance Insights
    --performance-insights-retention-period 7 \
    --deletion-protection \                     # Prevent accidental deletion
    --no-publicly-accessible \                  # Keep private
    --region us-east-1
```

## Features

### 1. Managed Database Service
- Fully managed MySQL database with automated backups
- Automatic software patching and updates
- Multi-AZ deployment for high availability
- Read replicas for read scaling
- Point-in-time recovery
- Automated backups with configurable retention

### 2. ExternalName Service Pattern
- Clean abstraction layer between application and database
- Easy database endpoint updates without application changes
- Consistent naming across environments (dev/staging/prod)
- Kubernetes-native DNS resolution
- No need for hardcoded endpoints in application code

### 3. Secure Credential Management
- Kubernetes Secrets for sensitive data
- Base64 encoding in etcd
- RBAC controls for secret access
- Integration with external secret managers (AWS Secrets Manager, HashiCorp Vault)
- Automatic injection into pods as environment variables or volume mounts

### 4. Application Health Monitoring
- **Init Containers**: Ensure database connectivity before app starts
- **Liveness Probes**: Automatically restart unhealthy pods
- **Readiness Probes**: Remove pods from service endpoints when not ready
- Prevents cascading failures
- Graceful startup and shutdown

### 5. Network Security
- Private RDS instances (no public access)
- VPC security groups for network isolation
- Traffic encryption in transit (SSL/TLS)
- Fine-grained security group rules
- VPC peering support for cross-VPC connectivity

### 6. Scalability
- Horizontal pod autoscaling for application tier
- RDS read replicas for read-heavy workloads
- Connection pooling for efficient database connections
- Independent scaling of compute (EKS) and database (RDS)
- Vertical scaling of RDS instance types

### 7. High Availability
- Multi-AZ RDS deployments for automatic failover
- Multiple application replicas across availability zones
- Automatic DNS updates during RDS failover
- Zero downtime for RDS maintenance windows (Multi-AZ)
- Pod anti-affinity for zone distribution

### 8. Observability and Monitoring
- CloudWatch metrics for RDS (CPU, connections, IOPS, etc.)
- Enhanced monitoring for OS-level metrics
- Performance Insights for query analysis
- Slow query logs
- Application logging with log aggregation
- Prometheus metrics export (can be added)

## Troubleshooting

### Issue: Application Cannot Connect to RDS

**Symptoms:**
```bash
kubectl logs <usermgmt-pod>
# Communications link failure
# Connection refused
```

**Solutions:**

1. Verify ExternalName service has correct RDS endpoint:
```bash
kubectl get svc mysql -o yaml
kubectl describe svc mysql

# Test DNS resolution from pod
kubectl run dns-test --image=busybox:1.31 -it --rm --restart=Never -- nslookup mysql
```

2. Check security group rules:
```bash
# Verify RDS security group allows traffic from EKS nodes
aws ec2 describe-security-groups --group-ids <rds-sg-id>

# Test connectivity from EKS node
kubectl run mysql-test --image=mysql:5.7 -it --rm --restart=Never -- \
    mysql -h <rds-endpoint> -u dbadmin -p
```

3. Verify RDS instance is running:
```bash
aws rds describe-db-instances \
    --db-instance-identifier usermgmtdb \
    --query 'DBInstances[0].DBInstanceStatus'
```

4. Check application environment variables:
```bash
kubectl exec -it <pod-name> -- env | grep DB_
```

### Issue: Init Container Fails (nc: command not found)

**Symptoms:**
```bash
kubectl logs <pod-name> -c init-db
# nc: command not found
```

**Solutions:**

1. Use a different image with netcat:
```yaml
initContainers:
- name: init-db
  image: alpine:latest
  command:
  - sh
  - -c
  - |
    apk add --no-cache netcat-openbsd
    while ! nc -z mysql 3306; do sleep 1; done
```

2. Or use telnet:
```yaml
initContainers:
- name: init-db
  image: busybox:1.31
  command:
  - sh
  - -c
  - |
    until telnet mysql 3306; do
      sleep 2
    done
```

3. Or use a specialized init container image:
```yaml
initContainers:
- name: init-db
  image: appropriate/curl:latest
  command:
  - sh
  - -c
  - |
    until nc -z mysql 3306 2>/dev/null; do
      echo "Waiting for MySQL..."
      sleep 2
    done
```

### Issue: Wrong Database Credentials

**Symptoms:**
```bash
# Access denied for user
# Authentication failed
```

**Solutions:**

1. Verify secret contains correct password:
```bash
kubectl get secret mysql-db-password -o jsonpath='{.data.db-password}' | base64 -d
```

2. Update secret:
```bash
kubectl delete secret mysql-db-password
kubectl create secret generic mysql-db-password \
    --from-literal=db-password=correct-password
```

3. Restart pods to pick up new secret:
```bash
kubectl rollout restart deployment usermgmt-microservice
```

4. Verify RDS credentials:
```bash
# Test with AWS Secrets Manager (if using)
aws secretsmanager get-secret-value \
    --secret-id rds-db-password \
    --query SecretString \
    --output text
```

### Issue: Readiness Probe Failing

**Symptoms:**
```bash
kubectl get pods
# Shows 0/1 Ready
kubectl describe pod <pod-name>
# Readiness probe failed: HTTP probe failed
```

**Solutions:**

1. Check application logs:
```bash
kubectl logs <pod-name>
```

2. Test health endpoint manually:
```bash
kubectl exec -it <pod-name> -- curl http://localhost:8095/usermgmt/health-status
```

3. Increase initialDelaySeconds if application needs more startup time:
```yaml
readinessProbe:
  httpGet:
    path: /usermgmt/health-status
    port: 8095
  initialDelaySeconds: 120  # Increase from 60
  periodSeconds: 10
```

4. Check database connectivity from pod:
```bash
kubectl exec -it <pod-name> -- nc -zv mysql 3306
```

### Issue: RDS Connection Limit Reached

**Symptoms:**
```bash
# Too many connections
# Max connections exceeded
```

**Solutions:**

1. Check current connections in RDS:
```bash
# Via CloudWatch metric
aws cloudwatch get-metric-statistics \
    --namespace AWS/RDS \
    --metric-name DatabaseConnections \
    --dimensions Name=DBInstanceIdentifier,Value=usermgmtdb \
    --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 60 \
    --statistics Maximum
```

2. Modify RDS parameter group to increase max_connections:
```bash
aws rds modify-db-parameter-group \
    --db-parameter-group-name default.mysql5.7 \
    --parameters "ParameterName=max_connections,ParameterValue=200,ApplyMethod=immediate"
```

3. Implement connection pooling in application
4. Scale down application replicas temporarily
5. Upgrade RDS instance class for more resources

### Issue: Slow Query Performance

**Symptoms:**
- Slow response times from API
- Database queries timing out

**Solutions:**

1. Enable Performance Insights:
```bash
aws rds modify-db-instance \
    --db-instance-identifier usermgmtdb \
    --enable-performance-insights \
    --performance-insights-retention-period 7
```

2. Check slow query log:
```bash
# Enable slow query log
aws rds modify-db-parameter-group \
    --db-parameter-group-name your-param-group \
    --parameters "ParameterName=slow_query_log,ParameterValue=1,ApplyMethod=immediate" \
                "ParameterName=long_query_time,ParameterValue=2,ApplyMethod=immediate"
```

3. Add database indexes
4. Optimize application queries
5. Consider read replicas for read-heavy workloads

### Issue: RDS Multi-AZ Failover Not Transparent

**Symptoms:**
- Application errors during RDS maintenance or failover
- Connection timeouts

**Solutions:**

1. Ensure application has proper retry logic:
```java
// Spring Boot example
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.maximum-pool-size=10
```

2. Tune readiness probe to handle temporary failures:
```yaml
readinessProbe:
  httpGet:
    path: /usermgmt/health-status
    port: 8095
  initialDelaySeconds: 60
  periodSeconds: 10
  failureThreshold: 3     # Allow 3 failures before marking unhealthy
  successThreshold: 1
```

3. Monitor RDS events:
```bash
aws rds describe-events \
    --source-identifier usermgmtdb \
    --source-type db-instance \
    --duration 1440
```

## Best Practices

### 1. RDS Instance Configuration

**Right-Size Your Instance:**
```bash
# Start with smaller instances for dev/test
db.t3.micro   # 1 vCPU, 1 GB RAM - Dev/Test
db.t3.small   # 2 vCPU, 2 GB RAM - Small production
db.t3.medium  # 2 vCPU, 4 GB RAM - Medium production
db.r5.large   # 2 vCPU, 16 GB RAM - Memory-intensive workloads
```

**Enable Important Features:**
- Multi-AZ for production workloads
- Automated backups with appropriate retention
- Encryption at rest with KMS
- Enhanced monitoring and Performance Insights
- Deletion protection for production databases
- SSL/TLS for data in transit

**Storage Configuration:**
```bash
--storage-type gp3 \                    # Latest generation
--allocated-storage 100 \               # Start size
--max-allocated-storage 1000 \          # Enable autoscaling
--iops 3000 \                           # Provisioned IOPS for gp3
--storage-encrypted \                   # Always encrypt
--kms-key-id <your-kms-key-arn>        # Custom KMS key
```

### 2. Security Best Practices

**Network Security:**
```bash
# Minimal security group rules
aws ec2 authorize-security-group-ingress \
    --group-id <rds-sg-id> \
    --protocol tcp \
    --port 3306 \
    --source-group <eks-node-sg-id> \
    --description "Allow MySQL from EKS nodes only"
```

**Secret Management:**

Use AWS Secrets Manager with External Secrets Operator:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: rds-credentials
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: mysql-db-password
  data:
  - secretKey: db-password
    remoteRef:
      key: prod/rds/usermgmt
      property: password
```

**IAM Authentication (Advanced):**

Enable IAM database authentication for RDS:
```bash
aws rds modify-db-instance \
    --db-instance-identifier usermgmtdb \
    --enable-iam-database-authentication
```

### 3. High Availability Architecture

**Multi-AZ RDS:**
```bash
aws rds create-db-instance \
    --db-instance-identifier usermgmtdb \
    --multi-az \                        # Enable Multi-AZ
    --backup-retention-period 7 \
    --preferred-backup-window "03:00-04:00"
```

**Application HA:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: usermgmt-microservice
spec:
  replicas: 3                           # Multiple replicas
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0                 # Zero-downtime updates

  template:
    spec:
      affinity:
        podAntiAffinity:                # Spread across zones
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - usermgmt-restapp
              topologyKey: topology.kubernetes.io/zone
```

**Read Replicas for Read Scaling:**
```bash
aws rds create-db-instance-read-replica \
    --db-instance-identifier usermgmtdb-read-1 \
    --source-db-instance-identifier usermgmtdb \
    --db-instance-class db.t3.small \
    --availability-zone us-east-1b
```

### 4. Connection Pooling

Configure HikariCP (Spring Boot default):

```yaml
spring:
  datasource:
    hikari:
      minimum-idle: 5
      maximum-pool-size: 20
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      connection-test-query: SELECT 1
```

### 5. Monitoring and Alerting

**CloudWatch Alarms:**
```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
    --alarm-name rds-high-cpu \
    --alarm-description "RDS CPU over 80%" \
    --metric-name CPUUtilization \
    --namespace AWS/RDS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --dimensions Name=DBInstanceIdentifier,Value=usermgmtdb

# Free storage alarm
aws cloudwatch put-metric-alarm \
    --alarm-name rds-low-storage \
    --metric-name FreeStorageSpace \
    --namespace AWS/RDS \
    --statistic Average \
    --period 300 \
    --threshold 10737418240 \
    --comparison-operator LessThanThreshold \
    --evaluation-periods 1 \
    --dimensions Name=DBInstanceIdentifier,Value=usermgmtdb

# Database connections alarm
aws cloudwatch put-metric-alarm \
    --alarm-name rds-high-connections \
    --metric-name DatabaseConnections \
    --namespace AWS/RDS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --dimensions Name=DBInstanceIdentifier,Value=usermgmtdb
```

### 6. Backup and Disaster Recovery

**Automated Backups:**
```bash
aws rds modify-db-instance \
    --db-instance-identifier usermgmtdb \
    --backup-retention-period 30 \      # 30 days retention
    --preferred-backup-window "03:00-04:00" \
    --copy-tags-to-snapshot
```

**Manual Snapshots:**
```bash
# Create snapshot before major changes
aws rds create-db-snapshot \
    --db-instance-identifier usermgmtdb \
    --db-snapshot-identifier usermgmtdb-pre-upgrade-$(date +%Y%m%d)

# Copy snapshot to another region for DR
aws rds copy-db-snapshot \
    --source-db-snapshot-identifier arn:aws:rds:us-east-1:account:snapshot:snapshot-name \
    --target-db-snapshot-identifier usermgmtdb-dr-copy \
    --region us-west-2 \
    --source-region us-east-1
```

**Point-in-Time Recovery:**
```bash
# Restore to specific point in time
aws rds restore-db-instance-to-point-in-time \
    --source-db-instance-identifier usermgmtdb \
    --target-db-instance-identifier usermgmtdb-restored \
    --restore-time 2025-01-15T10:30:00Z
```

### 7. Cost Optimization

- Use appropriate instance sizing (avoid over-provisioning)
- Enable storage autoscaling to pay only for used storage
- Delete old snapshots and automated backups
- Use Dev/Test pricing for non-production instances
- Schedule non-production RDS instances to stop during off-hours
- Use gp3 instead of gp2 for cost savings
- Monitor and optimize database queries to reduce resource usage
- Use Reserved Instances for predictable production workloads

### 8. Performance Optimization

**Database Parameter Tuning:**
```bash
# Create custom parameter group
aws rds create-db-parameter-group \
    --db-parameter-group-name mysql57-optimized \
    --db-parameter-group-family mysql5.7 \
    --description "Optimized MySQL 5.7 parameters"

# Modify parameters
aws rds modify-db-parameter-group \
    --db-parameter-group-name mysql57-optimized \
    --parameters \
        "ParameterName=max_connections,ParameterValue=200,ApplyMethod=immediate" \
        "ParameterName=innodb_buffer_pool_size,ParameterValue={DBInstanceClassMemory*3/4},ApplyMethod=pending-reboot" \
        "ParameterName=query_cache_size,ParameterValue=0,ApplyMethod=immediate" \
        "ParameterName=slow_query_log,ParameterValue=1,ApplyMethod=immediate"
```

**Indexing:**
- Create indexes on frequently queried columns
- Use composite indexes for multi-column queries
- Monitor index usage with Performance Insights
- Remove unused indexes to improve write performance

### 9. Application Resilience

**Retry Logic with Exponential Backoff:**
```java
@Retryable(
    value = {SQLException.class, TransientDataAccessException.class},
    maxAttempts = 3,
    backoff = @Backoff(delay = 1000, multiplier = 2)
)
public User getUserByUsername(String username) {
    return userRepository.findByUsername(username);
}
```

**Circuit Breaker Pattern:**
```java
@CircuitBreaker(name = "database", fallbackMethod = "fallbackGetUser")
public User getUserByUsername(String username) {
    return userRepository.findByUsername(username);
}

public User fallbackGetUser(String username, Exception e) {
    return User.builder()
        .username(username)
        .email("unavailable@example.com")
        .build();
}
```

