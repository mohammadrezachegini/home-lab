# EKS NLB Basics

## Overview

This project demonstrates how to configure AWS Network Load Balancer (NLB) for Kubernetes services on Amazon EKS using the AWS Load Balancer Controller. Unlike Application Load Balancers (ALB) which operate at Layer 7 (HTTP/HTTPS), Network Load Balancers operate at Layer 4 (TCP/UDP), providing ultra-low latency, high throughput, and support for non-HTTP protocols.

NLBs are ideal for:
- **TCP/UDP workloads**: Any protocol beyond HTTP/HTTPS
- **Ultra-low latency**: Minimal processing overhead
- **High throughput**: Millions of requests per second
- **Static IP addresses**: Elastic IPs for whitelisting
- **PrivateLink**: VPC endpoint services
- **Long-lived connections**: WebSocket, gRPC, database connections

## Architecture

```
Internet
    |
    v
AWS Network Load Balancer (NLB)
    |
    +-- Target Group (Instance mode)
            |
            v
    +-------+-------+-------+
    |       |       |       |
    v       v       v       v
  Node1   Node2   Node3   Node4
    |       |       |       |
    +-------+-------+-------+
            |
            v
        Pod Network
       (app3-nginx)
```

### NLB vs ALB Comparison

| Feature | Network Load Balancer (NLB) | Application Load Balancer (ALB) |
|---------|----------------------------|--------------------------------|
| **OSI Layer** | Layer 4 (TCP/UDP) | Layer 7 (HTTP/HTTPS) |
| **Protocols** | TCP, UDP, TLS | HTTP, HTTPS, HTTP/2, gRPC |
| **Latency** | Ultra-low (microseconds) | Low (milliseconds) |
| **Throughput** | Millions of requests/sec | Thousands of requests/sec |
| **Static IP** | Yes (Elastic IP support) | No (DNS only) |
| **Path Routing** | No | Yes |
| **Host Routing** | No | Yes |
| **WebSocket** | Yes (native) | Yes (via HTTP upgrade) |
| **SSL/TLS** | Passthrough or termination | Termination only |
| **Cost** | Lower per GB processed | Higher per GB processed |

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.0
- kubectl configured to interact with your EKS cluster
- AWS Load Balancer Controller installed
- Understanding of Layer 4 load balancing concepts
- Basic knowledge of Kubernetes Services

## Project Structure

```
EKS-NLB-Basics/
├── ekscluster-terraform-manifests/     # EKS cluster infrastructure
│   ├── c1-versions.tf                   # Provider versions
│   ├── c3-01-vpc-variables.tf          # VPC configuration
│   ├── c5-06-eks-cluster.tf            # EKS cluster definition
│   └── ...
├── lbc-install-terraform-manifests/    # AWS Load Balancer Controller
│   ├── c1-versions.tf
│   ├── c4-03-lbc-install.tf            # LBC Helm installation
│   └── ...
├── externaldns-install-terraform-manifests/  # ExternalDNS setup
│   ├── c4-03-externaldns-install.tf
│   └── ...
├── nlb-basics-terraform-manifests/     # Terraform-managed NLB resources
│   └── ...
└── kube-manifests-nlb-basics/          # Kubernetes manifests for NLB
    ├── 01-Nginx-App3-Deployment.yml
    └── 02-LBC-NLB-LoadBalancer-Service.yml
```

## Usage

### Step 1: Deploy EKS Cluster

```bash
cd ekscluster-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

### Step 2: Install AWS Load Balancer Controller

The AWS Load Balancer Controller manages both ALB and NLB resources.

```bash
cd ../lbc-install-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

Verify the controller is running:
```bash
kubectl get deployment -n kube-system aws-load-balancer-controller
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

### Step 3: Install ExternalDNS (Optional)

```bash
cd ../externaldns-install-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

### Step 4: Deploy Application with NLB

You can deploy using either Terraform or kubectl:

#### Option A: Using kubectl

```bash
cd ../kube-manifests-nlb-basics

# Deploy the application and NLB service
kubectl apply -f 01-Nginx-App3-Deployment.yml
kubectl apply -f 02-LBC-NLB-LoadBalancer-Service.yml
```

#### Option B: Using Terraform

```bash
cd ../nlb-basics-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

### Step 5: Verify Deployment

```bash
# Check deployment
kubectl get deployment

# Check pods
kubectl get pods

# Check service (wait for EXTERNAL-IP to be assigned)
kubectl get service basics-lbc-network-lb

# Watch service until NLB is provisioned
kubectl get service basics-lbc-network-lb --watch
```

### Step 6: Get NLB DNS Name

```bash
# Get NLB DNS name
NLB_DNS=$(kubectl get service basics-lbc-network-lb -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "NLB DNS: $NLB_DNS"
```

### Step 7: Verify NLB in AWS Console

1. Navigate to EC2 Console → Load Balancers
2. Find your NLB (name: `basics-lbc-network-lb`)
3. Verify:
   - Type: network
   - Scheme: internet-facing
   - Target groups registered
   - Targets are healthy

### Step 8: Test Access

```bash
# Test HTTP access
curl http://$NLB_DNS/

# Test multiple times to see load balancing
for i in {1..10}; do
  curl -s http://$NLB_DNS/ | grep -i hostname
done
```

## Configuration

### NLB Service Configuration

**File**: `kube-manifests-nlb-basics/02-LBC-NLB-LoadBalancer-Service.yml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: basics-lbc-network-lb
  annotations:
    # Traffic Routing
    service.beta.kubernetes.io/aws-load-balancer-name: basics-lbc-network-lb
    service.beta.kubernetes.io/aws-load-balancer-type: external
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: instance

    # Health Check Settings
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-protocol: http
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-port: traffic-port
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-path: /index.html
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-healthy-threshold: "3"
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-unhealthy-threshold: "3"
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-interval: "10"

    # Access Control
    service.beta.kubernetes.io/load-balancer-source-ranges: 0.0.0.0/0
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"

    # AWS Resource Tags
    service.beta.kubernetes.io/aws-load-balancer-additional-resource-tags: Environment=dev,Team=test

spec:
  type: LoadBalancer
  selector:
    app: app3-nginx
  ports:
  - port: 80
    targetPort: 80
```

### Deployment Configuration

**File**: `kube-manifests-nlb-basics/01-Nginx-App3-Deployment.yml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app3-nginx-deployment
  labels:
    app: app3-nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: app3-nginx
  template:
    metadata:
      labels:
        app: app3-nginx
    spec:
      containers:
      - name: app3-nginx
        image: stacksimplify/kube-nginxapp1:1.0.0
        ports:
        - containerPort: 80
```

### Key Annotations Explained

| Annotation | Purpose | Example Value |
|------------|---------|---------------|
| `service.beta.kubernetes.io/aws-load-balancer-name` | Sets the NLB name in AWS | `basics-lbc-network-lb` |
| `service.beta.kubernetes.io/aws-load-balancer-type` | Specifies load balancer type | `external` (creates NLB in public subnets) |
| `service.beta.kubernetes.io/aws-load-balancer-nlb-target-type` | Target registration mode | `instance` or `ip` |
| `service.beta.kubernetes.io/aws-load-balancer-scheme` | NLB visibility | `internet-facing` or `internal` |
| `service.beta.kubernetes.io/aws-load-balancer-healthcheck-protocol` | Health check protocol | `http`, `https`, or `tcp` |
| `service.beta.kubernetes.io/aws-load-balancer-healthcheck-path` | Health check path | `/health`, `/index.html` |
| `service.beta.kubernetes.io/load-balancer-source-ranges` | CIDR blocks allowed to access NLB | `0.0.0.0/0` (all), or specific CIDRs |
| `service.beta.kubernetes.io/aws-load-balancer-additional-resource-tags` | Custom AWS tags | `Environment=prod,App=web` |

### Health Check Configuration

NLB supports multiple health check protocols:

**HTTP/HTTPS Health Checks**:
```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-healthcheck-protocol: http
  service.beta.kubernetes.io/aws-load-balancer-healthcheck-path: /health
  service.beta.kubernetes.io/aws-load-balancer-healthcheck-port: traffic-port
```

**TCP Health Checks**:
```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-healthcheck-protocol: tcp
  service.beta.kubernetes.io/aws-load-balancer-healthcheck-port: traffic-port
```

**Important Notes**:
- Health check timeout is fixed: 10s for TCP, 6s for HTTP
- Controller ignores timeout configuration due to AWS NLB limitations
- Use `traffic-port` to health check on the same port as traffic

## Features

### 1. Layer 4 Load Balancing

**TCP/UDP Support**:
- Works with any TCP or UDP based protocol
- Not limited to HTTP/HTTPS like ALB
- Ideal for databases, message queues, custom protocols

**Ultra-Low Latency**:
- Minimal packet inspection
- Direct connection to targets
- Preserves source IP address

### 2. Target Type: Instance vs IP

**Instance Mode** (Used in this example):
```yaml
service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: instance
```
- Targets EC2 instances using NodePort
- Works with any CNI plugin
- Compatible with legacy applications

**IP Mode**:
```yaml
service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip
```
- Targets pod IPs directly
- Requires VPC CNI plugin
- Better for Fargate and performance

### 3. Health Check Flexibility

- **Multiple protocols**: HTTP, HTTPS, TCP
- **Configurable thresholds**: Healthy/unhealthy counts
- **Custom intervals**: Health check frequency
- **Path-based checks**: For HTTP/HTTPS health checks

### 4. Access Control

**Source IP Filtering**:
```yaml
service.beta.kubernetes.io/load-balancer-source-ranges: 10.0.0.0/8,192.168.0.0/16
```

**Public vs Private**:
- `internet-facing`: Public NLB in public subnets
- `internal`: Private NLB in private subnets

### 5. Resource Tagging

Add custom tags for cost allocation, organization, and automation:
```yaml
service.beta.kubernetes.io/aws-load-balancer-additional-resource-tags: |
  Environment=production,
  Application=web,
  Team=platform,
  CostCenter=engineering
```

## Troubleshooting

### Issue: NLB Not Created

**Symptoms**: Service shows `<pending>` for EXTERNAL-IP

**Solutions**:

1. Check AWS Load Balancer Controller logs:
```bash
kubectl logs -n kube-system deployment/aws-load-balancer-controller --tail=100
```

2. Verify controller is running:
```bash
kubectl get deployment -n kube-system aws-load-balancer-controller
```

3. Check IAM permissions:
```bash
# Verify service account has correct annotations
kubectl get sa -n kube-system aws-load-balancer-controller -o yaml

# Check IAM role exists
aws iam get-role --role-name <lbc-role-name>
```

4. Verify annotation syntax:
```bash
kubectl get service basics-lbc-network-lb -o yaml
```

### Issue: Targets Unhealthy

**Symptoms**: NLB created but targets show unhealthy in AWS console

**Solutions**:

1. Check target health in AWS Console:
   - EC2 → Load Balancers → Target Groups
   - View health check failures and reason codes

2. Verify pods are running:
```bash
kubectl get pods -l app=app3-nginx
```

3. Test health check endpoint:
```bash
# Port forward to pod
kubectl port-forward deployment/app3-nginx-deployment 8080:80

# Test health check path
curl http://localhost:8080/index.html
```

4. Check security groups:
```bash
# Ensure node security group allows health check traffic
# Default: All traffic from NLB to nodes on NodePort range
```

5. Verify NodePort is accessible:
```bash
# Get NodePort
kubectl get service basics-lbc-network-lb -o jsonpath='{.spec.ports[0].nodePort}'

# SSH to node and test
curl http://localhost:<nodeport>/index.html
```

### Issue: Connection Timeout

**Symptoms**: NLB accessible but connections timeout

**Solutions**:

1. Check security group rules:
```bash
# Node security group must allow traffic from NLB security group
aws ec2 describe-security-groups --group-ids <node-sg-id>
```

2. Verify subnet configuration:
```bash
# Ensure NLB is in correct subnets
kubectl get service basics-lbc-network-lb -o yaml | grep subnets
```

3. Check VPC routing:
```bash
# Verify route tables for public/private subnets
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=<vpc-id>"
```

### Issue: Source IP Not Preserved

**Symptoms**: Application sees NLB IP instead of client IP

**Solutions**:

1. For instance target type, enable proxy protocol or use:
```yaml
spec:
  externalTrafficPolicy: Local  # Preserves source IP but may cause imbalanced traffic
```

2. For IP target type, source IP is preserved by default

3. Alternative: Parse X-Forwarded-For header (if using TLS termination)

### Issue: NLB Deletion Stuck

**Symptoms**: NLB not deleted when service is removed

**Solutions**:

1. Check finalizers:
```bash
kubectl get service basics-lbc-network-lb -o yaml | grep finalizers
```

2. Remove finalizers if stuck:
```bash
kubectl patch service basics-lbc-network-lb -p '{"metadata":{"finalizers":null}}'
```

3. Manually delete NLB in AWS Console (last resort)

### Issue: Subnet Discovery Failure

**Symptoms**: NLB created in wrong subnets

**Solutions**:

1. Tag subnets correctly for auto-discovery:
```bash
# Public subnets for internet-facing NLB
Key: kubernetes.io/role/elb
Value: 1

# Private subnets for internal NLB
Key: kubernetes.io/role/internal-elb
Value: 1
```

2. Or specify subnets explicitly:
```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-subnets: subnet-abc123,subnet-def456
```

## Best Practices

### 1. Health Check Configuration

**Use appropriate health check protocol**:
- HTTP/HTTPS for web applications (more reliable)
- TCP for non-HTTP protocols (faster, less specific)

**Set reasonable thresholds**:
```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-healthcheck-healthy-threshold: "3"
  service.beta.kubernetes.io/aws-load-balancer-healthcheck-unhealthy-threshold: "3"
  service.beta.kubernetes.io/aws-load-balancer-healthcheck-interval: "10"
```

**Use dedicated health check endpoints**:
```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-healthcheck-path: /health
```

### 2. Security Configuration

**Restrict source IP ranges**:
```yaml
# Allow only specific IP ranges
service.beta.kubernetes.io/load-balancer-source-ranges: 10.0.0.0/8,192.168.1.0/24
```

**Use internal NLB for private services**:
```yaml
service.beta.kubernetes.io/aws-load-balancer-scheme: "internal"
```

**Enable deletion protection for production**:
```yaml
service.beta.kubernetes.io/aws-load-balancer-attributes: deletion_protection.enabled=true
```

### 3. Target Type Selection

**Choose instance mode when**:
- Using non-VPC CNI plugins
- Need compatibility with existing infrastructure
- Running mixed workloads (containers + VMs)

**Choose IP mode when**:
- Using AWS Fargate
- Need better performance
- Want to preserve source IP without configuration

### 4. Resource Organization

**Use consistent naming**:
```yaml
service.beta.kubernetes.io/aws-load-balancer-name: <app>-<env>-nlb
```

**Tag resources properly**:
```yaml
service.beta.kubernetes.io/aws-load-balancer-additional-resource-tags: |
  Environment=production,
  Application=myapp,
  ManagedBy=kubernetes
```

### 5. High Availability

**Deploy across multiple AZs**:
- Ensure pods run in multiple availability zones
- Use pod anti-affinity for better distribution
- NLB automatically distributes across AZs

**Set appropriate replica counts**:
```yaml
spec:
  replicas: 3  # Minimum for HA
```

### 6. Monitoring and Alerting

**Enable NLB access logs**:
```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-access-log-enabled: "true"
  service.beta.kubernetes.io/aws-load-balancer-access-log-s3-bucket-name: my-nlb-logs
```

**Monitor CloudWatch metrics**:
- HealthyHostCount
- UnHealthyHostCount
- ProcessedBytes
- ActiveFlowCount
- NewFlowCount

**Set up CloudWatch alarms**:
```bash
# Example: Alert when unhealthy hosts > 0
aws cloudwatch put-metric-alarm \
  --alarm-name nlb-unhealthy-targets \
  --metric-name UnHealthyHostCount \
  --namespace AWS/NetworkELB \
  --statistic Average \
  --period 60 \
  --evaluation-periods 2 \
  --threshold 0 \
  --comparison-operator GreaterThanThreshold
```

### 7. Cost Optimization

**Use fewer NLBs with multiple ports**:
```yaml
spec:
  ports:
  - port: 80
    targetPort: 80
  - port: 443
    targetPort: 443
```

**Clean up unused NLBs**:
- Remove services when no longer needed
- Monitor for orphaned NLBs

**Use internal NLBs when possible**:
- Lower data transfer costs
- Better security posture

### 8. Production Readiness

**Enable cross-zone load balancing**:
```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"
```

**Configure connection draining**:
```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-target-group-attributes: |
    deregistration_delay.timeout_seconds=30,
    deregistration_delay.connection_termination.enabled=true
```
