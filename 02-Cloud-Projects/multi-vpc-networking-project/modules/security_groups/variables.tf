variable "name" {
  description = "Name prefix for security group resources"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block of the VPC (used in NACLs)"
  type        = string
}

variable "bastion_cidr" {
  description = "CIDR block allowed for SSH access (your IP or bastion)"
  type        = string
  default     = "10.0.0.0/8"
}

variable "public_subnet_ids" {
  description = "Public subnet IDs to associate public NACL with"
  type        = list(string)
  default     = []
}

variable "private_subnet_ids" {
  description = "Private subnet IDs to associate private NACL with"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
