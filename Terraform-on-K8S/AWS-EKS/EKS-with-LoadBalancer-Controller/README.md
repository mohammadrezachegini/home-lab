# AWS Load Balancer Controller for EKS

This project installs and configures the AWS Load Balancer Controller on EKS, enabling automatic provisioning of Application Load Balancers (ALB) and Network Load Balancers (NLB) for Kubernetes Ingress and Service resources.

## Overview

The AWS Load Balancer Controller manages AWS Elastic Load Balancers for a Kubernetes cluster:
- **ALB** for Kubernetes Ingress resources
- **NLB** for Kubernetes Service resources with type LoadBalancer
- Automatic target registration and health checks
- Integration with AWS services (WAF, Shield, ACM)

## Architecture

```
Kubernetes Ingress/Service
        ↓
AWS Load Balancer Controller
        ↓
    AWS ELB API
        ↓
ALB / NLB (auto-created)
        ↓
    EKS Pods
```

## Prerequisites

- Existing EKS cluster
- Terraform >= 1.0
- kubectl configured
- OIDC provider enabled on EKS cluster
- VPC with proper subnet tags

## What Gets Installed

- AWS Load Balancer Controller deployment
- IAM role with required permissions (via IRSA)
- CRDs (Custom Resource Definitions)
- Webhooks for validation
- Service account with IAM role annotation

## Required VPC Subnet Tags

### Public Subnets (for internet-facing load balancers)
```
kubernetes.io/role/elb = 1
kubernetes.io/cluster/<cluster-name> = shared
```

### Private Subnets (for internal load balancers)
```
kubernetes.io/role/internal-elb = 1
kubernetes.io/cluster/<cluster-name> = shared
```

## Installation Methods

This project provides installation via:
1. **Helm** (recommended)
2. **Kubernetes manifests**

## Project Structure

```
├── lbc-install-terraform-manifests/
│   ├── c1-versions.tf                  # Providers
│   ├── c2-remote-state-datasource.tf   # EKS cluster reference
│   ├── c3-iam-policy.tf                # IAM policy for controller
│   ├── c4-iam-role.tf                  # IAM role with IRSA
│   ├── c5-helm-provider.tf             # Helm provider config
│   ├── c6-lbc-helm-install.tf          # Controller installation
│   └── c7-outputs.tf                   # Installation outputs
└── ekscluster-terraform-manifests/
    └── (EKS cluster with OIDC provider)
```

## Usage

### 1. Ensure EKS Cluster is Ready

```bash
# Verify OIDC provider exists
aws eks describe-cluster --name <cluster-name> \
  --query "cluster.identity.oidc.issuer" \
  --output text

# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name <cluster-name>
```

### 2. Deploy Load Balancer Controller

```bash
cd lbc-install-terraform-manifests
terraform init
terraform apply
```

### 3. Verify Installation

```bash
# Check controller pods
kubectl get pods -n kube-system | grep aws-load-balancer-controller

# Check logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Verify CRDs
kubectl get crd | grep elbv2
```

## Controller Configuration

### IAM Policy

The controller requires these permissions:
- Elastic Load Balancing (create, modify, delete)
- EC2 (describe instances, security groups, subnets)
- ACM (describe certificates)
- WAF (associate web ACL)
- Shield (get subscription state)

### Helm Values

```hcl
resource "helm_release" "aws_lbc" {
  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  namespace  = "kube-system"

  set {
    name  = "clusterName"
    value = var.cluster_name
  }

  set {
    name  = "serviceAccount.create"
    value = "true"
  }

  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = aws_iam_role.lbc.arn
  }

  set {
    name  = "region"
    value = var.aws_region
  }

  set {
    name  = "vpcId"
    value = var.vpc_id
  }
}
```

## Usage with Ingress

### Basic Ingress Example

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
spec:
  rules:
    - http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: myapp-service
                port:
                  number: 80
```

### Test Ingress Creation

```bash
# Apply sample ingress
kubectl apply -f sample-ingress.yaml

# Get ALB address
kubectl get ingress myapp-ingress

# Check controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller --follow
```

## Usage with Service (NLB)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-nlb
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "external"
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: "ip"
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internet-facing"
spec:
  type: LoadBalancer
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 8080
```

## Common Annotations

### Ingress Annotations

| Annotation | Description | Values |
|------------|-------------|--------|
| `alb.ingress.kubernetes.io/scheme` | Load balancer scheme | internet-facing, internal |
| `alb.ingress.kubernetes.io/target-type` | Target type | ip, instance |
| `alb.ingress.kubernetes.io/certificate-arn` | ACM certificate | ARN |
| `alb.ingress.kubernetes.io/ssl-redirect` | Redirect HTTP to HTTPS | "443" |
| `alb.ingress.kubernetes.io/group.name` | Share ALB | any-name |

### Service Annotations

| Annotation | Description | Values |
|------------|-------------|--------|
| `service.beta.kubernetes.io/aws-load-balancer-type` | LB type | external, nlb-ip |
| `service.beta.kubernetes.io/aws-load-balancer-scheme` | LB scheme | internet-facing, internal |
| `service.beta.kubernetes.io/aws-load-balancer-nlb-target-type` | Target type | ip, instance |

## Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS Region | us-east-1 |
| `cluster_name` | EKS cluster name | - |
| `vpc_id` | VPC ID | - |

## Outputs

- IAM role ARN for load balancer controller
- Service account name
- Helm release status

## Features

### ALB Features
- Path-based routing
- Host-based routing
- SSL/TLS termination
- HTTP to HTTPS redirect
- WAF integration
- Authentication (OIDC, Cognito)

### NLB Features
- TCP/UDP support
- Static IP addresses
- PrivateLink support
- Cross-zone load balancing
- TLS termination

## Troubleshooting

### Controller Pods Not Running

```bash
# Check pod status
kubectl get pods -n kube-system | grep aws-load-balancer

# Describe pod
kubectl describe pod -n kube-system <pod-name>

# Check events
kubectl get events -n kube-system
```

### IAM Permission Issues

```bash
# Verify service account annotation
kubectl describe sa aws-load-balancer-controller -n kube-system

# Check IAM role
aws iam get-role --role-name <role-name>

# Test IRSA
kubectl run test --image=amazon/aws-cli --rm -it -- sts get-caller-identity
```

### Load Balancer Not Created

```bash
# Check controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Verify ingress
kubectl describe ingress <ingress-name>

# Check subnet tags
aws ec2 describe-subnets --filters "Name=vpc-id,Values=<vpc-id>"
```

### Certificate Issues

```bash
# Verify ACM certificate exists
aws acm list-certificates --region us-east-1

# Check certificate ARN in annotation
kubectl get ingress <name> -o yaml
```

## Best Practices

1. **Use IP Mode** - Better for pod networking with CNI
2. **Group Ingresses** - Share ALB across multiple ingresses
3. **Enable Access Logs** - For debugging and compliance
4. **Use SSL Certificates** - Always use HTTPS in production
5. **Set Resource Limits** - Limit controller pod resources
6. **Monitor Controller** - Watch logs and metrics



## Cleanup

```bash
# Delete ingresses first (removes ALBs)
kubectl delete ingress --all

# Uninstall controller
terraform destroy
```
