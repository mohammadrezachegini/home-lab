variable "aws_region" {
  description = "AWS region to deploy the resources"
  type = string
  default = "us-east-1"
  
}

variable "environment" {
    description = "Environment variable used as a prefix for the resources"
    type = string
    default = "dev"
  
}

variable "business_division" {
    description = "Business division to which the resources belong"
    type = string
    default = "sap"
  
}