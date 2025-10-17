# GCP Regional HTTP Load Balancer with Managed Instance Groups

A production-ready Terraform infrastructure for deploying a regional HTTP load balancer with auto-scaling managed instance groups on Google Cloud Platform.

## Architecture Overview

This project demonstrates a complete regional load balancing setup with the following components:

- **Regional HTTP Load Balancer** - External managed load balancing
- **Managed Instance Group (MIG)** - Auto-scaling compute instances
- **Cloud NAT & Cloud Router** - Outbound internet connectivity for private instances
- **VPC Network** - Custom network with regional subnets
- **Health Checks** - Automated instance health monitoring
- **Proactive Update Policy** - Zero-downtime rolling updates

## Features

- ✅ Auto-scaling based on CPU utilization (2-6 instances)
- ✅ Multi-zone distribution for high availability
- ✅ Proactive update strategy with rolling deployments
- ✅ Health checks for backend instances and load balancer
- ✅ Cloud NAT for private instance internet access
- ✅ Regional proxy subnet for load balancer
- ✅ Version management (V1 and V2 templates included)
- ✅ Automated firewall rules for SSH, HTTP, and health checks

## Prerequisites

- Google Cloud Platform account
- Terraform >= 1.0
- GCP Project with billing enabled
- Required APIs enabled:
  - Compute Engine API
  - Cloud Resource Manager API

## Project Structure

```
terraform-manifests/
├── c1-versions.tf                    # Provider configuration
├── c2-01-variables.tf                # Input variables
├── c2-02-local-values.tf             # Local values and tags
├── c3-vpc.tf                         # VPC and subnets
├── c4-firewallrules.tf               # Firewall rules
├── c5-datasource.tf                  # Data sources for zones and images
├── c6-01-app1-instance-template.tf   # Instance template V1
├── c6-02-app1-mig-healthcheck.tf     # MIG health check
├── c6-03-app1-mig.tf                 # Managed instance group
├── c6-04-app1-mig-autoscaling.tf     # Auto-scaling configuration
├── c6-05-app1-mig-outputs.tf         # MIG outputs
├── c7-01-loadbalancer.tf             # Load balancer resources
├── c7-02-loadbalancer-outputs.tf     # Load balancer outputs
├── c8-Cloud-NAT-Cloud-Router.tf      # NAT and router
├── c9-01-instance-template.tf        # Instance template V2
├── terraform.tfvars                  # Variable values
├── app1-webserver-install.sh         # V1 startup script
└── v2-app1-webserver-install.sh      # V2 startup script
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

### Network Configuration

- **VPC CIDR**: Custom subnet `10.128.0.0/24`
- **Proxy Subnet**: `10.0.0.0/24` (for regional load balancer)
- **NAT**: Auto-allocated IPs for outbound traffic

### Auto-scaling Policy

- **Min Replicas**: 2
- **Max Replicas**: 6
- **Target CPU**: 80%
- **Cooldown Period**: 60 seconds

### Update Policy

The MIG uses a proactive update strategy:
- **Type**: PROACTIVE
- **Minimal Action**: REPLACE
- **Max Surge**: Equal to number of zones
- **Max Unavailable**: Equal to number of zones
- **Replacement Method**: SUBSTITUTE

## Deployment

### 1. Initialize Terraform

```bash
cd terraform-manifests
terraform init
```

### 2. Review the Plan

```bash
terraform plan
```

### 3. Apply Configuration

```bash
terraform apply
```

### 4. Get Load Balancer IP

```bash
terraform output mylb_static_ip_address
```

### 5. Test the Application

```bash
curl http://<LOAD_BALANCER_IP>
```

## Version Updates

To update from V1 to V2:

1. Edit `c6-03-app1-mig.tf`
2. Comment out V1 template:
   ```hcl
   # instance_template = google_compute_region_instance_template.myapp1.id
   ```
3. Uncomment V2 template:
   ```hcl
   instance_template = google_compute_region_instance_template.myapp1_v2.id
   ```
4. Apply changes:
   ```bash
   terraform apply
   ```

The update policy will automatically perform a zero-downtime rolling update.

## Firewall Rules

| Rule | Protocol | Port | Source | Target Tag |
|------|----------|------|--------|------------|
| SSH | TCP | 22 | 0.0.0.0/0 | ssh-tag |
| HTTP | TCP | 80 | 0.0.0.0/0 | webserver-tag |
| Health Checks | TCP | 80 | 35.191.0.0/16, 130.211.0.0/22 | allow-health-checks |

## Outputs

The configuration provides the following outputs:

- **Load Balancer IP**: Public IP address of the load balancer
- **Backend Service**: Self-link to the backend service
- **MIG Instance Group**: Reference to the managed instance group
- **VM Image Info**: Details about the base image used
- **Compute Zones**: Available zones in the region

## Monitoring

### Health Checks

- **MIG Health Check**: Checks `/index.html` every 5 seconds
- **Load Balancer Health Check**: Separate check for backend service
- **Auto-healing**: Instances replaced after 300 seconds if unhealthy

### Instance Status

Check instance group status:

```bash
gcloud compute instance-groups managed describe hr-dev-myapp1-mig --region=us-central1
```

## Cost Optimization

- Uses `e2-micro` instances (lowest cost tier)
- No external IPs assigned to instances (uses Cloud NAT)
- Auto-scaling prevents over-provisioning
- Regional resources (less expensive than global)

## Security Considerations

- ⚠️ SSH is open to 0.0.0.0/0 - restrict to your IP in production
- ✅ Instances have no public IPs (private by default)
- ✅ Cloud NAT provides controlled outbound access
- ✅ Health check ranges are properly configured

## Troubleshooting

### Instances not receiving traffic

1. Check health check status:
   ```bash
   gcloud compute backend-services get-health hr-dev-myapp1-backend-service --region=us-central1
   ```

2. Verify firewall rules allow health checks

3. Ensure startup script completes successfully

### Update stuck or failing

1. Check update status:
   ```bash
   gcloud compute instance-groups managed describe hr-dev-myapp1-mig --region=us-central1
   ```

2. Review instance template differences

3. Check for health check failures during rollout

## Clean Up

To destroy all resources:

```bash
terraform destroy
```

