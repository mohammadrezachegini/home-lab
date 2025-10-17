output "ec2_bastion_public_instance_ids" {
    description = "EC2 instance IDs of the public bastion hosts"
    value = module.ec2_public.id  
}

output "ec2_bastion_public_id" {
  description = "value of the public bastion host"
  value = module.ec2_public.public_ip
}

output "ec2_private_instance_ids" {
  description = "List of IDs of instances"
  value = [for ec2private in module.ec2_private: ec2private.id ]   
}

output "ec2_private_private_ips" {
    description = "Private IPs of the private instances"
    value = [for ec2private in module.ec2_private: ec2private.private_ip]
}