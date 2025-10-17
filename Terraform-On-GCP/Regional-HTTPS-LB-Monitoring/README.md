# GCP Regional HTTPS Load Balancer with Monitoring

A complete Terraform infrastructure-as-code solution for deploying a production-ready Regional HTTPS Load Balancer on Google Cloud Platform with integrated monitoring, autoscaling, and SSL/TLS termination.

## Architecture Overview

This project deploys a secure, scalable web application infrastructure featuring:

- **Regional HTTPS Load Balancer** with SSL/TLS termination
- **HTTP to HTTPS automatic redirection**
- **Managed Instance Groups (MIG)** with autoscaling (2-6 instances)
- **Health checks** for both load balancer and MIG
- **Cloud Monitoring** with uptime checks and alerting
- **Cloud NAT** for secure outbound internet access
- **Custom VPC** with regional subnets
- **Ops Agent** for nginx metrics and logging

## Prerequisites

- Google Cloud Platform account
- Terraform >= 1.0
- `gcloud` CLI configured
- Project with billing enabled
- Required GCP APIs enabled:
  - Compute Engine API
  - Certificate Manager API
  - Cloud Monitoring API
  - Cloud Logging API

## Project Structure

```
.
├── terraform-manifests/
│   ├── c1-versions.tf                    # Provider configuration
│   ├── c2-01-variables.tf                # Input variables
│   ├── c2-02-local-values.tf             # Local values
│   ├── c3-vpc.tf                         # VPC and subnets
│   ├── c4-firewallrules.tf               # Firewall rules
│   ├── c5-datasource.tf                  # Data sources
│   ├── c6-01-app1-instance-template.tf   # Instance template
│   ├── c6-02-app1-mig-healthcheck.tf     # MIG health check
│   ├── c6-03-app1-mig.tf                 # Managed Instance Group
│   ├── c6-04-app1-mig-autoscaling.tf     # Autoscaling configuration
│   ├── c6-05-app1-mig-outputs.tf         # MIG outputs
│   ├── c6-06-service-account-logging.tf  # Service account & IAM
│   ├── c7-01-loadbalancer.tf             # HTTPS load balancer
│   ├── c7-02-loadbalancer-http-to-https.tf # HTTP redirect
│   ├── c7-03-loadbalancer-outputs.tf     # LB outputs
│   ├── c8-Cloud-NAT-Cloud-Router.tf      # Cloud NAT setup
│   ├── c9-certificate-manager.tf         # SSL certificate
│   ├── c10-01-monitoring-uptime-checks.tf # Monitoring & alerts
│   ├── install-opsagent-webserver.sh     # Startup script
│   ├── terraform.tfvars                  # Variable values
│   └── self-signed-ssl/
│       ├── app1.crt                      # SSL certificate
│       ├── app1.csr                      # Certificate request
│       └── app1.key                      # Private key
```

## Key Features

### Load Balancing
- Regional External Application Load Balancer
- SSL/TLS termination with Certificate Manager
- Automatic HTTP to HTTPS redirect
- Health check based routing

### Security
- Private VM instances (no external IPs)
- Cloud NAT for secure outbound connectivity
- Firewall rules for SSH, HTTP, and health checks
- Self-signed SSL certificate (replace with CA-signed for production)

### Monitoring & Observability
- Uptime checks every 60 seconds
- Email notifications on failures
- Ops Agent collecting nginx metrics and logs
- Custom alert policies with configurable thresholds

### High Availability & Scaling
- Auto-healing with health checks (5-minute initial delay)
- CPU-based autoscaling (target: 80% utilization)
- Multi-zone distribution for fault tolerance
- Min 2, Max 6 instances

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd GCP-Samples/Regional-HTTPS-LB-Monitoring/terraform-manifests
```

### 2. Configure Variables

Edit `terraform.tfvars`:

```hcl
gcp_project            = "your-project-id"
gcp_region1            = "us-central1"
machine_type           = "e2-micro"
environment            = "dev"
business_divsion       = "hr"
gcp_notification_email = "your-email@example.com"
```

### 3. Generate SSL Certificate (Optional)

For production, use a CA-signed certificate. For testing:

```bash
cd self-signed-ssl
openssl req -x509 -newkey rsa:2048 -keyout app1.key -out app1.crt \
  -days 7300 -nodes -subj "/CN=app1.yourdomain.com"
cd ..
```

### 4. Initialize and Deploy

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Deploy infrastructure
terraform apply
```

### 5. Access Your Application

After deployment completes, get the load balancer IP:

```bash
terraform output mylb_static_ip_address
```

Access via:
- HTTPS: `https://<LB_IP_ADDRESS>`
- HTTP: `http://<LB_IP_ADDRESS>` (redirects to HTTPS)

## Configuration Details

### Autoscaling Policy

```hcl
min_replicas = 2
max_replicas = 6
cooldown_period = 60 seconds
cpu_target = 80%
```

### Health Check Settings

**MIG Health Check:**
- Interval: 5 seconds
- Timeout: 5 seconds
- Healthy threshold: 2
- Unhealthy threshold: 3

**Load Balancer Health Check:**
- Interval: 5 seconds
- Timeout: 5 seconds
- Healthy threshold: 2
- Unhealthy threshold: 2

### Firewall Rules

- SSH (port 22): `0.0.0.0/0`
- HTTP (port 80): `0.0.0.0/0`
- Health checks: `35.191.0.0/16`, `130.211.0.0/22`

## Monitoring Setup

The project configures:

1. **Uptime Check**: Monitors HTTPS endpoint every 60 seconds
2. **Alert Policy**: Triggers when uptime check fails
3. **Notification Channel**: Sends email alerts
4. **Ops Agent**: Collects nginx metrics and logs

View monitoring in GCP Console:
- Monitoring > Uptime checks
- Monitoring > Alerting
- Logging > Logs Explorer

## Customization

### Change Application Content

Edit `install-opsagent-webserver.sh` to modify the web content:

```bash
sudo echo "Your custom HTML" | sudo tee /var/www/html/index.html
```

### Adjust Instance Count

Modify `c6-04-app1-mig-autoscaling.tf`:

```hcl
min_replicas = 3  # Increase minimum
max_replicas = 10 # Increase maximum
```

### Use Different VM Image

Edit `c5-datasource.tf` to change the OS:

```hcl
# For Ubuntu
project = "ubuntu-os-cloud"
family  = "ubuntu-2004-lts"
```

## Cost Optimization

- Uses `e2-micro` instances (free tier eligible)
- Regional (not global) load balancer for lower cost
- Cloud NAT auto-allocation (no reserved IPs)
- Consider committed use discounts for production

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete all resources including the load balancer, instances, and VPC.

## Troubleshooting

### Instances Not Healthy

```bash
# Check instance status
gcloud compute instance-groups managed list-instances <mig-name> \
  --region=us-central1

# View serial console logs
gcloud compute instances get-serial-port-output <instance-name>
```

### SSL Certificate Issues

```bash
# List certificates
gcloud certificate-manager certificates list

# Describe certificate
gcloud certificate-manager certificates describe <cert-name>
```

### Load Balancer Not Responding

1. Verify forwarding rule: `gcloud compute forwarding-rules list`
2. Check backend health: `gcloud compute backend-services get-health <backend-name>`
3. Review firewall rules: `gcloud compute firewall-rules list`

## Security Considerations

⚠️ **Before Production Use:**

1. Replace self-signed certificate with CA-signed certificate
2. Implement Cloud Armor for DDoS protection
3. Use Cloud Identity-Aware Proxy (IAP) for admin access
4. Enable VPC Flow Logs for network analysis
5. Implement least privilege IAM policies
6. Use Secret Manager for sensitive data
7. Enable audit logging

