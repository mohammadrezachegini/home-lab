#!/bin/bash
# vault/configure-vault.sh
#
# Run this ONCE after Vault is deployed to:
#   1. Enable the KV v2 secrets engine
#   2. Store Django secrets in Vault
#   3. Create a policy that allows ESO to read secrets
#   4. Create a token for ESO to authenticate with Vault
#
# Prerequisites:
#   - Vault pod is running in the "vault" namespace
#   - kubectl is configured to talk to your K3s cluster

set -e

echo "=== Configuring Vault ==="
echo ""

# We talk to Vault through port-forward in the background
echo "Starting port-forward to Vault..."
kubectl port-forward svc/vault -n vault 8200:8200 &
PF_PID=$!
sleep 3   # Give port-forward time to establish

export VAULT_ADDR="http://127.0.0.1:8200"
export VAULT_TOKEN="root"   # Dev mode root token

# Verify Vault is reachable
echo "Checking Vault status..."
vault status

echo ""
echo "=== Step 1: Enable KV v2 secrets engine ==="
# KV v2 supports versioning — you can roll back to a previous secret version
vault secrets enable -path=secret kv-v2 2>/dev/null || echo "KV engine already enabled"

echo ""
echo "=== Step 2: Store Django secrets in Vault ==="
vault kv put secret/django \
  SECRET_KEY="django-super-secret-key-$(openssl rand -hex 24)" \
  DB_NAME="blogdb" \
  DB_USER="bloguser" \
  DB_PASSWORD="$(openssl rand -hex 16)"

echo ""
echo "Secrets stored. Verifying..."
vault kv get secret/django

echo ""
echo "=== Step 3: Create a read-only policy for ESO ==="
# This policy allows ESO to read secrets under secret/django
# It cannot write, delete, or access any other path — least privilege
vault policy write django-read - <<EOF
path "secret/data/django" {
  capabilities = ["read"]
}
EOF

echo ""
echo "=== Step 4: Create a token for ESO ==="
# ESO will use this token to authenticate with Vault
# In production you'd use Kubernetes auth instead of a token
ESO_TOKEN=$(vault token create \
  -policy=django-read \
  -period=8760h \
  -format=json | jq -r '.auth.client_token')

echo ""
echo "ESO Token created: $ESO_TOKEN"
echo ""

# Store the ESO token as a K8s secret so ESO can use it
kubectl create namespace local --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic vault-token \
  --namespace=local \
  --from-literal=token="$ESO_TOKEN" \
  --dry-run=client -o yaml | kubectl apply -f -

echo ""
echo "✓ vault-token secret created in namespace 'local'"
echo ""
echo "=== Vault configuration complete ==="
echo ""
echo "Next: kubectl apply -f k8s/base/external-secrets/"

# Clean up port-forward
kill $PF_PID 2>/dev/null