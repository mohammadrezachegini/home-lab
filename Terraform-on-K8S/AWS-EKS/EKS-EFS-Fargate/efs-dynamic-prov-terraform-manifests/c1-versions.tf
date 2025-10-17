# Terraform Settings Block
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "5.74.0"
     }
    kubernetes = {
      source = "hashicorp/kubernetes"
      version = "2.33.0"
    }     
  }
  # Adding Backend as S3 for Remote State Storage
  backend "s3" {
    bucket = "terraform-on-aws-eks-381492238320"
    key    = "dev/efs-sampleapp-demo/terraform.tfstate"
    region = "us-east-1" 
 

    # For State Locking
    dynamodb_table = "dev-efs-sampleapp-demo"    
  }     
}
