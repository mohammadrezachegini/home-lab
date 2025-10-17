# Terraform Module: AWS S3 Static Website Hosting

This repository contains Terraform configurations for hosting static websites on AWS S3. It demonstrates the evolution from basic Terraform manifests to a reusable custom module.

## 📋 Overview

This project showcases two approaches to deploying static websites on AWS S3:
- **v2**: Direct Terraform manifests for S3 static website hosting
- **v3**: Custom reusable Terraform module with modular architecture

## 🚀 Features

- **S3 Bucket Configuration**: Automated bucket creation with website hosting enabled
- **Public Access**: Configured for public read access to serve static content
- **Versioning**: Object versioning enabled for content management
- **Custom Module**: Reusable module structure for easy deployment across multiple environments
- **Outputs**: Comprehensive output values including website URL and bucket details

## 📁 Repository Structure

```
├── v2-host-static-website-on-s3-using-terraform-manifests/
│   ├── main.tf           # S3 bucket and website configuration
│   ├── variables.tf      # Input variable definitions
│   ├── outputs.tf        # Output variable definitions
│   ├── versions.tf       # Terraform and provider version constraints
│   └── terraform.tfvars  # Variable values
│
└── v3-build-a-module-to-host-static-website-on-aws-s3/
    ├── c1-versions.tf    # Terraform and provider configuration
    ├── c2-variables.tf   # Input variables for root module
    ├── c3-s3bucket.tf    # Module invocation
    ├── c4-outputs.tf     # Output definitions
    ├── terraform.tfvars  # Variable values
    ├── index.html        # Sample website content
    └── modules/
        └── aws-s3-static-website-bucket/
            ├── main.tf
            ├── variables.tf
            ├── outputs.tf
            └── terraform.tfvars
```

## 🛠️ Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) >= 1.6
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- AWS account with permissions to create S3 buckets and policies

## 📝 Configuration

### AWS Credentials

Ensure your AWS credentials are configured in `~/.aws/credentials`:

```ini
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
```

### Variable Configuration

Update `terraform.tfvars` with your desired values:

**For v2:**
```hcl
bucket_name = "your-unique-bucket-name"
tags = {
  Terraform   = "true"
  Environment = "dev"
}
```

**For v3:**
```hcl
aws_region   = "us-east-1"
my_s3_bucket = "your-unique-bucket-name"
my_s3_tags = {
  Terraform   = "true"
  Environment = "dev"
}
```

## 🚦 Usage

### Option 1: Using Direct Manifests (v2)

```bash
cd v2-host-static-website-on-s3-using-terraform-manifests
terraform init
terraform plan
terraform apply
```

### Option 2: Using Custom Module (v3)

```bash
cd v3-build-a-module-to-host-static-website-on-aws-s3
terraform init
terraform plan
terraform apply
```

### Uploading Website Content

After deployment, upload your static website files:

```bash
aws s3 cp index.html s3://your-bucket-name/ --acl public-read
aws s3 cp error.html s3://your-bucket-name/ --acl public-read
```

## 📤 Outputs

After successful deployment, Terraform will output:

- `name`: S3 bucket ID
- `arn`: S3 bucket ARN
- `bucket_domain_name`: S3 bucket domain name
- `bucket_regional_domain_name`: Regional domain name
- `static_website_url`: Public URL to access your static website

Access your website at:
```
http://your-bucket-name.s3-website.us-east-1.amazonaws.com
```

## 🔒 Security Considerations

⚠️ **Important Security Notes:**

1. **Public Access**: This configuration makes the S3 bucket publicly accessible. Review the security implications for your use case.
2. **Bucket Policy**: The bucket policy allows public read access to all objects.
3. **Production Use**: For production deployments, consider:
   - Using CloudFront for HTTPS and better performance
   - Implementing bucket policies with more restrictive conditions
   - Enabling additional security features like MFA delete
   - Using AWS WAF for additional protection

## 🏗️ Resources Created

This module creates the following AWS resources:

- `aws_s3_bucket`: S3 bucket for static website hosting
- `aws_s3_bucket_website_configuration`: Website hosting configuration
- `aws_s3_bucket_versioning`: Object versioning configuration
- `aws_s3_bucket_ownership_controls`: Bucket ownership controls
- `aws_s3_bucket_public_access_block`: Public access block settings
- `aws_s3_bucket_acl`: Bucket ACL configuration
- `aws_s3_bucket_policy`: Bucket policy for public read access

## 🧹 Cleanup

To destroy all created resources:

```bash
terraform destroy
```

Note: The `force_destroy = true` setting allows bucket deletion even if it contains objects.

## 📚 Module Inputs (v3)

| Name | Description | Type | Required |
|------|-------------|------|----------|
| `aws_region` | AWS region for resource creation | `string` | Yes |
| `my_s3_bucket` | Unique S3 bucket name | `string` | Yes |
| `my_s3_tags` | Tags to apply to the bucket | `map(string)` | Yes |

## 📊 Module Outputs (v3)

| Name | Description |
|------|-------------|
| `name` | S3 bucket ID |
| `arn` | S3 bucket ARN |
| `bucket_domain_name` | Bucket domain name |
| `bucket_regional_domain_name` | Regional domain name |
| `static_website_url` | Public website URL |

