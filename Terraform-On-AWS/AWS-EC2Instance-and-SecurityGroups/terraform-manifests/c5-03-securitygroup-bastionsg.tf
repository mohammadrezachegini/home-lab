module "public_bastion_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "5.2.0"

  name = "public-bastion-sg"
  description = "Security group for public bastion hosts"
  vpc_id = module.vpc.vpc_id

  # Ingress Rule Definition and CIDR Block Definition

  ingress_rules = ["ssh-tcp"]
  ingress_cidr_blocks = ["0.0.0.0/0"]

  # Egress Rule Definition - all-all open

  egress_rules = ["all-all"]
  tags = local.common_tags
  
}