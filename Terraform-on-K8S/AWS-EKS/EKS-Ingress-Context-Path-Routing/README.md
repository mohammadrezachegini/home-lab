# EKS Ingress Context Path Routing

## Overview

This project demonstrates advanced ALB Ingress routing using context path-based routing patterns on Amazon EKS. It showcases how to route traffic to different backend services based on the URL path, enabling you to host multiple applications behind a single Application Load Balancer.

The implementation illustrates:
- Path-based routing (e.g., `/app1`, `/app2`, `/app3`)
- Multiple backend services with a single ALB
- Default backend configuration for unmatched paths
- Service-level health check annotations
- Cost-effective architecture through ALB consolidation

This pattern is ideal for microservices architectures where different services need to be accessible through different URL paths on the same domain.

## Architecture

### Components

1. **Single Application Load Balancer**: Routes traffic based on URL paths
2. **Multiple Backend Services**: Three different NGINX applications (app1, app2, app3)
3. **Path-Based Rules**: Ingress rules matching specific URL paths
4. **Default Backend**: Fallback service for unmatched paths
5. **NodePort Services**: Each application exposed via NodePort

### Traffic Flow

```
Internet -> ALB
              ├─ /app1 -> app1-service -> app1-pods
              ├─ /app2 -> app2-service -> app2-pods
              └─ /* (default) -> app3-service -> app3-pods
```

### Routing Logic

- `https://domain.com/app1/*` -> Routes to app1-nginx-nodeport-service
- `https://domain.com/app2/*` -> Routes to app2-nginx-nodeport-service
- `https://domain.com/*` (all other paths) -> Routes to app3-nginx-nodeport-service (default backend)

## Prerequisites

### Required Tools
- AWS CLI configured with appropriate credentials
- kubectl (v1.21+)
- Terraform (v1.0+)
- curl or web browser for testing

### AWS Resources
- Existing EKS cluster with worker nodes
- VPC with properly tagged subnets for ALB
- AWS Load Balancer Controller installed
- IAM permissions for ALB management

### Knowledge Requirements
- Understanding of Kubernetes Ingress and routing
- Familiarity with HTTP URL path structures
- ALB target groups and routing concepts
- Basic Terraform and Kubernetes manifest syntax

## Project Structure

```
EKS-Ingress-Context-Path-Routing/
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
├── lbc-install-terraform-manifests/    # Load Balancer Controller installation
│   ├── c1-versions.tf                  # Terraform versions
│   ├── c2-remote-state-datasource.tf   # EKS cluster state reference
│   ├── c3-*.tf                         # Variables and locals
│   ├── c4-*.tf                         # LBC IAM, Helm installation
│   └── c5-*.tf                         # Kubernetes provider, IngressClass
│
├── ingress-cpr-terraform-manifests/    # Context path routing configuration
│   ├── c1-versions.tf                  # Terraform versions
│   ├── c2-remote-state-datasource.tf   # Reference to cluster state
│   ├── c3-providers.tf                 # Kubernetes provider
│   ├── c4-kubernetes-app1-deployment.tf    # App1 deployment
│   ├── c5-kubernetes-app2-deployment.tf    # App2 deployment
│   ├── c6-kubernetes-app3-deployment.tf    # App3 deployment
│   ├── c7-kubernetes-app1-nodeport-service.tf  # App1 service
│   ├── c8-kubernetes-app2-nodeport-service.tf  # App2 service
│   ├── c9-kubernetes-app3-nodeport-service.tf  # App3 service
│   └── c10-kubernetes-ingress-service.tf       # Ingress with path routing
│
└── kube-manifests-ingress-cpr/         # Pure Kubernetes manifests (reference)
    ├── 01-Nginx-App1-Deployment-and-NodePortService.yml
    ├── 02-Nginx-App2-Deployment-and-NodePortService.yml
    ├── 03-Nginx-App3-Deployment-and-NodePortService.yml
    └── 04-ALB-Ingress-ContextPath-Based-Routing.yml
```

## Usage

### Step 1: Deploy EKS Cluster (if not exists)

```bash
cd ekscluster-terraform-manifests/
terraform init
terraform apply -auto-approve

# Configure kubectl
aws eks update-kubeconfig --region <region> --name <cluster-name>
```

### Step 2: Install AWS Load Balancer Controller (if not installed)

```bash
cd ../lbc-install-terraform-manifests/
terraform init
terraform apply -auto-approve

# Verify installation
kubectl get deployment -n kube-system aws-load-balancer-controller
```

### Step 3: Deploy Applications with Path-Based Routing

```bash
cd ../ingress-cpr-terraform-manifests/

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the configuration
terraform apply -auto-approve

# Verify deployments
kubectl get deployments
kubectl get services
kubectl get ingress
```

### Step 4: Test Path-Based Routing

```bash
# Get the ALB DNS name
ALB_DNS=$(kubectl get ingress ingress-cpr -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "ALB DNS: $ALB_DNS"

# Test app1 path
curl http://$ALB_DNS/app1
# Expected: Response from app1

# Test app2 path
curl http://$ALB_DNS/app2
# Expected: Response from app2

# Test default path (any other path)
curl http://$ALB_DNS/
curl http://$ALB_DNS/anything
# Expected: Response from app3 (default backend)

# Test with verbose output to see routing
curl -v http://$ALB_DNS/app1/index.html
```

### Step 5: Verify ALB Configuration

```bash
# Check ALB target groups in AWS Console
# You should see 3 target groups (one for each app)

# Describe ingress for details
kubectl describe ingress ingress-cpr

# Check ingress events
kubectl get events --field-selector involvedObject.name=ingress-cpr
```

### Step 6: Clean Up

```bash
# Delete ingress and applications
cd ingress-cpr-terraform-manifests/
terraform destroy -auto-approve

# Optionally delete LBC and cluster
cd ../lbc-install-terraform-manifests/
terraform destroy -auto-approve

cd ../ekscluster-terraform-manifests/
terraform destroy -auto-approve
```

## Configuration

### Ingress Path Routing Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-cpr
  annotations:
    alb.ingress.kubernetes.io/load-balancer-name: ingress-cpr
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/healthcheck-protocol: HTTP
    alb.ingress.kubernetes.io/healthcheck-port: traffic-port
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: '15'
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: '5'
    alb.ingress.kubernetes.io/success-codes: '200'
    alb.ingress.kubernetes.io/healthy-threshold-count: '2'
    alb.ingress.kubernetes.io/unhealthy-threshold-count: '2'
spec:
  ingressClassName: my-aws-ingress-class
  # Default backend for unmatched paths
  defaultBackend:
    service:
      name: app3-nginx-nodeport-service
      port:
        number: 80
  # Path-based routing rules
  rules:
  - http:
      paths:
      # Route /app1/* to app1 service
      - path: /app1
        pathType: Prefix
        backend:
          service:
            name: app1-nginx-nodeport-service
            port:
              number: 80
      # Route /app2/* to app2 service
      - path: /app2
        pathType: Prefix
        backend:
          service:
            name: app2-nginx-nodeport-service
            port:
              number: 80
```

### Service-Level Health Check Annotations

When using multiple target groups, add health check paths at the service level:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: app1-nginx-nodeport-service
  annotations:
    alb.ingress.kubernetes.io/healthcheck-path: /app1/index.html
spec:
  type: NodePort
  selector:
    app: app1-nginx
  ports:
    - port: 80
      targetPort: 80
```

### Path Types Explained

- **Prefix**: Matches the beginning of the path
  - `/app1` matches `/app1`, `/app1/`, `/app1/anything`
  - Most commonly used for microservices routing

- **Exact**: Requires exact path match
  - `/app1` matches only `/app1`, not `/app1/`
  - Use for specific endpoints

- **ImplementationSpecific**: Depends on the Ingress controller
  - For ALB, behaves similar to Prefix

### Important Configuration Notes

1. **Path Order**: In path-based routing, order matters. More specific paths should come before generic ones.
   - Correct: `/app1`, `/app2`, then `/` (default)
   - Incorrect: `/` first (would match everything)

2. **Health Check Paths**: When using multiple target groups, specify health check paths at the service level using annotations.

3. **Default Backend**: Always configure a default backend for unmatched paths.

4. **Path Rewriting**: ALB does NOT automatically rewrite paths. Applications must handle their context paths.

## Features

### Path-Based Routing
- Route different URL paths to different backend services
- Support for prefix and exact path matching
- Default backend for unmatched routes
- Efficient traffic distribution

### ALB Optimization
- Single ALB for multiple services (cost savings)
- Multiple target groups per ALB
- Independent health checks per target group
- Consolidated SSL/TLS termination point

### Flexible Architecture
- Easy to add new services/paths
- Independent scaling of backend services
- Service isolation with shared entry point
- Support for blue/green deployments per path

### Health Monitoring
- Per-service health check configuration
- Customizable health check paths
- Independent target group health status
- Automatic unhealthy target removal

## Troubleshooting

### Path Not Routing Correctly

**Issue**: Requests to `/app1` return 404 or route to wrong service

**Solutions**:
```bash
# Check ingress rules
kubectl describe ingress ingress-cpr

# Verify service endpoints
kubectl get endpoints app1-nginx-nodeport-service

# Test service directly
kubectl port-forward svc/app1-nginx-nodeport-service 8080:80
curl http://localhost:8080/app1/

# Check ALB listener rules in AWS Console
# Each path should have a corresponding rule
```

### Application 404 Errors

**Issue**: ALB routes correctly but application returns 404

**Cause**: Application not configured to handle context path

**Solutions**:
```bash
# Ensure application serves content at the context path
# For NGINX, content should be at /app1/index.html, not just /index.html

# Verify content in pod
kubectl exec -it <pod-name> -- ls /usr/share/nginx/html/app1/

# Update application to handle context paths or use URL rewriting
```

### Health Checks Failing for Specific Path

**Issue**: One service's targets are unhealthy

**Solutions**:
```bash
# Check health check path annotation on service
kubectl get svc app1-nginx-nodeport-service -o yaml | grep healthcheck

# Verify health check path exists in application
kubectl exec -it <pod-name> -- curl http://localhost/app1/index.html

# Check service-level health check configuration
kubectl describe svc app1-nginx-nodeport-service

# Review ALB target group health in AWS Console
```

### Default Backend Not Working

**Issue**: Unmatched paths return 404 instead of routing to default backend

**Solutions**:
```bash
# Verify defaultBackend is configured in ingress
kubectl get ingress ingress-cpr -o yaml | grep -A5 defaultBackend

# Check default backend service exists
kubectl get svc app3-nginx-nodeport-service

# Test default backend service directly
kubectl port-forward svc/app3-nginx-nodeport-service 8080:80
curl http://localhost:8080/
```

### Multiple Target Groups Not Created

**Issue**: ALB created but only one target group exists

**Solutions**:
```bash
# Verify multiple paths in ingress rules
kubectl get ingress ingress-cpr -o yaml

# Check LBC logs for errors
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Ensure services are properly referenced
kubectl get svc

# Verify IngressClass is correctly set
kubectl get ingress ingress-cpr -o jsonpath='{.spec.ingressClassName}'
```

### Path Priority Issues

**Issue**: Root path `/` matches before specific paths

**Solutions**:
```bash
# Reorder paths in ingress (most specific first)
# Edit ingress manifest to put specific paths before generic ones

# If using defaultBackend, it handles unmatched paths
# Don't use path: / in rules when defaultBackend is configured

# Check effective rules in ALB Console
# Rules should have appropriate priority numbers
```

## Best Practices

### Path Design
1. **Consistent Naming**: Use clear, consistent path prefixes (e.g., `/api/v1`, `/app1`)
2. **Avoid Conflicts**: Ensure paths don't overlap (e.g., `/app` and `/app1`)
3. **Document Paths**: Maintain documentation of all path mappings
4. **Version APIs**: Include version in API paths (`/api/v1`, `/api/v2`)

### Application Configuration
1. **Context Path Awareness**: Applications must handle their base path
2. **Relative URLs**: Use relative URLs in applications for portability
3. **Health Endpoints**: Provide health check endpoints at known paths
4. **Error Handling**: Implement proper 404 handling in applications

### Performance
1. **Path Ordering**: Order paths by expected traffic (most frequent first)
2. **Cache Headers**: Configure appropriate caching for static content
3. **Connection Pooling**: Leverage keep-alive connections
4. **Compression**: Enable compression for text-based content

### Security
1. **Path Validation**: Validate and sanitize path parameters
2. **Authentication**: Implement authentication at application level
3. **Rate Limiting**: Use AWS WAF for rate limiting if needed
4. **HTTPS**: Always use HTTPS in production (see SSL examples)


### Monitoring and Operations
1. **Metrics**: Monitor per-path metrics in CloudWatch
2. **Logging**: Enable ALB access logs for troubleshooting
3. **Alerts**: Set up alerts for target health and error rates
4. **Testing**: Implement automated tests for each path
5. **Documentation**: Document path-to-service mappings

### Terraform Best Practices
1. **Module Separation**: Keep deployments modular and reusable
2. **Variable Validation**: Validate path formats in variables
3. **Output Values**: Export ALB DNS and target group ARNs
4. **State Management**: Use remote state with proper locking
5. **Resource Naming**: Use consistent naming conventions
