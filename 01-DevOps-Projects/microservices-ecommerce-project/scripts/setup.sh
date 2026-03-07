#!/bin/bash

# Microservices E-Commerce - Initial Setup Script

echo "🚀 Setting up Microservices E-Commerce Platform..."
echo ""

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Create .env files for each service
echo "📝 Creating environment files..."

# Product Service
cat > src/product-service/.env << 'ENVEOF'
PORT=8001
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ecommerce
DB_USER=postgres
DB_PASSWORD=postgres
NODE_ENV=development
ENVEOF

# User Service
cat > src/user-service/.env << 'ENVEOF'
PORT=8002
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ecommerce
DB_USER=postgres
DB_PASSWORD=postgres
ENVEOF

# Order Service
cat > src/order-service/.env << 'ENVEOF'
PORT=8003
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ecommerce
DB_USER=postgres
DB_PASSWORD=postgres
ENVEOF

echo "✅ Environment files created"
echo ""

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start building services (Day 4)"
echo "2. Run: cd src/product-service && npm install"
