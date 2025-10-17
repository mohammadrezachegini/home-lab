# Jenkins Practice Repository

This repository contains Jenkins pipeline examples and practice projects for learning DevOps automation. The examples cover basic Jenkins concepts to advanced CI/CD workflows.

## Repository Structure

### Basic Jenkins Concepts
- **1-basic** - Simple three-stage pipeline (Build, Test, Deploy)
- **2-options** - Using build options and log rotation
- **3-checkout** - Git repository checkout in pipelines
- **4-tools** - Maven tool configuration and usage
- **5-environments** - Environment variables in pipelines
- **6-parameterised** - Parameterized builds with user input
- **9-Built+in+variable** - Jenkins built-in variables usage

### Advanced Pipeline Features
- **10-script** - Script blocks in declarative pipelines
- **11-file+script** - Combining file checkout with script execution
- **12-loops** - For loops in Jenkins pipelines
- **13-loops+n+scripts** - Loops with scripts and arrays
- **14-conditions** - Conditional logic in pipelines
- **15-functions** - Custom functions in Jenkins

### DevOps Tool Integration
- **16-docker** - Docker build and push workflows
- **17-docker+n+dockerhub** - Complete Docker workflow with Docker Hub
- **21-aws** - AWS CLI integration
- **21-aws-snapshot** - AWS EC2 snapshot automation
- **22-k8s** - Kubernetes deployment pipelines
- **24-sonarqube** - Code quality analysis with SonarQube
- **25-nexus** - Artifact management with Nexus
- **26-terraform** - Infrastructure as Code with Terraform
- **27-ansible** - Configuration management with Ansible

### Pipeline Management
- **7-upstream** - Upstream job triggering
- **8-downstream** - Downstream job execution
- **8-post+actions** - Post-build actions and notifications
- **18-agents** - Jenkins agent configuration
- **19-email** - Email notifications setup
- **23-shared+library** - Shared libraries for code reuse
- **input** - Manual approval steps
- **timeout** - Pipeline timeout configuration

### Complete Project Examples

#### Java Projects
- **java-1/Project-java-1** - Java application with Docker
- **java-2/Project-java-2** - Java with Kubernetes deployment
- **java-3/Project-java-3** - Complete pipeline with SonarQube, Nexus, and AWS ECR
- **java/java-project** - Full DevOps pipeline with quality gates

#### Other Languages
- **nodejs/nodejs-project** - Node.js application pipeline
- **php/php-project** - PHP application with multi-environment deployment
- **python/python-project** - Python application pipeline

## Prerequisites

Before using these pipelines, make sure you have:

### Jenkins Setup
- Jenkins server installed and running
- Required plugins installed:
  - Git plugin
  - Pipeline plugin
  - Docker plugin
  - Kubernetes plugin
  - SonarQube Scanner plugin
  - Nexus Artifact Uploader plugin

### Tools Configuration
- Maven configured in Jenkins Global Tools
- Node.js configured for Node.js projects
- Docker installed on Jenkins agents
- kubectl configured for Kubernetes deployments

### Credentials Setup
In Jenkins credentials store, configure:
- `docker-cred` - Docker Hub credentials
- `aws-key` - AWS access credentials
- `nexus` - Nexus repository credentials
- `ansiblekey` - SSH private key for Ansible
- `sonarqube-server` - SonarQube server configuration

## Getting Started

1. **Clone this repository** to your local machine
2. **Import pipelines** into your Jenkins instance
3. **Configure credentials** as listed above
4. **Update repository URLs** in pipeline files to match your repositories
5. **Run basic examples** first to understand Jenkins pipeline syntax
6. **Progress to advanced examples** with tool integrations

## Pipeline Examples Usage

### Basic Pipeline
```groovy
pipeline{
    agent any
    stages{
        stage('Build'){
            steps{
                echo "Building application"
            }
        }
    }
}
```

### Docker Pipeline
```groovy
pipeline{
    agent any
    environment {
        dockerhub_cred = credentials('docker-cred')
    }
    stages{
        stage('Docker Build'){
            steps{
                sh 'docker build -t myapp:latest .'
            }
        }
    }
}
```

## Common Issues and Solutions

### Docker Permission Issues
- Add Jenkins user to docker group
- Restart Jenkins service after group changes

### Kubernetes Connection Issues
- Verify kubectl configuration
- Check AWS EKS cluster access permissions
- Ensure correct cluster name in pipeline

### Maven Build Failures
- Check Maven tool configuration in Jenkins
- Verify Java version compatibility
- Review pom.xml dependencies

## Best Practices

1. **Use environment variables** for sensitive data
2. **Implement proper error handling** with try-catch blocks
3. **Add post-build actions** for cleanup and notifications
4. **Use shared libraries** for common functions
5. **Implement approval gates** for production deployments
6. **Configure build retention** to manage disk space
7. **Use parallel stages** when possible for faster builds


## Security Notes

- Never commit sensitive credentials to version control
- Use Jenkins credential store for all secrets
- Regularly update plugins and Jenkins version
- Implement proper access controls for pipelines
- Review and audit pipeline permissions regularly
