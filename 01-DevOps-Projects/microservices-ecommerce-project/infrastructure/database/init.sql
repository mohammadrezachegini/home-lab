-- E-Commerce Database Schema

-- Drop existing tables
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    category VARCHAR(100),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    transaction_id VARCHAR(255) UNIQUE,
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Inventory table
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    warehouse_location VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    last_restocked TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(product_id, warehouse_location)
);

-- Insert sample data
INSERT INTO products (name, description, price, stock, category) VALUES
('Laptop Pro 15', 'High-performance laptop', 1299.99, 50, 'Electronics'),
('Wireless Mouse', 'Ergonomic mouse', 29.99, 200, 'Accessories'),
('Mechanical Keyboard', 'RGB keyboard', 89.99, 100, 'Accessories'),
('4K Monitor', '27-inch monitor', 399.99, 75, 'Electronics'),
('USB-C Hub', '7-in-1 hub', 49.99, 150, 'Accessories');

INSERT INTO users (email, username, hashed_password, full_name) VALUES
('john@example.com', 'johndoe', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6JhSfLCNlVZz8KZzMZLGy9MZL9sYS', 'John Doe'),
('jane@example.com', 'janesmith', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6JhSfLCNlVZz8KZzMZLGy9MZL9sYS', 'Jane Smith');

INSERT INTO orders (user_id, product_id, quantity, total_price, status) VALUES
(1, 1, 1, 1299.99, 'completed'),
(1, 2, 2, 59.98, 'pending'),
(2, 4, 1, 399.99, 'processing');

INSERT INTO payments (order_id, amount, payment_method, status) VALUES
(1, 1299.99, 'credit_card', 'completed'),
(3, 399.99, 'paypal', 'completed');

INSERT INTO inventory (product_id, warehouse_location, quantity) VALUES
(1, 'Warehouse A', 50),
(2, 'Warehouse A', 100),
(3, 'Warehouse A', 100),
(4, 'Warehouse A', 75),
(5, 'Warehouse A', 150);