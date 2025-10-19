# EKS Workloads on Fargate

## Overview

This project demonstrates how to run Kubernetes workloads on AWS Fargate with Amazon EKS. AWS Fargate is a serverless compute engine for containers that eliminates the need to provision and manage EC2 instances for your EKS cluster. With Fargate, you only pay for the resources required to run your containers, and AWS automatically provisions, scales, and manages the infrastructure.

This implementation includes both basic and advanced Fargate profile configurations, showing how to schedule pods on Fargate using namespace selectors and label selectors, integrate with Application Load Balancers, and implement DNS management with ExternalDNS.

## Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                            AWS Cloud                                   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                      Amazon EKS Cluster                          │ │
│  │                                                                  │ │
│  │  ┌────────────────────┐         ┌────────────────────┐         │ │
│  │  │  Managed Nodes     │         │   AWS Fargate      │         │ │
│  │  │  (EC2 Instances)   │         │   (Serverless)     │         │ │
│  │  │                    │         │                    │         │ │
│  │  │  ┌──────────────┐  │         │  ┌──────────────┐ │         │ │
│  │  │  │ System Pods  │  │         │  │  Namespace:  │ │         │ │
│  │  │  │ - CoreDNS    │  │         │  │   fp-dev     │ │         │ │
│  │  │  │ - kube-proxy │  │         │  │              │ │         │ │
│  │  │  │ - AWS Node   │  │         │  │ ┌──────────┐ │ │         │ │
│  │  │  └──────────────┘  │         │  │ │ App1 Pod │ │ │         │ │
│  │  │                    │         │  │ │  (Nginx) │ │ │         │ │
│  │  └────────────────────┘         │  │ └──────────┘ │ │         │ │
│  │                                  │  │              │ │         │ │
│  │                                  │  │ ┌──────────┐ │ │         │ │
│  │                                  │  │ │ App2 Pod │ │ │         │ │
│  │                                  │  │ │  (Nginx) │ │ │         │ │
│  │                                  │  │ └──────────┘ │ │         │ │
│  │                                  │  └──────────────┘ │         │ │
│  │                                  │                    │         │ │
│  │                                  │  ┌──────────────┐ │         │ │
│  │                                  │  │  Namespace:  │ │         │ │
│  │                                  │  │   ns-ums     │ │         │ │
│  │                                  │  │ (Label: runon│ │         │ │
│  │                                  │  │  =fargate)   │ │         │ │
│  │                                  │  │ ┌──────────┐ │ │         │ │
│  │                                  │  │ │UserMgmt  │ │ │         │ │
│  │                                  │  │ │  Pod     │ │ │         │ │
│  │                                  │  │ └──────────┘ │ │         │ │
│  │                                  │  └──────────────┘ │         │ │
│  │                                  └────────────────────┘         │ │
│  │                                           │                     │ │
│  └───────────────────────────────────────────┼─────────────────────┘ │
│                                              │                        │
│                    ┌─────────────────────────┴─────────────────┐     │
│                    │                                           │     │
│          ┌─────────▼──────────┐                    ┌──────────▼─────┐│
│          │Application Load    │                    │  Route 53      ││
│          │    Balancer        │◄───────────────────│  (External DNS)││
│          │  - SSL/TLS         │                    │                ││
│          │  - Path routing    │                    │  *.rezaops.com ││
│          │  - Health checks   │                    └────────────────┘│
│          └────────────────────┘                                      │
│                    │                                                 │
│          ┌─────────▼──────────┐                                     │
│          │   ACM Certificate  │                                     │
│          │   (SSL/TLS)        │                                     │
│          └────────────────────┘                                     │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Fargate Profiles**: Define which pods run on Fargate based on namespace and labels
2. **Fargate Pods**: Containerized applications running on serverless Fargate infrastructure
3. **AWS Load Balancer Controller**: Manages ALB for ingress traffic
4. **ExternalDNS**: Automatically manages Route53 DNS records
5. **ACM Certificates**: SSL/TLS certificates for secure HTTPS connections

## Prerequisites

### AWS Requirements
- **AWS Account** with appropriate permissions
- **EKS Cluster** (version 1.21 or later)
- **VPC** with public and private subnets
- **IAM Roles** configured for:
  - Fargate pod execution
  - ALB Ingress Controller
  - ExternalDNS
- **ACM Certificate** for SSL/TLS (if using HTTPS)
- **Route53 Hosted Zone** (for ExternalDNS)

### Required IAM Policies

#### Fargate Pod Execution Role
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "eks-fargate-pods.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Attach the `AmazonEKSFargatePodExecutionRolePolicy` managed policy.

#### ALB Ingress Controller IAM Policy
- Use the official AWS Load Balancer Controller IAM policy
- Available at: https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json

#### ExternalDNS IAM Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "route53:ChangeResourceRecordSets"
      ],
      "Resource": [
        "arn:aws:route53:::hostedzone/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "route53:ListHostedZones",
        "route53:ListResourceRecordSets"
      ],
      "Resource": [
        "*"
      ]
    }
  ]
}
```

### Tools and CLI
```bash
# AWS CLI
aws --version  # Should be 2.x or later

# kubectl
kubectl version --client

# eksctl
eksctl version

# helm (for ALB controller installation)
helm version
```

## Project Structure

```
EKS-Workloads-on-Fargate/
├── README.md
├── Fargate-Profile-Basic/
│   └── kube-manifests/
│       ├── 01-namespace.yml
│       ├── 02-Nginx-App1-Deployment-and-NodePortService.yml
│       └── 03-ALB-Ingress-SSL-Redirect-with-ExternalDNS.yml
└── Fargate-Profiles-Advanced-YAML/
    └── kube-manifests/
        ├── 01-Fargate-Advanced-Profiles/
        │   └── 01-fargate-profiles.yml
        └── 02-Applications/
            ├── 01-ns-app1/
            │   ├── 01-namespace.yml
            │   ├── 02-Nginx-App1-Deployment-and-NodePortService.yml
            │   └── 03-ALB-Ingress-SSL-Redirect-with-ExternalDNS.yml
            ├── 02-ns-app2/
            │   ├── 01-namespace.yml
            │   ├── 02-Nginx-App2-Deployment-and-NodePortService.yml
            │   └── 03-ALB-Ingress-SSL-Redirect-with-ExternalDNS.yml
            └── 03-ns-ums/
                ├── 01-namespace.yml
                ├── 02-MySQL-externalName-Service.yml
                ├── 03-UserManagementMicroservice-Deployment-Service.yml
                ├── 04-Kubernetes-Secrets.yml
                ├── 05-UserManagement-NodePort-Service.yml
                └── 07-ALB-Ingress-SSL-Redirect-with-ExternalDNS.yml
```

### File Descriptions

#### Fargate-Profile-Basic
Basic Fargate profile configuration for simple namespace-based pod scheduling.

#### Fargate-Profiles-Advanced-YAML
Advanced configuration using both namespace and label selectors for fine-grained control.

**01-fargate-profiles.yml**: Defines Fargate profiles with namespace and label selectors
**Application Manifests**: Deploy various applications to different Fargate profiles

## Usage

### Step 1: Create Fargate Profiles

#### Option A: Using eksctl (Recommended for New Clusters)

```bash
# Create cluster with Fargate profile
eksctl create cluster \
  --name eksdemo1 \
  --region us-east-1 \
  --fargate
```

#### Option B: Add Fargate Profile to Existing Cluster

**Basic Namespace-Based Profile:**
```bash
# Create Fargate profile for fp-dev namespace
eksctl create fargateprofile \
  --cluster eksdemo1 \
  --region us-east-1 \
  --name fp-dev \
  --namespace fp-dev

# Verify profile creation
eksctl get fargateprofile --cluster eksdemo1 --region us-east-1
```

**Advanced Profile with Label Selectors:**
```bash
# Navigate to advanced profile directory
cd /Users/reza/home-lab/AWS-EKS/EKS-Workloads-on-Fargate/Fargate-Profiles-Advanced-YAML/kube-manifests/01-Fargate-Advanced-Profiles

# Apply Fargate profiles using eksctl
eksctl create fargateprofile \
  --cluster eksdemo1 \
  --region us-east-1 \
  --name fp-app2 \
  --namespace ns-app2

# Create profile with label selector
eksctl create fargateprofile \
  --cluster eksdemo1 \
  --region us-east-1 \
  --name fp-ums \
  --namespace ns-ums \
  --labels runon=fargate
```

**Using YAML Configuration:**
```yaml
# 01-fargate-profiles.yml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: eksdemo1
  region: us-east-1
fargateProfiles:
- name: fp-app2
  selectors:
  - namespace: ns-app2
- name: fp-ums
  selectors:
  - namespace: ns-ums
    labels:
      runon: fargate
```

```bash
# Apply configuration
eksctl create fargateprofile -f 01-fargate-profiles.yml
```

### Step 2: Install AWS Load Balancer Controller

```bash
# Create IAM OIDC provider
eksctl utils associate-iam-oidc-provider \
  --region us-east-1 \
  --cluster eksdemo1 \
  --approve

# Download IAM policy
curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json

# Create IAM policy
aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam_policy.json

# Create service account
eksctl create iamserviceaccount \
  --cluster=eksdemo1 \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --attach-policy-arn=arn:aws:iam::<AWS_ACCOUNT_ID>:policy/AWSLoadBalancerControllerIAMPolicy \
  --override-existing-serviceaccounts \
  --region us-east-1 \
  --approve

# Install AWS Load Balancer Controller using Helm
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=eksdemo1 \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=us-east-1 \
  --set vpcId=<YOUR_VPC_ID>

# Verify installation
kubectl get deployment -n kube-system aws-load-balancer-controller
```

### Step 3: Install ExternalDNS

```bash
# Create IAM policy for ExternalDNS
cat > external-dns-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "route53:ChangeResourceRecordSets"
      ],
      "Resource": [
        "arn:aws:route53:::hostedzone/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "route53:ListHostedZones",
        "route53:ListResourceRecordSets"
      ],
      "Resource": [
        "*"
      ]
    }
  ]
}
EOF

# Create policy
aws iam create-policy \
  --policy-name AllowExternalDNSUpdates \
  --policy-document file://external-dns-policy.json

# Create service account
eksctl create iamserviceaccount \
  --cluster=eksdemo1 \
  --namespace=default \
  --name=external-dns \
  --attach-policy-arn=arn:aws:iam::<AWS_ACCOUNT_ID>:policy/AllowExternalDNSUpdates \
  --override-existing-serviceaccounts \
  --region us-east-1 \
  --approve

# Deploy ExternalDNS
kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/external-dns/master/docs/tutorials/aws.md
```

### Step 4: Deploy Applications to Fargate

#### Deploy Basic Fargate Application

```bash
# Navigate to basic profile directory
cd /Users/reza/home-lab/AWS-EKS/EKS-Workloads-on-Fargate/Fargate-Profile-Basic/kube-manifests

# Create namespace
kubectl apply -f 01-namespace.yml

# Deploy application
kubectl apply -f 02-Nginx-App1-Deployment-and-NodePortService.yml

# Verify pods are running on Fargate
kubectl get pods -n fp-dev -o wide

# Check Fargate compute type
kubectl describe pod <pod-name> -n fp-dev | grep "fargate"
```

#### Deploy Advanced Multi-Namespace Applications

```bash
# Navigate to advanced applications directory
cd /Users/reza/home-lab/AWS-EKS/EKS-Workloads-on-Fargate/Fargate-Profiles-Advanced-YAML/kube-manifests/02-Applications

# Deploy App1 (ns-app1)
kubectl apply -f 01-ns-app1/

# Deploy App2 (ns-app2)
kubectl apply -f 02-ns-app2/

# Deploy User Management Service (ns-ums with label selector)
kubectl apply -f 03-ns-ums/

# Verify all deployments
kubectl get pods --all-namespaces -o wide
kubectl get pods -n ns-app2
kubectl get pods -n ns-ums -l runon=fargate
```

### Step 5: Create Ingress with ALB

```bash
# Update certificate ARN and domain in ingress manifest
# Edit: 03-ALB-Ingress-SSL-Redirect-with-ExternalDNS.yml

# Apply ingress
kubectl apply -f 03-ALB-Ingress-SSL-Redirect-with-ExternalDNS.yml

# Check ingress status
kubectl get ingress -n fp-dev

# Get ALB DNS name
kubectl get ingress -n fp-dev -o jsonpath='{.items[0].status.loadBalancer.ingress[0].hostname}'

# Verify Route53 record created
aws route53 list-resource-record-sets \
  --hosted-zone-id <YOUR_HOSTED_ZONE_ID> \
  --query "ResourceRecordSets[?Name=='app1.rezaops.com.']"
```

### Step 6: Test Application Access

```bash
# Access application via HTTPS
curl https://app1.rezaops.com

# Check HTTP to HTTPS redirect
curl -I http://app1.rezaops.com

# Test different applications
curl https://app2.rezaops.com
curl https://ums.rezaops.com/usermgmt/health-status
```

### Step 7: Monitor Fargate Pods

```bash
# Get pod details
kubectl get pods -n fp-dev -o wide

# Check pod logs
kubectl logs -n fp-dev <pod-name>

# Describe Fargate pod
kubectl describe pod -n fp-dev <pod-name>

# Check resource allocation
kubectl top pods -n fp-dev

# View Fargate profile details
eksctl get fargateprofile --cluster eksdemo1 -o yaml
```

## Configuration

### Fargate Profile Configuration

**Basic Namespace Selector:**
```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: eksdemo1
  region: us-east-1
fargateProfiles:
- name: fp-dev
  selectors:
  - namespace: fp-dev
```

**Advanced with Label Selectors:**
```yaml
fargateProfiles:
- name: fp-ums
  selectors:
  - namespace: ns-ums
    labels:
      runon: fargate
      environment: production
```

### Pod Resource Specifications for Fargate

Fargate allocates resources based on pod requirements:

```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "500m"
  limits:
    memory: "500Mi"
    cpu: "1000m"
```

**Fargate vCPU and Memory Combinations:**
| vCPU | Memory Options |
|------|----------------|
| 0.25 | 0.5 GB, 1 GB, 2 GB |
| 0.5  | 1 GB to 4 GB (1 GB increments) |
| 1    | 2 GB to 8 GB (1 GB increments) |
| 2    | 4 GB to 16 GB (1 GB increments) |
| 4    | 8 GB to 30 GB (1 GB increments) |

### Ingress Configuration with ALB

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: eks-microservices-demo
  annotations:
    # ALB Configuration
    alb.ingress.kubernetes.io/load-balancer-name: eks-microservices-demo
    alb.ingress.kubernetes.io/scheme: internet-facing

    # SSL Configuration
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}, {"HTTP":80}]'
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:region:account:certificate/xxx
    alb.ingress.kubernetes.io/ssl-redirect: '443'

    # Health Check Configuration
    alb.ingress.kubernetes.io/healthcheck-protocol: HTTP
    alb.ingress.kubernetes.io/healthcheck-port: traffic-port
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: '15'
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: '5'
    alb.ingress.kubernetes.io/success-codes: '200'

    # ExternalDNS Configuration
    external-dns.alpha.kubernetes.io/hostname: app.rezaops.com
spec:
  ingressClassName: my-aws-ingress-class
  rules:
  - http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app1-nginx-nodeport-service
            port:
              number: 80
```

### Deployment Configuration for Fargate

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app1-nginx-deployment
  namespace: fp-dev
spec:
  replicas: 2
  selector:
    matchLabels:
      app: app1-nginx
  template:
    metadata:
      labels:
        app: app1-nginx
    spec:
      containers:
      - name: app1-nginx
        image: stacksimplify/kube-nginxapp1:1.0.0
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "500m"
          limits:
            memory: "500Mi"
            cpu: "1000m"
```

## Features

### 1. Serverless Container Execution
- **No EC2 Management**: No need to provision, configure, or scale EC2 instances
- **Automatic Scaling**: Pods automatically scale based on resource requirements
- **Pay-per-Use**: Only pay for the vCPU and memory resources your pods use

### 2. Namespace and Label-Based Scheduling
- **Namespace Selector**: Schedule all pods in specific namespaces to Fargate
- **Label Selector**: Fine-grained control using Kubernetes labels
- **Mixed Workloads**: Run some workloads on Fargate, others on EC2

### 3. Integrated Networking
- **VPC Native**: Pods get ENI and IP from VPC
- **Security Groups**: Apply security groups to Fargate pods
- **Network Isolation**: Enhanced security through pod-level networking

### 4. Application Load Balancer Integration
- **Automatic Provisioning**: ALB controller creates and manages load balancers
- **SSL/TLS Termination**: Integrated with ACM for certificate management
- **Path-Based Routing**: Route traffic based on URL paths
- **Health Checks**: Automated health monitoring

### 5. DNS Management with ExternalDNS
- **Automatic DNS Records**: Auto-create Route53 records for ingress
- **Domain Management**: Manage multiple domains and subdomains
- **TTL Configuration**: Control DNS record time-to-live

### 6. Enhanced Security
- **IAM Roles for Service Accounts (IRSA)**: Pod-level IAM permissions
- **Network Isolation**: Pod-level security groups
- **No SSH Access**: Reduced attack surface without node access
- **Automatic Patching**: AWS manages underlying infrastructure

## Troubleshooting

### Pods Not Scheduling on Fargate

```bash
# Check Fargate profiles
eksctl get fargateprofile --cluster eksdemo1

# Verify namespace exists
kubectl get namespaces

# Check pod labels match Fargate profile selectors
kubectl get pods -n ns-ums --show-labels

# View pod scheduling events
kubectl describe pod <pod-name> -n <namespace>

# Check for pending pods
kubectl get pods --all-namespaces --field-selector=status.phase=Pending
```

### Fargate Profile Creation Failed

```bash
# Check IAM permissions
aws iam get-role --role-name <fargate-pod-execution-role>

# Verify subnet configuration
aws ec2 describe-subnets --subnet-ids <subnet-id>

# Check cluster OIDC provider
aws eks describe-cluster --name eksdemo1 --query "cluster.identity.oidc.issuer"

# View profile creation logs
eksctl get fargateprofile --cluster eksdemo1 -o yaml
```

### ALB Not Created

```bash
# Check ALB controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Verify service account
kubectl get serviceaccount aws-load-balancer-controller -n kube-system -o yaml

# Check ingress events
kubectl describe ingress <ingress-name> -n <namespace>

# Verify IAM policy attached
aws iam list-attached-role-policies --role-name <alb-controller-role>
```

### DNS Records Not Created

```bash
# Check ExternalDNS logs
kubectl logs -n default deployment/external-dns

# Verify Route53 permissions
aws route53 list-hosted-zones

# Check service account
kubectl get serviceaccount external-dns -n default -o yaml

# Verify ingress annotations
kubectl get ingress <ingress-name> -n <namespace> -o yaml
```

### High Fargate Costs

```bash
# Analyze pod resource usage
kubectl top pods --all-namespaces

# Check over-provisioned resources
kubectl get pods --all-namespaces -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].resources}{"\n"}{end}'

# Review Fargate compute costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://fargate-filter.json
```

### Pods Stuck in Pending State

```bash
# Check Fargate capacity
aws eks describe-fargate-profile \
  --cluster-name eksdemo1 \
  --fargate-profile-name fp-dev

# Verify subnet availability
aws ec2 describe-subnets --subnet-ids <subnet-ids>

# Check pod events
kubectl get events -n <namespace> --sort-by='.lastTimestamp'

# Verify security group rules
aws ec2 describe-security-groups --group-ids <sg-id>
```

## Best Practices

### 1. Resource Right-Sizing

```yaml
# Start with minimal resources and adjust based on monitoring
resources:
  requests:
    memory: "128Mi"
    cpu: "250m"
  limits:
    memory: "256Mi"
    cpu: "500m"
```

**Best Practices:**
- Monitor actual resource usage with CloudWatch Container Insights
- Right-size based on actual consumption
- Use Vertical Pod Autoscaler for recommendations
- Avoid over-provisioning to reduce costs

### 2. Strategic Fargate Profile Design

```yaml
# Use specific namespaces for Fargate workloads
fargateProfiles:
- name: fp-production
  selectors:
  - namespace: production
    labels:
      compute: fargate
      tier: frontend
```

**Best Practices:**
- Use separate profiles for different environments
- Implement label selectors for fine-grained control
- Keep system pods on managed nodes
- Use Fargate for stateless workloads

### 3. Security Hardening

**Pod Security:**
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 2000
  capabilities:
    drop:
      - ALL
```

**Best Practices:**
- Use IRSA for pod-level IAM permissions
- Implement Pod Security Standards
- Enable pod security groups for network isolation
- Regularly scan container images
- Use secrets management (AWS Secrets Manager/Systems Manager)

### 4. Network Configuration

**Best Practices:**
- Use private subnets for Fargate pods
- Implement VPC endpoints for AWS services
- Configure appropriate security groups
- Enable VPC Flow Logs for traffic analysis
- Use Network Policies for pod-to-pod communication

### 5. High Availability

```yaml
# Use pod anti-affinity for distribution
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values:
            - nginx
        topologyKey: topology.kubernetes.io/zone
```

**Best Practices:**
- Deploy across multiple availability zones
- Use appropriate replica counts
- Implement health checks (liveness/readiness probes)
- Configure PodDisruptionBudgets
- Use HPA for automatic scaling

### 6. Monitoring and Observability

```yaml
# Configure proper health checks
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
  initialDelaySeconds: 5
  periodSeconds: 5
```

**Best Practices:**
- Enable CloudWatch Container Insights
- Implement structured logging
- Use distributed tracing (AWS X-Ray)
- Set up CloudWatch alarms
- Monitor Fargate-specific metrics

### 7. Deployment Strategies

**Best Practices:**
- Use rolling updates for zero-downtime deployments
- Implement proper readiness probes
- Configure appropriate termination grace periods
- Use blue-green or canary deployments for critical apps
- Test in non-production Fargate profiles first
