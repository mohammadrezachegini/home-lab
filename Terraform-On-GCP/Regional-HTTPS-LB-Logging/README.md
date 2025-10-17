# GCP Regional HTTPS Load Balancer with Terraform

A production-ready Terraform infrastructure project that deploys a regional HTTPS load balancer on Google Cloud Platform with auto-scaling, SSL/TLS termination, and comprehensive logging capabilities.

## Architecture Overview

This project creates a complete load balancing solution with the following components:

- **Regional HTTPS Load Balancer** with SSL/TLS termination
- **Managed Instance Group (MIG)** with auto-scaling (2-6 instances)
- **Cloud NAT & Cloud Router** for outbound internet access
- **VPC with custom subnets** including proxy-only subnet
- **Nginx web servers** with Cloud Ops Agent for logging
- **HTTP to HTTPS redirection** for secure traffic
- **Health checks** for backend services
- **Self-signed SSL certificates** for HTTPS

## Prerequisites

- Google Cloud Platform account with billing enabled
- Terraform v1.0+ installed
- GCP CLI (`gcloud`) configured
- Project ID: `terraform-gcp-438417` (or update in variables)
- Appropriate IAM permissions to create resources

## Project Structure

```
terraform-manifests/
├── c1-versions.tf                          # Provider configuration
├── c2-01-variables.tf                      # Input variables
├── c2-02-local-values.tf                   # Local values
├── c3-vpc.tf                               # VPC and subnets
├── c4-firewallrules.tf                     # Firewall rules
├── c5-datasource.tf                        # Data sources for zones and images
├── c6-01-app1-instance-template.tf         # Instance template
├── c6-02-app1-mig-healthcheck.tf           # Health check configuration
├── c6-03-app1-mig.tf                       # Managed Instance Group
├── c6-04-app1-mig-autoscaling.tf          # Auto-scaling policy
├── c6-05-app1-mig-outputs.tf              # MIG outputs
├── c6-06-service-account-logging.tf        # Service account with logging permissions
├── c7-01-loadbalancer.tf                   # HTTPS load balancer setup
├── c7-02-loadbalancer-http-to-https.tf    # HTTP redirect configuration
├── c7-03-loadbalancer-outputs.tf          # Load balancer outputs
├── c8-Cloud-NAT-Cloud-Router.tf           # Cloud NAT and Router
├── c9-certificate-manager.tf               # SSL certificate management
├── install-opsagent-webserver.sh           # Startup script with Ops Agent
├── app1-webserver-install.sh               # Basic webserver setup
├── terraform.tfvars                        # Variable values
└── self-signed-ssl/
    ├── app1.crt                            # SSL certificate
    ├── app1.csr                            # Certificate signing request
    └── app1.key                            # Private key
```

## Features

### Load Balancing
- Regional HTTPS load balancer with external managed scheme
- SSL/TLS termination using Certificate Manager
- Automatic HTTP to HTTPS redirection
- URL mapping and routing capabilities

### Auto-Scaling
- Minimum: 2 instances
- Maximum: 6 instances
- CPU utilization target: 80%
- Cooldown period: 60 seconds

### Networking
- Custom VPC with regional subnets
- Proxy-only subnet for load balancer (10.0.0.0/24)
- Application subnet (10.128.0.0/24)
- Cloud NAT for outbound connectivity from private instances

### Security
- Firewall rules for SSH (port 22) and HTTP (port 80)
- Health check firewall rules (35.191.0.0/16, 130.211.0.0/22)
- SSL/TLS encryption for all traffic
- Service account with minimal required permissions

### Monitoring & Logging
- Google Cloud Ops Agent installed on all instances
- Nginx access and error logs forwarded to Cloud Logging
- Nginx metrics collected and sent to Cloud Monitoring
- Cloud NAT logging enabled

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Regional-HTTPS-LB-Logging/terraform-manifests
```

### 2. Configure Variables

Update `terraform.tfvars` with your values:

```hcl
gcp_project      = "your-project-id"
gcp_region1      = "us-central1"
machine_type     = "e2-micro"
environment      = "dev"
business_divsion = "hr"
```

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Review the Plan

```bash
terraform plan
```

### 5. Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted to confirm.

### 6. Access Your Application

After deployment completes, get the load balancer IP:

```bash
terraform output mylb_static_ip_address
```

Access your application:
- HTTPS: `https://<load-balancer-ip>`
- HTTP: `http://<load-balancer-ip>` (automatically redirects to HTTPS)

**Note**: Since this uses a self-signed certificate, you'll need to accept the security warning in your browser.

## Configuration

### Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `gcp_project` | GCP project ID | `terraform-gcp-438417` |
| `gcp_region1` | GCP region for resources | `us-central1` |
| `machine_type` | Compute Engine machine type | `e2-micro` |
| `environment` | Environment prefix | `dev` |
| `business_divsion` | Business division tag | `hr` |

### Customizing Auto-Scaling

Edit `c6-04-app1-mig-autoscaling.tf`:

```hcl
autoscaling_policy {
    min_replicas = 2      # Minimum instances
    max_replicas = 6      # Maximum instances
    cooldown_period = 60  # Cooldown in seconds
    cpu_utilization {
        target = 0.8      # 80% CPU target
    }
}
```

### Using Your Own SSL Certificate

Replace the files in `self-signed-ssl/`:
- `app1.crt` - Your SSL certificate
- `app1.key` - Your private key

Or use Google-managed certificates by modifying `c9-certificate-manager.tf`.

## Outputs

The following outputs are available after deployment:

```bash
# Load balancer IP
terraform output mylb_static_ip_address

# Backend service details
terraform output mylb_backend_service_self_link

# MIG information
terraform output myapp1_mig_id
terraform output myapp1_mig_status

# Available zones
terraform output compute_zones
```

## Monitoring

### View Logs

```bash
# View Nginx access logs
gcloud logging read "resource.type=gce_instance AND logName=projects/PROJECT_ID/logs/nginx_access"

# View Nginx error logs
gcloud logging read "resource.type=gce_instance AND logName=projects/PROJECT_ID/logs/nginx_error"

# View Cloud NAT logs
gcloud logging read "resource.type=nat_gateway"
```

### View Metrics

Navigate to Cloud Console → Monitoring → Metrics Explorer to view:
- Nginx request rate
- Response times
- Backend latency
- Instance health

## Cleanup

To destroy all created resources:

```bash
terraform destroy
```

Type `yes` when prompted to confirm.

**Warning**: This will delete all resources and cannot be undone.

## Troubleshooting

### Certificate Warnings

If using self-signed certificates, browsers will show security warnings. For production, use:
- Google-managed certificates
- Let's Encrypt certificates
- Certificates from a trusted CA

### Instances Not Healthy

Check:
1. Firewall rules allow health check traffic
2. Nginx is running: `sudo systemctl status nginx`
3. Health check endpoint accessible: `curl http://localhost/index.html`

### Cannot Access Load Balancer

Verify:
1. Load balancer provisioning is complete (can take 5-10 minutes)
2. Backend instances are healthy
3. Firewall rules are correctly configured
4. Static IP is correctly assigned

### Ops Agent Issues

If logs aren't appearing:

```bash
# Check Ops Agent status
sudo systemctl status google-cloud-ops-agent

# Restart Ops Agent
sudo systemctl restart google-cloud-ops-agent

# View Ops Agent logs
sudo journalctl -u google-cloud-ops-agent
```

## Cost Considerations

This infrastructure incurs costs for:
- Compute Engine instances (minimum 2 × e2-micro)
- Load balancer and forwarding rules
- Cloud NAT gateway
- Static IP address
- Network egress traffic
- Cloud Logging and Monitoring

Estimated monthly cost: $30-50 USD for dev environment with minimal traffic.

## Security Best Practices

- Use private instances without external IPs (implemented)
- Implement least-privilege IAM roles (implemented)
- Use VPC Service Controls for additional security
- Enable VPC Flow Logs for network monitoring
- Rotate SSL certificates regularly
- Use Cloud Armor for DDoS protection (not included)

