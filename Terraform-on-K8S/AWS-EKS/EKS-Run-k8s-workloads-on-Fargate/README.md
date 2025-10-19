# EKS - Running Kubernetes Workloads on Fargate

## Overview

This project demonstrates how to deploy and run production Kubernetes workloads on AWS Fargate using Amazon EKS. It extends the basic Fargate profile setup by showing real-world application deployments, including multi-tier applications with ALB ingress, HTTPS/TLS termination, and DNS management. The project includes both declarative Kubernetes manifests and Terraform-managed deployments targeting Fargate compute.

Unlike the basic Fargate profile setup, this project focuses on the complete application lifecycle - from deployment to exposure via Application Load Balancer with proper networking configuration (IP target type), SSL/TLS certificates, and automatic DNS record creation using ExternalDNS.

## Architecture

This project provisions a complete application stack running on Fargate:

```
Internet
    |
    v
Route53 DNS (ExternalDNS)
    |
    v
Application Load Balancer (ALB)
    |
    +-- HTTPS:443 (SSL/TLS Termination)
    +-- HTTP:80 (Redirect to HTTPS)
    |
    v
ALB Ingress Controller
    |
    +-- Path: /app1 --> App1 ClusterIP Service (Port 80)
    +-- Path: /app2 --> App2 ClusterIP Service (Port 80)
    +-- Default    --> App3 ClusterIP Service (Port 80)
    |
    v
Fargate Pods (fp-ns-app1 namespace)
    |
    +-- App1 Nginx Deployment (1 replica)
    +-- App2 Nginx Deployment (1 replica)
    +-- App3 Nginx Deployment (1 replica)

Infrastructure Components:
├── EKS Cluster
│   ├── Managed Node Groups (EC2)
│   └── Fargate Profile (fp-ns-app1)
├── VPC (Multi-AZ)
│   ├── Public Subnets
│   └── Private Subnets (Fargate Pods)
├── IAM Roles
│   ├── Fargate Pod Execution Role
│   ├── LBC Service Account Role
│   └── ExternalDNS Service Account Role
└── ACM Certificate (SSL/TLS)
```

### Key Networking Flow

1. **DNS Resolution**: Route53 resolves domain to ALB
2. **SSL Termination**: ALB terminates HTTPS traffic
3. **Ingress Routing**: Path-based routing to appropriate service
4. **Service Discovery**: ClusterIP service routes to pod IPs
5. **Pod Communication**: Direct pod IP addressing (IP target type)

## Prerequisites

### Required Tools

- **Terraform**: >= 1.0
- **AWS CLI**: >= 2.0, configured with credentials
- **kubectl**: >= 1.21
- **eksctl**: (Optional) For additional cluster management
- **curl**: For testing endpoints

### AWS Requirements

- **AWS Account** with appropriate permissions
- **IAM Permissions** to create:
  - EKS clusters and Fargate profiles
  - VPC resources (subnets, route tables, NAT gateways)
  - IAM roles and policies
  - EC2 instances and security groups
  - Application Load Balancers
  - Route53 hosted zone and records
  - ACM certificates
  - S3 bucket (for Terraform remote state)

### Domain and Certificate Requirements

- **Route53 Hosted Zone**: For DNS management
- **Domain Name**: Registered domain configured with Route53
- **ACM Certificate**: SSL/TLS certificate for HTTPS (can be created by Terraform)

### Knowledge Prerequisites

- Kubernetes fundamentals (deployments, services, ingress)
- AWS Fargate concepts and limitations
- ALB Ingress Controller functionality
- SSL/TLS certificate management
- DNS and Route53 basics

## Project Structure

```
EKS-Run-k8s-workloads-on-Fargate/
├── ekscluster-terraform-manifests/        # Base EKS cluster
│   ├── c1-versions.tf                     # Terraform and provider versions
│   ├── c2-01-generic-variables.tf         # Common variables
│   ├── c2-02-local-values.tf              # Local computed values
│   ├── c3-02-vpc-module.tf                # VPC configuration
│   ├── c4-05-ec2bastion-instance.tf       # Bastion host
│   ├── c5-03-iamrole-for-eks-cluster.tf   # EKS cluster IAM role
│   ├── c5-04-iamrole-for-eks-nodegroup.tf # Node group IAM role
│   ├── c5-06-eks-cluster.tf               # EKS cluster resource
│   ├── c5-07-eks-node-group-public.tf     # Public node group
│   ├── c5-08-eks-node-group-private.tf    # Private node group
│   ├── c6-02-iam-oidc-connect-provider.tf # OIDC for IRSA
│   ├── c7-01-kubernetes-provider.tf       # Kubernetes provider
│   └── terraform.tfvars, vpc.auto.tfvars, eks.auto.tfvars
│
├── fargate-profiles-terraform-manifests/  # Fargate profile setup
│   ├── c1-versions.tf                     # Provider versions
│   ├── c2-remote-state-datasource.tf      # EKS cluster state reference
│   ├── c3-01-generic-variables.tf         # Variables
│   ├── c4-01-kubernetes-provider.tf       # K8s provider config
│   ├── c4-02-kubernetes-namespace.tf      # fp-ns-app1 namespace
│   ├── c5-01-fargate-profile-iam-role-and-policy.tf  # Pod exec role
│   ├── c5-02-fargate-profile.tf           # Fargate profile
│   └── terraform.tfvars
│
├── lbc-install-terraform-manifests/       # Load Balancer Controller
│   ├── c1-versions.tf
│   ├── c2-remote-state-datasource.tf      # Reference to EKS state
│   ├── c4-01-lbc-datasources.tf           # LBC policy datasource
│   ├── c4-02-lbc-iam-policy-and-role.tf   # IRSA for LBC
│   ├── c4-03-lbc-helm-provider.tf         # Helm provider
│   ├── c4-04-lbc-install.tf               # LBC Helm chart
│   ├── c5-01-kubernetes-provider.tf       # K8s provider
│   └── c5-02-ingress-class.tf             # IngressClass resource
│
├── externaldns-install-terraform-manifests/  # ExternalDNS setup
│   ├── c4-01-externaldns-iam-policy-and-role.tf  # IRSA for ExternalDNS
│   ├── c4-02-externaldns-helm-provider.tf
│   ├── c4-03-externaldns-install.tf       # ExternalDNS Helm chart
│   └── terraform.tfvars
│
├── run-on-fargate-terraform-manifests/    # Application deployment
│   ├── c1-versions.tf
│   ├── c2-remote-state-datasource.tf      # Reference to cluster state
│   ├── c3-providers.tf                    # AWS, K8s providers
│   ├── c4-kubernetes-app1-deployment.tf   # App1 deployment
│   ├── c5-kubernetes-app2-deployment.tf   # App2 deployment
│   ├── c6-kubernetes-app3-deployment.tf   # App3 deployment
│   ├── c7-kubernetes-app1-nodeport-service.tf   # App1 service
│   ├── c8-kubernetes-app2-nodeport-service.tf   # App2 service
│   ├── c9-kubernetes-app3-nodeport-service.tf   # App3 service
│   ├── c10-kubernetes-ingress-service.tf  # Ingress with ALB annotations
│   └── c11-acm-certificate.tf             # SSL/TLS certificate
│
└── kube-manifests-Run-On-Fargate/         # Raw Kubernetes manifests
    ├── 01-Nginx-App1-Deployment-and-ClusterIPService.yml
    ├── 02-Nginx-App2-Deployment-and-ClusterIPService.yml
    ├── 03-Nginx-App3-Deployment-and-ClusterIPService.yml
    └── 04-ALB-Ingress-target-type-ip.yml  # Ingress with IP target
```

## Usage

### Step 1: Deploy Base EKS Cluster

```bash
cd ekscluster-terraform-manifests

# Configure Terraform backend (optional but recommended)
cat > backend.tf <<EOF
terraform {
  backend "s3" {
    bucket = "your-terraform-state-bucket"
    key    = "eks-fargate-workloads/cluster/terraform.tfstate"
    region = "us-east-1"
  }
}
EOF

# Initialize and apply
terraform init
terraform plan
terraform apply -auto-approve

# Update kubeconfig
aws eks update-kubeconfig \
  --region us-east-1 \
  --name hr-dev-eksdemo

# Verify cluster
kubectl get nodes
kubectl get ns
```

### Step 2: Create Fargate Profile

```bash
cd ../fargate-profiles-terraform-manifests

terraform init
terraform plan
terraform apply -auto-approve

# Verify Fargate profile
aws eks describe-fargate-profile \
  --cluster-name hr-dev-eksdemo \
  --fargate-profile-name hr-dev-fp-app1

# Verify namespace
kubectl get namespace fp-ns-app1
```

### Step 3: Install AWS Load Balancer Controller

```bash
cd ../lbc-install-terraform-manifests

# Review and customize terraform.tfvars if needed
terraform init
terraform plan
terraform apply -auto-approve

# Verify LBC installation
kubectl get deployment -n kube-system aws-load-balancer-controller
kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller

# Verify ingress class
kubectl get ingressclass
```

### Step 4: Install ExternalDNS

```bash
cd ../externaldns-install-terraform-manifests

# Update terraform.tfvars with your domain
cat > terraform.tfvars <<EOF
aws_region = "us-east-1"
EOF

terraform init
terraform plan
terraform apply -auto-approve

# Verify ExternalDNS
kubectl get deployment -n external-dns
kubectl logs -n external-dns deployment/external-dns
```

### Step 5: Deploy Applications (Option A: Terraform)

```bash
cd ../run-on-fargate-terraform-manifests

# Update ACM certificate domain in c11-acm-certificate.tf
# Update ingress hostname in c10-kubernetes-ingress-service.tf

terraform init
terraform plan
terraform apply -auto-approve

# Monitor pod creation
kubectl get pods -n fp-ns-app1 -w

# Verify pods are running on Fargate
kubectl get pods -n fp-ns-app1 -o wide
kubectl get nodes -l eks.amazonaws.com/compute-type=fargate
```

### Step 6: Deploy Applications (Option B: Kubernetes Manifests)

```bash
cd ../kube-manifests-Run-On-Fargate

# Update domain in 04-ALB-Ingress-target-type-ip.yml

# Deploy applications
kubectl apply -f 01-Nginx-App1-Deployment-and-ClusterIPService.yml
kubectl apply -f 02-Nginx-App2-Deployment-and-ClusterIPService.yml
kubectl apply -f 03-Nginx-App3-Deployment-and-ClusterIPService.yml

# Deploy ingress
kubectl apply -f 04-ALB-Ingress-target-type-ip.yml

# Monitor ingress creation
kubectl get ingress -n fp-ns-app1 -w
```

### Step 7: Verify Deployment

```bash
# Check all resources in namespace
kubectl get all -n fp-ns-app1

# Check pod details (should show Fargate)
kubectl describe pods -n fp-ns-app1

# Get ingress details
kubectl describe ingress fargate-profile-demo -n fp-ns-app1

# Get ALB DNS name
kubectl get ingress fargate-profile-demo -n fp-ns-app1 \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Check Route53 record (created by ExternalDNS)
aws route53 list-resource-record-sets \
  --hosted-zone-id <your-zone-id> \
  --query "ResourceRecordSets[?Name=='fargate-profile-demo-501.yourdomain.com.']"
```

### Step 8: Test Applications

```bash
# Test via ALB DNS (before DNS propagation)
ALB_DNS=$(kubectl get ingress fargate-profile-demo -n fp-ns-app1 \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

curl -k https://$ALB_DNS/app1/index.html
curl -k https://$ALB_DNS/app2/index.html
curl -k https://$ALB_DNS/

# Test via domain name (after DNS propagation)
curl https://fargate-profile-demo-501.yourdomain.com/app1/index.html
curl https://fargate-profile-demo-501.yourdomain.com/app2/index.html
curl https://fargate-profile-demo-501.yourdomain.com/

# Verify SSL certificate
curl -vI https://fargate-profile-demo-501.yourdomain.com

# Test HTTP to HTTPS redirect
curl -I http://fargate-profile-demo-501.yourdomain.com
```

### Step 9: Monitor and Debug

```bash
# View pod logs
kubectl logs -n fp-ns-app1 -l app=app1-nginx
kubectl logs -n fp-ns-app1 -l app=app2-nginx

# Check LBC logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Check ExternalDNS logs
kubectl logs -n external-dns deployment/external-dns

# Describe ingress for ALB annotations
kubectl describe ingress fargate-profile-demo -n fp-ns-app1

# Check ALB target groups in AWS Console
aws elbv2 describe-target-groups \
  --query 'TargetGroups[?contains(TargetGroupName, `fargate-profile`)].TargetGroupArn' \
  --output text

# Check target health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>
```

### Step 10: Cleanup

```bash
# Delete in reverse order

# Option A: If using Terraform for apps
cd run-on-fargate-terraform-manifests
terraform destroy -auto-approve

# Option B: If using kubectl
kubectl delete -f kube-manifests-Run-On-Fargate/

# Wait for ALB to be deleted
kubectl get ingress -n fp-ns-app1
# Wait until no ingress exists

# Remove ExternalDNS
cd ../externaldns-install-terraform-manifests
terraform destroy -auto-approve

# Remove LBC
cd ../lbc-install-terraform-manifests
terraform destroy -auto-approve

# Remove Fargate profile
cd ../fargate-profiles-terraform-manifests
terraform destroy -auto-approve

# Remove EKS cluster
cd ../ekscluster-terraform-manifests
terraform destroy -auto-approve
```

## Configuration

### Application Deployment Configuration

#### App1 Nginx Deployment (Terraform)

```hcl
# run-on-fargate-terraform-manifests/c4-kubernetes-app1-deployment.tf

resource "kubernetes_deployment_v1" "myapp1" {
  metadata {
    name      = "app1-nginx-deployment"
    namespace = "fp-ns-app1"
    labels = {
      app = "app1-nginx"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "app1-nginx"
      }
    }

    template {
      metadata {
        labels = {
          app = "app1-nginx"
        }
      }

      spec {
        container {
          image = "stacksimplify/kube-nginxapp1:1.0.0"
          name  = "app1-nginx"
          port {
            container_port = 80
          }
        }
      }
    }
  }
}
```

#### App1 Service (ClusterIP with Health Check Annotation)

```hcl
# run-on-fargate-terraform-manifests/c7-kubernetes-app1-nodeport-service.tf

resource "kubernetes_service_v1" "myapp1_np_service" {
  metadata {
    name      = "app1-nginx-clusterip-service"
    namespace = "fp-ns-app1"
    labels = {
      app = "app1-nginx"
    }
    annotations = {
      # Health check path for ALB
      "alb.ingress.kubernetes.io/healthcheck-path" = "/app1/index.html"
    }
  }

  spec {
    type = "ClusterIP"

    selector = {
      app = "app1-nginx"
    }

    port {
      port        = 80
      target_port = 80
    }
  }
}
```

### Ingress Configuration with IP Target Type

```hcl
# run-on-fargate-terraform-manifests/c10-kubernetes-ingress-service.tf

resource "kubernetes_ingress_v1" "ingress" {
  metadata {
    name      = "fargate-profile-demo"
    namespace = "fp-ns-app1"

    annotations = {
      # Load Balancer Name
      "alb.ingress.kubernetes.io/load-balancer-name" = "fargate-profile-demo"

      # Ingress Core Settings
      "alb.ingress.kubernetes.io/scheme" = "internet-facing"

      # Health Check Settings
      "alb.ingress.kubernetes.io/healthcheck-protocol"          = "HTTP"
      "alb.ingress.kubernetes.io/healthcheck-port"              = "traffic-port"
      "alb.ingress.kubernetes.io/healthcheck-interval-seconds"  = 15
      "alb.ingress.kubernetes.io/healthcheck-timeout-seconds"   = 5
      "alb.ingress.kubernetes.io/success-codes"                 = 200
      "alb.ingress.kubernetes.io/healthy-threshold-count"       = 2
      "alb.ingress.kubernetes.io/unhealthy-threshold-count"     = 2

      # SSL Settings
      "alb.ingress.kubernetes.io/listen-ports" = jsonencode([
        { "HTTPS" = 443 },
        { "HTTP" = 80 }
      ])
      "alb.ingress.kubernetes.io/certificate-arn" = aws_acm_certificate.acm_cert.arn

      # SSL Redirect
      "alb.ingress.kubernetes.io/ssl-redirect" = 443

      # ExternalDNS
      "external-dns.alpha.kubernetes.io/hostname" = "fargate-profile-demo-501.yourdomain.com"

      # CRITICAL: IP target type required for Fargate
      "alb.ingress.kubernetes.io/target-type" = "ip"
    }
  }

  spec {
    ingress_class_name = "my-aws-ingress-class"

    # Default backend
    default_backend {
      service {
        name = kubernetes_service_v1.myapp3_np_service.metadata[0].name
        port {
          number = 80
        }
      }
    }

    # Path-based routing
    rule {
      http {
        # /app1 route
        path {
          backend {
            service {
              name = kubernetes_service_v1.myapp1_np_service.metadata[0].name
              port {
                number = 80
              }
            }
          }
          path      = "/app1"
          path_type = "Prefix"
        }

        # /app2 route
        path {
          backend {
            service {
              name = kubernetes_service_v1.myapp2_np_service.metadata[0].name
              port {
                number = 80
              }
            }
          }
          path      = "/app2"
          path_type = "Prefix"
        }
      }
    }
  }
}
```

### ACM Certificate Configuration

```hcl
# run-on-fargate-terraform-manifests/c11-acm-certificate.tf

resource "aws_acm_certificate" "acm_cert" {
  domain_name       = "*.yourdomain.com"
  validation_method = "DNS"

  tags = {
    Name = "fargate-demo-cert"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Note: DNS validation records should be created in Route53
# Either manually or using aws_acm_certificate_validation resource
```

### Kubernetes Manifest Version (YAML)

```yaml
# kube-manifests-Run-On-Fargate/04-ALB-Ingress-target-type-ip.yml

apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: fargate-profile-demo
  namespace: fp-ns-app1
  annotations:
    # Load Balancer Name
    alb.ingress.kubernetes.io/load-balancer-name: fargate-profile-demo

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
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:123456789012:certificate/xxx
    alb.ingress.kubernetes.io/ssl-redirect: '443'

    # External DNS
    external-dns.alpha.kubernetes.io/hostname: fargate-profile-demo-501.yourdomain.com

    # CRITICAL: IP target type for Fargate
    alb.ingress.kubernetes.io/target-type: ip

spec:
  ingressClassName: my-aws-ingress-class
  defaultBackend:
    service:
      name: app3-nginx-clusterip-service
      port:
        number: 80
  rules:
  - http:
      paths:
      - path: /app1
        pathType: Prefix
        backend:
          service:
            name: app1-nginx-clusterip-service
            port:
              number: 80
      - path: /app2
        pathType: Prefix
        backend:
          service:
            name: app2-nginx-clusterip-service
            port:
              number: 80
```

## Features

### 1. Multi-Tier Application Deployment

Deploy multiple applications with path-based routing:
- App1: Accessible via `/app1` path
- App2: Accessible via `/app2` path
- App3: Default backend for root path

### 2. IP Target Type for Fargate

Critical configuration for Fargate pods:
- ALB targets pod IPs directly (not EC2 instances)
- Enables proper health checks and traffic routing
- Required annotation: `alb.ingress.kubernetes.io/target-type: ip`

### 3. HTTPS/TLS Termination

SSL/TLS termination at ALB:
- ACM certificate integration
- HTTP to HTTPS redirect
- Secure end-user communication

### 4. Automatic DNS Management

ExternalDNS integration:
- Automatic Route53 record creation
- DNS record lifecycle management
- Custom domain support

### 5. Health Check Configuration

Granular health check control:
- Service-level health check paths
- Configurable intervals and timeouts
- Proper unhealthy/healthy thresholds

### 6. Path-Based Routing

Intelligent traffic distribution:
- Multiple applications behind single ALB
- URL path-based routing rules
- Default backend configuration

### 7. Namespace Isolation

Application isolation:
- Dedicated `fp-ns-app1` namespace
- Fargate profile namespace selector
- Resource organization

### 8. Terraform and Kubernetes Manifest Options

Flexibility in deployment:
- Terraform-managed resources
- Native Kubernetes manifests
- Choose based on workflow preference

## Troubleshooting

### Issue: Pods Not Running on Fargate

**Symptoms:**
```bash
kubectl get pods -n fp-ns-app1
# Pods running on EC2 nodes instead of Fargate
```

**Diagnosis:**
```bash
# Check pod node assignment
kubectl get pods -n fp-ns-app1 -o wide

# Verify Fargate profile
aws eks describe-fargate-profile \
  --cluster-name hr-dev-eksdemo \
  --fargate-profile-name hr-dev-fp-app1
```

**Solutions:**

1. Verify namespace matches Fargate profile:
```bash
kubectl get namespace fp-ns-app1
```

2. Delete and recreate pods to trigger rescheduling:
```bash
kubectl delete pods --all -n fp-ns-app1
kubectl get pods -n fp-ns-app1 -w
```

3. Check Fargate profile status:
```bash
aws eks describe-fargate-profile \
  --cluster-name hr-dev-eksdemo \
  --fargate-profile-name hr-dev-fp-app1 \
  --query 'fargateProfile.status'
# Should return: "ACTIVE"
```

### Issue: ALB Not Created

**Symptoms:**
```bash
kubectl get ingress -n fp-ns-app1
# No ADDRESS/hostname shown
```

**Diagnosis:**
```bash
# Check LBC logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Check ingress events
kubectl describe ingress fargate-profile-demo -n fp-ns-app1
```

**Common Causes & Solutions:**

1. **LBC not installed:**
```bash
kubectl get deployment -n kube-system aws-load-balancer-controller
# If not found, install LBC
```

2. **Incorrect ingress class:**
```bash
# Check ingress class
kubectl get ingressclass

# Verify ingress uses correct class
kubectl get ingress fargate-profile-demo -n fp-ns-app1 -o yaml | grep ingressClassName
```

3. **IAM permissions missing:**
```bash
# Check LBC service account
kubectl describe sa aws-load-balancer-controller -n kube-system

# Verify IRSA annotation
kubectl get sa aws-load-balancer-controller -n kube-system \
  -o jsonpath='{.metadata.annotations.eks\.amazonaws\.com/role-arn}'
```

### Issue: ALB Health Checks Failing

**Symptoms:**
```bash
# Check target health
aws elbv2 describe-target-health --target-group-arn <arn>
# Shows unhealthy targets
```

**Diagnosis:**
```bash
# Get ALB target group
kubectl describe ingress fargate-profile-demo -n fp-ns-app1

# Check pod logs
kubectl logs -n fp-ns-app1 -l app=app1-nginx

# Test health check path directly
kubectl exec -n fp-ns-app1 <pod-name> -- curl localhost/app1/index.html
```

**Solutions:**

1. **Verify health check path in service annotation:**
```yaml
annotations:
  alb.ingress.kubernetes.io/healthcheck-path: /app1/index.html
```

2. **Ensure IP target type is set:**
```yaml
annotations:
  alb.ingress.kubernetes.io/target-type: ip  # Critical for Fargate
```

3. **Check security group rules:**
```bash
# Get pod security group
kubectl get pod <pod-name> -n fp-ns-app1 -o yaml | grep security

# Verify ALB can reach pods (port 80)
```

4. **Verify pod is actually serving on the path:**
```bash
kubectl exec -n fp-ns-app1 <pod-name> -- sh -c "ls -la /usr/share/nginx/html/app1/"
```

### Issue: HTTPS Not Working

**Symptoms:**
```bash
curl https://fargate-profile-demo-501.yourdomain.com
# SSL certificate error or connection refused
```

**Diagnosis:**
```bash
# Check ACM certificate
aws acm describe-certificate --certificate-arn <cert-arn>

# Verify ingress has certificate ARN
kubectl get ingress fargate-profile-demo -n fp-ns-app1 -o yaml | grep certificate-arn
```

**Solutions:**

1. **Certificate not validated:**
```bash
# Check certificate status
aws acm describe-certificate --certificate-arn <cert-arn> \
  --query 'Certificate.Status'
# Should be: "ISSUED"

# Check validation records in Route53
aws acm describe-certificate --certificate-arn <cert-arn> \
  --query 'Certificate.DomainValidationOptions'
```

2. **Wrong certificate ARN:**
```bash
# Update ingress with correct certificate ARN
kubectl edit ingress fargate-profile-demo -n fp-ns-app1
```

3. **Listener not configured:**
```bash
# Verify listen-ports annotation
kubectl describe ingress fargate-profile-demo -n fp-ns-app1 | grep listen-ports
```

### Issue: DNS Record Not Created

**Symptoms:**
```bash
# DNS lookup fails
nslookup fargate-profile-demo-501.yourdomain.com
# Non-authoritative answer not found
```

**Diagnosis:**
```bash
# Check ExternalDNS logs
kubectl logs -n external-dns deployment/external-dns

# Verify ExternalDNS is running
kubectl get pods -n external-dns
```

**Solutions:**

1. **ExternalDNS not installed:**
```bash
cd externaldns-install-terraform-manifests
terraform apply -auto-approve
```

2. **Incorrect hostname annotation:**
```bash
kubectl get ingress fargate-profile-demo -n fp-ns-app1 -o yaml | grep hostname
```

3. **ExternalDNS lacks Route53 permissions:**
```bash
# Check service account
kubectl describe sa external-dns -n external-dns

# Verify IAM role has Route53 permissions
```

4. **Wrong hosted zone:**
```bash
# List hosted zones
aws route53 list-hosted-zones

# Check ExternalDNS configuration
kubectl get deployment external-dns -n external-dns -o yaml | grep domain-filter
```

### Issue: Target Type Instance Instead of IP

**Symptoms:**
ALB target group shows instance targets instead of IP targets.

**Diagnosis:**
```bash
# Check target group target type
aws elbv2 describe-target-groups \
  --query 'TargetGroups[?contains(TargetGroupName, `fargate`)].TargetType'
```

**Solution:**
Ensure ingress has IP target type annotation:

```yaml
metadata:
  annotations:
    alb.ingress.kubernetes.io/target-type: ip  # Must be present
```

Delete and recreate ingress:
```bash
kubectl delete ingress fargate-profile-demo -n fp-ns-app1
kubectl apply -f 04-ALB-Ingress-target-type-ip.yml
```

### Issue: Pods Stuck in Pending

**Symptoms:**
```bash
kubectl get pods -n fp-ns-app1
# Pods in Pending state
```

**Diagnosis:**
```bash
kubectl describe pod <pod-name> -n fp-ns-app1
# Check Events section
```

**Common Causes:**

1. **Insufficient subnet IPs:**
```bash
aws ec2 describe-subnets --subnet-ids <subnet-id> \
  --query 'Subnets[0].AvailableIpAddressCount'
```

2. **Fargate quota exceeded:**
```bash
aws service-quotas get-service-quota \
  --service-code fargate \
  --quota-code L-3032A538
```

3. **Fargate profile not active:**
```bash
aws eks describe-fargate-profile \
  --cluster-name hr-dev-eksdemo \
  --fargate-profile-name hr-dev-fp-app1 \
  --query 'fargateProfile.status'
```

### Debugging Commands Reference

```bash
# Comprehensive status check
kubectl get all -n fp-ns-app1
kubectl get ingress -n fp-ns-app1
kubectl get nodes -l eks.amazonaws.com/compute-type=fargate

# Check resource details
kubectl describe ingress fargate-profile-demo -n fp-ns-app1
kubectl describe pod <pod-name> -n fp-ns-app1
kubectl describe svc -n fp-ns-app1

# View logs
kubectl logs -n fp-ns-app1 -l app=app1-nginx --tail=50
kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller
kubectl logs -n external-dns deployment/external-dns

# Test connectivity
kubectl exec -n fp-ns-app1 <pod-name> -- curl -I localhost
kubectl exec -n fp-ns-app1 <pod-name> -- nslookup app1-nginx-clusterip-service

# AWS resources
aws elbv2 describe-load-balancers --query 'LoadBalancers[?contains(LoadBalancerName, `fargate`)]'
aws elbv2 describe-target-groups --query 'TargetGroups[?contains(TargetGroupName, `fargate`)]'
aws route53 list-resource-record-sets --hosted-zone-id <zone-id>
```

## Best Practices

### 1. Always Use IP Target Type with Fargate

**Critical for Fargate workloads:**

```yaml
annotations:
  alb.ingress.kubernetes.io/target-type: ip  # Required
```

**Why:**
- Fargate pods don't run on EC2 instances
- Instance target type will fail
- IP mode allows direct pod addressing

### 2. Configure Health Checks at Service Level

```yaml
apiVersion: v1
kind: Service
metadata:
  name: app1-nginx-clusterip-service
  annotations:
    alb.ingress.kubernetes.io/healthcheck-path: /app1/index.html
spec:
  type: ClusterIP
  # ... rest of spec
```

**Benefits:**
- More accurate health checks
- Faster failure detection
- Better traffic routing

### 3. Use ClusterIP Services for Internal Communication

```yaml
apiVersion: v1
kind: Service
metadata:
  name: app1-nginx-clusterip-service
spec:
  type: ClusterIP  # Not NodePort or LoadBalancer
  selector:
    app: app1-nginx
  ports:
  - port: 80
    targetPort: 80
```

**Reasons:**
- Fargate doesn't support NodePort on nodes
- ClusterIP works with IP target type
- More efficient networking

### 4. Specify Resource Requests and Limits

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: app1-nginx
        image: stacksimplify/kube-nginxapp1:1.0.0
        resources:
          requests:
            cpu: "250m"
            memory: "512Mi"
          limits:
            cpu: "500m"
            memory: "1Gi"
```

**Benefits:**
- Controls Fargate compute size
- Predictable costs
- Better resource planning

### 5. Use Multiple Replicas for HA

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 3  # Multiple replicas for HA
  template:
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - app1-nginx
              topologyKey: topology.kubernetes.io/zone
```

**Advantages:**
- High availability across AZs
- Zero-downtime deployments
- Better fault tolerance

### 6. Implement Proper SSL/TLS Configuration

```yaml
annotations:
  # HTTPS listener
  alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}, {"HTTP":80}]'

  # SSL certificate
  alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:...

  # Force HTTPS redirect
  alb.ingress.kubernetes.io/ssl-redirect: '443'

  # SSL policy (optional)
  alb.ingress.kubernetes.io/ssl-policy: ELBSecurityPolicy-TLS-1-2-2017-01
```

### 7. Use ExternalDNS for Automated DNS Management

```yaml
annotations:
  external-dns.alpha.kubernetes.io/hostname: myapp.example.com
```

**Benefits:**
- Automatic DNS record creation
- DNS lifecycle management
- Consistent domain management

### 8. Tag Resources for Cost Tracking

```hcl
resource "kubernetes_ingress_v1" "ingress" {
  metadata {
    annotations = {
      "alb.ingress.kubernetes.io/tags" = "Environment=production,Team=platform,CostCenter=engineering"
    }
  }
}
```

### 9. Configure Appropriate Health Check Settings

```yaml
annotations:
  alb.ingress.kubernetes.io/healthcheck-interval-seconds: '15'
  alb.ingress.kubernetes.io/healthcheck-timeout-seconds: '5'
  alb.ingress.kubernetes.io/healthy-threshold-count: '2'
  alb.ingress.kubernetes.io/unhealthy-threshold-count: '2'
  alb.ingress.kubernetes.io/success-codes: '200'
```

**Recommendations:**
- Interval: 15-30 seconds
- Timeout: 5-10 seconds
- Healthy threshold: 2-3
- Unhealthy threshold: 2-3

### 10. Use Namespace Organization

```bash
# Production
fp-ns-app1-prod

# Staging
fp-ns-app1-staging

# Development
fp-ns-app1-dev
```

**Separate Fargate profiles per environment:**

```hcl
resource "aws_eks_fargate_profile" "production" {
  fargate_profile_name = "production-apps"
  selector {
    namespace = "fp-ns-app1-prod"
  }
}

resource "aws_eks_fargate_profile" "staging" {
  fargate_profile_name = "staging-apps"
  selector {
    namespace = "fp-ns-app1-staging"
  }
}
```

### 11. Implement Monitoring and Logging

```bash
# Enable Container Insights
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/cloudwatch-namespace.yaml

# Configure Fluent Bit for Fargate
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/fluent-bit/fluent-bit.yaml
```

### 12. Use Terraform Remote State

```hcl
# c2-remote-state-datasource.tf
data "terraform_remote_state" "eks" {
  backend = "s3"
  config = {
    bucket = "your-terraform-state-bucket"
    key    = "eks-fargate-workloads/cluster/terraform.tfstate"
    region = "us-east-1"
  }
}
```

**Benefits:**
- State sharing between modules
- Consistent references
- Better collaboration
