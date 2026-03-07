# ── RDS Security Group ────────────────────────────────────────────────────────
# Only allow PostgreSQL traffic from EKS worker nodes
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "Allow PostgreSQL access from EKS nodes only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from EKS nodes"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  # No direct internet access — RDS is private only
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-rds-sg"
  }
}

# ── RDS Subnet Group ──────────────────────────────────────────────────────────
# RDS requires a subnet group — tells it which subnets it can use.
# We use private subnets so RDS is never internet-facing.
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-rds-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-rds-subnet-group"
  }
}

# ── RDS PostgreSQL Instance ───────────────────────────────────────────────────
resource "aws_db_instance" "postgres" {
  identifier = "${var.project_name}-postgres"

  # Engine
  engine         = "postgres"
  engine_version = "15.12"
  instance_class = var.rds_instance_class

  # Storage
  allocated_storage     = var.rds_allocated_storage
  storage_type          = "gp2"
  storage_encrypted     = true    # Always encrypt RDS storage

  # Database
  db_name  = var.rds_db_name
  username = var.rds_username
  password = var.rds_password    # Comes from TF_VAR_rds_password env var

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false   # Never expose RDS to the internet

  # Availability
  multi_az               = false   # Set to true for prod (costs 2x)
  availability_zone      = var.availability_zones[0]

  # Backups
  backup_retention_period = 7      # Keep 7 days of automated backups
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # Protection
  # Set to true in prod to prevent accidental deletion
  deletion_protection = false
  skip_final_snapshot = true     # Set to false in prod

  tags = {
    Name = "${var.project_name}-postgres"
  }
}