# Terraform Settings Block
terraform {
  required_version = ">= 1.9"
  required_providers {
    google = {
      source = "hashicorp/google"
      version = "6.6.0"
    }
  }
  backend "gcs" {
    bucket = "terraform-gcp-438417-tfstate"
    prefix = "cloudsql/publicdb"
  }
}

# Terraform Provider Block
provider "google" {
  project = var.gcp_project
  region = var.gcp_region1
}