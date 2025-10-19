# EKS Ingress SSL and SSL Redirect

## Overview

This project demonstrates SSL/TLS termination and HTTP to HTTPS redirection using AWS Application Load Balancer on Amazon EKS. It showcases how to secure your applications with SSL certificates from AWS Certificate Manager (ACM) and automatically redirect all HTTP traffic to HTTPS.

The implementation features:
- SSL/TLS termination at Application Load Balancer
- AWS Certificate Manager (ACM) integration
- Automatic HTTP to HTTPS redirection
- Path-based routing with SSL
- Dual listener configuration (HTTP:80 and HTTPS:443)
- Custom SSL policy support

This is a production-ready pattern for securing web applications and APIs, ensuring all traffic is encrypted in transit while maintaining backward compatibility with HTTP clients through automatic redirection.

## Architecture

### Components

1. **Application Load Balancer with Dual Listeners**:
   - HTTPS Listener (443): Handles secure traffic
   - HTTP Listener (80): Redirects to HTTPS
2. **AWS Certificate Manager**: Provides SSL/TLS certificates
3. **Multiple Backend Services**: Applications with path-based routing
4. **SSL Policy**: Configurable cipher suites and protocols

### Traffic Flow

```
HTTP Request (port 80)
    |
    v
ALB HTTP Listener
    |
    | (301/302 Redirect)
    v
HTTPS Request (port 443)
    |
    v
ALB HTTPS Listener (SSL Termination)
    |
    | (Decrypted HTTP)
    v
Path-Based Routing
    ├─ /app1 -> app1-service -> app1-pods
    ├─ /app2 -> app2-service -> app2-pods
    └─ /* (default) -> app3-service -> app3-pods
```

### SSL/TLS Flow

```
1. Client initiates HTTPS connection
2. ALB presents ACM certificate
3. TLS handshake establishes encryption
4. ALB decrypts traffic
5. ALB routes to backend based on path
6. Backend receives plain HTTP (within VPC)
```

## Prerequisites

### Required Tools
- AWS CLI configured with appropriate credentials
- kubectl (v1.21+)
- Terraform (v1.0+)
- openssl (for certificate verification)

### AWS Resources
- Existing EKS cluster with worker nodes
- AWS Certificate Manager certificate (for your domain)
- AWS Load Balancer Controller installed
- IAM permissions for ACM certificate usage

### Certificate Requirements
- Valid ACM certificate in the same region as your ALB
- Certificate must cover your domain/subdomain
- Certificate must be in "Issued" status
- For testing: Can use any domain, but HTTPS validation will fail in browser

### Knowledge Requirements
- Understanding of SSL/TLS concepts
- Familiarity with ACM certificate management
- HTTP/HTTPS protocol basics
- Kubernetes Ingress configuration

## Project Structure

```
EKS-Ingress-SSL-SSLRedirect/
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
├── ingress-ssl-terraform-manifests/    # SSL ingress configuration
│   ├── c1-versions.tf                  # Terraform versions
│   ├── c2-remote-state-datasource.tf   # Reference to cluster state
│   ├── c3-providers.tf                 # Kubernetes provider
│   ├── c4-kubernetes-app1-deployment.tf    # App1 deployment
│   ├── c5-kubernetes-app2-deployment.tf    # App2 deployment
│   ├── c5-kubernetes-app3-deployment.tf    # App3 deployment
│   ├── c7-kubernetes-app1-nodeport-service.tf  # App1 service
│   ├── c8-kubernetes-app2-nodeport-service.tf  # App2 service
│   ├── c9-kubernetes-app3-nodeport-service.tf  # App3 service
│   ├── c10-kubernetes-ingress-service.tf       # Ingress with SSL
│   ├── c11-acm-certificate.tf          # ACM certificate reference
│   └── listen-ports/listen-ports.json  # ALB listener ports config
│
└── kube-manifests-Ingress-SSL/         # Pure Kubernetes manifests (reference)
    ├── 01-Nginx-App1-Deployment-and-NodePortService.yml
    ├── 02-Nginx-App2-Deployment-and-NodePortService.yml
    ├── 03-Nginx-App3-Deployment-and-NodePortService.yml
    └── 04-ALB-Ingress-SSL-Redirect.yml
```

## Usage

### Step 1: Create or Obtain ACM Certificate

```bash
# Option 1: Create via AWS Console
# - Navigate to AWS Certificate Manager
# - Request public certificate
# - Enter your domain (e.g., *.yourdomain.com)
# - Choose DNS or email validation
# - Complete validation process

# Option 2: Request via AWS CLI
aws acm request-certificate \
  --domain-name "*.yourdomain.com" \
  --validation-method DNS \
  --region us-east-1

# Wait for validation and note the certificate ARN
aws acm describe-certificate \
  --certificate-arn <cert-arn> \
  --region us-east-1

# For testing without domain: Use example certificate ARN
# (traffic will work but browser will show certificate warning)
```

### Step 2: Deploy EKS Cluster (if not exists)

```bash
cd ekscluster-terraform-manifests/
terraform init
terraform apply -auto-approve

aws eks update-kubeconfig --region <region> --name <cluster-name>
```

### Step 3: Install AWS Load Balancer Controller (if not installed)

```bash
cd ../lbc-install-terraform-manifests/
terraform init
terraform apply -auto-approve

kubectl get deployment -n kube-system aws-load-balancer-controller
```

### Step 4: Update Certificate ARN in Configuration

```bash
cd ../ingress-ssl-terraform-manifests/

# Edit c11-acm-certificate.tf or c10-kubernetes-ingress-service.tf
# Update the certificate ARN with your ACM certificate ARN
# Example: arn:aws:acm:us-east-1:123456789012:certificate/abc-123-def
```

### Step 5: Deploy SSL Ingress

```bash
# Initialize Terraform
terraform init

# Review the plan (check certificate ARN)
terraform plan

# Apply configuration
terraform apply -auto-approve

# Verify resources
kubectl get ingress ingress-ssl-demo
kubectl get svc
kubectl get deployments
```

### Step 6: Test SSL and Redirect

```bash
# Get ALB DNS name
ALB_DNS=$(kubectl get ingress ingress-ssl-demo -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "ALB DNS: $ALB_DNS"

# Test HTTP to HTTPS redirect
curl -I http://$ALB_DNS/app1
# Expected: 301 or 302 redirect to https://

# Test HTTPS with path routing
curl -k https://$ALB_DNS/app1
curl -k https://$ALB_DNS/app2
curl -k https://$ALB_DNS/
# Note: -k flag skips certificate validation (use for testing)

# For domain-based testing (if you have valid domain)
curl https://yourdomain.com/app1
curl https://yourdomain.com/app2

# Test automatic redirect in browser
open http://$ALB_DNS/app1
# Should automatically redirect to HTTPS
```

### Step 7: Verify SSL Configuration

```bash
# Check certificate in ALB
kubectl describe ingress ingress-ssl-demo | grep certificate-arn

# Verify listeners in AWS Console
# - Navigate to EC2 > Load Balancers
# - Find your ALB
# - Check Listeners tab
# - Should see: HTTP:80 (redirect) and HTTPS:443

# Test SSL certificate details
echo | openssl s_client -connect $ALB_DNS:443 -servername $ALB_DNS 2>/dev/null | openssl x509 -noout -subject -dates

# Check cipher suites
nmap --script ssl-enum-ciphers -p 443 $ALB_DNS
```

### Step 8: Clean Up

```bash
cd ingress-ssl-terraform-manifests/
terraform destroy -auto-approve

# Optionally delete other resources
cd ../lbc-install-terraform-manifests/
terraform destroy -auto-approve

cd ../ekscluster-terraform-manifests/
terraform destroy -auto-approve
```

## Configuration

### SSL Ingress with Redirect

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-ssl-demo
  annotations:
    # Load Balancer Configuration
    alb.ingress.kubernetes.io/load-balancer-name: ingress-ssl-demo
    alb.ingress.kubernetes.io/scheme: internet-facing

    # Health Check Settings
    alb.ingress.kubernetes.io/healthcheck-protocol: HTTP
    alb.ingress.kubernetes.io/healthcheck-port: traffic-port
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: '15'
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: '5'
    alb.ingress.kubernetes.io/success-codes: '200'
    alb.ingress.kubernetes.io/healthy-threshold-count: '2'
    alb.ingress.kubernetes.io/unhealthy-threshold-count: '2'

    # SSL Settings - Listen on both HTTP and HTTPS
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}, {"HTTP":80}]'

    # ACM Certificate ARN
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id

    # Optional: SSL Policy (defaults to ELBSecurityPolicy-2016-08)
    # alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS-1-2-2017-01

    # SSL Redirect - Redirect HTTP to HTTPS
    alb.ingress.kubernetes.io/ssl-redirect: '443'

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

### Key SSL Annotations Explained

#### Listen Ports Configuration

```yaml
# Listen on both HTTP and HTTPS
alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}, {"HTTP":80}]'

# HTTPS only (no HTTP redirect capability)
alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'

# Custom ports (less common)
alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":8443}, {"HTTP":8080}]'
```

#### Certificate Configuration

```yaml
# Single certificate
alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:123456789012:certificate/abc-123

# Multiple certificates (for SNI - Server Name Indication)
alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:region:account:certificate/cert1,arn:aws:acm:region:account:certificate/cert2
```

#### SSL Policy Options

```yaml
# Modern security (TLS 1.2+)
alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS-1-2-2017-01

# Forward secrecy (recommended for production)
alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-FS-1-2-2019-08

# TLS 1.3 support
alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS13-1-2-2021-06

# Default (if not specified)
# ELBSecurityPolicy-2016-08
```

#### SSL Redirect Configuration

```yaml
# Redirect HTTP to HTTPS on port 443
alb.ingress.kubernetes.io/ssl-redirect: '443'

# Redirect to custom HTTPS port
alb.ingress.kubernetes.io/ssl-redirect: '8443'
```

### SSL Policy Comparison

| Policy | Min TLS Version | Ciphers | Forward Secrecy | Recommended Use |
|--------|----------------|---------|-----------------|-----------------|
| ELBSecurityPolicy-2016-08 | TLS 1.0 | Wide compatibility | Partial | Legacy support |
| ELBSecurityPolicy-TLS-1-2-2017-01 | TLS 1.2 | Strong | Partial | Modern apps |
| ELBSecurityPolicy-FS-1-2-2019-08 | TLS 1.2 | Strong | Full | Security-focused |
| ELBSecurityPolicy-TLS13-1-2-2021-06 | TLS 1.2 | Includes TLS 1.3 | Full | Latest standard |

## Features

### SSL/TLS Termination
- Terminate SSL at ALB (offload from applications)
- Support for TLS 1.0 through TLS 1.3
- Configurable cipher suites
- SNI support for multiple certificates
- Perfect forward secrecy options

### HTTP to HTTPS Redirect
- Automatic 301/302 redirect
- No application code changes required
- SEO-friendly redirection
- Configurable redirect target port

### Certificate Management
- ACM integration for free certificates
- Automatic certificate renewal (when using ACM)
- Support for imported certificates
- Multiple certificate support via SNI

### Path-Based Routing with SSL
- Combine SSL with path-based routing
- Different backends for different paths
- All paths secured with same certificate
- Default backend support

### Security Features
- Modern TLS protocols
- Strong cipher suites
- Certificate validation
- HTTPS enforcement

## Troubleshooting

### Certificate Validation Errors

**Issue**: Browser shows "Certificate not valid" or "Certificate mismatch"

**Solutions**:
```bash
# Verify certificate ARN is correct
kubectl get ingress ingress-ssl-demo -o yaml | grep certificate-arn

# Check certificate status in ACM
aws acm describe-certificate --certificate-arn <cert-arn>

# Ensure certificate domain matches your domain
# Certificate: *.example.com should match app.example.com

# Check certificate is in correct region (same as ALB)
aws acm list-certificates --region <alb-region>

# Verify certificate is in "Issued" status
aws acm describe-certificate --certificate-arn <arn> --query 'Certificate.Status'

# For testing: Use curl with -k flag to skip validation
curl -k https://<alb-dns>/app1
```

### HTTP Not Redirecting to HTTPS

**Issue**: HTTP requests don't redirect to HTTPS

**Solutions**:
```bash
# Verify ssl-redirect annotation
kubectl get ingress ingress-ssl-demo -o yaml | grep ssl-redirect

# Ensure listen-ports includes both HTTP and HTTPS
kubectl get ingress -o yaml | grep listen-ports
# Should show: '[{"HTTPS":443}, {"HTTP":80}]'

# Test redirect explicitly
curl -I http://<alb-dns>/app1
# Should see: HTTP/1.1 301 Moved Permanently or 302 Found

# Check ALB listeners in AWS Console
# HTTP:80 listener should have redirect action

# Verify LBC is processing annotations
kubectl logs -n kube-system deployment/aws-load-balancer-controller | grep ssl-redirect
```

### HTTPS Listener Not Created

**Issue**: Only HTTP listener exists, no HTTPS listener

**Solutions**:
```bash
# Verify certificate-arn annotation
kubectl describe ingress ingress-ssl-demo | grep certificate-arn

# Check listen-ports annotation
kubectl get ingress -o yaml | grep listen-ports

# Review LBC logs for certificate errors
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Ensure certificate exists and is accessible
aws acm describe-certificate --certificate-arn <arn>

# Check IAM permissions for LBC to access ACM
# LBC service account needs acm:DescribeCertificate permission
```

### SSL Handshake Failures

**Issue**: SSL handshake fails or timeout

**Solutions**:
```bash
# Test SSL connection
openssl s_client -connect <alb-dns>:443 -servername <alb-dns>

# Check security groups
# ALB security group must allow inbound HTTPS (443)

# Verify SSL policy compatibility
kubectl get ingress -o yaml | grep ssl-policy

# Test with different SSL/TLS versions
openssl s_client -connect <alb-dns>:443 -tls1_2
openssl s_client -connect <alb-dns>:443 -tls1_3

# Check for firewall or network issues
telnet <alb-dns> 443
```

### Certificate ARN Permission Denied

**Issue**: LBC cannot access ACM certificate

**Solutions**:
```bash
# Check LBC IAM role permissions
aws iam get-role-policy --role-name <lbc-role> --policy-name <policy-name>

# Ensure policy includes ACM permissions
# Required: acm:DescribeCertificate, acm:ListCertificates

# Verify service account annotation
kubectl describe sa -n kube-system aws-load-balancer-controller

# Check OIDC provider configuration
aws eks describe-cluster --name <cluster> --query "cluster.identity.oidc.issuer"

# Review LBC logs for permission errors
kubectl logs -n kube-system deployment/aws-load-balancer-controller | grep -i acm
```

### Mixed Content Warnings

**Issue**: HTTPS page loading HTTP resources

**Solutions**:
```bash
# This is an application issue, not ALB issue
# Ensure application uses relative URLs or HTTPS URLs

# Check if application detects HTTPS
# ALB adds headers: X-Forwarded-Proto: https

# Application should read X-Forwarded-Proto header
# and serve HTTPS URLs accordingly

# For troubleshooting, check browser console for mixed content warnings
```

## Best Practices

### Certificate Management
1. **Use ACM**: Leverage AWS Certificate Manager for free certificates with auto-renewal
2. **Wildcard Certificates**: Use wildcard (*.domain.com) for flexibility
3. **Certificate Monitoring**: Set up alerts for certificate expiration
4. **Multi-Region**: Request certificates in all regions where you deploy ALBs
5. **Validation**: Use DNS validation for automation (vs email validation)

### SSL/TLS Security
1. **Modern Protocols**: Use TLS 1.2 minimum (TLS 1.3 preferred)
2. **Strong Policies**: Use ELBSecurityPolicy-FS-* for forward secrecy
3. **Regular Updates**: Update SSL policies as new vulnerabilities discovered
4. **Testing**: Regularly test with SSL Labs or similar tools
5. **HSTS**: Consider implementing HSTS headers at application level

### Redirect Configuration
1. **Always Redirect**: Use ssl-redirect to enforce HTTPS
2. **Status Code**: AWS uses 301 (permanent) by default - good for SEO
3. **Application Awareness**: Ensure apps handle X-Forwarded-Proto header
4. **Testing**: Test redirect behavior across different browsers
5. **Mobile**: Verify redirect works correctly on mobile devices

### Performance
1. **Session Resumption**: Enabled by default on ALB
2. **Keep-Alive**: Use persistent connections
3. **TLS 1.3**: Use for improved handshake performance
4. **Certificate Caching**: ALB caches certificate validation
5. **Connection Pooling**: Leverage HTTP keep-alive


### Operational Excellence
1. **Monitoring**: Monitor SSL handshake metrics in CloudWatch
2. **Logging**: Enable ALB access logs for security audit
3. **Alerting**: Alert on SSL negotiation errors
4. **Documentation**: Document certificate ARNs and renewal dates
5. **Runbooks**: Create runbooks for certificate rotation

