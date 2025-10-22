# GitHub Actions Repository

A complete collection of GitHub Actions workflows and custom actions for automated CI/CD pipelines. This repository shows different deployment strategies, security practices, and workflow patterns.

## Table of Contents

- [Overview](#overview)
- [Workflows](#workflows)
- [Custom Actions](#custom-actions)
- [Setup Instructions](#setup-instructions)
- [Security Features](#security-features)
- [Examples](#examples)
- [Contributing](#contributing)

## Overview

This repository contains ready-to-use GitHub Actions workflows that cover:

- **Basic CI/CD**: Testing, building, and deploying applications
- **Security**: Using OpenID Connect and proper permission management
- **Custom Actions**: Reusable actions for common tasks
- **Advanced Features**: Matrix builds, containers, and reusable workflows

## Workflows

### Basic Deployment
- `deployment-basic.yml` - Simple test and deploy workflow
- `demo-event.yml` - Event-triggered deployment with branch filters

### Advanced Deployment
- `deploy-container.yml` - Deployment using containers and services
- `deploy-docker-k8s.yml` - Docker build and Kubernetes deployment
- `deploy-env-var-secrets.yml` - Environment variables and secrets management

### Security & Permissions
- `deploy-AWS-Permission-OpenID.yml` - AWS deployment with OpenID Connect
- `label-issues-real.yml` - Proper permission handling for issue labeling
- `script-injection.yml` - Safe script execution example

### Workflow Features
- `matrix.yml` - Matrix strategy for multiple environments
- `execution-flow.yml` - Job dependencies and execution flow
- `demo-Artifacts-Outputs.yml` - Artifacts and outputs handling
- `use-reuse.yml` - Using reusable workflows

### Utilities
- `output-basic.yml` - GitHub context information output
- `continue.yml` - Website deployment with caching

## Custom Actions

### Cached Dependencies (`actions/cached-deps/`)
Reusable action for caching and installing dependencies with configurable caching options.

**Usage:**
```yaml
- name: Load & cache dependencies
  uses: ./.github/actions/cached-deps
  with:
    caching: 'true'
```

### S3 Deployment - Docker (`actions/deploy-s3-docker/`)
Deploy static websites to AWS S3 using Docker container.

**Features:**
- Python-based deployment script
- Automatic MIME type detection
- Configurable bucket region

**Usage:**
```yaml
- name: Deploy to S3
  uses: ./.github/actions/deploy-s3-docker
  with:
    bucket: your-bucket-name
    dist-folder: ./dist
    bucket-region: us-east-1
```

### S3 Deployment - JavaScript (`actions/deploy-s3-javascript/`)
Deploy static websites to AWS S3 using Node.js.

**Features:**
- AWS CLI integration
- Faster execution than Docker version
- Built-in sync functionality

**Usage:**
```yaml
- name: Deploy to S3
  uses: ./.github/actions/deploy-s3-javascript
  with:
    bucket: your-bucket-name
    dist-folder: ./dist
    bucket-region: us-east-1
```

## Setup Instructions

### 1. Clone Repository
```bash
git clone <repository-url>
cd <repository-name>
```

### 2. Configure Secrets
Add these secrets to your GitHub repository:

**For AWS Deployment:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

**For Docker Deployment:**
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`

**For Database Testing:**
- `MONGODB_USERNAME`
- `MONGODB_PASSWORD`

### 3. Customize Workflows
1. Copy the workflow you need to `.github/workflows/`
2. Update branch names, paths, and environment variables
3. Modify job steps based on your project needs

### 4. Set Up Custom Actions
1. Copy custom actions to `.github/actions/`
2. Update action references in your workflows
3. Configure inputs and outputs as needed

## Security Features

### OpenID Connect (OIDC)
The repository includes examples of secure AWS authentication using OIDC instead of long-lived access keys:

```yaml
permissions:
  id-token: write
  contents: read

steps:
  - name: Get AWS permissions
    uses: aws-actions/configure-aws-credentials@v1
    with:
      role-to-assume: arn:aws:iam::ACCOUNT:role/ROLE-NAME
      aws-region: us-east-1
```

### Script Injection Prevention
Safe handling of user input in workflows:

```yaml
steps:
  - name: Safe script execution
    env:
      TITLE: ${{ github.event.issue.title }}
    run: |
      echo "Processing: $TITLE"
```

### Proper Permissions
Minimal permission sets for each job:

```yaml
jobs:
  assign-label:
    permissions:
      issues: write
    runs-on: ubuntu-latest
```

## Examples

### Basic Web Application Deployment
1. **Test**: Run unit tests and linting
2. **Build**: Create production build
3. **Deploy**: Upload to hosting service

### Multi-Environment Matrix
Test across multiple Node.js versions and operating systems:

```yaml
strategy:
  matrix:
    node-version: [16, 18, 20]
    operating-system: [ubuntu-latest, windows-latest]
```

### Container-Based Testing
Use services for integration testing:

```yaml
services:
  mongodb:
    image: mongo
    ports:
      - 27017:27017
```

### Reusable Workflows
Create shared deployment logic:

```yaml
jobs:
  deploy:
    uses: ./.github/workflows/reusable.yml
    with:
      artifact-name: dist-files
```

## File Structure

```
.github/
├── workflows/
│   ├── deployment-basic.yml
│   ├── deploy-container.yml
│   ├── matrix.yml
│   └── ...
└── actions/
    ├── cached-deps/
    │   └── action.yml
    ├── deploy-s3-docker/
    │   ├── action.yml
    │   ├── Dockerfile
    │   └── deployment.py
    └── deploy-s3-javascript/
        ├── action.yml
        ├── main.js
        └── package.json
```

## Best Practices

1. **Use Specific Versions**: Pin action versions (e.g., `@v4`)
2. **Cache Dependencies**: Use caching for faster builds
3. **Secure Secrets**: Use repository secrets, never hardcode
4. **Minimal Permissions**: Grant only required permissions
5. **Environment Separation**: Use different environments for testing/production
6. **Error Handling**: Include proper error handling and notifications

