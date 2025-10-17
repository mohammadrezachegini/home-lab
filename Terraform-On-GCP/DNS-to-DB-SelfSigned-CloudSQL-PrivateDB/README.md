# GCP Infrastructure: Cloud SQL Private DB with HTTPS Load Balancer

This repository contains Terraform configurations to deploy a complete Google Cloud Platform infrastructure featuring a private Cloud SQL MySQL database, regional HTTPS load balancer with self-signed SSL certificates, and auto-scaling managed instance groups.

## Architecture Overview

The infrastructure consists of two main projects:

1. **Project 1 (p1-cloudsql-privatedb)**: Private Cloud SQL MySQL database with VPC peering
2. **Project 2 (p2-https-lb-selfsignedssl)**: HTTPS Load Balancer with auto-scaling application servers

### Key Components

- **VPC Network** with custom subnets and proxy-only subnet for load balancing
- **Cloud SQL MySQL 8.0** with private IP configuration
- **Regional HTTPS Load Balancer** with self-signed SSL certificates
- **Managed Instance Groups** with auto-scaling (2-4 instances)
- **Cloud NAT** for outbound internet connectivity
- **Cloud Monitoring** with uptime checks and alerting
- **HTTP to HTTPS** automatic redirection

## Prerequisites

- Google Cloud Platform account
- GCP Project with billing enabled
- Terraform >= 1.9
- GCS bucket for Terraform state (`terraform-gcp-438417-tfstate`)
- Required GCP APIs enabled:
  - Compute Engine API
  - Cloud SQL Admin API
  - Service Networking API
  - Certificate Manager API
  - Cloud Monitoring API

## Project Structure

```
.
├── p1-cloudsql-privatedb/          # Cloud SQL Private Database Setup
│   ├── c1-versions.tf              # Terraform and provider configuration
│   ├── c2-01-variables.tf          # Input variables
│   ├── c2-02-local-values.tf       # Local values
│   ├── c3-01-vpc.tf                # VPC and subnet configuration
│   ├── c3-02-private-service-connection.tf  # VPC peering for Cloud SQL
│   ├── c3-03-vpc-outputs.tf        # VPC outputs
│   ├── c4-01-cloudsql.tf           # Cloud SQL instance and database
│   ├── c4-02-cloudsql-outputs.tf   # Cloud SQL outputs
│   ├── c5-vminstance.tf            # MySQL client VM for testing
│   ├── mysql-client-install.sh     # MySQL client installation script
│   └── terraform.tfvars            # Variable values
│
└── p2-https-lb-selfsignedssl/      # HTTPS Load Balancer Setup
    ├── c1-versions.tf              # Terraform and provider configuration
    ├── c2-01-variables.tf          # Input variables
    ├── c2-02-local-values.tf       # Local values
    ├── c3-remote-state-datasource.tf   # Remote state data source
    ├── c4-firewallrules.tf         # Firewall rules
    ├── c5-datasource.tf            # Compute zones and image data sources
    ├── c6-01-app1-instance-template.tf # Instance template
    ├── c6-02-app1-mig-healthcheck.tf   # Health check configuration
    ├── c6-03-app1-mig.tf           # Managed instance group
    ├── c6-04-app1-mig-autoscaling.tf   # Auto-scaling configuration
    ├── c6-05-app1-mig-outputs.tf   # MIG outputs
    ├── c6-06-service-account-logging.tf # Service account and IAM
    ├── c7-01-loadbalancer.tf       # HTTPS load balancer
    ├── c7-02-loadbalancer-http-to-https.tf # HTTP to HTTPS redirect
    ├── c7-03-loadbalancer-outputs.tf    # Load balancer outputs
    ├── c8-Cloud-NAT-Cloud-Router.tf     # Cloud NAT configuration
    ├── c9-certificate-manager.tf   # SSL certificate management
    ├── c10-01-monitoring-uptime-checks.tf # Uptime monitoring and alerts
    ├── c11-remote-state-datasource.tf   # Additional remote state
    ├── self-signed-ssl/            # Self-signed SSL certificates
    │   ├── app1.crt
    │   ├── app1.csr
    │   └── app1.key
    ├── ums-install.tmpl            # User management app installation
    └── terraform.tfvars            # Variable values
```

## Configuration

### Project 1: Cloud SQL Private Database

**terraform.tfvars:**
```hcl
gcp_project              = "terraform-gcp-438417"
gcp_region1              = "us-central1"
environment              = "dev"
business_divsion         = "hr"
cloudsql_database_version = "MYSQL_8_0"
```

**Key Resources:**
- VPC with custom subnet (10.128.0.0/24)
- Regional proxy subnet (10.0.0.0/24)
- Private IP range for VPC peering (/16)
- Cloud SQL MySQL instance (db-f1-micro)
- Database: `webappdb`
- User: `umsadmin` / `dbpassword11`

### Project 2: HTTPS Load Balancer

**terraform.tfvars:**
```hcl
gcp_project            = "terraform-gcp-438417"
gcp_region1            = "us-central1"
machine_type           = "e2-medium"
environment            = "dev"
business_divsion       = "hr"
gcp_notification_email = "your-email@gmail.com"
```

**Key Features:**
- Regional HTTPS Load Balancer with static IP
- Self-signed SSL certificate (app1.rezaops.com)
- Auto-scaling: 2-4 instances based on CPU (90% threshold)
- Session affinity with generated cookies
- Health checks on port 8080 (/login endpoint)
- Cloud NAT for private instance internet access
- Uptime monitoring with email alerts

## Deployment Instructions

### Step 1: Deploy Cloud SQL Infrastructure

```bash
cd p1-cloudsql-privatedb

# Initialize Terraform
terraform init

# Review the execution plan
terraform plan

# Apply the configuration
terraform apply

# Note the outputs (VPC ID, Subnet ID, Cloud SQL Private IP)
terraform output
```

### Step 2: Update Remote State Reference

Before deploying Project 2, ensure the remote state bucket reference in `c3-remote-state-datasource.tf` matches your Project 1 backend configuration.

### Step 3: Deploy HTTPS Load Balancer

```bash
cd ../p2-https-lb-selfsignedssl

# Initialize Terraform
terraform init

# Review the execution plan
terraform plan

# Apply the configuration
terraform apply

# Get the load balancer IP
terraform output mylb_static_ip_address
```

### Step 4: Access the Application

1. Add the load balancer IP to your hosts file:
   ```
   <LOAD_BALANCER_IP> app1.rezaops.com
   ```

2. Access the application:
   - HTTPS: `https://app1.rezaops.com`
   - HTTP (redirects to HTTPS): `http://app1.rezaops.com`

3. Login endpoint: `https://app1.rezaops.com/login`

## Application Details

The deployed application is a User Management System (UMS) that:
- Runs on Java 11 (Microsoft JDK)
- Connects to Cloud SQL MySQL database
- Listens on port 8080
- Includes health check endpoint at `/login`

**Database Configuration:**
- Host: Cloud SQL Private IP
- Port: 3306
- Database: webappdb
- Username: umsadmin
- Password: dbpassword11

## Monitoring and Alerts

The infrastructure includes:

- **Uptime Checks**: Monitors HTTPS endpoint every 60 seconds
- **Alert Policy**: Triggers when uptime check fails
- **Notification Channel**: Email alerts to configured address
- **Ops Agent**: Collects logs and metrics from application instances

Access monitoring in GCP Console:
- Monitoring > Uptime checks
- Monitoring > Alerting

## Security Considerations

⚠️ **Important Security Notes:**

1. **Self-Signed Certificates**: This setup uses self-signed SSL certificates for demonstration. For production, use:
   - Google-managed certificates
   - Let's Encrypt certificates
   - Commercial SSL certificates

2. **Database Credentials**: Hardcoded in templates for demo purposes. For production:
   - Use Secret Manager
   - Implement proper credential rotation
   - Use IAM database authentication

3. **Firewall Rules**: Current rules allow SSH from any IP (0.0.0.0/0). Restrict to specific IPs in production.

4. **Private Instances**: VMs have no external IPs and use Cloud NAT for outbound connectivity.

## Cost Optimization

Current configuration uses cost-effective resources:
- Cloud SQL: db-f1-micro (0.6 GB RAM)
- Compute instances: e2-medium (2 vCPU, 4 GB RAM)
- Minimum replicas: 2

For production, consider:
- Regional availability for Cloud SQL
- Larger instance types
- Committed use discounts
- Preemptible VMs for non-critical workloads

## Cleanup

To destroy all resources:

```bash
# Destroy Load Balancer infrastructure first
cd p2-https-lb-selfsignedssl
terraform destroy

# Then destroy Cloud SQL infrastructure
cd ../p1-cloudsql-privatedb
terraform destroy
```

## Troubleshooting

### Common Issues

1. **Cloud SQL connection timeout**
   - Verify VPC peering is established
   - Check private service connection
   - Ensure VM is in the correct VPC/subnet

2. **Load balancer health checks failing**
   - Verify application is running on port 8080
   - Check firewall rules for health check ranges
   - Review instance startup script logs

3. **SSL certificate errors**
   - Browser warnings are expected with self-signed certificates
   - Add exception in browser or import certificate

### Debugging Commands

```bash
# SSH to MySQL client VM
gcloud compute ssh mysql-client --zone=us-central1-a

# Test database connectivity
mysql -h <CLOUD_SQL_PRIVATE_IP> -u umsadmin -p

# Check MIG status
gcloud compute instance-groups managed describe hr-dev-myapp1-mig --region=us-central1

# View application logs
gcloud logging read "resource.type=gce_instance" --limit=50
```

