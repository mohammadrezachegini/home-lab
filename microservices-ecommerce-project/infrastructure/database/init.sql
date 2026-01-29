-- Microservices E-Commerce Platform - Database Initialization
-- PostgreSQL 15+

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    category VARCHAR(100),
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    transaction_id VARCHAR(255) UNIQUE,
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_location VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    last_restocked TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, warehouse_location)
);

-- Create indexes for better performance
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_inventory_product_id ON inventory(product_id);

-- Insert sample products
INSERT INTO products (name, description, price, stock, category) VALUES
    ('Gaming Laptop', 'High-performance gaming laptop with RTX 4080 GPU', 1999.99, 50, 'Electronics'),
    ('Mechanical Keyboard', 'RGB mechanical keyboard with Cherry MX Blue switches', 149.99, 200, 'Accessories'),
    ('Gaming Mouse', 'Wireless gaming mouse with 25000 DPI sensor', 79.99, 150, 'Accessories'),
    ('Gaming Headset', '7.1 Surround sound gaming headset with noise cancellation', 129.99, 100, 'Accessories'),
    ('27" 4K Monitor', '4K 144Hz gaming monitor with HDR support', 599.99, 75, 'Electronics'),
    ('Ergonomic Chair', 'Premium ergonomic gaming chair with lumbar support', 349.99, 60, 'Furniture'),
    ('Webcam HD', '1080p webcam with auto-focus and dual microphones', 89.99, 120, 'Accessories'),
    ('USB-C Hub', '7-in-1 USB-C hub with HDMI and Ethernet', 49.99, 300, 'Accessories'),
    ('External SSD', '1TB external SSD with USB 3.2 Gen 2 (10Gbps)', 119.99, 180, 'Storage'),
    ('Graphics Tablet', 'Professional graphics tablet for digital art', 199.99, 45, 'Electronics');

-- Insert sample users (password: 'password123' - hashed with bcrypt)
-- Note: In production, use proper password hashing
INSERT INTO users (email, username, hashed_password, full_name, phone) VALUES
    ('john.doe@example.com', 'john_doe', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYmP.1XbOcu', 'John Doe', '+1-555-0101'),
    ('jane.smith@example.com', 'jane_smith', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYmP.1XbOcu', 'Jane Smith', '+1-555-0102'),
    ('bob.wilson@example.com', 'bob_wilson', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYmP.1XbOcu', 'Bob Wilson', '+1-555-0103'),
    ('alice.brown@example.com', 'alice_brown', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYmP.1XbOcu', 'Alice Brown', '+1-555-0104'),
    ('charlie.davis@example.com', 'charlie_davis', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYmP.1XbOcu', 'Charlie Davis', '+1-555-0105');

-- Insert sample orders
INSERT INTO orders (user_id, product_id, quantity, total_price, status) VALUES
    (1, 1, 1, 1999.99, 'completed'),
    (1, 2, 2, 299.98, 'completed'),
    (2, 3, 1, 79.99, 'shipped'),
    (2, 5, 1, 599.99, 'processing'),
    (3, 4, 1, 129.99, 'pending'),
    (4, 6, 1, 349.99, 'completed'),
    (5, 7, 2, 179.98, 'processing');

-- Insert sample payments
INSERT INTO payments (order_id, amount, payment_method, status, transaction_id, payment_date) VALUES
    (1, 1999.99, 'credit_card', 'completed', 'TXN001', NOW() - INTERVAL '5 days'),
    (2, 299.98, 'credit_card', 'completed', 'TXN002', NOW() - INTERVAL '4 days'),
    (3, 79.99, 'paypal', 'completed', 'TXN003', NOW() - INTERVAL '3 days'),
    (4, 599.99, 'credit_card', 'pending', 'TXN004', NULL),
    (6, 349.99, 'debit_card', 'completed', 'TXN006', NOW() - INTERVAL '7 days');

-- Insert sample inventory
INSERT INTO inventory (product_id, warehouse_location, quantity, reserved_quantity) VALUES
    (1, 'Warehouse A', 30, 5),
    (1, 'Warehouse B', 15, 0),
    (2, 'Warehouse A', 150, 10),
    (3, 'Warehouse A', 100, 5),
    (4, 'Warehouse B', 80, 5),
    (5, 'Warehouse A', 50, 10),
    (6, 'Warehouse B', 40, 5),
    (7, 'Warehouse A', 90, 8),
    (8, 'Warehouse A', 200, 20),
    (9, 'Warehouse B', 140, 15),
    (10, 'Warehouse A', 35, 5);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify data
SELECT 'Products count:' AS info, COUNT(*) AS count FROM products;
SELECT 'Users count:' AS info, COUNT(*) AS count FROM users;
SELECT 'Orders count:' AS info, COUNT(*) AS count FROM orders;
SELECT 'Payments count:' AS info, COUNT(*) AS count FROM payments;
SELECT 'Inventory count:' AS info, COUNT(*) AS count FROM inventory;
