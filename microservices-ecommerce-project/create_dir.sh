# Create all directories
mkdir -p src/{product-service,user-service,order-service,payment-service,inventory-service,frontend}
mkdir -p infrastructure/{database,nginx,kubernetes,terraform,ansible}
mkdir -p infrastructure/kubernetes/{namespaces,deployments,services,configmaps,secrets,ingress,hpa}
mkdir -p monitoring/{prometheus,grafana,loki}
mkdir -p monitoring/grafana/{dashboards,datasources}
mkdir -p ci-cd/.github/workflows
mkdir -p scripts
mkdir -p docs
mkdir -p tests/{unit,integration,e2e}

# Verify structure
tree -L 3 -d
# or if tree is not installed:
find . -type d | sort
