variable "gcp_project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "gcp_region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "owner" {
  description = "Owner label"
  type        = string
  default     = "reza"
}

variable "my_ip_cidr" {
  description = "Your IP in CIDR for SSH firewall rule (e.g. 1.2.3.4/32)"
  type        = string
}
