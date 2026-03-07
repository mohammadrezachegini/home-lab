# outputs.tf
# These values are printed after terraform apply.
# The CI pipeline uses these to know where to push images and configure kubectl.

output "eks_cluster_name" {
  description = "EKS cluster name — used in aws eks update-kubeconfig"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "EKS API server endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "eks_cluster_certificate" {
  description = "Base64 encoded certificate for kubectl authentication"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "rds_endpoint" {
  description = "RDS connection endpoint — used as DB_HOST in Django settings"
  value       = aws_db_instance.postgres.address
}

output "rds_port" {
  description = "RDS port"
  value       = aws_db_instance.postgres.port
}

output "ecr_repository_url" {
  description = "ECR URL — used in CI to push images and in K8s manifests"
  value       = aws_ecr_repository.django_api.repository_url
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}