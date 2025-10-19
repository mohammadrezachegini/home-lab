# GitLab CI/CD for Java Applications

## Overview

This project demonstrates a comprehensive GitLab CI/CD pipeline for Java applications using Maven. The pipeline implements a complete DevOps workflow including building, testing, code quality analysis, Docker containerization, and deployment to AWS EKS (Elastic Kubernetes Service).

The pipeline showcases enterprise-grade practices including artifact management, SonarQube integration for code quality, Docker registry integration, and Kubernetes deployment automation.

## GitLab CI/CD Concepts

This project demonstrates the following GitLab CI/CD concepts:

- **Multi-Stage Pipelines**: Sequential stages for build, test, quality analysis, and deployment
- **Artifacts**: Preserving build outputs (WAR files) and test reports across pipeline stages
- **Custom Runners**: Using self-hosted GitLab runners with specific tags (macos, personal, shell)
- **Docker Integration**: Building and pushing container images to Docker registries
- **Environment Variables**: Secure credential management for AWS and Docker Hub
- **Code Quality**: Integration with SonarQube for static code analysis
- **Test Reporting**: JUnit test report integration for test visibility
- **Kubernetes Deployment**: Automated deployment to AWS EKS clusters
- **Pipeline Variables**: Using built-in variables like `$CI_PIPELINE_IID` for versioning

## Prerequisites

Before using this pipeline, ensure you have:

### Required Tools
- GitLab instance (self-hosted or GitLab.com)
- GitLab Runner installed and registered with appropriate tags
- Maven 3.6+ installed on the runner
- Docker installed on the runner
- AWS CLI installed on the runner
- kubectl installed on the runner

### Required Accounts & Access
- Docker Hub account (or private Docker registry)
- AWS account with EKS cluster configured
- SonarQube server (for code quality analysis)
- Maven repository for artifact deployment

### Required Credentials (GitLab CI/CD Variables)
Set these in GitLab project settings under Settings > CI/CD > Variables:

- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub password
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `AWS_DEFAULT_REGION`: AWS region (e.g., us-east-1)

## Project Structure

```
java-project/
├── java-project.yml          # GitLab CI/CD pipeline configuration
├── pom.xml                    # Maven project configuration (expected)
├── settings.xml               # Maven settings for deployment (expected)
├── Dockerfile                 # Docker image configuration (expected)
├── Application.yaml           # Kubernetes deployment manifest (expected)
└── src/                       # Java source code (expected)
    ├── main/
    │   └── java/
    └── test/
        └── java/
```

## Pipeline Configuration

The pipeline consists of 8 stages defined in `java-project.yml`:

### Stage 1: Maven Test (`maven-test-stage`)

```yaml
maven-test-job:
  stage: maven-test-stage
  tags:
    - macos
    - personal
    - shell
  before_script:
    - mvn -v
  script:
    - mvn clean package
    - mvn test
  artifacts:
    name: war
    paths:
      - "target/my-webapp.war"
    reports:
      junit:
        - target/surefire-reports/TEST.*.xml
    expire_in: 30 days
```

**Purpose**: Compile, package, and test the Java application
**Outputs**: WAR file artifact and JUnit test reports

### Stage 2: Maven Deploy (`maven-deploy-stage`)

```yaml
maven-deploy-job:
  stage: maven-deploy-stage
  script:
    - mvn deploy -s settings.xml
```

**Purpose**: Deploy artifacts to Maven repository
**Requirements**: Configured `settings.xml` with repository credentials

### Stage 3: SonarQube Analysis (`sonarqube-stage`)

```yaml
sonarqube-check:
  stage: sonarqube-stage
  image: maven:3.6.3-jdk-11
  variables:
    SONAR_USER_HOME: "${CI_PROJECT_DIR}/.sonar"
    GIT_DEPTH: "0"
  cache:
    key: "${CI_JOB_NAME}"
    paths:
      - .sonar/cache
  script:
    - mvn verify sonar:sonar -Dsonar.projectKey=root_test_AZOKVHhuL2aw2rzHZn9m
  allow_failure: true
  only:
    - main
```

**Purpose**: Perform static code analysis for code quality and security
**Features**: Caching for faster analysis, runs only on main branch

### Stage 4: Docker Build (`docker-build-stage`)

```yaml
docker-build-job:
  stage: docker-build-stage
  script:
    - docker build -t lowyiiii/gitlabtools:$CI_PIPELINE_IID .
  after_script:
    - docker images
```

**Purpose**: Build Docker container image from the application
**Versioning**: Uses pipeline ID for unique image tags

### Stage 5: Docker Push (`docker-push-stage`)

```yaml
docker-push-job:
  stage: docker-push-stage
  script:
    - echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
    - docker push lowyiiii/gitlabtools:$CI_PIPELINE_IID
```

**Purpose**: Push Docker image to Docker Hub registry
**Security**: Uses environment variables for credentials

### Stage 6: Docker Run (`docker-run-stage`)

```yaml
docker-run-job:
  stage: docker-run-stage
  script:
    - docker run -d -p 80:8081 lowyiiii/gitlabtools:latest
```

**Purpose**: Run the containerized application for testing
**Note**: Maps port 8081 (container) to port 80 (host)

### Stage 7: AWS Configuration (`aws-configuration-stage`)

```yaml
aws-configuration-job:
  stage: aws-configuration-stage
  script:
    - aws configure set aws_access_key_id ${AWS_ACCESS_KEY_ID}
    - aws configure set aws_secret_access_key ${AWS_SECRET_ACCESS_KEY}
    - aws configure set default_region ${AWS_DEFAULT_REGION}
```

**Purpose**: Configure AWS CLI credentials for deployment

### Stage 8: Kubernetes Deployment (`kubernetes-stage`)

```yaml
kubernetes-job:
  stage: kubernetes-stage
  script:
    - aws eks update-kubeconfig --region us-east-1 --name project-work
    - kubectl apply -f Application.yaml
```

**Purpose**: Deploy application to AWS EKS cluster
**Requirements**: Application.yaml with Kubernetes manifests

## Usage

### Setting Up the Pipeline

1. **Copy the pipeline configuration**:
   ```bash
   cp java-project.yml .gitlab-ci.yml
   ```

2. **Configure GitLab CI/CD variables** in your GitLab project:
   - Navigate to Settings > CI/CD > Variables
   - Add all required credentials listed in Prerequisites

3. **Ensure required files exist**:
   - `pom.xml`: Maven project configuration
   - `settings.xml`: Maven repository credentials
   - `Dockerfile`: Container build instructions
   - `Application.yaml`: Kubernetes deployment manifests

4. **Register GitLab Runner** with appropriate tags:
   ```bash
   gitlab-runner register
   # Use tags: macos, personal, shell
   ```

### Running the Pipeline

The pipeline runs automatically on:
- Push to any branch
- Merge requests
- Manual triggers

To run manually:
1. Navigate to CI/CD > Pipelines
2. Click "Run Pipeline"
3. Select branch and run

### Monitoring Pipeline Execution

- **Pipeline View**: CI/CD > Pipelines shows all pipeline runs
- **Job Logs**: Click on individual jobs to view detailed logs
- **Artifacts**: Download WAR files and test reports from job artifacts
- **Test Reports**: View JUnit test results in merge requests

## Key Features

### 1. Comprehensive Testing
- Automated unit test execution with Maven
- JUnit test report integration in GitLab UI
- Test artifacts preserved for 30 days

### 2. Artifact Management
- WAR file artifacts available for download
- Automatic versioning using pipeline IDs
- 30-day artifact retention

### 3. Code Quality Integration
- SonarQube static analysis on main branch
- Caching for improved performance
- Non-blocking (allow_failure: true)

### 4. Container-Based Deployment
- Automated Docker image building
- Version tagging with pipeline IDs
- Registry integration (Docker Hub)

### 5. Cloud-Native Deployment
- AWS EKS integration
- Kubernetes manifest deployment
- Automated kubeconfig updates

### 6. Custom Runner Support
- Self-hosted GitLab runners
- Specific runner targeting with tags
- macOS runner support

## Troubleshooting

### Common Issues and Solutions

#### Pipeline Fails at Maven Test Stage
```
Error: mvn command not found
```
**Solution**: Install Maven on the GitLab runner:
```bash
brew install maven  # macOS
```

#### Docker Build Fails
```
Error: Cannot connect to Docker daemon
```
**Solution**: Ensure Docker is running on the runner:
```bash
docker ps  # Verify Docker is accessible
```

#### AWS Configuration Fails
```
Error: AWS credentials not configured
```
**Solution**: Verify GitLab CI/CD variables are set correctly:
- Check variable names match exactly
- Ensure variables are not masked if needed in logs
- Verify variable scope (protected/environment-specific)

#### Kubernetes Deployment Fails
```
Error: cluster "project-work" not found
```
**Solution**: Verify EKS cluster name and region:
```bash
aws eks list-clusters --region us-east-1
```

#### SonarQube Analysis Fails
```
Error: Project key not found
```
**Solution**:
- Create project in SonarQube with matching key
- Update project key in pipeline configuration
- Verify SonarQube server accessibility

#### Artifact Path Issues
```
Warning: No files to upload
```
**Solution**: Check typos in artifact paths (note "tareget" vs "target" in the YAML)

## Best Practices

### Pipeline Design
1. **Use Specific Runner Tags**: Target specific runners for different environments
2. **Implement Caching**: Cache dependencies (.m2, .sonar) to speed up builds
3. **Set Artifact Expiration**: Clean up old artifacts to save storage
4. **Use Pipeline Variables**: Leverage built-in variables for dynamic values

### Security
1. **Never Hardcode Credentials**: Always use GitLab CI/CD variables
2. **Use Protected Variables**: Mark sensitive variables as protected
3. **Mask Sensitive Output**: Use `--password-stdin` for credential input
4. **Limit Runner Access**: Use specific tags to control job execution

### Maven Configuration
1. **Use Maven Wrapper**: Consider using `mvnw` for version consistency
2. **Configure settings.xml**: Store repository credentials securely
3. **Optimize Dependencies**: Use dependency caching to reduce build time
4. **Version Management**: Use semantic versioning for releases

### Docker Best Practices
1. **Multi-Stage Builds**: Optimize image size with multi-stage Dockerfiles
2. **Tag Strategy**: Use pipeline IDs or Git tags for versioning
3. **Image Scanning**: Add security scanning before push
4. **Registry Choice**: Consider private registries for sensitive applications

### Kubernetes Deployment
1. **Use Namespaces**: Organize deployments by environment
2. **Resource Limits**: Define resource requests and limits
3. **Health Checks**: Implement liveness and readiness probes
4. **Rolling Updates**: Configure deployment strategy for zero downtime

### Testing
1. **Run Tests Early**: Fail fast with tests in early stages
2. **Parallel Testing**: Split tests for faster execution
3. **Coverage Reports**: Add code coverage analysis
4. **Integration Tests**: Consider separate stage for integration tests
