
module "ec2_private" {
    depends_on = [ module.vpc ]

    source  = "terraform-aws-modules/ec2-instance/aws"
    version = "5.7.0"
    name = "${var.environment}-vm"
    ami = data.aws_ami.amzlinux2.id
    instance_type = var.instance_type
    key_name = var.instance_keypair
    # count = var.private_instance_count
    # subnet_id = module.vpc.private_subnets[count.index]
    for_each = toset(["0", "1"])
    subnet_id =  element(module.vpc.private_subnets, tonumber(each.key))
    vpc_security_group_ids = [module.private_sg.security_group_id]
    user_data = file("${path.module}/app1-install.sh")
    # user_data = file("app1-install.sh")

    tags = local.common_tags
  
}