# This Terraform configuration sets up a regional HTTP load balancer on Google Cloud Platform (GCP).
# 
# Resources:
# 
# 1. google_compute_address "mylb":
#    - Allocates a regional static IP address for the load balancer.
#    - Name: "${local.name}-mylb-regional-static-ip"
#    - Region: var.gcp_region1
# 
# 2. google_compute_region_health_check "mylb":
#    - Configures a health check for the backend service.
#    - Name: "${local.name}-mylb-myapp1-health-check"
#    - HTTP health check on port 80 with request path "/index.html"
#    - Check interval: 5 seconds
#    - Timeout: 5 seconds
#    - Healthy threshold: 2
#    - Unhealthy threshold: 2
# 
# 3. google_compute_region_backend_service "mylb":
#    - Defines a backend service for the load balancer.
#    - Name: "${local.name}-myapp1-backend-service"
#    - Protocol: HTTP
#    - Load balancing scheme: EXTERNAL_MANAGED
#    - Health checks: Uses the health check defined above
#    - Port name: "webserver"
#    - Backend group: google_compute_region_instance_group_manager.myapp1.instance_group
#    - Capacity scaler: 1.0
#    - Balancing mode: UTILIZATION
# 
# 4. google_compute_region_url_map "mylb":
#    - Creates a URL map for routing requests to the backend service.
#    - Name: "${local.name}-mylb-url-map"
#    - Default service: google_compute_region_backend_service.mylb.self_link
# 
# 5. google_compute_region_target_http_proxy "mylb":
#    - Sets up an HTTP proxy for the URL map.
#    - Name: "${local.name}-mylb-http-proxy"
#    - URL map: google_compute_region_url_map.mylb.self_link
# 
# 6. google_compute_forwarding_rule "mylb":
#    - Configures a forwarding rule to route incoming traffic to the HTTP proxy.
#    - Name: "${local.name}-mylb-forwarding-rule"
#    - Target: google_compute_region_target_http_proxy.mylb.self_link
#    - Port range: "80"
#    - IP protocol: TCP
#    - IP address: google_compute_address.mylb.address
#    - Load balancing scheme: EXTERNAL_MANAGED
#    - Network: google_compute_network.myvpc.self_link
#    - Depends on: google_compute_subnetwork.regional_proxy_subnet


resource "google_compute_address" "mylb" {
    name = "${local.name}-mylb-regional-static-ip"
    region = var.gcp_region1

}

resource "google_compute_region_health_check" "mylb" {
    name = "${local.name}-mylb-myapp1-health-check"
    check_interval_sec = 5
    timeout_sec = 5
    healthy_threshold = 2
    unhealthy_threshold = 2
    http_health_check {
        request_path = "/index.html"
        port = 80
    }
    
}

resource "google_compute_region_backend_service" "mylb" {
    name = "${local.name}-myapp1-backend-service"
    protocol = "HTTP"
    load_balancing_scheme = "EXTERNAL_MANAGED"
    health_checks = [google_compute_region_health_check.mylb.self_link]
    port_name = "webserver"

    backend {
        group = google_compute_region_instance_group_manager.myapp1.instance_group
        capacity_scaler = 1.0
        balancing_mode = "UTILIZATION"
    }
  
}

resource "google_compute_region_url_map" "mylb" {
    name = "${local.name}-mylb-url-map"
    default_service = google_compute_region_backend_service.mylb.self_link

  
}

# resource "google_compute_region_target_http_proxy" "mylb" {
#     name = "${local.name}-mylb-http-proxy"
#     url_map = google_compute_region_url_map.mylb.self_link
  
# }

resource "google_compute_region_target_https_proxy" "mylb" {
    name = "${local.name}-mylb-https-proxy"
    url_map = google_compute_region_url_map.mylb.self_link
    certificate_manager_certificates = [ google_certificate_manager_certificate.myapp1.id ]

}

resource "google_compute_forwarding_rule" "mylb" {
    name = "${local.name}-mylb-forwarding-rule"
    target = google_compute_region_target_https_proxy.mylb.self_link
    port_range = "443"
    ip_protocol = "TCP"
    ip_address = google_compute_address.mylb.address
    load_balancing_scheme = "EXTERNAL_MANAGED"
    network = google_compute_network.myvpc.self_link
    depends_on = [ google_compute_subnetwork.regional_proxy_subnet ]
  
}