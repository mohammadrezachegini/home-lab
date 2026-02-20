# Database Schema & Initialization

This directory contains the SQL initialization script for the e-commerce platform's PostgreSQL database. It defines the complete schema across all five microservices and seeds the database with sample data for local development and testing.

---

## File

```
infrastructure/database/
└── init.sql    # Full schema + sample seed data
```

---

## Schema Overview

All five microservices share a single PostgreSQL database named `ecommerce`. Tables are created in dependency order to satisfy foreign key constraints.

```
products ──┐
           ├──► orders ──► payments
users ─────┘
products ──► inventory
```

---

## Tables

### `products`

The product catalog. Referenced by both `orders` and `inventory`.

| Column       | Type            | Constraints              | Description                      |
|--------------|-----------------|--------------------------|----------------------------------|
| `id`         | SERIAL          | PRIMARY KEY              | Auto-generated product ID        |
| `name`       | VARCHAR(255)    | NOT NULL                 | Product name                     |
| `description`| TEXT            |                          | Full product description         |
| `price`      | DECIMAL(10,2)   | NOT NULL                 | Unit price                       |
| `stock`      | INTEGER         | DEFAULT 0                | Stock count (product-service use)|
| `category`   | VARCHAR(100)    |                          | Product category                 |
| `image_url`  | VARCHAR(500)    |                          | Optional product image URL       |
| `created_at` | TIMESTAMP       | DEFAULT CURRENT_TIMESTAMP| Record creation time             |
| `updated_at` | TIMESTAMP       | DEFAULT CURRENT_TIMESTAMP| Last update time                 |

---

### `users`

Registered users. Referenced by `orders`.

| Column            | Type          | Constraints               | Description                      |
|-------------------|---------------|---------------------------|----------------------------------|
| `id`              | SERIAL        | PRIMARY KEY               | Auto-generated user ID           |
| `email`           | VARCHAR(255)  | UNIQUE, NOT NULL          | User email address               |
| `username`        | VARCHAR(100)  | UNIQUE, NOT NULL          | Username (login handle)          |
| `hashed_password` | VARCHAR(255)  | NOT NULL                  | bcrypt-hashed password           |
| `full_name`       | VARCHAR(255)  |                           | Display name                     |
| `phone`           | VARCHAR(50)   |                           | Contact phone number             |
| `address`         | TEXT          |                           | Shipping address                 |
| `created_at`      | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP | Record creation time             |
| `updated_at`      | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP | Last update time                 |

---

### `orders`

Orders placed by users for products. Referenced by `payments`.

| Column        | Type          | Constraints                      | Description                         |
|---------------|---------------|----------------------------------|-------------------------------------|
| `id`          | SERIAL        | PRIMARY KEY                      | Auto-generated order ID             |
| `user_id`     | INTEGER       | NOT NULL, FK → users(id)         | The user who placed the order       |
| `product_id`  | INTEGER       | NOT NULL, FK → products(id)      | The product ordered                 |
| `quantity`    | INTEGER       | NOT NULL, DEFAULT 1              | Number of units ordered             |
| `total_price` | DECIMAL(10,2) | NOT NULL                         | Total cost at time of order         |
| `status`      | VARCHAR(50)   | DEFAULT 'pending'                | Order lifecycle status              |
| `order_date`  | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP        | When the order was placed           |
| `created_at`  | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP        | Record creation time                |
| `updated_at`  | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP        | Last update time                    |

**Foreign keys:** `user_id` and `product_id` cascade on delete.

---

### `payments`

Payment records linked to orders.

| Column           | Type          | Constraints                   | Description                                |
|------------------|---------------|-------------------------------|--------------------------------------------|
| `id`             | SERIAL        | PRIMARY KEY                   | Auto-generated payment ID                  |
| `order_id`       | INTEGER       | NOT NULL, FK → orders(id)     | The order this payment belongs to          |
| `amount`         | DECIMAL(10,2) | NOT NULL                      | Payment amount                             |
| `payment_method` | VARCHAR(50)   | NOT NULL                      | e.g. `credit_card`, `paypal`, `stripe`     |
| `status`         | VARCHAR(50)   | DEFAULT 'pending'             | `pending`, `completed`, `failed`, `refunded`|
| `transaction_id` | VARCHAR(255)  | UNIQUE                        | External transaction reference             |
| `payment_date`   | TIMESTAMP     |                               | Set when status becomes `completed`        |
| `created_at`     | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP     | Record creation time                       |
| `updated_at`     | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP     | Last update time                           |

**Foreign key:** `order_id` cascades on delete.

---

### `inventory`

Stock levels per product per warehouse location.

| Column               | Type          | Constraints                         | Description                                  |
|----------------------|---------------|-------------------------------------|----------------------------------------------|
| `id`                 | SERIAL        | PRIMARY KEY                         | Auto-generated record ID                     |
| `product_id`         | INTEGER       | NOT NULL, FK → products(id)         | The product being tracked                    |
| `warehouse_location` | VARCHAR(255)  | NOT NULL                            | Warehouse identifier (e.g. `Warehouse A`)    |
| `quantity`           | INTEGER       | DEFAULT 0                           | Total units in stock                         |
| `reserved_quantity`  | INTEGER       | DEFAULT 0                           | Units reserved for pending orders            |
| `last_restocked`     | TIMESTAMP     |                                     | Timestamp of last restock operation          |
| `created_at`         | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP           | Record creation time                         |
| `updated_at`         | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP           | Last update time                             |

**Constraints:**
- `UNIQUE(product_id, warehouse_location)` — prevents duplicate records per product + warehouse combination
- `product_id` cascades on delete

**Available stock** = `quantity - reserved_quantity`

---

## Seed Data

The script inserts sample data for development and testing:

### Products (5 records)

| ID | Name                 | Category      | Price    | Stock |
|----|----------------------|---------------|----------|-------|
| 1  | Laptop Pro 15        | Electronics   | $1299.99 | 50    |
| 2  | Wireless Mouse       | Accessories   | $29.99   | 200   |
| 3  | Mechanical Keyboard  | Accessories   | $89.99   | 100   |
| 4  | 4K Monitor           | Electronics   | $399.99  | 75    |
| 5  | USB-C Hub            | Accessories   | $49.99   | 150   |

### Users (2 records)

| ID | Username   | Email               | Full Name   |
|----|------------|---------------------|-------------|
| 1  | johndoe    | john@example.com    | John Doe    |
| 2  | janesmith  | jane@example.com    | Jane Smith  |

> Passwords are pre-hashed with bcrypt. The raw password for both seed users is not stored in plain text — replace these hashes before use in any shared environment.

### Orders (3 records)

| ID | User     | Product          | Qty | Total     | Status       |
|----|----------|------------------|-----|-----------|--------------|
| 1  | johndoe  | Laptop Pro 15    | 1   | $1299.99  | `completed`  |
| 2  | johndoe  | Wireless Mouse   | 2   | $59.98    | `pending`    |
| 3  | janesmith| 4K Monitor       | 1   | $399.99   | `processing` |

### Payments (2 records)

| ID | Order | Amount    | Method        | Status      |
|----|-------|-----------|---------------|-------------|
| 1  | 1     | $1299.99  | `credit_card` | `completed` |
| 2  | 3     | $399.99   | `paypal`      | `completed` |

> Order 2 (pending Wireless Mouse) has no payment record yet — useful for testing the payment creation flow.

### Inventory (5 records — all in Warehouse A)

| Product             | Warehouse   | Quantity |
|---------------------|-------------|----------|
| Laptop Pro 15       | Warehouse A | 50       |
| Wireless Mouse      | Warehouse A | 100      |
| Mechanical Keyboard | Warehouse A | 100      |
| 4K Monitor          | Warehouse A | 75       |
| USB-C Hub           | Warehouse A | 150      |

---

## Usage

### Run against a local PostgreSQL instance

```bash
psql -U postgres -d ecommerce -f infrastructure/database/init.sql
```

### Run inside the PostgreSQL Docker container

```bash
docker exec -i <postgres-container-name> psql -U postgres -d ecommerce < infrastructure/database/init.sql
```

### Run inside the Kubernetes PostgreSQL pod

```bash
kubectl exec -it postgres-0 -n ecommerce -- psql -U postgres -d ecommerce
# Then paste or pipe the contents of init.sql
```

Or copy and execute in one step:

```bash
kubectl exec -i postgres-0 -n ecommerce -- psql -U postgres -d ecommerce < infrastructure/database/init.sql
```

---

## Notes

- The script opens with `DROP TABLE IF EXISTS ... CASCADE` to allow clean re-initialization during development. **Do not run this against a production database with live data.**
- Tables are dropped and recreated in reverse dependency order to avoid foreign key violations on drop.
- The `inventory` table enforces `UNIQUE(product_id, warehouse_location)` at the database level, mirroring the application-level `409 Conflict` check in the inventory service.
- The `transaction_id` column in `payments` is `UNIQUE` — duplicate transaction IDs will be rejected at the database level.
- `email` and `username` in the `users` table are both `UNIQUE` — duplicate registrations are caught at the DB level regardless of service-level validation.