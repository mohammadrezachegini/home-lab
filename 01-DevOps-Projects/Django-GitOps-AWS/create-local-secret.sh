#!/bin/bash
# create-local-secret.sh
#
# Creates the Kubernetes Secret that Django and Postgres read credentials from.
# Run this ONCE before ArgoCD syncs for the first time.
#
# In Phase 3, Vault + External Secrets Operator replaces this script entirely —
# secrets will be injected automatically. But for local testing, we create
# the secret manually.
#
# NOTE: Never commit actual secrets to Git. This script is just for local setup.

set -e

kubectl create namespace local --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic django-secrets \
  --namespace=local \
  --from-literal=SECRET_KEY="local-dev-secret-key-$(openssl rand -hex 16)" \
  --from-literal=DB_NAME="blogdb" \
  --from-literal=DB_USER="bloguser" \
  --from-literal=DB_PASSWORD="blogpassword" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "✓ Secret 'django-secrets' created in namespace 'local'"
echo ""
echo "Next steps:"
echo "  1. Load the Django image into K3s:  sudo k3s ctr images import django-api.tar"
echo "  2. Apply the ArgoCD application:    kubectl apply -f argocd/application.yaml"