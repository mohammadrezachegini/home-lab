# EKS NLB with TLS Termination and ExternalDNS

## Overview

This project demonstrates how to configure AWS Network Load Balancer (NLB) with **TLS termination** and **automated DNS management** using ExternalDNS. This advanced configuration provides encrypted communication at the load balancer level while automatically managing Route53 DNS records, creating a production-ready setup for secure TCP/TLS applications.

TLS termination at NLB enables:
- **SSL/TLS offloading**: Decrypt traffic at load balancer, reducing pod CPU load
- **Certificate management**: Centralized certificate management via ACM
- **Secure communication**: End-to-end encryption from client to NLB
- **Compliance**: Meet security and compliance requirements
- **Automated DNS**: ExternalDNS automatically creates/updates Route53 records

This pattern is ideal for:
- **Secure APIs**: REST APIs, GraphQL, gRPC over TLS
- **Database connections**: PostgreSQL, MySQL with SSL/TLS
- **Message queues**: Kafka, RabbitMQ with encryption
- **WebSocket applications**: Secure WebSocket connections
- **Non-HTTP protocols**: Any TCP-based protocol requiring encryption

## Architecture

```
Internet
    |
    v
Route53 (nlbdns101.rezaops.com)
    |  [Managed by ExternalDNS]
    v
AWS Network Load Balancer
    |
    +-- Listener: 443 (HTTPS) --[TLS Termination]
    |       |                     [ACM Certificate]
    |       v
    |   Target Group (Instance mode)
    |       |
    +-- Listener: 80 (HTTP)
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
       Port 80 (HTTP)
```

### TLS Flow

```
Client (HTTPS) → NLB:443 [TLS Termination with ACM Cert] → Node:NodePort (HTTP) → Pod:80 (HTTP)
Client (HTTP)  → NLB:80 → Node:NodePort (HTTP) → Pod:80 (HTTP)
```

### Key Features

1. **TLS Termination**: NLB decrypts TLS traffic using ACM certificate
2. **Dual Listeners**: Both HTTP (80) and HTTPS (443) supported
3. **ExternalDNS**: Automatic Route53 record creation/deletion
4. **Certificate Management**: AWS Certificate Manager integration
5. **Security Policy**: Configurable TLS negotiation policies

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.0
- kubectl configured to interact with your EKS cluster
- AWS Load Balancer Controller installed
- ExternalDNS installed and configured
- **ACM certificate** in the same region as NLB
- Domain configured in Route53 (public or private hosted zone)
- Understanding of TLS/SSL and DNS concepts

## Project Structure

```
EKS-NLB-TLS-externaldns/
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
│   ├── c4-03-externaldns-install.tf         # ExternalDNS Helm chart
│   └── ...
├── nlb-tls-extdns-terraform-manifests/      # Terraform-managed NLB resources
│   └── ...
└── kube-manifests-nlb-tls-externaldns/      # Kubernetes manifests
    ├── 01-Nginx-App3-Deployment.yml
    └── 02-LBC-NLB-LoadBalancer-Service.yml
```

## Usage

### Step 1: Create ACM Certificate

Before deploying, create an ACM certificate for your domain:

```bash
# Request a certificate (DNS validation recommended)
aws acm request-certificate \
  --domain-name nlbdns101.rezaops.com \
  --validation-method DNS \
  --region us-east-1

# Note the certificate ARN for later use
```

Validate the certificate using DNS or email validation method. Wait for status to become `ISSUED`:

```bash
# Check certificate status
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:xxx:certificate/xxx \
  --region us-east-1 \
  --query 'Certificate.Status'
```

### Step 2: Deploy EKS Cluster

```bash
cd ekscluster-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

### Step 3: Install AWS Load Balancer Controller

```bash
cd ../lbc-install-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

### Step 4: Install ExternalDNS

```bash
cd ../externaldns-install-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

Verify ExternalDNS is running:
```bash
kubectl get deployment external-dns -n default
kubectl logs deployment/external-dns -n default
```

### Step 5: Update Service Manifest with Certificate ARN

Edit the service manifest to include your ACM certificate ARN:

```bash
cd ../kube-manifests-nlb-tls-externaldns

# Edit the service file
vim 02-LBC-NLB-LoadBalancer-Service.yml

# Update this line with your certificate ARN:
# service.beta.kubernetes.io/aws-load-balancer-ssl-cert: arn:aws:acm:us-east-1:xxx:certificate/xxx
```

### Step 6: Deploy Application with NLB TLS

You can deploy using either Terraform or kubectl:

#### Option A: Using kubectl

```bash
# Deploy application
kubectl apply -f 01-Nginx-App3-Deployment.yml

# Deploy NLB service with TLS
kubectl apply -f 02-LBC-NLB-LoadBalancer-Service.yml
```

#### Option B: Using Terraform

```bash
cd ../nlb-tls-extdns-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

### Step 7: Verify Deployment

```bash
# Check deployment and pods
kubectl get deployment app3-nginx-deployment
kubectl get pods -l app=app3-nginx

# Check service
kubectl get service extdns-tls-lbc-network-lb

# Get NLB DNS name
NLB_DNS=$(kubectl get service extdns-tls-lbc-network-lb -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "NLB DNS: $NLB_DNS"
```

### Step 8: Verify NLB and Listeners

```bash
# Verify NLB in AWS Console
# 1. Go to EC2 → Load Balancers
# 2. Find: extdns-tls-lbc-network-lb
# 3. Check Listeners tab - should see both port 80 and 443
# 4. Port 443 should have SSL certificate attached

# Using AWS CLI
aws elbv2 describe-load-balancers \
  --names extdns-tls-lbc-network-lb

# Check listeners
aws elbv2 describe-listeners \
  --load-balancer-arn <nlb-arn>
```

### Step 9: Verify DNS Record Creation

ExternalDNS will automatically create a Route53 record:

```bash
# Wait for DNS propagation (may take 1-2 minutes)
watch -n 5 'nslookup nlbdns101.rezaops.com'

# Verify DNS record in Route53
aws route53 list-resource-record-sets \
  --hosted-zone-id <hosted-zone-id> \
  --query "ResourceRecordSets[?Name=='nlbdns101.rezaops.com.']"
```

### Step 10: Test Access

```bash
# Test HTTPS access (port 443)
curl https://nlbdns101.rezaops.com/

# Test HTTP access (port 80)
curl http://nlbdns101.rezaops.com/

# Verify certificate
curl -vI https://nlbdns101.rezaops.com/

# Or use OpenSSL to check certificate
openssl s_client -connect nlbdns101.rezaops.com:443 -servername nlbdns101.rezaops.com
```

## Configuration

### NLB Service with TLS and ExternalDNS

**File**: `kube-manifests-nlb-tls-externaldns/02-LBC-NLB-LoadBalancer-Service.yml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: extdns-tls-lbc-network-lb
  annotations:
    # Traffic Routing
    service.beta.kubernetes.io/aws-load-balancer-name: extdns-tls-lbc-network-lb
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

    # TLS Configuration - THE KEY ANNOTATIONS
    service.beta.kubernetes.io/aws-load-balancer-ssl-cert: arn:aws:acm:us-east-1:180789647333:certificate/d86de939-8ffd-410f-adce-0ce1f5be6e0d
    service.beta.kubernetes.io/aws-load-balancer-ssl-ports: "443"
    service.beta.kubernetes.io/aws-load-balancer-ssl-negotiation-policy: ELBSecurityPolicy-TLS13-1-2-2021-06
    service.beta.kubernetes.io/aws-load-balancer-backend-protocol: tcp

    # External DNS - For creating a Record Set in Route53
    external-dns.alpha.kubernetes.io/hostname: nlbdns101.rezaops.com

spec:
  type: LoadBalancer
  selector:
    app: app3-nginx
  ports:
  - name: http
    port: 80
    targetPort: 80
  - name: https
    port: 443
    targetPort: 80  # Backend pods run HTTP, TLS terminated at NLB
```

### Key TLS Annotations Explained

| Annotation | Purpose | Example Value |
|------------|---------|---------------|
| `service.beta.kubernetes.io/aws-load-balancer-ssl-cert` | ACM certificate ARN for TLS | `arn:aws:acm:region:account:certificate/id` |
| `service.beta.kubernetes.io/aws-load-balancer-ssl-ports` | Ports to enable TLS on | `443` or `443,8443` |
| `service.beta.kubernetes.io/aws-load-balancer-ssl-negotiation-policy` | TLS security policy | `ELBSecurityPolicy-TLS13-1-2-2021-06` |
| `service.beta.kubernetes.io/aws-load-balancer-backend-protocol` | Protocol to backend (after TLS termination) | `tcp`, `http`, `https` |
| `external-dns.alpha.kubernetes.io/hostname` | DNS name for Route53 | `myapp.example.com` |

### TLS Security Policies

AWS provides several predefined security policies. Choose based on your security requirements:

**Modern (Recommended for new applications)**:
```yaml
service.beta.kubernetes.io/aws-load-balancer-ssl-negotiation-policy: ELBSecurityPolicy-TLS13-1-2-2021-06
```
- TLS 1.3 and TLS 1.2
- Strong cipher suites only
- Best security

**Backward Compatible**:
```yaml
service.beta.kubernetes.io/aws-load-balancer-ssl-negotiation-policy: ELBSecurityPolicy-2016-08
```
- TLS 1.0, 1.1, 1.2
- Wider client compatibility
- Less secure

**Full list of policies**:
```bash
aws elb describe-load-balancer-policies \
  --query 'PolicyDescriptions[?PolicyTypeName==`SSLNegotiationPolicyType`].PolicyName'
```

### Port Configuration

The service exposes two ports:

```yaml
ports:
- name: http
  port: 80        # NLB listener port
  targetPort: 80  # Pod port
- name: https
  port: 443       # NLB listener port (TLS termination)
  targetPort: 80  # Pod port (HTTP - TLS already terminated)
```

**Important**: The HTTPS listener (443) terminates TLS and forwards HTTP to pods on port 80.

### ExternalDNS Configuration

The ExternalDNS annotation triggers automatic DNS record creation:

```yaml
annotations:
  external-dns.alpha.kubernetes.io/hostname: nlbdns101.rezaops.com
```

ExternalDNS will:
1. Watch for services with this annotation
2. Extract the NLB DNS name from service status
3. Create an ALIAS record in Route53 pointing to the NLB
4. Update the record if NLB changes
5. Delete the record when service is deleted

### Multiple DNS Names

You can specify multiple hostnames:

```yaml
annotations:
  external-dns.alpha.kubernetes.io/hostname: nlbdns101.rezaops.com,nlbdns102.rezaops.com,api.example.com
```

## Features

### 1. TLS Termination at NLB

**Benefits**:
- **Offload encryption**: Reduce pod CPU usage
- **Centralized certificate management**: Manage certs in ACM
- **Compliance**: Meet encryption requirements
- **Simplified pods**: Pods don't need TLS configuration

**TLS Flow**:
```
Client --[HTTPS/TLS]--> NLB --[TLS Termination]--> Node --[HTTP]--> Pod
```

### 2. AWS Certificate Manager Integration

**Automatic renewal**:
- ACM automatically renews certificates
- No manual certificate management
- Zero downtime renewals

**Certificate validation**:
- DNS validation (recommended)
- Email validation
- Supports wildcard certificates

### 3. Dual Protocol Support

**HTTP and HTTPS simultaneously**:
```yaml
ports:
- port: 80   # HTTP
- port: 443  # HTTPS
```

Use cases:
- Health check endpoints on HTTP
- Application traffic on HTTPS
- Gradual migration from HTTP to HTTPS

### 4. Automated DNS Management

**ExternalDNS benefits**:
- No manual Route53 updates
- Automatic cleanup on deletion
- Supports multiple hosted zones
- Works with private hosted zones

**Supported record types**:
- A records (for static IPs)
- CNAME records
- ALIAS records (for AWS resources like NLB)

### 5. Security Policies

**Modern TLS versions**:
- TLS 1.3 (latest, most secure)
- TLS 1.2 (widely supported)
- Disable older versions (TLS 1.0, 1.1)

**Strong cipher suites**:
- Forward secrecy
- No weak algorithms
- Compliance with PCI DSS, HIPAA

## Troubleshooting

### Issue: Certificate Not Attached to NLB

**Symptoms**: HTTPS listener not created or shows no certificate

**Solutions**:

1. Verify certificate exists and is ISSUED:
```bash
aws acm describe-certificate \
  --certificate-arn <cert-arn> \
  --region us-east-1
```

2. Check certificate is in the same region as NLB:
```bash
# NLB and certificate MUST be in the same region
aws elbv2 describe-load-balancers --names extdns-tls-lbc-network-lb --query 'LoadBalancers[0].LoadBalancerArn'
```

3. Verify certificate ARN in service annotation:
```bash
kubectl get service extdns-tls-lbc-network-lb -o yaml | grep ssl-cert
```

4. Check AWS Load Balancer Controller logs:
```bash
kubectl logs -n kube-system deployment/aws-load-balancer-controller | grep -i certificate
```

### Issue: DNS Record Not Created

**Symptoms**: ExternalDNS doesn't create Route53 record

**Solutions**:

1. Check ExternalDNS logs:
```bash
kubectl logs deployment/external-dns -n default --tail=50
```

2. Verify annotation syntax:
```bash
kubectl get service extdns-tls-lbc-network-lb -o yaml | grep hostname
```

3. Check hosted zone exists:
```bash
aws route53 list-hosted-zones --query 'HostedZones[?Name==`rezaops.com.`]'
```

4. Verify ExternalDNS IAM permissions:
```bash
# ExternalDNS needs permissions for:
# - route53:ListHostedZones
# - route53:ListResourceRecordSets
# - route53:ChangeResourceRecordSets

kubectl describe sa external-dns -n default
```

5. Check domain ownership:
```bash
# Ensure domain is properly configured in Route53
dig nlbdns101.rezaops.com
```

### Issue: TLS Handshake Failures

**Symptoms**: SSL/TLS errors when connecting

**Solutions**:

1. Test TLS connection:
```bash
openssl s_client -connect nlbdns101.rezaops.com:443 -servername nlbdns101.rezaops.com

# Look for:
# - Certificate chain
# - Cipher suite negotiated
# - TLS version
```

2. Verify security policy:
```bash
kubectl get service extdns-tls-lbc-network-lb -o yaml | grep ssl-negotiation-policy
```

3. Check client TLS version compatibility:
```bash
# Try connecting with specific TLS version
openssl s_client -connect nlbdns101.rezaops.com:443 -tls1_2
openssl s_client -connect nlbdns101.rezaops.com:443 -tls1_3
```

4. Use more permissive policy temporarily:
```yaml
service.beta.kubernetes.io/aws-load-balancer-ssl-negotiation-policy: ELBSecurityPolicy-2016-08
```

### Issue: HTTP Traffic Not Working

**Symptoms**: HTTPS works but HTTP (port 80) fails

**Solutions**:

1. Verify both ports are defined:
```bash
kubectl get service extdns-tls-lbc-network-lb -o yaml | grep -A 5 ports:
```

2. Check listeners in AWS Console:
```bash
aws elbv2 describe-listeners \
  --load-balancer-arn <nlb-arn> \
  --query 'Listeners[*].[Port,Protocol]'
```

3. Verify security groups allow port 80

### Issue: Backend Connection Failures

**Symptoms**: NLB listener created but connections fail

**Solutions**:

1. Verify backend protocol:
```bash
kubectl get service extdns-tls-lbc-network-lb -o yaml | grep backend-protocol
```

2. Check target group health:
```bash
aws elbv2 describe-target-health \
  --target-group-arn <tg-arn>
```

3. Test backend directly:
```bash
NODE_PORT=$(kubectl get service extdns-tls-lbc-network-lb -o jsonpath='{.spec.ports[0].nodePort}')
curl http://<node-ip>:$NODE_PORT/
```

### Issue: Certificate Domain Mismatch

**Symptoms**: Certificate warning about domain mismatch

**Solutions**:

1. Verify certificate covers the domain:
```bash
aws acm describe-certificate \
  --certificate-arn <cert-arn> \
  --query 'Certificate.DomainName'
```

2. For wildcard certificates:
```bash
# Certificate: *.rezaops.com
# Will match: nlbdns101.rezaops.com, api.rezaops.com, etc.
# Won't match: sub.domain.rezaops.com
```

3. Request new certificate or add SANs:
```bash
aws acm request-certificate \
  --domain-name nlbdns101.rezaops.com \
  --subject-alternative-names nlbdns102.rezaops.com api.rezaops.com
```

### Issue: DNS Propagation Delays

**Symptoms**: DNS record created but not resolving

**Solutions**:

1. Check DNS from different locations:
```bash
# Use public DNS servers
dig @8.8.8.8 nlbdns101.rezaops.com
dig @1.1.1.1 nlbdns101.rezaops.com
```

2. Verify TTL settings:
```bash
aws route53 list-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --query "ResourceRecordSets[?Name=='nlbdns101.rezaops.com.'].TTL"
```

3. Clear local DNS cache:
```bash
# macOS
sudo dscacheutil -flushcache

# Linux
sudo systemd-resolve --flush-caches

# Windows
ipconfig /flushdns
```

## Best Practices

### 1. Certificate Management

**Use ACM for certificate lifecycle**:
- Automatic renewals (no manual intervention)
- Free certificates for AWS resources
- Integrated with AWS services

**Certificate best practices**:
```bash
# Use DNS validation (more reliable)
aws acm request-certificate \
  --domain-name nlbdns101.rezaops.com \
  --validation-method DNS

# Consider wildcard certificates
aws acm request-certificate \
  --domain-name "*.rezaops.com" \
  --validation-method DNS
```

**Monitor certificate expiration**:
```bash
# Set up CloudWatch alarm for expiring certificates
# (ACM auto-renews, but good to monitor)
```

### 2. TLS Security Policy Selection

**Choose appropriate policy**:
- **Production**: `ELBSecurityPolicy-TLS13-1-2-2021-06`
- **Legacy compatibility**: `ELBSecurityPolicy-2016-08`
- **Compliance requirements**: Check PCI DSS, HIPAA requirements

**Stay updated**:
```bash
# Review security policies annually
# AWS releases new policies with improved security
```

### 3. DNS Configuration

**Use meaningful DNS names**:
```yaml
# Environment-based
annotations:
  external-dns.alpha.kubernetes.io/hostname: api-prod.example.com

# Service-based
annotations:
  external-dns.alpha.kubernetes.io/hostname: payment-service.example.com
```

**Set appropriate TTLs**:
```yaml
# Lower TTL for frequently changing services (default: 300)
annotations:
  external-dns.alpha.kubernetes.io/ttl: "60"

# Higher TTL for stable services
annotations:
  external-dns.alpha.kubernetes.io/ttl: "3600"
```

### 4. Health Check Configuration

**Use HTTP health checks**:
```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-healthcheck-protocol: http
  service.beta.kubernetes.io/aws-load-balancer-healthcheck-path: /health
```

**Dedicated health endpoint**:
```yaml
# Application should expose /health endpoint
# Return 200 only when truly healthy
```

### 5. Port Strategy

**Separate HTTP and HTTPS**:
```yaml
ports:
- name: http
  port: 80
- name: https
  port: 443
```

**Or HTTPS only** (force encryption):
```yaml
ports:
- name: https
  port: 443
```

### 6. Monitoring and Logging

**Enable NLB access logs**:
```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-access-log-enabled: "true"
  service.beta.kubernetes.io/aws-load-balancer-access-log-s3-bucket-name: my-nlb-logs
  service.beta.kubernetes.io/aws-load-balancer-access-log-s3-bucket-prefix: prod-nlb
```

**Monitor CloudWatch metrics**:
- TargetTLSNegotiationErrorCount
- ClientTLSNegotiationErrorCount
- HealthyHostCount
- ProcessedBytes

**Set up alerts**:
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name nlb-tls-errors \
  --metric-name ClientTLSNegotiationErrorCount \
  --namespace AWS/NetworkELB \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

### 7. Security

**Restrict source IP ranges**:
```yaml
annotations:
  service.beta.kubernetes.io/load-balancer-source-ranges: 10.0.0.0/8,192.168.0.0/16
```

**Use latest TLS policies**:
```yaml
# Regularly update to latest security policies
service.beta.kubernetes.io/aws-load-balancer-ssl-negotiation-policy: ELBSecurityPolicy-TLS13-1-2-2021-06
```

**Enable deletion protection in production**:
```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-attributes: deletion_protection.enabled=true
```

### 8. Cost Optimization

**Consolidate services**:
```yaml
# Use multiple ports on single NLB instead of multiple NLBs
ports:
- port: 443
- port: 8443
- port: 9443
```

**Clean up unused resources**:
- Remove unused services
- Delete orphaned NLBs
- Clean up DNS records
