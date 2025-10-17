# AWS EKS Master Class

A comprehensive guide to Amazon Elastic Kubernetes Service (EKS) covering deployment patterns, networking, storage, autoscaling, and microservices architecture.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Architecture](#architecture)
- [Components](#components)
- [Getting Started](#getting-started)
- [Features](#features)
- [Deployment Guides](#deployment-guides)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Overview

This repository contains practical examples and configurations for deploying production-ready applications on AWS EKS. It covers essential Kubernetes concepts integrated with AWS services including ECR, RDS, Application Load Balancer, Network Load Balancer, and more.

## Prerequisites

- AWS CLI configured with appropriate permissions
- kubectl installed and configured
- eksctl installed
- Docker installed
- Basic understanding of Kubernetes concepts
- AWS account with sufficient permissions

### Required AWS Services
- Amazon EKS
- Amazon ECR
- Amazon RDS
- AWS Application Load Balancer Controller
- AWS Certificate Manager
- Route 53
- AWS X-Ray (for distributed tracing)

## Architecture

The project demonstrates various deployment architectures:

- **EKS Cluster Management**: Node groups, Fargate profiles, and mixed deployments
- **Container Registry Integration**: ECR for container image management
- **Database Integration**: RDS MySQL with external name services
- **Load Balancing**: ALB and NLB configurations
- **Service Mesh**: Microservices communication patterns
- **Monitoring**: CloudWatch Container Insights and AWS X-Ray tracing

## Components

### Core Infrastructure
- **EKS Cluster**: Managed Kubernetes cluster with multiple node groups
- **ECR Integration**: Container registry for application images
- **VPC Networking**: Secure network configuration with public/private subnets

### Application Components
- **User Management Microservice**: RESTful API for user operations
- **Notification Service**: Email notification microservice
- **MySQL Database**: RDS-hosted database with persistent storage

### Networking & Load Balancing
- **Application Load Balancer**: Layer 7 load balancing with SSL termination
- **Network Load Balancer**: Layer 4 load balancing for high performance
- **Ingress Controllers**: AWS Load Balancer Controller integration

### Storage Solutions
- **EBS CSI Driver**: Persistent volume management
- **Storage Classes**: Dynamic provisioning configurations
- **Persistent Volume Claims**: Application storage requirements

## Getting Started

### 1. Cluster Setup

```bash
# Create EKS cluster
eksctl create cluster --name=eksdemo1 \
                      --region=us-east-1 \
                      --zones=us-east-1a,us-east-1b \
                      --without-nodegroup

# Create node groups
eksctl create nodegroup --cluster=eksdemo1 \
                       --region=us-east-1 \
                       --name=eksdemo1-ng-private1 \
                       --node-type=m5.large \
                       --nodes-min=2 \
                       --nodes-max=4 \
                       --node-volume-size=20 \
                       --ssh-access \
                       --ssh-public-key=kube-demo \
                       --managed \
                       --asg-access \
                       --external-dns-access \
                       --full-ecr-access \
                       --appmesh-access \
                       --alb-ingress-access \
                       --node-private-networking
```

### 2. Install AWS Load Balancer Controller

```bash
# Create IAM service account
eksctl create iamserviceaccount \
  --cluster=eksdemo1 \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --attach-policy-arn=arn:aws:iam::ACCOUNT-ID:policy/AWSLoadBalancerControllerIAMPolicy \
  --override-existing-serviceaccounts \
  --approve

# Install the controller
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=eksdemo1 \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

### 3. Deploy Sample Application

```bash
# Apply storage class
kubectl apply -f kube-manifests/01-storage-class.yml

# Deploy MySQL database
kubectl apply -f kube-manifests/02-persistent-volume-claim.yml
kubectl apply -f kube-manifests/03-UserManagement-ConfigMap.yml
kubectl apply -f kube-manifests/04-mysql-deployment.yml
kubectl apply -f kube-manifests/05-mysql-clusterip-service.yml

# Deploy User Management Microservice
kubectl apply -f kube-manifests/06-UserManagementMicroservice-Deployment-Service.yml
kubectl apply -f kube-manifests/07-UserManagement-Service.yml
kubectl apply -f kube-manifests/08-Kubernetes-Secrets.yml
```

## Features

### Autoscaling Capabilities
- **Cluster Autoscaler**: Automatic node scaling based on demand
- **Horizontal Pod Autoscaler (HPA)**: Pod replica scaling based on CPU/memory metrics
- **Vertical Pod Autoscaler (VPA)**: Resource optimization for running pods

### Load Balancing Options
- **Application Load Balancer**: 
  - SSL termination with ACM certificates
  - Path-based and host-based routing
  - Integration with External DNS
- **Network Load Balancer**:
  - High-performance Layer 4 load balancing
  - Static IP addresses with Elastic IPs
  - TLS passthrough capabilities

### Security Features
- **Kubernetes Secrets**: Secure credential management
- **IAM Roles for Service Accounts (IRSA)**: Fine-grained AWS permissions
- **Network Policies**: Pod-to-pod communication controls
- **Resource Quotas**: Namespace-level resource limits

### Observability
- **CloudWatch Container Insights**: Cluster and application metrics
- **AWS X-Ray**: Distributed tracing for microservices
- **Application logs**: Centralized logging with CloudWatch

## Deployment Guides

### Microservices Architecture

The repository includes a complete microservices deployment example:

1. **Database Layer**: RDS MySQL with connection pooling
2. **Business Logic**: User Management API with CRUD operations
3. **Communication Layer**: Inter-service communication patterns
4. **Presentation Layer**: Load balancer configuration with SSL

### Fargate Deployments

Deploy serverless containers using Fargate profiles:

```bash
# Create Fargate profile
eksctl create fargateprofile \
    --cluster eksdemo1 \
    --name fp-default \
    --namespace default \
    --labels app=sample-app
```

### Canary Deployments

Implement gradual rollout strategies:

1. Deploy new application version alongside existing
2. Configure traffic splitting via load balancer
3. Monitor application metrics and error rates
4. Gradually increase traffic to new version

## Best Practices

### Resource Management
- Define appropriate resource requests and limits
- Use namespace-level resource quotas
- Implement limit ranges for default constraints

### Security
- Use least-privilege IAM policies
- Enable encryption at rest and in transit
- Regularly update cluster and node AMIs
- Implement pod security policies

### Networking
- Use private subnets for worker nodes
- Implement proper security group rules
- Consider using AWS VPC CNI plugin features

### Monitoring
- Enable Container Insights for cluster visibility
- Set up custom CloudWatch alarms
- Implement distributed tracing for microservices
- Use structured logging practices

## Troubleshooting

### Common Issues

**Pod Scheduling Issues**
```bash
# Check node capacity
kubectl describe nodes

# Verify resource requests
kubectl describe pod <pod-name>
```

**Load Balancer Problems**
```bash
# Check AWS Load Balancer Controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Verify ingress annotations
kubectl describe ingress <ingress-name>
```

**Storage Issues**
```bash
# Check PVC status
kubectl get pvc

# Verify storage class
kubectl get storageclass
```

### Useful Commands

```bash
# Cluster information
kubectl cluster-info

# Node status
kubectl get nodes -o wide

# Pod troubleshooting
kubectl logs <pod-name> -f
kubectl exec -it <pod-name> -- /bin/bash

# Service connectivity
kubectl get svc
kubectl port-forward svc/<service-name> 8080:80
```


### Code Standards
- Follow Kubernetes resource naming conventions
- Include proper labels and annotations
- Add comments for complex configurations
- Test configurations in a development environment

## Additional Resources

- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [eksctl Documentation](https://eksctl.io/)

