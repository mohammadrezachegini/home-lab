output "web_sg_id" {
  description = "ID of the web tier security group"
  value       = aws_security_group.web.id
}

output "app_sg_id" {
  description = "ID of the app tier security group"
  value       = aws_security_group.app.id
}

output "db_sg_id" {
  description = "ID of the database tier security group"
  value       = aws_security_group.db.id
}
