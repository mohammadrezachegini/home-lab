# Payment Service

A RESTful microservice for payment processing and management, built with **FastAPI** and **PostgreSQL**. Part of the microservices e-commerce platform.

---

## Overview

The Payment Service handles all payment-related operations including creating payment records, tracking payment status, processing refunds, and querying payments by order. It exposes a REST API and integrates with Prometheus for metrics monitoring.

- **Language:** Python 3.11
- **Framework:** FastAPI
- **Database:** PostgreSQL (via SQLAlchemy ORM)
- **Port:** `8004`

---

## Features

- Create and track payments linked to orders
- Update payment status and transaction IDs
- Process refunds for completed payments
- Filter payments by `order_id` or `status`
- Custom Prometheus metric: **payments processed by method and status**
- Prometheus metrics (`/metrics`)
- Health check endpoint (`/health`)
- Auto-generated API docs via Swagger UI (`/docs`)
- CORS enabled for all origins
- Non-root Docker user for security

---

## Payment Statuses

| Status      | Description                              |
|-------------|------------------------------------------|
| `pending`   | Payment created but not yet processed    |
| `completed` | Payment successfully processed           |
| `failed`    | Payment processing failed                |
| `refunded`  | Payment has been refunded                |

---

## Project Structure

```
payment-service/
├── main.py              # Application entry point, routes, models
├── requirements.txt     # Python dependencies
├── Dockerfile           # Container build instructions
├── .env.example         # Environment variable template
└── .dockerignore        # Files excluded from Docker build
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL database running
- `pip` package manager

### Local Setup

1. **Clone the repository and navigate to the service:**

```bash
cd microservices-ecommerce-project/src/payment-service
```

2. **Create and activate a virtual environment:**

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**

```bash
pip install -r requirements.txt
```

4. **Set up environment variables:**

```bash
cp .env.example .env
# Edit .env with your actual database credentials
```

5. **Run the service:**

```bash
uvicorn main:app --host 0.0.0.0 --port 8004 --reload
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure the following:

| Variable      | Default       | Description                      |
|---------------|---------------|----------------------------------|
| `PORT`        | `8004`        | Port the service listens on      |
| `HOST`        | `0.0.0.0`     | Host binding                     |
| `DB_HOST`     | `localhost`   | PostgreSQL host                  |
| `DB_PORT`     | `5432`        | PostgreSQL port                  |
| `DB_NAME`     | `ecommerce`   | Database name                    |
| `DB_USER`     | `postgres`    | Database user                    |
| `DB_PASSWORD` | `postgres`    | Database password                |
| `ENVIRONMENT` | `development` | Runtime environment label        |

---

## Docker

### Build the image

```bash
docker build -t payment-service .
```

### Run the container

```bash
docker run -d \
  --name payment-service \
  -p 8004:8004 \
  --env-file .env \
  payment-service
```

### Docker Compose (recommended)

This service is designed to run as part of the full e-commerce stack using Docker Compose from the project root.

---

## API Endpoints

| Method   | Endpoint                              | Description                            |
|----------|---------------------------------------|----------------------------------------|
| `GET`    | `/health`                             | Health check                           |
| `GET`    | `/metrics`                            | Prometheus metrics                     |
| `GET`    | `/docs`                               | Swagger UI (API docs)                  |
| `POST`   | `/api/payments`                       | Create a new payment                   |
| `GET`    | `/api/payments`                       | List all payments (filterable)         |
| `GET`    | `/api/payments/{payment_id}`          | Get payment by ID                      |
| `GET`    | `/api/payments/order/{order_id}`      | Get all payments for an order          |
| `PUT`    | `/api/payments/{payment_id}`          | Update payment status / transaction ID |
| `POST`   | `/api/payments/{payment_id}/refund`   | Refund a completed payment             |
| `DELETE` | `/api/payments/{payment_id}`          | Delete a payment (admin only)          |

### Query Parameters for `GET /api/payments`

| Parameter  | Type    | Description                              |
|------------|---------|------------------------------------------|
| `order_id` | integer | Filter payments by order ID              |
| `status`   | string  | Filter by status (pending, completed...) |
| `skip`     | integer | Number of results to skip (default: 0)  |
| `limit`    | integer | Max results to return (default: 100)     |

---

### Example: Create Payment

**Request:**
```bash
curl -X POST http://localhost:8004/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 42,
    "amount": 149.99,
    "payment_method": "credit_card"
  }'
```

**Response:**
```json
{
  "id": 1,
  "order_id": 42,
  "amount": 149.99,
  "payment_method": "credit_card",
  "status": "pending",
  "transaction_id": null,
  "payment_date": null,
  "created_at": "2025-01-01T00:00:00",
  "updated_at": "2025-01-01T00:00:00"
}
```

### Example: Mark Payment as Completed

```bash
curl -X PUT http://localhost:8004/api/payments/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "transaction_id": "txn_abc123xyz"
  }'
```

> When status is set to `completed`, `payment_date` is automatically recorded.

### Example: Refund a Payment

```bash
curl -X POST http://localhost:8004/api/payments/1/refund \
  -H "Content-Type: application/json" \
  -d '{"reason": "Customer request"}'
```

> Only payments with status `completed` can be refunded. Attempting to refund a `pending` or `failed` payment returns a `400` error.

### Example: Get Payments by Order

```bash
curl http://localhost:8004/api/payments/order/42
```

---

## Monitoring

The service exposes Prometheus-compatible metrics at `/metrics`, tracking:

- **`http_requests_total`** — Total HTTP requests by method, endpoint, and status code
- **`http_request_duration_seconds`** — Request duration histogram by method and endpoint
- **`payments_total`** — Total payments processed, labelled by `payment_method` and `status`

The `payments_total` counter is incremented on payment creation and on every status change, giving you real-time visibility into payment throughput and outcomes.

---

## Health Check

```bash
curl http://localhost:8004/health
```

```json
{
  "status": "healthy",
  "service": "payment-service",
  "timestamp": "2025-01-01T00:00:00",
  "database": "connected"
}
```

---

## Dependencies

| Package              | Version    | Purpose                     |
|----------------------|------------|-----------------------------|
| `fastapi`            | 0.109.0    | Web framework               |
| `uvicorn`            | 0.27.0     | ASGI server                 |
| `sqlalchemy`         | 2.0.25     | ORM / database toolkit      |
| `psycopg2-binary`    | 2.9.9      | PostgreSQL driver           |
| `pydantic`           | 2.5.3      | Data validation             |
| `python-dotenv`      | 1.0.0      | Environment variable loader |
| `prometheus-client`  | 0.19.0     | Metrics exporter            |

---

## Notes

- Payments are created with `pending` status by default — use `PUT` to advance the status after processing
- `payment_date` is set automatically when status transitions to `completed`
- Only `completed` payments are eligible for refund — the service enforces this with a `400` validation error
- The `transaction_id` field is unique and indexed for fast lookups
- The Docker image runs as a **non-root user** (`appuser`, UID 1001) for security
- Database tables are created automatically on startup via SQLAlchemy