# AWS Application Load Balancer with HTTP Header & Query String Redirects

This Terraform project demonstrates how to set up an AWS Application Load Balancer (ALB) with advanced routing capabilities including HTTP header-based routing, query string redirects, and host header redirects.

## Architecture Overview

This infrastructure creates:
- VPC with public and private subnets across 2 availability zones
- Application Load Balancer with HTTPS listener
- Two sets of EC2 instances (App1 and App2) in private subnets
- Bastion host for SSH access
- ACM certificate for SSL/TLS
- Route53 DNS records
- Security groups with appropriate rules

## Features

### Routing Rules
1. **HTTP Header Routing**: Routes traffic to different target groups based on custom HTTP headers
   - `custom-header: app-1|app1|my-app-1` → Routes to App1 target group
   - `custom-header: app-2|app2|my-app-2` → Routes to App2 target group

2. **Query String Redirect**: 
   - URL with `?website=aws-eks` → Redirects to `https://stacksimplify.com/aws-eks/`

3. **Host Header Redirect**:
   - Requests to `azure-aks11.rezaops.com` → Redirects to `https://stacksimplify.com/azure-aks/azure-kubernetes-service-introduction/`

4. **HTTP to HTTPS Redirect**: All HTTP traffic is automatically redirected to HTTPS

## Prerequisites

- AWS Account with appropriate permissions
- Terraform installed (v1.0+)
- AWS CLI configured
- Route53 hosted zone for `rezaops.com` (update with your domain)
- SSH key pair named `terraform-key` (or update the variable)

## Project Structure

```
.
├── app1-install.sh                                  # User data script for App1 instances
├── app2-install.sh                                  # User data script for App2 instances
├── c1-versions.tf                                   # Terraform and provider versions
├── c2-generic-variables.tf                          # Generic variables (region, environment)
├── c3-local-values.tf                               # Local values and tags
├── c4-01-vpc-variables.tf                           # VPC variables
├── c4-02-vpc-module.tf                              # VPC module configuration
├── c4-03-vpc-outputs.tf                             # VPC outputs
├── c5-02-securitygroup-outputs.tf                   # Security group outputs
├── c5-03-securitygroup-bastionsg.tf                 # Bastion host security group
├── c5-04-securitygroup-privatesg.tf                 # Private instances security group
├── c5-05-securitygroup-loadbalancersg.tf            # Load balancer security group
├── c6-01-datasource-ami.tf                          # Amazon Linux 2 AMI data source
├── c6-02-datasource-route53-zone.tf                 # Route53 zone data source
├── c7-01-ec2instance-variables.tf                   # EC2 instance variables
├── c7-02-ec2instance-outputs.tf                     # EC2 instance outputs
├── c7-03-ec2instance-bastion.tf                     # Bastion host configuration
├── c7-04-ec2instance-private_app1.tf                # App1 instances configuration
├── c7-04-ec2instance-private_app2.tf                # App2 instances configuration
├── c8-elasticip.tf                                  # Elastic IP for bastion
├── c9-nullresource-provisioners.tf                  # Null resource for SSH key provisioning
├── c10-01-ALB-application-loadbalancer-variables.tf # ALB variables
├── c10-02-ALB-application-loadbalancer.tf           # ALB configuration with routing rules
├── c10-03-ALB-application-loadbalancer-outputs.tf   # ALB outputs
├── c11-acm-certificatemanager.tf                    # ACM certificate configuration
├── c12-route53-dnsregistration.tf                   # Route53 DNS records
├── terraform.tfvars                                 # Generic variables values
├── vpc.auto.tfvars                                  # VPC variables values
├── ec2instance.auto.tfvars                          # EC2 variables values
└── loadbalancer.auto.tfvars                         # Load balancer variables values
```

## Configuration

### Update Variables

1. **Domain Configuration** (`c6-02-datasource-route53-zone.tf`):
   ```hcl
   name = "your-domain.com"  # Update with your domain
   ```

2. **DNS Records** (`c12-route53-dnsregistration.tf`):
   ```hcl
   name = "myapps11.your-domain.com"    # Update with your subdomain
   name = "azure-aks11.your-domain.com" # Update with your subdomain
   ```

3. **ACM Certificate** (`c11-acm-certificatemanager.tf`):
   ```hcl
   subject_alternative_names = [
     "*.your-domain.com"  # Update with your domain
   ]
   ```

4. **Environment Variables** (`terraform.tfvars`):
   ```hcl
   aws_region = "us-east-1"
   environment = "stag"
   business_divsion = "hr"
   ```

## Deployment

1. **Initialize Terraform**:
   ```bash
   terraform init
   ```

2. **Review the Plan**:
   ```bash
   terraform plan
   ```

3. **Apply the Configuration**:
   ```bash
   terraform apply
   ```

4. **Wait for Resources**: The deployment takes approximately 10-15 minutes, including ACM certificate validation.

## Testing

### Test HTTP Header Routing

```bash
# Route to App1
curl -H "custom-header: app-1" https://myapps11.your-domain.com

# Route to App2
curl -H "custom-header: app-2" https://myapps11.your-domain.com
```

### Test Query String Redirect

```bash
curl -I "https://myapps11.your-domain.com?website=aws-eks"
# Should return 302 redirect to https://stacksimplify.com/aws-eks/
```

### Test Host Header Redirect

```bash
curl -I "https://azure-aks11.your-domain.com"
# Should return 302 redirect to stacksimplify.com
```

## Accessing the Infrastructure

### SSH to Bastion Host
```bash
ssh -i private-key/terraform-key.pem ec2-user@<bastion-public-ip>
```

### SSH to Private Instances (from Bastion)
```bash
ssh -i terraform-key.pem ec2-user@<private-instance-ip>
```

## Outputs

After deployment, Terraform will output:
- VPC ID and CIDR block
- Public and private subnet IDs
- Bastion host public IP
- Private instance IDs and IPs
- ALB DNS name
- ACM certificate ARN
- Route53 zone details

## Clean Up

To destroy all resources:
```bash
terraform destroy
```

## Security Considerations

- Bastion host allows SSH from `0.0.0.0/0` (consider restricting to your IP)
- Private instances only accept traffic from within the VPC
- Load balancer accepts HTTP/HTTPS from internet
- All traffic between ALB and instances is HTTP (within VPC)
- SSL/TLS termination happens at the ALB

## Cost Optimization

- Single NAT Gateway is used (set `vpc_single_nat_gateway = true`)
- Uses t2.micro instances (eligible for free tier)
- Consider stopping/terminating resources when not in use

## Troubleshooting

### Certificate Validation Issues
Ensure DNS records are properly configured in Route53 for ACM certificate validation.

### Health Check Failures
- Verify security groups allow traffic between ALB and EC2 instances
- Ensure Apache is running on the instances
- Check that the health check paths exist: `/app1/index.html` and `/app2/index.html`

### Connection Timeouts
- Review security group rules
- Check NACL configurations
- Verify route tables are correctly configured

### SSH Issues
- Verify the key pair name matches your AWS key pair
- Ensure the bastion host security group allows SSH from your IP
- Check that the private key file has correct permissions (chmod 400)

## Important Notes

### App2 Installation Script Bug
There's a bug in `app2-install.sh` where the metadata file is saved to the wrong path:
```bash
# Current (incorrect):
sudo curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/dynamic/instance-identity/document -o /var/www/html/app1/metadata.html

# Should be:
sudo curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/dynamic/instance-identity/document -o /var/www/html/app2/metadata.html
```

### Stickiness Configuration
Target groups are configured with session stickiness enabled (1 hour duration) to maintain user sessions to the same backend instance.

## Module Versions

- AWS Provider: 5.70.0
- VPC Module: 5.13.0
- EC2 Instance Module: 5.7.0
- Security Group Module: 5.2.0
- ALB Module: 9.11.0
- ACM Module: 5.1.0

## Architecture Diagram

```
                                    Internet
                                       │
                                       ▼
                            ┌──────────────────┐
                            │  Route53 DNS     │
                            │  rezaops.com     │
                            └──────────────────┘
                                       │
                                       ▼
                         ┌─────────────────────────┐
                         │   Application Load      │
                         │   Balancer (HTTPS)      │
                         │   - HTTP Header Rules   │
                         │   - Query String Rules  │
                         │   - Host Header Rules   │
                         └─────────────────────────┘
                            │                    │
                ┌───────────┴─────────┐   ┌──────┴──────────┐
                ▼                     ▼   ▼                 ▼
         ┌───────────┐         ┌───────────┐         ┌───────────┐
         │  App1 TG  │         │  App2 TG  │         │  Bastion  │
         │  Private  │         │  Private  │         │  Public   │
         │  Subnet   │         │  Subnet   │         │  Subnet   │
         └───────────┘         └───────────┘         └───────────┘
              AZ-1                  AZ-2                  AZ-1
```

