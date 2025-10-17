# GCP Infrastructure: DNS to Database with Cloud SQL and Load Balancing

A comprehensive Terraform project demonstrating end-to-end infrastructure automation on Google Cloud Platform, including Cloud SQL database, HTTPS Load Balancer, Cloud DNS, and automated application deployment.

## 📋 Project Overview

This repository contains three progressive implementations showcasing different aspects of GCP infrastructure:

1. **p1-cloudsql-publicdb** - Cloud SQL MySQL database with public access
2. **p2-https-lb-selfsignedssl** - HTTPS Load Balancer with self-signed SSL certificates
3. **p3-https-lb-clouddns** - Complete production-ready setup with Cloud DNS and managed SSL certificates

## 🏗️ Architecture

### High-Level Components

- **Cloud SQL**: Managed MySQL 8.0 database with automated backups
- **Regional Load Balancer**: HTTPS load balancer with HTTP-to-HTTPS redirect
- **Managed Instance Groups**: Auto-scaling compute instances across multiple zones
- **Cloud NAT**: Outbound internet access for private instances
- **Cloud DNS**: DNS management with automated record creation
- **Certificate Manager**: Automated SSL certificate provisioning
- **Cloud Monitoring**: Uptime checks and alerting

### Network Architecture

```
Internet → Cloud DNS → Load Balancer → Backend Service → MIG → Cloud SQL
                            ↓
                      Certificate Manager
                            ↓
                      SSL Termination
```

## 🚀 Features

### Infrastructure Automation
- Multi-zone deployment for high availability
- Auto-scaling based on CPU utilization (min: 2, max: 4-6 instances)
- Automated health checks and auto-healing
- Blue-green deployment support with rolling updates

### Security
- Self-signed SSL certificates (p2) or managed certificates via Certificate Manager (p3)
- Network firewall rules with specific port access
- Service accounts with minimal required permissions
- Cloud NAT for private instance internet access

### Monitoring & Observability
- Google Cloud Ops Agent integration
- Application and system log collection
- Uptime monitoring with email alerts
- Custom metrics for application monitoring

### Application Deployment
- Java-based User Management application
- Automated deployment via startup scripts
- Database connection via environment variables
- Remote state management for cross-project dependencies

## 📁 Repository Structure

```
GCP-Samples/DNS-to-DB-CloudDNS-CloudSQL-PublicDB/
├── p1-cloudsql-publicdb/
│   ├── c1-versions.tf              # Terraform and provider configuration
│   ├── c2-01-variables.tf          # Input variables
│   ├── c2-02-local-values.tf       # Local values and naming conventions
│   ├── c3-01-cloudsql.tf           # Cloud SQL instance configuration
│   ├── c3-02-cloudsql-outputs.tf   # Cloud SQL outputs
│   └── terraform.tfvars            # Variable values
│
├── p2-https-lb-selfsignedssl/
│   ├── c1-versions.tf              # Terraform and provider configuration
│   ├── c2-01-variables.tf          # Input variables
│   ├── c2-02-local-values.tf       # Local values
│   ├── c3-vpc.tf                   # VPC and subnet configuration
│   ├── c4-firewallrules.tf         # Firewall rules
│   ├── c5-datasource.tf            # Data sources for zones and images
│   ├── c6-01-app1-instance-template.tf  # Instance template
│   ├── c6-02-app1-mig-healthcheck.tf    # Health check configuration
│   ├── c6-03-app1-mig.tf                # Managed Instance Group
│   ├── c6-04-app1-mig-autoscaling.tf    # Autoscaling policy
│   ├── c6-05-app1-mig-outputs.tf        # MIG outputs
│   ├── c6-06-service-account-logging.tf # Service account and IAM
│   ├── c7-01-loadbalancer.tf            # Load balancer configuration
│   ├── c7-02-loadbalancer-http-to-https.tf  # HTTP redirect
│   ├── c7-03-loadbalancer-outputs.tf    # Load balancer outputs
│   ├── c8-Cloud-NAT-Cloud-Router.tf     # Cloud NAT and Router
│   ├── c9-certificate-manager.tf        # SSL certificate (self-signed)
│   ├── c10-01-monitoring-uptime-checks.tf  # Monitoring and alerts
│   ├── c11-remote-state-datasource.tf   # Remote state data source
│   ├── self-signed-ssl/                 # Self-signed certificates
│   ├── ums-install.tmpl                 # Application install script
│   └── terraform.tfvars                 # Variable values
│
└── p3-https-lb-clouddns/
    ├── c1-versions.tf              # Terraform and provider configuration
    ├── c2-01-variables.tf          # Input variables
    ├── c2-02-local-values.tf       # Local values
    ├── c3-vpc.tf                   # VPC and subnet configuration
    ├── c4-firewallrules.tf         # Firewall rules
    ├── c5-datasource.tf            # Data sources
    ├── c6-01-app1-instance-template.tf  # Instance template
    ├── c6-02-app1-mig-healthcheck.tf    # Health check
    ├── c6-03-app1-mig.tf                # Managed Instance Group
    ├── c6-04-app1-mig-autoscaling.tf    # Autoscaling
    ├── c6-05-app1-mig-outputs.tf        # MIG outputs
    ├── c6-06-service-account-logging.tf # Service account
    ├── c7-01-loadbalancer.tf            # Load balancer
    ├── c7-02-loadbalancer-http-to-https.tf  # HTTP redirect
    ├── c7-03-loadbalancer-outputs.tf    # LB outputs
    ├── c8-Cloud-NAT-Cloud-Router.tf     # Cloud NAT
    ├── c9-cloud-dns.tf                  # Cloud DNS configuration
    ├── c10-certificate-manager.tf       # Managed SSL certificates
    ├── c11-monitoring-uptime-checks.tf  # Monitoring
    ├── c12-remote-state-datasource.tf   # Remote state
    ├── ums-install.tmpl                 # Application script
    └── terraform.tfvars                 # Variable values
```

## 🔧 Prerequisites

### Required Tools
- [Terraform](https://www.terraform.io/downloads.html) >= 1.9
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- Active GCP account with billing enabled

### GCP APIs to Enable
```bash
gcloud services enable compute.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable dns.googleapis.com
gcloud services enable certificatemanager.googleapis.com
gcloud services enable monitoring.googleapis.com
```

### Authentication
```bash
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

## 📝 Configuration

### 1. Update Variables

Edit `terraform.tfvars` in each project directory:

```hcl
gcp_project          = "your-project-id"
gcp_region1          = "us-central1"
machine_type         = "e2-medium"
environment          = "dev"
business_divsion     = "hr"
gcp_notification_email = "your-email@example.com"
```

### 2. Configure Backend

Update the GCS bucket name in `c1-versions.tf`:

```hcl
backend "gcs" {
  bucket = "your-terraform-state-bucket"
  prefix = "cloudsql/publicdb"  # or appropriate prefix
}
```

### 3. Domain Configuration (p3 only)

Update `c9-cloud-dns.tf`:

```hcl
locals {
  mydomain = "myapp1.yourdomain.com"
  dns_managed_zone = "your-managed-zone"
}
```

## 🚀 Deployment

### Phase 1: Deploy Cloud SQL Database

```bash
cd p1-cloudsql-publicdb
terraform init
terraform plan
terraform apply
```

### Phase 2: Deploy with Self-Signed SSL

```bash
cd ../p2-https-lb-selfsignedssl
terraform init
terraform plan
terraform apply
```

**Note**: Access the application at `https://<load-balancer-ip>`
You'll need to accept the self-signed certificate warning.

### Phase 3: Production Deployment with Cloud DNS

```bash
cd ../p3-https-lb-clouddns
terraform init
terraform plan
terraform apply
```

Access: `https://myapp1.yourdomain.com`

## 🔍 Verification

### Check Cloud SQL
```bash
gcloud sql instances list
gcloud sql databases list --instance=INSTANCE_NAME
```

### Check Load Balancer
```bash
gcloud compute forwarding-rules list
gcloud compute backend-services list
```

### Check MIG Status
```bash
gcloud compute instance-groups managed list
gcloud compute instance-groups managed list-instances MIG_NAME --region=REGION
```

### Check DNS Records
```bash
gcloud dns record-sets list --zone=YOUR_ZONE
```

### Check Certificates
```bash
gcloud certificate-manager certificates list
```

## 📊 Monitoring

### Access Cloud Console
- **Monitoring Dashboard**: Cloud Console → Monitoring
- **Uptime Checks**: Monitoring → Uptime checks
- **Logs**: Logging → Logs Explorer

### View Application Logs
```bash
gcloud logging read "resource.type=gce_instance AND logName=projects/PROJECT_ID/logs/ums_log" --limit 50
```

## 🔐 Security Considerations

### Production Recommendations

1. **Database Security**
   - Remove public IP access
   - Use Private Service Connect or Cloud SQL Proxy
   - Rotate passwords regularly
   - Use Secret Manager for credentials

2. **Network Security**
   - Restrict firewall rules to specific IP ranges
   - Implement VPC Service Controls
   - Enable VPC Flow Logs

3. **SSL/TLS**
   - Use managed certificates in production
   - Enable HTTPS-only access
   - Configure proper security headers

4. **IAM**
   - Follow principle of least privilege
   - Use service accounts per application
   - Enable audit logging

## 🧹 Cleanup

To destroy resources (in reverse order):

```bash
# Phase 3
cd p3-https-lb-clouddns
terraform destroy

# Phase 2
cd ../p2-https-lb-selfsignedssl
terraform destroy

# Phase 1
cd ../p1-cloudsql-publicdb
terraform destroy
```

