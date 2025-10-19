# GitLab CI/CD for Python Applications

## Overview

This project demonstrates a streamlined GitLab CI/CD pipeline for Python applications. The pipeline implements essential DevOps workflows including dependency management, security scanning (SAST), code quality analysis with SonarQube, Docker containerization, and deployment to AWS EKS (Elastic Kubernetes Service).

The pipeline showcases Python-specific best practices including pip-based dependency management, GitLab Container Registry integration, and Kubernetes deployment using custom GitLab runners with shell executors.

## GitLab CI/CD Concepts

This project demonstrates the following GitLab CI/CD concepts:

- **Custom GitLab Runners**: Self-hosted runners with specific tags (ec2, shell)
- **Multi-Stage Pipeline**: Build, test, quality analysis, package, and deploy stages
- **Python Dependency Management**: pip and requirements.txt integration
- **Security Scanning (SAST)**: Automated security vulnerability detection
- **SonarQube Integration**: Code quality and technical debt analysis
- **GitLab Container Registry**: Built-in Docker registry for container images
- **Kubernetes Deployment**: Automated deployment to AWS EKS
- **Environment Variables**: Secure credential management for AWS and registries
- **Conditional Execution**: Rules-based job execution (main branch only)
- **Shell Executor**: Direct execution on runner host

## Prerequisites

Before using this pipeline, ensure you have:

### Required Tools
- GitLab instance (self-hosted or GitLab.com)
- GitLab Runner registered with EC2 tags
- Python 3.x installed on runner
- pip package manager installed
- Docker installed on runner
- AWS CLI installed on runner
- kubectl installed on runner

### Required Accounts & Access
- GitLab account with container registry enabled
- AWS account with EKS cluster configured
- SonarQube server (for code quality analysis)

### Required Credentials (GitLab CI/CD Variables)
Set these in GitLab project settings under Settings > CI/CD > Variables:

- `CI_REGISTRY_USER`: GitLab username (usually provided automatically)
- `CI_REGISTRY_PASSWORD`: GitLab personal access token or job token
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `AWS_DEFAULT_REGION`: AWS region (e.g., us-east-1)

### SonarQube Configuration
Create a `sonar-project.properties` file in your project root:
```properties
sonar.projectKey=your-python-project-key
sonar.host.url=https://your-sonarqube-server
sonar.login=your-sonarqube-token
sonar.python.version=3.8,3.9,3.10,3.11
sonar.sources=src
sonar.tests=tests
```

## Project Structure

```
python-project/
├── python-project.yml         # GitLab CI/CD pipeline configuration
├── requirements.txt           # Python dependencies (expected)
├── requirements-dev.txt       # Development dependencies (optional)
├── Dockerfile                 # Docker image configuration (expected)
├── Application.yaml           # Kubernetes deployment manifest (expected)
├── sonar-project.properties   # SonarQube configuration (expected)
├── setup.py                   # Python package setup (optional)
├── src/                       # Application source code (expected)
│   └── __init__.py
├── tests/                     # Test files (expected)
│   └── test_*.py
└── .dockerignore              # Files to exclude from Docker build
```

## Pipeline Configuration

The pipeline consists of 5 stages defined in `python-project.yml`:

### Stage 1: Build (`build`)

```yaml
build-job:
  stage: build
  tags:
    - ec2
    - shell
  script:
    - pip install -r requirements.txt
```

**Purpose**: Install Python dependencies
**Executor**: Shell executor on EC2 runner
**Features**:
- Installs all required packages from requirements.txt
- Validates dependency compatibility
- Prepares environment for testing

### Stage 2: Test & Security (`test`)

#### SAST Security Scanning
```yaml
sast:
  stage: test
include:
  - template: Jobs/SAST.gitlab-ci.yml
```

**Purpose**: Static Application Security Testing
**Features**:
- Automatic vulnerability detection in Python code
- Dependency security scanning
- Security reports in GitLab UI
- Integration with security dashboard

**Detected Issues**:
- SQL injection vulnerabilities
- Command injection risks
- Hardcoded credentials
- Insecure random number generation
- Path traversal vulnerabilities

### Stage 3: SonarQube Analysis (`sonarqube`)

```yaml
sonarqube-check:
  stage: sonarqube
  image:
    name: sonarsource/sonar-scanner-cli:latest
    entrypoint: [""]
  variables:
    SONAR_USER_HOME: "${CI_PROJECT_DIR}/.sonar"
    GIT_DEPTH: "0"
  cache:
    key: "${CI_JOB_NAME}"
    paths:
      - .sonar/cache
  script:
    - sonar-scanner
  allow_failure: true
  rules:
    - if: $CI_COMMIT_BRANCH == 'main'
```

**Purpose**: Code quality analysis and technical debt assessment
**Features**:
- Full Git history for accurate blame information
- Analysis result caching for performance
- Non-blocking (allows pipeline to continue on failure)
- Runs only on main branch
- Python-specific code smell detection

### Stage 4: Package Docker Image (`package`)

```yaml
package-job:
  stage: package
  tags:
    - ec2
    - shell
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD registry.gitlab.com
    - docker build -t registry.gitlab.com/lowyiiii/python-project .
    - docker push registry.gitlab.com/lowyiiii/python-project
```

**Purpose**: Build and publish Docker container image
**Features**:
- GitLab Container Registry integration
- Automatic authentication using CI variables
- Shell executor with Docker access
- Latest tag strategy

### Stage 5: Deploy to AWS EKS (`deploy`)

```yaml
deploy-job:
  stage: deploy
  tags:
    - ec2
    - shell
  script:
    - aws configure set aws_access_key $AWS_ACCESS_KEY_ID
    - aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
    - aws configure set default_region $AWS_DEFAULT_REGION
    - kubectl apply -f Application.yaml
```

**Purpose**: Deploy application to Kubernetes cluster on AWS
**Features**:
- Direct AWS CLI configuration on runner
- Kubernetes manifest deployment
- Uses pre-installed kubectl on runner
- Simple, straightforward deployment

## Usage

### Setting Up the Pipeline

1. **Prepare your Python application**:
   Create `requirements.txt` with your dependencies:
   ```text
   flask==2.3.0
   requests==2.31.0
   pytest==7.4.0
   gunicorn==21.2.0
   ```

2. **Copy the pipeline configuration**:
   ```bash
   cp python-project.yml .gitlab-ci.yml
   ```

3. **Create Dockerfile** for your Python app:
   ```dockerfile
   FROM python:3.11-slim

   WORKDIR /app

   # Copy requirements first for better caching
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt

   # Copy application code
   COPY . .

   # Create non-root user
   RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
   USER appuser

   EXPOSE 8000

   CMD ["gunicorn", "--bind", "0.0.0.0:8000", "src.main:app"]
   ```

4. **Create Kubernetes manifest** (`Application.yaml`):
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: python-app
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
           image: registry.gitlab.com/lowyiiii/python-project:latest
           ports:
           - containerPort: 8000
           env:
           - name: ENVIRONMENT
             value: "production"
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: python-app-service
   spec:
     type: LoadBalancer
     ports:
     - port: 80
       targetPort: 8000
     selector:
       app: python-app
   ```

5. **Register GitLab Runner** on EC2:
   ```bash
   # Install GitLab Runner
   curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | sudo bash
   sudo apt-get install gitlab-runner

   # Register runner
   sudo gitlab-runner register \
     --url https://gitlab.com/ \
     --registration-token YOUR_TOKEN \
     --executor shell \
     --tag-list "ec2,shell"
   ```

6. **Configure GitLab CI/CD variables**:
   - Navigate to Settings > CI/CD > Variables
   - Add AWS credentials
   - Add GitLab Container Registry credentials

### Running the Pipeline

The pipeline executes automatically on:
- Every commit to any branch
- Merge request creation/update
- Manual pipeline triggers

**Note**: SonarQube analysis only runs on the `main` branch.

To run manually:
1. Navigate to CI/CD > Pipelines
2. Click "Run Pipeline"
3. Select branch and run

### Local Testing

Before pushing to GitLab, test locally:

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Run tests
pytest tests/ -v --cov=src

# Run linting
pylint src/
flake8 src/

# Build Docker image
docker build -t python-project:local .

# Run container locally
docker run -p 8000:8000 python-project:local
```

## Key Features

### 1. Python Dependency Management
- pip-based dependency installation
- requirements.txt for reproducible builds
- Virtual environment support (local development)

### 2. Security Scanning
- Built-in SAST for Python applications
- Common vulnerability detection:
  - SQL injection
  - Command injection
  - Hardcoded secrets
  - Insecure deserialization

### 3. Code Quality Analysis
- SonarQube integration for Python
- PEP 8 compliance checking
- Code complexity analysis
- Duplicate code detection
- Test coverage tracking

### 4. GitLab Container Registry
- Built-in container registry
- No external registry configuration needed
- Automatic authentication with job tokens
- Integrated with GitLab UI

### 5. Shell Executor Benefits
- Direct access to runner filesystem
- Faster execution (no container overhead)
- Pre-installed tools available
- Simplified debugging

### 6. Cloud-Native Deployment
- AWS EKS integration
- Kubernetes manifest deployment
- Simple deployment workflow

### 7. Custom Runner Tags
- Targeted job execution
- Environment-specific runners
- Resource optimization

## Troubleshooting

### Common Issues and Solutions

#### pip Install Fails
```
Error: No matching distribution found for package
```
**Solution**: Check package name and version in requirements.txt:
```bash
pip search package-name  # Find correct package name
pip install package-name --dry-run  # Test installation
```

#### Python Version Mismatch
```
Error: This package requires Python >=3.9
```
**Solution**: Update Python on runner or use Docker-based jobs:
```yaml
build-job:
  image: python:3.11
```

#### GitLab Registry Authentication Fails
```
Error: unauthorized: authentication required
```
**Solution**:
- Enable Container Registry in project settings
- Use job token: `$CI_JOB_TOKEN` instead of `$CI_REGISTRY_PASSWORD`
- Verify registry URL: `registry.gitlab.com`

#### Docker Build Fails - Permission Denied
```
Error: Got permission denied while trying to connect to Docker daemon
```
**Solution**: Add gitlab-runner user to docker group:
```bash
sudo usermod -aG docker gitlab-runner
sudo systemctl restart gitlab-runner
```

#### SonarQube Analysis Fails
```
Error: Project key not found
```
**Solution**:
- Create project in SonarQube
- Update `sonar-project.properties` with correct key
- Verify SonarQube server accessibility from runner

#### AWS kubectl Command Not Found
```
Error: kubectl: command not found
```
**Solution**: Install kubectl on runner:
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

#### Kubernetes Deployment Fails
```
Error: The connection to the server was refused
```
**Solution**: Configure kubeconfig on runner:
```bash
aws eks update-kubeconfig --region $AWS_DEFAULT_REGION --name your-cluster-name
```

#### Import Errors in Tests
```
Error: ModuleNotFoundError: No module named 'src'
```
**Solution**: Add `__init__.py` files and set PYTHONPATH:
```yaml
variables:
  PYTHONPATH: "${CI_PROJECT_DIR}"
```

## Best Practices

### Python Development

1. **Virtual Environments**:
   ```yaml
   build-job:
     before_script:
       - python -m venv venv
       - source venv/bin/activate
     script:
       - pip install -r requirements.txt
   ```

2. **Dependency Pinning**: Lock exact versions in requirements.txt:
   ```text
   flask==2.3.0  # Not flask>=2.0.0
   ```

3. **Use pip-tools** for dependency management:
   ```bash
   pip-compile requirements.in -o requirements.txt
   ```

4. **Separate Dependencies**:
   - `requirements.txt`: Production dependencies
   - `requirements-dev.txt`: Development dependencies

5. **Code Style**:
   ```bash
   # Install linting tools
   pip install pylint flake8 black isort

   # Run linters
   black src/ --check
   flake8 src/
   pylint src/
   ```

### Pipeline Optimization

1. **Cache Dependencies**:
   ```yaml
   cache:
     key: ${CI_COMMIT_REF_SLUG}
     paths:
       - venv/
       - .cache/pip/
   ```

2. **Use pip Cache**:
   ```yaml
   variables:
     PIP_CACHE_DIR: "$CI_PROJECT_DIR/.cache/pip"
   ```

3. **Parallel Testing**:
   ```yaml
   test-job:
     script:
       - pytest -n auto  # Run tests in parallel
   ```

4. **Artifacts for Test Reports**:
   ```yaml
   test-job:
     artifacts:
       reports:
         junit: test-results.xml
         coverage_report:
           coverage_format: cobertura
           path: coverage.xml
   ```

### Docker Best Practices

1. **Multi-Stage Builds**:
   ```dockerfile
   # Build stage
   FROM python:3.11 AS builder
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --user --no-cache-dir -r requirements.txt

   # Runtime stage
   FROM python:3.11-slim
   WORKDIR /app
   COPY --from=builder /root/.local /root/.local
   COPY . .
   ENV PATH=/root/.local/bin:$PATH
   CMD ["python", "src/main.py"]
   ```

2. **Use .dockerignore**:
   ```
   __pycache__
   *.pyc
   *.pyo
   *.pyd
   .Python
   venv/
   .git/
   .pytest_cache/
   .coverage
   *.log
   ```

3. **Security Scanning**:
   ```yaml
   container_scanning:
     stage: test
     include:
       - template: Container-Scanning.gitlab-ci.yml
   ```

4. **Minimal Base Images**: Use Python Alpine for smaller images:
   ```dockerfile
   FROM python:3.11-alpine
   ```

### Testing Strategy

1. **Unit Tests**: Test individual functions with pytest
2. **Integration Tests**: Test API endpoints and database interactions
3. **Code Coverage**: Aim for >80% coverage:
   ```bash
   pytest --cov=src --cov-report=html
   ```
4. **Test Organization**:
   ```
   tests/
   ├── unit/
   │   └── test_functions.py
   ├── integration/
   │   └── test_api.py
   └── conftest.py
   ```

### Security Best Practices

1. **Dependency Scanning**:
   ```yaml
   security-scan:
     script:
       - pip install safety
       - safety check -r requirements.txt
   ```

2. **Environment Variables**: Never commit secrets
3. **Use Secret Scanning**: Enable GitLab secret detection
4. **Regular Updates**: Keep dependencies up to date:
   ```bash
   pip list --outdated
   ```

5. **Secure Docker Images**: Run as non-root user

### Kubernetes Deployment

1. **Resource Limits**:
   ```yaml
   resources:
     limits:
       memory: "512Mi"
       cpu: "500m"
     requests:
       memory: "256Mi"
       cpu: "250m"
   ```

2. **Health Checks**:
   ```yaml
   livenessProbe:
     httpGet:
       path: /health
       port: 8000
     initialDelaySeconds: 30
   readinessProbe:
     httpGet:
       path: /ready
       port: 8000
   ```

3. **Environment-Specific Configs**:
   ```yaml
   env:
   - name: DATABASE_URL
     valueFrom:
       secretKeyRef:
         name: db-credentials
         key: url
   ```
