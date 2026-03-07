output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = { for k, ngw in aws_nat_gateway.this : k => ngw.id }
}

output "nat_public_ips" {
  description = "Public IPs of the NAT Gateways"
  value       = { for k, eip in aws_eip.nat : k => eip.public_ip }
}
