# Inventory Service

A RESTful microservice for inventory and warehouse stock management, built with **Express.js** and **PostgreSQL**. Part of the microservices e-commerce platform.

---

## Overview

The Inventory Service manages stock levels across multiple warehouses. It supports creating inventory records, restocking, reserving stock for orders, releasing reservations, and fulfilling orders. It also provides low-stock alerting and exposes real-time stock levels as a Prometheus Gauge metric.

- **Language:** Node.js 20+
- **Framework:** Express.js
- **Database:** PostgreSQL (via `pg` connection pool)
- **Port:** `8005`

---

## Features

- Track stock per product per warehouse location
- Restock, reserve, release, and fulfill inventory operations
- Low-stock alerts with configurable threshold
- Duplicate record prevention (unique per product + warehouse)
- **Real-time `inventory_stock_total` Gauge** — updated on every `/metrics` scrape
- Prometheus metrics (`/metrics`)
- Health check with uptime reporting (`/health`)
- CORS enabled for all origins
- Request logging middleware
- Graceful shutdown on `SIGTERM` / `SIGINT`
- Non-root Docker user for security

---

## Inventory Record Fields

| Field                | Type      | Description                                         |
|----------------------|-----------|-----------------------------------------------------|
| `id`                 | integer   | Auto-generated record ID                            |
| `product_id`         | integer   | ID of the associated product                        |
| `warehouse_location` | string    | Identifier for the warehouse (e.g. `warehouse-a`)  |
| `quantity`           | integer   | Total units in stock                                |
| `reserved_quantity`  | integer   | Units reserved for pending orders                   |
| `last_restocked`     | timestamp | Timestamp of the last restock operation             |
| `updated_at`         | timestamp | Last record update timestamp                        |

**Available stock** = `quantity` - `reserved_quantity`

---

## Project Structure

```
inventory-service/
├── index.js             # Application entry point, routes, middleware
├── package.json         # Project metadata and dependencies
├── package-lock.json    # Locked dependency tree
├── Dockerfile           # Container build instructions
├── .env.example         # Environment variable template
└── .dockerignore        # Files excluded from Docker build
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database running
- `npm` package manager

### Local Setup

1. **Clone the repository and navigate to the service:**

```bash
cd microservices-ecommerce-project/src/inventory-service
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

```bash
cp .env.example .env
# Edit .env with your actual database credentials
```

4. **Run the service:**

```bash
# Production
npm start

# Development (auto-reload with nodemon)
npm run dev
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure the following:

| Variable      | Default       | Description                      |
|---------------|---------------|----------------------------------|
| `PORT`        | `8005`        | Port the service listens on      |
| `HOST`        | `0.0.0.0`     | Host binding                     |
| `DB_HOST`     | `localhost`   | PostgreSQL host                  |
| `DB_PORT`     | `5432`        | PostgreSQL port                  |
| `DB_NAME`     | `ecommerce`   | Database name                    |
| `DB_USER`     | `postgres`    | Database user                    |
| `DB_PASSWORD` | `postgres`    | Database password                |
| `NODE_ENV`    | `development` | Runtime environment label        |

---

## Docker

### Build the image

```bash
docker build -t inventory-service .
```

### Run the container

```bash
docker run -d \
  --name inventory-service \
  -p 8005:8005 \
  --env-file .env \
  inventory-service
```

### Docker Compose (recommended)

This service is designed to run as part of the full e-commerce stack using Docker Compose from the project root.

---

## API Endpoints

| Method   | Endpoint                                   | Description                                      |
|----------|--------------------------------------------|--------------------------------------------------|
| `GET`    | `/health`                                  | Health check with uptime                         |
| `GET`    | `/metrics`                                 | Prometheus metrics (updates stock gauge)         |
| `GET`    | `/api/inventory`                           | List all inventory records (filterable)          |
| `GET`    | `/api/inventory/alerts/low-stock`          | Get items below stock threshold                  |
| `GET`    | `/api/inventory/product/:product_id`       | Get stock summary for a product across warehouses|
| `GET`    | `/api/inventory/:id`                       | Get inventory record by ID                       |
| `POST`   | `/api/inventory`                           | Create a new inventory record                    |
| `PUT`    | `/api/inventory/:id/restock`               | Add stock to an existing record                  |
| `POST`   | `/api/inventory/:id/reserve`               | Reserve stock for an order                       |
| `POST`   | `/api/inventory/:id/release`               | Release previously reserved stock               |
| `POST`   | `/api/inventory/:id/fulfill`               | Fulfill an order (deduct quantity + reservation) |
| `DELETE` | `/api/inventory/:id`                       | Delete an inventory record                       |

### Query Parameters for `GET /api/inventory`

| Parameter    | Type    | Description                                      |
|--------------|---------|--------------------------------------------------|
| `product_id` | integer | Filter by product ID                             |
| `warehouse`  | string  | Filter by warehouse location                     |
| `low_stock`  | boolean | If `true`, returns records with quantity < 10    |

### Query Parameters for `GET /api/inventory/alerts/low-stock`

| Parameter   | Type    | Description                             |
|-------------|---------|-----------------------------------------|
| `threshold` | integer | Stock level to alert below (default: 10)|

---

### Example: Create Inventory Record

**Request:**
```bash
curl -X POST http://localhost:8005/api/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 5,
    "warehouse_location": "warehouse-a",
    "quantity": 100
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Inventory record created successfully",
  "data": {
    "id": 1,
    "product_id": 5,
    "warehouse_location": "warehouse-a",
    "quantity": 100,
    "reserved_quantity": 0
  }
}
```

> Creating a duplicate record for the same product + warehouse returns a `409 Conflict`.

### Example: Restock

```bash
curl -X PUT http://localhost:8005/api/inventory/1/restock \
  -H "Content-Type: application/json" \
  -d '{"quantity": 50}'
```

> Adds to the existing quantity. Uses `quantity + $1` so it is always an increment, not a replacement.

### Example: Reserve Stock

```bash
curl -X POST http://localhost:8005/api/inventory/1/reserve \
  -H "Content-Type: application/json" \
  -d '{"quantity": 10}'
```

> Checks available stock (`quantity - reserved_quantity`) before reserving. Returns `400` with `available` and `requested` values if insufficient.

### Example: Fulfill Order

```bash
curl -X POST http://localhost:8005/api/inventory/1/fulfill \
  -H "Content-Type: application/json" \
  -d '{"quantity": 10}'
```

> Deducts from both `quantity` and `reserved_quantity`. Uses `GREATEST(..., 0)` to prevent negative values.

### Example: Get Product Stock Summary

```bash
curl http://localhost:8005/api/inventory/product/5
```

**Response:**
```json
{
  "success": true,
  "product_id": 5,
  "total_stock": 150,
  "total_reserved": 10,
  "available": 140,
  "warehouses": [...]
}
```

### Example: Low Stock Alert

```bash
curl "http://localhost:8005/api/inventory/alerts/low-stock?threshold=20"
```

---

## Stock Lifecycle

A typical order flow through the inventory service looks like this:

```
[Create record] → [Restock] → [Reserve] → [Fulfill]
                                   ↓
                               [Release]  ← if order is cancelled
```

---

## Monitoring

The service exposes Prometheus-compatible metrics at `/metrics`, tracking:

- **`http_request_duration_seconds`** — Request duration histogram by method, route, and status code
- **`http_requests_total`** — Total HTTP requests by method, route, and status code
- **`inventory_stock_total`** — Gauge of current stock quantity per `product_id` and `warehouse` label pair (refreshed on every `/metrics` scrape)
- **`inventory_operations_total`** — Total inventory operations by `operation_type` (create, restock, reserve, release, fulfill) and `warehouse`

Default Node.js process metrics are also collected via `promClient.collectDefaultMetrics`.

---

## Health Check

```bash
curl http://localhost:8005/health
```

```json
{
  "status": "healthy",
  "service": "inventory-service",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 142.3,
  "database": "connected"
}
```

> The `uptime` field (in seconds) is unique to this service and is sourced from `process.uptime()`.

---

## Dependencies

### Production

| Package       | Version   | Purpose                     |
|---------------|-----------|-----------------------------|
| `express`     | ^4.18.2   | Web framework               |
| `pg`          | ^8.11.3   | PostgreSQL client           |
| `prom-client` | ^15.1.0   | Prometheus metrics exporter |
| `dotenv`      | ^16.3.1   | Environment variable loader |
| `cors`        | ^2.8.5    | CORS middleware             |

### Development

| Package    | Version  | Purpose                    |
|------------|----------|----------------------------|
| `nodemon`  | ^3.0.2   | Auto-reload during development |

---

## Notes

- Each inventory record is unique per `product_id` + `warehouse_location` — attempting to create a duplicate returns `409 Conflict`
- The `reserve` endpoint validates available stock before reserving and returns explicit `available` and `requested` fields on failure, making it easy to surface this to clients
- The `fulfill` endpoint uses `GREATEST(..., 0)` to guard against negative stock values under concurrent load
- The `release` endpoint similarly uses `GREATEST(reserved_quantity - $1, 0)` to safely handle over-release
- The `inventory_stock_total` Gauge resets and re-queries the database on every `/metrics` scrape for real-time accuracy
- The database connection pool is configured with **20 max connections**, a **30s idle timeout**, and a **2s connection timeout**
- The Docker image runs as a **non-root user** (`nodejs`, UID 1001) for security
- Graceful shutdown closes the PostgreSQL pool cleanly on `SIGTERM` and `SIGINT`