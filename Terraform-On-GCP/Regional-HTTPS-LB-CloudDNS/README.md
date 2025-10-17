# GCP Regional HTTPS Load Balancer with Cloud DNS

This Terraform project provisions a complete Regional HTTPS Load Balancer infrastructure on Google Cloud Platform with SSL certificate management, Cloud DNS integration, and auto-scaling capabilities.

## Architecture Overview

This infrastructure creates a production-ready, highly available web application deployment with:

- **Regional HTTPS Load Balancer** with automatic HTTP to HTTPS redirection
- **Managed Instance Group (MIG)** with auto-scaling (2-6 instances)
- **Cloud Certificate Manager** for automated SSL certificate provisioning
- **Cloud DNS** for domain management
- **Cloud NAT** for secure outbound internet access
- **Health Checks** for backend instance monitoring
- **Custom VPC** with dedicated proxy subnet

## Features

- ✅ Automatic SSL certificate provisioning and renewal
- ✅ HTTP to HTTPS redirection
- ✅ Auto-scaling based on CPU utilization (80% threshold)
- ✅ Auto-healing with health checks
- ✅ Regional deployment for high availability
- ✅ Cloud NAT for secure outbound connectivity
- ✅ Firewall rules for SSH, HTTP, and health checks
- ✅ Debian 12 base image with Nginx web server

## Prerequisites

Before you begin, ensure you have:

1. **Google Cloud Platform Account** with billing enabled
2. **GCP Project** created
3. **Domain Name** registered and configured in Cloud DNS
4. **Terraform** installed (compatible with Google provider v6.6.0)
5. **gcloud CLI** installed and authenticated
6. Required **GCP APIs** enabled:
   - Compute Engine API
   - Certificate Manager API
   - Cloud DNS API
   - Cloud NAT API

## Project Structure

```
terraform-manifests/
├── app1-webserver-install.sh              # Nginx installation script
├── c1-versions.tf                         # Provider configuration
├── c2-01-variables.tf                     # Input variables
├── c2-02-local-values.tf                  # Local values
├── c3-vpc.tf                              # VPC and subnets
├── c4-firewallrules.tf                    # Firewall rules
├── c5-datasource.tf                       # Data sources
├── c6-01-app1-instance-template.tf        # Instance template
├── c6-02-app1-mig-healthcheck.tf          # Health check for MIG
├── c6-03-app1-mig.tf                      # Managed Instance Group
├── c6-04-app1-mig-autoscaling.tf          # Auto-scaling configuration
├── c6-05-app1-mig-outputs.tf              # MIG outputs
├── c7-01-loadbalancer.tf                  # HTTPS Load Balancer
├── c7-02-loadbalancer-http-to-https.tf    # HTTP to HTTPS redirect
├── c7-03-loadbalancer-outputs.tf          # Load Balancer outputs
├── c8-Cloud-NAT-Cloud-Router.tf           # Cloud NAT configuration
├── c9-cloud-dns.tf                        # Cloud DNS A record
├── c10-certificate-manager.tf             # SSL certificate management
└── terraform.tfvars                       # Variable values
```

## Configuration

### 1. Update Variables

Edit `terraform.tfvars` with your project details:

```hcl
gcp_project      = "your-project-id"
gcp_region1      = "us-central1"
machine_type     = "e2-micro"
environment      = "dev"
business_divsion = "hr"
```

### 2. Configure Domain

Update `c9-cloud-dns.tf` with your domain information:

```hcl
locals {
  mydomain = "myapp1.yourdomain.com"
  dns_managed_zone = "your-dns-zone-name"
}
```

### 3. Cloud DNS Setup

Ensure you have a Cloud DNS managed zone configured for your domain. The zone name should match the `dns_managed_zone` value.

## Deployment

### Initialize Terraform

```bash
cd terraform-manifests
terraform init
```

### Plan Infrastructure

```bash
terraform plan
```

### Apply Configuration

```bash
terraform apply
```

Type `yes` when prompted to confirm the deployment.

### Deployment Timeline

- **Infrastructure Creation**: ~5-10 minutes
- **SSL Certificate Provisioning**: 10-30 minutes
- **Total Setup Time**: ~15-40 minutes

The SSL certificate provisioning requires DNS validation, which may take additional time to complete.

## Accessing Your Application

Once deployed, your application will be accessible at:

- **HTTPS**: `https://myapp1.yourdomain.com`
- **HTTP**: `http://myapp1.yourdomain.com` (automatically redirects to HTTPS)

## Monitoring and Management

### View Load Balancer IP

```bash
terraform output mylb_static_ip_address
```

### Check Certificate Status

```bash
gcloud certificate-manager certificates list
gcloud certificate-manager certificates describe <certificate-name>
```

### View Backend Health

```bash
gcloud compute backend-services get-health <backend-service-name> --region=us-central1
```

### List Instance Groups

```bash
gcloud compute instance-groups managed list
```

## Auto-Scaling Configuration

The Managed Instance Group is configured with:

- **Minimum Instances**: 2
- **Maximum Instances**: 6
- **Scale-up Threshold**: CPU utilization > 80%
- **Cooldown Period**: 60 seconds

## Security Features

### Firewall Rules

- **SSH Access**: Port 22 (tag: `ssh-tag`)
- **HTTP Access**: Port 80 (tag: `webserver-tag`)
- **Health Checks**: From Google's health check ranges

### Network Security

- Instances deployed in private subnet (no external IPs)
- Cloud NAT for secure outbound connectivity
- Dedicated proxy-only subnet for load balancer

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: SSL certificates may take time to fully deprovision.

## Troubleshooting

### SSL Certificate Not Provisioning

1. Verify DNS records are correctly configured
2. Check Certificate Manager DNS authorization status
3. Ensure domain ownership is validated
4. Wait 30-60 minutes for certificate issuance

### Health Check Failures

1. Verify firewall rules allow health check traffic
2. Check that Nginx is running on port 80
3. Confirm `/index.html` is accessible
4. Review instance startup script logs

### Instance Group Not Scaling

1. Check auto-scaling policy configuration
2. Verify CPU utilization metrics
3. Ensure cooldown period has passed
4. Review instance template configuration
