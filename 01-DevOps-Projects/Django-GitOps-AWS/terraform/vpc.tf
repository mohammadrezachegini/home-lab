# ── VPC ───────────────────────────────────────────────────────────────────────
# We create a VPC with public and private subnets across 2 AZs.
#
# Public subnets:  EKS nodes, NAT Gateway, Load Balancer
# Private subnets: RDS PostgreSQL (never exposed to internet)
#
# Traffic flow:
#   Internet → Internet Gateway → Public subnet → NAT Gateway
#   Private subnet → NAT Gateway → Internet (for outbound only)
#   RDS sits in private subnet — only reachable from EKS nodes

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true   # Required for EKS
  enable_dns_support   = true   # Required for EKS

  tags = {
    Name = "${var.project_name}-vpc"
    # These tags are required for EKS to discover subnets automatically
    "kubernetes.io/cluster/${var.project_name}-eks" = "shared"
  }
}

# ── Internet Gateway ──────────────────────────────────────────────────────────
# Allows the VPC to communicate with the internet
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# ── Public Subnets ────────────────────────────────────────────────────────────
resource "aws_subnet" "public" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  # Instances in public subnets get a public IP automatically
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-${var.availability_zones[count.index]}"
    # Required tag for EKS to use this subnet for external load balancers
    "kubernetes.io/role/elb"                                = "1"
    "kubernetes.io/cluster/${var.project_name}-eks"         = "shared"
  }
}

# ── Private Subnets ───────────────────────────────────────────────────────────
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.project_name}-private-${var.availability_zones[count.index]}"
    # Required tag for EKS to use this subnet for internal load balancers
    "kubernetes.io/role/internal-elb"                       = "1"
    "kubernetes.io/cluster/${var.project_name}-eks"         = "shared"
  }
}

# ── NAT Gateway ───────────────────────────────────────────────────────────────
# Allows private subnet resources (RDS, EKS nodes) to reach the internet
# for things like pulling Docker images — but internet cannot initiate
# connections back in.
#
# NAT Gateway costs ~$0.045/hr + $0.045/GB data processed.
# We create one (not one per AZ) to save cost for dev.
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "${var.project_name}-nat-eip"
  }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id   # NAT gateway lives in a public subnet

  tags = {
    Name = "${var.project_name}-nat"
  }

  depends_on = [aws_internet_gateway.main]
}

# ── Route Tables ──────────────────────────────────────────────────────────────
# Public route table: send all internet traffic to the Internet Gateway
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

# Associate each public subnet with the public route table
resource "aws_route_table_association" "public" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private route table: send internet-bound traffic to NAT Gateway
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-private-rt"
  }
}

# Associate each private subnet with the private route table
resource "aws_route_table_association" "private" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}