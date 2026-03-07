#!/bin/bash

echo "🔍 Verifying Development Environment..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check function
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 is installed${NC}"
        $1 --version 2>&1 | head -n 1
    else
        echo -e "${RED}❌ $1 is NOT installed${NC}"
        return 1
    fi
    echo ""
}

# Check Docker
echo "Checking Docker..."
if docker run hello-world &> /dev/null; then
    echo -e "${GREEN}✅ Docker is working${NC}"
    docker --version
else
    echo -e "${RED}❌ Docker is NOT working${NC}"
fi
echo ""

# Check other tools
check_command docker-compose
check_command kubectl
check_command node
check_command npm
check_command python3
check_command pip3
check_command go
check_command git

# Check ports availability
echo "Checking port availability..."
for port in 3000 5432 8001 8002 8003 8080 9090 3001; do
    if ! lsof -i :$port &> /dev/null; then
        echo -e "${GREEN}✅ Port $port is available${NC}"
    else
        echo -e "${RED}⚠️  Port $port is in use${NC}"
    fi
done
echo ""

# Check disk space
echo "Checking disk space..."
df -h | grep -E "Filesystem|/$" 
echo ""

# Check memory
echo "Checking available memory..."
if command -v free &> /dev/null; then
    free -h | grep -E "Mem:"
else
    # macOS
    echo "Total RAM: $(sysctl -n hw.memsize | awk '{print $0/1024/1024/1024 " GB"}')"
fi
echo ""

echo "✅ Verification complete!"
echo ""
echo "If all checks passed, you're ready for Day 2! 🚀"
