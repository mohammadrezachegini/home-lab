resource "google_compute_firewall" "fw_ssh" {
    name = "${local.name}-fwrule-allow-ssh22"
    allow {
        protocol = "tcp"
        ports = ["22"]
    }
    direction = "INGRESS"
    network = google_compute_network.myvpc.id
    priority = 1000
    source_ranges = ["0.0.0.0/0"]
    target_tags = ["ssh-tag"]
  
}


resource "google_compute_firewall" "fw_http" {
    name = "${local.name}-fwrule-allow-http80"
    allow {
        protocol = "tcp"
        ports = ["80"]
    }
    direction = "INGRESS"
    network = google_compute_network.myvpc.id
    priority = 1000
    source_ranges = ["0.0.0.0/0"]
    target_tags = ["webserver-tag"]
  
}