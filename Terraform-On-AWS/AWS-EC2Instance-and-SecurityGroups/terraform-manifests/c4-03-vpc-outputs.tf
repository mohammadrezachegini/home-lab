output "vpc_id" {
    description = "The VPC ID"
    value = module.vpc.vpc_id
  
}

output "vpc_cidr_block" {
    description = "The VPC CIDR block"
    value = module.vpc.vpc_cidr_block
  
}

output "private_subnets" {
    description = "The VPC private subnets"
    value = module.vpc.private_subnets
  
}

output "public_subnets" {
    description = "The VPC public subnets"
    value = module.vpc.public_subnets
  
}

output "nat_public_ips" {
    description = "List of public Elastic IPs created for the NAT Gateways"
    value = module.vpc.nat_public_ips
}

output "azs" {
    description = "A list of availability zones specified for the VPC"
    value = module.vpc.azs
}