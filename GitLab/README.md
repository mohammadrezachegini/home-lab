# GitLab CI/CD Pipeline Templates

This repository contains CI/CD pipeline templates for different programming languages and frameworks.

## What is included

- **Java Project Pipeline** - For Maven-based Java applications
- **Node.js Pipeline** - For JavaScript/Node.js applications  
- **PHP Pipeline** - For PHP web applications
- **Python Pipeline** - For Python applications

## Features

Each pipeline includes these steps:

- **Build** - Compile and prepare your code
- **Test** - Run automated tests
- **Security Scan** - Check for security issues
- **Package** - Create Docker images
- **Deploy** - Deploy to AWS Kubernetes (EKS)

## Requirements

Before using these pipelines, you need:

### GitLab Setup
- GitLab account with CI/CD enabled
- GitLab Runner configured
- Project variables set up

### AWS Setup
- AWS account
- EKS cluster running
- IAM user with proper permissions

### Docker Setup
- Docker Hub account (or GitLab Container Registry)
- Docker login credentials

## Pipeline Variables

Add these variables in your GitLab project settings:

```
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_DEFAULT_REGION=us-east-1
DOCKER_USERNAME=your_docker_username
DOCKER_PASSWORD=your_docker_password
KUBE_CONTEXT=your_cluster_context
```

## How to use

1. **Choose your language** - Pick the right pipeline file for your project
2. **Copy the file** - Rename it to `.gitlab-ci.yml` in your project root
3. **Update settings** - Change project names and registry URLs
4. **Add variables** - Set up the required environment variables
5. **Push code** - Commit your changes to start the pipeline

## Pipeline Stages Explained

### Build Stage
- Downloads dependencies
- Compiles source code
- Prepares application for testing

### Test Stage  
- Runs unit tests
- Generates test reports
- Performs security scanning

### Package Stage
- Builds Docker container
- Pushes image to registry
- Tags with pipeline ID

### Deploy Stage
- Connects to AWS EKS
- Applies Kubernetes manifests
- Starts application pods

## File Structure

```
your-project/
├── .gitlab-ci.yml          # Your chosen pipeline
├── Application.yaml        # Kubernetes deployment file
├── Dockerfile             # Docker build instructions
├── src/                   # Your source code
└── README.md             # This file
```

## Common Issues and Solutions

### Pipeline Fails at Build
- Check if dependencies are correct
- Verify build commands work locally
- Review error messages in job logs

### Docker Push Fails
- Confirm Docker credentials are set
- Check registry URL is correct
- Verify network connectivity

### Deployment Fails
- Check AWS credentials and permissions
- Verify EKS cluster is running
- Confirm kubectl configuration

