data "terraform_remote_state" "cloudsql_publicdb" {
  backend = "gcs"
  config = {
    bucket = "terraform-gcp-438417-tfstate"
    prefix = "cloudsql/publicdb"
  }
}


output "vpc_id" {
  description = "VPC ID"
  value = data.terraform_remote_state.project1.outputs.vpc_id
}

output "mysubnet_id" {
  description = "Subnet ID"
  value = data.terraform_remote_state.project1.outputs.mysubnet_id
}

output "cloudsql_privatedb" {
  description = "Cloud SQL Database Private IP"
  value = data.terraform_remote_state.project1.outputs.cloudsql_db_private_ip
}