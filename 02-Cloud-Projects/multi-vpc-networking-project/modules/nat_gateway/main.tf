# One NAT Gateway per AZ (high availability setup)
# Each NAT GW lives in a public subnet and serves the private subnet in the same AZ

resource "aws_eip" "nat" {
  for_each = { for idx, subnet_id in var.public_subnet_ids : idx => subnet_id }

  domain = "vpc"

  tags = merge(var.tags, {
    Name = "${var.name}-nat-eip-${each.key}"
  })
}

resource "aws_nat_gateway" "this" {
  for_each = { for idx, subnet_id in var.public_subnet_ids : idx => subnet_id }

  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = each.value

  tags = merge(var.tags, {
    Name = "${var.name}-nat-gw-${each.key}"
  })

  depends_on = [aws_eip.nat]
}

# Add default route in each private route table pointing to NAT GW in same AZ
resource "aws_route" "private_nat" {
  for_each = var.private_route_table_ids

  route_table_id         = each.value
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this[each.key].id
}
