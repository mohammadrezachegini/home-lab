# This Terraform configuration sets up the required provider for Google Cloud Platform (GCP).
# It specifies the source and version of the Google provider.
# Additionally, it configures the Google provider with the project ID and region.
#
# - required_providers: Specifies the providers required by the configuration.
#   - google: The Google Cloud provider.
#     - source: The source of the provider, in this case, "hashicorp/google".
#     - version: The version of the provider to use, here it is "6.6.0".
#
# - provider "google": Configures the Google Cloud provider.
#   - project: The GCP project ID to use.
#   - region: The GCP region to use.
terraform {
  required_providers {
    google = {
      source = "hashicorp/google"
      version = "6.6.0"
    }
  }
}

provider "google" {
  # Configuration options
  project = "terraform-gcp-438417"
  region = "us-central1"
}