# Add these to your terraform/aws/variables.tf for Phase 3 VPN

variable "home_lab_public_ip" {
  description = "Your home lab public IP address (run: curl ifconfig.me on your Minisforum)"
  type        = string
  # example: "123.456.789.10"
}

variable "home_lab_cidr" {
  description = "Your home lab LAN CIDR (the network behind your router)"
  type        = string
  default     = "192.168.1.0/24"   # change to match your actual home network
}

variable "vpc_a_id" {
  description = "VPC-A ID (output from main.tf, passed in for VPN module)"
  type        = string
  default     = ""   # populated automatically when using outputs from main.tf
}

variable "private_route_table_ids" {
  description = "Private route table IDs to add VPN routes to"
  type        = list(string)
  default     = []
}
