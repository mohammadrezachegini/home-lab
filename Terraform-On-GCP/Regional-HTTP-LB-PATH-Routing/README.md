# GCP Regional HTTP Load Balancer with Path-Based Routing

A Terraform infrastructure project that deploys a Regional HTTP Load Balancer on Google Cloud Platform with path-based routing to distribute traffic between two separate application backends.

## Architecture Overview

This project creates a complete load balancing infrastructure including:

- **VPC Network** with custom subnets and proxy-only subnet
- **Two Managed Instance Groups (MIGs)** running Nginx web servers
- **Regional HTTP Load Balancer** with path-based routing
- **Auto-scaling** capabilities based on CPU utilization
- **Health checks** for automatic failover
- **Cloud NAT** for outbound internet access

### Traffic Routing

- `/app1/*` → Routes to App1 backend (pink background)
- `/app2/*` → Routes to App2 backend (blue background)
- `/` → Default routes to App1

## Prerequisites

- Google Cloud Platform account
- Terraform >= 1.0
- Google Cloud Provider >= 6.6.0
- Appropriate GCP permissions to create:
  - Compute instances
  - Networks and subnets
  - Load balancers
  - Firewall rules

## Project Structure

```
terraform-manifests/
├── c1-versions.tf                    # Provider configuration
├── c2-01-variables.tf                # Input variables
├── c2-02-local-values.tf             # Local values
├── c3-vpc.tf                         # VPC and subnet configuration
├── c4-firewallrules.tf               # Firewall rules
├── c5-datasource.tf                  # Data sources for zones and images
├── c6-01-app1-instance-template.tf   # App1 instance template
├── c6-02-app1-mig-healthcheck.tf     # App1 health check
├── c6-03-app1-mig.tf                 # App1 managed instance group
├── c6-04-app1-mig-autoscaling.tf     # App1 autoscaling configuration
├── c6-05-app1-mig-outputs.tf         # App1 outputs
├── c6-06-app2-instance-template.tf   # App2 instance template
├── c6-07-app2-mig-healthcheck.tf     # App2 health check
├── c6-08-app2-mig.tf                 # App2 managed instance group
├── c6-09-app2-mig-autoscaling.tf     # App2 autoscaling configuration
├── c6-10-app2-mig-outputs.tf         # App2 outputs
├── c7-01-loadbalancer.tf             # Load balancer configuration
├── c7-02-loadbalancer-outputs.tf     # Load balancer outputs
├── c8-Cloud-NAT-Cloud-Router.tf      # Cloud NAT and Router
├── app1-webserver-install.sh         # App1 startup script
├── app2-webserver-install.sh         # App2 startup script
└── terraform.tfvars                  # Variable values
```

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

### Key Components

#### App1 Configuration
- **Min Replicas**: 2
- **Max Replicas**: 6
- **CPU Target**: 80%
- **Health Check**: `/index.html`
- **Background Color**: Pink (rgb(250, 210, 210))

#### App2 Configuration
- **Min Replicas**: 2
- **Max Replicas**: 4
- **CPU Target**: 90%
- **Health Check**: `/app2/index.html`
- **Background Color**: Blue (rgb(110, 190, 210))

## Deployment

### Step 1: Initialize Terraform

```bash
cd terraform-manifests
terraform init
```

### Step 2: Validate Configuration

```bash
terraform validate
```

### Step 3: Plan Infrastructure

```bash
terraform plan
```

### Step 4: Apply Configuration

```bash
terraform apply
```

Type `yes` when prompted to confirm the deployment.

### Step 5: Get Load Balancer IP

```bash
terraform output mylb_static_ip_address
```

## Testing

After deployment, test the load balancer using the static IP address:

```bash
# Get the load balancer IP
LB_IP=$(terraform output -raw mylb_static_ip_address)

# Test default path (routes to App1)
curl http://$LB_IP/

# Test App1 path
curl http://$LB_IP/app1/

# Test App2 path
curl http://$LB_IP/app2/
```

You should see:
- App1 responses with a pink background
- App2 responses with a blue background
- Each response includes VM hostname and IP address

## Network Architecture

### VPC Configuration
- **VPC CIDR**: Custom (no auto-created subnets)
- **Application Subnet**: `10.128.0.0/24`
- **Proxy Subnet**: `10.0.0.0/24` (for Regional Load Balancer)

### Firewall Rules
- **SSH**: Port 22 (from 0.0.0.0/0)
- **HTTP**: Port 80 (from 0.0.0.0/0)
- **Health Checks**: Port 80 (from GCP health check ranges)

## Auto-scaling

Both applications automatically scale based on CPU utilization:

- **Cooldown Period**: 60 seconds
- **Initial Delay**: 300 seconds for health checks
- **Scaling Trigger**: CPU utilization threshold

## Health Checks

- **Check Interval**: 5 seconds
- **Timeout**: 5 seconds
- **Healthy Threshold**: 2 consecutive successes
- **Unhealthy Threshold**: 3 consecutive failures

## Outputs

The following outputs are available after deployment:

```bash
# Load Balancer IP
terraform output mylb_static_ip_address

# Backend Services
terraform output myapp1_backend_service_self_link
terraform output myapp2_backend_service_self_link

# Instance Groups
terraform output myapp1_mig_id
terraform output myapp2_mig_id

# Available Zones
terraform output compute_zones
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

Type `yes` when prompted to confirm deletion.

## Cost Considerations

This infrastructure uses the following billable resources:

- Compute Engine instances (e2-micro)
- Regional Load Balancer
- Cloud NAT
- Network egress

Estimated monthly cost: ~$50-100 (varies by region and traffic)

## Troubleshooting

### Instances Not Healthy

Check health check configuration and ensure:
- Firewall rules allow health check traffic
- Application is responding on correct paths
- Initial delay period has passed (300 seconds)

### Cannot Access Load Balancer

Verify:
- Load balancer is fully provisioned (can take 5-10 minutes)
- Static IP is correctly assigned
- Firewall rules allow HTTP traffic

### Auto-scaling Not Working

Ensure:
- CPU utilization thresholds are being met
- Cooldown period has elapsed
- Instance group is healthy

## Security Best Practices

- Instances have no external IPs (using Cloud NAT)
- Firewall rules restrict access to necessary ports only
- Health check sources limited to GCP ranges
- Consider implementing Cloud Armor for DDoS protection
- Use HTTPS with SSL certificates in production


