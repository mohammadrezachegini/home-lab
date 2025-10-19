# EKS Ingress SSL Discovery via Host

## Overview

This project demonstrates automatic SSL/TLS certificate discovery using host-based routing on Amazon EKS. Unlike manual certificate specification, this pattern leverages AWS Load Balancer Controller's ability to automatically discover and attach appropriate ACM certificates based on the hostnames defined in Ingress rules.

The implementation features:
- Automatic ACM certificate discovery based on host headers
- No explicit certificate ARN specification required
- Host-based routing with automatic SSL configuration
- Support for wildcard and specific domain certificates
- External DNS integration for automatic Route53 management
- HTTP to HTTPS automatic redirection

This pattern simplifies certificate management by eliminating the need to manually specify certificate ARNs in your Ingress manifests, making infrastructure more maintainable and reducing configuration errors.

## Architecture

### Components

1. **AWS Load Balancer Controller**: Discovers certificates from ACM automatically
2. **AWS Certificate Manager (ACM)**: Stores SSL/TLS certificates
3. **Certificate Discovery Logic**: Matches certificates to hostnames
4. **External DNS**: Manages Route53 DNS records
5. **Application Load Balancer**: Routes based on hosts with discovered SSL
6. **Multiple Backend Services**: Applications for different subdomains

### Traffic Flow

```
User Request (app102.rezaops.com)
    |
    | DNS Resolution (Route53)
    v
ALB (HTTPS:443)
    |
    | SSL Certificate Auto-Discovered
    | Certificate: *.rezaops.com (from ACM)
    |
    v
Host-Based Routing
    ├─ Host: app102.rezaops.com -> app1-service
    ├─ Host: app202.rezaops.com -> app2-service
    └─ Host: * (default) -> app3-service
```

### Certificate Discovery Flow

```
1. Ingress defines hosts (no certificate ARN)
2. LBC queries ACM for certificates in region
3. LBC matches certificates to ingress hostnames
4. Certificates automatically attached to ALB listeners
5. ALB presents appropriate certificate based on SNI
```

### How Certificate Matching Works

```
Ingress Host: app102.rezaops.com
    |
    v
ACM Certificate Search
    |
    ├─ Exact Match: app102.rezaops.com ✓ (Best match)
    ├─ Wildcard Match: *.rezaops.com ✓ (Fallback)
    └─ No Match: example.com ✗ (Ignored)
    |
    v
Selected: Most specific matching certificate
```

## Prerequisites

### Required Tools
- AWS CLI configured with appropriate credentials
- kubectl (v1.21+)
- Terraform (v1.0+)
- Domain registered and managed in Route53

### AWS Resources
- Existing EKS cluster with worker nodes
- ACM certificates (validated) for your domains
- Route53 hosted zone for your domain
- AWS Load Balancer Controller installed
- External DNS controller installed
- IAM permissions for ACM discovery

### Certificate Requirements
- ACM certificates must be in "Issued" status
- Certificates must be in the same region as ALB
- Certificates should cover the domains in ingress (wildcard or specific)
- At least one certificate matching each hostname

### Knowledge Requirements
- Understanding of DNS and SSL/TLS
- ACM certificate management
- SNI (Server Name Indication) concepts
- Kubernetes Ingress host rules

## Project Structure

```
EKS-Ingress-SSLDiscovery-Host/
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
├── ingress-SSLDiscoveryHost-terraform-manifests/  # SSL discovery config
│   ├── c1-versions.tf                  # Terraform versions
│   ├── c2-remote-state-datasource.tf   # Reference to cluster state
│   ├── c3-providers.tf                 # Kubernetes provider
│   ├── c4-kubernetes-app1-deployment.tf    # App1 deployment
│   ├── c5-kubernetes-app2-deployment.tf    # App2 deployment
│   ├── c5-kubernetes-app3-deployment.tf    # App3 deployment
│   ├── c7-kubernetes-app1-nodeport-service.tf  # App1 service
│   ├── c8-kubernetes-app2-nodeport-service.tf  # App2 service
│   ├── c9-kubernetes-app3-nodeport-service.tf  # App3 service
│   ├── c10-kubernetes-ingress-service.tf       # Ingress (no cert ARN!)
│   ├── c11-acm-certificate.tf          # ACM cert creation (optional)
│   └── listen-ports/listen-ports.json  # ALB listener configuration
│
└── kube-manifests-SSLDiscoveryHost/    # Pure Kubernetes manifests
    ├── 01-Nginx-App1-Deployment-and-NodePortService.yml
    ├── 02-Nginx-App2-Deployment-and-NodePortService.yml
    ├── 03-Nginx-App3-Deployment-and-NodePortService.yml
    └── 04-ALB-Ingress-CertDiscovery-host.yml
```

## Usage

### Step 1: Create ACM Certificates

```bash
# Create wildcard certificate for your domain
aws acm request-certificate \
  --domain-name "*.rezaops.com" \
  --validation-method DNS \
  --region us-east-1

# Or create specific certificates
aws acm request-certificate \
  --domain-name "app102.rezaops.com" \
  --subject-alternative-names "app202.rezaops.com" "default102.rezaops.com" \
  --validation-method DNS \
  --region us-east-1

# Validate the certificate (follow DNS validation steps)

# Wait for certificate to be issued
aws acm describe-certificate \
  --certificate-arn <cert-arn> \
  --query 'Certificate.Status'

# List all certificates to verify
aws acm list-certificates --region us-east-1
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

### Step 5: Deploy Ingress with SSL Discovery

```bash
cd ../ingress-SSLDiscoveryHost-terraform-manifests/

# Update c10-kubernetes-ingress-service.tf with your domain names
# Note: No certificate ARN needed!

terraform init
terraform apply -auto-approve

# Verify ingress
kubectl get ingress ingress-certdiscoveryhost-demo
kubectl describe ingress ingress-certdiscoveryhost-demo
```

### Step 6: Verify Certificate Discovery

```bash
# Check ALB configuration in AWS Console
# - Navigate to EC2 > Load Balancers
# - Find the ALB
# - Check Listeners > HTTPS:443
# - Verify certificate was automatically attached

# Check which certificate was selected
aws elbv2 describe-listeners \
  --load-balancer-arn <alb-arn> \
  --query 'Listeners[?Protocol==`HTTPS`].Certificates'

# Verify certificate matches your domain
aws acm describe-certificate \
  --certificate-arn <discovered-cert-arn>
```

### Step 7: Test Certificate Discovery

```bash
# Wait for DNS propagation (check External DNS logs)
kubectl logs deployment/external-dns -f

# Test HTTPS with different hosts
curl https://app102.rezaops.com/
curl https://app202.rezaops.com/
curl https://default102.rezaops.com/

# Verify certificate details
echo | openssl s_client -connect app102.rezaops.com:443 -servername app102.rezaops.com 2>/dev/null | openssl x509 -noout -subject -issuer

# Test in browser for visual confirmation
open https://app102.rezaops.com
open https://app202.rezaops.com
```

### Step 8: Verify SSL Redirect

```bash
# Test HTTP to HTTPS redirect
curl -I http://app102.rezaops.com/
# Expected: 301/302 redirect to HTTPS

# Test redirect with different hosts
curl -I http://app202.rezaops.com/
curl -I http://default102.rezaops.com/
```

### Step 9: Monitor Certificate Discovery

```bash
# Check LBC logs for certificate discovery
kubectl logs -n kube-system deployment/aws-load-balancer-controller | grep -i certificate

# Verify no certificate errors
kubectl logs -n kube-system deployment/aws-load-balancer-controller | grep -i error

# Check ingress events
kubectl get events --field-selector involvedObject.name=ingress-certdiscoveryhost-demo
```

### Step 10: Clean Up

```bash
cd ingress-SSLDiscoveryHost-terraform-manifests/
terraform destroy -auto-approve

cd ../externaldns-install-terraform-manifests/
terraform destroy -auto-approve

cd ../lbc-install-terraform-manifests/
terraform destroy -auto-approve

cd ../ekscluster-terraform-manifests/
terraform destroy -auto-approve
```

## Configuration

### Ingress with Certificate Discovery

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-certdiscoveryhost-demo
  annotations:
    # Load Balancer Configuration
    alb.ingress.kubernetes.io/load-balancer-name: certdiscoveryhost-ingress
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

    # NO CERTIFICATE ARN SPECIFIED!
    # Certificate will be auto-discovered based on hosts below
    # alb.ingress.kubernetes.io/certificate-arn: <-- NOT NEEDED

    # SSL Redirect
    alb.ingress.kubernetes.io/ssl-redirect: '443'

    # External DNS
    external-dns.alpha.kubernetes.io/hostname: default102.rezaops.com

spec:
  ingressClassName: my-aws-ingress-class
  defaultBackend:
    service:
      name: app3-nginx-nodeport-service
      port:
        number: 80

  # Hostnames trigger certificate discovery
  rules:
  - host: app102.rezaops.com  # Certificate discovered for this hostname
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app1-nginx-nodeport-service
            port:
              number: 80

  - host: app202.rezaops.com  # Certificate discovered for this hostname
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app2-nginx-nodeport-service
            port:
              number: 80
```

### Certificate Discovery Logic

The AWS Load Balancer Controller discovers certificates using this logic:

1. **Extract Hostnames**: Get all hosts from ingress rules
2. **Query ACM**: List all certificates in the region
3. **Match Certificates**: For each hostname, find matching certificates
4. **Priority Order**:
   - Exact match (app102.rezaops.com matches app102.rezaops.com)
   - Wildcard match (app102.rezaops.com matches *.rezaops.com)
   - Fallback to manual ARN if specified
5. **Select Best Match**: Use most specific certificate
6. **Attach to ALB**: Configure ALB listener with discovered certificates

### Certificate Matching Examples

```yaml
# Example 1: Wildcard Certificate
ACM Certificate: *.rezaops.com
Ingress Host: app102.rezaops.com
Result: ✓ Match (wildcard covers subdomain)

# Example 2: Exact Match
ACM Certificate: app102.rezaops.com
Ingress Host: app102.rezaops.com
Result: ✓ Match (exact match - preferred over wildcard)

# Example 3: No Match
ACM Certificate: *.example.com
Ingress Host: app102.rezaops.com
Result: ✗ No Match (different domain)

# Example 4: Multiple Certificates
ACM Cert 1: *.rezaops.com
ACM Cert 2: app102.rezaops.com
Ingress Host: app102.rezaops.com
Result: Cert 2 selected (exact match preferred)
```

### Required IAM Permissions for Certificate Discovery

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "acm:ListCertificates",
        "acm:DescribeCertificate"
      ],
      "Resource": "*"
    }
  ]
}
```

## Features

### Automatic Certificate Discovery
- No manual certificate ARN specification required
- Automatic matching based on hostnames
- Support for wildcard and specific certificates
- Dynamic certificate selection
- Reduces configuration errors

### Certificate Flexibility
- Multiple certificates support via SNI
- Wildcard certificate support
- Mixed certificate types (wildcard + specific)
- Automatic fallback to wildcard
- Per-host certificate selection

### Simplified Management
- Reduced configuration complexity
- Less error-prone than manual ARN management
- Easier certificate rotation (no ingress changes)
- Centralized certificate management in ACM
- Infrastructure-as-code friendly

### Host-Based Routing
- Multiple subdomains on single ALB
- Automatic SSL for each subdomain
- Default backend support
- External DNS integration

### Security
- Only validated certificates used
- Automatic certificate validation check
- TLS best practices enforced
- Certificate expiration warnings from ACM

## Troubleshooting

### Certificate Not Discovered

**Issue**: ALB created without SSL certificate

**Solutions**:
```bash
# Verify certificates exist in ACM
aws acm list-certificates --region <alb-region>

# Check certificate status (must be "ISSUED")
aws acm describe-certificate --certificate-arn <cert-arn>

# Ensure certificate matches ingress hostname
# For host: app102.rezaops.com
# Need certificate: app102.rezaops.com or *.rezaops.com

# Verify LBC has ACM permissions
kubectl describe sa -n kube-system aws-load-balancer-controller

# Check LBC logs for discovery errors
kubectl logs -n kube-system deployment/aws-load-balancer-controller | grep -i acm

# Verify ingress has host rules (required for discovery)
kubectl get ingress -o yaml | grep -A5 rules

# Certificate must be in same region as ALB
aws acm list-certificates --region us-east-1  # Match your region
```

### Wrong Certificate Selected

**Issue**: Unexpected certificate attached to ALB

**Solutions**:
```bash
# Check which certificate was selected
aws elbv2 describe-listeners \
  --load-balancer-arn <alb-arn> \
  --query 'Listeners[?Protocol==`HTTPS`].Certificates'

# List all matching certificates
aws acm list-certificates --region <region>

# LBC selects most specific match
# If you have both *.domain.com and app.domain.com,
# app.domain.com (exact) is preferred over *.domain.com (wildcard)

# To force specific certificate, use annotation:
# alb.ingress.kubernetes.io/certificate-arn: <specific-arn>

# Check certificate subject and SANs
aws acm describe-certificate --certificate-arn <arn> \
  --query 'Certificate.[DomainName,SubjectAlternativeNames]'
```

### Certificate Expired or Invalid

**Issue**: Browser shows expired certificate

**Solutions**:
```bash
# Check certificate expiration
aws acm describe-certificate --certificate-arn <cert-arn> \
  --query 'Certificate.NotAfter'

# ACM certificates auto-renew if DNS-validated
# Ensure DNS validation records still exist in Route53

# Check certificate status
aws acm describe-certificate --certificate-arn <cert-arn> \
  --query 'Certificate.Status'
# Should be "ISSUED", not "EXPIRED" or "INACTIVE"

# If certificate expired:
# 1. Request new certificate
# 2. Validate it
# 3. Delete old certificate
# 4. LBC will auto-discover new one (or update annotation)

# Force rediscovery by deleting and recreating ingress
kubectl delete ingress <ingress-name>
kubectl apply -f <ingress-manifest>
```

### No Host Rules Defined

**Issue**: Certificate discovery requires host rules

**Solutions**:
```bash
# Certificate discovery only works with host-based routing
# This WON'T trigger discovery:
spec:
  rules:
  - http:  # No host specified!
      paths:
      - path: /
        ...

# This WILL trigger discovery:
spec:
  rules:
  - host: app.domain.com  # Host specified
    http:
      paths:
      - path: /
        ...

# If using path-based routing without hosts,
# must manually specify certificate ARN:
alb.ingress.kubernetes.io/certificate-arn: <cert-arn>
```

### Multiple Certificates for Same Host

**Issue**: Multiple ACM certificates match hostname

**Solutions**:
```bash
# List all certificates matching domain
aws acm list-certificates --region <region>

# LBC uses the following priority:
# 1. Exact match (most specific)
# 2. Wildcard match
# 3. Manual ARN annotation

# To control selection, specify ARN explicitly:
alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:...

# Or delete unwanted certificates from ACM

# Check certificate tags if needed
aws acm list-tags-for-certificate --certificate-arn <arn>
```

### Permissions Issues

**Issue**: LBC cannot list or describe ACM certificates

**Solutions**:
```bash
# Verify LBC IAM role has ACM permissions
aws iam get-role-policy \
  --role-name <lbc-iam-role> \
  --policy-name <policy-name>

# Required permissions:
# - acm:ListCertificates
# - acm:DescribeCertificate

# Check service account annotation
kubectl get sa -n kube-system aws-load-balancer-controller -o yaml

# Verify OIDC provider
aws iam list-open-id-connect-providers

# Check LBC logs for permission errors
kubectl logs -n kube-system deployment/aws-load-balancer-controller | grep -i "access denied"
```

## Best Practices

### Certificate Organization
1. **Wildcard Certificates**: Use *.domain.com for flexibility across subdomains
2. **Certificate Naming**: Use descriptive names and tags in ACM
3. **Regional Certificates**: Create certificates in each region you use
4. **Validation Method**: Prefer DNS validation for automation
5. **Certificate Inventory**: Maintain documentation of all certificates

### Discovery Optimization
1. **Minimize Certificates**: Fewer certificates = faster discovery
2. **Specific Certificates**: Use exact match when possible for predictability
3. **Consistent Naming**: Use consistent subdomain patterns
4. **Region Alignment**: Ensure certificates in correct region
5. **Certificate Tags**: Tag certificates for organization

### Security
1. **Certificate Validation**: Always validate certificates before use
2. **Expiration Monitoring**: Set up CloudWatch alarms for expiration
3. **Auto-Renewal**: Use DNS validation for automatic renewal
4. **Regular Audits**: Periodically review ACM certificates
5. **Delete Unused**: Remove old/unused certificates

### Operational Excellence
1. **Monitoring**: Monitor certificate discovery in LBC logs
2. **Alerting**: Alert on discovery failures
3. **Documentation**: Document certificate-to-hostname mappings
4. **Testing**: Test certificate discovery in non-prod first
5. **Rollback Plan**: Have manual ARN annotation ready as fallback

### High Availability
1. **Multiple Certificates**: Have backup certificates for critical domains
2. **Wildcard Backup**: Maintain wildcard as fallback
3. **Certificate Redundancy**: Consider duplicate certificates in different accounts
4. **Validation Redundancy**: Maintain DNS validation records

