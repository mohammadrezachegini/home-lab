output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = [for s in aws_subnet.public : s.id]
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = [for s in aws_subnet.private : s.id]
}

output "db_subnet_ids" {
  description = "IDs of database subnets"
  value       = [for s in aws_subnet.db : s.id]
}

output "private_route_table_ids" {
  description = "IDs of private route tables (one per AZ)"
  value       = { for k, rt in aws_route_table.private : k => rt.id }
}
