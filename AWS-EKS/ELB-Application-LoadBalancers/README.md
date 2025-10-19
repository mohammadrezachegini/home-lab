# AWS EKS - Application Load Balancer (ALB) Ingress Patterns

## Overview

This project provides comprehensive implementations of AWS Application Load Balancer (ALB) Ingress patterns for Amazon EKS clusters using the AWS Load Balancer Controller. It demonstrates various ALB Ingress configurations including basic routing, SSL/TLS termination, path-based routing, host-based routing, target type configurations, and advanced features like Ingress Groups and ExternalDNS integration.

The AWS Load Balancer Controller manages Kubernetes Ingress resources and provisions AWS Application Load Balancers automatically, providing a powerful way to expose HTTP/HTTPS applications running in EKS clusters.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet Gateway                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│         Application Load Balancer (ALB)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Listener:80  │  │ Listener:443 │  │  ACM Cert    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘      │
│         │                 │                                  │
│  ┌──────▼────────────────▼───────┐                          │
│  │    Target Groups (IP/Instance) │                          │
│  └──────────────────────────────┘                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  EKS Cluster                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AWS Load Balancer Controller                          │ │
│  │  (Watches Ingress Resources)                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ NodePort/    │  │ NodePort/    │  │ NodePort/    │     │
│  │ ClusterIP    │  │ ClusterIP    │  │ ClusterIP    │     │
│  │ Service      │  │ Service      │  │ Service      │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │               │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐     │
│  │ App1 Pods    │  │ App2 Pods    │  │ App3 Pods    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

### Key Components

1. **AWS Load Balancer Controller**: Kubernetes controller that manages AWS Application Load Balancers for Ingress resources
2. **Ingress Resources**: Kubernetes objects that define routing rules and ALB configurations via annotations
3. **Target Groups**: ALB components that route traffic to pods (IP mode) or nodes (Instance mode)
4. **ExternalDNS**: Automatically creates Route53 DNS records for Ingress resources
5. **ACM Certificates**: AWS Certificate Manager certificates for SSL/TLS termination

## Prerequisites

### Required Components

1. **Amazon EKS Cluster** (v1.21+)
   ```bash
   eksctl create cluster --name=eksdemo1 \
     --region=us-east-1 \
     --zones=us-east-1a,us-east-1b \
     --without-nodegroup
   ```

2. **AWS Load Balancer Controller** installed on the cluster
   - IAM OIDC Provider configured
   - IAM Policy for AWS Load Balancer Controller
   - IAM Service Account with proper permissions

3. **kubectl** configured to access your EKS cluster
   ```bash
   aws eks update-kubeconfig --name eksdemo1 --region us-east-1
   ```

4. **ExternalDNS** (Optional - for automatic DNS management)
   - IAM Role with Route53 permissions
   - Hosted Zone in Route53

5. **ACM Certificate** (for SSL/TLS examples)
   - Valid SSL certificate in AWS Certificate Manager
   - Certificate ARN

### IAM Permissions

The AWS Load Balancer Controller requires permissions to:
- Create/Delete/Modify Application Load Balancers
- Manage Target Groups
- Configure Security Groups
- Update ALB listeners and rules
- Access EC2 and EKS resources

## Project Structure

```
ELB-Application-LoadBalancers/
├── README.md
├── Load-Balancer-Controller-Install/          # LBC installation manifests
│   ├── iam-policy/
│   ├── service-account/
│   └── controller/
│
├── ALB-Ingress-Basics/                         # Basic ALB Ingress patterns
│   ├── kube-manifests-default-backend/         # Default backend configuration
│   │   ├── 01-Nginx-App1-Deployment-and-NodePortService.yml
│   │   └── 02-ALB-Ingress-Basic.yml
│   └── kube-manifests-rules/                   # Ingress with path rules
│       ├── 01-Nginx-App1-Deployment-and-NodePortService.yml
│       └── 02-ALB-Ingress-Basic.yml
│
├── ALB-Ingress-ContextPath-Based-Routing/      # Path-based routing (/app1, /app2)
│   └── kube-manifests/
│
├── NameBasedVirtualHost-Routing/               # Host-based routing
│   └── kube-manifests/
│
├── Ingress-TargetType-IP/                      # IP target type (direct pod routing)
│   └── kube-manifests/
│       ├── 01-03-Nginx-Apps-Deployment-and-ClusterIPService.yml
│       └── 04-ALB-Ingress-target-type-ip.yml
│
├── ALB-Ingress-SSL/                            # SSL/TLS with ACM certificates
│   └── kube-manifests/
│
├── ALB-Ingress-SSL-Redirect/                   # HTTP to HTTPS redirect
│   └── kube-manifests/
│
├── Ingress-SSL-Discovery-host/                 # Certificate discovery by host
│   └── kube-manifests/
│       └── 04-ALB-Ingress-CertDiscovery-host.yml
│
├── Ingress-SSL-Discovery-tls/                  # Certificate discovery by TLS spec
│   └── kube-manifests/
│
├── IngressGroups/                              # Multiple Ingresses sharing one ALB
│   └── kube-manifests/
│       ├── app1/
│       │   ├── 01-Nginx-App1-Deployment-and-NodePortService.yml
│       │   └── 02-App1-Ingress.yml
│       ├── app2/
│       │   ├── 01-Nginx-App2-Deployment-and-NodePortService.yml
│       │   └── 02-App2-Ingress.yml
│       └── app3/
│           ├── 01-Nginx-App3-Deployment-and-NodePortService.yml
│           └── 03-App3-Ingress-default-backend.yml
│
├── Ingress-Internal-LB/                        # Internal ALB (private subnets)
│   └── kube-manifests/
│
├── Deploy-ExternalDNS-on-EKS/                  # ExternalDNS setup
│   └── kube-manifests/
│       └── 01-Deploy-ExternalDNS.yml
│
├── Use-ExternalDNS-for-k8s-Ingress/            # ExternalDNS with Ingress
│   └── kube-manifests/
│
└── Use-ExternalDNS-for-k8s-Service/            # ExternalDNS with Services
    └── kube-manifests/
```

## Usage

### 1. Basic ALB Ingress with Default Backend

Deploy an Ingress with a default backend that handles all traffic:

```bash
# Deploy application and service
kubectl apply -f ALB-Ingress-Basics/kube-manifests-default-backend/01-Nginx-App1-Deployment-and-NodePortService.yml

# Deploy Ingress
kubectl apply -f ALB-Ingress-Basics/kube-manifests-default-backend/02-ALB-Ingress-Basic.yml

# Verify Ingress
kubectl get ingress ingress-nginxapp1

# Get ALB DNS name
kubectl get ingress ingress-nginxapp1 -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

### 2. Path-Based Routing

Route traffic based on URL paths (/app1, /app2, /app3):

```bash
# Deploy all applications
kubectl apply -f ALB-Ingress-ContextPath-Based-Routing/kube-manifests/

# Test different paths
curl http://<ALB-DNS>/app1/index.html
curl http://<ALB-DNS>/app2/index.html
curl http://<ALB-DNS>/app3/index.html
```

### 3. Host-Based Routing (Name-Based Virtual Hosts)

Route traffic based on hostname:

```bash
# Deploy applications and Ingress
kubectl apply -f NameBasedVirtualHost-Routing/kube-manifests/

# Test with different hostnames
curl http://app1.example.com
curl http://app2.example.com
```

### 4. Target Type: IP (Direct Pod Routing)

Use IP target type for direct pod routing (recommended for Fargate):

```bash
# Deploy applications with ClusterIP services
kubectl apply -f Ingress-TargetType-IP/kube-manifests/

# The ALB will route directly to pod IPs
kubectl get ingress ingress-target-type-ip-demo
```

**Key differences:**
- **Instance mode**: ALB -> NodePort -> kube-proxy -> Pods (default)
- **IP mode**: ALB -> Pod IPs directly (more efficient, required for Fargate)

### 5. SSL/TLS Configuration

#### Basic SSL with ACM Certificate

```bash
# Update certificate ARN in manifest
# Edit: ALB-Ingress-SSL/kube-manifests/ingress.yml
# Set: alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:...

# Deploy with SSL
kubectl apply -f ALB-Ingress-SSL/kube-manifests/

# Access via HTTPS
curl https://<ALB-DNS>
```

#### SSL Redirect (HTTP to HTTPS)

```bash
# Deploy with SSL redirect
kubectl apply -f ALB-Ingress-SSL-Redirect/kube-manifests/

# HTTP requests are automatically redirected to HTTPS
curl -I http://<ALB-DNS>  # Returns 301 redirect
```

#### Certificate Discovery by Host

Automatically discover ACM certificates based on hostname:

```bash
# Deploy Ingress with host-based cert discovery
kubectl apply -f Ingress-SSL-Discovery-host/kube-manifests/04-ALB-Ingress-CertDiscovery-host.yml

# ALB controller automatically finds matching ACM certificate
# Based on the hosts defined in the Ingress rules
```

### 6. Ingress Groups

Share a single ALB across multiple Ingress resources to reduce costs:

```bash
# Deploy all applications
kubectl apply -f IngressGroups/kube-manifests/app1/
kubectl apply -f IngressGroups/kube-manifests/app2/
kubectl apply -f IngressGroups/kube-manifests/app3/

# All three Ingresses share the same ALB
kubectl get ingress

# Verify they share the same ALB
kubectl get ingress -o jsonpath='{.items[*].status.loadBalancer.ingress[0].hostname}'
```

### 7. Internal ALB

Create an internal ALB for private workloads:

```bash
# Deploy internal Ingress
kubectl apply -f Ingress-Internal-LB/kube-manifests/

# ALB is created in private subnets
# Only accessible from within VPC
```

### 8. ExternalDNS Integration

Automatically create Route53 DNS records:

```bash
# Deploy ExternalDNS
kubectl apply -f Deploy-ExternalDNS-on-EKS/kube-manifests/01-Deploy-ExternalDNS.yml

# Deploy Ingress with ExternalDNS annotation
kubectl apply -f Use-ExternalDNS-for-k8s-Ingress/kube-manifests/

# Route53 record is automatically created
# Access application via custom domain
curl https://myapp.example.com
```

## Configuration

### Essential ALB Ingress Annotations

#### Core Settings

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  annotations:
    # Load balancer name
    alb.ingress.kubernetes.io/load-balancer-name: my-alb

    # Scheme: internet-facing or internal
    alb.ingress.kubernetes.io/scheme: internet-facing

    # Target type: instance (default) or ip
    alb.ingress.kubernetes.io/target-type: ip

    # Ingress class (preferred over annotation)
spec:
  ingressClassName: my-aws-ingress-class
```

#### Health Check Configuration

```yaml
annotations:
  # Health check protocol
  alb.ingress.kubernetes.io/healthcheck-protocol: HTTP

  # Health check port
  alb.ingress.kubernetes.io/healthcheck-port: traffic-port

  # Health check path
  alb.ingress.kubernetes.io/healthcheck-path: /health

  # Health check intervals
  alb.ingress.kubernetes.io/healthcheck-interval-seconds: '15'
  alb.ingress.kubernetes.io/healthcheck-timeout-seconds: '5'

  # Success codes (comma-separated or range)
  alb.ingress.kubernetes.io/success-codes: '200'
  # Or: alb.ingress.kubernetes.io/success-codes: '200,201,202'
  # Or: alb.ingress.kubernetes.io/success-codes: '200-299'

  # Threshold counts
  alb.ingress.kubernetes.io/healthy-threshold-count: '2'
  alb.ingress.kubernetes.io/unhealthy-threshold-count: '2'
```

#### SSL/TLS Configuration

```yaml
annotations:
  # Listen ports (HTTP and HTTPS)
  alb.ingress.kubernetes.io/listen-ports: '[{"HTTP":80},{"HTTPS":443}]'

  # ACM Certificate ARN
  alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:region:account:certificate/xxx

  # SSL policy
  alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS-1-2-2017-01

  # SSL redirect (redirect HTTP to HTTPS)
  alb.ingress.kubernetes.io/ssl-redirect: '443'

spec:
  # TLS specification for certificate discovery
  tls:
  - hosts:
    - "*.example.com"
```

#### Ingress Groups

```yaml
annotations:
  # Group name (all Ingresses with same name share an ALB)
  alb.ingress.kubernetes.io/group.name: myapps.web

  # Group order (determines rule priority, lower = higher priority)
  alb.ingress.kubernetes.io/group.order: '10'
```

#### ExternalDNS Integration

```yaml
annotations:
  # Hostname for Route53 record
  external-dns.alpha.kubernetes.io/hostname: myapp.example.com

  # Multiple hostnames
  external-dns.alpha.kubernetes.io/hostname: myapp.example.com,app.example.com
```

#### Advanced Annotations

```yaml
annotations:
  # Subnet selection
  alb.ingress.kubernetes.io/subnets: subnet-xxx,subnet-yyy

  # Security groups
  alb.ingress.kubernetes.io/security-groups: sg-xxx,sg-yyy

  # IP address type
  alb.ingress.kubernetes.io/ip-address-type: ipv4  # or dualstack

  # WAF ACL
  alb.ingress.kubernetes.io/wafv2-acl-arn: arn:aws:wafv2:region:account:...

  # Tags
  alb.ingress.kubernetes.io/tags: Environment=production,Team=platform

  # Backend protocol
  alb.ingress.kubernetes.io/backend-protocol: HTTP  # or HTTPS

  # Target node labels (for instance mode)
  alb.ingress.kubernetes.io/target-node-labels: role=web
```

### Complete Example: Production-Ready Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: production-app-ingress
  annotations:
    # Load Balancer Configuration
    alb.ingress.kubernetes.io/load-balancer-name: production-app-alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip

    # Health Checks
    alb.ingress.kubernetes.io/healthcheck-protocol: HTTP
    alb.ingress.kubernetes.io/healthcheck-port: traffic-port
    alb.ingress.kubernetes.io/healthcheck-path: /health
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: '15'
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: '5'
    alb.ingress.kubernetes.io/success-codes: '200'
    alb.ingress.kubernetes.io/healthy-threshold-count: '2'
    alb.ingress.kubernetes.io/unhealthy-threshold-count: '2'

    # SSL/TLS
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP":80},{"HTTPS":443}]'
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:123456789:certificate/xxx
    alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS-1-2-2017-01
    alb.ingress.kubernetes.io/ssl-redirect: '443'

    # DNS
    external-dns.alpha.kubernetes.io/hostname: api.example.com

    # Tags
    alb.ingress.kubernetes.io/tags: Environment=production,Application=api,ManagedBy=kubernetes

spec:
  ingressClassName: my-aws-ingress-class
  tls:
  - hosts:
    - api.example.com
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /api/v1
        pathType: Prefix
        backend:
          service:
            name: api-v1-service
            port:
              number: 80
      - path: /api/v2
        pathType: Prefix
        backend:
          service:
            name: api-v2-service
            port:
              number: 80
```

## Features

### 1. Multiple Routing Strategies

- **Default Backend**: Single service for all traffic
- **Path-Based**: Route based on URL path (/app1, /app2)
- **Host-Based**: Route based on hostname (app1.example.com, app2.example.com)
- **Combined**: Mix of path and host-based routing

### 2. Target Types

- **Instance Mode**: Traffic flows through NodePort (ALB -> Node -> Pod)
- **IP Mode**: Direct pod routing (ALB -> Pod IP)
  - More efficient
  - Required for AWS Fargate
  - Supports ClusterIP services

### 3. SSL/TLS Support

- ACM certificate integration
- HTTP to HTTPS redirect
- Multiple certificates per ALB
- Automatic certificate discovery
- SSL policy configuration

### 4. Ingress Groups

- Multiple Ingress resources sharing a single ALB
- Cost optimization
- Rule priority control
- Cross-namespace support

### 5. DNS Integration

- Automatic Route53 record creation via ExternalDNS
- Support for multiple hostnames
- TXT record ownership tracking
- Automatic cleanup on deletion

### 6. Advanced Features

- WAF integration
- Access logging
- Custom security groups
- Subnet selection
- AWS resource tagging
- IP address type (IPv4/Dualstack)

## Troubleshooting

### Ingress Not Creating ALB

**Symptoms**: Ingress created but no ALB appears in AWS console

**Possible Causes**:
1. AWS Load Balancer Controller not running
   ```bash
   kubectl get pods -n kube-system | grep aws-load-balancer-controller
   ```

2. Incorrect IngressClass
   ```bash
   kubectl get ingressclass
   kubectl describe ingress <ingress-name>
   ```

3. IAM permissions missing
   ```bash
   kubectl logs -n kube-system deployment/aws-load-balancer-controller
   ```

**Solution**:
```bash
# Check controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Verify IngressClass
kubectl get ingress <ingress-name> -o yaml | grep ingressClassName

# Check controller events
kubectl describe ingress <ingress-name>
```

### 502 Bad Gateway Errors

**Possible Causes**:
1. Health check failing
2. Security group blocking traffic
3. Service selector mismatch
4. Pod not ready

**Solution**:
```bash
# Check target group health in AWS console
# Or check via kubectl
kubectl describe ingress <ingress-name>

# Verify service endpoints
kubectl get endpoints <service-name>

# Check pod health
kubectl get pods -l app=<app-label>
kubectl describe pod <pod-name>

# Verify health check path is accessible
kubectl port-forward <pod-name> 8080:80
curl http://localhost:8080/health
```

### Certificate Issues

**Symptoms**: SSL errors, certificate not found

**Solution**:
```bash
# Verify certificate ARN is correct
aws acm list-certificates --region us-east-1

# Check certificate status
aws acm describe-certificate --certificate-arn <arn>

# Ensure certificate is in the same region as ALB
# For certificate discovery, verify host matches certificate domain

# Check Ingress annotations
kubectl get ingress <ingress-name> -o yaml
```

### Target Type IP Issues

**Symptoms**: No targets registered in target group

**Possible Causes**:
1. Using NodePort service instead of ClusterIP
2. CNI plugin doesn't support IP mode
3. Insufficient IP addresses in subnet

**Solution**:
```bash
# Verify service type
kubectl get service <service-name> -o yaml | grep type
# Should be: ClusterIP (not NodePort)

# Check AWS LBC logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Verify pod IPs
kubectl get pods -o wide

# Check target group in AWS console
# Targets should show pod IPs
```

### ExternalDNS Not Creating Records

**Solution**:
```bash
# Check ExternalDNS logs
kubectl logs deployment/external-dns

# Verify IAM permissions for Route53
kubectl describe sa external-dns

# Check annotation syntax
kubectl get ingress <ingress-name> -o yaml | grep external-dns

# Verify hosted zone exists
aws route53 list-hosted-zones
```

### Ingress Groups Not Working

**Solution**:
```bash
# Verify all Ingresses have same group name
kubectl get ingress -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.metadata.annotations.alb\.ingress\.kubernetes\.io/group\.name}{"\n"}{end}'

# Check group order (avoid duplicates)
kubectl get ingress -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.metadata.annotations.alb\.ingress\.kubernetes\.io/group\.order}{"\n"}{end}'

# Verify IngressClassName matches across all Ingresses
kubectl get ingress -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.ingressClassName}{"\n"}{end}'
```

### Common Annotation Errors

```bash
# Invalid annotation value
# Error: annotations must be strings
# Wrong:
alb.ingress.kubernetes.io/ssl-redirect: 443
# Correct:
alb.ingress.kubernetes.io/ssl-redirect: '443'

# Wrong:
alb.ingress.kubernetes.io/listen-ports: [{"HTTP":80}]
# Correct:
alb.ingress.kubernetes.io/listen-ports: '[{"HTTP":80}]'
```

## Best Practices

### 1. Use IngressClass Instead of Annotation

**Deprecated**:
```yaml
annotations:
  kubernetes.io/ingress.class: alb
```

**Recommended**:
```yaml
spec:
  ingressClassName: my-aws-ingress-class
```

### 2. Use IP Target Type for Better Performance

```yaml
annotations:
  alb.ingress.kubernetes.io/target-type: ip
```

Benefits:
- More efficient routing (no NodePort overhead)
- Required for Fargate
- Better for high-traffic applications
- Preserves source IP

**Note**: Requires ClusterIP service, not NodePort

### 3. Implement Proper Health Checks

```yaml
annotations:
  alb.ingress.kubernetes.io/healthcheck-path: /health
  alb.ingress.kubernetes.io/healthcheck-interval-seconds: '15'
  alb.ingress.kubernetes.io/healthcheck-timeout-seconds: '5'
  alb.ingress.kubernetes.io/success-codes: '200'
```

Ensure your application has a health endpoint that returns 200.

### 4. Use Ingress Groups to Reduce Costs

Instead of creating one ALB per Ingress, share ALBs:

```yaml
annotations:
  alb.ingress.kubernetes.io/group.name: shared-alb
  alb.ingress.kubernetes.io/group.order: '10'
```

Cost savings: Multiple applications share the same ALB.

### 5. Enable SSL/TLS for Production

Always use HTTPS in production:

```yaml
annotations:
  alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443},{"HTTP":80}]'
  alb.ingress.kubernetes.io/ssl-redirect: '443'
  alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:...
```

### 6. Use Certificate Discovery for Multiple Domains

Instead of hardcoding certificate ARN:

```yaml
spec:
  tls:
  - hosts:
    - "*.example.com"
```

ALB controller automatically finds matching ACM certificate.

### 7. Tag Resources for Cost Tracking

```yaml
annotations:
  alb.ingress.kubernetes.io/tags: Environment=production,Team=platform,CostCenter=engineering
```

### 8. Use ExternalDNS for Automatic DNS Management

```yaml
annotations:
  external-dns.alpha.kubernetes.io/hostname: myapp.example.com
```

Automatically creates/updates/deletes Route53 records.

### 9. Implement Security Best Practices

```yaml
annotations:
  # Restrict source IPs
  alb.ingress.kubernetes.io/security-groups: sg-restrictive

  # Enable WAF
  alb.ingress.kubernetes.io/wafv2-acl-arn: arn:aws:wafv2:...

  # Use latest SSL policy
  alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS-1-2-2017-01
```

### 10. Path Ordering Matters

When using path-based routing, order matters:

```yaml
spec:
  rules:
  - http:
      paths:
      # More specific paths first
      - path: /api/v1/users
        pathType: Prefix
        backend: ...
      - path: /api/v1
        pathType: Prefix
        backend: ...
      # Catch-all last
      - path: /
        pathType: Prefix
        backend: ...
```

### 11. Monitor ALB Metrics

Enable and monitor CloudWatch metrics:
- TargetResponseTime
- RequestCount
- HTTPCode_Target_4XX_Count
- HTTPCode_Target_5XX_Count
- HealthyHostCount
- UnHealthyHostCount

### 12. Use Subnet Tags for Auto-Discovery

Tag subnets for automatic discovery:
- Public subnets: `kubernetes.io/role/elb=1`
- Private subnets: `kubernetes.io/role/internal-elb=1`
---

### Common kubectl Commands

```bash
# List all Ingresses
kubectl get ingress

# Describe Ingress (shows events and ALB details)
kubectl describe ingress <ingress-name>

# Get ALB DNS name
kubectl get ingress <ingress-name> -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Check AWS LBC logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Check ExternalDNS logs
kubectl logs deployment/external-dns

# Delete Ingress (deletes ALB)
kubectl delete ingress <ingress-name>
```

### AWS CLI Commands

```bash
# List ALBs
aws elbv2 describe-load-balancers

# List target groups
aws elbv2 describe-target-groups

# Describe target health
aws elbv2 describe-target-health --target-group-arn <arn>

# List ACM certificates
aws acm list-certificates --region us-east-1

# List Route53 records
aws route53 list-resource-record-sets --hosted-zone-id <zone-id>
```
