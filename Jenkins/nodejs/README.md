# Jenkins Pipeline for Node.js Applications

## Overview

This project demonstrates a Jenkins CI/CD pipeline specifically designed for Node.js applications. The pipeline integrates Node.js build tools, Docker containerization, DockerHub registry, and Kubernetes deployment. This example showcases how to build, test, containerize, and deploy modern JavaScript applications using Jenkins automation. It's ideal for teams working with Node.js, Express, React, or any JavaScript-based application requiring containerized deployment.

## Jenkins Concepts

This pipeline demonstrates the following Jenkins concepts:

- **Declarative Pipeline Syntax**: Clean, readable pipeline structure
- **Agent Configuration**: Any available Jenkins agent
- **Build Options**: Log rotation and build discarder for space management
- **Tools Integration**: Node.js tool configuration and usage
- **Environment Variables**: Secure credential management for DockerHub
- **Credentials Binding**: Automatic credential injection as environment variables
- **Post-Build Actions**: Status handling for always, success, and failure scenarios
- **Build Retention**: Smart cleanup of old builds (7 days, 2 builds max)

## Prerequisites

### Jenkins Configuration

- Jenkins server (version 2.300+)
- Required Jenkins plugins:
  - Pipeline plugin
  - Git plugin
  - NodeJS plugin
  - Docker Pipeline plugin
  - Credentials Binding plugin
  - Kubernetes CLI plugin

### Tool Requirements

- **Node.js**: Must be configured in Jenkins with the name 'NodeJs'
  - Navigate to: Manage Jenkins > Global Tool Configuration > NodeJS
  - Add NodeJS installation with name 'NodeJs'
  - Version: 14.x, 16.x, 18.x, or 20.x (based on your app requirements)
- **npm**: Comes bundled with Node.js
- **Docker**: Installed on Jenkins agent
  - Jenkins user must have Docker permissions
- **kubectl**: Kubernetes CLI for deployment
  - Configured with access to target cluster

### External Services

- **DockerHub Account**: For container image storage and distribution
- **GitHub Repository**: Source code repository
- **Kubernetes Cluster**: For application deployment (Minikube, EKS, GKE, or AKS)

### Credentials Setup

Configure the following credentials in Jenkins (Manage Jenkins > Credentials):

- **docker-hub**: DockerHub credentials
  - Type: Username with password
  - Username: Your DockerHub username
  - Password: Your DockerHub password or access token
  - ID: `docker-hub`
  - Description: DockerHub Credentials

## Project Structure

```
nodejs/
├── nodejs-project      # Jenkins pipeline definition (Jenkinsfile)
└── README.md          # This documentation
```

Expected Node.js repository structure:
```
Source Repository/
├── package.json       # Node.js dependencies and scripts
├── package-lock.json  # Lock file for dependencies
├── Dockerfile         # Docker image definition
├── Application.yaml   # Kubernetes deployment manifests
├── .dockerignore     # Files to exclude from Docker image
├── .gitignore        # Files to exclude from git
└── src/              # Application source code
    ├── index.js      # Main application file
    ├── routes/       # API routes
    ├── controllers/  # Business logic
    ├── models/       # Data models
    └── tests/        # Test files
```

## Pipeline Configuration

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
- Keeps builds for 7 days (shorter retention for faster iteration)
- Maintains last 2 builds only
- No separate artifact retention
- Optimized for active development cycles

### Tools Configuration

```groovy
tools {
    nodejs 'NodeJs'
}
```

**Tool Setup**:
- Automatically adds Node.js and npm to PATH
- Version determined by Jenkins configuration
- Ensures consistent Node.js version across builds

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

The pipeline consists of 4 streamlined stages:

#### 1. Checkout Stage
```groovy
stage('CheckOut') {
    steps {
        checkout scmGit(
            branches: [[name: '*/main']],
            extensions: [],
            userRemoteConfigs: [[url: 'https://github.com/mohammadrezachegini/Node-JS-Jenkins/']]
        )
    }
}
```

**Purpose**: Clone source code from GitHub
**Branch**: main (standard for Node.js projects)
**Note**: Update URL to your Node.js application repository

#### 2. Node Build Stage
```groovy
stage('node stage') {
    steps {
        sh 'node -v'
        sh 'npm -v'
        sh 'npm install'
    }
}
```

**Purpose**: Install dependencies and prepare application
**Operations**:
- Verify Node.js version
- Verify npm version
- Install all dependencies from package.json
- Creates/updates node_modules directory
- Executes any prepare/postinstall scripts

**What happens during npm install**:
- Reads package.json and package-lock.json
- Downloads all dependencies and devDependencies
- Builds native modules if needed
- Creates node_modules directory
- Can run tests if configured in scripts

#### 3. Docker Build and Push Stage
```groovy
stage('Docker build') {
    steps {
        sh 'docker -v'
        sh 'docker build -t lowyiiii/jenkins-nodejs:latest .'
        sh 'echo $dockercred_PSW | docker login -u $dockercred_USR --password-stdin'
        sh 'docker push lowyiiii/jenkins-nodejs:latest'
    }
}
```

**Purpose**: Build container image and push to DockerHub
**Operations**:
1. Verify Docker is available
2. Build Docker image with 'latest' tag
3. Authenticate with DockerHub securely (password via stdin)
4. Push image to DockerHub registry

**Image Details**:
- Repository: lowyiiii/jenkins-nodejs
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

**Purpose**: Deploy application to Kubernetes cluster
**Operations**:
- Applies Kubernetes manifests
- Creates or updates deployments
- Creates or updates services
- Kubernetes handles rolling update

### Post-Build Actions

```groovy
post {
    always {
        echo "job is completed"
    }
    success {
        echo "job succeeded"
    }
    failure {
        echo "job failed"
    }
}
```

## Usage

### Initial Setup

#### 1. Configure Node.js in Jenkins

```
Manage Jenkins > Global Tool Configuration > NodeJS
- Click "Add NodeJS"
- Name: NodeJs
- Install automatically: checked
- Version: Select desired version (e.g., NodeJS 18.x)
- Global npm packages to install: (optional)
  - npm@latest
- Save
```

#### 2. Create Jenkins Pipeline Job

```
Jenkins Dashboard > New Item
- Name: nodejs-pipeline
- Type: Pipeline
- Click OK

Configuration:
- General > Build Triggers: (optional) GitHub hook trigger
- Pipeline:
  - Definition: Pipeline script from SCM
  - SCM: Git
  - Repository URL: <your-nodejs-repository>
  - Branch: */main
  - Script Path: Jenkins/nodejs/nodejs-project
- Save
```

#### 3. Configure Credentials

```
Manage Jenkins > Credentials > System > Global credentials
- Add Credentials:
  - Kind: Username with password
  - Username: <dockerhub-username>
  - Password: <dockerhub-password-or-token>
  - ID: docker-hub
  - Description: DockerHub Credentials
```

#### 4. Update Pipeline Configuration

Edit `nodejs-project` file to customize:

```groovy
// Line 15: Update repository URL
userRemoteConfigs: [[url: 'https://github.com/YOUR-USERNAME/YOUR-NODEJS-APP']]

// Line 29: Update DockerHub image name
sh 'docker build -t YOUR-DOCKERHUB-USERNAME/YOUR-IMAGE-NAME:latest .'
sh 'docker push YOUR-DOCKERHUB-USERNAME/YOUR-IMAGE-NAME:latest'
```

### Required Project Files

#### 1. package.json Example
```json
{
  "name": "nodejs-jenkins-app",
  "version": "1.0.0",
  "description": "Node.js application with Jenkins CI/CD",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest --coverage",
    "lint": "eslint src/**/*.js",
    "build": "echo 'Build complete'"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.0.3",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^2.0.20",
    "jest": "^29.3.1",
    "eslint": "^8.30.0"
  },
  "engines": {
    "node": ">=14.0.0",
    "npm": ">=6.0.0"
  }
}
```

#### 2. Dockerfile Example
```dockerfile
# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["npm", "start"]
```

#### 3. .dockerignore Example
```
node_modules
npm-debug.log
.env
.env.local
.git
.gitignore
README.md
.vscode
.idea
coverage
.DS_Store
*.md
```

#### 4. Application.yaml Example
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nodejs-app
  labels:
    app: nodejs-app
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
        image: lowyiiii/jenkins-nodejs:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
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
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
---
apiVersion: v1
kind: Service
metadata:
  name: nodejs-app-service
spec:
  type: LoadBalancer
  selector:
    app: nodejs-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
```

#### 5. Simple Express App (src/index.js)
```javascript
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Readiness check endpoint
app.get('/ready', (req, res) => {
  res.status(200).json({ status: 'ready' });
});

// Main endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Hello from Node.js Jenkins Pipeline!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
```

### Running the Pipeline

1. **Manual Execution**:
   ```
   - Navigate to your pipeline job
   - Click "Build Now"
   - Watch Stage View for progress
   ```

2. **View Build Output**:
   ```
   - Click on build number (e.g., #1)
   - View "Console Output" for detailed logs
   - Check each stage in Stage View
   ```

3. **Verify Deployment**:
   ```bash
   # Check Kubernetes deployment
   kubectl get deployments
   kubectl get pods
   kubectl get services

   # Get service URL
   kubectl get svc nodejs-app-service

   # Test application
   curl http://<loadbalancer-url>/health
   ```

### Automated Triggers

#### GitHub Webhook Setup
```
1. GitHub Repository > Settings > Webhooks
2. Add webhook:
   - Payload URL: http://your-jenkins-url/github-webhook/
   - Content type: application/json
   - Events: Just the push event
   - Active: checked
3. Save webhook
```

#### Poll SCM Configuration
```groovy
triggers {
    pollSCM('H/5 * * * *')  // Check every 5 minutes
}
```

## Key Features

### 1. Node.js Specific Configuration
- **Version Management**: Uses Jenkins Node.js plugin for version control
- **Dependency Management**: Automated npm install
- **Build Tools**: Supports all npm scripts
- **Testing**: Can integrate npm test in build stage

### 2. Lightweight Build Process
- **Fast Builds**: Optimized for Node.js applications
- **Small Images**: Alpine-based Docker images
- **Efficient Caching**: npm caching for faster builds
- **Quick Iteration**: 7-day retention for rapid development

### 3. Container Optimization
- **Alpine Base**: Small footprint (40-50MB base)
- **Production Dependencies**: Only production deps in final image
- **Security**: Non-root user for container execution
- **Health Checks**: Built-in health endpoints

### 4. Kubernetes Ready
- **Cloud Native**: Designed for container orchestration
- **Scalable**: Multiple replicas for high availability
- **Resource Management**: CPU and memory limits
- **Service Exposure**: LoadBalancer for external access

### 5. Development Friendly
- **Short Retention**: Quick cleanup for active development
- **Simple Pipeline**: Easy to understand and modify
- **Fast Feedback**: Streamlined stages for quick builds
- **Easy Debugging**: Clear stage separation

## Troubleshooting

### Common Issues and Solutions

#### Node.js Tool Not Found
```
Error: node: command not found
```

**Solutions**:
1. **Configure Node.js in Jenkins**:
   ```
   Manage Jenkins > Global Tool Configuration > NodeJS
   - Add NodeJS with name 'NodeJs'
   ```

2. **Verify tool name matches**:
   ```groovy
   tools {
       nodejs 'NodeJs'  // Must match configured name
   }
   ```

3. **Check plugin installation**:
   ```
   Manage Jenkins > Manage Plugins > Installed
   - Verify "NodeJS Plugin" is installed
   ```

#### npm install Failed
```
Error: npm ERR! code ENOTFOUND
```

**Solutions**:
1. **Check network connectivity**:
   ```bash
   curl https://registry.npmjs.org/
   ```

2. **Verify package.json exists**:
   ```bash
   ls -la package.json
   ```

3. **Clear npm cache**:
   ```bash
   npm cache clean --force
   npm install
   ```

4. **Use npm ci for clean install**:
   ```groovy
   sh 'npm ci'  // Faster, more reliable than npm install
   ```

5. **Check for private packages**:
   - If using private npm packages, configure .npmrc
   - Add npm token as credential

#### Docker Build Failed
```
Error: Cannot locate specified Dockerfile
```

**Solutions**:
1. **Verify Dockerfile exists**:
   ```bash
   ls -la Dockerfile
   ```

2. **Check Dockerfile syntax**:
   ```bash
   docker build -t test .
   ```

3. **Ensure proper context**:
   - Dockerfile should be in repository root
   - Or specify path: `docker build -f path/to/Dockerfile`

#### Module Not Found in Container
```
Error: Cannot find module 'express'
```

**Solutions**:
1. **Check Dockerfile COPY order**:
   ```dockerfile
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   ```

2. **Verify dependencies in package.json**:
   - Ensure modules are in dependencies, not devDependencies

3. **Rebuild without cache**:
   ```bash
   docker build --no-cache -t image-name .
   ```

#### Kubernetes Deployment Failed
```
Error: The Service "nodejs-app-service" is invalid
```

**Solutions**:
1. **Validate YAML syntax**:
   ```bash
   kubectl apply --dry-run=client -f Application.yaml
   ```

2. **Check image name in YAML**:
   - Must match pushed image name

3. **Verify kubectl access**:
   ```bash
   kubectl cluster-info
   kubectl get nodes
   ```

4. **Check namespace**:
   ```bash
   kubectl get namespaces
   # Ensure target namespace exists
   ```

#### Pod CrashLoopBackOff
```
Error: Back-off restarting failed container
```

**Solutions**:
1. **Check pod logs**:
   ```bash
   kubectl logs <pod-name>
   kubectl describe pod <pod-name>
   ```

2. **Common Node.js issues**:
   - PORT environment variable not set
   - Missing dependencies
   - Syntax errors in code
   - Insufficient memory/CPU

3. **Test container locally**:
   ```bash
   docker run -p 3000:3000 lowyiiii/jenkins-nodejs:latest
   ```

4. **Check health endpoint**:
   - Ensure /health endpoint exists and returns 200

## Best Practices

### 1. Node.js Application Design
- **Environment Variables**: Use .env for configuration
- **Health Endpoints**: Implement /health and /ready endpoints
- **Graceful Shutdown**: Handle SIGTERM for graceful shutdown
- **Error Handling**: Implement proper error handling
- **Logging**: Use structured logging (Winston, Bunyan)
- **Security**: Use helmet.js for security headers

### 2. Dependency Management
- **Lock Files**: Always commit package-lock.json
- **Audit Dependencies**: Run `npm audit` regularly
- **Update Dependencies**: Keep dependencies updated
- **Avoid Wildcards**: Use specific versions in package.json
- **Prune DevDeps**: Use `npm ci --only=production` in Dockerfile

### 3. Docker Best Practices
- **Multi-Stage Builds**: Separate build and runtime stages
- **Alpine Images**: Use alpine for smaller images
- **Non-Root User**: Run as non-root for security
- **Layer Caching**: Order Dockerfile commands for optimal caching
- **.dockerignore**: Exclude unnecessary files

### 4. Testing
- **Unit Tests**: Use Jest or Mocha
- **Integration Tests**: Test API endpoints
- **Coverage**: Aim for >80% coverage
- **Linting**: Use ESLint for code quality
- **CI Tests**: Run tests in pipeline before build

### 5. Performance
- **Connection Pooling**: Use connection pools for databases
- **Caching**: Implement Redis or in-memory caching
- **Compression**: Use gzip compression
- **Clustering**: Use PM2 or cluster module
- **Resource Limits**: Set appropriate CPU/memory limits

### 6. Security
- **Dependencies**: Audit with `npm audit`
- **Secrets**: Never commit secrets to repository
- **Environment Variables**: Use Kubernetes secrets
- **HTTPS**: Use TLS/SSL in production
- **Rate Limiting**: Implement rate limiting
- **Input Validation**: Validate all user input

### 7. Monitoring & Logging
- **Application Metrics**: Export metrics (Prometheus)
- **Structured Logging**: Use JSON logging
- **Error Tracking**: Use Sentry or similar
- **APM**: Consider New Relic or Datadog
- **Health Checks**: Comprehensive health endpoints

### 8. Pipeline Optimization
- **npm ci**: Use `npm ci` instead of `npm install`
- **Caching**: Cache node_modules in Jenkins
- **Parallel Tests**: Run tests in parallel
- **Build Matrix**: Test multiple Node.js versions
- **Artifact Storage**: Store test results and coverage
