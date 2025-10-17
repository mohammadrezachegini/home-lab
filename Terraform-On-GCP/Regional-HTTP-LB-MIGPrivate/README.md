# GCP Regional HTTP Load Balancer with Private Managed Instance Group

This Terraform project provisions a complete Regional HTTP Load Balancer infrastructure on Google Cloud Platform with private VM instances in a Managed Instance Group (MIG), including autoscaling, health checks, and Cloud NAT for outbound internet access.

## Architecture Overview

This infrastructure deploys:

- **VPC Network** with custom subnets
- **Private Managed Instance Group** (no external IPs on VMs)
- **Regional HTTP Load Balancer** with external IP
- **Cloud NAT** for outbound internet access from private VMs
- **Autoscaling** based on CPU utilization
- **Health Checks** for both MIG and Load Balancer
- **Firewall Rules** for SSH and HTTP access

## Prerequisites

- Google Cloud Platform account
- `gcloud` CLI installed and configured
- Terraform >= 1.0 installed
- GCP project with billing enabled
- Required GCP APIs enabled:
  - Compute Engine API
  - Cloud Resource Manager API

## Project Structure

```
terraform-manifests/
├── app1-webserver-install.sh           # Startup script for web servers
├── c1-versions.tf                      # Terraform and provider versions
├── c2-01-variables.tf                  # Input variables
├── c2-02-local-values.tf               # Local values for naming
├── c3-vpc.tf                           # VPC and subnets
├── c4-firewallrules.tf                 # Firewall rules
├── c5-datasource.tf                    # Data sources for zones and images
├── c6-01-app1-instance-template.tf     # Instance template definition
├── c6-02-app1-mig-healthcheck.tf       # MIG health check
├── c6-03-app1-mig.tf                   # Managed Instance Group
├── c6-04-app1-mig-autoscaling.tf       # Autoscaling configuration
├── c6-05-app1-mig-outputs.tf           # MIG outputs
├── c7-01-loadbalancer.tf               # Load balancer resources
├── c7-02-loadbalancer-outputs.tf       # Load balancer outputs
├── c8-Cloud-NAT-Cloud-Router.tf        # Cloud NAT and Router
└── terraform.tfvars                     # Variable values
```

## Key Features

### Networking
- Custom VPC with two subnets:
  - Application subnet: `10.128.0.0/24`
  - Regional proxy subnet: `10.0.0.0/24` (for load balancer)
- Cloud NAT for private VM internet access
- Firewall rules for SSH (port 22) and HTTP (port 80)

### Compute Resources
- Private VM instances (no external IPs)
- Debian 12 base image
- e2-micro machine type (configurable)
- Nginx web server with custom HTML
- Distributed across multiple zones for high availability

### Load Balancing
- Regional HTTP(S) Load Balancer
- External static IP address
- Health checks on `/index.html`
- Backend service with UTILIZATION balancing mode

### Autoscaling
- Minimum replicas: 2
- Maximum replicas: 6
- CPU utilization target: 80%
- Cooldown period: 60 seconds
- Auto-healing with 300-second initial delay

## Configuration

### Input Variables

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
| `gcp_project` | GCP project ID | `terraform-gcp-438417` |
| `gcp_region1` | GCP region for resources | `us-central1` |
| `machine_type` | Compute Engine machine type | `e2-micro` |
| `environment` | Environment prefix | `dev` |
| `business_divsion` | Business division tag | `sap` |

## Deployment

### Step 1: Initialize Terraform

```bash
cd terraform-manifests
terraform init
```

### Step 2: Review the Plan

```bash
terraform plan
```

### Step 3: Apply the Configuration

```bash
terraform apply
```

Type `yes` when prompted to confirm the deployment.

### Step 4: Access Your Application

After deployment completes, get the load balancer IP:

```bash
terraform output mylb_static_ip_address
```

Access your application:

```bash
curl http://<LOAD_BALANCER_IP>
# or
curl http://<LOAD_BALANCER_IP>/app1/
```

## Outputs

The deployment provides the following outputs:

### MIG Outputs
- `myapp1_mig_id` - MIG unique identifier
- `myapp1_mig_instance_group` - Instance group URL
- `myapp1_mig_self_link` - MIG self link
- `myapp1_mig_status` - MIG status

### Load Balancer Outputs
- `mylb_static_ip_address` - Load balancer static IP
- `mylb_backend_service_self_link` - Backend service URL
- `mylb_url_map_self_link` - URL map configuration
- `mylb_target_http_proxy_self_link` - HTTP proxy URL
- `mylb_forwarding_rule_ip_address` - Forwarding rule IP

### Image and Zone Outputs
- `compute_zones` - Available zones in the region
- `vmimage_*` - Details about the VM image being used

## Monitoring and Management

### View Instance Group Status

```bash
gcloud compute instance-groups managed describe hr-dev-myapp1-mig \
  --region=us-central1
```

### List Running Instances

```bash
gcloud compute instance-groups managed list-instances hr-dev-myapp1-mig \
  --region=us-central1
```

### Check Load Balancer Health

```bash
gcloud compute backend-services get-health hr-dev-myapp1-backend-service \
  --region=us-central1
```

### View Autoscaler Status

```bash
gcloud compute instance-groups managed describe hr-dev-myapp1-mig \
  --region=us-central1 \
  --format="get(status.autoscaler)"
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

Type `yes` when prompted to confirm the destruction.

## Cost Considerations

This infrastructure incurs charges for:
- Compute Engine VM instances (2-6 instances)
- Load Balancer (forwarding rules and bandwidth)
- Static IP address
- Cloud NAT (per-VM and data processing charges)
- Network egress

Estimate costs using the [GCP Pricing Calculator](https://cloud.google.com/products/calculator).

## Security Best Practices

- ✅ VM instances have no external IPs (private by default)
- ✅ Outbound internet access via Cloud NAT
- ✅ Firewall rules restrict access to specific ports
- ⚠️ SSH access is open to `0.0.0.0/0` - consider restricting to your IP
- ⚠️ HTTP access is open to `0.0.0.0/0` - normal for public web applications

### Hardening Recommendations

1. **Restrict SSH access:**
   ```hcl
   source_ranges = ["YOUR_IP_ADDRESS/32"]
   ```

2. **Enable Cloud Armor** for DDoS protection and WAF

3. **Use HTTPS** instead of HTTP (requires SSL certificate)

4. **Enable VPC Flow Logs** for network monitoring

5. **Implement Cloud IAP** for authenticated access

## Troubleshooting

### VMs Not Serving Traffic

Check health check status:
```bash
gcloud compute backend-services get-health hr-dev-myapp1-backend-service --region=us-central1
```

### Cannot SSH to Instances

Since instances are private, use IAP tunnel:
```bash
gcloud compute ssh INSTANCE_NAME --zone=ZONE --tunnel-through-iap
```

### Autoscaling Not Working

1. Verify autoscaler is active
2. Check CPU utilization metrics in Cloud Monitoring
3. Ensure cooldown period has passed

### Health Checks Failing

1. Verify firewall rule allows health check IPs (`35.191.0.0/16`, `130.211.0.0/22`)
2. Confirm web server is running: `systemctl status nginx`
3. Test health check endpoint: `curl http://localhost/index.html`
