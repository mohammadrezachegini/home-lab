output "vpc_a_id" {
  description = "Production VPC ID"
  value       = module.vpc_a.vpc_id
}

output "vpc_b_id" {
  description = "Staging VPC ID"
  value       = module.vpc_b.vpc_id
}

output "peering_connection_id" {
  description = "VPC Peering Connection ID"
  value       = module.vpc_peering.peering_connection_id
}

output "peering_status" {
  description = "VPC Peering Connection Status"
  value       = module.vpc_peering.peering_status
}

output "test_instance_vpc_a_private_ip" {
  description = "Private IP of test instance in VPC-A"
  value       = aws_instance.test_vpc_a.private_ip
}

output "test_instance_vpc_b_private_ip" {
  description = "Private IP of test instance in VPC-B"
  value       = aws_instance.test_vpc_b.private_ip
}

output "nat_public_ips_vpc_a" {
  description = "Public IPs of NAT Gateways in VPC-A"
  value       = module.nat_a.nat_public_ips
}
