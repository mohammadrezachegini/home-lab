module "private_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "5.2.0"

  name = "private-sg"
  description = "Security group for public bastion hosts"
  vpc_id = module.vpc.vpc_id

  # Ingress Rule Definition and CIDR Block Definition

  ingress_rules = ["ssh-tcp", "http-80-tcp"]
  ingress_cidr_blocks = [module.vpc.vpc_cidr_block]

  # Egress Rule Definition - all-all open

  egress_rules = ["all-all"]
  tags = local.common_tags
  
}