# EKS Ingress SSL Discovery via TLS

## Overview

This project demonstrates automatic SSL/TLS certificate discovery using the TLS specification in Kubernetes Ingress on Amazon EKS. This pattern uses the standard Kubernetes `spec.tls` field to trigger certificate discovery, allowing AWS Load Balancer Controller to automatically find and attach matching ACM certificates based on the hostnames specified in the TLS configuration.

The implementation features:
- Certificate discovery via Kubernetes TLS spec (standard approach)
- Support for wildcard hostname patterns in TLS spec
- Automatic ACM certificate matching
- No explicit certificate ARN required
- Path-based routing with automatic SSL
- External DNS integration for Route53 management

This is the Kubernetes-native approach to certificate discovery, using the standard `spec.tls` field rather than relying on host-based discovery, making it more portable and following Kubernetes best practices.

## Architecture

### Components

1. **TLS Specification**: Standard Kubernetes field for SSL configuration
2. **AWS Load Balancer Controller**: Discovers ACM certificates via TLS spec
3. **AWS Certificate Manager (ACM)**: Stores SSL/TLS certificates
4. **Certificate Matching Logic**: Matches TLS hosts to ACM certificates
5. **External DNS**: Manages Route53 DNS records
6. **Application Load Balancer**: Routes with discovered SSL certificates

### Traffic Flow

```
User Request
    |
    | DNS Resolution (Route53)
    v
ALB (HTTPS:443)
    |
    | SSL Certificate Auto-Discovered via TLS Spec
    | Certificate: *.rezaops.com (from ACM)
    |
    v
Path-Based Routing
    ├─ /app1 -> app1-service -> app1-pods
    ├─ /app2 -> app2-service -> app2-pods
    └─ /* (default) -> app3-service -> app3-pods
```

### Certificate Discovery Flow (TLS Spec)

```
1. Ingress defines spec.tls.hosts
2. LBC reads TLS specification
3. LBC queries ACM for matching certificates
4. Certificates matched to TLS hostnames
5. Best matching certificate selected
6. Certificate attached to ALB HTTPS listener
```

### TLS Spec vs Host-Based Discovery

```
TLS Spec Discovery (This Project):
spec:
  tls:
  - hosts:
    - "*.rezaops.com"  # <-- Triggers certificate discovery
  rules:
  - http:  # <-- No host in rules required
      paths:
      - path: /app1

Host-Based Discovery (Alternative):
spec:
  rules:
  - host: app.rezaops.com  # <-- Triggers discovery from host
    http:
      paths:
      - path: /
```

## Prerequisites

### Required Tools
- AWS CLI configured with appropriate credentials
- kubectl (v1.21+)
- Terraform (v1.0+)
- Domain registered in Route53

### AWS Resources
- Existing EKS cluster with worker nodes
- ACM certificates (wildcard or specific) validated in ACM
- Route53 hosted zone for your domain
- AWS Load Balancer Controller installed
- External DNS controller installed
- IAM permissions for ACM and Route53

### Certificate Requirements
- ACM certificates in "Issued" status
- Certificates in same region as ALB
- Wildcard certificate (*.domain.com) recommended for flexibility
- Certificate domain matches TLS spec hosts

### Knowledge Requirements
- Kubernetes Ingress TLS specification
- ACM certificate management
- Wildcard certificate patterns
- DNS and SSL/TLS concepts

## Project Structure

```
EKS-Ingress-SSLDiscovery-TLS/
├── ekscluster-terraform-manifests/     # EKS cluster infrastructure
│   ├── c1-versions.tf                  # Terraform and provider versions
│   ├── c2-*.tf                         # Variables and local values
│   ├── c3-*.tf                         # VPC configuration
│   ├── c4-*.tf                         # Bastion host setup
│   ├── c5-*.tf                         # EKS cluster and node groups
│   ├── c6-*.tf                         # OIDC provider
│   ├── c7-*.tf                         # Kubernetes provider
│   └── c8-c11-*.tf                     # IAM users and RBAC
│
├── lbc-install-terraform-manifests/    # Load Balancer Controller
│   ├── c1-versions.tf                  # Terraform versions
│   ├── c2-remote-state-datasource.tf   # EKS cluster state reference
│   ├── c3-*.tf                         # Variables and locals
│   ├── c4-*.tf                         # LBC IAM, Helm installation
│   └── c5-*.tf                         # Kubernetes provider, IngressClass
│
├── externaldns-install-terraform-manifests/  # External DNS
│   ├── c1-versions.tf                  # Terraform versions
│   ├── c2-remote-state-datasource.tf   # Reference to EKS state
│   ├── c3-*.tf                         # Variables and locals
│   └── c4-*.tf                         # External DNS IAM and Helm
│
├── ingress-SSLDiscoveryTLS-terraform-manifests/  # TLS discovery config
│   ├── c1-versions.tf                  # Terraform versions
│   ├── c2-remote-state-datasource.tf   # Reference to cluster state
│   ├── c3-providers.tf                 # Kubernetes provider
│   ├── c4-kubernetes-app1-deployment.tf    # App1 deployment
│   ├── c5-kubernetes-app2-deployment.tf    # App2 deployment
│   ├── c5-kubernetes-app3-deployment.tf    # App3 deployment
│   ├── c7-kubernetes-app1-nodeport-service.tf  # App1 service
│   ├── c8-kubernetes-app2-nodeport-service.tf  # App2 service
│   ├── c9-kubernetes-app3-nodeport-service.tf  # App3 service
│   ├── c10-kubernetes-ingress-service.tf       # Ingress with TLS spec
│   ├── c11-acm-certificate.tf          # ACM cert creation
│   └── listen-ports/listen-ports.json  # ALB listener configuration
│
└── kube-manifests-SSLDiscoveryTLS/     # Pure Kubernetes manifests
    ├── 01-Nginx-App1-Deployment-and-NodePortService.yml
    ├── 02-Nginx-App2-Deployment-and-NodePortService.yml
    ├── 03-Nginx-App3-Deployment-and-NodePortService.yml
    └── 04-ALB-Ingress-CertDiscovery-tls.yml
```

## Usage

### Step 1: Create Wildcard ACM Certificate

```bash
# Create wildcard certificate
aws acm request-certificate \
  --domain-name "*.rezaops.com" \
  --validation-method DNS \
  --region us-east-1

# Get certificate ARN
CERT_ARN=$(aws acm list-certificates --region us-east-1 \
  --query "CertificateSummaryList[?DomainName=='*.rezaops.com'].CertificateArn" \
  --output text)

echo "Certificate ARN: $CERT_ARN"

# Follow DNS validation steps in ACM console
# or use AWS CLI to add validation records to Route53

# Wait for certificate to be issued
aws acm wait certificate-validated --certificate-arn $CERT_ARN --region us-east-1

# Verify certificate is issued
aws acm describe-certificate --certificate-arn $CERT_ARN \
  --region us-east-1 --query 'Certificate.Status'
# Should return: "ISSUED"
```

### Step 2: Deploy EKS Cluster (if not exists)

```bash
cd ekscluster-terraform-manifests/
terraform init
terraform apply -auto-approve

aws eks update-kubeconfig --region <region> --name <cluster-name>
```

### Step 3: Install AWS Load Balancer Controller

```bash
cd ../lbc-install-terraform-manifests/
terraform init
terraform apply -auto-approve

# Verify LBC installation
kubectl get deployment -n kube-system aws-load-balancer-controller

# Verify LBC has ACM permissions
kubectl describe sa -n kube-system aws-load-balancer-controller
```

### Step 4: Install External DNS

```bash
cd ../externaldns-install-terraform-manifests/
terraform init
terraform apply -auto-approve

kubectl get deployment external-dns
kubectl logs deployment/external-dns -f
```

### Step 5: Deploy Ingress with TLS Discovery

```bash
cd ../ingress-SSLDiscoveryTLS-terraform-manifests/

# Review c10-kubernetes-ingress-service.tf
# Notice the spec.tls section with wildcard host

terraform init
terraform apply -auto-approve

# Verify ingress
kubectl get ingress ingress-certdiscoverytls-demo
kubectl describe ingress ingress-certdiscoverytls-demo
```

### Step 6: Verify TLS Configuration

```bash
# Check TLS spec in ingress
kubectl get ingress ingress-certdiscoverytls-demo -o yaml

# Should show:
# spec:
#   tls:
#   - hosts:
#     - "*.rezaops.com"

# Verify ALB listener has certificate
aws elbv2 describe-listeners \
  --load-balancer-arn <alb-arn> \
  --query 'Listeners[?Protocol==`HTTPS`].Certificates'

# Check LBC logs for certificate discovery
kubectl logs -n kube-system deployment/aws-load-balancer-controller | grep -i certificate
```

### Step 7: Test Certificate Discovery

```bash
# Get ALB DNS name
ALB_DNS=$(kubectl get ingress ingress-certdiscoverytls-demo \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo "ALB DNS: $ALB_DNS"

# Wait for DNS propagation (External DNS)
# Check External DNS logs
kubectl logs deployment/external-dns -f

# Test with curl (any subdomain works with wildcard cert)
curl https://certdiscovery-tls-102.rezaops.com/app1
curl https://certdiscovery-tls-102.rezaops.com/app2
curl https://certdiscovery-tls-102.rezaops.com/

# Verify certificate
echo | openssl s_client -connect certdiscovery-tls-102.rezaops.com:443 \
  -servername certdiscovery-tls-102.rezaops.com 2>/dev/null | \
  openssl x509 -noout -subject -issuer -dates

# Test in browser
open https://certdiscovery-tls-102.rezaops.com/app1
```

### Step 8: Test Path-Based Routing

```bash
# Test different paths (all use same discovered certificate)
curl https://certdiscovery-tls-102.rezaops.com/app1
# Expected: Response from app1

curl https://certdiscovery-tls-102.rezaops.com/app2
# Expected: Response from app2

curl https://certdiscovery-tls-102.rezaops.com/anything
# Expected: Response from app3 (default backend)

# Test HTTP to HTTPS redirect
curl -I http://certdiscovery-tls-102.rezaops.com/app1
# Expected: 301/302 redirect to HTTPS
```

### Step 9: Monitor and Verify

```bash
# Check ingress events
kubectl get events --field-selector involvedObject.name=ingress-certdiscoverytls-demo

# Verify External DNS created records
aws route53 list-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --query "ResourceRecordSets[?Name=='certdiscovery-tls-102.rezaops.com.']"

# Check ALB in AWS Console
# - Listeners should show HTTPS:443 with certificate
# - Rules should show path-based routing
```

### Step 10: Clean Up

```bash
cd ingress-SSLDiscoveryTLS-terraform-manifests/
terraform destroy -auto-approve

cd ../externaldns-install-terraform-manifests/
terraform destroy -auto-approve

cd ../lbc-install-terraform-manifests/
terraform destroy -auto-approve

cd ../ekscluster-terraform-manifests/
terraform destroy -auto-approve
```

## Configuration

### Ingress with TLS Certificate Discovery

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-certdiscoverytls-demo
  annotations:
    # Load Balancer Configuration
    alb.ingress.kubernetes.io/load-balancer-name: certdiscoverytls-ingress
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

    # NO CERTIFICATE ARN NEEDED!
    # Certificate discovered via spec.tls.hosts

    # SSL Redirect
    alb.ingress.kubernetes.io/ssl-redirect: '443'

    # External DNS
    external-dns.alpha.kubernetes.io/hostname: certdiscovery-tls-102.rezaops.com

spec:
  ingressClassName: my-aws-ingress-class
  defaultBackend:
    service:
      name: app3-nginx-nodeport-service
      port:
        number: 80

  # TLS configuration - triggers certificate discovery
  tls:
  - hosts:
    - "*.rezaops.com"  # Wildcard - matches any subdomain

  # Rules don't require host specification when using TLS spec
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
  - http:
      paths:
      - path: /app2
        pathType: Prefix
        backend:
          service:
            name: app2-nginx-nodeport-service
            port:
              number: 80
```

### TLS Spec Patterns

```yaml
# Pattern 1: Wildcard Certificate
tls:
- hosts:
  - "*.domain.com"  # Matches any subdomain

# Pattern 2: Specific Domains
tls:
- hosts:
  - "app1.domain.com"
  - "app2.domain.com"
  - "app3.domain.com"

# Pattern 3: Multiple Wildcard Domains
tls:
- hosts:
  - "*.domain.com"
  - "*.example.com"

# Pattern 4: Mixed Wildcard and Specific
tls:
- hosts:
  - "*.domain.com"
  - "specific.domain.com"

# Note: secretName is ignored by ALB Ingress Controller
# ACM certificates are used instead
```

### Certificate Matching Logic

```yaml
# TLS Spec in Ingress
tls:
- hosts:
  - "*.rezaops.com"

# LBC searches ACM for certificates matching:
# 1. Exact match: *.rezaops.com (preferred)
# 2. Specific match: app.rezaops.com (if wildcard not found)
# 3. Fallback to manual ARN if specified

# ACM Certificate: *.rezaops.com
# Ingress TLS Host: "*.rezaops.com"
# Result: ✓ Perfect match

# ACM Certificate: *.rezaops.com
# Actual request: app.rezaops.com
# Result: ✓ Wildcard covers specific subdomain
```

### Differences: TLS Spec vs Host-Based Discovery

| Feature | TLS Spec Discovery | Host-Based Discovery |
|---------|-------------------|---------------------|
| **Configuration Location** | `spec.tls.hosts` | `spec.rules[].host` |
| **Wildcard Support** | ✓ Yes | Limited |
| **Path-Based Routing** | ✓ Compatible | Requires hosts in rules |
| **Kubernetes Native** | ✓ Standard field | Custom annotation |
| **Portability** | ✓ More portable | AWS-specific |
| **Use Case** | Path-based + SSL | Host-based + SSL |

## Features

### TLS Specification Discovery
- Uses standard Kubernetes `spec.tls` field
- Wildcard hostname support in TLS spec
- Automatic ACM certificate matching
- No certificate ARN required
- More portable across Ingress controllers

### Path-Based Routing with SSL
- Combine path routing with SSL
- No host headers required in rules
- Single certificate for all paths
- Flexible routing patterns

### Wildcard Certificate Support
- Efficient wildcard pattern matching
- Single certificate for multiple subdomains
- Reduced certificate management overhead
- Flexible subdomain handling

### Kubernetes Standard Compliance
- Uses standard Kubernetes Ingress spec
- Compatible with other Ingress controllers (conceptually)
- Better for GitOps and IaC workflows
- Follows Kubernetes best practices

### Automatic Certificate Selection
- Intelligent certificate matching
- Wildcard to specific domain mapping
- Best match selection algorithm
- Fallback to manual ARN if needed

## Troubleshooting

### Certificate Not Discovered from TLS Spec

**Issue**: ALB created without certificate despite TLS spec

**Solutions**:
```bash
# Verify TLS spec exists in ingress
kubectl get ingress ingress-certdiscoverytls-demo -o yaml | grep -A5 tls

# Check certificates in ACM
aws acm list-certificates --region <alb-region>

# Ensure certificate matches TLS hosts
# TLS Host: "*.rezaops.com"
# ACM Cert: "*.rezaops.com" or specific subdomain

# Verify certificate is in "ISSUED" status
aws acm describe-certificate --certificate-arn <cert-arn> \
  --query 'Certificate.Status'

# Check LBC logs for TLS processing
kubectl logs -n kube-system deployment/aws-load-balancer-controller | grep -i tls

# Verify LBC has ACM permissions
kubectl describe sa -n kube-system aws-load-balancer-controller
```

### Wildcard Certificate Not Matching

**Issue**: Wildcard cert exists but not used

**Solutions**:
```bash
# Verify wildcard certificate format in ACM
# Should be: *.domain.com (with asterisk and dot)
aws acm describe-certificate --certificate-arn <cert-arn> \
  --query 'Certificate.DomainName'

# Verify TLS spec uses correct wildcard format
kubectl get ingress -o yaml | grep -A2 tls:
# Should show: - "*.domain.com"

# Ensure certificate domain matches TLS spec exactly
# ACM: *.rezaops.com
# TLS: "*.rezaops.com"
# Match: ✓

# ACM: *.rezaops.com
# TLS: "*.example.com"
# Match: ✗

# Check LBC version (older versions may have issues)
kubectl get deployment -n kube-system aws-load-balancer-controller \
  -o jsonpath='{.spec.template.spec.containers[0].image}'
```

### TLS Spec Ignored

**Issue**: TLS spec present but LBC not processing it

**Solutions**:
```bash
# Ensure listen-ports includes HTTPS
kubectl get ingress -o yaml | grep listen-ports
# Should show: '[{"HTTPS":443}, {"HTTP":80}]'

# Verify IngressClass is correct
kubectl get ingress -o jsonpath='{.spec.ingressClassName}'

# Check if certificate ARN annotation is overriding TLS spec
kubectl get ingress -o yaml | grep certificate-arn
# If present, it takes precedence over TLS spec

# Review LBC controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller \
  | grep -i "tls\|certificate"

# Verify Ingress is reconciled
kubectl describe ingress ingress-certdiscoverytls-demo | tail -20
```

### Multiple Certificates Match TLS Spec

**Issue**: Multiple ACM certificates match, wrong one selected

**Solutions**:
```bash
# List all certificates in region
aws acm list-certificates --region <region>

# LBC selection priority:
# 1. Exact match (*.domain.com matches *.domain.com)
# 2. Most specific match
# 3. First alphabetically (if tied)

# To force specific certificate, use annotation:
alb.ingress.kubernetes.io/certificate-arn: <specific-arn>

# This overrides TLS spec discovery

# Delete unwanted certificates from ACM
aws acm delete-certificate --certificate-arn <unwanted-cert-arn>

# Check which certificate was actually selected
aws elbv2 describe-listeners --load-balancer-arn <alb-arn> \
  --query 'Listeners[?Protocol==`HTTPS`].Certificates'
```

### secretName in TLS Spec

**Issue**: Added secretName but certificate still not working

**Solutions**:
```bash
# For AWS ALB Ingress Controller:
# secretName is IGNORED - ACM certificates are used instead

# This is correct (secretName optional/ignored):
tls:
- hosts:
  - "*.domain.com"
  secretName: my-tls-secret  # <-- Ignored by AWS LBC

# Don't create Kubernetes TLS secrets for AWS ALB
# ACM handles certificate storage and management

# If you need to use Kubernetes secrets:
# Use a different Ingress controller (nginx, traefik, etc.)

# For AWS ALB, just specify hosts in TLS spec
tls:
- hosts:
  - "*.domain.com"
  # No secretName needed
```

### Path Routing Not Working with TLS

**Issue**: TLS works but path routing fails

**Solutions**:
```bash
# Verify rules are correctly defined
kubectl get ingress -o yaml | grep -A10 rules

# Path routing works without hosts in rules when using TLS spec:
rules:
- http:  # <-- No host needed
    paths:
    - path: /app1
      ...

# Ensure paths are correctly specified
- path: /app1  # Correct
  pathType: Prefix

# Test path routing directly
curl -k https://<alb-dns>/app1
curl -k https://<alb-dns>/app2

# Check ALB listener rules in AWS Console
# Should show path-based rules
```

## Best Practices

### TLS Configuration
1. **Use Wildcards**: Prefer wildcard certificates for flexibility (*.domain.com)
2. **Standard Spec**: Use `spec.tls` over custom annotations for portability
3. **No Secrets**: Don't create Kubernetes secrets for ACM certificates
4. **Document Patterns**: Document your wildcard patterns and coverage
5. **Validation**: Always use DNS validation for automation

### Certificate Management
1. **Regional Certificates**: Create certificates in each AWS region you use
2. **Naming Convention**: Use consistent naming for ACM certificates
3. **Tagging**: Tag ACM certificates for organization and cost allocation
4. **Monitoring**: Set up expiration alerts (though ACM auto-renews)
5. **Cleanup**: Remove unused certificates regularly

### Ingress Design
1. **Path-Based First**: Use TLS spec discovery for path-based routing
2. **Host-Based Alternative**: Use host-based discovery for virtual hosting
3. **Combine Carefully**: Can combine paths and hosts, but keep simple
4. **Default Backend**: Always configure default backend
5. **Health Checks**: Configure appropriate health check paths

### Security
1. **TLS 1.2+**: Use modern TLS policies
2. **HTTPS Only**: Always redirect HTTP to HTTPS
3. **Certificate Rotation**: Plan for certificate rotation (ACM handles this)
4. **Wildcard Scope**: Understand wildcard certificate coverage
5. **Domain Validation**: Maintain DNS validation records

### Operational Excellence
1. **Monitoring**: Monitor certificate discovery in LBC logs
2. **Testing**: Test certificate changes in non-production first
3. **Documentation**: Document TLS spec patterns and certificate mappings
4. **GitOps**: Store ingress configurations in Git
5. **Rollback Plan**: Have manual certificate ARN ready as fallback

### Performance
1. **Certificate Caching**: ALB caches certificate validation
2. **TLS 1.3**: Use latest TLS version for better performance
3. **Session Resumption**: Enabled by default on ALB
4. **Keep-Alive**: Use HTTP keep-alive connections
