# AWS CloudWatch Monitoring Infrastructure

A production-ready Terraform infrastructure project that deploys a complete AWS monitoring solution with Auto Scaling Groups, Application Load Balancer, CloudWatch alarms, and Synthetics canaries.

## Architecture Overview

This project provisions a highly available, auto-scaling web application infrastructure with comprehensive monitoring:

- **VPC** with public/private subnets across 2 availability zones
- **Application Load Balancer** with HTTPS termination
- **Auto Scaling Group** with launch templates
- **CloudWatch Alarms** for ASG, ALB, and CIS compliance
- **CloudWatch Synthetics** for availability monitoring
- **Route53** DNS integration
- **ACM** SSL certificate management
- **SNS** notifications for alerts

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- An existing Route53 hosted zone
- SSH key pair for EC2 access
- Valid email for SNS notifications

## Project Structure

```
terraform-manifests/
├── c1-versions.tf                    # Provider configurations
├── c2-generic-variables.tf           # Global variables
├── c3-local-values.tf                # Local value definitions
├── c4-*.tf                           # VPC module and configuration
├── c5-*.tf                           # Security groups
├── c6-*.tf                           # Data sources (AMI, Route53)
├── c7-*.tf                           # EC2 bastion host
├── c8-elasticip.tf                   # Elastic IP for bastion
├── c9-nullresource-provisioners.tf   # Provisioners
├── c10-*.tf                          # Application Load Balancer
├── c11-acm-certificatemanager.tf     # SSL certificates
├── c12-route53-dnsregistration.tf    # DNS records
├── c13-*.tf                          # Auto Scaling configuration
├── c14-*.tf                          # CloudWatch monitoring
├── app1-install.sh                   # Application bootstrap script
├── vpc.auto.tfvars                   # VPC variables
└── ec2instance.auto.tfvars           # EC2 variables
```

## Key Features

### Auto Scaling

- **Target Tracking Policies**:
  - CPU utilization (target: 50%)
  - ALB request count per target (target: 10 requests)
- **Scheduled Scaling**:
  - Scale up at 7 AM UTC (8 instances)
  - Scale down at 5 PM UTC (2 instances)
- **SNS Notifications** for scaling events

### CloudWatch Monitoring

#### ASG Alarms
- High CPU alarm (>80% for 4 minutes)
- Automatic scale-out on alarm trigger

#### ALB Alarms
- HTTP 4xx error monitoring
- Threshold: 5 errors over 6 minutes

#### CIS Compliance Alarms
- Pre-configured CIS benchmark alarms
- Disabled controls: DisableOrDeleteCMK, VPCChanges

#### Synthetics Canary
- Monitors website availability
- Runs every minute
- Success threshold: 90%
- Takes screenshots on failure

## Configuration

### Required Variables

Update the following in your `.tfvars` files:

**vpc.auto.tfvars**:
```hcl
vpc_name = "myvpc"
vpc_cidr_block = "10.0.0.0/16"
vpc_availability_zones = ["us-east-1a", "us-east-1b"]
vpc_public_subnets = ["10.0.101.0/24", "10.0.102.0/24"]
vpc_private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
```

**ec2instance.auto.tfvars**:
```hcl
instance_type = "t2.micro"
instance_keypair = "terraform-key"
private_instance_count = 2
```

### Environment-Specific Settings

In `c2-generic-variables.tf`:
```hcl
variable "aws_region" {
  default = "us-east-1"
}

variable "environment" {
  default = "dev"
}

variable "business_divsion" {
  default = "sap"
}
```

### Domain Configuration

Update `c6-02-datasource-route53-zone.tf` with your domain:
```hcl
data "aws_route53_zone" "mydomain" {
  name = "your-domain.com"  # Change this
  private_zone = false
}
```

Update `c11-acm-certificatemanager.tf`:
```hcl
subject_alternative_names = [
  "*.your-domain.com"  # Change this
]
```

Update `c12-route53-dnsregistration.tf`:
```hcl
name = "cloudwatch.your-domain.com"  # Change this
```

### SNS Email Notifications

Update `c13-05-autoscaling-notifications.tf`:
```hcl
endpoint = "your-email@example.com"  # Change this
```

## Deployment

### 1. Initialize Terraform

```bash
cd terraform-manifests
terraform init
```

### 2. Validate Configuration

```bash
terraform validate
terraform fmt
```

### 3. Plan Infrastructure

```bash
terraform plan
```

### 4. Apply Configuration

```bash
terraform apply
```

### 5. Confirm SNS Subscription

Check your email and confirm the SNS subscription to receive CloudWatch alerts.

## Outputs

After deployment, Terraform will output:

- VPC ID and CIDR blocks
- Public and private subnet IDs
- NAT Gateway public IPs
- Bastion host public IP
- ALB DNS name and ARN
- Auto Scaling Group details
- CloudWatch alarm statuses

## Testing

### Access the Application

```bash
# Via ALB DNS name
curl https://cloudwatch.your-domain.com

# Via direct EC2 instance (from bastion)
ssh -i terraform-key.pem ec2-user@<bastion-ip>
curl http://<private-instance-ip>/app1/index.html
```

### Test Auto Scaling

Generate load to trigger CPU-based scaling:
```bash
# SSH to an instance
# Install stress tool
sudo amazon-linux-extras install epel -y
sudo yum install stress -y

# Generate CPU load
stress --cpu 4 --timeout 600
```

### Monitor CloudWatch

- Navigate to CloudWatch console
- View alarms under "All alarms"
- Check Synthetics canaries under "Application monitoring > Canaries"
- View metrics for ASG and ALB

## Security Considerations

- Bastion host has SSH access from anywhere (0.0.0.0/0) - **restrict this in production**
- ALB accepts traffic from internet on ports 80/443
- Private instances only accept traffic from VPC CIDR
- All traffic uses security groups for defense-in-depth
- HTTPS enforced with automatic HTTP to HTTPS redirect

## Cost Optimization

- Single NAT Gateway enabled (not HA, for cost savings)
- T2.micro instances used (free tier eligible)
- Auto Scaling ensures you only run instances when needed
- Scheduled scaling reduces costs during off-hours

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: Confirm the action when prompted. This will delete all resources including the S3 bucket for Synthetics.

## Module Versions

- VPC: `5.13.0`
- ALB: `9.11.0`
- Security Group: `5.2.0`
- EC2 Instance: `5.7.0`
- ACM: `5.1.0`
- CloudWatch CIS Alarms: `5.6.0`

## Troubleshooting

### Common Issues

**ALB health checks failing**:
- Verify security group allows traffic on port 80
- Check `/app1/index.html` endpoint exists
- Review target group health check settings

**Auto Scaling not triggering**:
- Verify CloudWatch alarms are in "OK" state
- Check metric data is being published
- Review scaling policy thresholds

**Synthetics canary failing**:
- Check S3 bucket permissions
- Verify IAM role has correct policies
- Review canary script in CloudWatch Logs

**Certificate validation stuck**:
- Ensure Route53 DNS records are created
- Wait up to 30 minutes for DNS propagation
- Check ACM console for validation status


