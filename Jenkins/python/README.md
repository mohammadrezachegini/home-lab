# Jenkins Pipeline for Python Applications

## Overview

This project demonstrates a Jenkins CI/CD pipeline specifically designed for Python applications. The pipeline integrates Python dependency management, Docker containerization, DockerHub registry, and Kubernetes deployment using a dedicated worker agent. This example showcases how to build, test, containerize, and deploy Python applications (Flask, Django, FastAPI, etc.) using Jenkins automation with distributed build architecture.

## Jenkins Concepts

This pipeline demonstrates the following Jenkins concepts:

- **Declarative Pipeline Syntax**: Modern, maintainable pipeline structure
- **Agent Labels**: Uses dedicated worker agent for Python builds
- **Build Options**: Log rotation and build retention policies
- **Environment Variables**: Secure credential management
- **Credentials Binding**: Automatic injection of DockerHub credentials
- **Distributed Builds**: Leverages Jenkins worker nodes
- **Post-Build Actions**: Comprehensive status reporting
- **Agent-Based Execution**: All stages run on labeled agent

## Prerequisites

### Jenkins Configuration

- Jenkins server (version 2.300+)
- Jenkins worker node with label 'worker'
- Required Jenkins plugins:
  - Pipeline plugin
  - Git plugin
  - Docker Pipeline plugin
  - Credentials Binding plugin
  - Kubernetes CLI plugin

### Worker Agent Requirements

The pipeline requires a Jenkins worker agent labeled 'worker' with:
- **Python**: Version 3.7+ installed
- **pip**: Python package installer
- **Docker**: For building container images
- **kubectl**: Kubernetes CLI for deployment
- **Git**: For source code checkout

#### Setting Up Jenkins Worker Agent

```bash
# On worker machine
# Install Python
sudo apt-get update
sudo apt-get install python3 python3-pip python3-venv -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker jenkins

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify installations
python3 --version
pip3 --version
docker --version
kubectl version --client
```

### External Services

- **DockerHub Account**: For container image storage
- **GitHub Repository**: Source code repository
- **Kubernetes Cluster**: For application deployment

### Credentials Setup

Configure the following credentials in Jenkins:

- **docker-hub**: DockerHub credentials
  - Type: Username with password
  - Username: Your DockerHub username
  - Password: Your DockerHub password or access token
  - ID: `docker-hub`
  - Description: DockerHub Credentials

## Project Structure

```
python/
├── python-project      # Jenkins pipeline definition (Jenkinsfile)
└── README.md          # This documentation
```

Expected Python repository structure:
```
Source Repository/
├── requirements.txt   # Python dependencies
├── Dockerfile        # Docker image definition
├── Application.yaml  # Kubernetes deployment manifests
├── .dockerignore    # Files to exclude from Docker
├── .gitignore       # Files to exclude from git
├── app.py           # Main application file (Flask/FastAPI)
├── wsgi.py          # WSGI entry point (for production)
├── config.py        # Configuration file
└── tests/           # Test files
    ├── __init__.py
    └── test_app.py
```

## Pipeline Configuration

### Agent Configuration

```groovy
agent {
    label 'worker'
}
```

**Purpose**:
- Executes all pipeline stages on a Jenkins agent labeled 'worker'
- Allows dedicated Python build environment
- Enables distributed builds and load balancing
- Isolates Python builds from master node

### Build Options

```groovy
options {
    buildDiscarder logRotator(
        artifactDaysToKeepStr: '',
        artifactNumToKeepStr: '',
        daysToKeepStr: '7',
        numToKeepStr: '2'
    )
}
```

**Retention Policy**:
- Keeps builds for 7 days maximum
- Maintains last 2 builds
- Optimized for active development
- Automatic cleanup of old builds

### Environment Variables

```groovy
environment {
    dockercred = credentials('docker-hub')
}
```

**Available Variables**:
- `$dockercred_USR`: DockerHub username
- `$dockercred_PSW`: DockerHub password
- Credentials injected securely at runtime

### Pipeline Stages

The pipeline consists of 4 well-defined stages:

#### 1. Checkout Stage
```groovy
stage('CheckOut') {
    steps {
        checkout scmGit(
            branches: [[name: '*/master']],
            extensions: [],
            userRemoteConfigs: [[url: 'https://github.com/mohammadrezachegini/Node-JS-Jenkins']]
        )
    }
}
```

**Purpose**: Clone source code from GitHub
**Branch**: master
**Note**: Update URL to your Python application repository

#### 2. Build Stage
```groovy
stage('build stage') {
    steps {
        sh 'pip3 install -r requirements.txt'
    }
}
```

**Purpose**: Install Python dependencies
**Operations**:
- Reads requirements.txt
- Installs all Python packages
- Creates virtual environment context
- Resolves and installs transitive dependencies

**What gets installed**:
- Application dependencies (Flask, Django, FastAPI, etc.)
- Development dependencies (pytest, flake8, etc.)
- System libraries required by packages

#### 3. Docker Build and Push Stage
```groovy
stage('Docker build') {
    steps {
        sh 'docker -v'
        sh 'docker build -t lowyiiii/python-project:latest .'
        sh 'echo $dockercred_PSW | docker login -u $dockercred_USR --password-stdin'
        sh 'docker push lowyiiii/python-project:latest'
    }
}
```

**Purpose**: Build and publish container image
**Operations**:
1. Verify Docker availability
2. Build Docker image with 'latest' tag
3. Authenticate with DockerHub (secure stdin method)
4. Push image to DockerHub registry

**Image Details**:
- Repository: lowyiiii/python-project
- Tag: latest
- Update with your DockerHub repository

#### 4. Kubernetes Deployment Stage
```groovy
stage('kubectl stage') {
    steps {
        sh 'kubectl apply -f Application.yaml'
    }
}
```

**Purpose**: Deploy application to Kubernetes
**Operations**:
- Applies Kubernetes manifests
- Creates or updates deployments
- Creates or updates services
- Kubernetes performs rolling update

## Usage

### Setting Up Jenkins Worker Agent

#### 1. Create Worker Node in Jenkins

```
Manage Jenkins > Manage Nodes and Clouds > New Node
- Node name: worker-python
- Type: Permanent Agent
- Number of executors: 2
- Remote root directory: /home/jenkins/agent
- Labels: worker
- Usage: Use this node as much as possible
- Launch method: Launch agent via SSH
  - Host: <worker-ip>
  - Credentials: <ssh-credentials>
  - Host Key Verification Strategy: Non verifying
- Save
```

#### 2. Configure Credentials

```
Manage Jenkins > Credentials > System > Global credentials
- Add DockerHub Credentials:
  - Kind: Username with password
  - Username: <dockerhub-username>
  - Password: <dockerhub-password>
  - ID: docker-hub
  - Description: DockerHub Credentials
```

#### 3. Create Jenkins Pipeline Job

```
New Item > Pipeline
- Name: python-pipeline
- Definition: Pipeline script from SCM
- SCM: Git
- Repository URL: <your-python-repository>
- Branch: */master
- Script Path: Jenkins/python/python-project
- Save
```

#### 4. Update Pipeline Configuration

Edit `python-project` file:

```groovy
// Line 15: Update repository URL
userRemoteConfigs: [[url: 'https://github.com/YOUR-USERNAME/YOUR-PYTHON-APP']]

// Line 27: Update DockerHub image name
sh 'docker build -t YOUR-DOCKERHUB-USERNAME/YOUR-IMAGE-NAME:latest .'
sh 'docker push YOUR-DOCKERHUB-USERNAME/YOUR-IMAGE-NAME:latest'
```

### Required Project Files

#### 1. requirements.txt Example

```txt
# Web Framework (choose one)
flask==2.3.2
# django==4.2.3
# fastapi==0.100.0

# Production Server
gunicorn==21.2.0
# uvicorn==0.23.1  # For FastAPI

# Database
psycopg2-binary==2.9.6
sqlalchemy==2.0.19

# Utilities
python-dotenv==1.0.0
requests==2.31.0

# Development
pytest==7.4.0
pytest-cov==4.1.0
flake8==6.0.0
black==23.7.0
```

#### 2. Dockerfile Example

```dockerfile
# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:5000/health')" || exit 1

# Start application with gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "60", "wsgi:app"]
```

#### 3. Flask Application Example (app.py)

```python
from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({
        'message': 'Hello from Python Jenkins Pipeline!',
        'version': '1.0.0',
        'environment': os.getenv('ENVIRONMENT', 'development')
    })

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'}), 200

@app.route('/ready')
def ready():
    return jsonify({'status': 'ready'}), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
```

#### 4. WSGI Entry Point (wsgi.py)

```python
from app import app

if __name__ == "__main__":
    app.run()
```

#### 5. Application.yaml Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: python-app
  labels:
    app: python-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: python-app
  template:
    metadata:
      labels:
        app: python-app
    spec:
      containers:
      - name: python-app
        image: lowyiiii/python-project:latest
        ports:
        - containerPort: 5000
        env:
        - name: ENVIRONMENT
          value: "production"
        - name: PORT
          value: "5000"
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
        readinessProbe:
          httpGet:
            path: /ready
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
---
apiVersion: v1
kind: Service
metadata:
  name: python-app-service
spec:
  type: LoadBalancer
  selector:
    app: python-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
```

#### 6. .dockerignore Example

```
__pycache__
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.venv/
pip-log.txt
pip-delete-this-directory.txt
.tox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.log
.git
.gitignore
.mypy_cache
.pytest_cache
.hypothesis
.idea
.vscode
*.md
tests/
```

### Running the Pipeline

1. **Verify Worker Agent**:
   ```
   Manage Jenkins > Manage Nodes and Clouds
   - Ensure worker agent is online
   - Check agent status is green
   ```

2. **Execute Pipeline**:
   ```
   - Navigate to python-pipeline job
   - Click "Build Now"
   - Monitor Stage View
   ```

3. **Verify Deployment**:
   ```bash
   # Check Kubernetes resources
   kubectl get deployments
   kubectl get pods
   kubectl get services

   # Get service URL
   kubectl get svc python-app-service

   # Test application
   curl http://<loadbalancer-url>/
   curl http://<loadbalancer-url>/health
   ```

## Key Features

### 1. Worker Agent Architecture
- **Distributed Builds**: Offloads builds from master
- **Dedicated Environment**: Python-specific build environment
- **Scalability**: Easy to add more worker nodes
- **Resource Isolation**: Separate resources for different build types

### 2. Python-Specific Workflow
- **Dependency Management**: pip-based dependency installation
- **Virtual Environment**: Isolated Python environment
- **Framework Agnostic**: Works with Flask, Django, FastAPI
- **Testing Support**: Easy integration of pytest

### 3. Container Optimization
- **Slim Images**: Python slim base for smaller images
- **Multi-Stage Possible**: Can extend to multi-stage builds
- **Security**: Non-root user execution
- **Production Ready**: Gunicorn for production deployment

### 4. Quick Iteration
- **Fast Builds**: 7-day retention for active development
- **Minimal Stages**: Streamlined for quick feedback
- **Easy Updates**: Simple pipeline structure

### 5. Kubernetes Native
- **Cloud Ready**: Designed for container orchestration
- **Scalable**: Multiple replicas for HA
- **Health Monitoring**: Liveness and readiness probes
- **Load Balancing**: Built-in service load balancing

## Troubleshooting

### Common Issues and Solutions

#### Worker Agent Offline
```
Error: There are no nodes with the label 'worker'
```

**Solutions**:
1. **Check agent status**:
   ```
   Manage Jenkins > Manage Nodes and Clouds
   - Click on worker agent
   - Check connection status
   ```

2. **Reconnect agent**:
   ```
   - Click on worker agent
   - Click "Relaunch agent"
   ```

3. **Verify SSH connection**:
   ```bash
   ssh jenkins@worker-host
   ```

4. **Check agent label**:
   ```
   Agent configuration > Labels: worker
   ```

#### pip Install Failed
```
Error: Could not find a version that satisfies the requirement
```

**Solutions**:
1. **Check Python version**:
   ```bash
   python3 --version
   pip3 --version
   ```

2. **Update pip**:
   ```bash
   pip3 install --upgrade pip
   ```

3. **Verify requirements.txt**:
   ```bash
   pip3 install -r requirements.txt
   ```

4. **Check package names**:
   - Verify correct package names on PyPI
   - Check version compatibility

5. **Use pip index**:
   ```bash
   pip3 install --index-url https://pypi.org/simple/ -r requirements.txt
   ```

#### Permission Denied on Docker
```
Error: Got permission denied while trying to connect to the Docker daemon socket
```

**Solutions**:
1. **Add jenkins user to docker group**:
   ```bash
   sudo usermod -aG docker jenkins
   sudo systemctl restart jenkins
   ```

2. **Verify group membership**:
   ```bash
   groups jenkins
   ```

3. **Check Docker socket permissions**:
   ```bash
   ls -l /var/run/docker.sock
   ```

#### Module Import Errors in Container
```
Error: ModuleNotFoundError: No module named 'flask'
```

**Solutions**:
1. **Check Dockerfile**:
   ```dockerfile
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY . .
   ```

2. **Verify requirements.txt is complete**:
   ```bash
   pip3 freeze > requirements.txt
   ```

3. **Test locally**:
   ```bash
   docker build -t test .
   docker run -p 5000:5000 test
   ```

#### Kubernetes Pod Crashes
```
Error: CrashLoopBackOff
```

**Solutions**:
1. **Check pod logs**:
   ```bash
   kubectl logs <pod-name>
   kubectl describe pod <pod-name>
   ```

2. **Common Python issues**:
   - Missing environment variables
   - Port binding issues
   - Database connection failures
   - Missing dependencies

3. **Test container locally**:
   ```bash
   docker run -p 5000:5000 lowyiiii/python-project:latest
   curl http://localhost:5000/health
   ```

4. **Check resource limits**:
   - May need more memory
   - Adjust in Application.yaml

#### Health Check Failed
```
Error: Readiness probe failed
```

**Solutions**:
1. **Verify health endpoint**:
   ```python
   @app.route('/health')
   def health():
       return {'status': 'healthy'}, 200
   ```

2. **Check port configuration**:
   - Ensure app runs on correct port
   - Match Kubernetes configuration

3. **Increase initial delay**:
   ```yaml
   initialDelaySeconds: 60  # Give more time to start
   ```

## Best Practices

### 1. Python Development
- **Virtual Environments**: Always use virtual environments
- **Requirements**: Pin dependency versions
- **Testing**: Write unit and integration tests
- **Linting**: Use flake8 or pylint
- **Formatting**: Use black for code formatting
- **Type Hints**: Use type hints for better code quality

### 2. Dependency Management
- **Lock Files**: Consider using pipenv or poetry
- **Security**: Run `pip-audit` for security vulnerabilities
- **Updates**: Regularly update dependencies
- **Minimal Dependencies**: Only include necessary packages
- **Production**: Use `--only=production` equivalent

### 3. Docker Best Practices
- **Base Images**: Use official Python images
- **Slim Variants**: Use python:3.x-slim
- **Multi-Stage**: Consider multi-stage for even smaller images
- **Security**: Run as non-root user
- **Caching**: Order Dockerfile for optimal caching
- **Health Checks**: Implement health check endpoints

### 4. Testing
- **Unit Tests**: Use pytest
- **Coverage**: Aim for >80% coverage
- **Integration Tests**: Test API endpoints
- **Test in Pipeline**: Add test stage before Docker build
- **Test Fixtures**: Use pytest fixtures

### 5. Application Design
- **12-Factor App**: Follow 12-factor app principles
- **Configuration**: Use environment variables
- **Logging**: Use structured logging
- **Error Handling**: Implement proper error handling
- **Health Endpoints**: /health and /ready endpoints

### 6. Security
- **Dependencies**: Audit with pip-audit
- **Secrets**: Never commit secrets
- **Environment Variables**: Use Kubernetes secrets
- **SQL Injection**: Use parameterized queries
- **Input Validation**: Validate all inputs
- **HTTPS**: Use TLS in production

### 7. Performance
- **Workers**: Use gunicorn with multiple workers
- **Async**: Consider async frameworks for I/O bound apps
- **Caching**: Implement caching (Redis)
- **Database**: Use connection pooling
- **Profiling**: Profile application performance

### 8. Pipeline Optimization
- **Caching**: Cache pip packages
- **Parallel Tests**: Run tests in parallel
- **Conditional Stages**: Skip unnecessary stages
- **Artifact Storage**: Store test reports
- **Build Matrix**: Test multiple Python versions
