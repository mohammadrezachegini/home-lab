# Terraform Settings Block
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "5.74.0"
     }
    helm = {
      source = "hashicorp/helm"
      version = "2.16.1"
    }
    http = {
      source = "hashicorp/http"
      #version = "2.1.0"
      #version = "~> 2.1"
      version = "3.4.5"    
      }
    kubernetes = {
      source = "hashicorp/kubernetes"
      version = "2.33.0"
    }     
  }
  # Adding Backend as S3 for Remote State Storage
  backend "s3" {
    bucket = "terraform-on-aws-eks-381492238320"
    key    = "dev/efs-csi/terraform.tfstate"
    region = "us-east-1" 
 

    # For State Locking
    dynamodb_table = "dev-efs-csi"    
  }     
}

# Terraform AWS Provider Block
provider "aws" {
  region = var.aws_region
}

# Terraform HTTP Provider Block
provider "http" {
  # Configuration options
}