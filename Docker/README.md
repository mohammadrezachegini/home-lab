# Docker-Projects
# Docker Projects

A complete collection of Docker examples and demonstrations for learning containerization concepts through practical, real-world examples.

## Overview

This repository contains comprehensive Docker examples covering fundamental concepts to advanced deployment patterns. Each section includes working code examples, configuration files, and detailed demonstrations.

## Repository Structure

```
Docker/
├── Build-Docker-Image-Push-to-DockerHub/
├── Docker-Compose-*/
├── Docker-Ports/
├── Dockerfile-*/
└── README.md
```

## Getting Started

### Requirements
- Docker Engine installed
- Docker Compose installed
- Basic command line knowledge

### Quick Start
1. Clone this repository
2. Navigate to any example directory
3. Follow the instructions in each section below

## Core Docker Concepts

### 1. Dockerfile Instructions

#### Basic Instructions
- **FROM**: Set base image
- **COPY/ADD**: Copy files to container
- **RUN**: Execute build commands
- **EXPOSE**: Document port usage
- **CMD**: Default container command
- **ENTRYPOINT**: Fixed entry point

#### Advanced Instructions
- **ARG**: Build-time variables
- **ENV**: Runtime environment variables
- **USER**: Set container user
- **WORKDIR**: Set working directory
- **HEALTHCHECK**: Container health monitoring
- **LABELS**: Metadata and documentation

### 2. Docker Ports Configuration

#### Single Port Example
```dockerfile
FROM nginx:alpine-slim
COPY index.html /usr/share/nginx/html
EXPOSE 80
```

#### Multi-Port Example
```dockerfile
FROM nginx:alpine-slim
EXPOSE 8080 8081 8082
```

### 3. Build Arguments and Environment Variables

#### Build-time Arguments
```dockerfile
ARG NGINX_VERSION=1.26
FROM nginx:${NGINX_VERSION}-alpine-slim
```

#### Runtime Environment
```dockerfile
ENV APP_ENVIRONMENT=production
```

## Docker Compose Examples

### 1. Basic Application Stack
Simple web application with database:
```yaml
services:
  web:
    build: .
    ports:
      - "8080:8080"
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
```

### 2. Multi-Service Architecture
Complete application with reverse proxy, application servers, and database:
- **NGINX**: Load balancer and reverse proxy
- **Application**: User management web application
- **MySQL**: Database service
- **Networking**: Frontend and backend networks

### 3. Advanced Features

#### Health Checks
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

#### Service Dependencies
```yaml
depends_on:
  db-mysql:
    condition: service_healthy
    restart: true
```

#### Volume Management
```yaml
volumes:
  - mydb:/var/lib/mysql
```

#### Network Configuration
```yaml
networks:
  frontend:
  backend:
```

## Development Workflows

### 1. Development Watch Mode
Real-time file synchronization during development:
```yaml
develop:
  watch:
    - path: ./web/html
      action: sync
      target: /usr/share/nginx/html
```

### 2. Build Process
Building applications within Docker Compose:
```yaml
services:
  web:
    build:
      context: ./python-app
      dockerfile: Dockerfile
```

### 3. Environment Profiles
Different configurations for different environments:
```yaml
profiles: ["debug"]
```

## NodeJS Application Example

Complete NodeJS application with MongoDB:
- **Express.js**: Web framework
- **MongoDB**: Database
- **Docker Compose**: Orchestration
- **File uploads**: Image handling
- **Authentication**: JWT tokens
- **API documentation**: Swagger

### Features
- Recipe management system
- User authentication
- File upload handling
- API documentation
- Database integration
- Environment configuration

## Deployment Patterns

### 1. Startup Order Control
Ensuring services start in correct order:
```yaml
depends_on:
  app-ums:
    condition: service_healthy
    restart: true
```

### 2. Load Balancing
NGINX configuration for multiple application instances:
```nginx
upstream app-ums {
  server app-ums:8080;
  ip_hash;
}
```

### 3. Network Isolation
Separate networks for different tiers:
- Frontend network for web traffic
- Backend network for database communication

## Best Practices

### Security
- Use non-root users in containers
- Implement health checks
- Use specific image tags
- Minimize image layers

### Performance
- Multi-stage builds
- Efficient layer caching
- Proper resource limits
- Volume mounting for data persistence

### Maintenance
- Clear documentation with labels
- Consistent naming conventions
- Environment-specific configurations
- Proper logging configuration

## Example Usage

### Building and Running Single Container
```bash
# Build image
docker build -t my-app .

# Run container
docker run -p 8080:80 my-app
```

### Docker Compose Operations
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Build and start
docker-compose up --build
```

### Development Workflow
```bash
# Start with file watching
docker-compose watch

# Run specific profile
docker-compose --profile debug up
```

## Troubleshooting

### Common Issues
- Port conflicts: Check port availability
- Permission errors: Verify user permissions
- Network connectivity: Check network configuration
- Resource limits: Monitor system resources

### Debugging Tools
- Container logs: `docker-compose logs`
- Service status: `docker-compose ps`
- Network inspection: `docker network ls`
- Volume management: `docker volume ls`


## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/dev-best-practices/)