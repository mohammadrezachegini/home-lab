# GCP Cloud SQL Private Database with Terraform

This Terraform project provisions a private Cloud SQL MySQL instance on Google Cloud Platform with VPC peering, along with a test VM instance for database connectivity testing.

## Architecture Overview

The infrastructure includes:

- **Custom VPC Network** with custom subnets
- **Private Cloud SQL MySQL Instance** (no public IP)
- **VPC Peering** for private service connection
- **Regional Proxy Subnet** for load balancing capabilities
- **Compute Engine VM** with MySQL client for testing

## Prerequisites

- Google Cloud Platform account
- GCP Project with billing enabled
- Terraform >= 1.9 installed
- GCS bucket for Terraform state: `terraform-gcp-438417-tfstate`
- Required GCP APIs enabled:
  - Compute Engine API
  - Cloud SQL Admin API
  - Service Networking API

## Project Structure

```
p1-cloudsql-privatedb/
├── c1-versions.tf                      # Terraform and provider configuration
├── c2-01-variables.tf                  # Input variables
├── c2-02-local-values.tf               # Local values and naming conventions
├── c3-01-vpc.tf                        # VPC and subnet resources
├── c3-02-private-service-connection.tf # Private service connection setup
├── c3-03-vpc-outputs.tf                # VPC-related outputs
├── c4-01-cloudsql.tf                   # Cloud SQL instance configuration
├── c4-02-cloudsql-outputs.tf           # Cloud SQL outputs
├── c5-vminstance.tf                    # Test VM instance
├── mysql-client-install.sh             # Startup script for VM
└── terraform.tfvars                    # Variable values
```

## Configuration

### Default Values

The project uses the following defaults (customizable via `terraform.tfvars`):

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `gcp_project` | `terraform-gcp-438417` | GCP Project ID |
| `gcp_region1` | `us-central1` | Primary GCP region |
| `environment` | `dev` | Environment identifier |
| `business_divsion` | `hr` | Business division tag |
| `cloudsql_database_version` | `MYSQL_8_0` | MySQL version |

### Cloud SQL Configuration

- **Instance Tier**: `db-f1-micro` (smallest instance)
- **Edition**: `ENTERPRISE`
- **Availability**: `ZONAL` (single zone)
- **Disk**: 10GB PD-SSD with auto-resize up to 20GB
- **Backup**: Enabled with binary logging
- **Network**: Private IP only (no public IP)

### Database Credentials

- **Database Name**: `webappdb`
- **Username**: `umsadmin`
- **Password**: `dbpassword11` ⚠️ **Change this in production!**

## Deployment

### 1. Initialize Terraform

```bash
cd p1-cloudsql-privatedb
terraform init
```

### 2. Review Configuration

Customize `terraform.tfvars` if needed:

```hcl
gcp_project               = "your-project-id"
gcp_region1               = "us-central1"
environment               = "dev"
business_divsion          = "hr"
cloudsql_database_version = "MYSQL_8_0"
```

### 3. Plan Deployment

```bash
terraform plan
```

### 4. Apply Configuration

```bash
terraform apply
```

Review the plan and type `yes` to confirm.

## Testing Database Connectivity

### 1. Get Outputs

After deployment, retrieve important values:

```bash
terraform output
```

Expected outputs:
- `cloudsql_db_private_ip`: Private IP of Cloud SQL instance
- `vm_public_ip`: Public IP of test VM

### 2. Connect to Test VM

```bash
# SSH into the VM (replace with actual IP from output)
gcloud compute ssh mysql-client --zone=us-central1-a
```

### 3. Test Connectivity

```bash
# Test port connectivity
telnet <CLOUDSQL_PRIVATE_IP> 3306

# Connect to MySQL
mysql -h <CLOUDSQL_PRIVATE_IP> -u umsadmin -p
# Enter password: dbpassword11

# Verify database
SHOW DATABASES;
USE webappdb;
```

## Network Architecture

### VPC Configuration

- **Primary Subnet**: `10.128.0.0/24` (us-central1-subnet)
- **Proxy Subnet**: `10.0.0.0/24` (for regional load balancer)
- **Private IP Range**: `/16` reserved for VPC peering

### Private Service Connection

The Cloud SQL instance connects to your VPC through VPC peering:
1. Reserved IP range allocated in your VPC
2. Service Networking Connection established
3. Cloud SQL instance receives private IP from peered range

## Security Considerations

### ⚠️ For Production Use

1. **Change Database Password**: Never use default passwords
   ```hcl
   # In c4-01-cloudsql.tf, use a secure method:
   password = var.db_password  # Pass via environment variable
   ```

2. **Enable Deletion Protection**:
   ```hcl
   deletion_protection = true
   ```

3. **Configure High Availability**:
   ```hcl
   availability_type = "REGIONAL"
   ```

4. **Restrict SSH Access**:
   ```hcl
   source_ranges = ["YOUR_IP/32"]  # Not 0.0.0.0/0
   ```

5. **Use Secrets Manager**: Store credentials in GCP Secret Manager

6. **Enable Cloud SQL IAM Authentication**: Replace password authentication

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

⚠️ This will permanently delete the database instance and all data.

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to Cloud SQL from VM

**Solutions**:
- Verify VM is in the same VPC as Cloud SQL
- Check private service connection is established
- Confirm Cloud SQL has finished provisioning
- Test connectivity: `telnet <DB_IP> 3306`

### Terraform Errors

**Problem**: Backend initialization fails

**Solution**: Ensure GCS bucket exists and you have access:
```bash
gsutil ls gs://terraform-gcp-438417-tfstate
```

**Problem**: API not enabled

**Solution**: Enable required APIs:
```bash
gcloud services enable sqladmin.googleapis.com
gcloud services enable servicenetworking.googleapis.com
```
