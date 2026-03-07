# Product Service

A RESTful microservice for product catalog management, built with **Express.js** and **PostgreSQL**. Part of the microservices e-commerce platform.

---

## Overview

The Product Service handles all product-related operations including listing, searching, filtering by category, and full CRUD management. It exposes a REST API and integrates with Prometheus for metrics monitoring.

- **Language:** JavaScript (Node.js 20+)
- **Framework:** Express.js
- **Database:** PostgreSQL (via `pg` connection pool)
- **Port:** `8001`

---

## Features

- Create, read, update, and delete products (CRUD)
- Filter products by **category** and **search by name** (case-insensitive)
- Pagination via `limit` and `offset` query params
- List distinct product categories
- Prometheus metrics (`/metrics`) with default + custom metrics
- Health check endpoint (`/health`)
- Request logging middleware
- Graceful shutdown on `SIGTERM` / `SIGINT`
- Non-root Docker user for security

---

## Project Structure

```
product-service/
├── index.js             # Application entry point, routes, metrics, DB
├── metrics.js           # Prometheus metrics definitions (registry)
├── package.json         # Project metadata and scripts
├── package-lock.json    # Locked dependency tree
├── Dockerfile           # Container build instructions
├── .env.example         # Environment variable template
└── .dockerignore        # Files excluded from Docker build
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL database running

### Local Setup

1. **Clone the repository and navigate to the service:**

```bash
cd microservices-ecommerce-project/src/product-service
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

# Development (with auto-reload via nodemon)
npm run dev
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure the following:

| Variable      | Default       | Description                    |
|---------------|---------------|--------------------------------|
| `PORT`        | `8001`        | Port the service listens on    |
| `NODE_ENV`    | `development` | Runtime environment label      |
| `DB_HOST`     | `localhost`   | PostgreSQL host                |
| `DB_PORT`     | `5432`        | PostgreSQL port                |
| `DB_NAME`     | `ecommerce`   | Database name                  |
| `DB_USER`     | `postgres`    | Database user                  |
| `DB_PASSWORD` | `postgres`    | Database password              |
| `LOG_LEVEL`   | `info`        | Logging verbosity              |

---

## Docker

### Build the image

```bash
docker build -t product-service .
```

### Run the container

```bash
docker run -d \
  --name product-service \
  -p 8001:8001 \
  --env-file .env \
  product-service
```

### Docker Compose (recommended)

This service is designed to run as part of the full e-commerce stack using Docker Compose from the project root.

---

## API Endpoints

| Method   | Endpoint                             | Description                         |
|----------|--------------------------------------|-------------------------------------|
| `GET`    | `/health`                            | Health check                        |
| `GET`    | `/metrics`                           | Prometheus metrics                  |
| `GET`    | `/api/products`                      | List all products (filterable)      |
| `GET`    | `/api/products/:id`                  | Get product by ID                   |
| `POST`   | `/api/products`                      | Create a new product                |
| `PUT`    | `/api/products/:id`                  | Update a product                    |
| `DELETE` | `/api/products/:id`                  | Delete a product                    |
| `GET`    | `/api/products/categories/list`      | List all distinct categories        |

### Query Parameters for `GET /api/products`

| Parameter  | Type    | Description                                |
|------------|---------|--------------------------------------------|
| `category` | string  | Filter by product category                 |
| `search`   | string  | Search products by name (case-insensitive) |
| `limit`    | integer | Max results to return (default: 100)       |
| `offset`   | integer | Number of results to skip (default: 0)     |

### Example: Create Product

**Request:**
```bash
curl -X POST http://localhost:8001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gaming Headset Pro",
    "description": "High-quality headset for competitive gaming",
    "price": 89.99,
    "stock": 50,
    "category": "peripherals",
    "image_url": "https://example.com/headset.jpg"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": 1,
    "name": "Gaming Headset Pro",
    "description": "High-quality headset for competitive gaming",
    "price": "89.99",
    "stock": 50,
    "category": "peripherals",
    "image_url": "https://example.com/headset.jpg",
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
}
```

### Example: Filter Products

```bash
curl "http://localhost:8001/api/products?category=peripherals&search=headset&limit=10&offset=0"
```

### Example: Get Categories

```bash
curl http://localhost:8001/api/products/categories/list
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": ["accessories", "games", "peripherals"]
}
```

---

## Monitoring

The service exposes Prometheus-compatible metrics at `/metrics`, including both default Node.js metrics and custom request tracking:

- **`http_request_duration_seconds`** — Request duration histogram by method, route, and status code
- **`http_requests_total`** — Total HTTP request counter by method, route, and status code
- Default Node.js runtime metrics (event loop lag, heap usage, GC, etc.)

---

## Health Check

```bash
curl http://localhost:8001/health
```

Returns database connectivity status and process uptime:

```json
{
  "status": "healthy",
  "service": "product-service",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "database": "connected"
}
```

---

## Available Scripts

| Command       | Description                              |
|---------------|------------------------------------------|
| `npm start`   | Run the service in production mode       |
| `npm run dev` | Run with nodemon (auto-restart on change)|
| `npm test`    | Run Jest test suite                      |
| `npm run lint`| Lint code with ESLint                    |

---

## Dependencies

### Production

| Package        | Version   | Purpose                     |
|----------------|-----------|-----------------------------|
| `express`      | ^4.18.2   | Web framework               |
| `pg`           | ^8.11.3   | PostgreSQL client           |
| `prom-client`  | ^15.1.0   | Prometheus metrics exporter |
| `dotenv`       | ^16.3.1   | Environment variable loader |
| `cors`         | ^2.8.5    | CORS middleware             |

### Development

| Package        | Version   | Purpose                          |
|----------------|-----------|----------------------------------|
| `nodemon`      | ^3.0.2    | Auto-restart during development  |
| `jest`         | ^29.7.0   | Testing framework                |
| `eslint`       | ^8.56.0   | Code linter                      |

---

## Notes

- The database connection pool is configured with a max of **20 connections** and a 30-second idle timeout
- If an unrecoverable pool error occurs, the process exits with code `-1`
- The service handles `SIGTERM` and `SIGINT` gracefully, draining the connection pool before exit
- The Docker image runs as a **non-root user** (`nodejs`, UID 1001) for security
- Partial updates are supported on `PUT` — only fields provided in the request body are changed