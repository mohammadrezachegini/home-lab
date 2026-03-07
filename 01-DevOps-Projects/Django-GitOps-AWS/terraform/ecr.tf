# ── ECR Repository ────────────────────────────────────────────────────────────
# ECR is AWS's private Docker registry.
# The CI pipeline (Phase 5) will push images here.
# EKS nodes pull from here when deploying new versions.

resource "aws_ecr_repository" "django_api" {
  name                 = "${var.project_name}/django-api"
  image_tag_mutability = "MUTABLE"    # Allows overwriting tags like "latest"

  # Scan images for vulnerabilities on every push
  image_scanning_configuration {
    scan_on_push = true
  }

  # Encrypt images at rest
  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "${var.project_name}-django-api"
  }
}

# ── ECR Lifecycle Policy ──────────────────────────────────────────────────────
# Automatically delete old images to save storage costs.
# Keep the last 10 tagged images, delete untagged images after 1 day.
resource "aws_ecr_lifecycle_policy" "django_api" {
  repository = aws_ecr_repository.django_api.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Delete untagged images after 1 day"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Keep last 10 tagged images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v", "sha-"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}