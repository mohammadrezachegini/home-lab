# Jenkins Pipeline for Java Applications

## Overview

This project demonstrates a comprehensive Jenkins CI/CD pipeline for Java-based applications using Maven. The pipeline integrates multiple DevOps tools including SonarQube for code quality analysis, Nexus for artifact management, Docker for containerization, AWS ECR for container registry, and Kubernetes for deployment. This represents a production-ready pipeline that follows enterprise best practices.

## Jenkins Concepts

This pipeline demonstrates the following Jenkins concepts:

- **Declarative Pipeline Syntax**: Uses the modern declarative pipeline approach for better readability and maintainability
- **Environment Variables**: Leverages Jenkins credentials and environment variables for secure secret management
- **Tools Integration**: Configures and uses Maven as a build tool
- **SCM Integration**: Checks out source code from GitHub repositories
- **Post Actions**: Implements always, success, and failure post-build actions for notifications and cleanup
- **Credentials Management**: Uses Jenkins credentials store for AWS and Nexus authentication

## Prerequisites

### Jenkins Configuration

- Jenkins server (version 2.300+)
- Required Jenkins plugins:
  - Pipeline plugin
  - Git plugin
  - Maven Integration plugin
  - SonarQube Scanner plugin
  - Nexus Artifact Uploader plugin
  - Docker Pipeline plugin
  - Kubernetes plugin
  - AWS Steps plugin
  - Credentials Binding plugin

### Tool Requirements

- **Maven**: Configured in Jenkins Global Tool Configuration with the name 'Maven'
- **Java JDK**: Version 8 or higher
- **Docker**: Installed on Jenkins agent with proper permissions
- **kubectl**: Configured with access to target Kubernetes cluster
- **AWS CLI**: Configured for ECR access

### External Services

- **SonarQube Server**: Running on `http://localhost:9000`
- **Nexus Repository**: Running on `127.0.0.1:8081`
- **AWS ECR**: Repository URL `381492238320.dkr.ecr.us-east-2.amazonaws.com/super-projects`
- **Kubernetes Cluster**: Configured and accessible via kubectl

### Credentials Setup

Configure the following credentials in Jenkins:

- **aws-key**: AWS access key and secret for ECR authentication and EKS access
- **nexus**: Nexus repository credentials (username/password)

## Project Structure

```
java/
├── java-project          # Jenkins pipeline definition (Jenkinsfile)
└── README.md            # This documentation
```

The pipeline expects the following repository structure:
```
Source Repository/
├── pom.xml              # Maven project configuration
├── Dockerfile           # Docker image definition
├── Application.yaml     # Kubernetes deployment manifests
└── src/                 # Java source code
    └── main/
        └── java/
```

## Pipeline Configuration

### Pipeline Stages

The pipeline consists of 7 main stages:

#### 1. Checkout Stage
```groovy
stage('Checkout') {
    steps {
        checkout scmGit(
            branches: [[name: '*/main']],
            userRemoteConfigs: [[url: 'https://github.com/mohammadrezachegini/Super-Project/']]
        )
    }
}
```
Pulls the latest code from the GitHub repository's main branch.

#### 2. SonarQube Analysis
```groovy
stage('SonarQube Analysis') {
    steps {
        script {
            def mvn = tool 'Maven'
            sh """
            ${mvn}/bin/mvn clean verify sonar:sonar \
            -Dsonar.projectKey=superprojects \
            -Dsonar.projectName='superprojects' \
            -Dsonar.host.url=http://localhost:9000 \
            -Dsonar.login=squ_87a839689fc6fcfe0b28cbcc974c673576ab2641
            """
        }
    }
}
```
Performs static code analysis for code quality, security vulnerabilities, and code smells.

#### 3. Maven Build
```groovy
stage('Maven build') {
    steps {
        sh 'mvn package'
    }
}
```
Compiles the Java application and packages it as a WAR file.

#### 4. Nexus Artifact Upload
```groovy
stage('Nexus') {
    steps {
        nexusArtifactUploader(
            nexusVersion: 'nexus3',
            protocol: 'http',
            nexusUrl: '127.0.0.1:8081',
            groupId: 'addressbook',
            version: '2.0-SNAPSHOT',
            repository: 'maven-snapshots',
            credentialsId: 'nexus',
            artifacts: [[
                artifactId: 'superproject',
                type: 'war',
                classifier: 'debug',
                file: 'target/addressbook-2.0.war'
            ]]
        )
    }
}
```
Uploads the built artifact to Nexus repository manager for version control and artifact management.

#### 5. Docker Build
```groovy
stage('Docker Build') {
    steps {
        sh 'docker build -t 381492238320.dkr.ecr.us-east-2.amazonaws.com/super-projects:${BUILD_NUMBER} .'
    }
}
```
Creates a Docker image with the application, tagged with Jenkins build number.

#### 6. Docker Push to AWS ECR
```groovy
stage('Docker Push') {
    steps {
        sh 'aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 381492238320.dkr.ecr.us-east-2.amazonaws.com'
        sh 'docker push 381492238320.dkr.ecr.us-east-2.amazonaws.com/super-projects:${BUILD_NUMBER}'
        sh 'docker tag 381492238320.dkr.ecr.us-east-2.amazonaws.com/super-projects:${BUILD_NUMBER} 381492238320.dkr.ecr.us-east-2.amazonaws.com/super-projects:latest'
        sh 'docker push 381492238320.dkr.ecr.us-east-2.amazonaws.com/super-projects:latest'
    }
}
```
Authenticates with AWS ECR and pushes both versioned and latest tags of the Docker image.

#### 7. Kubernetes Deployment
```groovy
stage('k8s deployment') {
    steps {
        sh 'kubectl apply -f Application.yaml'
    }
}
```
Deploys the application to Kubernetes cluster using kubectl.

### Environment Variables

```groovy
environment {
    cred = credentials('aws-key')
}
```

The `aws-key` credentials are automatically made available as environment variables for AWS operations.

### Post-Build Actions

```groovy
post {
    always {
        echo "job completed"
    }
    success {
        echo "job successed"
    }
    failure {
        echo "job failed"
    }
}
```

## Usage

### Setting Up the Pipeline

1. **Create Jenkins Pipeline Job**:
   ```
   - Navigate to Jenkins Dashboard
   - Click "New Item"
   - Enter job name and select "Pipeline"
   - Click "OK"
   ```

2. **Configure Pipeline**:
   ```
   - Under "Pipeline" section
   - Definition: Pipeline script from SCM
   - SCM: Git
   - Repository URL: <your-repo-url>
   - Script Path: Jenkins/java/java-project
   ```

3. **Update Configuration**:
   - Replace GitHub repository URL with your repository
   - Update AWS ECR repository URL with your ECR registry
   - Update SonarQube login token
   - Update Nexus URL if different

4. **Configure Required Credentials**:
   ```
   Jenkins > Manage Jenkins > Credentials
   - Add AWS credentials (aws-key)
   - Add Nexus credentials (nexus)
   ```

### Running the Pipeline

1. **Manual Execution**:
   - Navigate to the pipeline job
   - Click "Build Now"
   - Monitor the build progress in the console output

2. **Automated Triggers** (Optional):
   - Configure webhook in GitHub to trigger builds on push
   - Set up periodic builds using cron syntax
   - Trigger from upstream jobs

### Monitoring Build Progress

- **Blue Ocean UI**: Provides visual representation of pipeline stages
- **Console Output**: Detailed logs of each stage execution
- **Stage View**: Visual timeline of stage execution and duration

## Key Features

### 1. Comprehensive Quality Gates
- **SonarQube Integration**: Automated code quality analysis
- **Security Scanning**: Identifies potential security vulnerabilities
- **Code Coverage**: Reports on test coverage metrics
- **Code Smells**: Detects maintainability issues

### 2. Artifact Management
- **Nexus Repository**: Centralized artifact storage
- **Version Control**: Snapshots with proper versioning
- **Artifact Traceability**: Track which artifacts are deployed where

### 3. Container-Based Deployment
- **Docker Containerization**: Consistent deployment across environments
- **Multi-Tagging**: Build-specific and latest tags
- **AWS ECR**: Secure, scalable container registry

### 4. Kubernetes Orchestration
- **Declarative Deployment**: Using Kubernetes manifests
- **Rolling Updates**: Zero-downtime deployments
- **Scalability**: Automatic scaling based on load

### 5. Build Notifications
- **Post-Build Actions**: Notifications for success/failure
- **Console Logging**: Detailed execution logs
- **Status Tracking**: Clear indication of build status

## Troubleshooting

### Common Issues and Solutions

#### SonarQube Connection Failed
```
Error: Failed to connect to SonarQube server
```
**Solution**:
- Verify SonarQube server is running: `curl http://localhost:9000`
- Check SonarQube token is valid
- Ensure Jenkins has network access to SonarQube server

#### Maven Build Failures
```
Error: Failed to execute goal on project
```
**Solution**:
- Check Maven is properly configured in Jenkins
- Verify pom.xml is valid
- Check Java version compatibility
- Review dependency versions in pom.xml

#### Docker Build Issues
```
Error: Cannot connect to Docker daemon
```
**Solution**:
- Verify Docker is running: `docker info`
- Add Jenkins user to docker group: `sudo usermod -aG docker jenkins`
- Restart Jenkins service after group change
- Check Dockerfile syntax

#### AWS ECR Authentication Failed
```
Error: no basic auth credentials
```
**Solution**:
- Verify AWS credentials are configured correctly
- Check IAM permissions for ECR operations
- Ensure AWS CLI is installed and accessible
- Test AWS credentials: `aws ecr describe-repositories --region us-east-2`

#### Kubernetes Deployment Failed
```
Error: error: unable to recognize "Application.yaml"
```
**Solution**:
- Verify kubectl is configured: `kubectl cluster-info`
- Check Application.yaml syntax
- Ensure namespace exists
- Verify Kubernetes cluster is accessible

#### Nexus Upload Failed
```
Error: 401 Unauthorized
```
**Solution**:
- Verify Nexus credentials in Jenkins
- Check Nexus repository permissions
- Ensure repository name is correct
- Verify Nexus server is accessible

## Best Practices

### 1. Security
- **Never hardcode credentials**: Always use Jenkins credentials store
- **Use IAM roles**: When possible, use IAM roles instead of access keys
- **Rotate credentials**: Regularly update passwords and tokens
- **Scan images**: Add container image scanning for vulnerabilities
- **Network security**: Use private networks for internal services

### 2. Pipeline Design
- **Keep pipelines simple**: Each stage should have a single responsibility
- **Use shared libraries**: Extract common functions to shared libraries
- **Implement retry logic**: Add retry for transient failures
- **Parallel execution**: Run independent stages in parallel
- **Timeout configuration**: Set appropriate timeouts for each stage

### 3. Build Optimization
- **Maven caching**: Use Maven local repository caching
- **Docker layer caching**: Optimize Dockerfile for layer caching
- **Artifact cleanup**: Implement retention policies
- **Resource allocation**: Allocate appropriate resources to Jenkins agents

### 4. Testing
- **Unit tests**: Run unit tests before building
- **Integration tests**: Add integration test stage
- **Smoke tests**: Verify deployment with smoke tests
- **Quality gates**: Fail builds on quality threshold violations

### 5. Monitoring and Observability
- **Build metrics**: Track build duration and success rate
- **Pipeline visualization**: Use Blue Ocean for better visibility
- **Logging**: Implement structured logging
- **Alerting**: Set up alerts for build failures

### 6. Version Control
- **Tag images**: Always tag Docker images with version numbers
- **Semantic versioning**: Follow semantic versioning for artifacts
- **Release branches**: Use proper branching strategy
- **Changelog**: Maintain changelog for releases
