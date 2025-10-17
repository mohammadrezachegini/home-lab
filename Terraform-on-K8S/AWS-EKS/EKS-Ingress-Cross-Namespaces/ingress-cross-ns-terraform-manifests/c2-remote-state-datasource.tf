# # Terraform Remote State Datasource
# data "terraform_remote_state" "eks" {
#   backend = "local"
#   config = {
#     path = "../../AWS-EKS-Cluster-Basics/ekscluster-terraform-manifests/terraform.tfstate"
#    }
# }


data "terraform_remote_state" "eks" {
  backend = "s3"
  config = {
    bucket = "terraform-on-aws-eks-381492238320"
    key    = "dev/eks-cluster/terraform.tfstate"
    region = "us-east-1" 
  }
}