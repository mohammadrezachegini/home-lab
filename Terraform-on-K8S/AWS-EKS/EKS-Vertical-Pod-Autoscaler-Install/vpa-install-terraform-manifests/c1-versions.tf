terraform {
  required_version = ">= 1.6.0"
  required_providers {
    null = {
      source = "hashicorp/null"
      version = "3.2.3"
    }
  }
  # Adding Backend as S3 for Remote State Storage
  backend "s3" {
    bucket = "terraform-on-aws-eks-381492238320"
    key    = "dev/eks-vpa-install/terraform.tfstate"
    region = "us-east-1" 
 

    # For State Locking
    dynamodb_table = "dev-eks-vpa-install"    
  }     
}

