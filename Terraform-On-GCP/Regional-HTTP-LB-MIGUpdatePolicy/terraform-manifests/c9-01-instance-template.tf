# This resource defines a regional instance template for "myapp1" in Google Cloud Platform.
# 
# Attributes:
# - name: The name of the instance template, derived from a local variable.
# - description: A brief description of the instance template.
# - tags: A list of tags for the instance, including SSH and HTTP firewall target tags.
# - instance_description: A description for the VM instances created from this template.
# - machine_type: The machine type for the VM instances, specified by a variable.
# 
# Scheduling:
# - automatic_restart: Whether the instances should automatically restart if terminated.
# - on_host_maintenance: The maintenance behavior for the instances.
# 
# Disk:
# - source_image: The source image for the boot disk, specified by a data source.
# - auto_delete: Whether the disk should be deleted when the instance is deleted.
# - boot: Indicates that this is a boot disk.
# 
# Network Interface:
# - subnetwork: The subnetwork to which the instances will be connected.
# - access_config: Configuration for external IP access.
# 
# Metadata:
# - metadata_startup_script: The startup script to be executed when the instance starts.
# - labels: Key-value pairs to label the instance.
# - metadata: Additional metadata for the instance.

resource "google_compute_region_instance_template" "myapp1_v2" {
    name = "${local.name}-myapp1-template-v2"
    description = "My App1 V2 Instance Template"
    tags        = [tolist(google_compute_firewall.fw_ssh.target_tags)[0], tolist(google_compute_firewall.fw_http.target_tags)[0], tolist(google_compute_firewall.fw_health_checks.target_tags)[0]]

    # tags        = [tolist(google_compute_firewall.fw_ssh.target_tags)[0], tolist(google_compute_firewall.fw_http.target_tags)[0]]
    instance_description = "My App1 VM Instance"
    machine_type = var.machine_type

    scheduling {
        automatic_restart = true
        on_host_maintenance = "MIGRATE"
    }

    disk {
        source_image = data.google_compute_image.my_image.self_link
        auto_delete = true
        boot = true
    }

    network_interface {
        subnetwork = google_compute_subnetwork.mysubnet.id
        # access_config {
        #   # Include this section to give the VM an external IP address
        # }
      
    }
    metadata_startup_script = file("${path.module}/v2-app1-webserver-install.sh")

    labels = {
        environment = local.environment
    }
    metadata = {
        environment = local.environment
    }
}