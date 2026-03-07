# Multi-Cloud VPC Networking Project

A hands-on multi-cloud networking project built with Terraform. Provisions real infrastructure across AWS, GCP, and Azure — including VPC peering, site-to-site VPN to a physical home lab, NAT gateways, security groups, and network ACLs.

---

## What I Built

```
Home Lab (Minisforum UM773 Lite)
    └── IPsec VPN (strongSwan)
          └── AWS VPC-A — Production (172.16.0.0/16)
                ├── Public Subnets  (172.16.1.0/24, 172.16.2.0/24)
                ├── Private Subnets (172.16.3.0/24, 172.16.4.0/24)
                ├── DB Subnets      (172.16.5.0/24, 172.16.6.0/24)
                └── VPC Peering
                      └── AWS VPC-B — Staging (172.18.0.0/16)

GCP VPC-A — Production (10.10.0.0/16)
    └── VPC Peering
          └── GCP VPC-B — Staging (10.20.0.0/16)

Azure VNet-A — Production (10.2.0.0/16)
    └── VNet Peering
          └── Azure VNet-B — Staging (10.3.0.0/16)
```

---

## Project Structure

```
terraform/
├── modules/
│   ├── vpc/              # AWS VPC + Internet Gateway
│   ├── subnets/          # Public, private, DB subnets + route tables
│   ├── nat_gateway/      # NAT Gateways (one per AZ for HA)
│   ├── security_groups/  # Web/app/db tier SGs + NACLs
│   └── vpc_peering/      # VPC peering connection + routes
├── aws/
│   ├── main.tf           # VPC-A (prod) + VPC-B (staging) + peering
│   ├── vpn.tf            # Site-to-site VPN to home lab
│   ├── variables.tf
│   ├── outputs.tf
│   └── terraform.tfvars.example
├── gcp/
│   └── main.tf           # VPC, Cloud NAT, Firewall Rules, VPC Peering
└── azure/
    └── main.tf           # VNet, NSG, NAT Gateway, Route Tables, VNet Peering

on-prem-vpn/
├── setup-strongswan.sh   # strongSwan install + config script
└── TESTING.md            # Testing and troubleshooting guide
```

---

## IP Addressing Plan

| Cloud | Environment | CIDR |
|-------|-------------|------|
| AWS | Production VPC-A | 172.16.0.0/16 |
| AWS | Staging VPC-B | 172.18.0.0/16 |
| GCP | Production VPC-A | 10.10.0.0/16 |
| GCP | Staging VPC-B | 10.20.0.0/16 |
| Azure | Production VNet-A | 10.2.0.0/16 |
| Azure | Staging VNet-B | 10.3.0.0/16 |
| On-Prem | Home Lab (Minisforum) | 10.0.0.0/24 |

> Note: AWS VPCs use 172.16.x.x range to avoid CIDR conflict with the home lab network (10.0.0.0/24).

---

## Phases

### Phase 1 — AWS VPC Architecture
Built reusable Terraform modules for a multi-tier VPC:
- Public subnets with Internet Gateway and route tables
- Private subnets with NAT Gateways (one per AZ for high availability)
- DB subnets with no internet access
- Security groups per tier (web, app, db) with least-privilege rules
- NACLs as a stateless second layer of defense

### Phase 2 — AWS VPC Peering
- Created VPC-B (staging) with identical structure to VPC-A
- Set up VPC peering connection between production and staging
- Updated route tables on both sides to allow cross-VPC traffic
- Verified connectivity: EC2 in VPC-A can ping EC2 in VPC-B

### Phase 3 — Site-to-Site VPN (AWS ↔ Home Lab)
- Created Customer Gateway pointing to home lab public IP
- Created Virtual Private Gateway attached to VPC-A
- Configured static routes for home lab CIDR
- Installed and configured strongSwan on Minisforum UM773 Lite
- Verified: Minisforum can ping EC2 instances in AWS private subnets

### Phase 4 — GCP VPC
- Created custom-mode VPC (auto-mode disabled for explicit control)
- Configured Cloud Router + Cloud NAT for private subnet internet access
- Wrote firewall rules per tier (HTTP, SSH, internal, ICMP)
- Set up bidirectional VPC peering between prod and staging
- Verified connectivity via GCP IAP SSH tunnel

### Phase 5 — Azure VNet
- Created VNet with public, private, and database subnets
- Configured NAT Gateway for private subnet outbound traffic
- Applied NSGs per subnet with explicit allow/deny rules
- Added custom route tables for traffic control
- Set up bidirectional VNet peering between prod and staging
- Verified connectivity using Azure Run Command

---

## How to Deploy

### Prerequisites
```bash
# Terraform >= 1.5
terraform --version

# AWS CLI
aws configure

# GCP CLI
gcloud auth application-default login

# Azure CLI
az login
```

### AWS (Phase 1-3)
```bash
cd terraform/aws
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

terraform init
terraform plan
terraform apply

# Verify outputs
terraform output
```

### GCP (Phase 4)
```bash
cd terraform/gcp
# Create terraform.tfvars:
# gcp_project_id = "your-project-id"
# my_ip_cidr     = "your.ip/32"

terraform init
terraform apply
```

### Azure (Phase 5)
```bash
cd terraform/azure
# Create terraform.tfvars:
# my_ip_cidr = "your.ip/32"

terraform init
terraform apply
```

### On-Prem VPN (Phase 3 — Minisforum side)
```bash
# After AWS apply, download VPN config from AWS Console:
# VPC → Site-to-Site VPN → Download Config → Generic

# Edit setup-strongswan.sh with your values, then run:
chmod +x on-prem-vpn/setup-strongswan.sh
./on-prem-vpn/setup-strongswan.sh

# Verify tunnel is UP:
sudo ipsec status
```

### Destroy (always run after testing!)
```bash
terraform destroy -auto-approve
```

---

## Real Issues I Ran Into

**CIDR conflict between home lab and AWS**
My home network uses `10.0.0.0/24` which conflicted with AWS VPC-A `10.0.0.0/16`. Had to redesign AWS CIDRs to use `172.16.0.0/16` range.

**Terraform `for_each` with unknown values**
Using `toset()` on route table IDs from module outputs fails at plan time because IDs are not known until apply. Fixed by using `{ for idx, rt in var.list : idx => rt }` pattern instead.

**NACLs blocking cross-VPC ping**
Private subnet NACLs only allowed traffic from local VPC CIDR. Added rule 90 to allow `172.16.0.0/12` (covers all peered VPCs) before rule 100.

**Azure VM size availability**
`Standard_B1s` and most B-series VMs unavailable in eastus subscription. Used `Standard_D2s_v5` with Gen2 Ubuntu image instead.

**GCP VPC peering needs bidirectional setup**
Unlike AWS (single peering connection with `auto_accept`), both GCP and Azure require explicit peering resources on each side. Missing one side = no connectivity.

**strongSwan tunnel UP but ping failing**
Tunnel was ESTABLISHED but ICMP still blocked. Root cause: security group missing ICMP rule + private NACL blocking cross-VPC traffic. Fixed both.

---

## Key Concepts

**Security Groups vs NACLs**
Security Groups are stateful — return traffic is automatically allowed. NACLs are stateless — you must explicitly allow both directions. SGs are the primary firewall; NACLs are a second layer applied at subnet level.

**VPC Peering is non-transitive**
If VPC-A peers with VPC-B, and VPC-B peers with VPC-C, VPC-A cannot reach VPC-C. Each pair needs its own peering connection.

**NAT Gateway placement**
NAT Gateways live in public subnets and serve private subnets. For high availability, deploy one per AZ — each private subnet routes to the NAT GW in its own AZ.

**Cloud differences**
GCP VPCs are global (subnets are regional). AWS and Azure VPCs/VNets are regional. GCP and Azure both require bidirectional peering setup. Azure VPN Gateway is the most expensive (~$0.19/hr vs AWS $0.05/hr).

---

Always run `terraform destroy` after testing!

---



## Author

**Reza Chegini** — DevOps / Cloud Engineer  
[GitHub](https://github.com/mohammadrezachegini) | Root Access Newsletter