# ── VPC Peering Connection ────────────────────────────────────────────────────
# Connects VPC-A (production) to VPC-B (staging)
# Note: VPC peering is NON-TRANSITIVE
# meaning VPC-A <-> VPC-B and VPC-B <-> VPC-C does NOT allow VPC-A <-> VPC-C

resource "aws_vpc_peering_connection" "this" {
  vpc_id      = var.vpc_a_id       # requester
  peer_vpc_id = var.vpc_b_id       # accepter
  auto_accept = true               # works within same account

  tags = merge(var.tags, {
    Name = "${var.name}-peering"
    Side = "requester"
  })
}

# ── Routes in VPC-A pointing to VPC-B ────────────────────────────────────────
resource "aws_route" "vpc_a_to_vpc_b" {
  for_each = { for idx, rt in var.vpc_a_route_table_ids : idx => rt }

  route_table_id            = each.value
  destination_cidr_block    = var.vpc_b_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.this.id
}

# ── Routes in VPC-B pointing to VPC-A ────────────────────────────────────────
resource "aws_route" "vpc_b_to_vpc_a" {
  for_each = { for idx, rt in var.vpc_b_route_table_ids : idx => rt }

  route_table_id            = each.value
  destination_cidr_block    = var.vpc_a_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.this.id
}
