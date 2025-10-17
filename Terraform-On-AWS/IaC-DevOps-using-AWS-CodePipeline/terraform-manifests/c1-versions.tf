terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "5.70.0"
    }
    null = {
      source = "hashicorp/null"
      version = "~> 3.0"
    }

    random = {
      source = "hashicorp/random"
      version = "~> 3.0"
    }   
  }
  backend "s3"{}

}


provider "aws" {
    region = var.aws_region
    profile = "default"
  
}

resource "random_pet" "this" {
  length = 2
  
  
}