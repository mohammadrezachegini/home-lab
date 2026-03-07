#!/bin/bash

echo "🔍 Verifying Project Structure..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1"
    else
        echo -e "${RED}❌${NC} $1 (missing)"
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $1/"
    else
        echo -e "${RED}❌${NC} $1/ (missing)"
    fi
}

echo "Core Files:"
check_file "README.md"
check_file ".gitignore"
check_file "infrastructure/database/init.sql"
check_file "scripts/setup.sh"
check_file "scripts/cleanup.sh"

echo ""
echo "Service Directories:"
check_dir "src/product-service"
check_dir "src/user-service"
check_dir "src/order-service"
check_dir "src/payment-service"
check_dir "src/inventory-service"

echo ""
echo "Infrastructure Directories:"
check_dir "infrastructure/kubernetes"
check_dir "infrastructure/nginx"
check_dir "monitoring/prometheus"
check_dir "monitoring/grafana"

echo ""
echo "Git Status:"
if [ -d ".git" ]; then
    echo -e "${GREEN}✅${NC} Git repository initialized"
    echo "   Commits: $(git rev-list --count HEAD)"
else
    echo -e "${RED}❌${NC} Git repository not initialized"
fi

echo ""
echo "✅ Structure verification complete!"
