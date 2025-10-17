
# This file defines output variables for the Managed Instance Group (MIG) of myapp1.
# 
# Outputs:
# - myapp1_mig_id: The unique identifier for the myapp1 Managed Instance Group.
# - myapp1_mig_instance_group: The instance group associated with the myapp1 Managed Instance Group.
# - myapp1_mig_self_link: The self-link URL for the myapp1 Managed Instance Group.
# - myapp1_mig_status: The status of the myapp1 Managed Instance Group.

output "myapp1_mig_id" {
  value = google_compute_region_instance_group_manager.myapp1.id 
}

output "myapp1_mig_instance_group" {
  value = google_compute_region_instance_group_manager.myapp1.instance_group
}

output "myapp1_mig_self_link" {
  value = google_compute_region_instance_group_manager.myapp1.self_link
}

output "myapp1_mig_status" {
  value = google_compute_region_instance_group_manager.myapp1.status
}