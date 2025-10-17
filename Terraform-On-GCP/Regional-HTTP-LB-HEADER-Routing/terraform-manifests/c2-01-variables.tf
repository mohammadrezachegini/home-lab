# Input Variables
# 
# gcp_project: Specifies the GCP project where resources will be created. Default is "terraform-gcp-438417".
# gcp_region1: Defines the GCP region for resource creation. Default is "us-central1".
# machine_type: Indicates the type of Compute Engine machine to use. Default is "e2-micro".
# environment: Used as a prefix for environment-specific resources. Default is "dev".
# business_divsion: Represents the business division within the organization. Default is "sap".

# GCP Project
variable "gcp_project" {
  description = "Project in which GCP Resources to be created"
  type = string
  default = "terraform-gcp-438417"
}

# GCP Region
variable "gcp_region1" {
  description = "Region in which GCP Resources to be created"
  type = string
  default = "us-central1"
}

# GCP Compute Engine Machine Type
variable "machine_type" {
  description = "Compute Engine Machine Type"
  type = string
  default = "e2-micro"
}


# Environment Variable
variable "environment" {
  description = "Environment Variable used as a prefix"
  type = string
  default = "dev"
}

# Business Division
variable "business_divsion" {
  description = "Business Division in the large organization this Infrastructure belongs"
  type = string
  default = "sap"
}