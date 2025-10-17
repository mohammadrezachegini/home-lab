# GCP Cloud SQL Public Database with Terraform Remote State

This Terraform configuration deploys a Google Cloud SQL MySQL instance with public IP access and remote state management using Google Cloud Storage.

## Overview

This project provisions a Cloud SQL MySQL database instance on Google Cloud Platform with the following features:

- **MySQL 8.0** database instance
- **Public IP** with authorized network access from anywhere
- **Automated backups** with binary logging enabled
- **Remote state management** using GCS backend
- **Enterprise edition** with zonal availability
- Auto-resizing disk up to 20GB

## Architecture

The infrastructure includes:

- Cloud SQL MySQL Instance (db-f1-micro tier)
- Database Schema: `webappdb`
- Database User: `umsadmin`
- Public IP with open access (0.0.0.0/0)
- GCS backend for Terraform state storage

## Prerequisites

Before you begin, ensure you have:

1. **Google Cloud Platform Account** with billing enabled
2. **Terraform** installed (version >= 1.9)
3. **GCP Project** created (`terraform-gcp-438417` or your own)
4. **GCS Bucket** for Terraform state (`terraform-gcp-438417-tfstate`)
5. **Authentication** configured:
   ```bash
   gcloud auth application-default login
   ```
6. **Required APIs** enabled:
   - Cloud SQL Admin API
   - Compute Engine API

## Project Structure

```
p1-cloudsql-publicdb/
├── c1-versions.tf              # Terraform and provider configuration
├── c2-01-variables.tf          # Input variables
├── c2-02-local-values.tf       # Local values and common tags
├── c3-01-cloudsql.tf           # Cloud SQL resources
├── c3-02-cloudsql-outputs.tf   # Output values
└── terraform.tfvars            # Variable values (customize as needed)
```

## Configuration Files

### Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `gcp_project` | GCP Project ID | `terraform-gcp-438417` |
| `gcp_region1` | GCP Region | `us-east1` |
| `environment` | Environment prefix | `dev` |
| `business_divsion` | Business division | `sap` |
| `cloudsql_database_version` | MySQL version | `MYSQL_8_0` |

### Database Configuration

- **Instance Name**: `{business_division}-{environment}-mysql-{random_suffix}`
- **Tier**: db-f1-micro (shared-core, 0.6 GB RAM)
- **Edition**: ENTERPRISE
- **Disk**: 10GB PD-SSD (auto-resize up to 20GB)
- **Backup**: Enabled with binary logging
- **Database Name**: `webappdb`
- **Username**: `umsadmin`
- **Password**: `dbpassword11` ⚠️ *Change in production!*

## Usage

### 1. Clone the Repository

```bash
git clone <repository-url>
cd GCP-Samples/CloudSQL-PublicDB-TF-Remote-State/p1-cloudsql-publicdb
```

### 2. Customize Variables

Edit `terraform.tfvars` to override default values:

```hcl
gcp_project = "your-project-id"
gcp_region1 = "us-central1"
environment = "prod"
```

### 3. Initialize Terraform

```bash
terraform init
```

This will:
- Download the required providers
- Configure the GCS backend for remote state

### 4. Review the Plan

```bash
terraform plan
```

### 5. Apply the Configuration

```bash
terraform apply
```

Type `yes` when prompted to create the resources.

### 6. Get Outputs

After successful deployment:

```bash
terraform output cloudsql_db_public_ip
```

## Connecting to the Database

Once deployed, connect to your Cloud SQL instance:

```bash
mysql -h <PUBLIC_IP> -u umsadmin -p webappdb
```

Or using a connection string:

```
mysql://umsadmin:dbpassword11@<PUBLIC_IP>:3306/webappdb
```

## Security Considerations

⚠️ **IMPORTANT**: This configuration is for development/testing purposes only!

**Production Recommendations**:

1. **Remove public IP access**: Use Cloud SQL Proxy or Private IP instead
2. **Change default password**: Use Google Secret Manager for sensitive data
3. **Restrict authorized networks**: Replace `0.0.0.0/0` with specific IP ranges
4. **Enable deletion protection**: Set `deletion_protection = true`
5. **Use stronger instance tier**: Consider `db-n1-standard-1` or higher
6. **Enable high availability**: Set `availability_type = "REGIONAL"`
7. **Implement IAM authentication**: Replace SQL user authentication

## Remote State Management

The Terraform state is stored remotely in GCS:

- **Bucket**: `terraform-gcp-438417-tfstate`
- **Prefix**: `cloudsql/publicdb`

### Setting Up State Bucket

If the bucket doesn't exist, create it:

```bash
gsutil mb -p terraform-gcp-438417 -l us-east1 gs://terraform-gcp-438417-tfstate
gsutil versioning set on gs://terraform-gcp-438417-tfstate
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

Type `yes` when prompted.

## Outputs

| Output | Description |
|--------|-------------|
| `cloudsql_db_public_ip` | Public IP address of the Cloud SQL instance |

## Cost Estimate

Approximate monthly costs (us-east1 region):

- **db-f1-micro instance**: ~$8.50/month
- **Storage (10GB SSD)**: ~$1.70/month
- **Backups**: ~$0.08/GB/month
- **Network egress**: Variable

**Total**: ~$10-15/month (basic usage)

## Troubleshooting

### Connection Issues

```bash
# Test connectivity
gcloud sql connect <INSTANCE_NAME> --user=umsadmin

# Check instance status
gcloud sql instances describe <INSTANCE_NAME>
```

### State Lock Issues

```bash
# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

