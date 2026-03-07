# Order Service

A RESTful microservice for order management, built with **Go** and **PostgreSQL**. Part of the microservices e-commerce platform.

---

## Overview

The Order Service handles all order-related operations including creating orders, tracking order status, and querying orders by user. It is compiled to a static binary and runs in a minimal Alpine Linux container, with Prometheus metrics and CORS support built in.

- **Language:** Go 1.25
- **Framework:** Gin
- **Database:** PostgreSQL (via `lib/pq` with `database/sql`)
- **Port:** `8003`

---

## Features

- Create and manage orders linked to users and products
- Update order status (e.g. `pending` → `processing` → `shipped` → `delivered`)
- Filter orders by `user_id` or `status` with pagination
- Get all orders for a specific user
- Prometheus metrics (`/metrics`)
- Health check endpoint (`/health`)
- CORS middleware enabled for all origins
- Multi-stage Docker build for minimal image size
- Non-root Docker user for security

---

## Order Fields

| Field         | Type      | Description                               |
|---------------|-----------|-------------------------------------------|
| `id`          | int       | Auto-generated order ID                   |
| `user_id`     | int       | ID of the user who placed the order       |
| `product_id`  | int       | ID of the product ordered                 |
| `quantity`    | int       | Number of units ordered (min: 1)          |
| `total_price` | float64   | Total cost of the order                   |
| `status`      | string    | Current order status                      |
| `order_date`  | timestamp | When the order was placed                 |
| `created_at`  | timestamp | Record creation timestamp                 |
| `updated_at`  | timestamp | Last updated timestamp                    |

---

## Project Structure

```
order-service/
├── main.go              # Application entry point, routes, handlers, middleware
├── go.mod               # Go module definition and direct dependencies
├── go.sum               # Locked dependency checksums
├── Dockerfile           # Multi-stage container build
├── .env.example         # Environment variable template
└── .dockerignore        # Files excluded from Docker build
```

---

## Getting Started

### Prerequisites

- Go 1.21+
- PostgreSQL database running

### Local Setup

1. **Clone the repository and navigate to the service:**

```bash
cd microservices-ecommerce-project/src/order-service
```

2. **Download dependencies:**

```bash
go mod download
```

3. **Set up environment variables:**

```bash
cp .env.example .env
# Edit .env with your actual database credentials
```

4. **Run the service:**

```bash
go run main.go
```

5. **Build and run the binary:**

```bash
go build -o main .
./main
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure the following:

| Variable      | Default       | Description                      |
|---------------|---------------|----------------------------------|
| `PORT`        | `8003`        | Port the service listens on      |
| `HOST`        | `0.0.0.0`     | Host binding                     |
| `DB_HOST`     | `localhost`   | PostgreSQL host                  |
| `DB_PORT`     | `5432`        | PostgreSQL port                  |
| `DB_NAME`     | `ecommerce`   | Database name                    |
| `DB_USER`     | `postgres`    | Database user                    |
| `DB_PASSWORD` | `postgres`    | Database password                |
| `ENVIRONMENT` | `development` | Runtime environment label        |

---

## Docker

This service uses a **multi-stage build** to keep the final image small — the Go binary is compiled in a `golang:1.25-alpine` builder stage and copied into a minimal `alpine:latest` runtime image.

### Build the image

```bash
docker build -t order-service .
```

### Run the container

```bash
docker run -d \
  --name order-service \
  -p 8003:8003 \
  --env-file .env \
  order-service
```

### Docker Compose (recommended)

This service is designed to run as part of the full e-commerce stack using Docker Compose from the project root.

---

## API Endpoints

| Method   | Endpoint                          | Description                        |
|----------|-----------------------------------|------------------------------------|
| `GET`    | `/health`                         | Health check                       |
| `GET`    | `/metrics`                        | Prometheus metrics                 |
| `GET`    | `/api/orders`                     | List all orders (filterable)       |
| `GET`    | `/api/orders/:id`                 | Get order by ID                    |
| `POST`   | `/api/orders`                     | Create a new order                 |
| `PUT`    | `/api/orders/:id/status`          | Update order status                |
| `DELETE` | `/api/orders/:id`                 | Delete an order                    |
| `GET`    | `/api/orders/user/:user_id`       | Get all orders for a user          |

### Query Parameters for `GET /api/orders`

| Parameter  | Type    | Description                              |
|------------|---------|------------------------------------------|
| `user_id`  | integer | Filter orders by user ID                 |
| `status`   | string  | Filter orders by status                  |
| `limit`    | integer | Max results to return (default: 100)     |
| `offset`   | integer | Number of results to skip (default: 0)   |

---

### Example: Create Order

**Request:**
```bash
curl -X POST http://localhost:8003/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "product_id": 5,
    "quantity": 2,
    "total_price": 179.98
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "product_id": 5,
    "quantity": 2,
    "total_price": 179.98,
    "status": "pending",
    "order_date": "0001-01-01T00:00:00Z",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

> Orders are always created with `pending` status.

### Example: Update Order Status

```bash
curl -X PUT http://localhost:8003/api/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "processing"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Order status updated successfully"
}
```

### Example: Get Orders by User

```bash
curl http://localhost:8003/api/orders/user/1
```

### Example: Filter Orders

```bash
curl "http://localhost:8003/api/orders?user_id=1&status=pending&limit=10&offset=0"
```

---

## Monitoring

The service exposes Prometheus-compatible metrics at `/metrics`, tracking:

- **`http_requests_total`** — Total HTTP requests by method, endpoint, and status code
- **`http_request_duration_seconds`** — Request duration histogram using default Prometheus buckets

Metrics are registered via `prometheus.MustRegister` at startup and collected per-request by the `prometheusMiddleware` Gin handler.

---

## Health Check

```bash
curl http://localhost:8003/health
```

```json
{
  "status": "healthy",
  "service": "order-service",
  "timestamp": "2025-01-01T00:00:00Z",
  "database": "connected"
}
```

---

## Dependencies

### Direct

| Package                          | Version  | Purpose                        |
|----------------------------------|----------|--------------------------------|
| `github.com/gin-gonic/gin`       | v1.9.1   | HTTP web framework             |
| `github.com/joho/godotenv`       | v1.5.1   | `.env` file loader             |
| `github.com/lib/pq`              | v1.10.9  | PostgreSQL driver              |
| `github.com/prometheus/client_golang` | v1.18.0 | Prometheus metrics exporter |

---

## Notes

- Orders are always created with `pending` status — use `PUT /api/orders/:id/status` to advance the lifecycle
- The database connection pool is configured with **25 max open connections**, **5 idle connections**, and a **5-minute connection lifetime**
- The multi-stage Docker build produces a compact, statically linked binary with no external runtime dependencies
- The final Docker image runs as a **non-root user** (`appuser`, UID 1001) for security
- Health checks use `wget` (available in Alpine) rather than `curl` to keep the image lean
- Gin runs in **release mode** in production to suppress debug output