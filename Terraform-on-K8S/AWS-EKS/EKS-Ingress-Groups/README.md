# EKS Ingress Groups

## Overview

This project demonstrates ALB Ingress Groups on Amazon EKS, a powerful pattern that allows multiple Kubernetes Ingress resources to share a single Application Load Balancer. Instead of creating separate ALBs for each Ingress, you can group related Ingresses together to share the same ALB, significantly reducing costs and simplifying infrastructure management.

The implementation features:
- Multiple Ingress resources sharing a single ALB
- Ingress group name for ALB sharing
- Group order for rule priority management
- Different routing paths for each Ingress
- SSL/TLS with certificate discovery
- External DNS integration per Ingress
- Cost-optimized architecture

This pattern is ideal for microservices architectures where you have many services that need external exposure but want to minimize the number of load balancers for cost efficiency and simplified management.

## Architecture

### Components

1. **Single Shared ALB**: One Application Load Balancer for multiple Ingresses
2. **Multiple Ingress Resources**: Each service has its own Ingress
3. **Ingress Group Configuration**: Groups Ingresses using group.name annotation
4. **Priority-Based Routing**: Order managed via group.order annotation
5. **External DNS**: Each Ingress can have its own DNS records
6. **Shared SSL Certificate**: Single wildcard certificate for all services

### Traffic Flow

```
Internet
    |
    | DNS: ingress-groups-demo601.rezaops.com (single domain for all)
    v
Single Shared ALB (ingress-groups-demo)
    |
    ├─ Priority 10: /app1 -> app1-ingress -> app1-service -> app1-pods
    ├─ Priority 20: /app2 -> app2-ingress -> app2-service -> app2-pods
    └─ Priority 30: /app3 -> app3-ingress -> app3-service -> app3-pods
```

### Ingress Group Architecture

```
ALB: ingress-groups-demo
│
├── Ingress 1: app1-ingress
│   ├── Group Name: myapps.web
│   ├── Group Order: 10 (highest priority)
│   └── Path: /app1
│
├── Ingress 2: app2-ingress
│   ├── Group Name: myapps.web (same group)
│   ├── Group Order: 20
│   └── Path: /app2
│
└── Ingress 3: app3-ingress
    ├── Group Name: myapps.web (same group)
    ├── Group Order: 30
    └── Path: /app3 or default
```

### Rule Priority Logic

```
Lower group.order = Higher priority

group.order: 10  -> ALB Rule Priority: 1 (evaluated first)
group.order: 20  -> ALB Rule Priority: 2
group.order: 30  -> ALB Rule Priority: 3 (evaluated last)

Important: More specific paths should have lower group.order
```

## Prerequisites

### Required Tools
- AWS CLI configured with appropriate credentials
- kubectl (v1.21+)
- Terraform (v1.0+)
- Domain registered in Route53

### AWS Resources
- Existing EKS cluster with worker nodes
- Route53 hosted zone for your domain
- ACM certificate (wildcard recommended)
- AWS Load Balancer Controller installed
- External DNS controller installed
- IAM permissions for ALB, Route53, and ACM

### Knowledge Requirements
- Understanding of Kubernetes Ingress
- ALB listener rules and priorities
- Ingress group concepts
- Path-based routing patterns

## Project Structure

```
EKS-Ingress-Groups/
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
├── ingress-groups-terraform-manifests/ # Ingress groups configuration
│   ├── c1-versions.tf                  # Terraform versions
│   ├── c2-remote-state-datasource.tf   # Reference to cluster state
│   ├── c3-providers.tf                 # Kubernetes provider
│   ├── c4-kubernetes-app1-deployment.tf    # App1 deployment
│   ├── c5-kubernetes-app2-deployment.tf    # App2 deployment
│   ├── c6-kubernetes-app3-deployment.tf    # App3 deployment
│   ├── c7-kubernetes-app1-nodeport-service.tf  # App1 service
│   ├── c8-kubernetes-app2-nodeport-service.tf  # App2 service
│   ├── c9-kubernetes-app3-nodeport-service.tf  # App3 service
│   ├── c10-kubernetes-app1-ingress-service.tf  # App1 ingress (group.order: 10)
│   ├── c11-kubernetes-app2-ingress-service.tf  # App2 ingress (group.order: 20)
│   ├── c12-kubernetes-app3-ingress-service.tf  # App3 ingress (group.order: 30)
│   ├── c13-acm-certificate.tf          # ACM certificate
│   └── listen-ports/listen-ports.json  # ALB listener configuration
│
└── kube-manifests-ingress-groups/      # Pure Kubernetes manifests
    ├── app1/
    │   ├── 01-Nginx-App1-Deployment-and-NodePortService.yml
    │   └── 02-App1-Ingress.yml
    ├── app2/
    │   ├── 01-Nginx-App2-Deployment-and-NodePortService.yml
    │   └── 02-App2-Ingress.yml
    └── app3/
        ├── 01-Nginx-App3-Deployment-and-NodePortService.yml
        └── 02-App3-Ingress.yml
```

## Usage

### Step 1: Create ACM Certificate

```bash
# Create wildcard certificate
aws acm request-certificate \
  --domain-name "*.rezaops.com" \
  --validation-method DNS \
  --region us-east-1

# Validate certificate and wait for ISSUED status
aws acm wait certificate-validated \
  --certificate-arn <cert-arn> \
  --region us-east-1
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

kubectl get deployment -n kube-system aws-load-balancer-controller
```

### Step 4: Install External DNS

```bash
cd ../externaldns-install-terraform-manifests/
terraform init
terraform apply -auto-approve

kubectl get deployment external-dns
```

### Step 5: Deploy Ingress Groups

```bash
cd ../ingress-groups-terraform-manifests/

terraform init
terraform apply -auto-approve

# Verify all three ingresses created
kubectl get ingress
# Should show: app1-ingress, app2-ingress, app3-ingress

# Verify they all reference the same ALB
kubectl get ingress -o wide
# All should show same ADDRESS (ALB DNS)
```

### Step 6: Verify Single ALB for Multiple Ingresses

```bash
# Check that only ONE ALB was created despite 3 ingresses
kubectl get ingress

# All ingresses should have the SAME address
# Example:
# NAME           ADDRESS
# app1-ingress   abc123.us-east-1.elb.amazonaws.com
# app2-ingress   abc123.us-east-1.elb.amazonaws.com  # <-- Same ALB
# app3-ingress   abc123.us-east-1.elb.amazonaws.com  # <-- Same ALB

# Verify in AWS Console
# - Navigate to EC2 > Load Balancers
# - Should see only ONE ALB: ingress-groups-demo

# Check ALB listener rules
# Should see multiple rules with different priorities
```

### Step 7: Verify Group Configuration

```bash
# Check group annotations in each ingress
kubectl get ingress app1-ingress -o yaml | grep -A2 group
# Should show:
# alb.ingress.kubernetes.io/group.name: myapps.web
# alb.ingress.kubernetes.io/group.order: '10'

kubectl get ingress app2-ingress -o yaml | grep -A2 group
# Should show:
# alb.ingress.kubernetes.io/group.name: myapps.web
# alb.ingress.kubernetes.io/group.order: '20'

kubectl get ingress app3-ingress -o yaml | grep -A2 group
# Should show:
# alb.ingress.kubernetes.io/group.name: myapps.web
# alb.ingress.kubernetes.io/group.order: '30'
```

### Step 8: Test Path Routing

```bash
# Get shared ALB DNS
ALB_DNS=$(kubectl get ingress app1-ingress \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo "Shared ALB DNS: $ALB_DNS"

# Test app1 path (group.order: 10 - priority 1)
curl https://ingress-groups-demo601.rezaops.com/app1
# Expected: Response from app1

# Test app2 path (group.order: 20 - priority 2)
curl https://ingress-groups-demo601.rezaops.com/app2
# Expected: Response from app2

# Test app3 path (group.order: 30 - priority 3)
curl https://ingress-groups-demo601.rezaops.com/app3
# Expected: Response from app3

# All requests use the SAME ALB
```

### Step 9: Verify ALB Rules and Priorities

```bash
# Get ALB ARN
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --query "LoadBalancers[?DNSName=='$ALB_DNS'].LoadBalancerArn" \
  --output text)

# Get listener ARN
LISTENER_ARN=$(aws elbv2 describe-listeners \
  --load-balancer-arn $ALB_ARN \
  --query 'Listeners[?Protocol==`HTTPS`].ListenerArn' \
  --output text)

# List all rules and their priorities
aws elbv2 describe-rules \
  --listener-arn $LISTENER_ARN \
  --query 'Rules[*].[Priority,Conditions[0].Values[0]]' \
  --output table

# Should show:
# Priority 1 -> /app1 (group.order: 10)
# Priority 2 -> /app2 (group.order: 20)
# Priority 3 -> /app3 (group.order: 30)
```

### Step 10: Test Adding/Removing Ingresses

```bash
# Delete one ingress
kubectl delete ingress app3-ingress

# Verify ALB still exists (serving app1 and app2)
kubectl get ingress
curl https://ingress-groups-demo601.rezaops.com/app1  # Still works
curl https://ingress-groups-demo601.rezaops.com/app2  # Still works

# Recreate ingress
kubectl apply -f app3-ingress.yaml

# Verify it rejoins the group
kubectl get ingress app3-ingress -o wide
# Should show same ALB DNS
```

### Step 11: Clean Up

```bash
cd ingress-groups-terraform-manifests/
terraform destroy -auto-approve

# ALB will be deleted when ALL ingresses in the group are deleted

cd ../externaldns-install-terraform-manifests/
terraform destroy -auto-approve

cd ../lbc-install-terraform-manifests/
terraform destroy -auto-approve

cd ../ekscluster-terraform-manifests/
terraform destroy -auto-approve
```

## Configuration

### Ingress with Group Configuration

```yaml
# App1 Ingress - Highest Priority
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app1-ingress
  annotations:
    # Core Settings
    alb.ingress.kubernetes.io/scheme: internet-facing

    # Load Balancer Name (must be same for all ingresses in group)
    alb.ingress.kubernetes.io/load-balancer-name: ingress-groups-demo

    # Ingress Group Configuration
    alb.ingress.kubernetes.io/group.name: myapps.web     # Group identifier
    alb.ingress.kubernetes.io/group.order: '10'          # Priority (lower = higher priority)

    # Health Checks
    alb.ingress.kubernetes.io/healthcheck-protocol: HTTP
    alb.ingress.kubernetes.io/healthcheck-port: traffic-port
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: '15'
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: '5'
    alb.ingress.kubernetes.io/success-codes: '200'
    alb.ingress.kubernetes.io/healthy-threshold-count: '2'
    alb.ingress.kubernetes.io/unhealthy-threshold-count: '2'

    # SSL Settings (shared across all ingresses in group)
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}, {"HTTP":80}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'

    # External DNS (can be same or different for each ingress)
    external-dns.alpha.kubernetes.io/hostname: ingress-groups-demo601.rezaops.com

spec:
  ingressClassName: my-aws-ingress-class
  # TLS certificate discovery
  tls:
  - hosts:
    - "*.rezaops.com"
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

```yaml
# App2 Ingress - Medium Priority
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app2-ingress
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/load-balancer-name: ingress-groups-demo  # Same name

    # Same group name as app1
    alb.ingress.kubernetes.io/group.name: myapps.web
    alb.ingress.kubernetes.io/group.order: '20'  # Lower priority than app1

    # ... other annotations ...
    external-dns.alpha.kubernetes.io/hostname: ingress-groups-demo601.rezaops.com

spec:
  ingressClassName: my-aws-ingress-class
  tls:
  - hosts:
    - "*.rezaops.com"
  rules:
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

### Group Annotations Explained

```yaml
# Group Name - Identifies which ingresses share an ALB
alb.ingress.kubernetes.io/group.name: myapps.web
# - All ingresses with same group.name share one ALB
# - Can be any string (e.g., "production", "myapps.web", "team-a")
# - Ingresses with different group.name get separate ALBs

# Group Order - Controls rule priority (evaluation order)
alb.ingress.kubernetes.io/group.order: '10'
# - Lower number = Higher priority = Evaluated first
# - Range: Any integer (use 10, 20, 30 for easy insertion)
# - Important for overlapping path patterns
# - Must be string (in quotes)

# Load Balancer Name - Must be identical for all in group
alb.ingress.kubernetes.io/load-balancer-name: ingress-groups-demo
# - All ingresses in group MUST have same LB name
# - If different names, ingresses won't share ALB
```

### Priority and Order Best Practices

```yaml
# Use multiples of 10 for easy insertion
app1: group.order: '10'   # First (highest priority)
app2: group.order: '20'   # Second
app3: group.order: '30'   # Third

# If you need to insert between app1 and app2 later:
new-app: group.order: '15'

# More specific paths should have lower group.order:
# CORRECT:
- group.order: '10', path: /api/v1/users        # More specific
- group.order: '20', path: /api/v1              # Less specific
- group.order: '30', path: /api                 # Least specific

# INCORRECT:
- group.order: '30', path: /api/v1/users        # Would never match!
- group.order: '20', path: /api/v1              # /api matches first
- group.order: '10', path: /api                 # Catches everything
```

### Shared vs Per-Ingress Settings

```yaml
# Settings Shared Across All Ingresses in Group:
# - ALB scheme (internet-facing/internal)
# - Listen ports
# - SSL certificates
# - Load balancer attributes
# - Subnet configuration

# Settings Per Individual Ingress:
# - Routing rules (paths/hosts)
# - Backend services
# - Health check paths (service-level)
# - Group order
# - External DNS hostnames (can be different)
```

## Features


### Flexible Routing
- Multiple ingresses with different routing rules
- Priority-based rule evaluation
- Support for both path and host-based routing
- Easy to add/remove services

### Independent Service Management
- Each service maintains its own Ingress resource
- GitOps friendly (separate manifests per service)
- Independent service deployments
- Team-based ownership of Ingresses

### Rule Priority Control
- Explicit priority via group.order
- Predictable evaluation order
- Easy to insert new rules
- Prevents rule conflicts

### Simplified Operations
- Single ALB to monitor
- Consolidated metrics and logs
- Easier security group management
- Simplified DNS management

## Troubleshooting

### Multiple ALBs Created Instead of One

**Issue**: Each Ingress creates its own ALB

**Solutions**:
```bash
# Verify group.name is IDENTICAL across all ingresses
kubectl get ingress app1-ingress -o yaml | grep group.name
kubectl get ingress app2-ingress -o yaml | grep group.name
# Must be exactly the same (case-sensitive)

# Verify load-balancer-name is IDENTICAL
kubectl get ingress -o yaml | grep load-balancer-name
# All must have same name

# Check for typos
# "myapps.web" ≠ "myapps.Web" ≠ "myapps-web"

# Verify IngressClass is the same
kubectl get ingress -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.ingressClassName}{"\n"}{end}'
```

### Wrong Rule Priority

**Issue**: Rules evaluated in wrong order

**Solutions**:
```bash
# Check group.order values
kubectl get ingress -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.metadata.annotations.alb\.ingress\.kubernetes\.io/group\.order}{"\n"}{end}'

# Lower group.order = Higher priority = Evaluated first
# Ensure more specific paths have lower order

# Verify ALB rules match expected priority
aws elbv2 describe-rules --listener-arn <listener-arn> \
  --query 'Rules[*].[Priority,Conditions]'

# If incorrect, update group.order annotations
kubectl annotate ingress app1-ingress \
  alb.ingress.kubernetes.io/group.order='10' --overwrite
```

### Path Not Routing Correctly

**Issue**: Requests to path go to wrong service

**Solutions**:
```bash
# Verify path patterns in each ingress
kubectl get ingress -o yaml | grep -A5 "path:"

# Check for overlapping paths
# Example conflict:
# ingress1: path: /app, order: 20
# ingress2: path: /app/api, order: 10
# Solution: /app/api (order 10) should be first

# Test specific path
curl -v https://<domain>/app1

# Check ALB listener rules
aws elbv2 describe-rules --listener-arn <listener-arn>

# Verify target groups are correct
kubectl describe ingress app1-ingress | grep -A10 backends
```

### Ingress Not Joining Group

**Issue**: New Ingress creates separate ALB

**Solutions**:
```bash
# Verify group.name annotation exists and matches
kubectl get ingress new-ingress -o yaml | grep "group.name"

# Check if load-balancer-name matches existing group
kubectl get ingress existing-ingress -o yaml | grep load-balancer-name
kubectl get ingress new-ingress -o yaml | grep load-balancer-name

# Ensure scheme matches (internet-facing vs internal)
kubectl get ingress -o yaml | grep scheme
# Cannot mix internet-facing and internal in same group

# Check LBC logs for errors
kubectl logs -n kube-system deployment/aws-load-balancer-controller | grep -i group

# Delete and recreate ingress with correct annotations
kubectl delete ingress new-ingress
kubectl apply -f new-ingress.yaml
```

### ALB Not Deleted When Removing Ingresses

**Issue**: ALB remains after deleting some ingresses

**Solutions**:
```bash
# This is expected behavior!
# ALB is deleted only when ALL ingresses in the group are deleted

# Check remaining ingresses in group
kubectl get ingress \
  -o jsonpath='{range .items[?(@.metadata.annotations.alb\.ingress\.kubernetes\.io/group\.name=="myapps.web")]}{.metadata.name}{"\n"}{end}'

# To delete ALB, delete all ingresses in the group
kubectl delete ingress app1-ingress app2-ingress app3-ingress

# Or delete by label if you tagged them
kubectl delete ingress -l group=myapps
```

### Conflicting Annotations Across Group

**Issue**: Different SSL or listener settings

**Solutions**:
```bash
# Core settings must be identical across group:
# - scheme
# - listen-ports
# - certificate-arn (if specified)

# Check for conflicts
kubectl get ingress -o yaml | grep -E "scheme|listen-ports|certificate-arn"

# Fix by making annotations identical
# Use the same annotations for shared settings

# Settings that CAN differ:
# - group.order (must differ)
# - external-dns.alpha.kubernetes.io/hostname
# - healthcheck paths (service-level)
```

## Best Practices

### Group Design
1. **Logical Grouping**: Group related services (e.g., all production APIs)
2. **Environment Separation**: Separate groups for dev/staging/prod
3. **Team Boundaries**: Consider team ownership boundaries
4. **Naming Convention**: Use descriptive group names (e.g., "prod.apis", "internal.services")
5. **Group Size**: Limit to 10-15 services per group for manageable complexity

### Order Management
1. **Use Increments of 10**: 10, 20, 30, etc. for easy insertion
2. **Document Priorities**: Maintain documentation of order assignments
3. **Specific First**: More specific paths get lower order numbers
4. **Leave Gaps**: Don't use consecutive numbers (1, 2, 3)
5. **Review Regularly**: Audit priorities as services are added

### Configuration Consistency
1. **Shared Annotations**: Document which annotations must be identical
2. **Templates**: Use templates or Helm charts for consistency
3. **Validation**: Implement CI/CD checks for group annotation consistency
4. **Documentation**: Document the shared group configuration
5. **Change Management**: Coordinate changes to shared settings

### Security
1. **Scheme Consistency**: All in group must use same scheme (internet-facing/internal)
2. **SSL Certificates**: Use shared wildcard certificate
3. **Security Groups**: Managed automatically but review regularly
4. **Separate Groups**: Use different groups for different security zones
5. **Access Control**: RBAC for who can modify group ingresses

### Cost Management
1. **Maximize Sharing**: Group as many services as practical
2. **Monitor Costs**: Track ALB costs vs number of services
3. **Right-Size Groups**: Balance cost savings vs complexity
4. **Delete Unused**: Remove ingresses for deprecated services
5. **Audit Regularly**: Review group membership quarterly

### Operations
1. **Monitoring**: Monitor single ALB for all services in group
2. **Logging**: Centralized ALB logs for all services
3. **Alerting**: Set up alerts for group ALB health
4. **Testing**: Test impact of adding/removing ingresses
5. **Rollback Plan**: Have procedure to separate services if needed
6. **Documentation**: Document group membership and purposes

### GitOps and IaC
1. **Separate Files**: One file per Ingress for independent management
2. **Consistent Naming**: Use naming convention for related ingresses
3. **Validation**: CI/CD pipelines validate group consistency
4. **Automation**: Automate group.order assignment
5. **Review Process**: Require review for group membership changes
