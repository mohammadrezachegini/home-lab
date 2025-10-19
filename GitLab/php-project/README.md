# GitLab CI/CD for PHP Applications

## Overview

This project demonstrates a comprehensive GitLab CI/CD pipeline for PHP applications. The pipeline implements modern PHP development workflows including dependency management with Composer, syntax linting, security scanning (SAST), Docker containerization, and deployment to AWS EKS (Elastic Kubernetes Service).

The pipeline showcases PHP-specific best practices including Composer-based dependency management, syntax validation, GitLab Container Registry integration, and Kubernetes deployment using both Docker-based and shell-based execution strategies.

## GitLab CI/CD Concepts

This project demonstrates the following GitLab CI/CD concepts:

- **Mixed Execution Strategies**: Combining Docker and shell executors
- **Multi-Stage Pipeline**: Build, lint, test, package, and deploy stages
- **Composer Integration**: PHP dependency management with Composer
- **Syntax Linting**: PHP syntax validation before deployment
- **Security Scanning (SAST)**: Automated security vulnerability detection
- **Docker-in-Docker (DinD)**: Container builds within Docker containers
- **GitLab Container Registry**: Built-in Docker registry for container images
- **Custom Runner Tags**: EC2 and PHP-specific runner targeting
- **AWS EKS Deployment**: Kubernetes orchestration on AWS
- **Dynamic Tool Installation**: Runtime installation of kubectl with verification
- **Image Entrypoint Override**: Customizing container entry points

## Prerequisites

Before using this pipeline, ensure you have:

### Required Tools
- GitLab instance (self-hosted or GitLab.com)
- GitLab Runner registered with EC2 and PHP tags
- PHP 7.4+ or 8.x installed on runner
- Composer installed on runner
- Docker 20.10+ installed on runner
- AWS CLI installed on runner

### Required Accounts & Access
- GitLab account with container registry enabled
- AWS account with EKS cluster configured
- Docker registry credentials (GitLab Container Registry)

### Required Credentials (GitLab CI/CD Variables)
Set these in GitLab project settings under Settings > CI/CD > Variables:

- `CI_REGISTRY_USER`: GitLab username (usually provided automatically)
- `CI_REGISTRY_PASSWORD`: GitLab personal access token or job token
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `AWS_DEFAULT_REGION`: AWS region (e.g., us-east-1)

## Project Structure

```
php-project/
├── php-project.yml            # GitLab CI/CD pipeline configuration
├── composer.json              # PHP dependencies configuration (expected)
├── composer.lock              # Locked dependency versions (expected)
├── Dockerfile                 # Docker image configuration (expected)
├── Application.yaml           # Kubernetes deployment manifest (expected)
├── public/                    # Web root directory (expected)
│   └── index.php              # Main entry point
├── src/                       # Application source code (expected)
│   └── *.php
├── tests/                     # PHPUnit test files (expected)
│   └── *Test.php
└── .dockerignore              # Files to exclude from Docker build
```

## Pipeline Configuration

The pipeline consists of 5 stages defined in `php-project.yml`:

### Stage 1: Build (`build`)

```yaml
build:
  stage: build
  image: composer:latest
  tags:
    - ec2
    - php
  script:
    - composer install
```

**Purpose**: Install PHP dependencies using Composer
**Container**: Uses official Composer Docker image
**Features**:
- Installs all dependencies from composer.json
- Creates vendor directory
- Validates composer.lock file
- Runs on EC2 runner with PHP tag

### Stage 2: Lint (`lint`)

```yaml
lint:
  stage: lint
  tags:
    - ec2
    - php
  script:
    - php -l public/index.php
```

**Purpose**: Validate PHP syntax before deployment
**Executor**: Shell executor on EC2 runner
**Features**:
- Checks PHP syntax errors
- Fast feedback on syntax issues
- Uses built-in PHP linter
- No external dependencies required

**What it checks**:
- Syntax errors (missing semicolons, brackets, etc.)
- Invalid PHP code structure
- Parse errors

### Stage 3: Test & Security (`test`)

#### SAST Security Scanning
```yaml
sast:
  stage: test
include:
  - template: Jobs/SAST.gitlab-ci.yml
```

**Purpose**: Static Application Security Testing
**Features**:
- Automatic vulnerability detection in PHP code
- Security dashboard integration
- Common vulnerability detection:
  - SQL injection
  - XSS (Cross-Site Scripting)
  - CSRF vulnerabilities
  - File inclusion vulnerabilities
  - Command injection
  - Insecure deserialization

### Stage 4: Package Docker Image (`package`)

```yaml
package:
  stage: package
  image: docker:20.10.16
  services:
    - docker:20.10.16-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD registry.gitlab.com
  script:
    - docker build -t registry.gitlab.com/lowyiiii/php-test-project .
    - docker push registry.gitlab.com/lowyiiii/php-test-project
```

**Purpose**: Build and publish Docker container image
**Features**:
- Docker-in-Docker (DinD) service for isolated builds
- GitLab Container Registry integration
- Automatic authentication using CI variables
- Latest tag strategy

### Stage 5: Deploy to AWS EKS (`deploy`)

```yaml
deploy:
  stage: deploy
  tags:
    - ec2
    - php
  image: amazon/aws-cli
  entrypoint: [""]
  before_script:
    - curl -O https://s3.us-west-2.amazonaws.com/amazon-eks/1.30.2/2024-07-12/bin/linux/amd64/kubectl
    - curl -O https://s3.us-west-2.amazonaws.com/amazon-eks/1.30.2/2024-07-12/bin/linux/amd64/kubectl.sha256
    - sha256sum -c kubectl.sha256
    - chmod +x ./kubectl
    - mkdir -p $HOME/bin && cp ./kubectl $HOME/bin/kubectl && export PATH=$HOME/bin:$PATH
    - echo 'export PATH=$HOME/bin:$PATH' >> ~/.bashrc
  script:
    - aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
    - aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
    - aws configure set default_region $AWS_DEFAULT_REGION
    - aws eks update-kubeconfig --region $AWS_DEFAULT_REGION --name php-cluster
    - kubectl apply -f Application.yaml
    - kubectl get pods
```

**Purpose**: Deploy application to Kubernetes cluster on AWS
**Features**:
- Official AWS CLI container image
- SHA256-verified kubectl installation
- Dynamic kubeconfig generation
- Pod status verification
- Entrypoint override for script execution

## Usage

### Setting Up the Pipeline

1. **Prepare your PHP application**:
   Create `composer.json` with your dependencies:
   ```json
   {
     "name": "your-vendor/php-project",
     "description": "PHP Application",
     "require": {
       "php": ">=8.0",
       "symfony/http-foundation": "^6.0",
       "guzzlehttp/guzzle": "^7.0"
     },
     "require-dev": {
       "phpunit/phpunit": "^9.5",
       "squizlabs/php_codesniffer": "^3.6"
     },
     "autoload": {
       "psr-4": {
         "App\\": "src/"
       }
     }
   }
   ```

2. **Copy the pipeline configuration**:
   ```bash
   cp php-project.yml .gitlab-ci.yml
   ```

3. **Create Dockerfile** for your PHP app:
   ```dockerfile
   FROM php:8.2-apache

   # Install system dependencies
   RUN apt-get update && apt-get install -y \
       git \
       zip \
       unzip \
       libpng-dev \
       libonig-dev \
       libxml2-dev \
       && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

   # Install Composer
   COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

   # Set working directory
   WORKDIR /var/www/html

   # Copy composer files
   COPY composer.json composer.lock ./

   # Install PHP dependencies
   RUN composer install --no-dev --optimize-autoloader --no-interaction

   # Copy application code
   COPY . .

   # Set permissions
   RUN chown -R www-data:www-data /var/www/html \
       && chmod -R 755 /var/www/html

   # Enable Apache modules
   RUN a2enmod rewrite

   EXPOSE 80

   CMD ["apache2-foreground"]
   ```

4. **Create Kubernetes manifest** (`Application.yaml`):
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: php-app
     labels:
       app: php-app
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: php-app
     template:
       metadata:
         labels:
           app: php-app
       spec:
         containers:
         - name: php-app
           image: registry.gitlab.com/lowyiiii/php-test-project:latest
           ports:
           - containerPort: 80
           env:
           - name: APP_ENV
             value: "production"
           resources:
             limits:
               memory: "256Mi"
               cpu: "500m"
             requests:
               memory: "128Mi"
               cpu: "250m"
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: php-app-service
   spec:
     type: LoadBalancer
     ports:
     - port: 80
       targetPort: 80
     selector:
       app: php-app
   ```

5. **Register GitLab Runner** on EC2 with PHP tag:
   ```bash
   # Install GitLab Runner
   curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | sudo bash
   sudo apt-get install gitlab-runner

   # Install PHP and Composer on runner
   sudo apt-get install php8.2-cli php8.2-common composer

   # Register runner
   sudo gitlab-runner register \
     --url https://gitlab.com/ \
     --registration-token YOUR_TOKEN \
     --executor shell \
     --tag-list "ec2,php"
   ```

6. **Configure GitLab CI/CD variables**:
   - Navigate to Settings > CI/CD > Variables
   - Add AWS credentials
   - Add GitLab Container Registry credentials (usually auto-configured)

### Running the Pipeline

The pipeline executes automatically on:
- Every commit to any branch
- Merge request creation/update
- Manual pipeline triggers

To run manually:
1. Navigate to CI/CD > Pipelines
2. Click "Run Pipeline"
3. Select branch and run

### Local Testing

Before pushing to GitLab, test locally:

```bash
# Install dependencies
composer install

# Run PHP syntax check
find . -name "*.php" -exec php -l {} \;

# Run PHP Code Sniffer
./vendor/bin/phpcs --standard=PSR12 src/

# Run PHPUnit tests
./vendor/bin/phpunit tests/

# Build Docker image
docker build -t php-project:local .

# Run container locally
docker run -p 8080:80 php-project:local
```

## Key Features

### 1. Composer Dependency Management
- Automated dependency installation
- Version locking with composer.lock
- PSR-4 autoloading support
- Dev and production dependencies

### 2. PHP Syntax Validation
- Pre-deployment syntax checking
- Fast feedback on code errors
- Built-in PHP linter
- Prevents deployment of broken code

### 3. Security Scanning
- Built-in SAST for PHP applications
- Common vulnerability detection
- Security dashboard integration
- Automated security reports

### 4. Docker-in-Docker Builds
- Isolated container builds
- No Docker socket mounting
- Secure build environment
- Latest Docker version support

### 5. GitLab Container Registry
- Built-in container registry
- No external registry configuration
- Automatic authentication
- Integrated with GitLab UI

### 6. Mixed Execution Strategy
- Docker executor for isolated builds
- Shell executor for direct access
- Optimized for different job types
- Flexible runner configuration

### 7. AWS EKS Integration
- Kubernetes deployment automation
- Dynamic kubectl installation
- SHA256 verification for security
- Pod health verification

## Troubleshooting

### Common Issues and Solutions

#### Composer Install Fails
```
Error: Your requirements could not be resolved to an installable set of packages.
```
**Solution**: Update composer.lock file:
```bash
composer update
composer install --no-dev
```

#### PHP Syntax Error in Lint Stage
```
Error: Parse error: syntax error, unexpected ';'
```
**Solution**: Fix syntax errors in PHP files before committing:
```bash
php -l public/index.php  # Check specific file
find src/ -name "*.php" -exec php -l {} \;  # Check all files
```

#### Docker Build Fails - Composer Issues
```
Error: Composer detected issues in your platform
```
**Solution**: Update Dockerfile to use correct PHP version:
```dockerfile
FROM php:8.2-apache  # Ensure version matches composer.json requirements
```

#### GitLab Registry Authentication Fails
```
Error: unauthorized: authentication required
```
**Solution**:
- Enable Container Registry in project settings
- Verify `CI_REGISTRY_PASSWORD` is set
- Use job token: `docker login -u $CI_REGISTRY_USER -p $CI_JOB_TOKEN registry.gitlab.com`

#### kubectl Command Not Found in Deploy
```
Error: kubectl: No such file or directory
```
**Solution**: Ensure kubectl download and installation succeeds in before_script:
```bash
# Verify checksum
sha256sum -c kubectl.sha256
# Check PATH
echo $PATH
```

#### AWS EKS Cluster Not Found
```
Error: cluster "php-cluster" not found
```
**Solution**: Verify cluster name and region:
```bash
aws eks list-clusters --region us-east-1
```

#### Apache Permission Issues in Container
```
Error: Permission denied
```
**Solution**: Set correct ownership in Dockerfile:
```dockerfile
RUN chown -R www-data:www-data /var/www/html
```

#### PHP Extensions Missing
```
Error: Call to undefined function
```
**Solution**: Install required PHP extensions in Dockerfile:
```dockerfile
RUN docker-php-ext-install pdo_mysql mysqli gd
```

## Best Practices

### PHP Development

1. **Use Composer Autoloading**:
   ```json
   {
     "autoload": {
       "psr-4": {
         "App\\": "src/"
       }
     }
   }
   ```

2. **Follow PSR Standards**: PSR-4 autoloading, PSR-12 coding style

3. **Version Constraints**:
   ```json
   {
     "require": {
       "php": ">=8.0",
       "vendor/package": "^2.0"  # Use semantic versioning
     }
   }
   ```

4. **Separate Dependencies**:
   - `require`: Production dependencies
   - `require-dev`: Development/testing tools

5. **Use Type Declarations**:
   ```php
   function processData(string $input): array {
       // Function implementation
   }
   ```

### Pipeline Optimization

1. **Cache Composer Dependencies**:
   ```yaml
   cache:
     key: ${CI_COMMIT_REF_SLUG}
     paths:
       - vendor/
   ```

2. **Parallel Linting**:
   ```yaml
   lint:
     parallel:
       matrix:
         - FILE: ["public/index.php", "src/app.php", "src/config.php"]
     script:
       - php -l $FILE
   ```

3. **Artifacts for Dependencies**:
   ```yaml
   build:
     artifacts:
       paths:
         - vendor/
       expire_in: 1 hour
   ```

4. **Add PHPUnit Testing**:
   ```yaml
   test:
     stage: test
     script:
       - ./vendor/bin/phpunit tests/ --coverage-text
     artifacts:
       reports:
         junit: test-results.xml
   ```

### Docker Best Practices

1. **Multi-Stage Builds**:
   ```dockerfile
   # Composer stage
   FROM composer:latest AS composer
   WORKDIR /app
   COPY composer.json composer.lock ./
   RUN composer install --no-dev --optimize-autoloader

   # Runtime stage
   FROM php:8.2-apache
   COPY --from=composer /app/vendor /var/www/html/vendor
   COPY . /var/www/html
   ```

2. **Use .dockerignore**:
   ```
   .git/
   .gitlab-ci.yml
   tests/
   vendor/
   node_modules/
   .env
   *.log
   ```

3. **Security Hardening**:
   ```dockerfile
   # Run as non-root user
   RUN useradd -m -u 1000 phpuser
   USER phpuser

   # Disable dangerous PHP functions
   RUN echo "disable_functions=exec,passthru,shell_exec,system" >> /usr/local/etc/php/conf.d/security.ini
   ```

4. **Optimize PHP Configuration**:
   ```dockerfile
   RUN echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/opcache.ini
   RUN echo "opcache.memory_consumption=128" >> /usr/local/etc/php/conf.d/opcache.ini
   ```

### Testing Strategy

1. **PHPUnit Tests**:
   ```php
   use PHPUnit\Framework\TestCase;

   class UserTest extends TestCase {
       public function testUserCreation() {
           $user = new User("John");
           $this->assertEquals("John", $user->getName());
       }
   }
   ```

2. **Code Coverage**: Aim for >70% coverage:
   ```bash
   ./vendor/bin/phpunit --coverage-html coverage/
   ```

3. **Static Analysis**:
   ```bash
   composer require --dev phpstan/phpstan
   ./vendor/bin/phpstan analyse src/
   ```

4. **Code Style Checking**:
   ```bash
   composer require --dev squizlabs/php_codesniffer
   ./vendor/bin/phpcs --standard=PSR12 src/
   ```

### Security Best Practices

1. **Dependency Scanning**:
   ```yaml
   security-check:
     script:
       - composer audit
   ```

2. **Environment Variables**: Use .env files, never commit secrets
3. **SQL Injection Prevention**: Use prepared statements
4. **XSS Prevention**: Escape output with htmlspecialchars()
5. **CSRF Protection**: Use tokens for form submissions

### Kubernetes Deployment

1. **Health Checks**:
   ```yaml
   livenessProbe:
     httpGet:
       path: /health.php
       port: 80
     initialDelaySeconds: 30
   readinessProbe:
     httpGet:
       path: /ready.php
       port: 80
   ```

2. **Resource Management**:
   ```yaml
   resources:
     limits:
       memory: "256Mi"
       cpu: "500m"
   ```

3. **ConfigMaps for Configuration**:
   ```yaml
   envFrom:
   - configMapRef:
       name: php-config
   ```

4. **Secrets for Credentials**:
   ```yaml
   env:
   - name: DB_PASSWORD
     valueFrom:
       secretKeyRef:
         name: db-credentials
         key: password
   ```
