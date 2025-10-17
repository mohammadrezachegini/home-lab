# GCP Regional HTTPS Load Balancer with Self-Signed SSL

This Terraform project deploys a complete Regional HTTPS Load Balancer infrastructure on Google Cloud Platform with self-signed SSL certificates, auto-scaling, and HTTP to HTTPS redirection.

## Architecture Overview

This infrastructure creates:
- **VPC Network** with custom subnets
- **Regional Managed Instance Groups** with auto-scaling
- **Regional HTTPS Load Balancer** with SSL termination
- **HTTP to HTTPS Redirection**
- **Cloud NAT** for outbound internet access
- **Health Checks** for backend instances
- **Firewall Rules** for SSH, HTTP, and health checks

## Prerequisites

- Google Cloud Platform account
- Terraform >= 1.0
- `gcloud` CLI installed and configured
- A GCP project with billing enabled
- Appropriate IAM permissions to create resources

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
│   ├── c6-02-app1-mig-healthcheck.tf     # MIG health checks
│   ├── c6-03-app1-mig.tf                 # Managed instance group
│   ├── c6-04-app1-mig-autoscaling.tf     # Auto-scaling config
│   ├── c6-05-app1-mig-outputs.tf         # MIG outputs
│   ├── c7-01-loadbalancer.tf             # HTTPS load balancer
│   ├── c7-02-loadbalancer-http-to-https.tf  # HTTP redirect
│   ├── c7-03-loadbalancer-outputs.tf     # LB outputs
│   ├── c8-Cloud-NAT-Cloud-Router.tf      # Cloud NAT
│   ├── c9-certificate-manager.tf         # SSL certificate
│   ├── terraform.tfvars                  # Variable values
│   ├── app1-webserver-install.sh         # VM startup script
│   └── self-signed-ssl/
│       ├── app1.crt                      # SSL certificate
│       ├── app1.csr                      # Certificate request
│       └── app1.key                      # Private key
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

### Key Resources

**VPC Configuration:**
- Main subnet: `10.128.0.0/24`
- Regional proxy subnet: `10.0.0.0/24` (required for regional load balancer)

**Auto-scaling:**
- Min replicas: 2
- Max replicas: 6
- CPU target: 80%
- Cooldown period: 60 seconds

**Health Checks:**
- Path: `/index.html`
- Port: 80
- Interval: 5 seconds
- Timeout: 5 seconds

## Deployment Steps

### 1. Initialize Terraform

```bash
cd terraform-manifests
terraform init
```

### 2. Review the Plan

```bash
terraform plan
```

### 3. Apply the Configuration

```bash
terraform apply
```

Type `yes` when prompted to confirm.

### 4. Get the Load Balancer IP

After deployment, retrieve the load balancer IP:

```bash
terraform output mylb_static_ip_address
```

## Accessing the Application

### HTTPS Access
```bash
https://<load-balancer-ip>
```

**Note:** Since this uses a self-signed certificate, your browser will show a security warning. You can safely proceed for testing purposes.

### HTTP Access
HTTP requests are automatically redirected to HTTPS:
```bash
http://<load-balancer-ip>
```

## SSL Certificate

This project uses self-signed SSL certificates located in `self-signed-ssl/`:

### Generating New Self-Signed Certificates

If you need to generate new certificates:

```bash
# Generate private key
openssl genrsa -out app1.key 2048

# Generate certificate signing request
openssl req -new -key app1.key -out app1.csr -subj "/CN=app1.example.com"

# Generate self-signed certificate (valid for 20 years)
openssl x509 -req -days 7300 -in app1.csr -signkey app1.key -out app1.crt
```

### Using Production Certificates

For production, replace the self-signed certificates with valid certificates from a Certificate Authority (CA) or use Google-managed certificates.

## Features

### Auto-Healing
Instances are automatically replaced if they fail health checks after 300 seconds initial delay.

### Auto-Scaling
The system automatically scales between 2-6 instances based on CPU utilization.

### Cloud NAT
Backend instances have no external IP addresses and use Cloud NAT for outbound internet access.

### HTTP to HTTPS Redirect
All HTTP traffic is automatically redirected to HTTPS with a 301 (Moved Permanently) response.

## Firewall Rules

- **SSH (Port 22):** Open to `0.0.0.0/0` (consider restricting in production)
- **HTTP (Port 80):** Open to `0.0.0.0/0` for load balancer
- **Health Checks:** Open to GCP health check ranges (`35.191.0.0/16`, `130.211.0.0/22`)

## Monitoring and Management

### View Instance Group Status
```bash
gcloud compute instance-groups managed describe hr-dev-myapp1-mig --region=us-central1
```

### List Load Balancer Components
```bash
gcloud compute forwarding-rules list
gcloud compute target-https-proxies list
gcloud compute backend-services list
```

### View Certificate Manager
```bash
gcloud certificate-manager certificates list
gcloud certificate-manager certificates describe hr-dev-ssl-certificate
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

Type `yes` when prompted to confirm.

## Outputs

The following outputs are available after deployment:

- `mylb_static_ip_address` - Load balancer static IP
- `mylb_backend_service_self_link` - Backend service URL
- `mylb_url_map_self_link` - URL map self link
- `mylb_target_https_proxy_self_link` - HTTPS proxy self link
- `myapp1_mig_id` - Managed instance group ID
- `compute_zones` - Available compute zones

## Cost Considerations

This infrastructure uses the following billable resources:
- Compute Engine instances (e2-micro)
- Regional load balancer
- Static IP address
- Cloud NAT gateway
- Data transfer

Estimated cost: ~$30-50/month for minimal traffic (varies by region and usage)

## Security Best Practices

For production deployments:

1. **SSL Certificates:** Use valid CA-signed certificates or Google-managed certificates
2. **Firewall Rules:** Restrict SSH access to specific IP ranges
3. **IAM:** Use least privilege principles
4. **Cloud Armor:** Add DDoS protection and WAF rules
5. **Logging:** Enable load balancer logging for audit trails
6. **Secrets:** Use Secret Manager for sensitive data

## Troubleshooting

### Backend instances unhealthy
Check health check configuration and ensure nginx is running on port 80.

### Certificate errors
Verify certificate files are present in `self-signed-ssl/` directory.

### Load balancer not accessible
Ensure the regional proxy subnet exists and firewall rules allow health checks.
