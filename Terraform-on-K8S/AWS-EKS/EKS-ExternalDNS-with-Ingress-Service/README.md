# EKS ExternalDNS with Ingress Service

## Overview

This project demonstrates how to use **ExternalDNS** with **Kubernetes Ingress resources** to automatically create and manage DNS records in AWS Route53 for Application Load Balancers (ALB). This is the most common pattern for production web applications, combining the power of ALB Ingress for Layer 7 routing with automated DNS management.

When you deploy an Ingress resource with ExternalDNS annotations, the following happens automatically:
1. AWS Load Balancer Controller creates an Application Load Balancer
2. ExternalDNS watches the Ingress resource
3. ExternalDNS extracts the hostname from annotations
4. ExternalDNS creates a Route53 DNS record pointing to the ALB
5. Clients can access your application via friendly DNS names

This pattern is ideal for:
- **Production web applications**: HTTPS-enabled websites and APIs
- **Multi-application hosting**: Multiple apps behind a single ALB
- **Path-based routing**: Route /app1, /app2 to different services
- **SSL/TLS termination**: HTTPS at the load balancer level
- **Automated DNS**: Zero-touch DNS record management

## Architecture

```
Internet
    |
    v
Route53 DNS Records (Managed by ExternalDNS)
    |
    +-- dnstest901.rezaops.com --------+
    |                                   |
    +-- dnstest902.rezaops.com --------+
                                        |
                                        v
            Application Load Balancer (ALB)
                [Created by AWS LBC]
                [SSL/TLS Termination]
                        |
        +---------------+---------------+
        |               |               |
        v               v               v
    /app1           /app2       /* (default)
        |               |               |
        v               v               v
   Service1        Service2        Service3
   (NodePort)      (NodePort)      (NodePort)
        |               |               |
        v               v               v
    Pod Group1      Pod Group2      Pod Group3
   (app1-nginx)    (app2-nginx)    (app3-nginx)
```

### Request Flow

```
Client Request: https://dnstest901.rezaops.com/app1
            ↓
Route53 DNS Resolution → ALB DNS
            ↓
ALB SSL/TLS Termination
            ↓
ALB Path-Based Routing (/app1)
            ↓
Service: app1-nginx-nodeport-service
            ↓
Pods: app1-nginx (replicas)
            ↓
Response returned to client
```

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.0
- kubectl configured to interact with your EKS cluster
- **AWS Load Balancer Controller installed** (required for Ingress)
- **ExternalDNS installed** (see EKS-ExternalDNS-Install project)
- Route53 hosted zone for your domain
- **ACM certificate** for HTTPS (must cover your domain)
- Understanding of Kubernetes Ingress resources

## Project Structure

```
EKS-ExternalDNS-with-Ingress-Service/
├── ekscluster-terraform-manifests/          # EKS cluster infrastructure
│   ├── c1-versions.tf                        # Provider versions
│   ├── c3-01-vpc-variables.tf               # VPC configuration
│   ├── c5-06-eks-cluster.tf                 # EKS cluster definition
│   └── ...
├── lbc-install-terraform-manifests/         # AWS Load Balancer Controller
│   ├── c1-versions.tf
│   ├── c4-03-lbc-install.tf                 # LBC Helm installation
│   └── ...
├── externaldns-install-terraform-manifests/ # ExternalDNS setup
│   ├── c4-03-externaldns-install.tf
│   └── ...
├── ingress-externaldns-terraform-manifests/ # Terraform-managed resources
│   └── ...
└── kube-manifests-ingress-externaldns/      # Kubernetes manifests
    ├── 01-Nginx-App1-Deployment-and-NodePortService.yml
    ├── 02-Nginx-App2-Deployment-and-NodePortService.yml
    ├── 03-Nginx-App3-Deployment-and-NodePortService.yml
    └── 04-ALB-Ingress-SSL-Redirect-ExternalDNS.yml
```

## Usage

### Step 1: Verify Prerequisites

Ensure AWS Load Balancer Controller is running:

```bash
kubectl get deployment -n kube-system aws-load-balancer-controller
kubectl logs -n kube-system deployment/aws-load-balancer-controller --tail=20
```

Ensure ExternalDNS is running:

```bash
kubectl get deployment -n default external-dns
kubectl logs -n default deployment/external-dns --tail=20
```

Verify IngressClass exists:

```bash
kubectl get ingressclass
# Should show: my-aws-ingress-class
```

### Step 2: Obtain ACM Certificate

Create or verify ACM certificate for your domain:

```bash
# Request certificate (if not exists)
aws acm request-certificate \
  --domain-name "*.rezaops.com" \
  --validation-method DNS \
  --region us-east-1

# List certificates
aws acm list-certificates --region us-east-1

# Verify certificate status is ISSUED
aws acm describe-certificate \
  --certificate-arn <cert-arn> \
  --region us-east-1 \
  --query 'Certificate.Status'
```

### Step 3: Update Ingress Manifest with Certificate ARN

```bash
cd kube-manifests-ingress-externaldns

# Edit the Ingress manifest
vim 04-ALB-Ingress-SSL-Redirect-ExternalDNS.yml

# Update the certificate ARN annotation
# alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:xxx:certificate/xxx
```

### Step 4: Deploy Applications and Services

You can deploy using either Terraform or kubectl:

#### Option A: Using kubectl

```bash
cd kube-manifests-ingress-externaldns

# Deploy all three applications
kubectl apply -f 01-Nginx-App1-Deployment-and-NodePortService.yml
kubectl apply -f 02-Nginx-App2-Deployment-and-NodePortService.yml
kubectl apply -f 03-Nginx-App3-Deployment-and-NodePortService.yml

# Deploy the Ingress resource
kubectl apply -f 04-ALB-Ingress-SSL-Redirect-ExternalDNS.yml
```

#### Option B: Using Terraform

```bash
cd ingress-externaldns-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

### Step 5: Verify Deployment

```bash
# Check deployments
kubectl get deployments

# Check pods
kubectl get pods

# Check services
kubectl get services

# Check Ingress
kubectl get ingress ingress-externaldns-demo

# Describe Ingress to see ALB details
kubectl describe ingress ingress-externaldns-demo
```

### Step 6: Verify ALB Creation

```bash
# Get ALB DNS name from Ingress
kubectl get ingress ingress-externaldns-demo -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Verify in AWS Console
# Navigate to EC2 → Load Balancers
# Find: externaldns-ingress
# Check: Scheme (internet-facing), Listeners (80, 443)
```

### Step 7: Verify DNS Record Creation

Watch ExternalDNS create the Route53 records:

```bash
# Watch ExternalDNS logs
kubectl logs -n default deployment/external-dns --follow

# You should see:
# time="..." level=info msg="Desired change: CREATE dnstest901.rezaops.com A"
# time="..." level=info msg="Desired change: CREATE dnstest902.rezaops.com A"
# time="..." level=info msg="2 record(s) were successfully updated"
```

Wait for DNS propagation (30-60 seconds):

```bash
# Test DNS resolution
nslookup dnstest901.rezaops.com
nslookup dnstest902.rezaops.com

# Should return ALB DNS name
dig dnstest901.rezaops.com
```

Verify in Route53:

```bash
# List DNS records
aws route53 list-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --query "ResourceRecordSets[?Name=='dnstest901.rezaops.com.']"

aws route53 list-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --query "ResourceRecordSets[?Name=='dnstest902.rezaops.com.']"
```

### Step 8: Test Access

```bash
# Access via DNS names (HTTPS - will redirect from HTTP)
curl https://dnstest901.rezaops.com/app1
curl https://dnstest901.rezaops.com/app2
curl https://dnstest901.rezaops.com/

# Test HTTP redirect to HTTPS
curl -I http://dnstest901.rezaops.com/app1
# Should return: HTTP/1.1 301 Moved Permanently
# Location: https://dnstest901.rezaops.com:443/app1

# Test with second DNS name
curl https://dnstest902.rezaops.com/app1
curl https://dnstest902.rezaops.com/app2

# Test default backend
curl https://dnstest901.rezaops.com/
# Should route to app3-nginx (default backend)
```

### Step 9: Verify SSL/TLS

```bash
# Check certificate
curl -vI https://dnstest901.rezaops.com/app1 2>&1 | grep -i "subject:"

# Or use OpenSSL
openssl s_client -connect dnstest901.rezaops.com:443 -servername dnstest901.rezaops.com < /dev/null
```

## Configuration

### Ingress with ExternalDNS and SSL

**File**: `kube-manifests-ingress-externaldns/04-ALB-Ingress-SSL-Redirect-ExternalDNS.yml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-externaldns-demo
  annotations:
    # Load Balancer Name
    alb.ingress.kubernetes.io/load-balancer-name: externaldns-ingress

    # Ingress Core Settings
    alb.ingress.kubernetes.io/scheme: internet-facing

    # Health Check Settings
    alb.ingress.kubernetes.io/healthcheck-protocol: HTTP
    alb.ingress.kubernetes.io/healthcheck-port: traffic-port
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: '15'
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: '5'
    alb.ingress.kubernetes.io/success-codes: '200'
    alb.ingress.kubernetes.io/healthy-threshold-count: '2'
    alb.ingress.kubernetes.io/unhealthy-threshold-count: '2'

    # SSL Settings
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}, {"HTTP":80}]'
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:180789647333:certificate/0d86500a-08b3-4f17-8fb4-f09532ba0522

    # SSL Redirect Setting - REDIRECT HTTP to HTTPS
    alb.ingress.kubernetes.io/ssl-redirect: '443'

    # External DNS - Multiple hostnames supported
    external-dns.alpha.kubernetes.io/hostname: dnstest901.rezaops.com, dnstest902.rezaops.com

spec:
  ingressClassName: my-aws-ingress-class
  defaultBackend:
    service:
      name: app3-nginx-nodeport-service
      port:
        number: 80
  rules:
  - http:
      paths:
      - path: /app1
        pathType: Prefix
        backend:
          service:
            name: app1-nginx-nodeport-service
            port:
              number: 80
      - path: /app2
        pathType: Prefix
        backend:
          service:
            name: app2-nginx-nodeport-service
            port:
              number: 80
```

### Key Annotations Explained

#### ALB Annotations

| Annotation | Purpose | Example Value |
|------------|---------|---------------|
| `alb.ingress.kubernetes.io/load-balancer-name` | ALB name in AWS | `externaldns-ingress` |
| `alb.ingress.kubernetes.io/scheme` | ALB visibility | `internet-facing` or `internal` |
| `alb.ingress.kubernetes.io/listen-ports` | Listeners to create | `[{"HTTPS":443}, {"HTTP":80}]` |
| `alb.ingress.kubernetes.io/certificate-arn` | ACM certificate for HTTPS | `arn:aws:acm:...` |
| `alb.ingress.kubernetes.io/ssl-redirect` | Redirect HTTP to HTTPS | `443` |
| `alb.ingress.kubernetes.io/healthcheck-path` | Health check endpoint | `/health` |

#### ExternalDNS Annotations

| Annotation | Purpose | Example Value |
|------------|---------|---------------|
| `external-dns.alpha.kubernetes.io/hostname` | DNS names to create | `myapp.example.com` or comma-separated list |
| `external-dns.alpha.kubernetes.io/ttl` | DNS record TTL (optional) | `300` |
| `external-dns.alpha.kubernetes.io/alias` | Use ALIAS record (optional) | `true` |

### Multiple DNS Names

The Ingress supports multiple DNS names pointing to the same ALB:

```yaml
annotations:
  external-dns.alpha.kubernetes.io/hostname: dnstest901.rezaops.com, dnstest902.rezaops.com
```

Both DNS names will:
- Point to the same ALB
- Serve the same applications
- Use the same SSL certificate (if wildcard or multi-domain)

### Path-Based Routing

The Ingress defines path-based routing:

```yaml
spec:
  defaultBackend:
    service:
      name: app3-nginx-nodeport-service  # Serves /* (catch-all)
  rules:
  - http:
      paths:
      - path: /app1                      # Serves /app1/*
        pathType: Prefix
        backend:
          service:
            name: app1-nginx-nodeport-service
      - path: /app2                      # Serves /app2/*
        pathType: Prefix
        backend:
          service:
            name: app2-nginx-nodeport-service
```

**Path matching**:
- `/app1` → app1-nginx-nodeport-service
- `/app2` → app2-nginx-nodeport-service
- `/` or any other path → app3-nginx-nodeport-service (default)

### Service Configuration

Each application has a NodePort service:

**File**: `kube-manifests-ingress-externaldns/01-Nginx-App1-Deployment-and-NodePortService.yml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: app1-nginx-nodeport-service
  labels:
    app: app1-nginx
  annotations:
    # Service-level health check path
    alb.ingress.kubernetes.io/healthcheck-path: /app1/index.html
spec:
  type: NodePort
  selector:
    app: app1-nginx
  ports:
  - port: 80
    targetPort: 80
```

**Important**: When using multiple services with a shared ALB, set service-level health check paths.

## Features

### 1. Multiple DNS Names per Ingress

Create multiple Route53 records for the same ALB:

```yaml
annotations:
  external-dns.alpha.kubernetes.io/hostname: |
    app.example.com,
    www.example.com,
    api.example.com,
    service.example.com
```

All names point to the same ALB with the same routing rules.

### 2. SSL/TLS Termination

**HTTPS at load balancer**:
- ACM certificate attached to ALB
- TLS termination at ALB (not at pods)
- HTTP to HTTPS automatic redirect
- Reduced pod CPU usage

**Certificate options**:
```yaml
# Single domain certificate
alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:xxx:certificate/xxx

# Wildcard certificate (*.example.com)
# Covers: app1.example.com, app2.example.com, etc.
```

### 3. Path-Based Routing

Route different paths to different services:

```
/app1/* → Service1 → Pods1
/app2/* → Service2 → Pods2
/api/*  → Service3 → Pods3
/*      → Service4 → Pods4 (default)
```

### 4. Automatic DNS Management

**Creation**:
- Deploy Ingress → DNS records created automatically

**Updates**:
- ALB changes → DNS records updated automatically

**Deletion**:
- Delete Ingress → DNS records deleted automatically

### 5. Health Checks

**Ingress-level health checks**:
```yaml
alb.ingress.kubernetes.io/healthcheck-protocol: HTTP
alb.ingress.kubernetes.io/healthcheck-interval-seconds: '15'
```

**Service-level health checks** (required for multiple services):
```yaml
# In Service annotation
alb.ingress.kubernetes.io/healthcheck-path: /app1/health
```

### 6. Cross-Application Load Balancing

**Single ALB for multiple applications**:
- Cost optimization (one ALB instead of multiple)
- Centralized SSL/TLS management
- Simplified DNS management
- Easier security group rules

## Troubleshooting

### Issue: DNS Records Not Created

**Symptoms**: Ingress created but no Route53 records

**Solutions**:

1. Check ExternalDNS logs:
```bash
kubectl logs -n default deployment/external-dns --tail=50 | grep -i error
```

2. Verify Ingress has EXTERNAL-IP (ALB DNS):
```bash
kubectl get ingress ingress-externaldns-demo
# ADDRESS column should show ALB DNS name
```

3. Check annotation syntax:
```bash
kubectl get ingress ingress-externaldns-demo -o yaml | grep external-dns
```

4. Verify hostname format (no spaces around commas):
```yaml
# Correct
external-dns.alpha.kubernetes.io/hostname: app1.com, app2.com

# Or
external-dns.alpha.kubernetes.io/hostname: app1.com,app2.com
```

### Issue: ALB Not Created

**Symptoms**: Ingress resource created but no ALB

**Solutions**:

1. Check AWS Load Balancer Controller logs:
```bash
kubectl logs -n kube-system deployment/aws-load-balancer-controller --tail=100
```

2. Verify IngressClass:
```bash
kubectl get ingressclass my-aws-ingress-class
```

3. Check Ingress events:
```bash
kubectl describe ingress ingress-externaldns-demo
```

4. Verify AWS LBC has permissions:
```bash
kubectl get sa -n kube-system aws-load-balancer-controller -o yaml
```

### Issue: SSL Certificate Not Attached

**Symptoms**: ALB created but HTTPS listener missing or certificate error

**Solutions**:

1. Verify certificate ARN is correct:
```bash
aws acm describe-certificate \
  --certificate-arn <arn> \
  --region us-east-1
```

2. Check certificate status:
```bash
aws acm describe-certificate \
  --certificate-arn <arn> \
  --query 'Certificate.Status'
# Must be: ISSUED
```

3. Verify certificate region matches ALB region:
```bash
# Certificate and ALB MUST be in same region
```

4. Check certificate covers the domain:
```bash
# For dnstest901.rezaops.com
# Certificate must cover: rezaops.com or *.rezaops.com
```

### Issue: HTTP Not Redirecting to HTTPS

**Symptoms**: HTTP requests work but don't redirect to HTTPS

**Solutions**:

1. Verify ssl-redirect annotation:
```bash
kubectl get ingress ingress-externaldns-demo -o yaml | grep ssl-redirect
```

2. Check listeners in AWS Console:
```bash
# Both listeners should exist:
# - HTTP:80 (with redirect rule)
# - HTTPS:443 (with forward rule)
```

3. Test redirect manually:
```bash
curl -I http://dnstest901.rezaops.com/app1
# Should return: HTTP/1.1 301 Moved Permanently
# Location: https://...
```

### Issue: Path Routing Not Working

**Symptoms**: All paths route to same service or return 404

**Solutions**:

1. Check Ingress rules:
```bash
kubectl get ingress ingress-externaldns-demo -o yaml
```

2. Verify path order (specific before generic):
```yaml
# Correct order
- path: /app1      # Specific
- path: /app2      # Specific
defaultBackend:    # Generic (catch-all)
```

3. Test each path:
```bash
curl https://dnstest901.rezaops.com/app1 | grep app1
curl https://dnstest901.rezaops.com/app2 | grep app2
curl https://dnstest901.rezaops.com/ | grep app3
```

4. Check ALB rules in AWS Console:
   - EC2 → Load Balancers → Listeners → View/edit rules
   - Verify path-based routing rules exist

### Issue: Health Checks Failing

**Symptoms**: Targets unhealthy in ALB target groups

**Solutions**:

1. Check service-level health check paths:
```bash
kubectl get svc app1-nginx-nodeport-service -o yaml | grep healthcheck-path
```

2. Test health check endpoint:
```bash
# Port forward to pod
kubectl port-forward pod/<pod-name> 8080:80

# Test health check path
curl http://localhost:8080/app1/index.html
```

3. Verify health check settings in ALB:
```bash
aws elbv2 describe-target-health \
  --target-group-arn <tg-arn>
```

### Issue: Multiple DNS Records Created

**Symptoms**: More DNS records than expected

**Solutions**:

1. Check if multiple ExternalDNS instances are running:
```bash
kubectl get pods -A | grep external-dns
```

2. Verify ownership:
```bash
# Check TXT records for ownership
aws route53 list-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --query "ResourceRecordSets[?Type=='TXT']"
```

3. Use txtOwnerId to prevent conflicts:
```yaml
# In ExternalDNS Helm values
set {
  name  = "txtOwnerId"
  value = "my-cluster"
}
```

## Best Practices

### 1. Use Wildcard SSL Certificates

```bash
# Request wildcard certificate
aws acm request-certificate \
  --domain-name "*.example.com" \
  --validation-method DNS
```

Benefits:
- Covers all subdomains
- Single certificate for multiple apps
- Easier management

### 2. Configure Service-Level Health Checks

```yaml
# MUST set when using multiple services
annotations:
  alb.ingress.kubernetes.io/healthcheck-path: /app1/health
```

### 3. Use Meaningful DNS Names

```yaml
# Environment-based
external-dns.alpha.kubernetes.io/hostname: api-prod.example.com

# Purpose-based
external-dns.alpha.kubernetes.io/hostname: checkout.example.com,payment.example.com
```

### 4. Implement Proper Path Order

```yaml
# Most specific first
- path: /api/v2/users
- path: /api/v2
- path: /api
# Least specific (catch-all) last
defaultBackend: ...
```

### 5. Set Appropriate TTLs

```yaml
annotations:
  external-dns.alpha.kubernetes.io/ttl: "60"   # Fast changes
  # or
  external-dns.alpha.kubernetes.io/ttl: "300"  # Standard
```

### 6. Enable SSL Redirect

```yaml
# Always redirect HTTP to HTTPS in production
alb.ingress.kubernetes.io/ssl-redirect: '443'
```

### 7. Monitor and Alert

**CloudWatch alarms**:
- Unhealthy target count
- HTTP 5xx errors
- Target response time

**ExternalDNS monitoring**:
```bash
# Regular log checks
kubectl logs -n default deployment/external-dns | grep -i error
```

### 8. Use Ingress Groups for Multiple Ingresses

```yaml
# Share single ALB across multiple Ingress resources
annotations:
  alb.ingress.kubernetes.io/group.name: shared-alb
  alb.ingress.kubernetes.io/group.order: '10'
```

### 9. Document DNS Mappings

Keep track of:
- Which DNS names map to which applications
- Certificate coverage
- Health check endpoints
- Routing rules
