# Kubernetes Resources via Terraform

This project demonstrates how to manage Kubernetes resources using Terraform's Kubernetes provider, enabling infrastructure-as-code for both AWS infrastructure and Kubernetes workloads.

## Overview

Deploy and manage Kubernetes resources directly through Terraform:
- Kubernetes Deployments
- Services (ClusterIP, NodePort, LoadBalancer)
- ConfigMaps and Secrets
- Namespaces
- Service Accounts
- Ingress resources

## Architecture

```
Terraform
├── AWS Resources (EKS Cluster)
└── Kubernetes Resources
    ├── Namespaces
    ├── Deployments
    ├── Services
    ├── ConfigMaps
    └── Ingress
```

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured
- Existing EKS cluster
- kubectl configured for cluster access

## Features

### Infrastructure as Code for Kubernetes
- Version-controlled Kubernetes manifests
- Declarative resource management
- State tracking for Kubernetes objects
- Dependencies between AWS and K8s resources

### Integration Benefits
- Single Terraform workflow for AWS + Kubernetes
- Reference EKS outputs directly
- Automated deployment pipeline
- Consistent state management

## Project Structure

```
├── ekscluster-terraform-manifests/
│   └── (EKS cluster configuration)
└── k8sresources-terraform-manifests/
    ├── c1-versions.tf              # Providers (AWS, Kubernetes, Helm)
    ├── c2-remote-state-datasource.tf # Reference EKS cluster state
    ├── c3-namespace.tf             # Kubernetes namespaces
    ├── c4-deployment.tf            # Application deployments
    ├── c5-service.tf               # Kubernetes services
    └── c6-ingress.tf               # Ingress resources
```

## Usage

### 1. Deploy EKS Cluster First

```bash
cd ekscluster-terraform-manifests
terraform init
terraform apply
```

### 2. Deploy Kubernetes Resources

```bash
cd k8sresources-terraform-manifests
terraform init
terraform apply
```

## Configuration Examples

### Kubernetes Deployment

```hcl
resource "kubernetes_deployment" "app" {
  metadata {
    name      = "myapp"
    namespace = kubernetes_namespace.dev.metadata[0].name
    labels = {
      app = "myapp"
    }
  }

  spec {
    replicas = 3

    selector {
      match_labels = {
        app = "myapp"
      }
    }

    template {
      metadata {
        labels = {
          app = "myapp"
        }
      }

      spec {
        container {
          name  = "myapp"
          image = "nginx:latest"

          port {
            container_port = 80
          }
        }
      }
    }
  }
}
```

### Kubernetes Service

```hcl
resource "kubernetes_service" "app" {
  metadata {
    name      = "myapp-service"
    namespace = kubernetes_namespace.dev.metadata[0].name
  }

  spec {
    selector = {
      app = kubernetes_deployment.app.metadata[0].labels.app
    }

    port {
      port        = 80
      target_port = 80
    }

    type = "LoadBalancer"
  }
}
```

### Remote State Data Source

```hcl
data "terraform_remote_state" "eks" {
  backend = "s3"

  config = {
    bucket = "myorg-terraform-state"
    key    = "eks-cluster/terraform.tfstate"
    region = "us-east-1"
  }
}

# Use EKS cluster outputs
provider "kubernetes" {
  host                   = data.terraform_remote_state.eks.outputs.cluster_endpoint
  cluster_ca_certificate = base64decode(data.terraform_remote_state.eks.outputs.cluster_certificate_authority_data)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args = [
      "eks",
      "get-token",
      "--cluster-name",
      data.terraform_remote_state.eks.outputs.cluster_id
    ]
  }
}
```

## Advantages Over kubectl

| Feature | Terraform | kubectl |
|---------|-----------|---------|
| State Management | Yes | No |
| Version Control | Native | Via YAML files |
| Drift Detection | Yes | Manual |
| AWS Integration | Seamless | Separate |
| Rollback | Yes | Manual |
| Dependencies | Explicit | Manual |

## Common Use Cases

### 1. Application Deployment
Deploy applications with dependencies on AWS resources (RDS, S3, etc.)

### 2. Multi-Environment Management
Use workspaces or separate state files for dev/staging/prod

### 3. GitOps Workflow
Integrate with CI/CD pipelines for automated deployments

### 4. Resource Dependencies
Ensure load balancer controller is installed before creating ingress

## Best Practices

### 1. Separate Concerns
```
├── infrastructure/     # EKS, VPC, etc.
├── platform/          # Controllers, operators
└── applications/      # App deployments
```

### 2. Use Remote State
Reference outputs between projects using remote state data sources

### 3. Namespace Organization
Create separate namespaces for different teams/applications

### 4. Resource Naming
Use consistent naming with local values:
```hcl
locals {
  name_prefix = "${var.environment}-${var.app_name}"
}
```

### 5. Annotations and Labels
Always include relevant metadata:
```hcl
metadata {
  labels = {
    environment = var.environment
    app         = var.app_name
    managed-by  = "terraform"
  }
  annotations = {
    "deployed-by" = "terraform"
  }
}
```

## Kubernetes Provider Configuration

### Using EKS

```hcl
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args = [
      "eks",
      "get-token",
      "--cluster-name",
      module.eks.cluster_id
    ]
  }
}
```

## Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS Region | us-east-1 |
| `environment` | Environment name | dev |
| `app_replicas` | Number of pod replicas | 3 |

## Outputs

- Service endpoints
- Load balancer URLs
- Namespace names
- Deployment status

## Troubleshooting

### Provider Authentication Issues
```bash
# Verify kubectl access
kubectl get nodes

# Check AWS credentials
aws sts get-caller-identity

# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name cluster-name
```

### Resource Creation Failures
```bash
# Check Kubernetes events
kubectl get events -n namespace

# Verify Terraform state
terraform state list
terraform state show kubernetes_deployment.app
```

### State Drift
```bash
# Detect drift
terraform plan

# Import existing resources
terraform import kubernetes_deployment.app namespace/deployment-name
```

## When to Use Terraform vs kubectl

### Use Terraform When:
- Managing infrastructure and apps together
- Need state management and drift detection
- Implementing GitOps workflows
- Managing multiple environments

### Use kubectl When:
- Quick testing and debugging
- One-off administrative tasks
- Learning Kubernetes
- Troubleshooting live issues

## Cleanup

```bash
# Destroy Kubernetes resources first
cd k8sresources-terraform-manifests
terraform destroy

# Then destroy EKS cluster
cd ../ekscluster-terraform-manifests
terraform destroy
```
