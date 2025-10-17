resource "google_compute_region_instance_group_manager" "myapp1" {
  name = "${local.name}-myapp1-mig"
  base_instance_name = "${local.name}-myapp1"
  region = var.gcp_region1
  distribution_policy_zones = data.google_compute_zones.available.names

  version {
    instance_template = google_compute_region_instance_template.myapp1.id
    # instance_template = google_compute_region_instance_template.myapp1_v2.id

  }

  named_port {
    name = "webserver"
    port = 80
  }

  #autoscaling
  auto_healing_policies {
    health_check = google_compute_region_health_check.myapp1.id
    initial_delay_sec = 300
  }

  update_policy {
    type = "PROACTIVE"
    instance_redistribution_type = "PROACTIVE"
    minimal_action = "REPLACE"
    most_disruptive_allowed_action = "REPLACE"
    max_surge_fixed = length(data.google_compute_zones.available.names)
    max_unavailable_fixed = length(data.google_compute_zones.available.names)
    replacement_method = "SUBSTITUTE"
  }
  
}