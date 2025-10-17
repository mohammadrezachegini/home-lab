# GCP Terraform - Instance Templates and Image Data Source

This Terraform project demonstrates how to use Google Cloud Platform (GCP) data sources to retrieve compute image information, which can be used for creating instance templates and VM instances.

## Project Structure

```
image-play-tf/
├── c1-versions.tf       # Provider configuration and versions
└── datasource.tf        # Data source and output definitions
```

## Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) installed (compatible with Google provider v6.6.0)
- Google Cloud Platform account
- GCP project with appropriate permissions
- `gcloud` CLI configured (optional, but recommended)

## Configuration Files

### c1-versions.tf
Defines the Terraform and provider requirements:
- Google provider version: `6.6.0`
- Default project: `terraform-gcp`
- Default region: `us-central1`

### datasource.tf
Retrieves Debian 12 image information from the `debian-cloud` project and outputs comprehensive image metadata.

## Setup Instructions

### 1. Update Project Configuration

Before running Terraform, update the `project` value in `c1-versions.tf` to match your GCP project ID:

```hcl
provider "google" {
  project = "your-gcp-project-id"  # Replace with your project ID
  region = "us-central1"
}
```

### 2. Initialize Terraform

```bash
terraform init
```

This command downloads the required Google provider plugin.

### 3. Plan the Infrastructure

```bash
terraform plan
```

This shows what Terraform will query (data sources don't create resources, they only retrieve information).

### 4. Apply the Configuration

```bash
terraform apply
```

Type `yes` when prompted to confirm.

## Outputs

After applying, Terraform will display the following information about the Debian 12 image:

- **id**: Resource identifier
- **self_link**: Full GCP resource URL
- **name**: Image name
- **family**: Image family (debian-12)
- **image_id**: Unique image identifier
- **status**: Current status of the image
- **licenses**: Associated licenses
- **description**: Image description
- **project**: Source project (debian-cloud)
- **source_image_id**: Original source image ID

### Example Output

```
vmimage_info = {
  description = "Debian, Debian GNU/Linux, 12 (bookworm), amd64 built on 20240101"
  family = "debian-12"
  id = "projects/debian-cloud/global/images/debian-12-bookworm-v20240101"
  image_id = "1234567890123456789"
  licenses = [
    "https://www.googleapis.com/compute/v1/projects/debian-cloud/global/licenses/debian-12-bookworm",
  ]
  name = "debian-12-bookworm-v20240101"
  project = "debian-cloud"
  self_link = "https://www.googleapis.com/compute/v1/projects/debian-cloud/global/images/debian-12-bookworm-v20240101"
  source_image_id = ""
  status = "READY"
}
```

## Use Cases

This data source can be used to:

1. **Dynamic Image Selection**: Automatically select the latest image from a family
2. **Instance Templates**: Reference images when creating instance templates
3. **VM Creation**: Use the image information to create compute instances
4. **Documentation**: Generate documentation about available images
5. **Validation**: Verify image availability before deploying infrastructure

## Customization

### Using Different Image Families

To query different image families, modify the `datasource.tf` file:

```hcl
data "google_compute_image" "my_image" {
  project = "ubuntu-os-cloud"    # For Ubuntu images
  family  = "ubuntu-2204-lts"    # Ubuntu 22.04 LTS
}
```

### Common Image Families

| Operating System | Project | Family |
|-----------------|---------|--------|
| Debian 12 | debian-cloud | debian-12 |
| Debian 11 | debian-cloud | debian-11 |
| Ubuntu 22.04 | ubuntu-os-cloud | ubuntu-2204-lts |
| Ubuntu 20.04 | ubuntu-os-cloud | ubuntu-2004-lts |
| CentOS Stream 9 | centos-cloud | centos-stream-9 |
| Rocky Linux 9 | rocky-linux-cloud | rocky-linux-9 |
| Windows Server 2022 | windows-cloud | windows-2022 |

### Filtering Specific Images

To get a specific image version instead of the latest from a family:

```hcl
data "google_compute_image" "my_image" {
  project = "debian-cloud"
  name    = "debian-12-bookworm-v20240101"  # Specific version
}
```

## Authentication

Terraform needs to authenticate with GCP. You can use one of these methods:

1. **Application Default Credentials** (recommended for development):
   ```bash
   gcloud auth application-default login
   ```

2. **Service Account Key**:
   ```hcl
   provider "google" {
     credentials = file("path/to/service-account-key.json")
     project     = "your-project-id"
     region      = "us-central1"
   }
   ```

3. **Environment Variable**:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"
   ```

## Cleanup

Since this configuration only uses data sources (no actual resources are created), there's nothing to destroy. However, you can clean up Terraform state files:

```bash
rm -rf .terraform
rm terraform.tfstate*
```

## Troubleshooting

### Error: "Project not found"
Ensure your GCP project ID is correct in `c1-versions.tf` and that you have appropriate permissions.

### Error: "Authentication failed"
Run `gcloud auth application-default login` or verify your service account credentials.

### Error: "Image not found"
Verify the image family name is correct. You can list available images with:
```bash
gcloud compute images list --project=debian-cloud --no-standard-images
```

## Next Steps

After retrieving image information, you can:

1. Create instance templates using this image
2. Deploy VM instances with the retrieved image
3. Set up managed instance groups
4. Implement auto-scaling configurations

