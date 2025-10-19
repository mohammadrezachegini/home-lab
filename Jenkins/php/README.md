# Jenkins Pipeline for PHP Applications

## Overview

This project demonstrates an advanced Jenkins CI/CD pipeline for PHP applications with multi-environment deployment strategy. The pipeline integrates PHP Composer for dependency management, Docker containerization, DockerHub registry, AWS EKS for Kubernetes orchestration, and implements a three-tier deployment workflow (development, staging, production) with manual approval gates. This represents an enterprise-grade deployment pattern for PHP applications requiring proper environment segregation and controlled production releases.

## Jenkins Concepts

This pipeline demonstrates the following advanced Jenkins concepts:

- **Declarative Pipeline Syntax**: Enterprise-grade pipeline structure
- **Agent Labels**: Uses dedicated worker agent for PHP builds
- **Build Options**: Sophisticated log rotation and retention policies
- **Environment Variables**: Multiple credential types (DockerHub and AWS)
- **Credentials Binding**: Secure injection of multiple credential sets
- **Manual Approval**: Input step for production deployment approval
- **Multi-Environment Deployment**: Separate dev, staging, and production stages
- **Script Blocks**: Embedded Groovy for approval logic
- **Namespace Management**: Kubernetes namespace-based environment isolation
- **Post-Build Actions**: Comprehensive status handling

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
  - AWS Steps plugin
  - Pipeline Input Step plugin

### Worker Agent Requirements

The pipeline requires a Jenkins worker agent labeled 'worker' with:
- **PHP**: Version 7.4+ or 8.x
- **Composer**: PHP dependency manager
- **Docker**: For container builds
- **AWS CLI**: For EKS integration
- **kubectl**: Kubernetes CLI
- **Git**: For source checkout

#### Setting Up Jenkins Worker Agent

```bash
# On worker machine
# Install PHP and Composer
sudo apt-get update
sudo apt-get install php php-cli php-mbstring php-xml php-curl unzip -y

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker jenkins

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify installations
php -v
composer --version
docker --version
aws --version
kubectl version --client
```

### AWS Requirements

- **AWS Account**: With EKS cluster configured
- **EKS Cluster**: Named 'devops-working' in us-east-1
- **Namespaces**: Create dev, staging, and prod namespaces
- **IAM Permissions**: EKS describe/update permissions

#### Create Kubernetes Namespaces

```bash
kubectl create namespace dev
kubectl create namespace staging
kubectl create namespace prod
```

### External Services

- **DockerHub Account**: For container registry
- **GitHub Repository**: Source code repository
- **AWS EKS**: Managed Kubernetes cluster
- **Load Balancers**: One per environment (created by Kubernetes)

### Credentials Setup

Configure the following credentials in Jenkins:

1. **docker-hub**: DockerHub credentials
   - Type: Username with password
   - Username: Your DockerHub username
   - Password: Your DockerHub password or access token
   - ID: `docker-hub`

2. **aws-key**: AWS credentials
   - Type: AWS Credentials
   - Access Key ID: Your AWS access key
   - Secret Access Key: Your AWS secret key
   - ID: `aws-key`

## Project Structure

```
php/
├── php-project         # Jenkins pipeline definition (Jenkinsfile)
└── README.md          # This documentation
```

Expected PHP repository structure:
```
Source Repository/
├── composer.json           # PHP dependencies
├── composer.lock          # Lock file for dependencies
├── Dockerfile            # Docker image definition
├── deploymen-dev.yaml    # Development deployment manifest
├── deploymen-staging.yaml # Staging deployment manifest
├── deploymen-prod.yaml   # Production deployment manifest
├── .dockerignore        # Docker ignore file
├── public/              # Web root
│   └── index.php       # Application entry point
├── src/                # Application source
│   ├── Controllers/
│   ├── Models/
│   └── Services/
├── config/             # Configuration files
├── tests/              # Test files
└── vendor/             # Composer dependencies (not committed)
```

## Pipeline Configuration

### Agent Configuration

```groovy
agent {
    label 'worker'
}
```

**Purpose**: Executes all stages on PHP-configured worker agent

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
- 7 days retention for recent builds
- Keep last 2 builds
- Optimized for active development

### Environment Variables

```groovy
environment {
    dockercred = credentials('docker-hub')
    awscred = credentials('aws-key')  // Note: typo in original - 'crdentials'
}
```

**Available Variables**:
- `$dockercred_USR`: DockerHub username
- `$dockercred_PSW`: DockerHub password
- AWS credentials for EKS access

### Pipeline Stages

The pipeline consists of 8 stages with multi-environment deployment:

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
**Note**: Update URL to your PHP application repository

#### 2. PHP Composer Stage
```groovy
stage('php composer test') {
    steps {
        sh 'composer install'
        sh 'ls'
    }
}
```

**Purpose**: Install PHP dependencies via Composer
**Operations**:
- Reads composer.json and composer.lock
- Downloads all dependencies
- Installs to vendor/ directory
- Executes post-install scripts
- Lists files to verify installation

#### 3. Docker Build Stage
```groovy
stage('Docker build') {
    steps {
        sh 'docker -v'
        sh 'docker build -t lowyiiii/php-project:latest .'
        sh 'echo $dockercred_PSW | docker login -u $dockercred_USR --password-stdin'
        sh 'docker push lowyiiii/php-project:latest'
    }
}
```

**Purpose**: Build and push container image
**Operations**:
- Verify Docker installation
- Build image with 'latest' tag
- Authenticate with DockerHub
- Push to registry

#### 4. AWS Test Stage
```groovy
stage('aws test') {
    steps {
        sh 'aws --version'
        sh 'aws sts get-caller-identity'
    }
}
```

**Purpose**: Verify AWS CLI and credentials
**Operations**:
- Check AWS CLI version
- Verify AWS credentials are valid
- Display AWS account information

#### 5. Kubernetes Config Setup Stage
```groovy
stage('kube config setup') {
    steps {
        sh 'aws eks update-kubeconfig --region us-east-1 --name devops-working'
    }
}
```

**Purpose**: Configure kubectl for EKS cluster
**Operations**:
- Updates kubeconfig with EKS cluster credentials
- Sets current context to EKS cluster
- Prepares for Kubernetes deployments

#### 6. Development Deployment Stage
```groovy
stage('kubectl deployment - dev') {
    steps {
        sh 'kubectl apply -f deploymen-dev.yaml -n dev'
    }
}
```

**Purpose**: Deploy to development environment
**Namespace**: dev
**Automatic**: Deploys automatically without approval

#### 7. Staging Deployment Stage
```groovy
stage('kubectl deployment - staging') {
    steps {
        sh 'kubectl apply -f deploymen-staging.yaml -n staging'
    }
}
```

**Purpose**: Deploy to staging environment
**Namespace**: staging
**Automatic**: Deploys automatically for testing

#### 8. Production Deployment Stage
```groovy
stage('kubectl deployment - prod') {
    steps {
        script {
            def approval = input id: 'Deployment',
                               message: 'Do you want to deploy to production?',
                               submitter: 'admin'
        }
        sh 'kubectl apply -f deploymen-prod.yaml -n prod'
    }
}
```

**Purpose**: Deploy to production with approval gate
**Namespace**: prod
**Manual Approval**: Requires 'admin' user approval
**Safety**: Prevents accidental production deployments

## Usage

### Complete Setup Guide

#### 1. Configure AWS EKS Cluster

```bash
# Using eksctl
eksctl create cluster \
  --name devops-working \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 4 \
  --managed

# Create namespaces
kubectl create namespace dev
kubectl create namespace staging
kubectl create namespace prod

# Verify
kubectl get namespaces
```

#### 2. Configure Jenkins Credentials

```
Manage Jenkins > Credentials > System > Global credentials

Add DockerHub Credentials:
- Kind: Username with password
- ID: docker-hub
- Username: <dockerhub-username>
- Password: <dockerhub-password>

Add AWS Credentials:
- Kind: AWS Credentials
- ID: aws-key
- Access Key ID: <aws-access-key>
- Secret Access Key: <aws-secret-key>
```

#### 3. Create Jenkins Pipeline

```
New Item > Pipeline
- Name: php-multi-env-pipeline
- Definition: Pipeline script from SCM
- SCM: Git
- Repository URL: <your-php-repository>
- Script Path: Jenkins/php/php-project
- Save
```

#### 4. Update Pipeline Configuration

Edit `php-project` file:

```groovy
// Line 16: Update repository URL
userRemoteConfigs: [[url: 'https://github.com/YOUR-USERNAME/YOUR-PHP-APP']]

// Line 31: Update DockerHub image
sh 'docker build -t YOUR-DOCKERHUB-USERNAME/YOUR-PHP-APP:latest .'
sh 'docker push YOUR-DOCKERHUB-USERNAME/YOUR-PHP-APP:latest'

// Line 46: Update EKS cluster if different
sh 'aws eks update-kubeconfig --region YOUR-REGION --name YOUR-CLUSTER-NAME'
```

### Required Project Files

#### 1. composer.json Example

```json
{
    "name": "company/php-app",
    "description": "PHP Application with Jenkins CI/CD",
    "type": "project",
    "require": {
        "php": ">=7.4",
        "slim/slim": "^4.0",
        "php-di/php-di": "^6.0",
        "monolog/monolog": "^2.0"
    },
    "require-dev": {
        "phpunit/phpunit": "^9.5",
        "squizlabs/php_codesniffer": "^3.6"
    },
    "autoload": {
        "psr-4": {
            "App\\": "src/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "Tests\\": "tests/"
        }
    },
    "scripts": {
        "test": "phpunit",
        "phpcs": "phpcs src tests"
    }
}
```

#### 2. Dockerfile Example

```dockerfile
# Use PHP 8.1 with Apache
FROM php:8.1-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files
COPY composer.json composer.lock ./

# Install PHP dependencies
RUN composer install --no-scripts --no-autoloader --no-dev

# Copy application code
COPY . .

# Generate autoload files
RUN composer dump-autoload --optimize --no-dev

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Enable Apache modules
RUN a2enmod rewrite

# Configure Apache document root
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Start Apache
CMD ["apache2-foreground"]
```

#### 3. deploymen-dev.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: php-app-dev
  namespace: dev
  labels:
    app: php-app
    environment: dev
spec:
  replicas: 2
  selector:
    matchLabels:
      app: php-app
      environment: dev
  template:
    metadata:
      labels:
        app: php-app
        environment: dev
    spec:
      containers:
      - name: php-app
        image: lowyiiii/php-project:latest
        ports:
        - containerPort: 80
        env:
        - name: APP_ENV
          value: "development"
        - name: LOG_LEVEL
          value: "debug"
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
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: php-app-service-dev
  namespace: dev
spec:
  type: LoadBalancer
  selector:
    app: php-app
    environment: dev
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
```

#### 4. deploymen-staging.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: php-app-staging
  namespace: staging
  labels:
    app: php-app
    environment: staging
spec:
  replicas: 2
  selector:
    matchLabels:
      app: php-app
      environment: staging
  template:
    metadata:
      labels:
        app: php-app
        environment: staging
    spec:
      containers:
      - name: php-app
        image: lowyiiii/php-project:latest
        ports:
        - containerPort: 80
        env:
        - name: APP_ENV
          value: "staging"
        - name: LOG_LEVEL
          value: "info"
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
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: php-app-service-staging
  namespace: staging
spec:
  type: LoadBalancer
  selector:
    app: php-app
    environment: staging
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
```

#### 5. deploymen-prod.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: php-app-prod
  namespace: prod
  labels:
    app: php-app
    environment: prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: php-app
      environment: prod
  template:
    metadata:
      labels:
        app: php-app
        environment: prod
    spec:
      containers:
      - name: php-app
        image: lowyiiii/php-project:latest
        ports:
        - containerPort: 80
        env:
        - name: APP_ENV
          value: "production"
        - name: LOG_LEVEL
          value: "warning"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: php-app-service-prod
  namespace: prod
spec:
  type: LoadBalancer
  selector:
    app: php-app
    environment: prod
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
```

#### 6. Simple PHP Application (public/index.php)

```php
<?php
require __DIR__ . '/../vendor/autoload.php';

header('Content-Type: application/json');

$route = $_SERVER['REQUEST_URI'];

switch ($route) {
    case '/':
        echo json_encode([
            'message' => 'Hello from PHP Jenkins Pipeline!',
            'version' => '1.0.0',
            'environment' => getenv('APP_ENV') ?: 'development'
        ]);
        break;

    case '/health':
        http_response_code(200);
        echo json_encode(['status' => 'healthy']);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Not Found']);
        break;
}
```

### Running the Pipeline

1. **Trigger Build**:
   ```
   - Navigate to php-multi-env-pipeline
   - Click "Build Now"
   - Monitor Stage View
   ```

2. **Development Deployment**:
   - Automatically deploys to dev namespace
   - No approval required

3. **Staging Deployment**:
   - Automatically deploys to staging namespace
   - Test application in staging

4. **Production Approval**:
   - Pipeline pauses at production stage
   - Displays approval prompt
   - Only users with 'admin' permission can approve
   - Click "Proceed" to deploy to production

5. **Verify Multi-Environment Deployment**:
   ```bash
   # Development
   kubectl get all -n dev
   kubectl get svc -n dev

   # Staging
   kubectl get all -n staging
   kubectl get svc -n staging

   # Production
   kubectl get all -n prod
   kubectl get svc -n prod

   # Test each environment
   curl http://<dev-loadbalancer-url>/
   curl http://<staging-loadbalancer-url>/
   curl http://<prod-loadbalancer-url>/
   ```

## Key Features

### 1. Multi-Environment Strategy
- **Environment Isolation**: Separate namespaces for dev, staging, prod
- **Progressive Deployment**: Promotes through environments
- **Independent Configuration**: Different settings per environment
- **Resource Segregation**: Separate resources and limits

### 2. Manual Approval Gate
- **Production Protection**: Requires explicit approval
- **Role-Based Access**: Only authorized users can approve
- **Deployment Control**: Prevents accidental deployments
- **Audit Trail**: Records who approved deployment

### 3. PHP-Specific Workflow
- **Composer Integration**: Automated dependency management
- **Apache/Nginx Ready**: Standard PHP web server configuration
- **Framework Agnostic**: Works with Laravel, Symfony, Slim, etc.
- **Extension Support**: Easy PHP extension installation

### 4. AWS EKS Integration
- **Managed Kubernetes**: AWS-managed control plane
- **Auto-Scaling**: EKS cluster autoscaling
- **Load Balancing**: AWS ELB integration
- **High Availability**: Multi-AZ deployment

### 5. Worker Agent Architecture
- **Distributed Builds**: Offload from master
- **PHP Environment**: Dedicated PHP build environment
- **Scalable**: Add more workers as needed
- **Resource Isolation**: Separate build resources

## Troubleshooting

### Common Issues and Solutions

#### Composer Install Failed
```
Error: Your requirements could not be resolved to an installable set of packages
```

**Solutions**:
1. **Update Composer**:
   ```bash
   composer self-update
   ```

2. **Clear cache**:
   ```bash
   composer clear-cache
   composer install
   ```

3. **Check PHP version**:
   ```bash
   php -v
   # Must match composer.json requirements
   ```

4. **Update dependencies**:
   ```bash
   composer update
   ```

#### Manual Approval Not Showing
```
Error: No input step found
```

**Solutions**:
1. **Install Plugin**:
   ```
   Manage Jenkins > Manage Plugins
   - Install "Pipeline: Input Step" plugin
   ```

2. **Check user permissions**:
   ```
   - Ensure current user has 'admin' role
   - Or update submitter in pipeline
   ```

3. **View pending input**:
   ```
   - Check "Paused for Input" in build page
   - Click on the stage to see approval dialog
   ```

#### Namespace Not Found
```
Error: namespaces "dev" not found
```

**Solutions**:
```bash
# Create all namespaces
kubectl create namespace dev
kubectl create namespace staging
kubectl create namespace prod

# Verify
kubectl get namespaces
```

#### AWS EKS kubeconfig Failed
```
Error: error: You must be logged in to the server (Unauthorized)
```

**Solutions**:
1. **Verify AWS credentials**:
   ```bash
   aws sts get-caller-identity
   ```

2. **Update kubeconfig**:
   ```bash
   aws eks update-kubeconfig --region us-east-1 --name devops-working
   ```

3. **Check IAM permissions**:
   - eks:DescribeCluster
   - eks:ListClusters

#### Different Images in Environments
```
Issue: Dev has old image, prod has new image
```

**Solutions**:
1. **Use version tags**:
   ```groovy
   DOCKER_TAG = "${BUILD_NUMBER}"
   sh "docker build -t repo:${DOCKER_TAG} ."
   ```

2. **Update all manifests**:
   - Update image tag in all deployment YAMLs
   - Or use environment-specific tags

3. **Force pull**:
   ```yaml
   imagePullPolicy: Always
   ```

## Best Practices

### 1. Multi-Environment Strategy
- **Environment Parity**: Keep environments similar
- **Progressive Deployment**: Test in dev/staging before prod
- **Configuration Management**: Use ConfigMaps/Secrets per environment
- **Database Separation**: Separate databases per environment
- **Monitoring**: Monitor all environments

### 2. Approval Process
- **Clear Approval Policy**: Define who can approve
- **Approval Documentation**: Document approval requirements
- **Emergency Procedure**: Define emergency deployment process
- **Approval Timeout**: Set timeout for pending approvals
- **Notification**: Notify approvers when approval needed

### 3. PHP Best Practices
- **Composer Lock**: Always commit composer.lock
- **Autoloading**: Use PSR-4 autoloading
- **Error Handling**: Proper error and exception handling
- **Logging**: Use Monolog or similar
- **Security**: Use prepared statements, validate inputs

### 4. Container Optimization
- **PHP-FPM**: Consider PHP-FPM for better performance
- **OPcache**: Enable OPcache for production
- **Multi-Stage Build**: Reduce final image size
- **Security**: Run as www-data or non-root
- **Extensions**: Only install needed extensions

### 5. Kubernetes Resources
- **Resource Limits**: Set appropriate limits per environment
- **HPA**: Horizontal Pod Autoscaler for production
- **PDB**: Pod Disruption Budgets for HA
- **Affinity**: Pod anti-affinity for spreading
- **Ingress**: Consider Ingress instead of LoadBalancer

### 6. Security
- **Secrets**: Use Kubernetes secrets
- **RBAC**: Implement proper RBAC per namespace
- **Network Policies**: Restrict inter-namespace communication
- **Image Scanning**: Scan PHP images for vulnerabilities
- **Dependency Audit**: Run composer audit

### 7. Testing Strategy
- **Unit Tests**: PHPUnit for unit testing
- **Integration Tests**: Test API endpoints
- **Smoke Tests**: Test after each deployment
- **Load Testing**: Test production-like load in staging
- **Security Testing**: OWASP ZAP or similar

### 8. Monitoring & Logging
- **Application Monitoring**: New Relic, Datadog
- **Log Aggregation**: CloudWatch Logs or ELK
- **APM**: Application Performance Monitoring
- **Error Tracking**: Sentry or Rollbar
- **Metrics**: Export Prometheus metrics
