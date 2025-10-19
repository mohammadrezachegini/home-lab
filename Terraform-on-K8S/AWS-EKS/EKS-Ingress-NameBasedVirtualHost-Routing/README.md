# EKS Ingress Name-Based Virtual Host Routing

## Overview

This project demonstrates host-based (name-based virtual host) routing with AWS Application Load Balancer on Amazon EKS. It showcases how to route traffic to different backend services based on the HTTP Host header, enabling you to host multiple applications on different subdomains using a single ALB.

The implementation features:
- Host-based routing (virtual hosts) using DNS names
- Multiple subdomains routing to different services
- SSL/TLS certificate configuration with ACM
- HTTP to HTTPS redirection
- External DNS integration for automatic Route53 record creation
- Default backend for unmatched hostnames

This pattern is ideal for hosting multiple applications on different subdomains (e.g., app1.example.com, app2.example.com) while maintaining cost efficiency through ALB consolidation.

## Architecture

### Components

1. **Single Application Load Balancer**: Routes traffic based on Host header
2. **AWS Certificate Manager (ACM)**: Provides SSL/TLS certificates
3. **Route53 DNS**: DNS records for subdomains (managed by External DNS)
4. **External DNS**: Automatically creates/updates DNS records
5. **Multiple Backend Services**: Different applications for each subdomain
6. **HTTPS Listener**: Terminates SSL and routes based on hostname

### Traffic Flow

```
User Browser
    |
    | DNS Lookup (Route53)
    v
ALB (HTTPS:443)
    |
    ├─ Host: app101.rezaops.com -> app1-service -> app1-pods
    ├─ Host: app201.rezaops.com -> app2-service -> app2-pods
    └─ Host: * (default) -> app3-service -> app3-pods
```

### DNS and SSL Architecture

```
*.rezaops.com (Wildcard ACM Certificate)
    |
    ├─ app101.rezaops.com -> CNAME -> ALB DNS
    ├─ app201.rezaops.com -> CNAME -> ALB DNS
    └─ default101.rezaops.com -> CNAME -> ALB DNS (default)
```

## Prerequisites

### Required Tools
- AWS CLI configured with appropriate credentials
- kubectl (v1.21+)
- Terraform (v1.0+)
- Domain registered in Route53 (or delegated to Route53)

### AWS Resources
- Existing EKS cluster with worker nodes
- Route53 hosted zone for your domain
- ACM certificate for your domain (wildcard recommended)
- AWS Load Balancer Controller installed
- External DNS controller installed
- IAM permissions for:
  - ALB management
  - Route53 record management
  - ACM certificate usage

### Domain Requirements
- A registered domain name (e.g., rezaops.com)
- Route53 hosted zone for the domain
- ACM certificate (can be wildcard: *.rezaops.com)
- Subdomains configured in your ingress

### Knowledge Requirements
- Understanding of DNS and virtual hosting
- SSL/TLS certificate concepts
- Kubernetes Ingress with host rules
- Route53 and ACM basics

## Project Structure

```
EKS-Ingress-NameBasedVirtualHost-Routing/
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
├── externaldns-install-terraform-manifests/  # External DNS installation
│   ├── c1-versions.tf                  # Terraform versions
│   ├── c2-remote-state-datasource.tf   # Reference to EKS state
│   ├── c3-*.tf                         # Variables and locals
│   └── c4-*.tf                         # External DNS IAM and Helm
│
├── ingress-nvhr-terraform-manifests/   # Name-based virtual host routing
│   ├── c1-versions.tf                  # Terraform versions
│   ├── c2-remote-state-datasource.tf   # Reference to cluster state
│   ├── c3-providers.tf                 # Kubernetes provider
│   ├── c4-kubernetes-app1-deployment.tf    # App1 deployment
│   ├── c5-kubernetes-app2-deployment.tf    # App2 deployment (different)
│   ├── c5-kubernetes-app3-deployment.tf    # App3 deployment
│   ├── c7-kubernetes-app1-nodeport-service.tf  # App1 service
│   ├── c8-kubernetes-app2-nodeport-service.tf  # App2 service
│   ├── c9-kubernetes-app3-nodeport-service.tf  # App3 service
│   ├── c10-kubernetes-ingress-service.tf       # Ingress with host routing
│   ├── c11-acm-certificate.tf          # ACM certificate resource
│   └── listen-ports/listen-ports.json  # ALB listener configuration
│
└── kube-manifests-ingress-nvhr/        # Pure Kubernetes manifests (reference)
    ├── 01-Nginx-App1-Deployment-and-NodePortService.yml
    ├── 02-Nginx-App2-Deployment-and-NodePortService.yml
    ├── 03-Nginx-App3-Deployment-and-NodePortService.yml
    └── 04-ALB-Ingress-HostHeader-Routing.yml
```

## Usage

### Step 1: Prepare ACM Certificate

```bash
# Option 1: Create certificate via AWS Console
# - Go to AWS Certificate Manager
# - Request certificate for *.yourdomain.com
# - Validate using DNS or Email
# - Note the certificate ARN

# Option 2: Create via AWS CLI
aws acm request-certificate \
  --domain-name "*.rezaops.com" \
  --validation-method DNS \
  --region us-east-1

# Get certificate ARN (replace with your ARN in manifests)
aws acm list-certificates --region us-east-1
```

### Step 2: Deploy EKS Cluster (if not exists)

```bash
cd ekscluster-terraform-manifests/
terraform init
terraform apply -auto-approve

# Configure kubectl
aws eks update-kubeconfig --region <region> --name <cluster-name>
```

### Step 3: Install AWS Load Balancer Controller (if not installed)

```bash
cd ../lbc-install-terraform-manifests/
terraform init
terraform apply -auto-approve

# Verify installation
kubectl get deployment -n kube-system aws-load-balancer-controller
```

### Step 4: Install External DNS

```bash
cd ../externaldns-install-terraform-manifests/

# Initialize Terraform
terraform init

# Apply configuration
terraform apply -auto-approve

# Verify External DNS is running
kubectl get deployment -n default external-dns
kubectl logs -n default deployment/external-dns
```

### Step 5: Update Ingress Configuration

```bash
cd ../ingress-nvhr-terraform-manifests/

# Update c11-acm-certificate.tf with your ACM certificate ARN
# Update c10-kubernetes-ingress-service.tf with your domain names

# Initialize and apply
terraform init
terraform apply -auto-approve
```

### Step 6: Verify Deployment

```bash
# Check ingress
kubectl get ingress ingress-namedbasedvhost-demo

# Check services
kubectl get svc

# Verify External DNS created Route53 records
aws route53 list-resource-record-sets \
  --hosted-zone-id <your-zone-id> \
  --query "ResourceRecordSets[?Type=='A' || Type=='CNAME']"

# Check ALB in AWS Console
# Should show HTTPS listener with host-based rules
```

### Step 7: Test Host-Based Routing

```bash
# Wait for DNS propagation (may take 1-5 minutes)

# Test app1 subdomain
curl https://app101.rezaops.com/
# Expected: Response from app1

# Test app2 subdomain
curl https://app201.rezaops.com/
# Expected: Response from app2

# Test default subdomain (or any unmatched hostname)
curl https://default101.rezaops.com/
# Expected: Response from app3 (default backend)

# Test HTTP to HTTPS redirect
curl -I http://app101.rezaops.com/
# Expected: 301/302 redirect to HTTPS

# Test with browser for visual confirmation
open https://app101.rezaops.com
open https://app201.rezaops.com
```

### Step 8: Monitor External DNS

```bash
# Check External DNS logs
kubectl logs -n default deployment/external-dns -f

# Verify Route53 records were created
aws route53 list-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --output table
```

### Step 9: Clean Up

```bash
# Delete ingress resources (will trigger External DNS cleanup)
cd ingress-nvhr-terraform-manifests/
terraform destroy -auto-approve

# Wait for Route53 records to be removed (check External DNS logs)

# Delete External DNS
cd ../externaldns-install-terraform-manifests/
terraform destroy -auto-approve

# Optionally delete LBC and cluster
cd ../lbc-install-terraform-manifests/
terraform destroy -auto-approve

cd ../ekscluster-terraform-manifests/
terraform destroy -auto-approve
```

## Configuration

### Ingress with Host-Based Routing

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-namedbasedvhost-demo
  annotations:
    # Load Balancer Configuration
    alb.ingress.kubernetes.io/load-balancer-name: namedbasedvhost-ingress
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
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id

    # SSL Redirect (HTTP -> HTTPS)
    alb.ingress.kubernetes.io/ssl-redirect: '443'

    # External DNS - Creates Route53 record for default backend
    external-dns.alpha.kubernetes.io/hostname: default101.rezaops.com

spec:
  ingressClassName: my-aws-ingress-class

  # Default backend for unmatched hostnames
  defaultBackend:
    service:
      name: app3-nginx-nodeport-service
      port:
        number: 80

  # Host-based routing rules
  rules:
  # Route requests with Host: app101.rezaops.com
  - host: app101.rezaops.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app1-nginx-nodeport-service
            port:
              number: 80

  # Route requests with Host: app201.rezaops.com
  - host: app201.rezaops.com
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

### Key Annotations Explained

#### SSL/TLS Configuration

```yaml
# Listen on both HTTP and HTTPS
alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}, {"HTTP":80}]'

# ACM certificate ARN
alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:region:account:certificate/id

# Redirect HTTP to HTTPS
alb.ingress.kubernetes.io/ssl-redirect: '443'

# Optional: Specify SSL policy
alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS-1-2-2017-01
```

#### External DNS Configuration

```yaml
# External DNS creates Route53 A record pointing to ALB
external-dns.alpha.kubernetes.io/hostname: default101.rezaops.com

# For multiple hostnames (comma-separated)
external-dns.alpha.kubernetes.io/hostname: app1.example.com,app2.example.com
```

### External DNS IAM Policy

External DNS requires Route53 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "route53:ChangeResourceRecordSets"
      ],
      "Resource": [
        "arn:aws:route53:::hostedzone/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "route53:ListHostedZones",
        "route53:ListResourceRecordSets"
      ],
      "Resource": [
        "*"
      ]
    }
  ]
}
```

### ACM Certificate Setup

#### Wildcard Certificate (Recommended)

```bash
# Covers all subdomains: *.rezaops.com
# Matches: app1.rezaops.com, app2.rezaops.com, anything.rezaops.com
Domain: *.rezaops.com
```

#### Multiple Domain Certificate

```bash
# Covers specific domains
Domains:
  - app1.rezaops.com
  - app2.rezaops.com
  - default.rezaops.com
```

## Features

### Host-Based Routing
- Route traffic based on HTTP Host header
- Support for multiple domains on single ALB
- Virtual host configuration similar to traditional web servers
- Wildcard hostname support in certificates

### SSL/TLS Termination
- SSL/TLS termination at ALB
- ACM certificate integration
- Automatic HTTP to HTTPS redirect
- Support for custom SSL policies
- SNI (Server Name Indication) support

### External DNS Integration
- Automatic DNS record creation
- Route53 integration
- Automatic cleanup on resource deletion
- Support for CNAME and A records
- Multi-domain support

### Cost Efficiency
- Single ALB for multiple domains
- Shared SSL certificate (wildcard)
- Reduced data transfer costs
- Simplified infrastructure management

### High Availability
- Multi-AZ load balancing
- Automatic failover
- Health check per backend
- Zero-downtime deployments

## Troubleshooting

### DNS Resolution Issues

**Issue**: Domain not resolving to ALB

**Solutions**:
```bash
# Check External DNS logs
kubectl logs -n default deployment/external-dns

# Verify Route53 records created
aws route53 list-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --query "ResourceRecordSets[?Name=='app101.rezaops.com.']"

# Check DNS propagation
nslookup app101.rezaops.com
dig app101.rezaops.com

# Verify ingress annotation
kubectl get ingress -o yaml | grep external-dns

# Check External DNS service account permissions
kubectl describe sa external-dns -n default
```

### SSL Certificate Errors

**Issue**: Browser shows SSL warning or certificate mismatch

**Solutions**:
```bash
# Verify certificate ARN in ingress
kubectl get ingress ingress-namedbasedvhost-demo -o yaml | grep certificate-arn

# Check certificate status in ACM
aws acm describe-certificate --certificate-arn <cert-arn>

# Ensure certificate covers the domain
# For app1.rezaops.com, need certificate for *.rezaops.com or app1.rezaops.com

# Verify certificate is in correct region (same as ALB)
aws acm list-certificates --region <alb-region>

# Check ALB listener configuration in AWS Console
```

### Host Header Not Routing Correctly

**Issue**: All requests go to default backend regardless of hostname

**Solutions**:
```bash
# Verify host rules in ingress
kubectl get ingress ingress-namedbasedvhost-demo -o yaml

# Check ALB listener rules in AWS Console
# Each host should have a separate rule

# Test with explicit Host header
curl -H "Host: app101.rezaops.com" http://<alb-dns>

# Check for typos in host names
kubectl describe ingress ingress-namedbasedvhost-demo

# Verify services exist
kubectl get svc app1-nginx-nodeport-service app2-nginx-nodeport-service
```

### HTTP to HTTPS Redirect Not Working

**Issue**: HTTP requests don't redirect to HTTPS

**Solutions**:
```bash
# Verify ssl-redirect annotation
kubectl get ingress -o yaml | grep ssl-redirect

# Check listen-ports annotation includes both HTTP and HTTPS
kubectl get ingress -o yaml | grep listen-ports

# Test redirect manually
curl -I http://app101.rezaops.com
# Should see 301/302 with Location: https://...

# Check ALB listener rules in AWS Console
# Should have redirect action for HTTP:80
```

### External DNS Not Creating Records

**Issue**: Route53 records not created automatically

**Solutions**:
```bash
# Check External DNS is running
kubectl get pods -n default -l app=external-dns

# Review External DNS logs for errors
kubectl logs -n default deployment/external-dns

# Verify IAM permissions
kubectl describe sa external-dns -n default

# Check External DNS configuration
kubectl get deployment external-dns -n default -o yaml

# Verify hosted zone ID is correct
aws route53 list-hosted-zones

# Check annotation format
kubectl get ingress -o yaml | grep external-dns
```

### Certificate Discovery Issues

**Issue**: ALB not using correct certificate

**Solutions**:
```bash
# Ensure certificate ARN is correct
kubectl get ingress -o yaml | grep certificate-arn

# Verify certificate in same region as ALB
aws acm list-certificates --region <region>

# Check certificate validation status
aws acm describe-certificate --certificate-arn <arn>

# Review LBC logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Manually verify ALB listener in AWS Console
```

## Best Practices

### Domain and DNS Management
1. **Wildcard Certificates**: Use wildcard certificates (*.domain.com) for flexibility
2. **DNS TTL**: Use appropriate TTL values (300s recommended for dynamic environments)
3. **Hosted Zones**: Organize domains in appropriate Route53 hosted zones
4. **Domain Validation**: Keep ACM certificates validated and renewed
5. **DNS Testing**: Always test DNS resolution before and after changes

### SSL/TLS Configuration
1. **Modern TLS**: Use TLS 1.2 or higher (ELBSecurityPolicy-TLS-1-2-2017-01)
2. **Certificate Renewal**: Monitor ACM certificate expiration (auto-renews if validated)
3. **HTTPS Enforcement**: Always redirect HTTP to HTTPS
4. **HSTS Headers**: Consider adding HSTS headers at application level
5. **Certificate Scope**: Use appropriate certificate scope (wildcard vs specific domains)

### Host Routing Design
1. **Consistent Naming**: Use clear, consistent subdomain naming conventions
2. **Default Backend**: Always configure default backend for unknown hosts
3. **Host Validation**: Validate Host headers at application level
4. **Documentation**: Maintain inventory of all hostnames and their backends
5. **Environment Segregation**: Use different subdomains for environments (dev., staging., prod.)

### External DNS
1. **Permissions**: Grant minimal required Route53 permissions
2. **Zone Filtering**: Configure External DNS to manage only specific zones
3. **Annotation Prefix**: Use custom annotation prefix to avoid conflicts
4. **Logging**: Enable verbose logging during initial setup
5. **Cleanup**: Verify DNS records are removed when ingress is deleted

### Performance
1. **Keep-Alive**: Enable connection keep-alive
2. **Caching**: Implement appropriate caching strategies
3. **CDN**: Consider CloudFront for static content
4. **Connection Draining**: Configure appropriate deregistration delay
5. **Health Checks**: Tune health check frequency for your workload

### Security
1. **SSL Only**: Enforce HTTPS for all production traffic
2. **Security Headers**: Implement security headers (CSP, X-Frame-Options, etc.)
3. **WAF Integration**: Use AWS WAF for advanced security
4. **Access Logs**: Enable ALB access logs for audit trail
5. **Rate Limiting**: Implement rate limiting at ALB or application level


### Monitoring and Operations
1. **CloudWatch Metrics**: Monitor ALB target health, request count, latency
2. **Alarms**: Set up alarms for unhealthy targets and error rates
3. **DNS Monitoring**: Monitor DNS query metrics
4. **Certificate Monitoring**: Alert on certificate expiration
5. **Log Analysis**: Regularly review ALB access logs
6. **Testing**: Implement automated testing for each hostname
