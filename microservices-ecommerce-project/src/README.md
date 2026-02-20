# Microservices E-Commerce Platform

A production-style e-commerce backend built as a collection of independent microservices, each responsible for a single domain. The platform demonstrates polyglot architecture — using Python, Go, and Node.js — with a shared PostgreSQL database, unified Prometheus monitoring, and Docker-based deployment.

---

## Architecture Overview

```
src/
├── user-service/         # Python / FastAPI       — Port 8002
├── product-service/      # Node.js / Express      — Port 8001
├── order-service/        # Go / Gin               — Port 8003
├── payment-service/      # Python / FastAPI       — Port 8004
└── inventory-service/    # Node.js / Express      — Port 8005
```

Each service is independently deployable, has its own database tables, exposes `/health` and `/metrics` endpoints, and runs as a non-root user inside Docker.

---

## Services

### User Service — `user-service/` — Port `8002`

| | |
|---|---|
| **Language** | Python 3.11 |
| **Framework** | FastAPI |
| **Database** | PostgreSQL via SQLAlchemy ORM |

Handles user registration, profile management, and credential verification. Passwords are hashed with bcrypt. Exposes Swagger UI at `/docs`.

**Key endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/metrics` | Prometheus metrics |
| `POST` | `/api/users` | Register a new user |
| `GET` | `/api/users` | List all users |
| `GET` | `/api/users/{id}` | Get user by ID |
| `PUT` | `/api/users/{id}` | Update user |
| `DELETE` | `/api/users/{id}` | Delete user |
| `POST` | `/api/users/login` | Verify credentials |

---

### Product Service — `product-service/` — Port `8001`

| | |
|---|---|
| **Language** | Node.js 20+ |
| **Framework** | Express.js |
| **Database** | PostgreSQL via `pg` pool (max 20 connections) |

Manages the product catalog. Supports full CRUD, category filtering, case-insensitive name search, and pagination.

**Key endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/metrics` | Prometheus metrics |
| `GET` | `/api/products` | List products (filter, search, paginate) |
| `GET` | `/api/products/:id` | Get product by ID |
| `POST` | `/api/products` | Create product |
| `PUT` | `/api/products/:id` | Update product |
| `DELETE` | `/api/products/:id` | Delete product |
| `GET` | `/api/products/categories/list` | List distinct categories |

**Query params:** `category`, `search`, `limit`, `offset`

---

### Order Service — `order-service/` — Port `8003`

| | |
|---|---|
| **Language** | Go 1.25 |
| **Framework** | Gin |
| **Database** | PostgreSQL via `lib/pq` + `database/sql` |

Manages orders linked to users and products. Built as a statically compiled Go binary using a multi-stage Docker build for a minimal final image.

**Key endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/metrics` | Prometheus metrics |
| `GET` | `/api/orders` | List orders (filter, paginate) |
| `GET` | `/api/orders/:id` | Get order by ID |
| `POST` | `/api/orders` | Create order |
| `PUT` | `/api/orders/:id/status` | Update order status |
| `DELETE` | `/api/orders/:id` | Delete order |
| `GET` | `/api/orders/user/:user_id` | Get all orders for a user |

**Query params:** `user_id`, `status`, `limit`, `offset`

---

### Payment Service — `payment-service/` — Port `8004`

| | |
|---|---|
| **Language** | Python 3.11 |
| **Framework** | FastAPI |
| **Database** | PostgreSQL via SQLAlchemy ORM |

Processes payments and tracks their lifecycle from `pending` through to `completed` or `refunded`. Only completed payments can be refunded. `payment_date` is recorded automatically on completion.

**Key endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/metrics` | Prometheus metrics |
| `POST` | `/api/payments` | Create a payment |
| `GET` | `/api/payments` | List payments (filter by order/status) |
| `GET` | `/api/payments/{id}` | Get payment by ID |
| `GET` | `/api/payments/order/{order_id}` | Get all payments for an order |
| `PUT` | `/api/payments/{id}` | Update status / transaction ID |
| `POST` | `/api/payments/{id}/refund` | Refund a completed payment |
| `DELETE` | `/api/payments/{id}` | Delete a payment |

**Payment statuses:** `pending` → `completed` → `refunded` / `failed`

---

### Inventory Service — `inventory-service/` — Port `8005`

| | |
|---|---|
| **Language** | Node.js 20+ |
| **Framework** | Express.js |
| **Database** | PostgreSQL via `pg` pool (max 20 connections) |

Tracks stock levels per product per warehouse. Supports the full stock lifecycle — create, restock, reserve, release, and fulfill — with duplicate record prevention and low-stock alerting.

**Key endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check with process uptime |
| `GET` | `/metrics` | Prometheus metrics (live stock gauge) |
| `GET` | `/api/inventory` | List records (filter by product/warehouse) |
| `GET` | `/api/inventory/alerts/low-stock` | Low stock alert (configurable threshold) |
| `GET` | `/api/inventory/product/:product_id` | Aggregated stock across warehouses |
| `GET` | `/api/inventory/:id` | Get record by ID |
| `POST` | `/api/inventory` | Create inventory record |
| `PUT` | `/api/inventory/:id/restock` | Add stock |
| `POST` | `/api/inventory/:id/reserve` | Reserve stock for an order |
| `POST` | `/api/inventory/:id/release` | Release reserved stock |
| `POST` | `/api/inventory/:id/fulfill` | Fulfill order (deduct stock) |
| `DELETE` | `/api/inventory/:id` | Delete record |

**Stock lifecycle:** `Create` → `Restock` → `Reserve` → `Fulfill` (or `Release` if cancelled)

---

## Port Reference

| Service | Port | Language | Framework |
|---|---|---|---|
| Product Service | `8001` | Node.js | Express |
| User Service | `8002` | Python | FastAPI |
| Order Service | `8003` | Go | Gin |
| Payment Service | `8004` | Python | FastAPI |
| Inventory Service | `8005` | Node.js | Express |

---

## Shared Design Patterns

All five services follow the same conventions:

- **Health check** at `/health` — verifies database connectivity and returns service name + timestamp
- **Prometheus metrics** at `/metrics` — tracking `http_requests_total` and `http_request_duration_seconds` at minimum, with domain-specific metrics per service
- **CORS** — enabled for all origins across every service
- **Non-root Docker user** — all containers run as UID 1001 (`appuser` or `nodejs`)
- **PostgreSQL** — shared `ecommerce` database; tables are created automatically on startup (Python services) or expected to exist (Go/Node.js services)
- **Environment variables** — each service ships an `.env.example` with documented defaults

---

## Getting Started

### Prerequisites

- Docker and Docker Compose
- PostgreSQL (or use the one in Docker Compose)

### Run All Services

From the project root:

```bash
docker compose up --build
```

### Run a Single Service Locally

Navigate to any service directory and follow its individual README for local setup instructions. Each service README documents language-specific setup (virtualenv for Python, `go mod download` for Go, `npm install` for Node.js).

---

## Monitoring

Every service exposes a `/metrics` endpoint compatible with Prometheus. To scrape all services, add the following jobs to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'product-service'
    static_configs:
      - targets: ['product-service:8001']

  - job_name: 'user-service'
    static_configs:
      - targets: ['user-service:8002']

  - job_name: 'order-service'
    static_configs:
      - targets: ['order-service:8003']

  - job_name: 'payment-service'
    static_configs:
      - targets: ['payment-service:8004']

  - job_name: 'inventory-service'
    static_configs:
      - targets: ['inventory-service:8005']
```

### Custom Business Metrics per Service

| Service | Metric | Type | Description |
|---|---|---|---|
| Payment | `payments_total` | Counter | Payments by method and status |
| Inventory | `inventory_stock_total` | Gauge | Live stock per product and warehouse |
| Inventory | `inventory_operations_total` | Counter | Operations by type and warehouse |

---

## Service READMEs

Each service has its own detailed README covering local setup, all endpoints with curl examples, environment variables, Docker instructions, and monitoring details:

- [`user-service/README.md`](./user-service/README.md)
- [`product-service/README.md`](./product-service/README.md)
- [`order-service/README.md`](./order-service/README.md)
- [`payment-service/README.md`](./payment-service/README.md)
- [`inventory-service/README.md`](./inventory-service/README.md)

---

## Tech Stack Summary

| Category | Technologies |
|---|---|
| **Languages** | Python 3.11, Go 1.25, Node.js 20 |
| **Frameworks** | FastAPI, Gin, Express.js |
| **Database** | PostgreSQL |
| **ORM / Drivers** | SQLAlchemy, `lib/pq`, `pg` |
| **Monitoring** | Prometheus (`prometheus-client`, `client_golang`, `prom-client`) |
| **Containerization** | Docker, Docker Compose |
| **Runtime** | Uvicorn (Python), Go binary (Alpine), Node.js |