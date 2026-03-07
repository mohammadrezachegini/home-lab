variable "name" {
  description = "Name prefix for peering resources"
  type        = string
}

variable "vpc_a_id" {
  description = "ID of VPC A (requester)"
  type        = string
}

variable "vpc_a_cidr" {
  description = "CIDR block of VPC A"
  type        = string
}

variable "vpc_a_route_table_ids" {
  description = "Route table IDs in VPC A to add routes to VPC B"
  type        = list(string)
}

variable "vpc_b_id" {
  description = "ID of VPC B (accepter)"
  type        = string
}

variable "vpc_b_cidr" {
  description = "CIDR block of VPC B"
  type        = string
}

variable "vpc_b_route_table_ids" {
  description = "Route table IDs in VPC B to add routes to VPC A"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
