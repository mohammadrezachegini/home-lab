# EKS Ingress Cross-Namespaces

## Overview

This project demonstrates how to configure AWS Application Load Balancer (ALB) Ingress to route traffic across multiple Kubernetes namespaces using Ingress Groups. This advanced pattern allows you to consolidate multiple applications running in different namespaces behind a single ALB, reducing costs and simplifying infrastructure management while maintaining namespace isolation for your applications.

The implementation uses the AWS Load Balancer Controller with Ingress Group annotations to create a shared ALB that serves multiple applications (app1, app2, app3) deployed in separate namespaces (ns-app1, ns-app2, ns-app3).

## Architecture

```
Internet
    |
    v
AWS Application Load Balancer (Shared)
    |
    +-- /app1 --> ns-app1/app1-nginx-nodeport-service
    |
    +-- /app2 --> ns-app2/app2-nginx-nodeport-service
    |
    +-- /app3 --> ns-app3/app3-nginx-nodeport-service
```

### Key Components

1. **EKS Cluster**: Amazon EKS cluster with worker nodes
2. **AWS Load Balancer Controller**: Manages ALB creation and configuration
3. **ExternalDNS**: Automatically creates Route53 DNS records
4. **Multiple Namespaces**: Separate namespaces for application isolation
5. **Ingress Group**: Shared ALB across namespaces using `alb.ingress.kubernetes.io/group.name`
6. **SSL/TLS**: HTTPS termination at ALB with ACM certificates

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.0
- kubectl configured to interact with your EKS cluster
- A registered domain name in Route53
- ACM certificate for your domain
- Understanding of Kubernetes namespaces and Ingress resources

## Project Structure

```
EKS-Ingress-Cross-Namespaces/
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
├── ingress-cross-ns-terraform-manifests/     # Terraform-managed Ingress resources
│   └── ...
└── kube-manifests-ingress-cross-ns/    # Kubernetes manifests for cross-namespace ingress
    ├── app1/
    │   ├── 00-namespace.yml
    │   ├── 01-Nginx-App1-Deployment-and-NodePortService.yml
    │   └── 02-App1-Ingress.yml
    ├── app2/
    │   ├── 00-namespace.yml
    │   ├── 01-Nginx-App2-Deployment-and-NodePortService.yml
    │   └── 02-App2-Ingress.yml
    └── app3/
        ├── 00-namespace.yml
        ├── 01-Nginx-App3-Deployment-and-NodePortService.yml
        └── 02-App3-Ingress.yml
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

```bash
cd ../lbc-install-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

### Step 3: Install ExternalDNS

```bash
cd ../externaldns-install-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

### Step 4: Deploy Applications Across Namespaces

You can deploy using either Terraform or kubectl:

#### Option A: Using kubectl

```bash
cd ../kube-manifests-ingress-cross-ns

# Deploy App1 in ns-app1 namespace
kubectl apply -f app1/

# Deploy App2 in ns-app2 namespace
kubectl apply -f app2/

# Deploy App3 in ns-app3 namespace
kubectl apply -f app3/
```

#### Option B: Using Terraform

```bash
cd ../ingress-cross-ns-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

### Step 5: Verify Deployment

```bash
# Check namespaces
kubectl get namespaces

# Check deployments across all namespaces
kubectl get deployments -n ns-app1
kubectl get deployments -n ns-app2
kubectl get deployments -n ns-app3

# Check services
kubectl get svc -n ns-app1
kubectl get svc -n ns-app2
kubectl get svc -n ns-app3

# Check ingress resources
kubectl get ingress -n ns-app1
kubectl get ingress -n ns-app2
kubectl get ingress -n ns-app3

# Verify that all ingress resources share the same ALB
kubectl describe ingress -n ns-app1 app1-ingress | grep "Address:"
kubectl describe ingress -n ns-app2 app2-ingress | grep "Address:"
kubectl describe ingress -n ns-app3 app3-ingress | grep "Address:"
# All should show the same ALB DNS name
```

### Step 6: Test Access

```bash
# Access via DNS (once ExternalDNS creates the record)
curl https://ingress-crossns-demo601.rezaops.com/app1
curl https://ingress-crossns-demo601.rezaops.com/app2
curl https://ingress-crossns-demo601.rezaops.com/app3

# Or access via ALB DNS directly
curl https://<ALB-DNS-NAME>/app1
curl https://<ALB-DNS-NAME>/app2
curl https://<ALB-DNS-NAME>/app3
```

## Configuration

### Ingress Group Annotations

The key to cross-namespace routing is using Ingress Groups. Each Ingress resource must include:

```yaml
metadata:
  annotations:
    # Ingress Groups - Must be same across all Ingress resources
    alb.ingress.kubernetes.io/group.name: myapps.web
    alb.ingress.kubernetes.io/group.order: '10'  # Lower numbers = higher priority
```

### App1 Ingress Configuration

**File**: `kube-manifests-ingress-cross-ns/app1/02-App1-Ingress.yml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app1-ingress
  namespace: ns-app1
  annotations:
    # Load Balancer Name
    alb.ingress.kubernetes.io/load-balancer-name: ingress-crossns-demo

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
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:180789647333:certificate/xxx
    alb.ingress.kubernetes.io/ssl-redirect: '443'

    # External DNS
    external-dns.alpha.kubernetes.io/hostname: ingress-crossns-demo601.rezaops.com

    # Ingress Groups - CRITICAL for cross-namespace routing
    alb.ingress.kubernetes.io/group.name: myapps.web
    alb.ingress.kubernetes.io/group.order: '10'
spec:
  ingressClassName: my-aws-ingress-class
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
```

### Service Health Check Configuration

When using multiple services with a shared ALB, configure service-level health checks:

**File**: `kube-manifests-ingress-cross-ns/app1/01-Nginx-App1-Deployment-and-NodePortService.yml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: app1-nginx-nodeport-service
  namespace: ns-app1
  annotations:
    # Service-level health check path required for shared ALB
    alb.ingress.kubernetes.io/healthcheck-path: /app1/index.html
spec:
  type: NodePort
  selector:
    app: app1-nginx
  ports:
  - port: 80
    targetPort: 80
```

### Key Annotations Explained

| Annotation | Purpose | Example Value |
|------------|---------|---------------|
| `alb.ingress.kubernetes.io/group.name` | Groups multiple Ingress resources to share an ALB | `myapps.web` |
| `alb.ingress.kubernetes.io/group.order` | Determines rule evaluation order (lower = higher priority) | `10`, `20`, `30` |
| `alb.ingress.kubernetes.io/load-balancer-name` | Sets the ALB name (must be same across group) | `ingress-crossns-demo` |
| `alb.ingress.kubernetes.io/scheme` | ALB visibility | `internet-facing` or `internal` |
| `alb.ingress.kubernetes.io/certificate-arn` | ACM certificate for HTTPS | `arn:aws:acm:...` |
| `alb.ingress.kubernetes.io/ssl-redirect` | Redirects HTTP to HTTPS | `443` |
| `external-dns.alpha.kubernetes.io/hostname` | Creates Route53 DNS record | `myapp.example.com` |

## Features

### 1. Cross-Namespace Routing
- **Single ALB for multiple namespaces**: Reduces costs by consolidating infrastructure
- **Namespace isolation**: Applications remain isolated at the namespace level
- **Independent deployment**: Each application can be deployed/updated independently

### 2. Ingress Group Management
- **Group ordering**: Control rule evaluation priority with `group.order`
- **Shared annotations**: Common ALB settings shared across Ingress resources
- **Automatic merging**: AWS LBC automatically merges rules from all Ingress resources in the group

### 3. SSL/TLS Termination
- **HTTPS support**: Terminates SSL/TLS at the ALB
- **HTTP to HTTPS redirect**: Automatic redirection from HTTP to HTTPS
- **ACM integration**: Uses AWS Certificate Manager certificates

### 4. Automated DNS Management
- **ExternalDNS integration**: Automatically creates Route53 records
- **DNS on Ingress creation**: DNS records created when Ingress is deployed
- **Cleanup on deletion**: DNS records removed when Ingress is deleted

### 5. Health Checking
- **Service-level health checks**: Each service defines its own health check path
- **Protocol flexibility**: Supports HTTP and HTTPS health checks
- **Customizable thresholds**: Configure healthy/unhealthy thresholds per Ingress

## Troubleshooting

### Issue: ALB Not Created

**Symptoms**: Ingress resource created but no ALB appears in AWS console

**Solutions**:
1. Check AWS Load Balancer Controller logs:
```bash
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

2. Verify IngressClass exists:
```bash
kubectl get ingressclass
```

3. Ensure IAM role has correct permissions:
```bash
aws iam get-role --role-name <lbc-iam-role-name>
```

### Issue: Different ALBs Created for Each Namespace

**Symptoms**: Multiple ALBs created instead of one shared ALB

**Solutions**:
1. Verify all Ingress resources use the same `group.name`:
```bash
kubectl get ingress -A -o jsonpath='{range .items[*]}{.metadata.namespace}{"\t"}{.metadata.annotations.alb\.ingress\.kubernetes\.io/group\.name}{"\n"}{end}'
```

2. Check that `load-balancer-name` annotation is identical:
```bash
kubectl get ingress -A -o jsonpath='{range .items[*]}{.metadata.namespace}{"\t"}{.metadata.annotations.alb\.ingress\.kubernetes\.io/load-balancer-name}{"\n"}{end}'
```

### Issue: 503 Service Unavailable

**Symptoms**: ALB returns 503 errors

**Solutions**:
1. Check pod status:
```bash
kubectl get pods -n ns-app1
kubectl get pods -n ns-app2
kubectl get pods -n ns-app3
```

2. Verify service endpoints:
```bash
kubectl get endpoints -n ns-app1
kubectl get endpoints -n ns-app2
kubectl get endpoints -n ns-app3
```

3. Check target health in AWS console:
   - Navigate to EC2 → Load Balancers → Target Groups
   - Verify targets are healthy

4. Verify health check path is correct:
```bash
kubectl describe svc -n ns-app1 app1-nginx-nodeport-service
```

### Issue: Path Routing Not Working

**Symptoms**: Requests to specific paths return 404 or route incorrectly

**Solutions**:
1. Check Ingress rule order (lower `group.order` = higher priority):
```bash
kubectl get ingress -A -o jsonpath='{range .items[*]}{.metadata.namespace}{"\t"}{.metadata.annotations.alb\.ingress\.kubernetes\.io/group\.order}{"\n"}{end}'
```

2. Verify path definitions:
```bash
kubectl describe ingress -n ns-app1 app1-ingress
```

3. Ensure paths don't conflict between Ingress resources

### Issue: DNS Record Not Created

**Symptoms**: ExternalDNS doesn't create Route53 record

**Solutions**:
1. Check ExternalDNS logs:
```bash
kubectl logs -n default deployment/external-dns
```

2. Verify annotation is present:
```bash
kubectl get ingress -n ns-app1 app1-ingress -o yaml | grep external-dns
```

3. Check IAM permissions for ExternalDNS:
```bash
aws iam get-role-policy --role-name <externaldns-role> --policy-name <policy-name>
```

### Issue: SSL Certificate Error

**Symptoms**: Certificate warnings or errors when accessing HTTPS endpoint

**Solutions**:
1. Verify ACM certificate ARN is correct:
```bash
aws acm list-certificates --region us-east-1
```

2. Ensure certificate covers the domain:
```bash
aws acm describe-certificate --certificate-arn <cert-arn> --region us-east-1
```

3. Check that certificate is in the same region as the ALB

## Best Practices

### 1. Namespace Organization
- Use meaningful namespace names that reflect application ownership or environment
- Implement RBAC to control access to each namespace
- Use resource quotas to prevent resource exhaustion

### 2. Ingress Group Strategy
- Use consistent naming for `group.name` across related applications
- Plan `group.order` values with gaps (10, 20, 30) to allow future insertions
- Document which applications belong to which Ingress groups

### 3. Path Design
- Use unique path prefixes for each application (`/app1`, `/app2`, etc.)
- Avoid overlapping paths that could cause routing conflicts
- Consider using host-based routing instead of path-based for better isolation

### 4. Health Check Configuration
- Always define service-level health check paths when using multiple targets
- Use application-specific health check endpoints that verify app functionality
- Set appropriate timeout and threshold values based on application behavior

### 5. SSL/TLS Management
- Use ACM for certificate management
- Enable SSL redirect for all production workloads
- Consider using separate certificates for different applications if needed

### 6. Security
- Use `internal` scheme for ALBs that don't need internet access
- Implement security groups to restrict access
- Use AWS WAF with ALB for additional protection
- Enable access logs for auditing

### 7. Cost Optimization
- Consolidate applications behind fewer ALBs using Ingress Groups
- Monitor unused ALBs and clean up when applications are decommissioned
- Use ALB access logs to understand traffic patterns

### 8. Monitoring and Observability
- Enable ALB access logs to S3
- Set up CloudWatch alarms for ALB metrics
- Monitor target health and response times
- Use AWS X-Ray for request tracing
