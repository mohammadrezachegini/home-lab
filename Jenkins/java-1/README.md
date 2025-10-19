# Jenkins Pipeline for Java Applications - Example 1

## Overview

This project demonstrates a streamlined Jenkins CI/CD pipeline for Java applications using Maven, Docker, and DockerHub. This pipeline represents a simplified but production-ready approach to building and deploying Java applications with container technology. It focuses on the core workflow: checkout, build, containerize, push to registry, and deploy. This example is ideal for teams starting with containerized Java deployments.

## Jenkins Concepts

This pipeline demonstrates the following Jenkins concepts:

- **Declarative Pipeline Syntax**: Modern, readable pipeline definition
- **Agent Configuration**: Uses any available Jenkins agent
- **Tools Integration**: Maven tool configuration and usage
- **Build Options**: Implements build discarder with log rotation for disk space management
- **Environment Variables**: Secure credential management using Jenkins credentials
- **Credentials Binding**: Automatic injection of DockerHub credentials as environment variables
- **Post Actions**: Comprehensive post-build actions for all scenarios (always, success, failure)
- **Build Cleanup**: Automatic old build removal to prevent disk space issues

## Prerequisites

### Jenkins Configuration

- Jenkins server (version 2.300+)
- Required Jenkins plugins:
  - Pipeline plugin
  - Git plugin
  - Maven Integration plugin
  - Docker Pipeline plugin
  - Credentials Binding plugin

### Tool Requirements

- **Maven**: Must be configured in Jenkins with the name 'Maven'
  - Navigate to: Manage Jenkins > Global Tool Configuration > Maven
  - Add Maven installation with name 'Maven'
- **Java JDK**: Version 8 or higher
- **Docker**: Installed on Jenkins agent with proper permissions
  - Jenkins user must have access to Docker socket
  - Test with: `docker ps`

### External Services

- **DockerHub Account**: For container image storage
- **GitHub Repository**: Source code repository

### Credentials Setup

Configure the following credentials in Jenkins (Manage Jenkins > Credentials):

- **docker-cred**: DockerHub credentials (Username with password type)
  - Username: Your DockerHub username
  - Password: Your DockerHub password or access token
  - ID: `docker-cred`

## Project Structure

```
java-1/
├── Project-java-1       # Jenkins pipeline definition (Jenkinsfile)
└── README.md           # This documentation
```

Expected source repository structure:
```
Source Repository/
├── pom.xml             # Maven project configuration
├── Dockerfile          # Docker image definition
└── src/                # Java source code
    ├── main/
    │   ├── java/
    │   └── resources/
    └── test/
        └── java/
```

## Pipeline Configuration

### Build Options

```groovy
options {
    buildDiscarder logRotator(
        artifactDaysToKeepStr: '',
        artifactNumToKeepStr: '',
        daysToKeepStr: '30',
        numToKeepStr: '1'
    )
}
```

**Configuration Details**:
- Keeps builds for 30 days
- Keeps only 1 build maximum
- Does not keep artifacts separately
- Helps manage Jenkins disk space

### Environment Configuration

```groovy
environment {
    dockerhub_cred = credentials('docker-cred')
}
```

The credentials are automatically exposed as environment variables:
- `$dockerhub_cred_USR`: DockerHub username
- `$dockerhub_cred_PSW`: DockerHub password

### Pipeline Stages

The pipeline consists of 5 sequential stages:

#### 1. Checkout Stage
```groovy
stage('Checkout stage') {
    steps {
        checkout scmGit(
            branches: [[name: '*/master']],
            extensions: [],
            userRemoteConfigs: [[url: 'https://github.com/mohammadrezachegini/Node-JS-Jenkins']]
        )
    }
}
```

**Purpose**: Clone the source code from GitHub repository
**Branch**: master branch
**Note**: Update the URL to point to your Java project repository

#### 2. Maven Build Stage
```groovy
stage('Maven Build') {
    steps {
        sh 'mvn package'
    }
}
```

**Purpose**: Compile Java code, run tests, and create WAR/JAR package
**Output**: Packaged artifact in `target/` directory
**Maven Goals**:
- Compile source code
- Run unit tests
- Package as WAR/JAR

#### 3. Docker Build Stage
```groovy
stage('docker build') {
    steps {
        sh "docker build -t lowyiiii/project-docker:${BUILD_NUMBER} ."
    }
}
```

**Purpose**: Create Docker image from Dockerfile
**Image Tag**: Uses Jenkins BUILD_NUMBER for version tracking
**Repository**: lowyiiii/project-docker (update with your DockerHub repository)

#### 4. DockerHub Push Stage
```groovy
stage('dockerhub push') {
    steps {
        sh "echo $dockerhub_cred_PSW | docker login -u $dockerhub_cred_USR --password-stdin"
        sh "docker push lowyiiii/project-docker:${BUILD_NUMBER}"
    }
}
```

**Purpose**: Authenticate and push Docker image to DockerHub
**Security**: Uses password-stdin for secure authentication
**Result**: Image available on DockerHub

#### 5. Docker Run Stage
```groovy
stage('Docker run') {
    steps {
        sh "docker run -d -p 80:8080 --name addressbook lowyiiii/project-docker:${BUILD_NUMBER}"
    }
}
```

**Purpose**: Deploy container on Jenkins host
**Port Mapping**: Host port 80 maps to container port 8080
**Container Name**: addressbook
**Mode**: Detached (-d flag)

### Post-Build Actions

```groovy
post {
    always {
        echo "job is completed"
    }
    success {
        echo "It is a success"
    }
    failure {
        echo "It has failed"
    }
}
```

## Usage

### Initial Setup

1. **Create Jenkins Pipeline Job**:
   ```
   - Go to Jenkins Dashboard
   - Click "New Item"
   - Enter job name: "java-app-docker-pipeline"
   - Select "Pipeline"
   - Click "OK"
   ```

2. **Configure Pipeline**:
   ```
   - Pipeline section > Definition: "Pipeline script from SCM"
   - SCM: Git
   - Repository URL: <your-repository-url>
   - Branch: */master
   - Script Path: Jenkins/java-1/Project-java-1
   ```

3. **Update Pipeline Configuration**:

   Edit the `Project-java-1` file to customize:

   ```groovy
   // Line 15: Update repository URL
   userRemoteConfigs: [[url: 'https://github.com/YOUR-USERNAME/YOUR-REPO']]

   // Line 25: Update DockerHub repository
   sh "docker build -t YOUR-DOCKERHUB-USERNAME/YOUR-IMAGE-NAME:${BUILD_NUMBER} ."

   // Line 31: Update DockerHub repository
   sh "docker push YOUR-DOCKERHUB-USERNAME/YOUR-IMAGE-NAME:${BUILD_NUMBER}"

   // Line 36: Update image reference
   sh "docker run -d -p 80:8080 --name YOUR-APP-NAME YOUR-DOCKERHUB-USERNAME/YOUR-IMAGE-NAME:${BUILD_NUMBER}"
   ```

4. **Configure Credentials**:
   ```
   Manage Jenkins > Credentials > System > Global credentials
   - Click "Add Credentials"
   - Kind: Username with password
   - Username: <your-dockerhub-username>
   - Password: <your-dockerhub-password-or-token>
   - ID: docker-cred
   - Description: DockerHub Credentials
   - Click "OK"
   ```

### Required Files in Your Repository

#### 1. pom.xml Example
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.example</groupId>
    <artifactId>addressbook</artifactId>
    <version>2.0</version>
    <packaging>war</packaging>

    <dependencies>
        <!-- Add your dependencies here -->
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-war-plugin</artifactId>
                <version>3.3.1</version>
            </plugin>
        </plugins>
    </build>
</project>
```

#### 2. Dockerfile Example
```dockerfile
FROM tomcat:9-jdk11

# Remove default webapps
RUN rm -rf /usr/local/tomcat/webapps/*

# Copy WAR file to Tomcat webapps
COPY target/addressbook-2.0.war /usr/local/tomcat/webapps/ROOT.war

# Expose port
EXPOSE 8080

# Start Tomcat
CMD ["catalina.sh", "run"]
```

### Running the Pipeline

1. **Manual Execution**:
   - Navigate to your pipeline job
   - Click "Build Now"
   - Watch the Stage View for progress

2. **View Build Progress**:
   - Click on build number (e.g., #1, #2)
   - View "Console Output" for detailed logs
   - Check "Pipeline Steps" for stage-by-stage view

3. **Access Deployed Application**:
   - After successful deployment
   - Access: `http://jenkins-host-ip/`
   - Application runs on port 80

### Automated Triggers (Optional)

#### GitHub Webhook Configuration
```
1. GitHub Repository > Settings > Webhooks
2. Add webhook:
   - Payload URL: http://your-jenkins-url/github-webhook/
   - Content type: application/json
   - Events: Push events
   - Active: checked
```

#### Periodic Builds
```groovy
triggers {
    cron('H */4 * * *')  // Every 4 hours
}
```

## Key Features

### 1. Simplified Workflow
- **Minimal Stages**: Only essential stages for core functionality
- **Quick Builds**: Fast execution for rapid feedback
- **Easy to Understand**: Clear and straightforward pipeline logic

### 2. Build Management
- **Automatic Cleanup**: Old builds removed automatically after 30 days
- **Disk Space Management**: Keeps only 1 build to prevent disk issues
- **Build History**: Maintains build history for troubleshooting

### 3. Container-Based Deployment
- **Docker Containerization**: Ensures consistency across environments
- **Version Tracking**: Each build tagged with unique build number
- **DockerHub Integration**: Centralized image repository

### 4. Secure Credential Handling
- **No Hardcoded Secrets**: All credentials stored in Jenkins
- **Secure Login**: Uses stdin for password input (no exposure in logs)
- **Credential Isolation**: Credentials available only during pipeline execution

### 5. Immediate Deployment
- **Automatic Deployment**: Container deployed immediately after build
- **Port Mapping**: Application accessible on standard HTTP port
- **Container Management**: Named containers for easy management

## Troubleshooting

### Common Issues and Solutions

#### Maven Build Failure
```
Error: [ERROR] Failed to execute goal org.apache.maven.plugins:maven-compiler-plugin
```

**Solutions**:
1. **Check Java Version**:
   ```bash
   java -version  # Should match pom.xml requirements
   ```

2. **Verify Maven Configuration**:
   - Jenkins > Manage Jenkins > Global Tool Configuration
   - Ensure Maven named 'Maven' exists

3. **Check pom.xml**:
   ```bash
   mvn validate  # Test locally first
   ```

4. **Dependency Issues**:
   ```bash
   mvn clean install -U  # Force update dependencies
   ```

#### Docker Build Failed
```
Error: Cannot locate specified Dockerfile
```

**Solutions**:
1. **Verify Dockerfile exists**:
   ```bash
   ls -la Dockerfile  # Should be in repository root
   ```

2. **Check Dockerfile syntax**:
   ```bash
   docker build -t test .  # Test locally
   ```

3. **Docker daemon not running**:
   ```bash
   sudo systemctl status docker
   sudo systemctl start docker
   ```

#### Docker Permission Denied
```
Error: Got permission denied while trying to connect to the Docker daemon socket
```

**Solutions**:
1. **Add Jenkins user to docker group**:
   ```bash
   sudo usermod -aG docker jenkins
   ```

2. **Restart Jenkins**:
   ```bash
   sudo systemctl restart jenkins
   ```

3. **Verify permissions**:
   ```bash
   groups jenkins  # Should include 'docker'
   ```

#### DockerHub Push Failed
```
Error: denied: requested access to the resource is denied
```

**Solutions**:
1. **Verify credentials**:
   - Check username and password in Jenkins credentials
   - Test login manually: `docker login`

2. **Repository doesn't exist**:
   - Create repository on DockerHub first
   - Or use existing repository

3. **Authentication token expired**:
   - Update password in Jenkins credentials
   - Consider using access token instead of password

#### Container Port Already in Use
```
Error: Bind for 0.0.0.0:80 failed: port is already allocated
```

**Solutions**:
1. **Stop existing container**:
   ```bash
   docker stop addressbook
   docker rm addressbook
   ```

2. **Use different port**:
   ```groovy
   sh "docker run -d -p 8081:8080 --name addressbook ..."
   ```

3. **Find and kill process**:
   ```bash
   sudo lsof -i :80
   sudo kill -9 <PID>
   ```

#### Container Name Already in Use
```
Error: The container name "/addressbook" is already in use
```

**Solutions**:
1. **Remove old container**:
   ```bash
   docker rm -f addressbook
   ```

2. **Add cleanup stage**:
   ```groovy
   stage('Cleanup') {
       steps {
           sh 'docker rm -f addressbook || true'
       }
   }
   ```

## Best Practices

### 1. Code Quality
- **Run Tests**: Ensure Maven tests pass before building Docker image
- **Code Reviews**: Implement pull request reviews before merging
- **Static Analysis**: Consider adding SonarQube for code quality
- **Test Coverage**: Maintain minimum test coverage requirements

### 2. Security
- **Scan Images**: Use Docker image scanning tools (Trivy, Clair)
- **Update Base Images**: Regularly update base images for security patches
- **Secret Management**: Never commit credentials to repository
- **Network Security**: Use Docker networks for container isolation
- **Use Access Tokens**: Prefer DockerHub access tokens over passwords

### 3. Pipeline Optimization
- **Maven Caching**: Configure Maven local repository for faster builds
- **Docker Layer Caching**: Optimize Dockerfile layer ordering
- **Parallel Stages**: Run independent tests in parallel
- **Conditional Stages**: Skip unnecessary stages based on conditions

### 4. Deployment Strategy
- **Health Checks**: Add health check endpoints to your application
- **Graceful Shutdown**: Implement proper shutdown handling
- **Resource Limits**: Set Docker container resource limits
- **Logging**: Configure proper application logging
- **Monitoring**: Add monitoring and alerting

### 5. Image Management
- **Tag Strategy**: Use semantic versioning for production images
- **Multiple Tags**: Tag with both build number and 'latest'
- **Image Cleanup**: Implement cleanup for old images
- **Image Size**: Optimize Dockerfile to reduce image size

### 6. Build Hygiene
- **Clean Builds**: Always start with clean build
- **Reproducible Builds**: Ensure builds are deterministic
- **Build Artifacts**: Store important build artifacts
- **Build Documentation**: Document build requirements

### 7. Container Deployment
- **Use Docker Compose**: For multi-container applications
- **Container Orchestration**: Consider Kubernetes for production
- **Rolling Updates**: Implement zero-downtime deployments
- **Rollback Strategy**: Have rollback plan for failed deployments
