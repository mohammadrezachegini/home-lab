# GitLab CI/CD for Java Applications - Advanced Pipeline

## Overview

This project demonstrates an advanced GitLab CI/CD pipeline for Java applications with enhanced security and deployment features. The pipeline implements modern DevOps practices including automated testing, security scanning (SAST), Docker containerization using GitLab Container Registry, and deployment to AWS EKS with kubectl integration.

This advanced example builds upon basic Java CI/CD concepts by incorporating GitLab's built-in security features, Docker-in-Docker (DinD) for containerization, and streamlined AWS deployment with integrated kubectl setup.

## GitLab CI/CD Concepts

This project demonstrates the following advanced GitLab CI/CD concepts:

- **Standard Pipeline Stages**: Following GitLab conventions (build, test, package, deploy)
- **Docker-in-Docker (DinD)**: Running Docker commands within Docker containers
- **GitLab Container Registry**: Using GitLab's built-in container registry
- **Security Scanning (SAST)**: Static Application Security Testing integration
- **Template Inclusion**: Using GitLab CI/CD templates for common functionality
- **JUnit Test Reporting**: Native test result visualization in GitLab
- **AWS CLI Container**: Using official AWS container images for deployment
- **Dynamic kubectl Installation**: Installing tools in pipeline containers
- **Artifact Management**: Preserving build outputs across stages
- **Image-Based Jobs**: Using Docker images for consistent environments

## Prerequisites

Before using this pipeline, ensure you have:

### Required Tools (Pre-installed in Container Images)
- GitLab instance (self-hosted or GitLab.com)
- GitLab Runner with Docker executor enabled
- Docker 20.10+ support on runners
- Access to GitLab Container Registry

### Required Accounts & Access
- GitLab account with container registry enabled
- AWS account with EKS cluster configured
- Maven repository for artifact deployment (optional)

### Required Credentials (GitLab CI/CD Variables)
Set these in GitLab project settings under Settings > CI/CD > Variables:

- `CI_REGISTRY_USER`: GitLab username (usually provided automatically)
- `CI_REGISTRY_PASSWORD`: GitLab personal access token or job token
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `AWS_DEFAULT_REGION`: AWS region (e.g., us-east-1)
- `KUBE_CONTEXT`: Kubernetes context name for deployment

## Project Structure

```
Java-project-2/
├── Java-project-2.yml         # GitLab CI/CD pipeline configuration
├── pom.xml                     # Maven project configuration (expected)
├── settings.xml                # Maven settings for deployment (expected)
├── Dockerfile                  # Docker image configuration (expected)
├── Application.yaml            # Kubernetes deployment manifest (expected)
└── src/                        # Java source code (expected)
    ├── main/
    │   └── java/
    │       └── com/example/
    │           ├── MyServlet.java
    │           └── AppTest.java
    └── test/
        └── java/
            └── com/example/
                ├── MyServletTest.java
                └── AppTest.java
```

## Pipeline Configuration

The pipeline consists of 5 stages defined in `Java-project-2.yml`:

### Stage 1: Build (`build`)

```yaml
build-job:
  stage: build
  image: maven:latest
  script:
    - mvn clean package
  artifacts:
    name: war-project
    paths:
      - target/my-webapp.war
```

**Purpose**: Compile and package the Java application
**Container**: Uses official Maven Docker image
**Outputs**: WAR file artifact for subsequent stages

### Stage 2: Test (`test`)

#### Test Job
```yaml
test-job:
  stage: test
  image: maven:latest
  script:
    - mvn test
  artifacts:
    reports:
      junit:
        - target/surefire-reports/TEST-com.example.MyServletTest-junit.xml
        - target/surefire-reports/TEST-com.example.AppTest-junit.xml
```

**Purpose**: Run unit tests and generate test reports
**Features**: JUnit test reports displayed in GitLab UI and merge requests

#### SAST Security Scanning
```yaml
sast:
  stage: test
include:
  - template: Jobs/SAST.gitlab-ci.yml
```

**Purpose**: Perform Static Application Security Testing
**Features**:
- Automatic security vulnerability detection
- Integrated security dashboard in GitLab
- No additional configuration required

### Stage 3: Package (`package`)

```yaml
package-job:
  stage: package
  image: maven:latest
  script:
    - mvn deploy -s settings.xml
```

**Purpose**: Deploy artifacts to Maven repository
**Requirements**: Configured `settings.xml` with repository credentials

### Stage 4: Docker Build & Push (`docker-stage`)

```yaml
docker-job:
  stage: docker-stage
  image: docker:20.10.16
  services:
    - docker:20.10.16-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD registry.gitlab.com
  script:
    - docker build -t registry.gitlab.com/lowyiiii/java-project .
    - docker push registry.gitlab.com/lowyiiii/java-project
```

**Purpose**: Build and push Docker image to GitLab Container Registry
**Features**:
- Docker-in-Docker (DinD) service for container builds
- GitLab Container Registry integration
- Automatic authentication using CI variables

### Stage 5: Deploy to Kubernetes (`deploy`)

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
    - mkdir -p $HOME/bin && cp ./kubectl $HOME/bin/kubectl && export PATH=$HOME/bin:$PATH
    - echo 'export PATH=$HOME/bin:$PATH' >> ~/.bashrc
  script:
    - aws configure set aws_access_key $AWS_ACCESS_KEY_ID
    - aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
    - aws configure set default_region $AWS_DEFAULT_REGION
    - kubectl config use-context "$KUBE_CONTEXT"
    - kubectl apply -f Application.yaml
```

**Purpose**: Deploy application to AWS EKS cluster
**Features**:
- Uses official AWS CLI container image
- Downloads and verifies kubectl binary
- Configures AWS credentials dynamically
- Applies Kubernetes manifests

## Usage

### Setting Up the Pipeline

1. **Copy the pipeline configuration**:
   ```bash
   cp Java-project-2.yml .gitlab-ci.yml
   ```

2. **Enable Container Registry** in GitLab:
   - Navigate to Settings > General > Visibility
   - Enable Container Registry

3. **Configure GitLab CI/CD variables**:
   - Navigate to Settings > CI/CD > Variables
   - Add AWS credentials and Kubernetes context

4. **Create required files**:
   - `pom.xml`: Maven project configuration
   - `settings.xml`: Maven repository credentials (optional)
   - `Dockerfile`: Container build instructions
   - `Application.yaml`: Kubernetes deployment manifests

5. **Configure GitLab Runner** with Docker executor:
   ```toml
   [[runners]]
     executor = "docker"
     [runners.docker]
       privileged = true  # Required for Docker-in-Docker
   ```

### Running the Pipeline

The pipeline executes automatically on:
- Push to any branch
- Merge request creation/update
- Manual pipeline triggers
- Scheduled pipelines

To run manually:
1. Navigate to CI/CD > Pipelines
2. Click "Run Pipeline"
3. Select branch and optional variables
4. Click "Run Pipeline"

### Viewing Test Results

Test reports are available in multiple locations:
- **Merge Requests**: Test tab shows test results
- **Pipeline View**: Test summary in pipeline details
- **Job Artifacts**: Download full test reports

### Viewing Security Scan Results

SAST results are available in:
- **Merge Requests**: Security tab shows vulnerabilities
- **Security Dashboard**: Project-level security overview
- **Pipeline Security Report**: Detailed vulnerability information

## Key Features

### 1. Container-Based Execution
- All jobs run in Docker containers
- Consistent, reproducible build environments
- No dependencies on runner configuration

### 2. Integrated Security Scanning
- Automatic SAST (Static Application Security Testing)
- Vulnerability detection in source code
- Security reports in merge requests

### 3. GitLab Container Registry
- Built-in container registry
- No external registry configuration needed
- Automatic authentication with job tokens

### 4. Advanced Test Reporting
- JUnit test report integration
- Visual test results in GitLab UI
- Test trend tracking across pipelines

### 5. Docker-in-Docker (DinD)
- Build Docker images within pipeline
- No Docker socket mounting required
- Isolated container builds

### 6. Dynamic Tool Installation
- kubectl installed at runtime
- SHA256 verification for security
- Latest tool versions without runner updates

### 7. Clean Stage Separation
- Clear build, test, package, deploy workflow
- Artifact passing between stages
- Independent stage execution

## Troubleshooting

### Common Issues and Solutions

#### Docker-in-Docker Service Fails
```
Error: Cannot connect to Docker daemon
```
**Solution**: Enable privileged mode in runner configuration:
```toml
[[runners]]
  [runners.docker]
    privileged = true
```

#### GitLab Registry Login Fails
```
Error: unauthorized: authentication required
```
**Solution**:
- Verify Container Registry is enabled in project settings
- Check `CI_REGISTRY_PASSWORD` is set correctly
- Use job token: `$CI_JOB_TOKEN` instead of `$CI_REGISTRY_PASSWORD`

#### kubectl Download Fails
```
Error: kubectl.sha256: FAILED
```
**Solution**:
- Verify internet connectivity from runner
- Check AWS S3 endpoint accessibility
- Consider caching kubectl binary in custom image

#### AWS EKS Authentication Fails
```
Error: You must be logged in to the server
```
**Solution**:
- Verify AWS credentials are correct
- Check IAM permissions for EKS access
- Ensure EKS cluster exists in specified region

#### SAST Job Fails
```
Error: Template not found
```
**Solution**:
- Ensure GitLab version supports SAST templates
- Use correct template path: `Jobs/SAST.gitlab-ci.yml`
- Check GitLab Ultimate/Free tier restrictions

#### Maven Build Fails - Dependencies
```
Error: Failed to collect dependencies
```
**Solution**: Add dependency caching:
```yaml
cache:
  paths:
    - .m2/repository
variables:
  MAVEN_OPTS: "-Dmaven.repo.local=$CI_PROJECT_DIR/.m2/repository"
```

## Best Practices

### Pipeline Optimization

1. **Use Image Caching**:
   ```yaml
   variables:
     DOCKER_DRIVER: overlay2
   ```

2. **Cache Dependencies**:
   ```yaml
   cache:
     key: ${CI_COMMIT_REF_SLUG}
     paths:
       - .m2/repository
   ```

3. **Parallel Job Execution**:
   ```yaml
   test-job:
     parallel: 3
   ```

4. **Only/Except Rules**:
   ```yaml
   deploy-job:
     only:
       - main
       - production
   ```

### Security Best Practices

1. **Protected Variables**: Mark sensitive variables as protected
2. **Masked Variables**: Hide sensitive values in job logs
3. **Limited Scope**: Use environment-specific variables
4. **Minimal Permissions**: Grant least privilege for AWS IAM
5. **Image Scanning**: Add container image security scanning
6. **Dependency Scanning**: Enable dependency vulnerability checks

### Docker Best Practices

1. **Multi-Stage Builds**:
   ```dockerfile
   FROM maven:latest AS build
   WORKDIR /app
   COPY . .
   RUN mvn package

   FROM tomcat:9-jre11
   COPY --from=build /app/target/*.war /usr/local/tomcat/webapps/
   ```

2. **Layer Optimization**: Order Dockerfile commands by change frequency
3. **Security Scanning**: Use `container_scanning` template
4. **Image Tagging**: Use Git tags or semantic versioning
5. **Registry Cleanup**: Configure registry cleanup policies

### Kubernetes Deployment

1. **Use Namespaces**:
   ```yaml
   kubectl apply -f Application.yaml -n production
   ```

2. **Rolling Updates**:
   ```yaml
   spec:
     strategy:
       type: RollingUpdate
   ```

3. **Health Checks**:
   ```yaml
   livenessProbe:
     httpGet:
       path: /health
       port: 8080
   ```

4. **Resource Limits**:
   ```yaml
   resources:
     limits:
       memory: "512Mi"
       cpu: "500m"
   ```

### Testing Strategy

1. **Unit Tests**: Run in test stage
2. **Integration Tests**: Separate job or stage
3. **Code Coverage**: Add JaCoCo plugin
4. **Test Parallelization**: Split tests for speed
5. **Test Data**: Use test fixtures and mock data
