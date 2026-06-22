# Django User API

A Django REST Framework API deployed on Kubernetes with PostgreSQL on Longhorn distributed storage, automated CI/CD via Jenkins, and accessible at `django-user-api.rezaops.com`.

Built as part of the [Root Access Newsletter](https://www.linkedin.com/in/mohammadrezachegini/) home lab series.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Django 4.x + Django REST Framework |
| Database | PostgreSQL 15 (StatefulSet on Longhorn) |
| Storage | Longhorn (replicated PVC across 2 nodes) |
| Container | Docker, registry.rezaops.com |
| Orchestration | Kubernetes (K3s) |
| CI/CD | Jenkins with dynamic K8s agents |
| Ingress | NGINX Ingress Controller |
| Secrets | Kubernetes Secrets |

---

## Models

**User** - extends Django's AbstractUser, adds `phone` field

**Item**
- name, description, price, stock
- timestamps (created_at, updated_at)

**Order**
- foreign keys to User and Item
- quantity, status (pending / confirmed / shipped / delivered / cancelled)
- total_price auto-calculated on save

---

## API Endpoints

```
GET    /api/health/          health check (used by K8s probes)
GET    /api/users/           list users
POST   /api/users/           create user
GET    /api/users/{id}/      get user
PUT    /api/users/{id}/      update user
DELETE /api/users/{id}/      delete user

GET    /api/items/           list items
POST   /api/items/           create item
GET    /api/items/in_stock/  list items with stock > 0
GET    /api/items/{id}/      get item
PUT    /api/items/{id}/      update item
DELETE /api/items/{id}/      delete item

GET    /api/orders/          list orders
POST   /api/orders/          create order (auto-decrements stock)
GET    /api/orders/{id}/     get order
PUT    /api/orders/{id}/     update order
DELETE /api/orders/{id}/     delete order
```

Swagger UI available at `/api/docs/` when running.

---

## Local Development

```bash
# Clone the repo
git clone https://github.com/mohammadrezachegini/django-user-api.git
cd django-user-api

# Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start local Postgres
docker run -d --name django-postgres \
  -e POSTGRES_DB=django_api \
  -e POSTGRES_PASSWORD=localdevpassword \
  -p 5432:5432 postgres:15

# Create .env file
cat > .env << 'EOF'
DB_NAME=django_api
DB_USER=postgres
DB_PASSWORD=localdevpassword
DB_HOST=localhost
DB_PORT=5432
DJANGO_SECRET_KEY=local-dev-only
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
EOF

# Run migrations and start server
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Test it:

```bash
curl http://localhost:8000/api/health/
curl http://localhost:8000/api/items/
```

---

## Docker

```bash
# Build
docker build -t django-api:latest .

# Run
docker run -d --name django-api \
  --network host \
  -e DB_NAME=django_api \
  -e DB_USER=postgres \
  -e DB_PASSWORD=localdevpassword \
  -e DB_HOST=localhost \
  -e DJANGO_SECRET_KEY=test-key \
  -e ALLOWED_HOSTS=localhost,* \
  django-api:latest

curl http://localhost:8000/api/health/
```

---

## Kubernetes Deployment

Requires a running K3s cluster with Longhorn installed.

```bash
# Apply all manifests
kubectl apply -f postgres.yaml
kubectl apply -f django-deployment.yaml

# Check pods
kubectl get pods -n django-api

# Check PVC (should be Bound on Longhorn)
kubectl get pvc -n django-api

# Test health
curl http://django-user-api.rezaops.com/api/health/
```

**Key manifest details:**

- PostgreSQL runs as a StatefulSet with a 5Gi Longhorn PVC
- `PGDATA` set to `/var/lib/postgresql/data/pgdata` (subdirectory) to avoid the `lost+found` issue with CSI storage
- Django uses an init container to run migrations before the main container starts
- Readiness and liveness probes hit `/api/health/`
- `ALLOWED_HOSTS` includes `*` to allow kubelet probe requests by pod IP

---

## CI/CD Pipeline

Jenkins polls GitHub every 2 minutes. On detecting a new commit:

1. Checks out the code
2. Builds a new Docker image tagged with the git commit SHA
3. Pushes both `:{SHA}` and `:latest` tags to the local registry
4. Runs `kubectl set image` to update the running deployment
5. Waits for `kubectl rollout status` to confirm successful rollout

Jenkins uses dynamic Kubernetes pod agents (label `k3s-worker`) that spin up on thor for each build and terminate afterward.

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| DB_NAME | Postgres database name | django_api |
| DB_USER | Postgres user | postgres |
| DB_PASSWORD | Postgres password | - |
| DB_HOST | Postgres host | postgres |
| DB_PORT | Postgres port | 5432 |
| DJANGO_SECRET_KEY | Django secret key | - |
| DEBUG | Debug mode | False |
| ALLOWED_HOSTS | Comma-separated allowed hosts | django-user-api.rezaops.com,* |

---

## Real Bugs Hit During Deployment

This project was built on a real home lab and hit real issues. Full documentation:

1. Postgres refused to initialize - `lost+found` directory from Longhorn CSI storage blocking `initdb`
2. Kubernetes probes returning HTTP 400 - Django `ALLOWED_HOSTS` rejecting probe requests sent by pod IP
3. Django using SQLite instead of Postgres - stale settings code not reading env vars correctly
4. K3s containerd registry trust - separate config from Docker daemon, `/etc/rancher/k3s/registries.yaml`
5. Jenkins agent pod never created - wrong Kubernetes API URL missing `.svc` suffix, failed silently

Full write-up in [Part 12 of the Root Access Newsletter](https://www.linkedin.com/in/mohammadrezachegini/).

---

## Author

Reza Chegini - DevOps and Cloud Engineer based in Burnaby, BC

- GitHub: [github.com/mohammadrezachegini](https://github.com/mohammadrezachegini)
- LinkedIn: [linkedin.com/in/mohammadrezachegini](https://linkedin.com/in/mohammadrezachegini)
- Portfolio: [rezaops.com](http://rezaops.com)