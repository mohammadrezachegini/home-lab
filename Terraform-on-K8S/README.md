# Terraform on Kubernetes (AWS EKS)

A comprehensive collection of Terraform configurations and Kubernetes manifests for deploying and managing AWS EKS (Elastic Kubernetes Service) clusters with various add-ons, controllers, and workloads. This repository demonstrates production-ready patterns for running Kubernetes on AWS.

## Overview

This repository provides Infrastructure as Code (IaC) examples for AWS EKS, covering everything from basic cluster setup to advanced features like auto-scaling, ingress controllers, storage management, and IAM integration. Each subdirectory contains complete, deployable examples with detailed documentation.

## Prerequisites

- **Terraform** >= 1.0 installed
- **AWS CLI** configured with appropriate credentials
- **kubectl** installed for Kubernetes cluster management
- **AWS Account** with appropriate permissions
- **SSH Key Pair** for bastion host access
- Basic understanding of Kubernetes concepts

## Repository Structure

### Foundation & Cluster Setup

#### Basic Infrastructure
- **[AWS-VPC-using-Terraform](AWS-EKS/AWS-VPC-using-Terraform/)** - Production-ready VPC with public, private, and database subnets
- **[AWS-EC2-BastionHost](AWS-EKS/AWS-EC2-BastionHost/)** - Bastion host for secure EKS cluster access
- **[AWS-EKS-Cluster-Basics](AWS-EKS/AWS-EKS-Cluster-Basics/)** - Complete EKS cluster with VPC, bastion, and node groups
- **[Terraform-Remote-State-Storage](AWS-EKS/Terraform-Remote-State-Storage/)** - S3 backend for Terraform state management

#### Kubernetes Resource Management
- **[Kubernetes-Resources-via-Terraform](AWS-EKS/Kubernetes-Resources-via-Terraform/)** - Deploy Kubernetes resources using Terraform

### Storage Solutions

#### EBS (Elastic Block Store)
- **[EBS-CSI-Install-Kubernetes-Storage](AWS-EKS/EBS-CSI-Install-Kubernetes-Storage/)** - EBS CSI driver installation via Helm
- **[EBS-CSI-Install-using-EKS-AddOn](AWS-EKS/EBS-CSI-Install-using-EKS-AddOn/)** - EBS CSI driver as EKS add-on
- **[EBS-Kubernetes-SampleApp-Terraform](AWS-EKS/EBS-Kubernetes-SampleApp-Terraform/)** - Sample application with EBS storage (Terraform)
- **[EBS-Kubernetes-SampleApp-YAML](AWS-EKS/EBS-Kubernetes-SampleApp-YAML/)** - Sample application with EBS storage (YAML)
- **[EBS-Resizing-on-EKS](AWS-EKS/EBS-Resizing-on-EKS/)** - Dynamic EBS volume resizing

#### EFS (Elastic File System)
- **[EKS-EFS-CSI-Install](AWS-EKS/EKS-EFS-CSI-Install/)** - EFS CSI driver installation
- **[EKS-EFS-Static-Provisioning](AWS-EKS/EKS-EFS-Static-Provisioning/)** - Static EFS volume provisioning
- **[EKS-EFS-Dynamic-Provisioning](AWS-EKS/EKS-EFS-Dynamic-Provisioning/)** - Dynamic EFS volume provisioning
- **[EKS-EFS-Fargate](AWS-EKS/EKS-EFS-Fargate/)** - EFS with Fargate workloads

### Load Balancing & Ingress

#### AWS Load Balancer Controller
- **[EKS-with-LoadBalancer-Controller](AWS-EKS/EKS-with-LoadBalancer-Controller/)** - Install AWS Load Balancer Controller

#### Network Load Balancer (NLB)
- **[EKS-NLB-Basics](AWS-EKS/EKS-NLB-Basics/)** - Basic NLB with Kubernetes services
- **[EKS-NLB-InternalLB](AWS-EKS/EKS-NLB-InternalLB/)** - Internal NLB for private services
- **[EKS-NLB-TLS-externaldns](AWS-EKS/EKS-NLB-TLS-externaldns/)** - NLB with TLS and ExternalDNS

#### Application Load Balancer (ALB) Ingress
- **[EKS-Ingress-Basics](AWS-EKS/EKS-Ingress-Basics/)** - Basic ALB Ingress setup
- **[EKS-Ingress-Context-Path-Routing](AWS-EKS/EKS-Ingress-Context-Path-Routing/)** - Path-based routing
- **[EKS-Ingress-NameBasedVirtualHost-Routing](AWS-EKS/EKS-Ingress-NameBasedVirtualHost-Routing/)** - Host-based routing
- **[EKS-Ingress-SSL-SSLRedirect](AWS-EKS/EKS-Ingress-SSL-SSLRedirect/)** - SSL/TLS with HTTP to HTTPS redirect
- **[EKS-Ingress-SSLDiscovery-Host](AWS-EKS/EKS-Ingress-SSLDiscovery-Host/)** - SSL discovery via host header
- **[EKS-Ingress-SSLDiscovery-TLS](AWS-EKS/EKS-Ingress-SSLDiscovery-TLS/)** - SSL discovery via TLS block
- **[EKS-Ingress-InternalLB](AWS-EKS/EKS-Ingress-InternalLB/)** - Internal ALB ingress
- **[EKS-Ingress-Groups](AWS-EKS/EKS-Ingress-Groups/)** - Share ALB across multiple ingresses
- **[EKS-Ingress-Cross-Namespaces](AWS-EKS/EKS-Ingress-Cross-Namespaces/)** - Ingress across namespaces
- **[EKS-Ingress-TargetType-IP](AWS-EKS/EKS-Ingress-TargetType-IP/)** - IP mode for pod direct routing

### DNS Management
- **[EKS-ExternalDNS-Install](AWS-EKS/EKS-ExternalDNS-Install/)** - ExternalDNS controller installation
- **[EKS-ExternalDNS-with-k8s-Service](AWS-EKS/EKS-ExternalDNS-with-k8s-Service/)** - DNS records for Kubernetes services
- **[EKS-ExternalDNS-with-Ingress-Service](AWS-EKS/EKS-ExternalDNS-with-Ingress-Service/)** - DNS records for Ingress resources

### Auto-Scaling

#### Cluster Autoscaler
- **[EKS-Cluster-Autoscaler](AWS-EKS/EKS-Cluster-Autoscaler/)** - Cluster Autoscaler installation and configuration
- **[EKS-Cluster-Autoscaler-Testing](AWS-EKS/EKS-Cluster-Autoscaler-Testing/)** - Test scenarios for cluster scaling

#### Pod Autoscaling
- **[EKS-Horizontal-Pod-Autoscaler](AWS-EKS/EKS-Horizontal-Pod-Autoscaler/)** - HPA based on CPU/memory metrics
- **[EKS-Vertical-Pod-Autoscaler-Install](AWS-EKS/EKS-Vertical-Pod-Autoscaler-Install/)** - VPA installation and configuration

### IAM & Security

#### IAM Roles for Service Accounts (IRSA)
- **[EKS-IRSA](AWS-EKS/EKS-IRSA/)** - Configure IAM roles for Kubernetes service accounts

#### EKS Access Management
- **[EKS-Admins-AWS-Admin-User](AWS-EKS/EKS-Admins-AWS-Admin-User/)** - Admin access for AWS users
- **[EKS-Admins-AWS-Basic-User](AWS-EKS/EKS-Admins-AWS-Basic-User/)** - Basic user access patterns
- **[EKS-Admins-as-AWS-IAM-Users](AWS-EKS/EKS-Admins-as-AWS-IAM-Users/)** - Map IAM users to Kubernetes RBAC
- **[EKS-Admins-with-AWS-IAM-Roles](AWS-EKS/EKS-Admins-with-AWS-IAM-Roles/)** - Admin access via IAM roles
- **[EKS-Admins-with-AWS-IAM-Roles-TF](AWS-EKS/EKS-Admins-with-AWS-IAM-Roles-TF/)** - IAM role mapping with Terraform
- **[EKS-DeveloperAccess-IAM-Users](AWS-EKS/EKS-DeveloperAccess-IAM-Users/)** - Developer access controls
- **[EKS-ReadOnly-IAM-Users](AWS-EKS/EKS-ReadOnly-IAM-Users/)** - Read-only access for users

### AWS Fargate
- **[Fargate-Only-EKS-Cluster](AWS-EKS/Fargate-Only-EKS-Cluster/)** - Serverless EKS cluster with Fargate
- **[EKS-Fargate-Profiles](AWS-EKS/EKS-Fargate-Profiles/)** - Configure Fargate profiles
- **[EKS-Run-k8s-workloads-on-Fargate](AWS-EKS/EKS-Run-k8s-workloads-on-Fargate/)** - Deploy workloads on Fargate

### Monitoring & Logging
- **[EKS-Monitoring-Logging-Terraform](AWS-EKS/EKS-Monitoring-Logging-Terraform/)** - CloudWatch monitoring via Terraform
- **[EKS-Monitoring-Logging-kubectl](AWS-EKS/EKS-Monitoring-Logging-kubectl/)** - CloudWatch monitoring via kubectl

## Quick Start

### Basic EKS Cluster Deployment

For a complete EKS cluster with VPC and bastion host:

```bash
# Navigate to the basic cluster setup
cd terraform-on-k8s/AWS-EKS/AWS-EKS-Cluster-Basics/terraform-manifests

# Initialize Terraform
terraform init

# Review the planned changes
terraform plan

# Deploy the infrastructure
terraform apply

# Configure kubectl
aws eks update-kubeconfig --region us-east-1 --name <cluster-name>

# Verify cluster access
kubectl get nodes
```

### Learning Path

For those new to EKS with Terraform, follow this recommended path:

1. **[AWS-VPC-using-Terraform](AWS-EKS/AWS-VPC-using-Terraform/)** - Understand VPC networking
2. **[AWS-EC2-BastionHost](AWS-EKS/AWS-EC2-BastionHost/)** - Setup bastion host
3. **[AWS-EKS-Cluster-Basics](AWS-EKS/AWS-EKS-Cluster-Basics/)** - Deploy your first cluster
4. **[EBS-CSI-Install-using-EKS-AddOn](AWS-EKS/EBS-CSI-Install-using-EKS-AddOn/)** - Add persistent storage
5. **[EKS-with-LoadBalancer-Controller](AWS-EKS/EKS-with-LoadBalancer-Controller/)** - Install load balancer controller
6. **[EKS-Ingress-Basics](AWS-EKS/EKS-Ingress-Basics/)** - Configure basic ingress
7. **[EKS-ExternalDNS-Install](AWS-EKS/EKS-ExternalDNS-Install/)** - Setup DNS automation
8. **[EKS-Cluster-Autoscaler](AWS-EKS/EKS-Cluster-Autoscaler/)** - Enable auto-scaling

## Common Configuration Patterns

### Standard Variables

Most projects use these common variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS Region | us-east-1 |
| `environment` | Environment name | stag/dev/prod |
| `business_divsion` | Business division | hr/it/finance |
| `cluster_name` | EKS cluster name | eksdemo1 |
| `cluster_version` | Kubernetes version | 1.31 |

### File Naming Convention

Projects follow a consistent pattern:

- `c1-versions.tf` - Terraform and provider versions
- `c2-xx-*.tf` - Variables and local values
- `c3-xx-*.tf` - VPC and networking resources
- `c4-xx-*.tf` - EC2 and bastion resources
- `c5-xx-*.tf` - EKS cluster resources
- `c6-xx-*.tf` - Additional EKS features (OIDC, add-ons)
- `*.auto.tfvars` - Auto-loaded variable values

## Architecture Overview

### Standard EKS Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    VPC (10.0.0.0/16)                   │  │
│  │                                                         │  │
│  │  ┌──────────────┐  ┌──────────────┐                   │  │
│  │  │ Public Subnet│  │ Public Subnet│                   │  │
│  │  │   (AZ-1a)    │  │   (AZ-1b)    │                   │  │
│  │  │              │  │              │                   │  │
│  │  │  Bastion     │  │  NAT Gateway │                   │  │
│  │  │  Host        │  │              │                   │  │
│  │  └──────────────┘  └──────────────┘                   │  │
│  │         │                  │                           │  │
│  │  ┌──────────────┐  ┌──────────────┐                   │  │
│  │  │Private Subnet│  │Private Subnet│                   │  │
│  │  │   (AZ-1a)    │  │   (AZ-1b)    │                   │  │
│  │  │              │  │              │                   │  │
│  │  │ EKS Worker   │  │ EKS Worker   │                   │  │
│  │  │ Nodes        │  │ Nodes        │                   │  │
│  │  └──────────────┘  └──────────────┘                   │  │
│  │                                                         │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │           EKS Control Plane (Managed)           │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Ingress Architecture with ALB

```
Internet
   │
   ▼
AWS ALB (Application Load Balancer)
   │
   ├─── Path: /app1 ──► Service: app1-svc ──► Pods: app1
   │
   ├─── Path: /app2 ──► Service: app2-svc ──► Pods: app2
   │
   └─── Host: api.example.com ──► Service: api-svc ──► Pods: api
```

## Key Features

### Infrastructure as Code
- Declarative configuration with Terraform
- Modular design with reusable components
- Remote state management with S3 and DynamoDB
- Version-controlled infrastructure

### High Availability
- Multi-AZ deployments
- Auto-scaling node groups
- Load balancing across zones
- Fault-tolerant architecture

### Security Best Practices
- Private worker nodes
- Bastion host for secure access
- IAM roles for service accounts (IRSA)
- Security groups and network ACLs
- Pod security policies

### Storage Options
- EBS for block storage
- EFS for shared file systems
- Dynamic and static provisioning
- Storage classes for different performance tiers

### Networking
- Custom VPC with proper segmentation
- Public, private, and database subnets
- NAT Gateway for outbound connectivity
- Application and Network Load Balancers
- Ingress controllers for HTTP/HTTPS routing

## Cost Optimization

### Development Environment

```hcl
# Use smaller instance types
node_instance_types = ["t3.small"]

# Minimum nodes
desired_size = 1
min_size     = 1
max_size     = 2

# Single NAT Gateway
vpc_single_nat_gateway = true

# Use Spot instances
capacity_type = "SPOT"
```

### Production Environment

```hcl
# Right-sized instances
node_instance_types = ["t3.medium", "t3.large"]

# Higher availability
desired_size = 3
min_size     = 3
max_size     = 10

# Multiple NAT Gateways
vpc_single_nat_gateway = false

# On-demand instances
capacity_type = "ON_DEMAND"
```

### Cost Reduction Tips

1. **Use Fargate for intermittent workloads** - Pay only when pods run
2. **Enable Cluster Autoscaler** - Scale down unused nodes
3. **Use Spot instances for non-critical workloads** - Save up to 90%
4. **Right-size your nodes** - Use appropriate instance types
5. **Delete unused resources** - Run `terraform destroy` when not needed
6. **Use single NAT Gateway for dev** - Reduce NAT Gateway costs
7. **Enable pod autoscaling** - HPA for optimal pod count

## Best Practices

### Terraform State Management

Always use remote state for team collaboration:

```hcl
terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "eks-cluster/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
```

### Resource Tagging

Use consistent tags across all resources:

```hcl
locals {
  common_tags = {
    Environment      = var.environment
    Project          = "EKS"
    BusinessDivision = var.business_divsion
    ManagedBy        = "terraform"
  }
}
```

### Node Group Configuration

- Use multiple node groups for different workload types
- Implement proper labels and taints
- Enable auto-scaling for production
- Use launch templates for custom configurations

### Security Hardening

1. **Network Security**
   - Use private subnets for worker nodes
   - Restrict security group rules
   - Enable VPC flow logs

2. **Cluster Security**
   - Enable EKS control plane logging
   - Use Pod Security Standards
   - Implement network policies

3. **Access Control**
   - Use IAM roles for service accounts
   - Implement least privilege RBAC
   - Enable audit logging

## Troubleshooting

### Common Issues

**EKS Cluster Creation Fails**
```bash
# Check AWS service quotas
aws service-quotas list-service-quotas \
  --service-code eks \
  --region us-east-1

# Verify IAM permissions
aws sts get-caller-identity
```

**kubectl Cannot Connect**
```bash
# Update kubeconfig
aws eks update-kubeconfig \
  --region us-east-1 \
  --name your-cluster-name

# Verify cluster access
kubectl cluster-info
kubectl auth can-i get pods --all-namespaces
```

**Pods Cannot Pull Images**
```bash
# Check node instance role
aws iam get-role --role-name <node-role-name>

# Verify ECR permissions
aws ecr describe-repositories

# Check image pull secrets
kubectl get secrets
```

**Load Balancer Not Created**
```bash
# Check AWS Load Balancer Controller logs
kubectl logs -n kube-system \
  deployment/aws-load-balancer-controller

# Verify IAM service account
kubectl describe sa aws-load-balancer-controller -n kube-system

# Check ingress events
kubectl describe ingress <ingress-name>
```

**EBS Volume Not Attaching**
```bash
# Check EBS CSI driver
kubectl get pods -n kube-system | grep ebs

# Verify PVC status
kubectl get pvc

# Check storage class
kubectl get sc
```

### Debug Commands

```bash
# Terraform debugging
export TF_LOG=DEBUG
terraform apply

# Check Terraform state
terraform show
terraform state list

# Kubernetes debugging
kubectl get events --all-namespaces
kubectl logs <pod-name> -n <namespace>
kubectl describe pod <pod-name>

# AWS CLI debugging
aws eks describe-cluster --name <cluster-name>
aws ec2 describe-instances
aws elbv2 describe-load-balancers
```

## Monitoring and Logging

### CloudWatch Container Insights

Enable comprehensive monitoring:

```bash
# Install CloudWatch agent
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluentd-quickstart.yaml
```

### Useful Queries

- **View Control Plane Logs**: EKS Console → Cluster → Logging
- **Pod Metrics**: CloudWatch → Container Insights → Performance Monitoring
- **Application Logs**: CloudWatch → Log Groups → /aws/eks/cluster-name

## Contributing

When adding new examples:

1. Follow existing file naming conventions
2. Include comprehensive README documentation
3. Add comments in Terraform code
4. Document required IAM permissions
5. Include cost estimates
6. Test in a clean AWS account
7. Provide cleanup instructions

## Support and Resources

- **AWS EKS Documentation**: https://docs.aws.amazon.com/eks/
- **Terraform AWS Provider**: https://registry.terraform.io/providers/hashicorp/aws/latest/docs
- **Kubernetes Documentation**: https://kubernetes.io/docs/
- **AWS EKS Workshop**: https://www.eksworkshop.com/
- **AWS EKS Best Practices**: https://aws.github.io/aws-eks-best-practices/

## Version Requirements

- **Terraform**: >= 1.0
- **AWS Provider**: >= 5.0
- **Kubernetes**: 1.28 - 1.31
- **kubectl**: Compatible with cluster version

## Estimated Costs

### Minimal Development Cluster

- **EKS Control Plane**: $73/month
- **2 × t3.medium nodes**: ~$60/month
- **Single NAT Gateway**: ~$32/month
- **EBS volumes**: ~$10/month
- **Load Balancer**: ~$20/month
- **Total**: ~$195/month

### Production Cluster

- **EKS Control Plane**: $73/month
- **6 × t3.large nodes**: ~$375/month
- **3 × NAT Gateway (HA)**: ~$96/month
- **EBS volumes**: ~$50/month
- **Load Balancers**: ~$60/month
- **Data transfer**: Variable
- **Total**: ~$654/month (base)

Use the [AWS Pricing Calculator](https://calculator.aws/) for detailed estimates.

## License

This repository is provided as-is for educational and reference purposes.

## Disclaimer

These configurations are examples for learning and testing. For production use:

- Review and customize all settings
- Implement proper backup strategies
- Follow your organization's compliance requirements
- Conduct security audits
- Implement monitoring and alerting
- Use appropriate instance sizes
- Enable high availability features
- Test disaster recovery procedures

---

**Note**: Always run `terraform plan` before applying changes. Use `terraform destroy` to clean up resources when done testing to avoid unnecessary charges.
