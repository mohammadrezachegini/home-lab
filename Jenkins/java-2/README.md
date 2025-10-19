# Jenkins Pipeline for Java Applications - Example 2

## Overview

This project demonstrates a cloud-native Jenkins CI/CD pipeline for Java applications with Kubernetes deployment on AWS EKS. The pipeline showcases modern DevOps practices by integrating Maven builds, Docker containerization, DockerHub registry, and Kubernetes orchestration on Amazon's managed Kubernetes service. This represents a production-grade, scalable deployment strategy suitable for enterprise applications running on AWS infrastructure.

## Jenkins Concepts

This pipeline demonstrates the following Jenkins concepts:

- **Declarative Pipeline Syntax**: Modern, maintainable pipeline structure
- **Agent Configuration**: Flexible agent selection with 'any' agent type
- **Build Options**: Advanced build retention with log rotation policies
- **Tools Integration**: Maven build tool configuration
- **Environment Variables**: Multiple credential types (AWS and DockerHub)
- **Variable Substitution**: Dynamic Docker image tagging with environment variables
- **Credentials Binding**: Secure handling of multiple credential sets
- **Post-Build Actions**: Comprehensive status reporting (always, success, failure)
- **Cloud Integration**: AWS EKS integration for Kubernetes deployment

## Prerequisites

### Jenkins Configuration

- Jenkins server (version 2.300+)
- Required Jenkins plugins:
  - Pipeline plugin
  - Git plugin
  - Maven Integration plugin
  - Docker Pipeline plugin
  - Credentials Binding plugin
  - Kubernetes CLI plugin
  - AWS Steps plugin

### Tool Requirements

- **Maven**: Configured in Jenkins Global Tool Configuration with name 'Maven'
- **Java JDK**: Version 8 or higher
- **Docker**: Installed on Jenkins agent with proper permissions
- **kubectl**: Kubernetes CLI tool configured on Jenkins agent
- **AWS CLI**: Version 2.x installed and configured
  - Must have access to AWS EKS service
  - Proper IAM permissions for EKS operations

### AWS Requirements

- **AWS Account**: With EKS cluster configured
- **EKS Cluster**: Named 'devops-working' in us-east-1 region
- **IAM Permissions**: Jenkins needs permissions for:
  - eks:DescribeCluster
  - eks:ListClusters
  - eks:UpdateClusterConfig
  - Access to Kubernetes RBAC

### External Services

- **DockerHub Account**: For container image storage
- **GitHub Repository**: Source code repository
- **AWS EKS Cluster**: Running Kubernetes cluster

### Credentials Setup

Configure the following credentials in Jenkins:

1. **aws-key**: AWS credentials (AWS Credentials type)
   - Access Key ID: Your AWS access key
   - Secret Access Key: Your AWS secret key
   - ID: `aws-key`

2. **docker-cred**: DockerHub credentials (Username with password)
   - Username: Your DockerHub username
   - Password: Your DockerHub password or access token
   - ID: `docker-cred`

## Project Structure

```
java-2/
├── Project-java-2      # Jenkins pipeline definition (Jenkinsfile)
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

**Retention Policy**:
- Keep builds for 30 days maximum
- Keep last 2 builds
- No separate artifact retention
- Helps manage disk space efficiently

### Environment Variables

```groovy
environment {
    cred = credentials('aws-key')
    dockerhub_cred = credentials('docker-cred')
    DOCKER_IMAGE = "lowyiiii/project-k8s"
    DOCKER_TAG = "$BUILD_NUMBER"
}
```

**Available Variables**:
- `cred`: AWS credentials (auto-expanded to AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY)
- `dockerhub_cred_USR`: DockerHub username
- `dockerhub_cred_PSW`: DockerHub password
- `DOCKER_IMAGE`: Docker repository name
- `DOCKER_TAG`: Build-specific tag (Jenkins build number)

### Pipeline Stages

The pipeline consists of 5 well-defined stages:

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
**Note**: Update URL to point to your Java application repository

#### 2. Maven Build Stage
```groovy
stage('Maven Build') {
    steps {
        sh 'mvn package'
    }
}
```

**Purpose**: Build Java application
**Operations**:
- Compile source code
- Run unit tests
- Package as WAR/JAR file
- Output: artifact in `target/` directory

#### 3. Docker Build Stage
```groovy
stage('Docker build') {
    steps {
        sh 'docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} .'
    }
}
```

**Purpose**: Create container image
**Tag Format**: `lowyiiii/project-k8s:BUILD_NUMBER`
**Result**: Docker image ready for deployment

#### 4. DockerHub Push Stage
```groovy
stage('DockerHub push') {
    steps {
        sh "echo $dockerhub_cred_PSW | docker login -u $dockerhub_cred_USR --password-stdin"
        sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
        sh "docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest"
        sh "docker push ${DOCKER_IMAGE}:latest"
    }
}
```

**Purpose**: Push image to DockerHub
**Security**: Uses password-stdin for secure authentication
**Tags Created**:
- Build-specific: `lowyiiii/project-k8s:BUILD_NUMBER`
- Latest: `lowyiiii/project-k8s:latest`

#### 5. Kubernetes Deploy Stage
```groovy
stage('Kubernetes deploy') {
    steps {
        sh 'aws eks update-kubeconfig --region us-east-1 --name devops-working'
        sh 'kubectl apply -f Application.yaml'
    }
}
```

**Purpose**: Deploy to AWS EKS cluster
**Process**:
1. Update kubectl config with EKS cluster credentials
2. Apply Kubernetes manifests
**Result**: Application running on Kubernetes

### Post-Build Actions

```groovy
post {
    always {
        echo "Job is completed"
    }
    success {
        echo "It is a success"
    }
    failure {
        echo "Job is failed"
    }
}
```

## Usage

### Initial Setup

1. **Create AWS EKS Cluster** (if not exists):
   ```bash
   # Using eksctl (recommended)
   eksctl create cluster \
     --name devops-working \
     --region us-east-1 \
     --nodegroup-name standard-workers \
     --node-type t3.medium \
     --nodes 2 \
     --nodes-min 1 \
     --nodes-max 3 \
     --managed
   ```

2. **Configure AWS Credentials in Jenkins**:
   ```
   Manage Jenkins > Credentials > System > Global credentials
   - Click "Add Credentials"
   - Kind: AWS Credentials
   - ID: aws-key
   - Access Key ID: <your-aws-access-key>
   - Secret Access Key: <your-aws-secret-key>
   - Description: AWS EKS Access
   ```

3. **Configure DockerHub Credentials**:
   ```
   - Click "Add Credentials"
   - Kind: Username with password
   - Username: <dockerhub-username>
   - Password: <dockerhub-password>
   - ID: docker-cred
   - Description: DockerHub Credentials
   ```

4. **Create Jenkins Pipeline Job**:
   ```
   - New Item > Pipeline
   - Name: java-k8s-pipeline
   - Definition: Pipeline script from SCM
   - SCM: Git
   - Repository URL: <your-repo>
   - Script Path: Jenkins/java-2/Project-java-2
   ```

5. **Update Pipeline Variables**:

   Edit `Project-java-2` file:
   ```groovy
   // Line 12: Update DockerHub repository
   DOCKER_IMAGE = "YOUR-DOCKERHUB-USERNAME/YOUR-IMAGE-NAME"

   // Line 18: Update GitHub repository
   userRemoteConfigs: [[url: 'https://github.com/YOUR-USERNAME/YOUR-REPO']]

   // Line 41: Update EKS cluster and region
   sh 'aws eks update-kubeconfig --region YOUR-REGION --name YOUR-CLUSTER-NAME'
   ```

### Required Kubernetes Manifests

#### Application.yaml Example
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: java-app
  labels:
    app: java-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: java-app
  template:
    metadata:
      labels:
        app: java-app
    spec:
      containers:
      - name: java-app
        image: lowyiiii/project-k8s:latest
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
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 15
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: java-app-service
spec:
  type: LoadBalancer
  selector:
    app: java-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
```

### Running the Pipeline

1. **Verify AWS Access**:
   ```bash
   aws eks list-clusters --region us-east-1
   aws eks describe-cluster --name devops-working --region us-east-1
   ```

2. **Execute Pipeline**:
   - Navigate to pipeline job
   - Click "Build Now"
   - Monitor Stage View

3. **Verify Deployment**:
   ```bash
   # Get kubectl config
   aws eks update-kubeconfig --region us-east-1 --name devops-working

   # Check deployments
   kubectl get deployments

   # Check pods
   kubectl get pods

   # Check services
   kubectl get services

   # Get LoadBalancer URL
   kubectl get svc java-app-service
   ```

4. **Access Application**:
   ```bash
   # Get external IP
   kubectl get svc java-app-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

   # Access application
   curl http://<loadbalancer-url>
   ```

## Key Features

### 1. Cloud-Native Deployment
- **AWS EKS Integration**: Managed Kubernetes service
- **Scalable Architecture**: Kubernetes auto-scaling capabilities
- **High Availability**: Multi-node cluster support
- **Load Balancing**: AWS ELB integration

### 2. Container Orchestration
- **Kubernetes Deployment**: Declarative deployment configuration
- **Service Discovery**: Kubernetes service abstraction
- **Rolling Updates**: Zero-downtime deployments
- **Self-Healing**: Automatic pod restart on failure

### 3. Multi-Tag Strategy
- **Version Tracking**: Build-specific image tags
- **Latest Tag**: Always points to most recent build
- **Rollback Capability**: Previous versions available
- **Audit Trail**: Image history in DockerHub

### 4. Build Management
- **Smart Retention**: Keeps last 2 builds for 30 days
- **Disk Space Optimization**: Automatic cleanup
- **Build History**: Maintains recent build records

### 5. Secure Credential Management
- **Multiple Credential Types**: AWS and DockerHub
- **No Hardcoded Secrets**: All credentials in Jenkins store
- **Secure Injection**: Credentials exposed only during execution
- **Password Protection**: Stdin method prevents log exposure

## Troubleshooting

### Common Issues and Solutions

#### AWS EKS Connection Failed
```
Error: error: You must be logged in to the server (Unauthorized)
```

**Solutions**:
1. **Verify AWS Credentials**:
   ```bash
   aws sts get-caller-identity
   ```

2. **Check IAM Permissions**:
   ```bash
   # Required permissions
   aws iam get-user-policy --user-name jenkins-user --policy-name eks-access
   ```

3. **Update kubeconfig**:
   ```bash
   aws eks update-kubeconfig --region us-east-1 --name devops-working
   ```

4. **Verify Cluster Exists**:
   ```bash
   aws eks describe-cluster --name devops-working --region us-east-1
   ```

#### Kubernetes Apply Failed
```
Error: error: unable to recognize "Application.yaml": no matches for kind "Deployment"
```

**Solutions**:
1. **Check YAML Syntax**:
   ```bash
   kubectl apply --dry-run=client -f Application.yaml
   ```

2. **Verify kubectl Version**:
   ```bash
   kubectl version --client
   ```

3. **Check Cluster Connection**:
   ```bash
   kubectl cluster-info
   ```

4. **Validate Manifest**:
   ```bash
   kubectl apply --validate=true --dry-run=client -f Application.yaml
   ```

#### Docker Image Pull Failed
```
Error: Failed to pull image "lowyiiii/project-k8s:latest": rpc error: code = Unknown
```

**Solutions**:
1. **Verify Image Exists**:
   ```bash
   docker pull lowyiiii/project-k8s:latest
   ```

2. **Check Image Name in YAML**:
   - Ensure image name matches pushed image
   - Verify tag is correct

3. **DockerHub Rate Limits**:
   - Consider using image pull secrets
   - Use authenticated pulls

4. **Create Image Pull Secret** (for private repos):
   ```bash
   kubectl create secret docker-registry dockerhub-secret \
     --docker-server=https://index.docker.io/v1/ \
     --docker-username=<username> \
     --docker-password=<password> \
     --docker-email=<email>
   ```

#### Maven Build Failure
```
Error: [ERROR] Failed to execute goal org.apache.maven.plugins:maven-compiler-plugin
```

**Solutions**:
1. **Check Java Version**:
   ```bash
   java -version
   mvn -version
   ```

2. **Clean Build**:
   ```bash
   mvn clean install
   ```

3. **Update Dependencies**:
   ```bash
   mvn clean install -U
   ```

#### Pod Crashes or Not Running
```
Error: CrashLoopBackOff or ImagePullBackOff
```

**Solutions**:
1. **Check Pod Logs**:
   ```bash
   kubectl logs <pod-name>
   kubectl describe pod <pod-name>
   ```

2. **Verify Resource Limits**:
   ```bash
   kubectl describe nodes
   ```

3. **Check Application Configuration**:
   - Verify environment variables
   - Check port configurations
   - Validate health check endpoints

4. **Test Container Locally**:
   ```bash
   docker run -p 8080:8080 lowyiiii/project-k8s:latest
   ```

## Best Practices

### 1. AWS EKS Best Practices
- **Use IAM Roles**: Prefer IAM roles over access keys
- **Enable Logging**: Turn on EKS control plane logging
- **Use Managed Node Groups**: For easier maintenance
- **Implement Network Policies**: For pod-to-pod security
- **Use Private Endpoints**: When possible for security
- **Regular Updates**: Keep EKS cluster updated

### 2. Kubernetes Deployment
- **Resource Limits**: Always set CPU and memory limits
- **Health Checks**: Implement liveness and readiness probes
- **Multiple Replicas**: Use at least 2 replicas for HA
- **Rolling Updates**: Configure proper update strategy
- **Namespace Isolation**: Use namespaces for different environments
- **Pod Disruption Budgets**: Prevent too many pods down at once

### 3. Container Best Practices
- **Multi-Stage Builds**: Reduce final image size
- **Non-Root User**: Run containers as non-root
- **Image Scanning**: Scan images for vulnerabilities
- **Minimal Base Images**: Use alpine or distroless images
- **Layer Optimization**: Order Dockerfile commands efficiently

### 4. Pipeline Optimization
- **Parallel Stages**: Run independent stages in parallel
- **Conditional Deployment**: Deploy only on specific branches
- **Build Caching**: Cache Maven dependencies
- **Docker Layer Caching**: Optimize Docker builds
- **Workspace Cleanup**: Clean workspace after builds

### 5. Security
- **Secrets Management**: Use Kubernetes secrets or AWS Secrets Manager
- **RBAC**: Implement proper Kubernetes RBAC
- **Network Policies**: Restrict pod communication
- **Image Signing**: Sign and verify container images
- **Audit Logging**: Enable and monitor audit logs
- **Least Privilege**: Grant minimum required permissions

### 6. Monitoring and Observability
- **Application Metrics**: Export Prometheus metrics
- **Logging**: Use centralized logging (ELK, CloudWatch)
- **Tracing**: Implement distributed tracing
- **Alerts**: Set up meaningful alerts
- **Dashboards**: Create operational dashboards

### 7. Cost Optimization
- **Right-Size Nodes**: Use appropriate EC2 instance types
- **Auto-Scaling**: Implement cluster autoscaler
- **Spot Instances**: Use spot instances for non-critical workloads
- **Resource Quotas**: Prevent resource overconsumption
- **Cost Monitoring**: Track and optimize AWS costs
