resource "aws_eip" "bastion_eip" {

    depends_on = [ module.vpc, module.ec2_public ]
    instance = module.ec2_public.id
    domain   = "vpc"
    tags = local.common_tags

    # provisioner "local-exec" {
    #     command = "echo Destroy time prov `date` >> destroy-time-prov.txt"
    #     working_dir = "local-exec-output-files/"
    #     when = destroy
      
    # }
}