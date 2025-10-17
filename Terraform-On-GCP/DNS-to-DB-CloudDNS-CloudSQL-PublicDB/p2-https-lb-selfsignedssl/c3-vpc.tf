# This Terraform configuration file defines resources for a Google Cloud Platform (GCP) Virtual Private Cloud (VPC) network and its associated subnetworks.

# Resource: google_compute_network
# - Creates a VPC network with a specified name.
# - The 'auto_create_subnetworks' attribute is set to false, meaning that subnetworks will not be automatically created.

# Resource: google_compute_subnetwork (mysubnet)
# - Creates a subnetwork within the specified VPC network.
# - The subnetwork is defined with a specific IP CIDR range and is associated with a particular region.

# Resource: google_compute_subnetwork (regional_proxy_subnet)
# - Creates a regional proxy subnetwork within the specified VPC network.
# - The subnetwork is defined with a specific IP CIDR range and is associated with a particular region.
# - The 'purpose' attribute is set to "REGIONAL_MANAGED_PROXY" and the 'role' attribute is set to "ACTIVE", indicating its use for regional managed proxy services.

resource "google_compute_network" "myvpc" {
    name = "${local.name}-vpc"
    auto_create_subnetworks = false
  
}

resource "google_compute_subnetwork" "mysubnet" {
    name = "${var.gcp_region1}-subnet"
    region = var.gcp_region1
    ip_cidr_range = "10.128.0.0/24"
    network = google_compute_network.myvpc.id
  
}

resource "google_compute_subnetwork" "regional_proxy_subnet" {
  
  name = "${var.gcp_region1}-regional-proxy-subnet"
  region = var.gcp_region1
  ip_cidr_range = "10.0.0.0/24"
  network = google_compute_network.myvpc.id
  purpose = "REGIONAL_MANAGED_PROXY"
  role = "ACTIVE"
}