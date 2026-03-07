variable "name" {
  description = "Name prefix for subnet resources"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID to create subnets in"
  type        = string
}

variable "igw_id" {
  description = "Internet Gateway ID for public route table"
  type        = string
}

variable "public_subnets" {
  description = "List of public subnet definitions"
  type = list(object({
    cidr = string
    az   = string
  }))
  default = []
}

variable "private_subnets" {
  description = "List of private subnet definitions"
  type = list(object({
    cidr = string
    az   = string
  }))
  default = []
}

variable "db_subnets" {
  description = "List of database subnet definitions"
  type = list(object({
    cidr = string
    az   = string
  }))
  default = []
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
