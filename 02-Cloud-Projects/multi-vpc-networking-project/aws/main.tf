terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  common_tags = {
    Project     = "multi-vpc-networking"
    Environment = "lab"
    ManagedBy   = "terraform"
    Owner       = var.owner
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# VPC-A (Production)
# ─────────────────────────────────────────────────────────────────────────────
module "vpc_a" {
  source     = "../modules/vpc"
  name       = "prod"
  cidr_block = "172.16.0.0/16"
  tags       = merge(local.common_tags, { Environment = "production" })
}

module "subnets_a" {
  source = "../modules/subnets"
  name   = "prod"
  vpc_id = module.vpc_a.vpc_id
  igw_id = module.vpc_a.igw_id

  public_subnets = [
  { cidr = "172.16.1.0/24", az = "${var.aws_region}a" },
  { cidr = "172.16.2.0/24", az = "${var.aws_region}b" },
]
  private_subnets = [
    { cidr = "172.16.3.0/24", az = "${var.aws_region}a" },
    { cidr = "172.16.4.0/24", az = "${var.aws_region}b" },
  ]
  db_subnets = [
    { cidr = "172.16.5.0/24", az = "${var.aws_region}a" },
    { cidr = "172.16.6.0/24", az = "${var.aws_region}b" },
  ]

  tags = merge(local.common_tags, { Environment = "production" })
}

module "nat_a" {
  source                  = "../modules/nat_gateway"
  name                    = "prod"
  public_subnet_ids       = module.subnets_a.public_subnet_ids
  private_route_table_ids = module.subnets_a.private_route_table_ids
  tags                    = merge(local.common_tags, { Environment = "production" })
}

module "sg_a" {
  source             = "../modules/security_groups"
  name               = "prod"
  vpc_id             = module.vpc_a.vpc_id
  vpc_cidr           = module.vpc_a.vpc_cidr
  bastion_cidr       = var.my_ip_cidr
  public_subnet_ids  = module.subnets_a.public_subnet_ids
  private_subnet_ids = module.subnets_a.private_subnet_ids
  tags               = merge(local.common_tags, { Environment = "production" })
}

# ─────────────────────────────────────────────────────────────────────────────
# VPC-B (Staging)
# ─────────────────────────────────────────────────────────────────────────────
module "vpc_b" {
  source     = "../modules/vpc"
  name       = "staging"
  cidr_block = "172.18.0.0/16"
  tags       = merge(local.common_tags, { Environment = "staging" })
}

module "subnets_b" {
  source = "../modules/subnets"
  name   = "staging"
  vpc_id = module.vpc_b.vpc_id
  igw_id = module.vpc_b.igw_id

  public_subnets = [
  { cidr = "172.18.1.0/24", az = "${var.aws_region}a" },
  { cidr = "172.18.2.0/24", az = "${var.aws_region}b" },
]
  private_subnets = [
    { cidr = "172.18.3.0/24", az = "${var.aws_region}a" },
    { cidr = "172.18.4.0/24", az = "${var.aws_region}b" },
  ]
  db_subnets = [
    { cidr = "172.18.5.0/24", az = "${var.aws_region}a" },
    { cidr = "172.18.6.0/24", az = "${var.aws_region}b" },
  ]

  tags = merge(local.common_tags, { Environment = "staging" })
}

module "nat_b" {
  source                  = "../modules/nat_gateway"
  name                    = "staging"
  public_subnet_ids       = module.subnets_b.public_subnet_ids
  private_route_table_ids = module.subnets_b.private_route_table_ids
  tags                    = merge(local.common_tags, { Environment = "staging" })
}

module "sg_b" {
  source             = "../modules/security_groups"
  name               = "staging"
  vpc_id             = module.vpc_b.vpc_id
  vpc_cidr           = module.vpc_b.vpc_cidr
  bastion_cidr       = var.my_ip_cidr
  public_subnet_ids  = module.subnets_b.public_subnet_ids
  private_subnet_ids = module.subnets_b.private_subnet_ids
  tags               = merge(local.common_tags, { Environment = "staging" })
}

# ─────────────────────────────────────────────────────────────────────────────
# VPC Peering: Production <-> Staging
# ─────────────────────────────────────────────────────────────────────────────
module "vpc_peering" {
  source = "../modules/vpc_peering"
  name   = "prod-staging"

  vpc_a_id   = module.vpc_a.vpc_id
  vpc_a_cidr = module.vpc_a.vpc_cidr
  vpc_a_route_table_ids = concat(
    values(module.subnets_a.private_route_table_ids),
  )

  vpc_b_id   = module.vpc_b.vpc_id
  vpc_b_cidr = module.vpc_b.vpc_cidr
  vpc_b_route_table_ids = concat(
    values(module.subnets_b.private_route_table_ids),
  )

  tags = local.common_tags
}

# ─────────────────────────────────────────────────────────────────────────────
# Test EC2 Instances (one per VPC to verify connectivity)
# ─────────────────────────────────────────────────────────────────────────────
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_key_pair" "lab" {
  key_name   = "multi-vpc-lab-key"
  public_key = file(pathexpand(var.ssh_public_key_path))

}

# EC2 in VPC-A private subnet (for peering test)
resource "aws_instance" "test_vpc_a" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = module.subnets_a.private_subnet_ids[0]
  vpc_security_group_ids = [module.sg_a.app_sg_id]
  key_name               = aws_key_pair.lab.key_name

  tags = merge(local.common_tags, {
    Name = "test-vpc-a"
  })
}

# EC2 in VPC-B private subnet (for peering test)
resource "aws_instance" "test_vpc_b" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = module.subnets_b.private_subnet_ids[0]
  vpc_security_group_ids = [module.sg_b.app_sg_id]
  key_name               = aws_key_pair.lab.key_name

  tags = merge(local.common_tags, {
    Name = "test-vpc-b"
  })
}
