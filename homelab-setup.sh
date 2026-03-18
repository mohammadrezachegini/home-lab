#!/bin/bash

# ============================================
# Home Lab Setup Script - Ubuntu 24.04
# Installs: AWS CLI, GCP CLI, Azure CLI,
#           Docker, kubectl, Helm, Terraform,
#           Ansible, K3s, and common tools
# ============================================

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[+]${NC} $1"; }
info() { echo -e "${BLUE}[*]${NC} $1"; }
error() { echo -e "${RED}[!]${NC} $1"; }

echo "============================================"
echo "   Home Lab Setup - Ubuntu 24.04"
echo "============================================"
echo ""

# ----------------------------------------
# 1. System Update & Common Tools
# ----------------------------------------
log "Updating system and installing common tools..."
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y \
    git curl wget vim htop unzip gnupg \
    ca-certificates lsb-release apt-transport-https \
    software-properties-common python3-pip

# ----------------------------------------
# 2. Docker
# ----------------------------------------
log "Installing Docker..."
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER
log "Docker installed. NOTE: Log out and back in for docker group to take effect."

# ----------------------------------------
# 3. AWS CLI
# ----------------------------------------
#log "Installing AWS CLI..."
#curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
#unzip -q /tmp/awscliv2.zip -d /tmp
#sudo /tmp/aws/install
#rm -rf /tmp/awscliv2.zip /tmp/aws

# ----------------------------------------
# 4. GCP CLI (gcloud)
# ----------------------------------------
#log "Installing GCP CLI (gcloud)..."
#curl -fsSL https://packages.cloud.google.com/apt/doc/apt-key.gpg | \
#    sudo gpg --dearmor -o /etc/apt/keyrings/cloud.google.gpg

#echo "deb [signed-by=/etc/apt/keyrings/cloud.google.gpg] \
#https://packages.cloud.google.com/apt cloud-sdk main" | \
#    sudo tee /etc/apt/sources.list.d/google-cloud-sdk.list > /dev/null

#sudo apt-get update -y
#sudo apt-get install -y google-cloud-cli

# ----------------------------------------
# 5. Azure CLI
# ----------------------------------------
#log "Installing Azure CLI..."
#curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | \
#    sudo gpg --dearmor -o /etc/apt/keyrings/microsoft.gpg

#echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/microsoft.gpg] \
#https://packages.microsoft.com/repos/azure-cli/ $(lsb_release -cs) main" | \
#    sudo tee /etc/apt/sources.list.d/azure-cli.list > /dev/null

#sudo apt-get update -y
#sudo apt-get install -y azure-cli

# ----------------------------------------
# 6. kubectl
# ----------------------------------------
#log "Installing kubectl..."
#curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.31/deb/Release.key | \
#    sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

#echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] \
#https://pkgs.k8s.io/core:/stable:/v1.31/deb/ /" | \
#    sudo tee /etc/apt/sources.list.d/kubernetes.list > /dev/null

#sudo apt-get update -y
#sudo apt-get install -y kubectl

# ----------------------------------------
# 7. Helm
# ----------------------------------------
#log "Installing Helm..."
#curl -fsSL https://baltocdn.com/helm/signing.asc | \
#    sudo gpg --dearmor -o /etc/apt/keyrings/helm.gpg

#echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/helm.gpg] \
#https://baltocdn.com/helm/stable/debian/ all main" | \
#    sudo tee /etc/apt/sources.list.d/helm-stable-debian.list > /dev/null

#sudo apt-get update -y
#sudo apt-get install -y helm

# ----------------------------------------
# 8. Terraform
# ----------------------------------------
log "Installing Terraform..."
wget -O- https://apt.releases.hashicorp.com/gpg | \
    sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] \
https://apt.releases.hashicorp.com $(lsb_release -cs) main" | \
    sudo tee /etc/apt/sources.list.d/hashicorp.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y terraform

# ----------------------------------------
# 9. Ansible
# ----------------------------------------
log "Installing Ansible..."
sudo apt-get install -y ansible

# ----------------------------------------
# 10. K3s
# ----------------------------------------
log "Installing K3s..."
curl -sfL https://get.k3s.io | sh -

# Allow current user to use kubectl with K3s
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
echo 'export KUBECONFIG=~/.kube/config' >> ~/.bashrc

# ----------------------------------------
# Verify Installations
# ----------------------------------------
echo ""
echo "============================================"
info "Verifying installations..."
echo "============================================"

check_version() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1: $($2 2>&1 | head -1)"
    else
        echo -e "${RED}✗${NC} $1: NOT FOUND"
    fi
}

check_version "docker"    "docker --version"
check_version "aws"       "aws --version"
check_version "gcloud"    "gcloud --version"
check_version "az"        "az --version"
check_version "kubectl"   "kubectl version --client --short"
check_version "helm"      "helm version --short"
check_version "terraform" "terraform --version"
check_version "ansible"   "ansible --version"
check_version "k3s"       "k3s --version"

echo ""
echo "============================================"
log "Setup complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Run: source ~/.bashrc"
echo "  2. Log out and back in (for Docker group)"
echo "  3. Configure AWS:   aws configure"
echo "  4. Configure GCP:   gcloud init"
echo "  5. Configure Azure: az login"
echo ""
