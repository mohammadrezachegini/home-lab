#!/bin/bash
# =============================================================================
# strongSwan VPN Setup Script for Minisforum UM773 Lite (On-Prem Side)
# =============================================================================
# Run this AFTER you have:
# 1. Applied the AWS VPN Terraform (terraform apply in terraform/aws/)
# 2. Downloaded the VPN config from AWS Console:
#    VPC → Site-to-Site VPN → Select your VPN → Download Config
#    Choose: Vendor: strongSwan, Platform: Ubuntu
# 3. Opened the downloaded config and noted:
#    - Tunnel 1 Outside IP (AWS side)
#    - Tunnel 1 Pre-Shared Key
#    - Tunnel 1 Inside IPs
# =============================================================================

set -e

echo "=== Installing strongSwan ==="
sudo apt-get update -y
sudo apt-get install -y strongswan strongswan-pki libcharon-extra-plugins

echo "=== Enabling IP forwarding ==="
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf

# =============================================================================
# Fill these values from your downloaded AWS VPN config file
# =============================================================================
AWS_TUNNEL1_OUTSIDE_IP="REPLACE_WITH_TUNNEL1_OUTSIDE_IP"   # from AWS config
AWS_TUNNEL1_INSIDE_IP="REPLACE_WITH_TUNNEL1_INSIDE_IP"     # e.g. 169.254.x.x
HOME_LAB_OUTSIDE_IP="REPLACE_WITH_YOUR_PUBLIC_IP"          # curl ifconfig.me
PRE_SHARED_KEY="REPLACE_WITH_PSK_FROM_AWS_CONFIG"

HOME_LAB_LAN="192.168.1.0/24"    # your home network
AWS_VPC_A_CIDR="10.0.0.0/16"     # must match your Terraform config
# =============================================================================

echo "=== Writing /etc/ipsec.conf ==="
sudo tee /etc/ipsec.conf > /dev/null <<EOF
config setup
    charondebug="ike 1, knl 1, cfg 0"
    uniqueids=no

conn %default
    ikelifetime=60m
    keylife=20m
    rekeymargin=3m
    keyingtries=1
    keyexchange=ikev1
    authby=secret

# Tunnel 1 to AWS
conn aws-tunnel-1
    auto=start
    left=%defaultroute
    leftid=${HOME_LAB_OUTSIDE_IP}
    leftsubnet=${HOME_LAB_LAN}
    right=${AWS_TUNNEL1_OUTSIDE_IP}
    rightsubnet=${AWS_VPC_A_CIDR}
    ike=aes128-sha1-modp1024
    esp=aes128-sha1-modp1024
    aggressivemode=no
    type=tunnel
    dpdaction=restart
    dpddelay=10s
    dpdtimeout=30s
EOF

echo "=== Writing /etc/ipsec.secrets ==="
sudo tee /etc/ipsec.secrets > /dev/null <<EOF
# AWS Tunnel 1
${HOME_LAB_OUTSIDE_IP} ${AWS_TUNNEL1_OUTSIDE_IP} : PSK "${PRE_SHARED_KEY}"
EOF

echo "=== Restarting strongSwan ==="
sudo systemctl restart strongswan-starter
sudo systemctl enable strongswan-starter

echo ""
echo "=== Checking tunnel status ==="
sleep 3
sudo ipsec status

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Verify tunnel is UP:"
echo "  sudo ipsec status"
echo "  sudo ipsec statusall"
echo ""
echo "Test connectivity to AWS (ping a private EC2):"
echo "  ping 10.0.3.x   (replace with your EC2 private IP from terraform output)"
echo ""
echo "If tunnel is DOWN, check logs:"
echo "  sudo journalctl -u strongswan-starter -f"
