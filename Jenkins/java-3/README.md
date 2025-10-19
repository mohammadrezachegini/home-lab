# Jenkins Pipeline for Java Applications - Example 3

## Overview

This project demonstrates an enterprise-grade, complete CI/CD pipeline for Java applications integrating the full DevOps toolchain. The pipeline combines SonarQube for code quality analysis, Nexus for artifact management, AWS ECR for container registry, and AWS EKS for Kubernetes deployment. This represents the most comprehensive example in the repository, showcasing how all DevOps tools work together in a production environment to deliver quality, traceable, and secure deployments.

## Jenkins Concepts

This pipeline demonstrates the following advanced Jenkins concepts:

- **Declarative Pipeline Syntax**: Enterprise-grade pipeline structure
- **Agent Configuration**: Flexible agent selection for distributed builds
- **Build Options**: Advanced log rotation and build retention policies
- **Tools Integration**: Maven build tool with custom configuration
- **Script Blocks**: Embedded Groovy scripts for complex operations
- **Environment Variables**: AWS credentials management
- **Credentials Binding**: Secure credential injection
- **Tool Configuration**: Dynamic tool path resolution
- **Post-Build Actions**: Comprehensive status handling (always, success, failure)
- **Multi-Stage Pipeline**: Complex workflow with quality gates
- **Cloud Integration**: AWS ECR and EKS integration

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
  - AWS Steps plugin
  - Kubernetes CLI plugin
  - Credentials Binding plugin

### Tool Requirements

- **Maven**: Configured in Jenkins Global Tool Configuration with name 'Maven'
  - Version 3.6+ recommended
- **Java JDK**: Version 8 or 11
- **Docker**: Installed on Jenkins agent with proper permissions
- **kubectl**: Kubernetes CLI configured on Jenkins agent
- **AWS CLI**: Version 2.x with EKS and ECR access

### External Services

- **SonarQube Server**: Running and accessible
  - Installation: http://3.145.207.162:9000 (update with your server)
  - Project configured with proper permissions
- **Nexus Repository Manager**: Version 3.x
  - URL: http://3.145.207.162:8081
  - Repository 'maven-snapshots' created
- **AWS ECR**: Container registry in us-east-1
  - Repository: 381492204839.dkr.ecr.us-east-1.amazonaws.com/super-project
- **AWS EKS**: Kubernetes cluster named 'super-project' in us-east-1

### Credentials Setup

Configure the following credentials in Jenkins:

1. **aws-key**: AWS credentials
   - Type: AWS Credentials
   - Access Key ID: Your AWS access key
   - Secret Access Key: Your AWS secret key
   - ID: `aws-key`

2. **nexus**: Nexus repository credentials
   - Type: Username with password
   - Username: Nexus username
   - Password: Nexus password
   - ID: `nexus`

## Project Structure

```
java-3/
├── Project-java-3      # Jenkins pipeline definition (Jenkinsfile)
└── README.md          # This documentation
```

Expected source repository structure:
```
Source Repository/
├── pom.xml            # Maven project configuration
├── Dockerfile         # Docker image definition
├── Application.yaml   # Kubernetes deployment manifests
└── src/               # Java source code
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
        numToKeepStr: '2'
    )
}
```

**Retention Strategy**:
- Keeps builds for 30 days
- Maintains last 2 builds
- Optimizes disk space usage
- Preserves recent history for troubleshooting

### Environment Variables

```groovy
environment {
    cred = credentials('aws-key')
}
```

**Available Variables**:
- `AWS_ACCESS_KEY_ID`: Automatically set from credentials
- `AWS_SECRET_ACCESS_KEY`: Automatically set from credentials
- Used for AWS ECR and EKS operations

### Pipeline Stages

The pipeline consists of 7 comprehensive stages:

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

**Purpose**: Clone source code from GitHub
**Branch**: master
**Note**: Update URL to your Java application repository

#### 2. SonarQube Analysis Stage
```groovy
stage('sonar test') {
    steps {
        script {
            def mvn = tool 'Maven';
            withSonarQubeEnv(installationName: 'sonarqube-server') {
                sh "${mvn}/bin/mvn clean verify sonar:sonar -Dsonar.projectKey=superproject -Dsonar.projectName='superproject'"
            }
        }
    }
}
```

**Purpose**: Perform comprehensive code quality analysis
**Operations**:
- Static code analysis
- Security vulnerability detection
- Code coverage measurement
- Technical debt assessment
- Code smell identification
- Complexity metrics

**Quality Metrics Analyzed**:
- Bugs
- Vulnerabilities
- Code Smells
- Duplications
- Coverage
- Maintainability Rating
- Reliability Rating
- Security Rating

#### 3. Maven Build Stage
```groovy
stage('maven build') {
    steps {
        sh 'mvn package'
    }
}
```

**Purpose**: Build and package application
**Operations**:
- Compile Java source code
- Run unit tests
- Execute integration tests
- Create WAR/JAR artifact
**Output**: `target/addressbook-2.0.war`

#### 4. Nexus Artifact Upload Stage
```groovy
stage('nexus test') {
    steps {
        nexusArtifactUploader(
            nexusVersion: 'nexus3',
            protocol: 'http',
            nexusUrl: '3.145.207.162:8081',
            groupId: 'addressbook',
            version: '2.0-SNAPSHOT',
            repository: 'maven-snapshots',
            credentialsId: 'nexus',
            artifacts: [
                [artifactId: 'SuperProject',
                classifier: '',
                file: 'target/addressbook-2.0.war',
                type: 'war']
            ]
        )
    }
}
```

**Purpose**: Upload artifact to Nexus repository
**Benefits**:
- Centralized artifact storage
- Version management
- Artifact traceability
- Binary repository management
- Dependency management
- Build reproducibility

#### 5. Docker Build Stage
```groovy
stage('Docker build') {
    steps {
        sh 'docker build -t super-project .'
    }
}
```

**Purpose**: Create Docker container image
**Tag**: super-project:latest
**Base**: Defined in Dockerfile (typically Tomcat or similar)

#### 6. AWS ECR Push Stage
```groovy
stage('DockerHub push') {
    steps {
        sh 'aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 381492204839.dkr.ecr.us-east-1.amazonaws.com'
        sh "docker tag super-project:latest 381492204839.dkr.ecr.us-east-1.amazonaws.com/super-project:latest"
        sh "docker push 381492204839.dkr.ecr.us-east-1.amazonaws.com/super-project:latest"
        sh "docker tag super-project:latest 381492204839.dkr.ecr.us-east-1.amazonaws.com/super-project:${BUILD_NUMBER}"
        sh "docker push 381492204839.dkr.ecr.us-east-1.amazonaws.com/super-project:${BUILD_NUMBER}"
    }
}
```

**Purpose**: Push images to AWS ECR
**Tags Created**:
- `latest`: Always points to most recent build
- `BUILD_NUMBER`: Build-specific version for traceability
**Security**: Uses AWS ECR for private registry

#### 7. Kubernetes Deployment Stage
```groovy
stage('Kubernetes deploy') {
    steps {
        sh 'aws eks update-kubeconfig --region us-east-1 --name super-project'
        sh 'kubectl apply -f Application.yaml'
    }
}
```

**Purpose**: Deploy to AWS EKS cluster
**Process**:
1. Configure kubectl with EKS credentials
2. Apply Kubernetes manifests
3. Create/update deployments and services

### Post-Build Actions

```groovy
post {
    always {
        echo "Job is completed"
    }
    success {
        echo "success"
    }
    failure {
        echo "failed"
    }
}
```

## Usage

### Complete Setup Guide

#### 1. Install and Configure SonarQube

```bash
# Using Docker
docker run -d --name sonarqube \
  -p 9000:9000 \
  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
  sonarqube:latest

# Access SonarQube
# http://localhost:9000 (admin/admin)

# Create project and generate token
# Project Key: superproject
# Project Name: superproject
```

Configure SonarQube in Jenkins:
```
Manage Jenkins > Configure System > SonarQube servers
- Name: sonarqube-server
- Server URL: http://your-sonarqube-server:9000
- Server authentication token: <generated-token>
```

#### 2. Install and Configure Nexus

```bash
# Using Docker
docker run -d --name nexus \
  -p 8081:8081 \
  -v nexus-data:/nexus-data \
  sonatype/nexus3

# Get initial password
docker exec -it nexus cat /nexus-data/admin.password

# Access Nexus
# http://localhost:8081
# Complete setup wizard
```

Create Maven Snapshot Repository:
```
- Login to Nexus
- Settings > Repositories > Create repository
- Recipe: maven2 (hosted)
- Name: maven-snapshots
- Version policy: Snapshot
- Save
```

#### 3. Configure AWS ECR

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name super-project \
  --region us-east-1

# Get repository URI
aws ecr describe-repositories \
  --repository-name super-project \
  --region us-east-1
```

#### 4. Create AWS EKS Cluster

```bash
# Using eksctl
eksctl create cluster \
  --name super-project \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 4 \
  --managed

# Verify cluster
aws eks list-clusters --region us-east-1
kubectl get nodes
```

#### 5. Configure Jenkins Credentials

Add AWS credentials:
```
Manage Jenkins > Credentials > System > Global credentials
- Kind: AWS Credentials
- ID: aws-key
- Access Key ID: <your-access-key>
- Secret Access Key: <your-secret-key>
```

Add Nexus credentials:
```
- Kind: Username with password
- ID: nexus
- Username: <nexus-username>
- Password: <nexus-password>
```

#### 6. Create Jenkins Pipeline

```
New Item > Pipeline
Name: java-complete-pipeline
Pipeline:
  - Definition: Pipeline script from SCM
  - SCM: Git
  - Repository URL: <your-repository>
  - Script Path: Jenkins/java-3/Project-java-3
```

#### 7. Update Pipeline Configuration

Edit `Project-java-3` to customize:

```groovy
// Line 15: Update repository URL
userRemoteConfigs: [[url: 'https://github.com/YOUR-USERNAME/YOUR-REPO']]

// Line 23: Update SonarQube project key
-Dsonar.projectKey=YOUR-PROJECT-KEY -Dsonar.projectName='YOUR-PROJECT-NAME'

// Line 38: Update Nexus URL
nexusUrl: 'YOUR-NEXUS-URL:8081',

// Line 59-63: Update ECR URLs
381492204839.dkr.ecr.us-east-1.amazonaws.com -> YOUR-ECR-URL

// Line 68: Update EKS cluster name
--name YOUR-CLUSTER-NAME
```

### Required Project Files

#### pom.xml Configuration
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>

    <groupId>addressbook</groupId>
    <artifactId>SuperProject</artifactId>
    <version>2.0-SNAPSHOT</version>
    <packaging>war</packaging>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <sonar.java.coveragePlugin>jacoco</sonar.java.coveragePlugin>
        <sonar.coverage.jacoco.xmlReportPaths>
            target/site/jacoco/jacoco.xml
        </sonar.coverage.jacoco.xmlReportPaths>
    </properties>

    <dependencies>
        <!-- Your dependencies -->
    </dependencies>

    <build>
        <finalName>addressbook-2.0</finalName>
        <plugins>
            <plugin>
                <groupId>org.jacoco</groupId>
                <artifactId>jacoco-maven-plugin</artifactId>
                <version>0.8.8</version>
                <executions>
                    <execution>
                        <goals>
                            <goal>prepare-agent</goal>
                        </goals>
                    </execution>
                    <execution>
                        <id>report</id>
                        <phase>verify</phase>
                        <goals>
                            <goal>report</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

#### Dockerfile Example
```dockerfile
FROM tomcat:9-jdk11-openjdk

# Remove default webapps
RUN rm -rf /usr/local/tomcat/webapps/*

# Copy WAR file
COPY target/addressbook-2.0.war /usr/local/tomcat/webapps/ROOT.war

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start Tomcat
CMD ["catalina.sh", "run"]
```

#### Application.yaml Example
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: super-project
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: super-project
  template:
    metadata:
      labels:
        app: super-project
    spec:
      containers:
      - name: super-project
        image: 381492204839.dkr.ecr.us-east-1.amazonaws.com/super-project:latest
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: super-project-service
  namespace: default
spec:
  type: LoadBalancer
  selector:
    app: super-project
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
```

### Running the Pipeline

1. **Trigger Build**:
   - Navigate to pipeline job
   - Click "Build Now"

2. **Monitor Progress**:
   - View Stage View for visual progress
   - Check Console Output for detailed logs
   - Monitor SonarQube dashboard for quality metrics

3. **Verify SonarQube Analysis**:
   - Visit SonarQube server
   - Navigate to your project
   - Review quality gate status

4. **Verify Nexus Upload**:
   - Login to Nexus
   - Browse > maven-snapshots
   - Verify artifact uploaded

5. **Verify ECR Push**:
   ```bash
   aws ecr describe-images \
     --repository-name super-project \
     --region us-east-1
   ```

6. **Verify Kubernetes Deployment**:
   ```bash
   # Configure kubectl
   aws eks update-kubeconfig --region us-east-1 --name super-project

   # Check deployment
   kubectl get deployments
   kubectl get pods
   kubectl get services

   # Get LoadBalancer URL
   kubectl get svc super-project-service
   ```

## Key Features

### 1. Comprehensive Quality Gates
- **SonarQube Integration**: Complete code quality analysis
- **Security Scanning**: Vulnerability detection
- **Code Coverage**: Test coverage tracking
- **Quality Metrics**: Bugs, code smells, duplications
- **Technical Debt**: Maintainability assessment

### 2. Artifact Management
- **Nexus Repository**: Centralized artifact storage
- **Version Control**: Snapshot versioning
- **Artifact Metadata**: Full traceability
- **Dependency Management**: Proxy and cache dependencies
- **Binary Repository**: Store build outputs

### 3. Container Registry
- **AWS ECR**: Private, secure container registry
- **Multi-Tag Strategy**: Latest and versioned tags
- **Image Scanning**: Vulnerability scanning available
- **IAM Integration**: AWS security model
- **High Availability**: AWS managed service

### 4. Kubernetes Orchestration
- **AWS EKS**: Managed Kubernetes service
- **Declarative Deployment**: YAML-based configuration
- **Service Abstraction**: Load balancing and discovery
- **Auto-Scaling**: HPA and cluster autoscaler
- **Rolling Updates**: Zero-downtime deployments

### 5. Complete CI/CD Pipeline
- **Source to Production**: End-to-end automation
- **Quality Gates**: Automated quality checks
- **Artifact Tracking**: Full traceability
- **Deployment Automation**: No manual intervention
- **Rollback Capability**: Version-based rollback

## Troubleshooting

### SonarQube Issues

#### Connection Failed
```
Error: Failed to connect to SonarQube server
```

**Solutions**:
```bash
# Verify SonarQube is running
curl http://your-sonarqube-server:9000/api/system/status

# Check Jenkins SonarQube configuration
# Manage Jenkins > Configure System > SonarQube servers

# Verify token is valid
# SonarQube > My Account > Security > Generate Token
```

#### Quality Gate Failed
```
Error: Quality gate status: FAILED
```

**Solutions**:
- Review SonarQube dashboard for specific issues
- Fix code quality issues (bugs, vulnerabilities, code smells)
- Adjust quality gate thresholds if appropriate
- Review coverage reports

### Nexus Issues

#### Upload Failed
```
Error: Return code is 400, ReasonPhrase: Bad Request
```

**Solutions**:
```bash
# Verify repository exists
curl http://nexus-url:8081/service/rest/v1/repositories

# Check credentials
# Test manually
mvn deploy:deploy-file \
  -DrepositoryId=maven-snapshots \
  -Durl=http://nexus-url:8081/repository/maven-snapshots/ \
  -Dfile=target/addressbook-2.0.war

# Verify artifact coordinates match pom.xml
```

#### Authentication Failed
```
Error: 401 Unauthorized
```

**Solutions**:
- Verify Nexus credentials in Jenkins
- Check user has deployment permissions
- Reset Nexus password if needed

### AWS ECR Issues

#### Login Failed
```
Error: Error saving credentials
```

**Solutions**:
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check IAM permissions
# Required: ecr:GetAuthorizationToken, ecr:BatchCheckLayerAvailability,
#           ecr:GetDownloadUrlForLayer, ecr:PutImage

# Manual ECR login test
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin YOUR-ECR-URL
```

#### Push Failed
```
Error: denied: Your authorization token has expired
```

**Solutions**:
- Re-authenticate to ECR
- Check token expiration (valid for 12 hours)
- Ensure AWS CLI is up to date

### EKS Deployment Issues

#### kubectl Config Failed
```
Error: error: You must be logged in to the server (Unauthorized)
```

**Solutions**:
```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name super-project

# Verify cluster access
kubectl cluster-info

# Check IAM permissions
# Required: eks:DescribeCluster, eks:ListClusters

# Verify aws-auth ConfigMap
kubectl get configmap aws-auth -n kube-system -o yaml
```

#### Deployment Failed
```
Error: error: unable to recognize "Application.yaml"
```

**Solutions**:
```bash
# Validate YAML
kubectl apply --dry-run=client -f Application.yaml

# Check syntax
yamllint Application.yaml

# Verify API versions
kubectl api-resources
```

### General Pipeline Issues

#### Maven Build Failure
```
Error: [ERROR] Failed to execute goal
```

**Solutions**:
```bash
# Clean build
mvn clean install

# Update dependencies
mvn clean install -U

# Skip tests temporarily to isolate issue
mvn clean install -DskipTests

# Check Java version
java -version
mvn -version
```

## Best Practices

### 1. Code Quality
- **Quality Gates**: Enforce minimum quality thresholds
- **Code Coverage**: Aim for >80% coverage
- **Security**: Fix critical vulnerabilities immediately
- **Code Reviews**: Require peer reviews
- **Static Analysis**: Run on every commit

### 2. Artifact Management
- **Versioning**: Use semantic versioning
- **Retention Policies**: Clean old artifacts
- **Metadata**: Tag artifacts with build info
- **Checksums**: Verify artifact integrity
- **Documentation**: Document artifact purpose

### 3. Container Best Practices
- **Image Scanning**: Scan for vulnerabilities
- **Minimal Images**: Use small base images
- **Layer Optimization**: Optimize Dockerfile
- **Non-Root User**: Run as non-root
- **Security Updates**: Regular base image updates

### 4. Kubernetes Deployment
- **Resource Limits**: Always set limits
- **Health Checks**: Implement probes
- **Multiple Replicas**: For high availability
- **ConfigMaps/Secrets**: Externalize configuration
- **Namespace Isolation**: Use separate namespaces
- **Network Policies**: Restrict pod communication

### 5. Security
- **Secrets Management**: Use AWS Secrets Manager or Kubernetes secrets
- **IAM Roles**: Use IAM roles for service accounts
- **RBAC**: Implement proper access controls
- **Network Security**: Use security groups
- **Encryption**: Enable encryption at rest and in transit
- **Audit Logging**: Enable comprehensive logging

### 6. Monitoring & Observability
- **Application Metrics**: Export Prometheus metrics
- **Logging**: Centralized logging (CloudWatch Logs)
- **Tracing**: Distributed tracing (X-Ray)
- **Alerts**: Set up meaningful alerts
- **Dashboards**: Create operational dashboards
- **SLIs/SLOs**: Define and monitor service levels

### 7. Pipeline Optimization
- **Parallel Stages**: Run independent stages in parallel
- **Caching**: Use Maven and Docker caching
- **Conditional Execution**: Skip unnecessary stages
- **Build Agents**: Use appropriate agent labels
- **Timeout Configuration**: Set reasonable timeouts
- **Cleanup**: Clean workspace after builds
