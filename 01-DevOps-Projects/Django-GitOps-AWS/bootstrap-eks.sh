#!/bin/bash
# bootstrap-eks.sh
# Run this ONCE after terraform apply to set up ArgoCD and secrets on EKS.

set -e

echo "=== Bootstrapping EKS ==="
echo ""

# ── Step 1: Install ArgoCD on EKS ────────────────────────────────────────────
echo "Installing ArgoCD on EKS..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "Waiting for ArgoCD to be ready..."
kubectl wait --for=condition=available deployment/argocd-server \
  -n argocd --timeout=120s

echo ""
echo "ArgoCD admin password:"
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo

# ── Step 2: Install External Secrets Operator on EKS ─────────────────────────
echo ""
echo "Installing External Secrets Operator on EKS..."
helm repo add external-secrets https://charts.external-secrets.io
helm repo update

helm upgrade --install external-secrets external-secrets/external-secrets \
  --namespace external-secrets \
  --create-namespace \
  --set installCRDs=true

kubectl wait --for=condition=available deployment/external-secrets \
  -n external-secrets --timeout=120s

# ── Step 3: Create dev namespace and secrets ──────────────────────────────────
echo ""
echo "Creating dev namespace and secrets..."
kubectl create namespace dev --dry-run=client -o yaml | kubectl apply -f -

# For now we create the secret manually — in a full setup you'd
# deploy Vault on EKS or use HCP Vault and ESO would handle this.
# We'll store the RDS password directly as a K8s secret for dev.
echo ""
echo "Enter your RDS password (the one from TF_VAR_rds_password):"
read -s RDS_PASSWORD

kubectl create secret generic django-secrets \
  --namespace=dev \
  --from-literal=SECRET_KEY="$(openssl rand -hex 32)" \
  --from-literal=DB_NAME="blogdb" \
  --from-literal=DB_USER="bloguser" \
  --from-literal=DB_PASSWORD="$RDS_PASSWORD" \
  --dry-run=client -o yaml | kubectl apply -f -

echo ""
echo "✓ django-secrets created in dev namespace"

# ── Step 4: Apply ArgoCD dev application ─────────────────────────────────────
echo ""
echo "Applying ArgoCD dev application..."
kubectl apply -f argocd/application-dev.yaml
kubectl apply -f argocd/application-staging.yaml
kubectl apply -f argocd/application-prod.yaml

echo ""
echo "=== Bootstrap complete ==="
echo ""
echo "Watch the deployment:"
echo "  kubectl get pods -n dev -w"
echo ""
echo "Access ArgoCD UI:"
echo "  kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo "  https://localhost:8080  (admin / password printed above)"
