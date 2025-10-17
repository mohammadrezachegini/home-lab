resource "null_resource" "name" {
  
    depends_on = [ module.ec2_public ]

    connection {
        type        = "ssh"
        host        = aws_eip.bastion_eip.public_ip
        user        = "ec2-user"
        private_key = file("private-key/terraform-key.pem")
    }

    provisioner "file" {
        source      = "private-key/terraform-key.pem"
        destination = "/home/ec2-user/terraform-key.pem"
    }

    provisioner "remote-exec" {
        inline = [ 
            "sudo chmod 400 /home/ec2-user/terraform-key.pem",
            "echo VPC created on `date` and VPC ID: ${module.vpc.vpc_id} >> creation-time-vpc-id.txt"
        ]
    }
}
