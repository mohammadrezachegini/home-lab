terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

locals {
  common_tags = {
    Project    = "multi-vpc-networking"
    ManagedBy  = "terraform"
    Owner      = var.owner
  }
}

# ── Resource Group ────────────────────────────────────────────────────────────
resource "azurerm_resource_group" "networking" {
  name     = "rg-multi-vpc-networking"
  location = var.azure_location
  tags     = local.common_tags
}

# ── VNet-A (Production) ───────────────────────────────────────────────────────
resource "azurerm_virtual_network" "vnet_a" {
  name                = "prod-vnet"
  location            = azurerm_resource_group.networking.location
  resource_group_name = azurerm_resource_group.networking.name
  address_space       = ["10.2.0.0/16"]
  tags                = merge(local.common_tags, { Environment = "production" })
}

resource "azurerm_subnet" "public_a" {
  name                 = "public-subnet"
  resource_group_name  = azurerm_resource_group.networking.name
  virtual_network_name = azurerm_virtual_network.vnet_a.name
  address_prefixes     = ["10.2.1.0/24"]
}

resource "azurerm_subnet" "private_a" {
  name                 = "private-subnet"
  resource_group_name  = azurerm_resource_group.networking.name
  virtual_network_name = azurerm_virtual_network.vnet_a.name
  address_prefixes     = ["10.2.2.0/24"]
}

resource "azurerm_subnet" "db_a" {
  name                 = "database-subnet"
  resource_group_name  = azurerm_resource_group.networking.name
  virtual_network_name = azurerm_virtual_network.vnet_a.name
  address_prefixes     = ["10.2.3.0/24"]
}

# ── NAT Gateway ───────────────────────────────────────────────────────────────
resource "azurerm_public_ip" "nat_a" {
  name                = "prod-nat-pip"
  location            = azurerm_resource_group.networking.location
  resource_group_name = azurerm_resource_group.networking.name
  allocation_method   = "Static"
  sku                 = "Standard"
  tags                = local.common_tags
}

resource "azurerm_nat_gateway" "prod" {
  name                = "prod-nat-gw"
  location            = azurerm_resource_group.networking.location
  resource_group_name = azurerm_resource_group.networking.name
  sku_name            = "Standard"
  tags                = local.common_tags
}

resource "azurerm_nat_gateway_public_ip_association" "prod" {
  nat_gateway_id       = azurerm_nat_gateway.prod.id
  public_ip_address_id = azurerm_public_ip.nat_a.id
}

resource "azurerm_subnet_nat_gateway_association" "private_a" {
  subnet_id      = azurerm_subnet.private_a.id
  nat_gateway_id = azurerm_nat_gateway.prod.id
}

# ── NSG: Public Subnet ────────────────────────────────────────────────────────
resource "azurerm_network_security_group" "public_a" {
  name                = "prod-public-nsg"
  location            = azurerm_resource_group.networking.location
  resource_group_name = azurerm_resource_group.networking.name
  tags                = local.common_tags

  security_rule {
    name                       = "allow-http"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-https"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-ssh"
    priority                   = 120
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = var.my_ip_cidr
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "public_a" {
  subnet_id                 = azurerm_subnet.public_a.id
  network_security_group_id = azurerm_network_security_group.public_a.id
}

# ── NSG: Private Subnet ───────────────────────────────────────────────────────
resource "azurerm_network_security_group" "private_a" {
  name                = "prod-private-nsg"
  location            = azurerm_resource_group.networking.location
  resource_group_name = azurerm_resource_group.networking.name
  tags                = local.common_tags

  security_rule {
    name                       = "allow-internal"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "10.0.0.0/8"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-icmp"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Icmp"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "10.0.0.0/8"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "deny-internet"
    priority                   = 200
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "private_a" {
  subnet_id                 = azurerm_subnet.private_a.id
  network_security_group_id = azurerm_network_security_group.private_a.id
}

# ── Custom Route Table ────────────────────────────────────────────────────────
resource "azurerm_route_table" "private_a" {
  name                = "prod-private-rt"
  location            = azurerm_resource_group.networking.location
  resource_group_name = azurerm_resource_group.networking.name
  tags                = local.common_tags
}

resource "azurerm_route" "private_default" {
  name                = "default-internet-via-nat"
  resource_group_name = azurerm_resource_group.networking.name
  route_table_name    = azurerm_route_table.private_a.name
  address_prefix      = "0.0.0.0/0"
  next_hop_type       = "Internet"
}

resource "azurerm_subnet_route_table_association" "private_a" {
  subnet_id      = azurerm_subnet.private_a.id
  route_table_id = azurerm_route_table.private_a.id
}

# ── VNet-B (Staging) ──────────────────────────────────────────────────────────
resource "azurerm_virtual_network" "vnet_b" {
  name                = "staging-vnet"
  location            = azurerm_resource_group.networking.location
  resource_group_name = azurerm_resource_group.networking.name
  address_space       = ["10.3.0.0/16"]
  tags                = merge(local.common_tags, { Environment = "staging" })
}

resource "azurerm_subnet" "private_b" {
  name                 = "private-subnet"
  resource_group_name  = azurerm_resource_group.networking.name
  virtual_network_name = azurerm_virtual_network.vnet_b.name
  address_prefixes     = ["10.3.1.0/24"]
}

# ── NSG: VNet-B Private Subnet ────────────────────────────────────────────────
resource "azurerm_network_security_group" "private_b" {
  name                = "staging-private-nsg"
  location            = azurerm_resource_group.networking.location
  resource_group_name = azurerm_resource_group.networking.name
  tags                = local.common_tags

  security_rule {
    name                       = "allow-internal"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "10.0.0.0/8"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-icmp"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Icmp"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "10.0.0.0/8"
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "private_b" {
  subnet_id                 = azurerm_subnet.private_b.id
  network_security_group_id = azurerm_network_security_group.private_b.id
}

# ── VNet Peering ──────────────────────────────────────────────────────────────
resource "azurerm_virtual_network_peering" "prod_to_staging" {
  name                         = "prod-to-staging"
  resource_group_name          = azurerm_resource_group.networking.name
  virtual_network_name         = azurerm_virtual_network.vnet_a.name
  remote_virtual_network_id    = azurerm_virtual_network.vnet_b.id
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
}

resource "azurerm_virtual_network_peering" "staging_to_prod" {
  name                         = "staging-to-prod"
  resource_group_name          = azurerm_resource_group.networking.name
  virtual_network_name         = azurerm_virtual_network.vnet_b.name
  remote_virtual_network_id    = azurerm_virtual_network.vnet_a.id
  allow_virtual_network_access = true
  allow_forwarded_traffic      = true
}

# ── NIC: VM-A ─────────────────────────────────────────────────────────────────
resource "azurerm_network_interface" "vm_a" {
  name                = "test-vm-a-nic"
  location            = azurerm_resource_group.networking.location
  resource_group_name = azurerm_resource_group.networking.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.private_a.id
    private_ip_address_allocation = "Dynamic"
  }
}

# ── NIC: VM-B ─────────────────────────────────────────────────────────────────
resource "azurerm_network_interface" "vm_b" {
  name                = "test-vm-b-nic"
  location            = azurerm_resource_group.networking.location
  resource_group_name = azurerm_resource_group.networking.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.private_b.id
    private_ip_address_allocation = "Dynamic"
  }
}

# ── VM-A (VNet-A Production) ──────────────────────────────────────────────────
resource "azurerm_linux_virtual_machine" "vm_a" {
  name                            = "test-vm-a"
  resource_group_name             = azurerm_resource_group.networking.name
  location                        = azurerm_resource_group.networking.location
  size                            = "Standard_D2s_v5"
  admin_username                  = "azureuser"
  disable_password_authentication = true
  network_interface_ids           = [azurerm_network_interface.vm_a.id]

  admin_ssh_key {
    username   = "azureuser"
    public_key = file(pathexpand(var.ssh_public_key_path))
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
  publisher = "Canonical"
  offer     = "0001-com-ubuntu-server-jammy"
  sku       = "22_04-lts-gen2"
  version   = "latest"
}

  tags = merge(local.common_tags, { Name = "test-vm-a" })
}

# ── VM-B (VNet-B Staging) ─────────────────────────────────────────────────────
resource "azurerm_linux_virtual_machine" "vm_b" {
  name                            = "test-vm-b"
  resource_group_name             = azurerm_resource_group.networking.name
  location                        = azurerm_resource_group.networking.location
  size                            = "Standard_D2s_v5"
  admin_username                  = "azureuser"
  disable_password_authentication = true
  network_interface_ids           = [azurerm_network_interface.vm_b.id]

  admin_ssh_key {
    username   = "azureuser"
    public_key = file(pathexpand(var.ssh_public_key_path))
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
  publisher = "Canonical"
  offer     = "0001-com-ubuntu-server-jammy"
  sku       = "22_04-lts-gen2"
  version   = "latest"
}

  tags = merge(local.common_tags, { Name = "test-vm-b" })
}

# ── Outputs ───────────────────────────────────────────────────────────────────
output "vm_a_private_ip" {
  value = azurerm_network_interface.vm_a.private_ip_address
}

output "vm_b_private_ip" {
  value = azurerm_network_interface.vm_b.private_ip_address
}
