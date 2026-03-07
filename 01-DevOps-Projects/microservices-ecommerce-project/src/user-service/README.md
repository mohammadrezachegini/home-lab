# User Service

A RESTful microservice for user management and authentication, built with **FastAPI** and **PostgreSQL**. Part of the microservices e-commerce platform.

---

## Overview

The User Service handles all user-related operations including registration, profile management, and credential verification. It exposes a REST API and integrates with Prometheus for metrics monitoring.

- **Language:** Python 3.11
- **Framework:** FastAPI
- **Database:** PostgreSQL (via SQLAlchemy ORM)
- **Port:** `8002`

---

## Features

- Create, read, update, and delete users (CRUD)
- Password hashing with **bcrypt**
- Login / credential verification endpoint
- Prometheus metrics (`/metrics`)
- Health check endpoint (`/health`)
- Auto-generated API docs via Swagger UI (`/docs`)
- CORS enabled for all origins
- Non-root Docker user for security

---

## Project Structure

```
user-service/
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
cd microservices-ecommerce-project/src/user-service
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
# Edit .env with your actual database credentials and secret key
```

5. **Run the service:**

```bash
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure the following:

| Variable                    | Default       | Description                         |
|-----------------------------|---------------|-------------------------------------|
| `PORT`                      | `8002`        | Port the service listens on         |
| `HOST`                      | `0.0.0.0`     | Host binding                        |
| `DB_HOST`                   | `localhost`   | PostgreSQL host                     |
| `DB_PORT`                   | `5432`        | PostgreSQL port                     |
| `DB_NAME`                   | `ecommerce`   | Database name                       |
| `DB_USER`                   | `postgres`    | Database user                       |
| `DB_PASSWORD`               | `postgres`    | Database password                   |
| `SECRET_KEY`                | —             | JWT secret key (change in prod!)    |
| `ALGORITHM`                 | `HS256`       | JWT signing algorithm               |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30`        | Token expiry duration               |
| `ENVIRONMENT`               | `development` | Runtime environment label           |

---

## Docker

### Build the image

```bash
docker build -t user-service .
```

### Run the container

```bash
docker run -d \
  --name user-service \
  -p 8002:8002 \
  --env-file .env \
  user-service
```

### Docker Compose (recommended)

This service is designed to run as part of the full e-commerce stack using Docker Compose from the project root.

---

## API Endpoints

| Method   | Endpoint                          | Description                  |
|----------|-----------------------------------|------------------------------|
| `GET`    | `/health`                         | Health check                 |
| `GET`    | `/metrics`                        | Prometheus metrics           |
| `GET`    | `/docs`                           | Swagger UI (API docs)        |
| `POST`   | `/api/users`                      | Create a new user            |
| `GET`    | `/api/users`                      | List all users (paginated)   |
| `GET`    | `/api/users/{user_id}`            | Get user by ID               |
| `GET`    | `/api/users/username/{username}`  | Get user by username         |
| `PUT`    | `/api/users/{user_id}`            | Update user                  |
| `DELETE` | `/api/users/{user_id}`            | Delete user                  |
| `POST`   | `/api/users/login`                | Verify credentials (login)   |

### Example: Create User

**Request:**
```bash
curl -X POST http://localhost:8002/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "reza@example.com",
    "username": "reza_dev",
    "password": "securepass123",
    "full_name": "Reza DevOps"
  }'
```

**Response:**
```json
{
  "id": 1,
  "email": "reza@example.com",
  "username": "reza_dev",
  "full_name": "Reza DevOps",
  "phone": null,
  "address": null,
  "created_at": "2025-01-01T00:00:00",
  "updated_at": "2025-01-01T00:00:00"
}
```

### Example: Login

**Request:**
```bash
curl -X POST http://localhost:8002/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username": "reza_dev", "password": "securepass123"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user_id": 1,
  "username": "reza_dev"
}
```

---

## Monitoring

The service exposes Prometheus-compatible metrics at `/metrics`, tracking:

- **`http_requests_total`** — Total HTTP requests by method, endpoint, and status code
- **`http_request_duration_seconds`** — Request duration histogram by method and endpoint

These metrics are scraped by Prometheus and visualized in Grafana as part of the full stack monitoring setup.

---

## Health Check

```bash
curl http://localhost:8002/health
```

Returns database connectivity status and service info:

```json
{
  "status": "healthy",
  "service": "user-service",
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
| `bcrypt`             | 4.1.2      | Password hashing            |
| `python-jose`        | 3.3.0      | JWT support                 |
| `prometheus-client`  | 0.19.0     | Metrics exporter            |
| `python-dotenv`      | 1.0.0      | Environment variable loader |

---

## Notes

- Passwords are **never returned** in any API response
- The Docker image runs as a **non-root user** (`appuser`, UID 1001) for security
- Database tables are created automatically on startup via SQLAlchemy
- Pagination is supported on `GET /api/users` via `skip` and `limit` query params