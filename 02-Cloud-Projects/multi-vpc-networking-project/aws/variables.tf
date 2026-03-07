variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "owner" {
  description = "Owner name for tagging"
  type        = string
  default     = "reza"
}

variable "my_ip_cidr" {
  description = "Your home IP in CIDR format for SSH access (e.g. 1.2.3.4/32)"
  type        = string
  # Get your IP: curl ifconfig.me
}

variable "ssh_public_key_path" {
  description = "Path to your SSH public key file"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}
