# GCP Infrastructure: Cloud SQL with HTTPS Load Balancer and Self-Signed SSL

This repository contains Terraform configuration for deploying a secure, scalable web application infrastructure on Google Cloud Platform (GCP). The setup includes a MySQL Cloud SQL instance, an auto-scaling managed instance group running a Java web application, and an HTTPS load balancer with self-signed SSL certificates.

## Architecture Overview

The infrastructure consists of two main projects:

1. **Project 1 (p1-cloudsql-publicdb)**: Cloud SQL MySQL database with public IP access
2. **Project 2 (p2-https-lb-selfsignedssl)**: Web application infrastructure with HTTPS load balancing

### Key Components

- **Cloud SQL**: MySQL 8.0 database instance with automated backups
- **Compute Engine**: Auto-scaling managed instance groups running Debian 12
- **Load Balancer**: Regional HTTPS load balancer with self-signed SSL
- **Networking**: Custom VPC with regional subnets and Cloud NAT
- **Monitoring**: Uptime checks and alert policies with email notifications
- **Security**: Firewall rules, service accounts with IAM roles

## Prerequisites

- GCP account with billing enabled
- Terraform >= 1.9 installed
- GCS bucket for Terraform state (`terraform-gcp-438417-tfstate`)
- Self-signed SSL certificates (or generate using the provided instructions)

## Project Structure

```
GCP-Samples/DNS-to-DB-SelfSigned-CloudSQL-PublicDB/
├── p1-cloudsql-publicdb/
│   ├── c1-versions.tf                 # Terraform and provider configuration
│   ├── c2-01-variables.tf             # Input variables
│   ├── c2-02-local-values.tf          # Local values
│   ├── c3-01-cloudsql.tf              # Cloud SQL instance resources
│   ├── c3-02-cloudsql-outputs.tf      # Cloud SQL outputs
│   └── terraform.tfvars               # Variable values
│
└── p2-https-lb-selfsignedssl/
    ├── c1-versions.tf                 # Terraform and provider configuration
    ├── c2-01-variables.tf             # Input variables
    ├── c2-02-local-values.tf          # Local values
    ├── c3-vpc.tf                      # VPC and subnet resources
    ├── c4-firewallrules.tf            # Firewall rules
    ├── c5-datasource.tf               # Data sources for zones and images
    ├── c6-01-app1-instance-template.tf # Instance template
    ├── c6-02-app1-mig-healthcheck.tf  # Health check configuration
    ├── c6-03-app1-mig.tf              # Managed instance group
    ├── c6-04-app1-mig-autoscaling.tf  # Auto-scaling configuration
    ├── c6-05-app1-mig-outputs.tf      # MIG outputs
    ├── c6-06-service-account-logging.tf # Service account and IAM
    ├── c7-01-loadbalancer.tf          # HTTPS load balancer
    ├── c7-02-loadbalancer-http-to-https.tf # HTTP to HTTPS redirect
    ├── c7-03-loadbalancer-outputs.tf  # Load balancer outputs
    ├── c8-Cloud-NAT-Cloud-Router.tf   # Cloud NAT and Router
    ├── c9-certificate-manager.tf      # SSL certificate manager
    ├── c10-01-monitoring-uptime-checks.tf # Monitoring and alerts
    ├── c11-remote-state-datasource.tf # Remote state data source
    ├── ums-install.tmpl               # User management app installer
    ├── self-signed-ssl/               # SSL certificates directory
    │   ├── app1.crt
    │   ├── app1.csr
    │   └── app1.key
    └── terraform.tfvars               # Variable values
```

## Configuration

### Project 1: Cloud SQL Database

**Key Variables** (in `terraform.tfvars`):
```hcl
gcp_project              = "terraform-gcp-438417"
gcp_region1              = "us-east1"
environment              = "dev"
business_divsion         = "sap"
cloudsql_database_version = "MYSQL_8_0"
```

**Database Configuration**:
- Instance tier: `db-f1-micro`
- Edition: `ENTERPRISE`
- Disk: 10GB PD_SSD with auto-resize up to 20GB
- Backup: Enabled with binary log
- Public IP with unrestricted access (0.0.0.0/0)

**Database Credentials**:
- Database Name: `webappdb`
- Username: `umsadmin`
- Password: `dbpassword11` (⚠️ Change in production!)

### Project 2: Web Application Infrastructure

**Key Variables** (in `terraform.tfvars`):
```hcl
gcp_project            = "terraform-gcp-438417"
gcp_region1            = "us-central1"
machine_type           = "e2-medium"
environment            = "dev"
business_divsion       = "hr"
gcp_notification_email = "your-email@gmail.com"
```

**Auto-scaling Configuration**:
- Min replicas: 2
- Max replicas: 4
- CPU target: 90%
- Cooldown period: 60 seconds

**Network Configuration**:
- VPC CIDR: Custom subnets per region
- Application subnet: 10.128.0.0/24
- Proxy subnet: 10.0.0.0/24

## Deployment Instructions

### Step 1: Deploy Cloud SQL Database

```bash
cd p1-cloudsql-publicdb

# Initialize Terraform
terraform init

# Review the execution plan
terraform plan

# Apply the configuration
terraform apply

# Note the output: cloudsql_db_public_ip
```

### Step 2: Deploy Web Application Infrastructure

```bash
cd ../p2-https-lb-selfsignedssl

# Update terraform.tfvars with your email
# Ensure self-signed SSL certificates are in self-signed-ssl/ directory

# Initialize Terraform
terraform init

# Review the execution plan
terraform plan

# Apply the configuration
terraform apply

# Note the output: mylb_static_ip_address
```

### Step 3: Access the Application

1. Get the load balancer IP from outputs
2. Access via HTTPS: `https://<LOAD_BALANCER_IP>/login`
3. HTTP will automatically redirect to HTTPS

## SSL Certificate Setup

### Generating Self-Signed Certificates

```bash
# Navigate to SSL directory
cd p2-https-lb-selfsignedssl/self-signed-ssl

# Generate private key
openssl genrsa -out app1.key 2048

# Generate certificate signing request
openssl req -new -key app1.key -out app1.csr -subj "/CN=app1.rezaops.com"

# Generate self-signed certificate (valid for 20 years)
openssl x509 -req -days 7300 -in app1.csr -signkey app1.key -out app1.crt
```

**Note**: For production, use Google-managed SSL certificates with Cloud DNS.

## Application Details

### User Management Application

The deployed application is a Java-based user management web application that:
- Runs on port 8080
- Uses Spring Boot framework
- Connects to Cloud SQL MySQL database
- Provides user registration and login functionality

**Database Connection** (auto-configured):
- Host: Retrieved from remote state
- Port: 3306
- Database: webappdb
- Credentials: Injected via environment variables

## Monitoring and Alerting

### Uptime Checks

- **Path**: `/login`
- **Protocol**: HTTPS (port 443)
- **Check Interval**: 60 seconds
- **Content Match**: "Username" string

### Alert Policy

- **Condition**: Uptime check failure
- **Threshold**: Less than 100% availability
- **Severity**: CRITICAL
- **Notification**: Email to configured address

## Security Features

### Firewall Rules

1. **SSH Access** (Port 22): Open to internet (0.0.0.0/0)
2. **HTTP/Application** (Ports 80, 8080): Open to internet
3. **Health Checks**: GCP health check IP ranges only

### IAM Roles

Service account permissions:
- `roles/logging.logWriter` - Write logs to Cloud Logging
- `roles/monitoring.metricWriter` - Write metrics to Cloud Monitoring

### Network Security

- Private VMs (no external IPs) with Cloud NAT for outbound traffic
- Session affinity with generated cookies
- Self-signed SSL with Certificate Manager

## Remote State Management

The configuration uses GCS backend for state management with state locking:

**Project 1 State**:
- Bucket: `terraform-gcp-438417-tfstate`
- Prefix: `cloudsql/publicdb`

**Project 2 State**:
- Bucket: `terraform-gcp-438417-tfstate`
- Prefix: `myapp1/httpslb-selfsigned-publicdb`

**Remote State Access**:
Project 2 reads Cloud SQL public IP from Project 1's state using `terraform_remote_state` data source.

## Useful Commands

### Terraform Commands

```bash
# Initialize and download providers
terraform init

# Validate configuration
terraform validate

# Format code
terraform fmt -recursive

# Plan changes
terraform plan

# Apply changes
terraform apply

# Destroy infrastructure
terraform destroy

# Show current state
terraform show

# List resources
terraform state list
```

### GCP Commands

```bash
# List Cloud SQL instances
gcloud sql instances list

# List compute instances
gcloud compute instances list

# List load balancers
gcloud compute forwarding-rules list

# List certificates
gcloud certificate-manager certificates list

# View certificate details
gcloud certificate-manager certificates describe hr-dev-ssl-certificate

# Check MIG status
gcloud compute instance-groups managed list

# View logs
gcloud logging read "resource.type=gce_instance" --limit 50
```

## Cleanup

To destroy all resources:

```bash
# Destroy web application infrastructure first
cd p2-https-lb-selfsignedssl
terraform destroy

# Then destroy Cloud SQL database
cd ../p1-cloudsql-publicdb
terraform destroy
```

**Important**: Terraform destroy will permanently delete all resources including the database. Ensure you have backups if needed.

## Cost Considerations

Estimated monthly costs (approximate):
- Cloud SQL (db-f1-micro): $15-20/month
- Compute Engine (2x e2-medium): $50-60/month
- Load Balancer: $20-25/month
- Cloud NAT: $45-50/month
- Data transfer: Variable

**Total**: ~$130-155/month (excluding data transfer)

## Production Considerations

Before using in production:

1. **Security**:
   - Use strong database passwords (consider Secret Manager)
   - Use Google-managed SSL certificates
   - Restrict Cloud SQL authorized networks
   - Enable Cloud Armor for DDoS protection
   - Use private IP for Cloud SQL

2. **High Availability**:
   - Change `availability_type` to "REGIONAL" for Cloud SQL
   - Increase MIG min replicas
   - Use global load balancer instead of regional

3. **Monitoring**:
   - Set up comprehensive dashboards
   - Configure additional alert policies
   - Enable VPC Flow Logs

4. **Backup**:
   - Configure automated backup retention
   - Test disaster recovery procedures
   - Enable point-in-time recovery

5. **State Management**:
   - Enable versioning on GCS state bucket
   - Implement state locking
   - Restrict bucket access with IAM

## Troubleshooting

### Common Issues

**Issue**: Instances can't reach Cloud SQL
- **Solution**: Check firewall rules and Cloud SQL authorized networks

**Issue**: Health checks failing
- **Solution**: Verify application is listening on port 8080 and `/login` path exists

**Issue**: SSL certificate errors
- **Solution**: Ensure certificate files are valid and properly formatted

**Issue**: State locking errors
- **Solution**: Check GCS bucket permissions and connectivity

### Debug Commands

```bash
# SSH to instance
gcloud compute ssh INSTANCE_NAME --zone=ZONE

# Check application logs
sudo journalctl -u google-cloud-ops-agent -f

# Test database connectivity
mysql -h CLOUD_SQL_IP -u umsadmin -p webappdb

# Check application process
ps aux | grep java

# View startup script logs
sudo journalctl -u google-startup-scripts.service
```


