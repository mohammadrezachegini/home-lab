# EKS Ingress Basics

## Overview

This project demonstrates the fundamental implementation of AWS Application Load Balancer (ALB) Ingress on Amazon EKS using the AWS Load Balancer Controller. It provides a basic example of exposing Kubernetes services to the internet through an ALB-based ingress resource.

The implementation showcases:
- Basic ALB Ingress configuration
- AWS Load Balancer Controller integration with EKS
- Health check configuration for ALB targets
- Internet-facing load balancer setup
- NodePort service backend configuration

This is the foundational pattern for all subsequent ALB Ingress implementations and serves as a starting point for understanding how Kubernetes Ingress works with AWS infrastructure.

## Architecture

### Components

1. **EKS Cluster**: Managed Kubernetes cluster running on AWS
2. **AWS Load Balancer Controller**: Kubernetes controller that manages AWS Elastic Load Balancers
3. **Application Load Balancer (ALB)**: Layer 7 load balancer provisioned by the controller
4. **Ingress Resource**: Kubernetes resource defining routing rules
5. **NodePort Services**: Kubernetes services exposing pods on node ports
6. **NGINX Applications**: Sample applications for testing

### Traffic Flow

```
Internet -> ALB -> EKS Worker Nodes (NodePort) -> Pods
```

The ALB forwards traffic to the NodePort service, which then routes to the appropriate pods across the cluster.

## Prerequisites

### Required Tools
- AWS CLI configured with appropriate credentials
- kubectl (v1.21+)
- Terraform (v1.0+)
- eksctl (optional, for cluster verification)

### AWS Resources
- AWS Account with appropriate permissions
- VPC with public and private subnets
- EKS cluster with worker nodes
- IAM roles and policies for:
  - EKS cluster
  - EKS node groups
  - AWS Load Balancer Controller

### Knowledge Requirements
- Basic understanding of Kubernetes concepts (Pods, Services, Ingress)
- Familiarity with AWS services (VPC, ALB, EKS)
- Terraform basics
- YAML syntax

## Project Structure

```
EKS-Ingress-Basics/
├── ekscluster-terraform-manifests/     # EKS cluster infrastructure
│   ├── c1-versions.tf                  # Terraform and provider versions
│   ├── c2-01-generic-variables.tf      # Common variables
│   ├── c2-02-local-values.tf           # Local values and tags
│   ├── c3-*.tf                         # VPC configuration
│   ├── c4-*.tf                         # Bastion host configuration
│   ├── c5-*.tf                         # EKS cluster and node groups
│   ├── c6-*.tf                         # OIDC provider configuration
│   ├── c7-*.tf                         # Kubernetes provider setup
│   ├── c8-*.tf                         # IAM users (admin/basic)
│   ├── c9-*.tf                         # EKS admins IAM configuration
│   ├── c10-*.tf                        # EKS read-only IAM configuration
│   └── c11-*.tf                        # EKS developer IAM configuration
│
├── lbc-install-terraform-manifests/    # Load Balancer Controller installation
│   ├── c1-versions.tf                  # Terraform versions
│   ├── c2-remote-state-datasource.tf   # Reference to EKS cluster state
│   ├── c3-*.tf                         # Generic variables and locals
│   ├── c4-01-lbc-datasources.tf        # Data sources for LBC
│   ├── c4-02-lbc-iam-policy-and-role.tf # IAM resources for LBC
│   ├── c4-03-lbc-helm-provider.tf      # Helm provider configuration
│   ├── c4-04-lbc-install.tf            # Helm chart installation
│   ├── c4-05-lbc-outputs.tf            # Outputs
│   ├── c5-01-kubernetes-provider.tf    # Kubernetes provider
│   └── c5-02-ingress-class.tf          # IngressClass resource
│
├── ingress-basics-terraform-manifests/ # Ingress and application deployment
│   ├── c1-versions.tf                  # Terraform versions
│   ├── c2-remote-state-datasource.tf   # Reference to cluster state
│   ├── c3-providers.tf                 # Kubernetes provider
│   ├── c4-kubernetes-app3-deployment.tf # App deployment
│   ├── c5-kubernetes-app3-nodeport-service.tf # NodePort service
│   └── c6-kubernetes-ingress-service.tf # Ingress resource
│
└── kube-manifests-ingress-basics/      # Pure Kubernetes manifests (reference)
    ├── 01-Nginx-App1-Deployment-and-NodePortService.yml
    └── 02-ALB-Ingress-Basic.yml
```

## Usage

### Step 1: Deploy EKS Cluster

```bash
cd ekscluster-terraform-manifests/

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the configuration
terraform apply -auto-approve

# Configure kubectl
aws eks update-kubeconfig --region <region> --name <cluster-name>

# Verify cluster access
kubectl get nodes
```

### Step 2: Install AWS Load Balancer Controller

```bash
cd ../lbc-install-terraform-manifests/

# Initialize Terraform
terraform init

# Apply the configuration
terraform apply -auto-approve

# Verify LBC installation
kubectl get deployment -n kube-system aws-load-balancer-controller
kubectl get sa -n kube-system aws-load-balancer-controller

# Check LBC logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

### Step 3: Deploy Application and Ingress

```bash
cd ../ingress-basics-terraform-manifests/

# Initialize Terraform
terraform init

# Apply the configuration
terraform apply -auto-approve

# Verify resources
kubectl get deployment
kubectl get svc
kubectl get ingress

# Check ALB creation
kubectl describe ingress ingress-basics
```

### Step 4: Access the Application

```bash
# Get the ALB DNS name
kubectl get ingress ingress-basics -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Access the application (wait 2-3 minutes for ALB to be ready)
curl http://<alb-dns-name>

# Or open in browser
echo "http://$(kubectl get ingress ingress-basics -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')"
```

### Step 5: Clean Up

```bash
# Delete ingress resources first
cd ingress-basics-terraform-manifests/
terraform destroy -auto-approve

# Delete Load Balancer Controller
cd ../lbc-install-terraform-manifests/
terraform destroy -auto-approve

# Delete EKS cluster
cd ../ekscluster-terraform-manifests/
terraform destroy -auto-approve
```

## Configuration

### Key Ingress Annotations

```yaml
metadata:
  annotations:
    # Load Balancer Name
    alb.ingress.kubernetes.io/load-balancer-name: ingress-basics

    # Ingress Core Settings
    alb.ingress.kubernetes.io/scheme: internet-facing

    # Health Check Settings
    alb.ingress.kubernetes.io/healthcheck-protocol: HTTP
    alb.ingress.kubernetes.io/healthcheck-port: traffic-port
    alb.ingress.kubernetes.io/healthcheck-path: /index.html
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: '15'
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: '5'
    alb.ingress.kubernetes.io/success-codes: '200'
    alb.ingress.kubernetes.io/healthy-threshold-count: '2'
    alb.ingress.kubernetes.io/unhealthy-threshold-count: '2'
```

### Ingress Class Configuration

```yaml
spec:
  ingressClassName: my-aws-ingress-class  # References the IngressClass resource
  defaultBackend:
    service:
      name: app3-nginx-nodeport-service
      port:
        number: 80
```

### Important Notes

1. **IngressClass**: Modern approach uses `spec.ingressClassName` instead of the deprecated `kubernetes.io/ingress.class` annotation
2. **Health Checks**: Configured to check `/index.html` every 15 seconds
3. **Target Type**: Default is `instance` (uses NodePort), can be changed to `ip` for direct pod routing
4. **Scheme**: `internet-facing` creates a public ALB; use `internal` for private ALBs

## Features

### AWS Load Balancer Controller
- Automatic ALB provisioning and management
- Dynamic target group creation
- Health check configuration
- Integration with AWS services

### Health Monitoring
- Customizable health check paths
- Configurable check intervals and timeouts
- Success/failure thresholds
- Traffic-port based health checks

### Service Discovery
- Automatic backend service discovery
- NodePort service integration
- Dynamic target registration

### Scalability
- Supports multiple replicas
- Automatic target registration/deregistration
- Cross-AZ load balancing

## Troubleshooting

### ALB Not Created

**Issue**: Ingress created but no ALB appears in AWS Console

**Solutions**:
```bash
# Check LBC logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Verify IAM role and permissions
kubectl describe sa -n kube-system aws-load-balancer-controller

# Check ingress events
kubectl describe ingress ingress-basics

# Verify subnet tags (required for ALB)
# Public subnets need: kubernetes.io/role/elb = 1
# Private subnets need: kubernetes.io/role/internal-elb = 1
```

### Health Check Failures

**Issue**: Targets marked as unhealthy in ALB

**Solutions**:
```bash
# Verify pod is running
kubectl get pods

# Check pod logs
kubectl logs <pod-name>

# Test health check path directly
kubectl port-forward <pod-name> 8080:80
curl http://localhost:8080/index.html

# Verify security groups allow traffic
# Node security group should allow traffic from ALB security group
```

### Ingress Address Not Available

**Issue**: `kubectl get ingress` shows no ADDRESS

**Solutions**:
```bash
# Check ingress events
kubectl describe ingress ingress-basics

# Verify IngressClass exists
kubectl get ingressclass

# Check LBC controller is running
kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller

# Review controller logs for errors
kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller
```

### 503 Service Unavailable

**Issue**: ALB returns 503 errors

**Solutions**:
```bash
# Check if pods are running
kubectl get pods

# Verify service endpoints
kubectl get endpoints

# Check NodePort service
kubectl get svc

# Verify security groups
# Worker node security group must allow traffic from ALB on NodePort range (30000-32767)
```

### Permission Errors

**Issue**: LBC cannot create/modify ALB resources

**Solutions**:
```bash
# Verify OIDC provider
aws eks describe-cluster --name <cluster-name> --query "cluster.identity.oidc.issuer"

# Check IAM role trust relationship
aws iam get-role --role-name <lbc-role-name>

# Verify IAM policy attachment
aws iam list-attached-role-policies --role-name <lbc-role-name>

# Check service account annotation
kubectl describe sa -n kube-system aws-load-balancer-controller
```

## Best Practices

### Security
1. **Use Private Subnets**: Deploy worker nodes in private subnets
2. **Security Groups**: Configure least-privilege security group rules
3. **IAM Roles**: Use IRSA (IAM Roles for Service Accounts) for LBC
4. **Network Policies**: Implement Kubernetes network policies for pod-to-pod traffic

### High Availability
1. **Multi-AZ Deployment**: Distribute nodes across multiple availability zones
2. **Pod Replicas**: Run multiple replicas of applications
3. **Node Groups**: Use multiple node groups for resilience
4. **Health Checks**: Configure appropriate health check intervals and thresholds

### Performance
1. **Target Type**: Consider using `ip` target type for better performance
2. **Connection Draining**: Configure appropriate deregistration delay
3. **Health Check Tuning**: Balance between responsiveness and resource usage
4. **Resource Limits**: Set appropriate CPU/memory limits for pods


### Operational Excellence
1. **Monitoring**: Set up CloudWatch alarms for ALB metrics
2. **Logging**: Enable ALB access logs for troubleshooting
3. **Tagging**: Use consistent tagging strategy for resources
4. **Documentation**: Document custom configurations and architectural decisions
5. **Version Control**: Store all infrastructure code in Git

### Terraform Best Practices
1. **State Management**: Use remote state with locking (S3 + DynamoDB)
2. **Module Organization**: Separate concerns into logical modules
3. **Variable Validation**: Use validation rules for inputs
4. **Output Values**: Export important values for reference
5. **Dependencies**: Use explicit dependencies with `depends_on` when necessary
