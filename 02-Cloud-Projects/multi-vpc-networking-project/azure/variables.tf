variable "azure_location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "owner" {
  description = "Owner tag value"
  type        = string
  default     = "reza"
}

variable "my_ip_cidr" {
  description = "Your IP in CIDR for NSG SSH rule (e.g. 1.2.3.4/32)"
  type        = string
}

variable "ssh_public_key_path" {
  description = "Path to your SSH public key"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}
