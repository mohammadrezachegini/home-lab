variable "instance_type" {
    description = "EC2 instance type"
    type = string
    default = "t2.micro"
  
} 

variable "instance_keypair" {
    description = "AWS EC2 instance key pair"
    type = string
    default = "terraform-key"  
}

variable "private_instance_count" {
    description = "AWS private instance count"
    type = number
    default = 1
  
}