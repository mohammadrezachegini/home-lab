# Django GitOps AWS — Production-Grade Deployment Pipeline

A Django REST API deployed using a complete GitOps workflow on AWS EKS. Infrastructure is provisioned with Terraform, secrets are managed by HashiCorp Vault and External Secrets Operator, multi-environment deployments are handled by ArgoCD and Kustomize, and a GitHub Actions CI pipeline automates the full build-to-deploy flow across dev, staging, and production.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     GitHub Repo                      │
│  ┌─────────────┐         ┌────────────────────────┐ │
│  │  app/ code  │         │  k8s/ manifests        │ │
│  │  Django API │         │  base/ + overlays/     │ │
│  └──────┬──────┘         │  ├── local/            │ │
│         │                │  ├── dev/              │ │
│         │                │  ├── staging/          │ │
│         │                │  └── prod/             │ │
└─────────┼────────────────┴────────────┬───────────┘
          │ git push                    │ ArgoCD watches
          ▼                             ▼
┌─────────────────┐           ┌──────────────────────┐
│  GitHub Actions │           │       ArgoCD         │
│  CI Pipeline    │           │  (pull-based GitOps) │
│  - test         │           └──────────┬───────────┘
│  - build image  │                      │ syncs
│  - push to ECR  │           ┌──────────▼───────────┐
│  - update tag   │           │  AWS EKS Cluster     │
│  - auto: dev    │           │  ┌────────────────┐  │
│  - auto: staging│           │  │ Django Pods    │  │
│  - manual: prod │           │  ├────────────────┤  │
└─────────────────┘           │  │ PostgreSQL     │  │
                              │  ├────────────────┤  │
┌─────────────────┐           │  │ Traefik Ingress│  │
│  Terraform      │ provisions│  ├────────────────┤  │
│  - VPC          ├──────────▶│  │ Vault + ESO    │  │
│  - EKS          │           │  └────────────────┘  │
│  - RDS Postgres │           └──────────────────────┘
│  - ECR          │
│  - S3 + DynamoDB│   ┌─────────────────────────────┐
│  - IAM roles    │   │      HashiCorp Vault         │
└─────────────────┘   │  - Django SECRET_KEY         │
                      │  - DB credentials            │
                      │  Synced via External Secrets │
                      │  Operator → K8s Secrets      │
                      └─────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Application | Django REST Framework + PostgreSQL |
| Containerization | Docker (multi-stage build) |
| CI Pipeline | GitHub Actions |
| CD / GitOps | ArgoCD |
| Config Management | Kustomize (base + overlays) |
| Infrastructure as Code | Terraform |
| Cloud | AWS (EKS, RDS, ECR, VPC, S3, IAM) |
| Secrets Management | HashiCorp Vault + External Secrets Operator |
| Local Kubernetes | K3s |

---

## Project Structure

```
django-gitops-aws/
├── app/                        # Django application
│   ├── Dockerfile              # Multi-stage build
│   ├── docker-compose.yml      # Local dev with PostgreSQL
│   ├── entrypoint.sh           # Runs migrations on startup
│   ├── requirements.txt
│   └── src/django_app/
│       ├── config/             # Django settings, urls, wsgi
│       └── blog/               # REST API (models, views, serializers)
│
├── k8s/                        # Kubernetes manifests
│   ├── base/                   # Shared across all environments
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   ├── postgres-*.yaml
│   │   └── external-secrets/   # SecretStore + ExternalSecret
│   └── overlays/
│       ├── local/              # K3s laptop (imagePullPolicy: Never)
│       ├── dev/                # EKS dev (auto-sync, postgres pod)
│       ├── staging/            # EKS staging (auto-sync, postgres pod)
│       └── prod/               # EKS prod (manual sync, RDS)
│
├── terraform/                  # AWS infrastructure
│   ├── main.tf                 # Provider + S3 backend
│   ├── vpc.tf                  # VPC, subnets, NAT gateway
│   ├── eks.tf                  # EKS cluster + node group + IAM
│   ├── rds.tf                  # RDS PostgreSQL
│   ├── ecr.tf                  # ECR repository + lifecycle policy
│   ├── variables.tf
│   └── outputs.tf
│
├── argocd/                     # ArgoCD Application manifests
│   ├── application.yaml        # local
│   ├── application-dev.yaml
│   ├── application-staging.yaml
│   └── application-prod.yaml   # Manual sync only
│
├── vault/                      # Vault configuration
│   ├── vault-values.yaml       # Helm values
│   └── configure-vault.sh      # KV engine + policy + ESO token
│
├── .github/workflows/
│   └── ci.yaml                 # Full CI/CD pipeline
│
├── setup-local.sh              # One-command local K3s setup
└── cleanup-local.sh            # One-command local K3s teardown
```

---

## Environments

| Environment | Cluster | Database | Sync | Trigger |
|---|---|---|---|---|
| local | K3s (laptop) | PostgreSQL pod | Auto | git push |
| dev | AWS EKS | PostgreSQL pod | Auto | git push to main |
| staging | AWS EKS | PostgreSQL pod | Auto | after dev deploys |
| prod | AWS EKS | AWS RDS | Manual | approval + ArgoCD UI |

---

## Quick Start — Local (K3s)

### Prerequisites

```bash
# Required tools
sudo apt install vault jq -y
helm version    # must be installed
kubectl version # must be configured for K3s
docker version  # must be running
```

### Run

```bash
git clone https://github.com/mohammadrezachegini/Django-GitOps-AWS.git
cd Django-GitOps-AWS

chmod +x setup-local.sh
./setup-local.sh
```

The script handles everything automatically:
- Creates namespaces
- Builds and loads the Docker image into K3s
- Installs ArgoCD, Vault, External Secrets Operator
- Configures Vault with Django secrets
- Deploys the app via ArgoCD

### Access

```bash
# API
kubectl port-forward svc/django-api -n local 8000:80 --address 0.0.0.0
curl http://localhost:8000/api/posts/

# ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443 --address 0.0.0.0
# Open https://localhost:8080  (username: admin)
```

### Cleanup

```bash
./cleanup-local.sh
```

---

## Quick Start — AWS (EKS)

### Prerequisites

```bash
aws sts get-caller-identity   # must be configured
terraform version             # >= 1.6.0
eksctl version                # must be installed
```

### 1. Bootstrap remote state

```bash
aws s3api create-bucket --bucket django-gitops-tfstate --region us-east-1
aws s3api put-bucket-versioning \
  --bucket django-gitops-tfstate \
  --versioning-configuration Status=Enabled
aws dynamodb create-table \
  --table-name django-gitops-tfstate-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 2. Provision infrastructure

```bash
cd terraform/
export TF_VAR_rds_password="$(openssl rand -hex 16)"
echo "Save this password: $TF_VAR_rds_password"
terraform init && terraform apply
```

### 3. Bootstrap EKS

```bash
aws eks update-kubeconfig --region us-east-1 --name django-gitops-eks
chmod +x bootstrap-eks.sh && ./bootstrap-eks.sh
```

### 4. Deploy

```bash
git push origin main
# Pipeline: test → build → dev (auto) → staging (auto) → prod (manual approval)
# After GitHub approval: go to ArgoCD UI → sync django-api-prod
```

### Cleanup AWS

```bash
chmod +x cleanup.sh && ./cleanup.sh
```

---

## CI/CD Pipeline

```
git push to main
    │
    ▼
┌─────────┐     ┌───────────────┐     ┌────────────┐
│  Test   │────▶│ Build + Push  │────▶│ Deploy Dev │
│         │     │   to ECR      │     │  (auto)    │
└─────────┘     └───────────────┘     └─────┬──────┘
                                            │
                                      ┌─────▼──────┐
                                      │  Staging   │
                                      │  (auto)    │
                                      └─────┬──────┘
                                            │
                                    ┌───────▼────────┐
                                    │ Manual Approval │
                                    │ (GitHub env)   │
                                    └───────┬────────┘
                                            │
                                      ┌─────▼──────┐
                                      │    Prod    │
                                      │ (ArgoCD    │
                                      │ manual sync│
                                      └────────────┘
```

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/posts/ | List all posts | No |
| POST | /api/posts/ | Create a post | Yes |
| GET | /api/posts/{id}/ | Get a post | No |
| PUT | /api/posts/{id}/ | Update a post | Author only |
| DELETE | /api/posts/{id}/ | Delete a post | Author only |

Query params: `?published=true` `?author=username`

---

## Key Learnings & Real Issues Solved

**EKS + EBS CSI Driver**
EKS 1.31 requires the EBS CSI driver addon with IRSA for PVC provisioning.
The in-tree `kubernetes.io/aws-ebs` provisioner is deprecated. Fixed by
creating an IAM service account via `eksctl` and installing the addon with
`--resolve-conflicts OVERWRITE`.

**PGDATA on EBS volumes**
EBS volumes initialize with a `lost+found` directory. PostgreSQL refuses
to start in a non-empty directory. Fixed by setting:
`PGDATA=/var/lib/postgresql/data/pgdata`

**ArgoCD CRD annotation size limit**
Installing ArgoCD with `kubectl apply` fails with a 262144 byte annotation
limit on CRDs. Fixed with `--server-side --force-conflicts`.

**GitOps secret rotation order**
Rotating a DB password requires updating the actual Postgres user first,
then updating Vault. ESO syncs the new K8s Secret automatically within
the refresh interval. The app picks it up on next pod restart.

**Stuck PVC in Terminating**
Force-delete by removing the finalizer:
`kubectl patch pvc <name> -p '{"metadata":{"finalizers":[]}}' --type=merge`

---



Run `./cleanup.sh` when not using it.