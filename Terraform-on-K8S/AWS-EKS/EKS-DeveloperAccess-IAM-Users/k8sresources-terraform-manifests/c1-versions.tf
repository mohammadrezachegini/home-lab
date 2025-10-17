# Terraform Settings Block
terraform {
  required_version = ">= 1.9.0"
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = ">= 5.74"
    }
    kubernetes = {
      source = "hashicorp/kubernetes"
      version = ">= 2.33"
    }    
  }

  backend "s3" {
    bucket = "terraform-on-aws-eks-381492238320"
    key    = "dev/app1k8s/terraform.tfstate"
    region = "us-east-1" 

    # For State Locking
    dynamodb_table = "dev-app1k8s"    
  }     
}