# Terraform AWS EKS with EBS CSI Driver

A comprehensive Terraform infrastructure-as-code project for deploying a User Management Web Application on Amazon EKS (Elastic Kubernetes Service) with EBS CSI Driver integration for persistent storage.

## 🏗️ Architecture Overview

This project provisions:
- **AWS EKS Cluster** with OIDC provider for IRSA (IAM Roles for Service Accounts)
- **VPC Infrastructure** with public/private subnets across multiple availability zones
- **EBS CSI Driver** installed as an EKS Add-on for persistent volume support
- **MySQL Database** with persistent storage using EBS volumes
- **User Management Web Application** exposed via AWS Load Balancers
- **Bastion Host** for secure cluster access

## 📋 Prerequisites

- Terraform >= 1.6.0
- AWS CLI configured with appropriate credentials
- kubectl (for Kubernetes cluster management)
- An AWS account with sufficient permissions
- SSH key pair created in AWS (default: `terraform-key`)

## 🚀 Project Structure

```
.
├── ekscluster-terraform-manifests/     # EKS cluster infrastructure
│   ├── c1-versions.tf                  # Terraform and provider versions
│   ├── c2-01-generic-variables.tf      # Generic variables (region, environment)
│   ├── c2-02-local-values.tf           # Local values and tags
│   ├── c3-01-vpc-variables.tf          # VPC configuration variables
│   ├── c3-02-vpc-module.tf             # VPC module configuration
│   ├── c4-*-ec2bastion-*.tf            # Bastion host configuration
│   ├── c5-*-eks-*.tf                   # EKS cluster and node group configuration
│   └── c6-*-iam-oidc-*.tf              # OIDC provider for IRSA
│
├── ebs-addon-terraform-manifests/      # EBS CSI Driver add-on
│   ├── c1-versions.tf                  # Terraform versions
│   ├── c2-remote-state-datasource.tf   # Remote state data source
│   ├── c3-01-generic-variables.tf      # Generic variables
│   ├── c3-02-local-values.tf           # Local values
│   ├── c4-01-ebs-csi-datasources.tf    # EBS CSI IAM policy data source
│   ├── c4-02-ebs-csi-iam-policy-and-role.tf  # IAM role for EBS CSI
│   └── c4-03-ebs-csi-addon-install.tf  # EBS CSI add-on installation
│
└── terraform-manifests-UMS-WebApp/     # User Management Application
    ├── c1-versions.tf                  # Terraform and provider versions
    ├── c2-remote-state-datasource.tf   # Remote state data source
    ├── c3-providers.tf                 # Kubernetes provider configuration
    ├── c4-01-storage-class.tf          # EBS Storage Class
    ├── c4-02-persistent-volume-claim.tf # PVC for MySQL
    ├── c4-03-UserMgmtWebApp-ConfigMap.tf # Database initialization script
    ├── c4-04-mysql-deployment.tf       # MySQL deployment
    ├── c4-05-mysql-clusterip-service.tf # MySQL service
    ├── c4-06-UserMgmtWebApp-deployment.tf # Web application deployment
    ├── c4-07-UserMgmtWebApp-loadbalancer-service.tf # Classic LB
    ├── c4-08-UserMgmtWebApp-network-loadbalancer-service.tf # NLB
    └── c4-09-UserMgmtWebApp-nodeport-service.tf # NodePort service
```

## 🔧 Configuration

### Step 1: Configure EKS Cluster

Edit `ekscluster-terraform-manifests/terraform.tfvars`:

```hcl
aws_region = "us-east-1"
environment = "dev"
business_divsion = "hr"
```

Edit `ekscluster-terraform-manifests/eks.auto.tfvars`:

```hcl
cluster_name = "eksdemo1"
cluster_service_ipv4_cidr = "172.20.0.0/16"
cluster_version = "1.31"
cluster_endpoint_private_access = false
cluster_endpoint_public_access = true
cluster_endpoint_public_access_cidrs = ["0.0.0.0/0"]
```

### Step 2: Configure VPC

Edit `ekscluster-terraform-manifests/vpc.auto.tfvars`:

```hcl
vpc_name = "myvpc"
vpc_cidr_block = "10.0.0.0/16"
vpc_public_subnets = ["10.0.101.0/24", "10.0.102.0/24"]
vpc_private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
vpc_database_subnets = ["10.0.151.0/24", "10.0.152.0/24"]
```

### Step 3: Configure S3 Backend

Update the S3 bucket name in:
- `ekscluster-terraform-manifests/c1-versions.tf`
- `ebs-addon-terraform-manifests/c1-versions.tf`
- `terraform-manifests-UMS-WebApp/c1-versions.tf`

Create S3 bucket and DynamoDB tables for state locking:

```bash
aws s3 mb s3://your-bucket-name
aws dynamodb create-table \
    --table-name dev-ekscluster \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST
```

## 📦 Deployment

### Deploy EKS Cluster

```bash
cd ekscluster-terraform-manifests
terraform init
terraform validate
terraform plan
terraform apply -auto-approve
```

### Configure kubectl

```bash
aws eks update-kubeconfig --region us-east-1 --name hr-dev-eksdemo1
kubectl get nodes
```

### Deploy EBS CSI Driver

```bash
cd ../ebs-addon-terraform-manifests
terraform init
terraform validate
terraform plan
terraform apply -auto-approve
```

### Verify EBS CSI Driver

```bash
kubectl get pods -n kube-system | grep ebs-csi
kubectl get storageclass
```

### Deploy User Management Application

```bash
cd ../terraform-manifests-UMS-WebApp
terraform init
terraform validate
terraform plan
terraform apply -auto-approve
```

### Access the Application

```bash
# Get Load Balancer DNS
kubectl get svc usermgmt-webapp-clb-service

# Access the application
curl http://<LOAD_BALANCER_DNS>
```

## 🔍 Key Features

### EBS CSI Driver Configuration
- **Storage Class**: `ebs-sc` with WaitForFirstConsumer binding mode
- **Volume Expansion**: Enabled
- **Reclaim Policy**: Retain (prevents data loss)
- **IRSA**: IAM role attached to EBS CSI controller service account

### MySQL Configuration
- **Persistent Storage**: 6Gi EBS volume
- **Initialization**: Database schema loaded via ConfigMap
- **Service Type**: Headless ClusterIP (Pod IP direct access)

### Web Application
- **Image**: `stacksimplify/kube-usermgmt-webapp:1.0.0-MySQLDB`
- **Replicas**: 1
- **Exposed Services**:
  - Classic Load Balancer (port 80)
  - Network Load Balancer (port 80)
  - NodePort (port 31280)

## 🧹 Cleanup

To destroy all resources:

```bash
# Destroy application
cd terraform-manifests-UMS-WebApp
terraform destroy -auto-approve

# Destroy EBS CSI add-on
cd ../ebs-addon-terraform-manifests
terraform destroy -auto-approve

# Destroy EKS cluster
cd ../ekscluster-terraform-manifests
terraform destroy -auto-approve
```

## 📊 Resource Overview

### Compute Resources
- EKS Cluster (v1.31)
- EKS Node Group (1-2 t3.medium instances)
- Bastion Host (1 t3.micro instance)

### Network Resources
- VPC with CIDR 10.0.0.0/16
- 2 Public Subnets (10.0.101.0/24, 10.0.102.0/24)
- 2 Private Subnets (10.0.1.0/24, 10.0.2.0/24)
- 2 Database Subnets (10.0.151.0/24, 10.0.152.0/24)
- NAT Gateway (single for cost optimization)
- Internet Gateway

### Storage Resources
- EBS CSI Driver
- 6Gi EBS volume for MySQL

### IAM Resources
- EKS Cluster IAM Role
- EKS Node Group IAM Role
- EBS CSI Driver IAM Role with IRSA
- OIDC Provider for EKS

## 🔒 Security Considerations

- Bastion host allows SSH from 0.0.0.0/0 (restrict in production)
- EKS API endpoint is public (consider private endpoint for production)
- MySQL root password is hardcoded (use AWS Secrets Manager in production)
- Node groups have SSH access enabled (restrict as needed)

## 🐛 Troubleshooting

### EBS CSI Driver not working
```bash
kubectl logs -n kube-system -l app=ebs-csi-controller
kubectl describe pod <pod-name> -n kube-system
```

### PVC not binding
```bash
kubectl describe pvc ebs-mysql-pv-claim
kubectl get events --sort-by='.lastTimestamp'
```

### Application not accessible
```bash
kubectl get svc
kubectl describe svc usermgmt-webapp-clb-service
kubectl logs deployment/usermgmt-webapp
```

## 📝 Notes

- The EBS CSI driver requires IRSA (IAM Roles for Service Accounts)
- Storage class uses WaitForFirstConsumer to ensure PV is created in the same AZ as the pod
- MySQL uses a headless service (ClusterIP: None) for direct pod IP access
- The project uses S3 backend for Terraform state with DynamoDB for state locking
