# GCP Regional HTTP Load Balancer with Header-Based Routing

A complete Terraform infrastructure-as-code solution for deploying a Google Cloud Platform Regional HTTP Load Balancer with intelligent header-based routing between multiple application backends.

## Architecture Overview

This project provisions a production-ready load balancing infrastructure featuring:

- **Regional HTTP(S) Load Balancer** with external managed scheme
- **Two application backends** (App1 and App2) running on Managed Instance Groups
- **Header-based routing** to direct traffic based on custom HTTP headers
- **Auto-scaling** with CPU-based policies
- **Health checks** for backend instance monitoring
- **Cloud NAT** for secure outbound internet access
- **Custom VPC networking** with regional subnets

## Infrastructure Components

### Networking
- Custom VPC with manual subnet creation
- Regional subnet for compute instances (10.128.0.0/24)
- Regional proxy subnet for load balancer (10.0.0.0/24)
- Cloud Router and Cloud NAT for outbound connectivity
- Firewall rules for SSH, HTTP, and health checks

### Compute Resources
- **App1 MIG**: 2-6 instances, 80% CPU target
- **App2 MIG**: 2-4 instances, 90% CPU target
- E2-micro machine type (configurable)
- Debian 12 base image
- Auto-healing with 300-second initial delay

### Load Balancing
- Regional static IP address
- HTTP health checks (5s interval, 5s timeout)
- Backend services with utilization-based balancing
- URL map with header-based routing rules
- HTTP proxy and forwarding rule

## Routing Logic

The load balancer routes traffic based on the `appname` HTTP header:

| Header Value | Destination | Priority |
|--------------|-------------|----------|
| `appname: myapp1` | App1 Backend | 1 |
| `appname: myapp2` | App2 Backend | 2 |
| No header | App1 Backend (default) | - |

## Prerequisites

- Google Cloud Platform account with billing enabled
- Terraform >= 1.0
- `gcloud` CLI configured with appropriate credentials
- Project with Compute Engine API enabled

## Project Structure

```
terraform-manifests/
├── c1-versions.tf                    # Provider configuration
├── c2-01-variables.tf                # Input variables
├── c2-02-local-values.tf             # Local values and tags
├── c3-vpc.tf                         # VPC and subnet resources
├── c4-firewallrules.tf               # Firewall rules
├── c5-datasource.tf                  # Data sources for zones and images
├── c6-01-app1-instance-template.tf   # App1 instance template
├── c6-02-app1-mig-healthcheck.tf     # App1 health check
├── c6-03-app1-mig.tf                 # App1 MIG
├── c6-04-app1-mig-autoscaling.tf     # App1 autoscaling policy
├── c6-05-app1-mig-outputs.tf         # App1 outputs
├── c6-06-app2-instance-template.tf   # App2 instance template
├── c6-07-app2-mig-healthcheck.tf     # App2 health check
├── c6-08-app2-mig.tf                 # App2 MIG
├── c6-09-app2-mig-autoscaling.tf     # App2 autoscaling policy
├── c6-10-app2-mig-outputs.tf         # App2 outputs
├── c7-01-loadbalancer.tf             # Load balancer resources
├── c7-02-loadbalancer-outputs.tf     # Load balancer outputs
├── c8-Cloud-NAT-Cloud-Router.tf      # Cloud Router and NAT
├── app1-webserver-install.sh         # App1 startup script
├── app2-webserver-install.sh         # App2 startup script
└── terraform.tfvars                  # Variable values
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

### Available Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `gcp_project` | GCP project ID | `terraform-gcp-438417` |
| `gcp_region1` | Deployment region | `us-central1` |
| `machine_type` | Compute Engine machine type | `e2-micro` |
| `environment` | Environment prefix | `dev` |
| `business_divsion` | Business division tag | `sap` |

## Deployment

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd Regional-HTTP-LB-HEADER-Routing/terraform-manifests
```

### Step 2: Initialize Terraform

```bash
terraform init
```

### Step 3: Review Plan

```bash
terraform plan
```

### Step 4: Deploy Infrastructure

```bash
terraform apply
```

### Step 5: Retrieve Load Balancer IP

```bash
terraform output mylb_static_ip_address
```

## Testing

### Test Default Routing (App1)

```bash
curl http://<LOAD_BALANCER_IP>
```

### Test Header-Based Routing to App1

```bash
curl -H "appname: myapp1" http://<LOAD_BALANCER_IP>
```

### Test Header-Based Routing to App2

```bash
curl -H "appname: myapp2" http://<LOAD_BALANCER_IP>
```

### Expected Responses

- **App1**: Pink background with "WebVM App1" message
- **App2**: Blue background with "WebVM App2" message

Each response includes:
- VM hostname
- VM IP address
- Application version

## Outputs

After successful deployment, the following outputs are available:

```hcl
mylb_static_ip_address              # Load balancer IP address
mylb_forwarding_rule_ip_address     # Forwarding rule IP
myapp1_mig_instance_group           # App1 instance group
myapp2_mig_instance_group           # App2 instance group
myapp1_backend_service_self_link    # App1 backend service URL
myapp2_backend_service_self_link    # App2 backend service URL
mylb_url_map_self_link              # URL map configuration
compute_zones                       # Available zones in region
```

## Security Features

- **Private instances**: No external IPs on compute instances
- **Cloud NAT**: Secure outbound internet access for updates
- **Firewall rules**: Restricted ingress to SSH (22) and HTTP (80)
- **Health check ranges**: Allows GCP health check probes (35.191.0.0/16, 130.211.0.0/22)
- **Network tags**: Granular firewall targeting

## Auto-Scaling Configuration

### App1
- Minimum replicas: 2
- Maximum replicas: 6
- CPU target: 80%
- Cooldown period: 60 seconds

### App2
- Minimum replicas: 2
- Maximum replicas: 4
- CPU target: 90%
- Cooldown period: 60 seconds

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: The destroy process includes proper dependency handling to ensure the proxy subnet is deleted after the load balancer.

## Troubleshooting

### Common Issues

**Issue**: Instances unhealthy
- Check firewall rules allow health check ranges
- Verify health check path is accessible
- Review instance startup script logs

**Issue**: Load balancer not routing correctly
- Verify header syntax in curl commands
- Check URL map configuration in console
- Review backend service health status

**Issue**: Instances can't reach internet
- Ensure Cloud NAT is properly configured
- Check router NAT configuration
- Verify subnet configuration

## Cost Considerations

This infrastructure incurs costs for:
- Compute Engine instances (minimum 4 e2-micro instances)
- Regional Load Balancer
- Cloud NAT gateway
- Network egress
- Static IP addresses

**Tip**: Use `e2-micro` instances and minimum replica counts for development/testing to minimize costs.

## Best Practices Implemented

- Infrastructure as Code with Terraform
- Modular resource organization
- Consistent naming conventions using local values
- Comprehensive tagging strategy
- Auto-healing and auto-scaling for high availability
- Regional deployment for lower latency
- Health checks for backend monitoring
- Separate startup scripts for application isolation

