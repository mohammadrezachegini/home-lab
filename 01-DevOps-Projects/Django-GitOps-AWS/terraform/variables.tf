variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Used as a prefix for all resource names"
  type        = string
  default     = "django-gitops"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# ── VPC ───────────────────────────────────────────────────────────────────────
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "AZs to deploy subnets into. EKS requires at least 2."
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

# ── EKS ───────────────────────────────────────────────────────────────────────
variable "eks_cluster_version" {
  description = "Kubernetes version for EKS"
  type        = string
  default     = "1.31"
}

variable "eks_node_instance_type" {
  description = "EC2 instance type for EKS worker nodes"
  type        = string
  default     = "t3.medium"   # 2 vCPU, 4GB RAM — cheapest that runs K8s comfortably
}

variable "eks_node_min" {
  description = "Minimum number of worker nodes"
  type        = number
  default     = 1
}

variable "eks_node_max" {
  description = "Maximum number of worker nodes"
  type        = number
  default     = 3
}

variable "eks_node_desired" {
  description = "Desired number of worker nodes"
  type        = number
  default     = 2
}

# ── RDS ───────────────────────────────────────────────────────────────────────
variable "rds_instance_class" {
  description = "RDS instance type"
  type        = string
  default     = "db.t3.micro"   # Cheapest RDS instance
}

variable "rds_db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "blogdb"
}

variable "rds_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "bloguser"
}

variable "rds_password" {
  description = "PostgreSQL master password — pass via TF_VAR_rds_password env var, never hardcode"
  type        = string
  sensitive   = true   # Terraform will never print this in logs
}

variable "rds_allocated_storage" {
  description = "Storage in GB for RDS"
  type        = number
  default     = 20
}