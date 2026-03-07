locals {
  # Flatten subnet definitions for easier iteration
  public_subnets  = { for idx, s in var.public_subnets : idx => s }
  private_subnets = { for idx, s in var.private_subnets : idx => s }
  db_subnets      = { for idx, s in var.db_subnets : idx => s }
}

# ── Public Subnets ────────────────────────────────────────────────────────────
resource "aws_subnet" "public" {
  for_each = local.public_subnets

  vpc_id                  = var.vpc_id
  cidr_block              = each.value.cidr
  availability_zone       = each.value.az
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.name}-public-${each.key}"
    Tier = "public"
  })
}

# ── Private Subnets ───────────────────────────────────────────────────────────
resource "aws_subnet" "private" {
  for_each = local.private_subnets

  vpc_id            = var.vpc_id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az

  tags = merge(var.tags, {
    Name = "${var.name}-private-${each.key}"
    Tier = "private"
  })
}

# ── DB Subnets ────────────────────────────────────────────────────────────────
resource "aws_subnet" "db" {
  for_each = local.db_subnets

  vpc_id            = var.vpc_id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az

  tags = merge(var.tags, {
    Name = "${var.name}-db-${each.key}"
    Tier = "database"
  })
}

# ── Route Table: Public ───────────────────────────────────────────────────────
resource "aws_route_table" "public" {
  vpc_id = var.vpc_id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = var.igw_id
  }

  tags = merge(var.tags, {
    Name = "${var.name}-public-rt"
  })
}

resource "aws_route_table_association" "public" {
  for_each = local.public_subnets

  subnet_id      = aws_subnet.public[each.key].id
  route_table_id = aws_route_table.public.id
}

# ── Route Table: Private (one per AZ, uses NAT GW in same AZ) ────────────────
resource "aws_route_table" "private" {
  for_each = local.private_subnets

  vpc_id = var.vpc_id

  tags = merge(var.tags, {
    Name = "${var.name}-private-rt-${each.key}"
  })
}

resource "aws_route_table_association" "private" {
  for_each = local.private_subnets

  subnet_id      = aws_subnet.private[each.key].id
  route_table_id = aws_route_table.private[each.key].id
}

# ── Route Table: DB (no internet access) ─────────────────────────────────────
resource "aws_route_table" "db" {
  vpc_id = var.vpc_id

  tags = merge(var.tags, {
    Name = "${var.name}-db-rt"
  })
}

resource "aws_route_table_association" "db" {
  for_each = local.db_subnets

  subnet_id      = aws_subnet.db[each.key].id
  route_table_id = aws_route_table.db.id
}
