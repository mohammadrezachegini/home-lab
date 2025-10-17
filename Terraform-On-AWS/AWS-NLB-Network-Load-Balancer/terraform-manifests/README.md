# AWS Network Load Balancer with Auto Scaling - Terraform Infrastructure

A production-ready Terraform configuration for deploying AWS Network Load Balancer (NLB) with Auto Scaling Groups, SSL/TLS termination, and complete infrastructure setup.

## Architecture Overview

This infrastructure deploys:

- **VPC** with public, private, and database subnets across multiple availability zones
- **Network Load Balancer (NLB)** with TCP and TLS listeners
- **Auto Scaling Group** with launch templates and scaling policies
- **SSL/TLS Certificate** management via AWS Certificate Manager (ACM)
- **Route53 DNS** registration for custom domain
- **Bastion Host** for secure SSH access
- **SNS Notifications** for auto scaling events
- **CloudWatch Integration** for monitoring and metrics

## Prerequisites

- AWS Account with appropriate permissions
- Terraform >= 1.0
- AWS CLI configured with credentials
- Route53 hosted zone (domain: `rezaops.com`)
- EC2 Key Pair named `terraform-key`
- Valid email for SNS notifications

## Project Structure

```
terraform-manifests/
├── c1-versions.tf                    # Provider and version configuration
├── c2-generic-variables.tf           # Generic variables (region, environment)
├── c3-local-values.tf               # Local values and common tags
├── c4-01-vpc-variables.tf           # VPC variables
├── c4-02-vpc-module.tf              # VPC module configuration
├── c4-03-vpc-outputs.tf             # VPC outputs
├── c5-02-securitygroup-outputs.tf   # Security group outputs
├── c5-03-securitygroup-bastionsg.tf # Bastion host security group
├── c5-04-securitygroup-privatesg.tf # Private instances security group
├── c5-05-securitygroup-loadbalancersg.tf # Load balancer security group
├── c6-01-datasource-ami.tf          # Amazon Linux 2 AMI data source
├── c6-02-datasource-route53-zone.tf # Route53 zone data source
├── c7-01-ec2instance-variables.tf   # EC2 instance variables
├── c7-02-ec2instance-outputs.tf     # EC2 instance outputs
├── c7-03-ec2instance-bastion.tf     # Bastion host configuration
├── c8-elasticip.tf                  # Elastic IP for bastion host
├── c9-nullresource-provisioners.tf  # Provisioners for bastion setup
├── c10-02-NLB-application-loadbalancer.tf # NLB configuration
├── c10-03-NLB-application-loadbalancer-outputs.tf # NLB outputs
├── c11-acm-certificatemanager.tf    # SSL certificate management
├── c12-route53-dnsregistration.tf   # DNS record creation
├── c13-01-autoscaling-with-launchtemplate-variables.tf # Launch template
├── c13-03-autoscaling-resource.tf   # Auto scaling group
├── c13-04-autoscaling-with-launchtemplate-outputs.tf # ASG outputs
├── c13-05-autoscaling-notifications.tf # SNS notifications
├── c13-06-autoscaling-ttsp.tf       # Target tracking scaling policies
├── c13-07-autoscaling-scheduled-actions.tf # Scheduled scaling
├── app1-install.sh                  # User data script for web servers
├── vpc.auto.tfvars                  # VPC configuration values
└── ec2instance.auto.tfvars          # EC2 configuration values
```

## Key Features

### Network Load Balancer

- **TCP Listener** on port 80
- **TLS Listener** on port 443 with ACM certificate
- Cross-zone load balancing configuration
- Health checks on `/app1/index.html`
- Availability zone affinity for DNS routing

### Auto Scaling

- **Target Tracking Policy**: Scales based on CPU utilization (target: 50%)
- **Scheduled Actions**:
  - Scale up at 7 AM UTC (8 instances)
  - Scale down at 9 PM UTC (2 instances)
- **Instance Refresh**: Rolling updates with 50% minimum healthy percentage
- **Health Checks**: EC2-based health monitoring

### Security Groups

1. **Bastion Security Group**: SSH (port 22) from anywhere
2. **Private Instances**: HTTP (80), port 8080, SSH from VPC
3. **Load Balancer**: HTTP (80), HTTPS (443), custom port 81

### High Availability

- Multi-AZ deployment (us-east-1a, us-east-1b)
- NAT Gateway for private subnet internet access
- Database subnet group for RDS deployment
- Automatic failover capabilities

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/AWS-NLB-Network-Load-Balancer.git
cd AWS-NLB-Network-Load-Balancer/terraform-manifests
```

### 2. Configure Variables

Update `vpc.auto.tfvars`:

```hcl
vpc_name = "myvpc"
vpc_cidr_block = "10.0.0.0/16"
vpc_availability_zones = ["us-east-1a", "us-east-1b"]
vpc_public_subnets = ["10.0.101.0/24", "10.0.102.0/24"]
vpc_private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
```

Update `ec2instance.auto.tfvars`:

```hcl
instance_type = "t2.micro"
instance_keypair = "terraform-key"
private_instance_count = 2
```

### 3. Update Domain and Email

Edit the following files:

- `c11-acm-certificatemanager.tf`: Update domain name
- `c12-route53-dnsregistration.tf`: Update DNS record
- `c13-05-autoscaling-notifications.tf`: Update SNS email

### 4. Add SSH Key

Place your private key in `private-key/terraform-key.pem`

### 5. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply configuration
terraform apply -auto-approve
```

## Deployment Time

- Initial deployment: ~10-15 minutes
- SSL certificate validation: ~5 minutes (DNS validation)
- Auto scaling group initialization: ~3-5 minutes

## Access Your Application

After deployment:

1. **Via Load Balancer DNS**:
   ```
   http://<nlb-dns-name>
   https://<nlb-dns-name>
   ```

2. **Via Custom Domain**:
   ```
   http://nlb.rezaops.com
   https://nlb.rezaops.com
   ```

3. **Bastion Host**:
   ```bash
   ssh -i private-key/terraform-key.pem ec2-user@<bastion-eip>
   ```

## Important Outputs

```bash
terraform output
```

Key outputs include:

- `dns_name`: NLB DNS name
- `ec2_bastion_public_ip`: Bastion host IP
- `vpc_id`: VPC identifier
- `autoscaling_group_name`: ASG name for monitoring

## Monitoring and Observability

### CloudWatch Metrics

- CPU Utilization (triggers auto scaling)
- Request count per target
- Healthy/unhealthy host count
- Network throughput

### SNS Notifications

Receive email alerts for:

- Instance launch events
- Instance termination events
- Launch/termination errors

### Health Checks

- **Interval**: 30 seconds
- **Timeout**: 6 seconds
- **Healthy threshold**: 3 consecutive successes
- **Unhealthy threshold**: 3 consecutive failures

## Cost Optimization

- Single NAT Gateway configuration (set `vpc_single_nat_gateway = true`)
- t2.micro instances for development
- Scheduled scaling to reduce costs during off-hours
- Deletion protection disabled for easy cleanup

## Cleanup

To destroy all resources:

```bash
terraform destroy -auto-approve
```

**Warning**: This will delete all resources including:
- Load balancer
- Auto scaling group and instances
- VPC and networking components
- Route53 records
- ACM certificates

## Troubleshooting

### SSL Certificate Not Validating

- Ensure Route53 hosted zone is properly configured
- Check DNS propagation: `nslookup nlb.rezaops.com`
- Verify ACM certificate status in AWS Console

### Instances Not Healthy

- Check security group rules
- Verify user data script executed successfully
- Review instance logs: `/var/log/cloud-init-output.log`

### Auto Scaling Not Working

- Check CloudWatch alarms
- Verify IAM permissions for Auto Scaling
- Review scaling policy configuration

## Security Considerations

- SSH access via bastion host only
- Private instances have no direct internet access
- SSL/TLS encryption for HTTPS traffic
- Security groups follow principle of least privilege
- Regular security group audits recommended

## Customization

### Change Instance Type

Edit `ec2instance.auto.tfvars`:

```hcl
instance_type = "t3.small"  # or t3.medium, etc.
```

### Adjust Scaling Parameters

Edit `c13-06-autoscaling-ttsp.tf`:

```hcl
target_value = 70.0  # Scale at 70% CPU instead of 50%
```

### Modify Health Check Path

Edit `c10-02-NLB-application-loadbalancer.tf`:

```hcl
path = "/health"  # Custom health check endpoint
```
