# ─────────────────────────────────────────────────────────────────────────────
# Phase 3 — Site-to-Site VPN
# AWS VPC-A <──VPN──> On-Prem (Minisforum home lab)
# ─────────────────────────────────────────────────────────────────────────────

# ── Customer Gateway ──────────────────────────────────────────────────────────
resource "aws_customer_gateway" "home_lab" {
  bgp_asn    = 65000
  ip_address = var.home_lab_public_ip
  type       = "ipsec.1"

  tags = {
    Name    = "home-lab-cgw"
    Project = "multi-vpc-networking"
  }
}

# ── Virtual Private Gateway ───────────────────────────────────────────────────
resource "aws_vpn_gateway" "vgw" {
  vpc_id          = module.vpc_a.vpc_id
  amazon_side_asn = 64512

  tags = {
    Name    = "prod-vgw"
    Project = "multi-vpc-networking"
  }
}

# ── VPN Connection ────────────────────────────────────────────────────────────
resource "aws_vpn_connection" "home_lab" {
  vpn_gateway_id      = aws_vpn_gateway.vgw.id
  customer_gateway_id = aws_customer_gateway.home_lab.id
  type                = "ipsec.1"
  static_routes_only  = true

  tags = {
    Name    = "prod-to-home-lab-vpn"
    Project = "multi-vpc-networking"
  }
}

# ── Static Route: AWS → home lab ──────────────────────────────────────────────
resource "aws_vpn_connection_route" "home_lab" {
  vpn_connection_id      = aws_vpn_connection.home_lab.id
  destination_cidr_block = var.home_lab_cidr
}

# ── Route Table: private subnets → VGW for home lab traffic ──────────────────
resource "aws_route" "private_to_vpn" {
  for_each = module.subnets_a.private_route_table_ids

  route_table_id         = each.value
  destination_cidr_block = var.home_lab_cidr
  gateway_id             = aws_vpn_gateway.vgw.id
}

# ── VGW Route Propagation ─────────────────────────────────────────────────────
resource "aws_vpn_gateway_route_propagation" "private" {
  for_each = module.subnets_a.private_route_table_ids

  vpn_gateway_id = aws_vpn_gateway.vgw.id
  route_table_id = each.value
}
