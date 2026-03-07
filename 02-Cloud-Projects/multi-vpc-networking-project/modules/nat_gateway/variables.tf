variable "name" {
  description = "Name prefix for NAT gateway resources"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs (one NAT GW per subnet/AZ)"
  type        = list(string)
}

variable "private_route_table_ids" {
  description = "Map of private route table IDs (key = AZ index matching public_subnet_ids)"
  type        = map(string)
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
