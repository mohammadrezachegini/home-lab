# DNS-to-DB with Cloud DNS, Cloud SQL & HTTPS Load Balancer

A production-ready Terraform infrastructure project that demonstrates deploying a private Cloud SQL MySQL database, a scalable web application with HTTPS load balancing, and automated DNS management on Google Cloud Platform.

## 🏗️ Architecture Overview

This project consists of two main components:

1. **Private Cloud SQL Database** (`p1-cloudsql-privatedb/`)
2. **HTTPS Load Balanced Application** (`p3-https-lb-clouddns/`)

### Architecture Diagram

```
Internet → Cloud DNS → HTTPS Load Balancer → Regional MIG → Private Cloud SQL
                ↓                    ↓
            SSL/TLS              Cloud NAT
            Certificate          (Outbound)
```

## ✨ Key Features

- **Private Cloud SQL**: MySQL 8.0 database with VPC peering and private IP connectivity
- **HTTPS Load Balancing**: Regional Application Load Balancer with SSL/TLS termination
- **Auto-scaling**: Managed Instance Group with CPU-based autoscaling (2-6 instances)
- **DNS Management**: Automated Cloud DNS record creation and SSL certificate provisioning
- **Security**: Private networking, Cloud NAT for outbound traffic, firewall rules
- **Monitoring**: Uptime checks, alert policies, and Cloud Logging with Ops Agent
- **Zero Downtime Updates**: Proactive update policy with rolling replacements

## 📋 Prerequisites

- Google Cloud Platform account
- Terraform >= 1.9
- GCP Project with billing enabled
- Domain registered and managed in Cloud DNS
- Required GCP APIs enabled:
  - Compute Engine API
  - Cloud SQL Admin API
  - Cloud DNS API
  - Certificate Manager API
  - Service Networking API
  - Cloud Monitoring API

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd GCP-Samples/DNS-to-DB-CloudDNS-CloudSQL-PrivateDB
```

### 2. Deploy Cloud SQL Database

```bash
cd p1-cloudsql-privatedb

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the configuration
terraform apply
```

**What gets created:**
- VPC network with custom subnet
- Regional proxy subnet for load balancer
- Private service connection for Cloud SQL
- Cloud SQL MySQL 8.0 instance (private IP only)
- Database schema (`webappdb`)
- Database user (`umsadmin`)
- Test VM with MySQL client

### 3. Deploy Application Infrastructure

```bash
cd ../p3-https-lb-clouddns

# Update terraform.tfvars with your values
# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the configuration
terraform apply
```

**What gets created:**
- Regional instance template with startup script
- Managed Instance Group with autoscaling
- Cloud NAT and Cloud Router
- Regional HTTPS Load Balancer
- SSL certificate via Certificate Manager
- Cloud DNS A record
- HTTP to HTTPS redirect
- Uptime checks and alerts

## 📁 Project Structure

```
DNS-to-DB-CloudDNS-CloudSQL-PrivateDB/
├── p1-cloudsql-privatedb/          # Database infrastructure
│   ├── c1-versions.tf               # Terraform and provider config
│   ├── c2-01-variables.tf           # Input variables
│   ├── c2-02-local-values.tf        # Local values
│   ├── c3-01-vpc.tf                 # VPC and subnets
│   ├── c3-02-private-service-connection.tf  # VPC peering for Cloud SQL
│   ├── c3-03-vpc-outputs.tf         # VPC outputs
│   ├── c4-01-cloudsql.tf            # Cloud SQL instance
│   ├── c4-02-cloudsql-outputs.tf    # Database outputs
│   ├── c5-vminstance.tf             # Test VM instance
│   ├── mysql-client-install.sh      # MySQL client setup script
│   └── terraform.tfvars             # Variable values
│
└── p3-https-lb-clouddns/           # Application infrastructure
    ├── c1-versions.tf               # Terraform and provider config
    ├── c2-01-variables.tf           # Input variables
    ├── c2-02-local-values.tf        # Local values
    ├── c3-remote-state-datasource.tf # Remote state reference
    ├── c4-firewallrules.tf          # Firewall rules
    ├── c5-datasource.tf             # Compute zones and images
    ├── c6-01-app1-instance-template.tf  # Instance template
    ├── c6-02-app1-mig-healthcheck.tf    # Health check
    ├── c6-03-app1-mig.tf            # Managed Instance Group
    ├── c6-04-app1-mig-autoscaling.tf    # Autoscaling policy
    ├── c6-05-app1-mig-outputs.tf    # MIG outputs
    ├── c6-06-service-account-logging.tf # Service account for logging
    ├── c7-01-loadbalancer.tf        # HTTPS load balancer
    ├── c7-02-loadbalancer-http-to-https.tf # HTTP redirect
    ├── c7-03-loadbalancer-outputs.tf     # LB outputs
    ├── c8-Cloud-NAT-Cloud-Router.tf      # NAT and Router
    ├── c9-cloud-dns.tf              # DNS configuration
    ├── c10-certificate-manager.tf   # SSL certificate
    ├── c11-monitoring-uptime-checks.tf   # Monitoring
    ├── app1-webserver-install.sh    # Nginx setup (optional)
    ├── ums-install.tmpl             # User Management app template
    └── terraform.tfvars             # Variable values
```

## ⚙️ Configuration

### Key Variables to Update

**p1-cloudsql-privatedb/terraform.tfvars:**
```hcl
gcp_project              = "your-project-id"
gcp_region1              = "us-central1"
environment              = "dev"
business_divsion         = "hr"
cloudsql_database_version = "MYSQL_8_0"
```

**p3-https-lb-clouddns/terraform.tfvars:**
```hcl
gcp_project              = "your-project-id"
gcp_region1              = "us-central1"
machine_type             = "e2-micro"
environment              = "dev"
business_divsion         = "hr"
```

**p3-https-lb-clouddns/c9-cloud-dns.tf:**
```hcl
locals {
  mydomain         = "myapp1.yourdomain.com"
  dns_managed_zone = "your-managed-zone-name"
}
```

**p3-https-lb-clouddns/c2-01-variables.tf:**
```hcl
variable "gcp_notification_email" {
  default = "your-email@example.com"
}
```

## 🔒 Security Features

- **Private Cloud SQL**: Database accessible only via private IP
- **VPC Peering**: Secure connection between VPC and Cloud SQL
- **No Public IPs on VMs**: Instances use Cloud NAT for outbound traffic
- **Firewall Rules**: Restrictive ingress/egress controls
- **SSL/TLS**: End-to-end encryption via Certificate Manager
- **Health Checks**: Google Cloud health check IP ranges only

## 📊 Monitoring & Alerting

- **Uptime Checks**: HTTPS endpoint monitoring every 60 seconds
- **Alert Policies**: Email notifications on service degradation
- **Cloud Logging**: Ops Agent configured for application logs
- **Health Checks**: Multi-level health checks (MIG and LB)

## 🔄 Auto-scaling Configuration

```hcl
min_replicas    = 2
max_replicas    = 6
cooldown_period = 60
cpu_target      = 0.9  # 90% CPU utilization
```

## 🗄️ Remote State Management

Both projects use GCS backend for state management:

```hcl
backend "gcs" {
  bucket = "terraform-gcp-438417-tfstate"
  prefix = "cloudsql/privatedb"  # or "myapp1/httpslb-clouddns-privatedb"
}
```

The application project references the database project's outputs via remote state.

## 🔧 Testing

### Test Database Connectivity

```bash
# SSH into the test VM
gcloud compute ssh mysql-client --zone=us-central1-a

# Test connection
mysql -h <PRIVATE_IP> -u umsadmin -p
# Password: dbpassword11

# Verify database
SHOW DATABASES;
USE webappdb;
```

### Test Application

```bash
# Access via domain
curl https://myapp1.yourdomain.com/login

# Check health endpoint
curl https://myapp1.yourdomain.com/login -I
```

## 🧹 Cleanup

```bash
# Destroy application infrastructure first
cd p3-https-lb-clouddns
terraform destroy

# Then destroy database infrastructure
cd ../p1-cloudsql-privatedb
terraform destroy
```

## 📝 Important Notes

1. **Database Password**: Change the default password (`dbpassword11`) in production
2. **Deletion Protection**: Set to `false` in dev; enable in production
3. **Cost Optimization**: Using `e2-micro` and `db-f1-micro` for cost efficiency
4. **DNS Propagation**: SSL certificate provisioning may take 10-15 minutes
5. **State Management**: Ensure GCS bucket exists before running Terraform

## 🐛 Troubleshooting

### SSL Certificate Pending
Wait 10-15 minutes for DNS propagation and certificate provisioning. Check Certificate Manager console.

### Database Connection Failed
- Verify VPC peering is active
- Check Cloud SQL instance has private IP
- Ensure Cloud NAT is configured

### Health Check Failures
- Verify application is running on port 8080
- Check firewall rules allow health check ranges
- Review startup script logs: `/apps/usermgmt/ums-start.log`
