#!/bin/bash

# Microservices E-Commerce - Cleanup Script

echo "🧹 Cleaning up Microservices E-Commerce Platform..."
echo ""

# Stop Docker Compose
if [ -f "docker-compose.yml" ]; then
    echo "Stopping Docker Compose..."
    docker-compose down -v
fi

# Remove Docker images
echo "Removing Docker images..."
docker rmi product-service:v1 user-service:v1 order-service:v1 2>/dev/null || true

# Clean Node.js
echo "Cleaning Node.js dependencies..."
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
find . -name "package-lock.json" -delete

# Clean Python
echo "Cleaning Python artifacts..."
find . -name "__pycache__" -type d -prune -exec rm -rf '{}' +
find . -name "*.pyc" -delete
find . -name "venv" -type d -prune -exec rm -rf '{}' +

# Clean Go
echo "Cleaning Go binaries..."
find . -name "main" -type f -delete

echo ""
echo "✅ Cleanup complete!"
