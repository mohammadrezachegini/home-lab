terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

locals {
  common_labels = {
    project    = "multi-vpc-networking"
    managed_by = "terraform"
    owner      = var.owner
  }
}

# ── VPC-A (Production) ────────────────────────────────────────────────────────
# GCP VPCs are global (not region-specific like AWS)
# We use custom mode so subnets are explicitly defined
resource "google_compute_network" "vpc_a" {
  name                    = "prod-vpc"
  auto_create_subnetworks = false   # custom mode - we define subnets manually
  routing_mode            = "REGIONAL"
}

resource "google_compute_subnetwork" "public_a" {
  name          = "prod-public-subnet"
  ip_cidr_range = "10.10.0.0/24"
  region        = var.gcp_region
  network       = google_compute_network.vpc_a.id

  # Enable private Google access (allows VMs without external IPs to reach GCP APIs)
  private_ip_google_access = true
}

resource "google_compute_subnetwork" "private_a" {
  name          = "prod-private-subnet"
  ip_cidr_range = "10.10.1.0/24"
  region        = var.gcp_region
  network       = google_compute_network.vpc_a.id

  private_ip_google_access = true
}

# ── Cloud Router ──────────────────────────────────────────────────────────────
# Required for Cloud NAT - handles the BGP/routing
resource "google_compute_router" "prod" {
  name    = "prod-router"
  region  = var.gcp_region
  network = google_compute_network.vpc_a.id
}

# ── Cloud NAT ─────────────────────────────────────────────────────────────────
# Allows VMs in private subnet to reach internet without external IPs
# GCP equivalent of AWS NAT Gateway
resource "google_compute_router_nat" "prod" {
  name                               = "prod-cloud-nat"
  router                             = google_compute_router.prod.name
  region                             = var.gcp_region
  nat_ip_allocate_option             = "AUTO_ONLY"       # GCP manages the IPs
  source_subnetwork_ip_ranges_to_nat = "LIST_OF_SUBNETWORKS"

  subnetwork {
    name                    = google_compute_subnetwork.private_a.id
    source_ip_ranges_to_nat = ["ALL_IP_RANGES"]
  }

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# ── Firewall Rules ────────────────────────────────────────────────────────────
# GCP firewall rules are applied at VPC level (not subnet level)
# They're stateful like AWS Security Groups

# Allow HTTP/HTTPS from internet to public subnet instances
resource "google_compute_firewall" "allow_http" {
  name    = "prod-allow-http"
  network = google_compute_network.vpc_a.name

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["web-server"]   # only applies to VMs with this tag
}

# Allow SSH from your IP only
resource "google_compute_firewall" "allow_ssh" {
  name    = "prod-allow-ssh"
  network = google_compute_network.vpc_a.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = [var.my_ip_cidr]
}

resource "google_compute_firewall" "allow_iap" {
  name    = "prod-allow-iap"
  network = google_compute_network.vpc_a.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["35.235.240.0/20"]
}

resource "google_compute_firewall" "allow_icmp_peering" {
  name    = "prod-allow-icmp-peering"
  network = google_compute_network.vpc_a.name

  allow {
    protocol = "icmp"
  }

  source_ranges = ["10.20.0.0/24"]  # VPC-B subnet
}

resource "google_compute_firewall" "allow_icmp_peering_b" {
  name    = "staging-allow-icmp-peering"
  network = google_compute_network.vpc_b.name

  allow {
    protocol = "icmp"
  }

  source_ranges = ["10.10.0.0/24", "10.10.1.0/24"]  # VPC-A subnets
}


# Allow all internal traffic within the VPC
resource "google_compute_firewall" "allow_internal" {
  name    = "prod-allow-internal"
  network = google_compute_network.vpc_a.name

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }
  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }
  allow {
    protocol = "icmp"
  }

  source_ranges = ["10.10.0.0/16"]
}

# Deny all other ingress (explicit deny - GCP default is deny anyway)
resource "google_compute_firewall" "deny_all_ingress" {
  name     = "prod-deny-all-ingress"
  network  = google_compute_network.vpc_a.name
  priority = 65534

  deny {
    protocol = "all"
  }

  source_ranges = ["0.0.0.0/0"]
}

# ── VPC-B (Staging) ───────────────────────────────────────────────────────────
resource "google_compute_network" "vpc_b" {
  name                    = "staging-vpc"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
}

resource "google_compute_subnetwork" "private_b" {
  name                     = "staging-private-subnet"
  ip_cidr_range            = "10.20.0.0/24"
  region                   = var.gcp_region
  network                  = google_compute_network.vpc_b.id
  private_ip_google_access = true
}

# ── VPC Peering: Production <-> Staging ──────────────────────────────────────
# GCP VPC peering must be set up on BOTH sides
resource "google_compute_network_peering" "prod_to_staging" {
  name         = "prod-to-staging"
  network      = google_compute_network.vpc_a.self_link
  peer_network = google_compute_network.vpc_b.self_link
}

resource "google_compute_network_peering" "staging_to_prod" {
  name         = "staging-to-prod"
  network      = google_compute_network.vpc_b.self_link
  peer_network = google_compute_network.vpc_a.self_link

  depends_on = [google_compute_network_peering.prod_to_staging]
}

# ── Test VMs ──────────────────────────────────────────────────────────────────
resource "google_compute_instance" "test_vpc_a" {
  name         = "test-vpc-a"
  machine_type = "e2-micro"
  zone         = "${var.gcp_region}-a"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
    }
  }

  network_interface {
    network    = google_compute_network.vpc_a.id
    subnetwork = google_compute_subnetwork.private_a.id
    # No access_config = no external IP (private VM using Cloud NAT)
  }

  tags = ["internal"]

  labels = local.common_labels
}

resource "google_compute_instance" "test_vpc_b" {
  name         = "test-vpc-b"
  machine_type = "e2-micro"
  zone         = "${var.gcp_region}-a"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
    }
  }

  network_interface {
    network    = google_compute_network.vpc_b.id
    subnetwork = google_compute_subnetwork.private_b.id
  }

  tags = ["internal"]

  labels = local.common_labels
}
