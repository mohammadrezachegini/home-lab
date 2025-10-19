# GitLab CI/CD for Node.js Applications

## Overview

This project demonstrates a comprehensive GitLab CI/CD pipeline for Node.js applications. The pipeline implements modern JavaScript/Node.js development workflows including dependency management, automated testing, code quality analysis with SonarQube, Docker containerization, and deployment to AWS EKS (Elastic Kubernetes Service).

The pipeline showcases best practices for Node.js applications including npm-based builds, security scanning (SAST), Docker Hub integration, and cloud-native Kubernetes deployment with automated kubectl configuration.

## GitLab CI/CD Concepts

This project demonstrates the following GitLab CI/CD concepts:

- **Container-Based Execution**: All jobs run in Node.js Docker containers
- **Multi-Stage Pipeline**: Structured workflow from build to deployment
- **NPM Integration**: Node.js package management and testing
- **Docker-in-Docker (DinD)**: Container builds within the pipeline
- **Security Scanning (SAST)**: Automated security vulnerability detection
- **SonarQube Integration**: Code quality and technical debt analysis
- **Docker Hub Publishing**: Public/private Docker registry integration
- **AWS EKS Deployment**: Kubernetes orchestration on AWS
- **Dynamic Tool Installation**: Runtime installation of kubectl
- **Environment Variables**: Secure credential management
- **Conditional Execution**: Rules-based job execution (main branch only)

## Prerequisites

Before using this pipeline, ensure you have:

### Required Tools (Pre-installed in Container Images)
- GitLab instance (self-hosted or GitLab.com)
- GitLab Runner with Docker executor
- Docker 20.10+ support

### Required Accounts & Access
- Docker Hub account (or private registry)
- AWS account with EKS cluster configured
- SonarQube server (for code quality analysis)
- Node.js application with package.json

### Required Credentials (GitLab CI/CD Variables)
Set these in GitLab project settings under Settings > CI/CD > Variables:

- `DOCKER_HUB_USERNAME`: Docker Hub username
- `DOCKER_HUB_PASSWORD`: Docker Hub password or access token
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `AWS_DEFAULT_REGION`: AWS region (e.g., us-east-1)

### SonarQube Configuration
Create a `sonar-project.properties` file in your project root:
```properties
sonar.projectKey=your-project-key
sonar.host.url=https://your-sonarqube-server
sonar.login=your-sonarqube-token
```

## Project Structure

```
nodejs-project/
├── nodejs-project.yml         # GitLab CI/CD pipeline configuration
├── package.json               # Node.js dependencies and scripts (expected)
├── package-lock.json          # Locked dependency versions (expected)
├── Dockerfile                 # Docker image configuration (expected)
├── Application.yaml           # Kubernetes deployment manifest (expected)
├── sonar-project.properties   # SonarQube configuration (expected)
├── src/                       # Application source code (expected)
│   └── index.js
├── test/                      # Test files (expected)
│   └── *.test.js
└── .dockerignore              # Files to exclude from Docker build
```

## Pipeline Configuration

The pipeline consists of 5 stages defined in `nodejs-project.yml`:

### Stage 1: Build (`build`)

```yaml
build-job:
  stage: build
  script:
    - npm install
```

**Purpose**: Install Node.js dependencies
**Container**: Uses official Node.js Docker image (defined globally)
**Features**:
- Installs all dependencies from package.json
- Creates node_modules directory
- Validates package-lock.json

### Stage 2: Test (`test`)

#### Test Job
```yaml
test-job:
  stage: test
  script:
    - npm install
    - npm test
```

**Purpose**: Run application tests
**Features**:
- Reinstalls dependencies (clean test environment)
- Executes test scripts defined in package.json
- Validates code functionality

#### SAST Security Scanning
```yaml
sast:
  stage: test
include:
  - template: Jobs/SAST.gitlab-ci.yml
```

**Purpose**: Static Application Security Testing
**Features**:
- Automatic vulnerability detection
- JavaScript/Node.js specific security checks
- Security dashboard integration

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

### Stage 4: Package Docker Image (`package`)

```yaml
package-docker:
  stage: package
  image: docker:20.10.16
  services:
    - docker:20.10.16-dind
  before_script:
    - echo "$DOCKER_HUB_PASSWORD" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin
  script:
    - docker build -t lowyiiii/nodejs-project:latest .
    - docker push lowyiiii/nodejs-project:latest
```

**Purpose**: Build and publish Docker container image
**Features**:
- Docker-in-Docker service for isolated builds
- Secure credential handling with stdin
- Latest tag for continuous deployment
- Docker Hub integration

### Stage 5: Deploy to AWS EKS (`deploy`)

```yaml
deploy-job:
  stage: deploy
  image:
    name: amazon/aws-cli
    entrypoint: [""]
  before_script:
    - curl -O https://s3.us-west-2.amazonaws.com/amazon-eks/1.30.2/2024-07-12/bin/linux/amd64/kubectl
    - curl -O https://s3.us-west-2.amazonaws.com/amazon-eks/1.30.2/2024-07-12/bin/linux/amd64/kubectl.sha256
    - sha256sum -c kubectl.sha256
    - chmod +x ./kubectl
    - mkdir -p $HOME/bin && cp ./kubectl $HOME/bin/ && export PATH=$HOME/bin:$PATH
    - echo 'export PATH=$HOME/bin:$PATH' >> ~/.bashrc
  script:
    - aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
    - aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
    - aws configure set default_region $AWS_DEFAULT_REGION
    - aws eks update-kubeconfig --region $AWS_DEFAULT_REGION --name nodejs-cluster
    - kubectl apply -f Application.yaml
    - kubectl get pods
```

**Purpose**: Deploy application to Kubernetes cluster on AWS
**Features**:
- Official AWS CLI container image
- Runtime kubectl installation with SHA256 verification
- Dynamic kubeconfig generation
- Pod status verification

## Usage

### Setting Up the Pipeline

1. **Prepare your Node.js application**:
   Ensure your `package.json` includes test scripts:
   ```json
   {
     "scripts": {
       "start": "node src/index.js",
       "test": "jest",
       "test:coverage": "jest --coverage"
     }
   }
   ```

2. **Copy the pipeline configuration**:
   ```bash
   cp nodejs-project.yml .gitlab-ci.yml
   ```

3. **Create Dockerfile** for your Node.js app:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

4. **Create Kubernetes manifest** (`Application.yaml`):
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: nodejs-app
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: nodejs-app
     template:
       metadata:
         labels:
           app: nodejs-app
       spec:
         containers:
         - name: nodejs-app
           image: lowyiiii/nodejs-project:latest
           ports:
           - containerPort: 3000
   ```

5. **Configure GitLab CI/CD variables**:
   - Navigate to Settings > CI/CD > Variables
   - Add all required credentials

6. **Configure SonarQube**:
   - Create `sonar-project.properties` in project root
   - Set SonarQube server URL and authentication token

### Running the Pipeline

The pipeline automatically executes on:
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
# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint

# Build Docker image
docker build -t nodejs-project:local .

# Run container locally
docker run -p 3000:3000 nodejs-project:local
```

## Key Features

### 1. NPM Dependency Management
- Automated dependency installation
- Consistent builds with package-lock.json
- Clean environment for each stage

### 2. Automated Testing
- Unit test execution with npm test
- Test framework agnostic (Jest, Mocha, etc.)
- Early failure detection

### 3. Security Scanning
- Built-in SAST for Node.js applications
- Dependency vulnerability detection
- Security reports in GitLab UI

### 4. Code Quality Analysis
- SonarQube integration for technical debt
- Code smell detection
- Maintainability metrics
- Coverage analysis

### 5. Docker Containerization
- Lightweight Node.js containers
- Docker-in-Docker builds
- Automated registry publishing
- Latest tag strategy

### 6. Cloud-Native Deployment
- AWS EKS integration
- Kubernetes manifest deployment
- Automated cluster configuration
- Pod health verification

### 7. Conditional Execution
- Branch-specific job execution
- Resource optimization
- Flexible workflow control

## Troubleshooting

### Common Issues and Solutions

#### NPM Install Fails
```
Error: npm ERR! code ENOTFOUND
```
**Solution**: Check internet connectivity and npm registry access:
```yaml
variables:
  npm_config_registry: "https://registry.npmjs.org"
```

#### Tests Fail with Module Not Found
```
Error: Cannot find module 'jest'
```
**Solution**: Ensure devDependencies are installed:
```bash
npm install --include=dev
```

#### Docker Build Fails - Node Modules
```
Error: COPY failed: no such file or directory
```
**Solution**: Update Dockerfile to install dependencies inside container:
```dockerfile
COPY package*.json ./
RUN npm ci --only=production
COPY . .
```

#### Docker Hub Authentication Fails
```
Error: unauthorized: incorrect username or password
```
**Solution**:
- Verify Docker Hub credentials in GitLab variables
- Use Docker Hub access token instead of password
- Check for typos in variable names

#### SonarQube Analysis Fails
```
Error: Project key not found
```
**Solution**:
- Create project in SonarQube
- Update `sonar-project.properties` with correct key
- Verify SonarQube server accessibility

#### AWS EKS Connection Fails
```
Error: cluster "nodejs-cluster" not found
```
**Solution**:
- Verify EKS cluster name and region
- Check AWS credentials have EKS permissions
- Ensure cluster exists: `aws eks list-clusters`

#### kubectl Apply Fails
```
Error: no such file or directory: Application.yaml
```
**Solution**: Ensure Application.yaml is in repository root

#### Node Version Mismatch
```
Error: Unsupported engine
```
**Solution**: Specify Node.js version in package.json:
```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## Best Practices

### Node.js Development

1. **Use npm ci Instead of npm install**:
   ```yaml
   script:
     - npm ci  # Faster, more reliable
   ```

2. **Lock Dependencies**: Always commit package-lock.json

3. **Semantic Versioning**: Use exact versions in package.json

4. **Environment Variables**: Use .env files with dotenv package

5. **Script Organization**:
   ```json
   {
     "scripts": {
       "start": "node src/index.js",
       "dev": "nodemon src/index.js",
       "test": "jest --coverage",
       "lint": "eslint src/",
       "format": "prettier --write src/"
     }
   }
   ```

### Pipeline Optimization

1. **Cache node_modules**:
   ```yaml
   cache:
     key: ${CI_COMMIT_REF_SLUG}
     paths:
       - node_modules/
   ```

2. **Parallel Testing**:
   ```yaml
   test-job:
     parallel: 3
   ```

3. **Stage Dependencies**:
   ```yaml
   build-job:
     artifacts:
       paths:
         - node_modules/
   test-job:
     dependencies:
       - build-job
   ```

### Docker Best Practices

1. **Multi-Stage Builds**:
   ```dockerfile
   # Build stage
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   # Production stage
   FROM node:18-alpine
   WORKDIR /app
   COPY --from=builder /app/dist ./dist
   COPY --from=builder /app/node_modules ./node_modules
   CMD ["node", "dist/index.js"]
   ```

2. **Use .dockerignore**:
   ```
   node_modules
   npm-debug.log
   .git
   .gitignore
   .env
   *.md
   ```

3. **Security Scanning**:
   ```yaml
   container_scanning:
     stage: test
     include:
       - template: Container-Scanning.gitlab-ci.yml
   ```

4. **Version Tagging**:
   ```bash
   docker build -t nodejs-project:$CI_COMMIT_SHA .
   docker tag nodejs-project:$CI_COMMIT_SHA nodejs-project:latest
   ```

### Testing Strategy

1. **Unit Tests**: Test individual functions and modules
2. **Integration Tests**: Test API endpoints and database interactions
3. **E2E Tests**: Test complete user workflows
4. **Code Coverage**: Aim for >80% coverage
5. **Linting**: Enforce code style with ESLint

### Security Best Practices

1. **Dependency Auditing**:
   ```yaml
   audit-job:
     script:
       - npm audit --production
   ```

2. **Environment Variables**: Never commit secrets
3. **Minimal Base Images**: Use Alpine Linux
4. **Regular Updates**: Keep dependencies up to date
5. **HTTPS Only**: Enforce secure connections

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
       port: 3000
     initialDelaySeconds: 30
   readinessProbe:
     httpGet:
       path: /ready
       port: 3000
   ```

3. **Rolling Updates**:
   ```yaml
   strategy:
     type: RollingUpdate
     rollingUpdate:
       maxSurge: 1
       maxUnavailable: 0
   ```
