terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # ── Remote State Backend ────────────────────────────────────────────────────
  # Terraform state is stored in S3 instead of locally.
  # This means multiple people (or CI) can run Terraform without conflicts.
  #
  # DynamoDB provides state locking — if two people run terraform apply
  # at the same time, only one gets the lock. The other waits or errors out.
  #
  # IMPORTANT: Create the S3 bucket and DynamoDB table BEFORE running
  # terraform init. See README for bootstrap commands.
  backend "s3" {
    bucket         = "django-gitops-tfstate"      # Must be globally unique — change if taken
    key            = "dev/terraform.tfstate"       # Path inside the bucket
    region         = "us-east-1"
    encrypt        = true                          # Encrypt state at rest
    dynamodb_table = "django-gitops-tfstate-lock"  # For state locking
  }
}

provider "aws" {
  region = var.aws_region

  # Tag every resource with project and environment.
  # This makes cost tracking in AWS Cost Explorer much easier.
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ── Data Sources ──────────────────────────────────────────────────────────────
# Fetch the current AWS account ID and region — useful for building ARNs
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}