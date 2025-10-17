# AWS EKS Cluster with Terraform

This project provisions a complete AWS EKS (Elastic Kubernetes Service) cluster infrastructure using Terraform, including VPC networking, bastion host, and EKS node groups.

## Architecture Overview

This Terraform configuration creates:

- **VPC Infrastructure**: Custom VPC with public, private, and database subnets across multiple availability zones
- **EKS Cluster**: Kubernetes cluster with configurable version and access controls
- **Node Groups**: Public node group with auto-scaling capabilities
- **Bastion Host**: EC2 instance for secure cluster access
- **Security Groups**: Properly configured security groups for bastion and EKS resources
- **NAT Gateway**: For private subnet outbound connectivity

## Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) >= 1.0
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- AWS Account with appropriate permissions
- SSH key pair named `terraform-key` in your AWS region
- Private key file `terraform-key.pem` in `private-key/` directory
- Private key file `eks-terraform-key.pem` in `private-key/` directory

## Project Structure

```
terraform-manifests/
├── c1-versions.tf                              # Terraform and provider versions
├── c2-01-generic-variables.tf                  # Generic variables (region, environment)
├── c2-02-local-values.tf                       # Local values and common tags
├── c3-01-vpc-variables.tf                      # VPC input variables
├── c3-02-vpc-module.tf                         # VPC module configuration
├── c3-03-vpc-outputs.tf                        # VPC outputs
├── c4-01-ec2bastion-variables.tf               # Bastion host variables
├── c4-02-ec2bastion-outputs.tf                 # Bastion host outputs
├── c4-03-ec2bastion-securitygroups.tf          # Bastion security group
├── c4-04-ami-datasource.tf                     # AMI data source
├── c4-05-ec2bastion-instance.tf                # Bastion EC2 instance
├── c4-06-ec2bastion-elasticip.tf               # Elastic IP for bastion
├── c4-07-ec2bastion-provisioners.tf            # Provisioners for bastion setup
├── c5-01-eks-variables.tf                      # EKS cluster variables
├── c5-02-eks-outputs.tf                        # EKS cluster outputs
├── c5-03-iamrole-for-eks-cluster.tf            # IAM role for EKS cluster
├── c5-04-iamrole-for-eks-nodegroup.tf          # IAM role for node groups
├── c5-05-securitygroups-eks.tf                 # EKS security groups (placeholder)
├── c5-06-eks-cluster.tf                        # EKS cluster resource
├── c5-07-eks-node-group-public.tf              # Public node group
├── c5-08-eks-node-group-private.tf             # Private node group (commented)
├── terraform.tfvars                            # Main variable values
├── vpc.auto.tfvars                             # VPC variable values
├── eks.auto.tfvars                             # EKS variable values
└── ec2bastion.auto.tfvars                      # Bastion variable values
```

## Configuration

### Default Settings

The project comes with the following default configuration:

**Environment Settings** (terraform.tfvars):
- **Region**: us-east-1
- **Environment**: stag
- **Business Division**: hr

**VPC Configuration** (vpc.auto.tfvars):
- **CIDR Block**: 10.0.0.0/16
- **Public Subnets**: 10.0.101.0/24, 10.0.102.0/24
- **Private Subnets**: 10.0.1.0/24, 10.0.2.0/24
- **Database Subnets**: 10.0.151.0/24, 10.0.152.0/24
- **NAT Gateway**: Single NAT Gateway enabled

**EKS Configuration** (eks.auto.tfvars):
- **Cluster Name**: eksdemo1
- **Kubernetes Version**: 1.31
- **Service IPv4 CIDR**: 172.20.0.0/16
- **Public Access**: Enabled from 0.0.0.0/0
- **Private Access**: Disabled

**Bastion Host** (ec2bastion.auto.tfvars):
- **Instance Type**: t3.micro
- **Key Pair**: terraform-key

### Customization

To customize the deployment, modify the respective `.tfvars` files:

1. **terraform.tfvars**: Change region, environment, or business division
2. **vpc.auto.tfvars**: Adjust VPC CIDR blocks and subnet configurations
3. **eks.auto.tfvars**: Modify EKS cluster settings
4. **ec2bastion.auto.tfvars**: Change bastion instance specifications

## Usage

### 1. Initialize Terraform

```bash
cd terraform-manifests
terraform init
```

### 2. Validate Configuration

```bash
terraform validate
```

### 3. Plan Infrastructure

```bash
terraform plan
```

### 4. Apply Configuration

```bash
terraform apply
```

Type `yes` when prompted to confirm the infrastructure creation.

### 5. Access the Cluster

After successful deployment, configure kubectl:

```bash
aws eks update-kubeconfig --region us-east-1 --name hr-stag-eksdemo1
```

Verify cluster access:

```bash
kubectl get nodes
kubectl cluster-info
```

### 6. SSH to Bastion Host

```bash
ssh -i private-key/terraform-key.pem ec2-user@<BASTION_EIP>
```

The bastion host Elastic IP will be displayed in the Terraform outputs.

## Outputs

The following outputs are available after deployment:

### VPC Outputs
- `vpc_id`: VPC identifier
- `vpc_cidr_block`: VPC CIDR block
- `private_subnets`: Private subnet IDs
- `public_subnets`: Public subnet IDs
- `nat_public_ips`: NAT Gateway public IPs
- `azs`: Availability zones

### EKS Outputs
- `cluster_id`: EKS cluster name/ID
- `cluster_arn`: EKS cluster ARN
- `cluster_endpoint`: Kubernetes API endpoint
- `cluster_version`: Kubernetes version
- `cluster_oidc_issuer_url`: OIDC provider URL
- `node_group_public_id`: Public node group ID
- `node_group_public_status`: Node group status

### Bastion Outputs
- `ec2_bastion_eip`: Bastion host Elastic IP
- `ec2_bastion_public_instance_ids`: Bastion instance ID

View outputs:

```bash
terraform output
```

## Node Group Configuration

### Public Node Group

- **Instance Type**: t3.medium
- **AMI Type**: AL2_x86_64
- **Capacity Type**: ON_DEMAND
- **Disk Size**: 20 GB
- **Scaling**: Min 1, Desired 1, Max 2
- **SSH Access**: Enabled with terraform-key

### Private Node Group

The private node group configuration is commented out by default. To enable:

1. Uncomment the resource in `c5-08-eks-node-group-private.tf`
2. Uncomment the outputs in `c5-02-eks-outputs.tf`
3. Run `terraform apply`

## Security Considerations

1. **SSH Access**: Bastion host allows SSH from 0.0.0.0/0 - restrict this in production
2. **EKS API Access**: Public access enabled from anywhere - consider limiting CIDR ranges
3. **Private Keys**: Store SSH keys securely, never commit to version control
4. **IAM Roles**: Review and restrict IAM policies as per your security requirements
5. **Logging**: EKS control plane logging is enabled for all log types

## Cost Optimization

- Single NAT Gateway is used (set `vpc_single_nat_gateway = true`)
- Node groups use ON_DEMAND instances - consider SPOT for non-production
- Minimum node count is set to 1 - adjust based on your needs
- Instance types are t3.micro for bastion and t3.medium for nodes

## Cleanup

To destroy all created resources:

```bash
terraform destroy
```

Type `yes` when prompted to confirm resource deletion.

**Warning**: This will permanently delete all resources including the EKS cluster, VPC, and associated data.

## Troubleshooting

### Common Issues

1. **Key Pair Not Found**
   - Ensure `terraform-key` exists in your AWS region
   - Verify key file exists at `private-key/terraform-key.pem`

2. **Insufficient Permissions**
   - Verify AWS credentials have necessary permissions
   - Check IAM policies for EKS, EC2, and VPC operations

3. **Quota Limits**
   - Check AWS service quotas for VPCs, EIPs, and EC2 instances
   - Request limit increases if needed

4. **Subnet CIDR Conflicts**
   - Ensure CIDR blocks don't overlap
   - Verify Service IPv4 CIDR (172.20.0.0/16) doesn't conflict with VPC

### Debug Commands

```bash
# Check Terraform state
terraform show

# List resources
terraform state list

# Inspect specific resource
terraform state show <resource_name>

# Enable debug logging
export TF_LOG=DEBUG
terraform apply
```

## Module Versions

- **AWS Provider**: 5.74
- **VPC Module**: 5.14.0
- **EC2 Instance Module**: 5.7.1
- **Security Group Module**: 5.2.0

