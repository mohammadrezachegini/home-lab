# GCP Regional HTTP Load Balancer with Host-Based Routing

This Terraform project demonstrates how to set up a Regional HTTP Load Balancer on Google Cloud Platform with host-based routing to direct traffic to different backend services based on the hostname.

## Architecture Overview

This infrastructure provisions:

- **VPC Network** with custom subnets and a regional proxy subnet
- **Two Managed Instance Groups (MIGs)** running separate web applications
- **Regional HTTP Load Balancer** with host-based routing rules
- **Auto-scaling** based on CPU utilization
- **Cloud NAT** for outbound internet connectivity
- **Health checks** for application availability monitoring

### Traffic Flow

```
Internet → Load Balancer → Host-based routing
                           ├── app1.rezaops.com → MyApp1 MIG
                           └── app2.rezaops.com → MyApp2 MIG
```

## Prerequisites

- Google Cloud Platform account
- Terraform installed (compatible with version 6.6.0+ of the Google provider)
- `gcloud` CLI configured with appropriate credentials
- A GCP project with billing enabled

## Project Structure

```
terraform-manifests/
├── app1-webserver-install.sh          # App1 startup script
├── app2-webserver-install.sh          # App2 startup script
├── c1-versions.tf                     # Provider configuration
├── c2-01-variables.tf                 # Input variables
├── c2-02-local-values.tf              # Local values
├── c3-vpc.tf                          # VPC and subnet configuration
├── c4-firewallrules.tf                # Firewall rules
├── c5-datasource.tf                   # Data sources for zones and images
├── c6-01-app1-instance-template.tf    # App1 instance template
├── c6-02-app1-mig-healthcheck.tf      # App1 health check
├── c6-03-app1-mig.tf                  # App1 managed instance group
├── c6-04-app1-mig-autoscaling.tf      # App1 autoscaling configuration
├── c6-05-app1-mig-outputs.tf          # App1 outputs
├── c6-06-app2-instance-template.tf    # App2 instance template
├── c6-07-app2-mig-healthcheck.tf      # App2 health check
├── c6-08-app2-mig.tf                  # App2 managed instance group
├── c6-09-app2-mig-autoscaling.tf      # App2 autoscaling configuration
├── c6-10-app2-mig-outputs.tf          # App2 outputs
├── c7-01-loadbalancer.tf              # Load balancer configuration
├── c7-02-loadbalancer-outputs.tf      # Load balancer outputs
├── c8-Cloud-NAT-Cloud-Router.tf       # Cloud NAT and Router
└── terraform.tfvars                   # Variable values
```

## Key Features

### Host-Based Routing

The load balancer routes traffic based on the hostname:

- `app1.rezaops.com` → Routes to App1 backend service
- `app2.rezaops.com` → Routes to App2 backend service

### Auto-Scaling Configuration

**App1:**
- Min replicas: 2
- Max replicas: 6
- CPU target: 80%
- Cooldown: 60 seconds

**App2:**
- Min replicas: 2
- Max replicas: 4
- CPU target: 90%
- Cooldown: 60 seconds

### Health Checks

Both applications have configured health checks:
- Check interval: 5 seconds
- Timeout: 5 seconds
- Healthy threshold: 2 consecutive successes
- Unhealthy threshold: 3 consecutive failures

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

### Network Configuration

- **Main Subnet:** `10.128.0.0/24`
- **Regional Proxy Subnet:** `10.0.0.0/24`

## Deployment Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd GCP-Samples/Regional-HTTP-LB-HOST-Routing/terraform-manifests
```

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Review the Plan

```bash
terraform plan
```

### 4. Apply the Configuration

```bash
terraform apply
```

Type `yes` when prompted to confirm.

### 5. Configure DNS

After deployment, Terraform will output the load balancer's static IP address. Configure your DNS records:

```
app1.rezaops.com  →  A  →  <load_balancer_ip>
app2.rezaops.com  →  A  →  <load_balancer_ip>
```

### 6. Verify Deployment

Wait 5-10 minutes for the infrastructure to fully provision, then test:

```bash
curl http://app1.rezaops.com
curl http://app2.rezaops.com
```

## Firewall Rules

The configuration includes three firewall rules:

1. **SSH Access** - Port 22 (for management)
2. **HTTP Access** - Port 80 (for web traffic)
3. **Health Checks** - Port 80 from Google's health check IP ranges

## Outputs

After deployment, the following outputs are available:

- `mylb_static_ip_address` - Load balancer IP address
- `mylb_forwarding_rule_ip_address` - Forwarding rule IP
- `myapp1_mig_instance_group` - App1 instance group URL
- `myapp2_mig_instance_group` - App2 instance group URL
- `compute_zones` - List of available zones
- `vmimage_*` - VM image information

View outputs:

```bash
terraform output
```

## Clean Up

To destroy all resources:

```bash
terraform destroy
```

Type `yes` when prompted to confirm.

## Security Considerations

- VMs do not have external IP addresses (they use Cloud NAT for outbound connectivity)
- Firewall rules are configured to allow only necessary traffic
- Health check source ranges are restricted to Google's IP ranges
- Consider implementing HTTPS with SSL certificates for production use

## Cost Optimization

This configuration uses:
- `e2-micro` instances (cost-effective for demos)
- Minimum of 2 replicas per MIG
- Regional resources (lower cost than global)

For production, consider:
- Right-sizing instance types based on actual workload
- Adjusting min/max replicas based on traffic patterns
- Implementing committed use discounts

## Troubleshooting

### Instances not healthy
- Check health check configuration
- Verify firewall rules allow health check traffic
- Confirm web servers are running and responding on port 80

### Cannot access applications
- Verify DNS records are properly configured
- Check load balancer is fully provisioned (can take 5-10 minutes)
- Ensure firewall rules allow HTTP traffic

### Auto-scaling not working
- Monitor CPU utilization in Cloud Console
- Verify autoscaling policy configuration
- Check for quota limits in your GCP project

