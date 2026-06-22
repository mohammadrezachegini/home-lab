# 🏠 Homelab Ansible — Full Stack Setup

Two-node K3s cluster with full DevOps stack.

## Nodes

| Hostname       | IP          | Machine       | Role                        |
|----------------|-------------|---------------|-----------------------------|
| jarvis         | 10.0.0.148  | UM773 Lite    | Control plane + Monitoring + CI/CD |
| thor  | 10.0.0.149  | M1 Plus       | Worker + Dev environment    |

## Stack

| Tool                  | Namespace        | Purpose                        |
|-----------------------|------------------|--------------------------------|
| K3s                   | kube-system      | Kubernetes distribution        |
| MetalLB               | metallb-system   | LoadBalancer for bare metal    |
| NGINX Ingress         | ingress-nginx    | Ingress controller             |
| Longhorn              | longhorn-system  | Distributed persistent storage |
| Prometheus + Grafana  | monitoring       | Metrics + dashboards           |
| Loki + Promtail       | monitoring       | Log aggregation                |
| Jaeger                | monitoring       | Distributed tracing            |
| Jenkins               | cicd             | CI/CD pipelines                |
| Container Registry    | registry         | Local Docker registry          |
| ArgoCD                | argocd           | GitOps continuous delivery     |
| Vault                 | vault            | Secrets management             |
| External Secrets      | external-secrets | Sync Vault → K8s secrets       |

## Prerequisites (MacBook)

```bash
# Install Ansible
brew install ansible

# Install required collections
ansible-galaxy collection install ansible.posix community.general

# Set up SSH key
ssh-keygen -t ed25519 -C "reza@homelab"
ssh-copy-id reza@10.0.0.148
ssh-copy-id reza@10.0.0.149
```

## Usage

### Full stack in one shot
```bash
ansible-playbook -i inventory/hosts.ini site.yml
```

### Step by step (recommended first time)
```bash
# 1. OS hardening + networking
ansible-playbook -i inventory/hosts.ini playbooks/01-common.yml

# 2. K3s cluster
ansible-playbook -i inventory/hosts.ini playbooks/02-k3s.yml

# 3. Longhorn storage
ansible-playbook -i inventory/hosts.ini playbooks/03-longhorn.yml

# 4. Monitoring
ansible-playbook -i inventory/hosts.ini playbooks/04-monitoring.yml

# 5. CI/CD
ansible-playbook -i inventory/hosts.ini playbooks/05-cicd.yml

# 6. GitOps
ansible-playbook -i inventory/hosts.ini playbooks/06-gitops.yml
```

### Dry run (check mode — no changes made)
```bash
ansible-playbook -i inventory/hosts.ini site.yml --check
```

### Run a single role
```bash
ansible-playbook -i inventory/hosts.ini site.yml --tags monitoring
```

### Test connectivity first
```bash
ansible all -i inventory/hosts.ini -m ping
```

## After Install — Service URLs

Get all LoadBalancer IPs:
```bash
kubectl get svc -A | grep LoadBalancer
```

| Service    | Default Port | Credentials          |
|------------|-------------|----------------------|
| Grafana    | 80          | admin / homelab123   |
| Jenkins    | 8080        | admin / homelab123   |
| ArgoCD     | 80/443      | admin / (auto-generated, printed at end) |
| Vault      | 8200        | dev mode (root token: root) |
| Longhorn   | 80          | no auth in dev       |
| Registry   | 5000        | no auth              |

## Customise

Edit `group_vars/all.yml` to change:
- Passwords
- IP ranges
- Prometheus retention
- Replica counts
- Versions

Edit `host_vars/jarvis.yml` and `host_vars/thor.yml` for per-node settings.

## Project Structure

```
homelab-ansible/
├── site.yml                    # Full stack — run this
├── inventory/
│   └── hosts.ini               # Node IPs and SSH config
├── group_vars/
│   └── all.yml                 # Global variables
├── host_vars/
│   ├── jarvis.yml              # UM773 variables
│   └── thor.yml       # M1 Plus variables
├── playbooks/
│   ├── 01-common.yml           # OS setup only
│   ├── 02-k3s.yml              # K3s only
│   ├── 03-longhorn.yml         # Storage only
│   ├── 04-monitoring.yml       # Monitoring only
│   ├── 05-cicd.yml             # CI/CD only
│   └── 06-gitops.yml           # GitOps only
└── roles/
    ├── common/                  # OS hardening, Docker, dev tools
    ├── networking/              # UFW firewall rules
    ├── k3s_server/              # K3s control plane + MetalLB + Ingress
    ├── k3s_agent/               # K3s worker node
    ├── longhorn/                # Distributed storage
    ├── monitoring/              # Prometheus, Grafana, Loki, Jaeger
    ├── cicd/                    # Jenkins + local registry
    └── gitops/                  # ArgoCD + Vault + External Secrets
```
# ansible-setup-project
