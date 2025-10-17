# GCP Regional HTTP Load Balancer with Managed Instance Group

This Terraform project deploys a complete Regional HTTP Load Balancer infrastructure on Google Cloud Platform with auto-scaling managed instance groups.

## Architecture Overview

This infrastructure creates:
- Custom VPC network with regional subnets
- Regional Managed Instance Group (MIG) with auto-scaling
- Regional HTTP Load Balancer with health checks
- Firewall rules for SSH and HTTP access
- Nginx web servers with custom application

## Prerequisites

- Google Cloud Platform account
- Terraform v1.0+ installed
- GCP CLI (`gcloud`) installed and configured
- Appropriate GCP project permissions

## Project Structure

```
terraform-manifests/
├── app1-webserver-install.sh          # Nginx installation script
├── c1-versions.tf                     # Provider configuration
├── c2-01-variables.tf                 # Input variables
├── c2-02-local-values.tf              # Local values
├── c3-vpc.tf                          # VPC and subnet configuration
├── c4-firewallrules.tf                # Firewall rules
├── c5-datasource.tf                   # Data sources for zones and images
├── c6-01-app1-instance-template.tf    # Instance template
├── c6-02-app1-mig-healthcheck.tf      # MIG health check
├── c6-03-app1-mig.tf                  # Managed Instance Group
├── c6-04-app1-mig-autoscaling.tf      # Auto-scaling configuration
├── c6-05-app1-mig-outputs.tf          # MIG outputs
├── c7-01-loadbalancer.tf              # Load balancer configuration
├── c7-02-loadbalancer-outputs.tf      # Load balancer outputs
└── terraform.tfvars                   # Variable values
```

## Features

### Networking
- **Custom VPC**: Isolated network environment
- **Regional Subnet**: 10.128.0.0/24 for compute instances
- **Proxy Subnet**: 10.0.0.0/24 for regional managed proxy

### Compute
- **Instance Template**: e2-micro instances with Debian 12
- **Auto-scaling**: 2-6 instances based on CPU utilization (80% threshold)
- **Health Checks**: HTTP checks every 5 seconds
- **Auto-healing**: 300-second initial delay

### Load Balancer
- **Regional HTTP LB**: External managed load balancer
- **Static IP**: Reserved regional IP address
- **Backend Service**: HTTP protocol with utilization-based balancing
- **Health Monitoring**: Automated instance health tracking

### Security
- **SSH Access**: Port 22 (configurable source ranges)
- **HTTP Access**: Port 80 for web traffic
- **Network Tags**: Tag-based firewall rules

## Configuration

### Variables

Edit `terraform.tfvars` to customize your deployment:

```hcl
gcp_project      = "your-project-id"
gcp_region1      = "us-central1"
machine_type     = "e2-micro"
environment      = "dev"
business_divsion = "hr"
```

### Available Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `gcp_project` | GCP Project ID | terraform-gcp-438417 |
| `gcp_region1` | GCP Region | us-central1 |
| `machine_type` | VM Machine Type | e2-micro |
| `environment` | Environment prefix | dev |
| `business_divsion` | Business division tag | hr |

## Deployment

### 1. Initialize Terraform

```bash
cd terraform-manifests
terraform init
```

### 2. Review Plan

```bash
terraform plan
```

### 3. Apply Configuration

```bash
terraform apply
```

Type `yes` when prompted to confirm.

### 4. Access Your Application

After deployment, get the load balancer IP:

```bash
terraform output mylb_static_ip_address
```

Access the application:
```bash
http://<load-balancer-ip>
```

## Outputs

The configuration provides several outputs:

```hcl
# Load Balancer
mylb_static_ip_address              # LB static IP
mylb_forwarding_rule_ip_address     # Forwarding rule IP
mylb_backend_service_self_link      # Backend service link

# Managed Instance Group
myapp1_mig_id                       # MIG identifier
myapp1_mig_instance_group           # Instance group
myapp1_mig_status                   # MIG status

# Compute Resources
compute_zones                       # Available zones
vmimage_name                        # VM image name
```

## Auto-Scaling Behavior

The MIG auto-scales based on:
- **Minimum Instances**: 2
- **Maximum Instances**: 6
- **CPU Target**: 80% utilization
- **Cooldown Period**: 60 seconds

## Health Checks

Two health checks are configured:

**MIG Health Check**:
- Interval: 5 seconds
- Timeout: 5 seconds
- Healthy threshold: 2
- Unhealthy threshold: 3

**Load Balancer Health Check**:
- Interval: 5 seconds
- Timeout: 5 seconds
- Healthy threshold: 2
- Unhealthy threshold: 2

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

Type `yes` when prompted to confirm.

## Cost Estimation

Estimated monthly costs (us-central1):
- e2-micro instances: ~$7-8 per instance
- Load Balancer: ~$18-25
- Network egress: Variable
- Static IP: $3-5

**Note**: Costs vary based on usage and data transfer.

## Troubleshooting

### Common Issues

**Issue**: Quota exceeded
- **Solution**: Check GCP quotas and request increases if needed

**Issue**: Health checks failing
- **Solution**: Verify firewall rules allow health check traffic from GCP ranges

**Issue**: Instances not scaling
- **Solution**: Check CPU utilization and auto-scaling policy settings

### Debug Commands

```bash
# Check MIG status
gcloud compute instance-groups managed describe hr-dev-myapp1-mig --region=us-central1

# List instances
gcloud compute instances list

# Check load balancer
gcloud compute forwarding-rules list

# View logs
gcloud logging read "resource.type=gce_instance"
```

## Security Considerations

- Modify SSH firewall rule to restrict source IPs
- Implement Cloud Armor for DDoS protection
- Enable VPC Flow Logs for network monitoring
- Use Secret Manager for sensitive data
- Implement IAM best practices

## Customization

### Change Web Application

Edit `app1-webserver-install.sh` to modify the web application.

### Different OS Images

Uncomment desired OS in `c5-datasource.tf`:
- Debian 12 (default)
- CentOS Stream 9
- RHEL 9
- Ubuntu 20.04 LTS
- Windows Server 2022
- Rocky Linux 8

### Adjust Auto-Scaling

Modify `c6-04-app1-mig-autoscaling.tf`:
```hcl
min_replicas = 3
max_replicas = 10
target = 0.7  # 70% CPU
```
