module "acm" {

    source  = "terraform-aws-modules/acm/aws"
    version = "5.1.0"

    domain_name  = trimsuffix(data.aws_route53_zone.mydomain.name, ".")
    zone_id      = data.aws_route53_zone.mydomain.zone_id 

    subject_alternative_names = [
        "*.rezaops.com"
    ]
    tags = local.common_tags

    validation_method = "DNS"
    wait_for_validation = true


}

# Output ACM Certificate ARN

output "acm_certificate_arn" {
  description = "The ARN of the certificate"
  # Module Upgrade Change-2  
  #value       = module.acm.this_acm_certificate_arn
  value       = module.acm.acm_certificate_arn
}