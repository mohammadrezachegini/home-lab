# GitLab CI/CD - Basic Testing and Examples

## Overview

This project serves as a comprehensive reference and testing ground for GitLab CI/CD pipeline configurations. It contains commented-out examples and working configurations for various CI/CD patterns including Maven builds, Docker containerization, SonarQube integration, Kubernetes deployment, and AWS infrastructure validation.

The configuration file demonstrates evolution of pipeline design, with both legacy patterns (commented out) and current best practices. This makes it an excellent learning resource for understanding GitLab CI/CD concepts, troubleshooting pipelines, and experimenting with different configuration approaches.

## GitLab CI/CD Concepts

This project demonstrates and documents the following GitLab CI/CD concepts:

- **Pipeline Stage Organization**: Various stage naming and ordering patterns
- **Job Naming Conventions**: Different approaches to naming jobs and stages
- **Hidden Jobs**: Using `.` prefix to create reusable job templates
- **Custom Runner Tags**: Targeting specific runners (macos, personal, shell)
- **Maven Integration**: Java build, test, and package workflows
- **Docker Build Strategies**: Multiple approaches to container builds
- **Artifact Management**: Preserving build outputs across stages
- **Test Reporting**: JUnit test report integration
- **SonarQube Integration**: Code quality analysis configuration
- **Docker Registry Options**: Both Docker Hub and private registry examples
- **Pipeline Variables**: Using built-in variables like `$CI_PIPELINE_IID`
- **AWS Configuration**: AWS CLI setup for cloud deployments
- **Kubernetes Deployment**: kubectl integration for EKS clusters
- **Template Inclusion**: Using GitLab CI/CD templates (SAST, Auto DevOps)
- **Job Control**: `allow_failure`, `only`, and other job control directives

## Prerequisites

This is a reference/testing project, so prerequisites depend on which configurations you activate:

### For Maven-Based Jobs
- GitLab Runner with shell executor
- Maven 3.6+ installed
- Java 11+ installed
- `pom.xml` and `settings.xml` configured

### For Docker Jobs
- GitLab Runner with Docker access
- Docker installed on runner
- Docker Hub or private registry credentials

### For SonarQube Jobs
- SonarQube server accessible
- SonarQube project configured
- Authentication token set up

### For AWS/Kubernetes Jobs
- AWS CLI installed
- kubectl installed
- AWS credentials configured
- EKS cluster running

### GitLab CI/CD Variables (as needed)
- `DOCKER_USERNAME` / `DOCKER_PASSWORD`: Docker Hub credentials
- `CI_REGISTRY_USER` / `CI_REGISTRY_PASSWORD`: Private registry credentials
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `AWS_DEFAULT_REGION`: AWS region

## Project Structure

```
justfortest/
├── justfortest.yaml           # GitLab CI/CD pipeline with examples
├── pom.xml                    # Maven project configuration (if using Java)
├── settings.xml               # Maven settings (if deploying artifacts)
├── Dockerfile                 # Docker image configuration (if building containers)
├── Application.yaml           # Kubernetes manifests (if deploying to K8s)
└── src/                       # Source code (if applicable)
```

## Pipeline Configuration Patterns

The `justfortest.yaml` file contains multiple configuration patterns, both commented and active. Let's explore the key patterns:

### Pattern 1: Basic Maven Pipeline (Commented)

```yaml
stages:
  - maven-build
  - maven-test
  - package-stage
  - docker-build-stage
  - docker-push-stage
  - docker-container-stage

.maven-compiled:
  stage: maven-build
  tags:
    - macos
    - personal
    - shell
  script:
    - mvn compile

.maven-test:
  stage: maven-test
  script:
    - mvn test
  artifacts:
    reports:
      junit: target/surefire-reports/*.xml
```

**Purpose**: Basic Maven build and test workflow
**Features**: Compilation, testing, JUnit reports
**Note**: Jobs prefixed with `.` are hidden/template jobs

### Pattern 2: Package and Docker Build (Commented)

```yaml
.package-job:
  stage: package-stage
  script:
    - mvn package -s settings.xml
    - ls target
  artifacts:
    paths:
      - "target/*.war"
    expire_in: 30 days

.docker-build-job:
  stage: docker-build-stage
  script:
    - docker build -t lowyiiii/gitlabtools:$CI_PIPELINE_IID .
  after_script:
    - docker images
```

**Purpose**: Package application and build Docker image
**Features**: Artifact preservation, Docker image tagging with pipeline ID

### Pattern 3: Docker Registry Push (Multiple Options Commented)

```yaml
# Option 1: Docker Hub
.docker-push-job:
  stage: docker-push-stage
  script:
    - echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
    - docker push lowyiiii/gitlabtools:$CI_PIPELINE_IID

# Option 2: Private Registry
.docker-push-jobq:
  stage: docker-container-stage
  script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u $CI_REGISTRY_USER --password-stdin registry.192.168.68.2:9092
    - docker push registry.192.168.68.2:9092/root/test:$CI_PIPELINE_IID
```

**Purpose**: Push images to different registry types
**Options**: Public Docker Hub vs Private registry

### Pattern 4: SonarQube Integration (Commented)

```yaml
.sonarqube-check:
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

**Purpose**: Code quality analysis
**Features**: Caching, conditional execution on main branch

### Pattern 5: Active Pipeline Configuration

The active configuration (lines 270-380) demonstrates a complete pipeline:

```yaml
stages:
- maven-test-stage
- maven-deploy-stage
- sonarqube-stage
- odcker-build-stage
- docker-push-stage
- docker-run-stage
- aws-confiuration-stage
- kubernetes-stage
```

**Note**: Some stage names have typos ("odcker", "confiuration") which are preserved from original

#### Active Jobs:

1. **maven-test-job**: Build, test, and create WAR artifact
2. **maven-deploy-job**: Deploy to Maven repository
3. **sonarqube-check**: Code quality analysis
4. **docker-build-job**: Build Docker image
5. **docker-push-job**: Push to Docker Hub
6. **docker-run-job**: Run container locally
7. **aws-configuration-job**: Configure AWS credentials
8. **kubernetes-job**: Deploy to EKS cluster

## Usage

### Using This as a Learning Reference

1. **Study Different Patterns**:
   ```bash
   # View the configuration
   cat justfortest.yaml | less

   # Search for specific patterns
   grep -A 10 "docker-build" justfortest.yaml
   ```

2. **Activate Different Configurations**:
   ```bash
   # Uncomment sections you want to test
   # Comment out the active section if needed
   ```

3. **Test Specific Jobs**:
   ```yaml
   # Remove the . prefix to activate a job
   maven-compiled:  # Was .maven-compiled
     stage: maven-build
     script:
       - mvn compile
   ```

### Using as a Template

1. **Copy specific patterns**:
   ```bash
   # Extract a specific section
   sed -n '/maven-test-job/,/artifacts:/p' justfortest.yaml > my-pipeline.yml
   ```

2. **Adapt for your project**:
   - Update image tags and registry URLs
   - Modify artifact paths
   - Update cluster names and regions
   - Fix typos in stage names if desired

### Testing Pipeline Changes

1. **Start with minimal pipeline**:
   ```yaml
   stages:
     - test

   test-job:
     stage: test
     script:
       - echo "Testing pipeline"
   ```

2. **Add jobs incrementally**:
   - Add build job
   - Add test job
   - Add package job
   - Add deploy job

3. **Monitor execution**:
   - Check job logs for errors
   - Verify artifacts are created
   - Confirm deployments succeed

## Key Features and Learning Points

### 1. Job Template Pattern

The `.` prefix creates reusable job templates:

```yaml
.common-config:
  tags:
    - macos
    - shell
  before_script:
    - echo "Common setup"

my-job:
  extends: .common-config
  script:
    - echo "Job-specific script"
```

### 2. Multiple Registry Options

Shows different registry configurations:
- Docker Hub (public)
- GitLab Container Registry
- Private self-hosted registry (192.168.x.x)

### 3. Artifact Management Strategies

Different approaches to artifacts:
- Short-term (1 hour)
- Medium-term (30 days)
- Test reports vs build artifacts
- Artifact paths and patterns

### 4. Pipeline Evolution

The file shows pipeline evolution:
- Early versions (commented at top)
- Intermediate versions (middle sections)
- Current version (active at bottom)

### 5. Error Patterns to Learn From

The configuration includes some errors to learn from:
- Typos in stage names ("odcker-build-stage")
- Typos in artifact paths ("tareget/surfire-reports")
- Tag typos ("persoanl" instead of "personal")

These illustrate common mistakes and their debugging.

### 6. Different Execution Contexts

Shows various execution contexts:
- Shell executor on host
- Docker container executor
- Specific runner targeting with tags

### 7. Security Patterns

Demonstrates secure credential handling:
- Using `--password-stdin` for Docker login
- Environment variables for secrets
- AWS configuration without exposing credentials

### 8. Integration Patterns

Multiple third-party integrations:
- SonarQube for code quality
- Docker registries for images
- AWS for cloud infrastructure
- Kubernetes for orchestration

## Troubleshooting

### Common Issues When Using This Configuration

#### Typos in Configuration
```
Error: Stage 'odcker-build-stage' not found
```
**Solution**: Fix typos or ensure job stage names match defined stages:
```yaml
stages:
  - docker-build-stage  # Fix the typo

docker-build-job:
  stage: docker-build-stage  # Match the corrected name
```

#### Artifact Path Errors
```
Warning: No files to upload in target/my-webapp.war
```
**Solution**: Verify correct paths:
```yaml
artifacts:
  paths:
    - "target/my-webapp.war"  # Not "tareget/"
```

#### Hidden Jobs Not Running
```
Note: Job .maven-test is not running
```
**Solution**: This is expected. Remove the `.` prefix to activate:
```yaml
maven-test:  # Remove the dot
  script:
    - mvn test
```

#### Runner Tag Mismatch
```
Error: This job is stuck because the project doesn't have any runners
```
**Solution**:
- Verify runner tags match job requirements
- Fix tag typos ("persoanl" -> "personal")
- Register runners with correct tags

#### Multiple Pipelines Defined
```
Error: Multiple pipeline definitions found
```
**Solution**: Ensure only one pipeline is active (not commented)

## Best Practices Learned from This Configuration

### Pipeline Organization

1. **Clear Stage Naming**: Use descriptive, consistent stage names
2. **Logical Stage Order**: Build -> Test -> Package -> Deploy
3. **Job Naming Convention**: Use `<action>-<context>-job` pattern

### Job Design

1. **Single Responsibility**: Each job should do one thing well
2. **Artifact Strategy**: Only save what's needed, set expiration
3. **Proper Tagging**: Use accurate, consistent runner tags

### Testing and Validation

1. **Syntax Validation**: Check YAML syntax before committing
2. **Incremental Testing**: Test jobs individually before full pipeline
3. **Use Hidden Jobs**: Test with `.` prefix before activating

### Security

1. **Never Commit Secrets**: Always use CI/CD variables
2. **Secure Login Methods**: Use `--password-stdin`
3. **Variable Masking**: Mark sensitive variables as masked

### Maintenance

1. **Comment Old Code**: Keep history but clearly mark as deprecated
2. **Document Changes**: Explain why configurations changed
3. **Version Control**: Track pipeline changes with meaningful commits

## Configuration Cleanup Recommendations

If you're adapting this for production use:

1. **Remove Commented Sections**: Keep only active configuration
2. **Fix Typos**: Correct stage and tag names
3. **Consolidate Stages**: Remove redundant or unused stages
4. **Update URLs**: Replace example registry and cluster names
5. **Optimize Stages**: Combine related operations
6. **Add Comments**: Document why specific configurations exist

Example cleaned-up version:

```yaml
stages:
  - build
  - test
  - package
  - deploy

build-job:
  stage: build
  tags:
    - docker
  script:
    - mvn clean compile

test-job:
  stage: test
  tags:
    - docker
  script:
    - mvn test
  artifacts:
    reports:
      junit: target/surefire-reports/*.xml

# ... rest of pipeline
```
