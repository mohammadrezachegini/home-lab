# Amazon ECR Integration with Amazon EKS

## Overview

This project demonstrates the integration of Amazon Elastic Container Registry (ECR) with Amazon Elastic Kubernetes Service (EKS). It showcases how to build, push, and deploy containerized applications from ECR private repositories to an EKS cluster, complete with Application Load Balancer (ALB) ingress configuration and SSL/TLS termination.

The implementation deploys a custom Nginx web application stored in ECR, exposing it through both NodePort services and an internet-facing Application Load Balancer with HTTPS support and Route53 DNS integration.

## Architecture

The solution consists of the following components:

- **Amazon ECR**: Private container registry storing the custom Nginx container image
- **Amazon EKS**: Managed Kubernetes cluster running the containerized application
- **AWS Load Balancer Controller**: Managing Application Load Balancer provisioning via Kubernetes Ingress
- **Application Load Balancer**: Internet-facing load balancer with SSL/TLS termination
- **Amazon Route53**: DNS management with External DNS integration
- **AWS Certificate Manager (ACM)**: SSL/TLS certificate for HTTPS traffic

```
┌─────────────────┐
│   Route53 DNS   │
│ ecrdemo.rezaops │
└────────┬────────┘
         │
┌────────▼─────────┐
│  Application     │
│  Load Balancer   │◄──── ACM Certificate
│  (HTTPS/HTTP)    │
└────────┬─────────┘
         │
┌────────▼─────────────────┐
│   EKS Cluster            │
│  ┌──────────────────┐    │
│  │  Nginx Pods (x2) │    │
│  │  From ECR Image  │    │
│  └──────────────────┘    │
└──────────────────────────┘
         ▲
         │
┌────────┴─────────┐
│  Amazon ECR      │
│  Private Registry│
└──────────────────┘
```

## Prerequisites

### Required Tools
- AWS CLI (v2.x or higher) configured with appropriate credentials
- kubectl (v1.21 or higher)
- eksctl (v0.100.0 or higher)
- Docker (v20.x or higher)
- Helm 3.x (for AWS Load Balancer Controller)

### AWS Resources
- An existing EKS cluster with OIDC provider configured
- AWS Load Balancer Controller installed in the cluster
- External DNS controller installed (optional, for automatic Route53 record creation)
- IAM roles with appropriate permissions for:
  - ECR access (pull images)
  - Load Balancer management
  - Route53 DNS management (if using External DNS)

### Required IAM Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ],
      "Resource": "*"
    }
  ]
}
```

### Domain and SSL Requirements
- A registered domain name in Route53 (or delegated hosted zone)
- SSL/TLS certificate provisioned in AWS Certificate Manager
- Certificate must be in the same region as your load balancer

## Project Structure

```
ECR-Elastic-Container-Registry-and-EKS/
├── README.md
├── aws-ecr-kubenginx/
│   ├── Dockerfile              # Nginx container definition
│   └── index.html              # Custom HTML content
└── kube-manifests/
    ├── 01-ECR-Nginx-Deployment.yml        # Kubernetes deployment
    ├── 02-ECR-Nginx-NodePortService.yml   # NodePort service
    └── 03-ECR-Nginx-ALB-IngressService.yml # ALB Ingress configuration
```

## Usage

### Step 1: Create ECR Repository

```bash
# Set your AWS region and account ID
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create ECR repository
aws ecr create-repository \
    --repository-name aws-ecr-kubenginx \
    --region $AWS_REGION
```

### Step 2: Build and Push Docker Image to ECR

```bash
# Navigate to the application directory
cd aws-ecr-kubenginx/

# Authenticate Docker to ECR
aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin \
    $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build the Docker image
docker build -t aws-ecr-kubenginx:1.0.0 .

# Tag the image for ECR
docker tag aws-ecr-kubenginx:1.0.0 \
    $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/aws-ecr-kubenginx:1.0.0

# Push the image to ECR
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/aws-ecr-kubenginx:1.0.0
```

### Step 3: Update Kubernetes Manifests

Update the image reference in `01-ECR-Nginx-Deployment.yml`:

```yaml
spec:
  containers:
  - name: kubeapp-ecr
    image: <YOUR-ACCOUNT-ID>.dkr.ecr.<YOUR-REGION>.amazonaws.com/aws-ecr-kubenginx:1.0.0
```

Update the Ingress annotations in `03-ECR-Nginx-ALB-IngressService.yml`:

```yaml
annotations:
  # Update with your ACM certificate ARN
  alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:<region>:<account>:certificate/<cert-id>

  # Update with your domain
  external-dns.alpha.kubernetes.io/hostname: <your-domain>
```

### Step 4: Deploy to EKS

```bash
# Navigate to manifests directory
cd ../kube-manifests/

# Apply the deployment
kubectl apply -f 01-ECR-Nginx-Deployment.yml

# Apply the NodePort service
kubectl apply -f 02-ECR-Nginx-NodePortService.yml

# Apply the Ingress configuration
kubectl apply -f 03-ECR-Nginx-ALB-IngressService.yml

# Verify deployment
kubectl get deployment kubeapp-ecr
kubectl get pods -l app=kubeapp-ecr
kubectl get svc kubeapp-ecr-nodeport-service
kubectl get ingress ecr-ingress-service
```

### Step 5: Verify Application

```bash
# Check ALB creation (wait for ADDRESS to appear)
kubectl get ingress ecr-ingress-service -w

# Get the ALB DNS name
ALB_DNS=$(kubectl get ingress ecr-ingress-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "ALB DNS: $ALB_DNS"

# Test HTTP endpoint (should redirect to HTTPS)
curl -I http://$ALB_DNS

# Test HTTPS endpoint with custom domain (if DNS is configured)
curl https://ecrdemo.rezaops.com
```

### Step 6: Monitoring and Logs

```bash
# View pod logs
kubectl logs -l app=kubeapp-ecr --tail=100

# Describe pods for troubleshooting
kubectl describe pods -l app=kubeapp-ecr

# Check ingress events
kubectl describe ingress ecr-ingress-service

# View AWS Load Balancer Controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

## Configuration

### Deployment Configuration

The deployment manifest (`01-ECR-Nginx-Deployment.yml`) includes:

```yaml
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: kubeapp-ecr
        image: <account>.dkr.ecr.<region>.amazonaws.com/aws-ecr-kubenginx:1.0.0
        resources:
          requests:
            memory: "128Mi"
            cpu: "500m"
          limits:
            memory: "256Mi"
            cpu: "1000m"
        ports:
        - containerPort: 80
```

**Key Parameters:**
- `replicas: 2` - Runs two pod instances for high availability
- Resource requests and limits ensure proper scheduling and resource management
- Container port 80 exposes the Nginx web server

### Ingress Configuration

The Ingress resource configures the Application Load Balancer:

```yaml
annotations:
  # Load balancer settings
  alb.ingress.kubernetes.io/load-balancer-name: ecr-ingress
  alb.ingress.kubernetes.io/scheme: internet-facing

  # Health check configuration
  alb.ingress.kubernetes.io/healthcheck-protocol: HTTP
  alb.ingress.kubernetes.io/healthcheck-port: traffic-port
  alb.ingress.kubernetes.io/healthcheck-interval-seconds: '15'
  alb.ingress.kubernetes.io/healthcheck-timeout-seconds: '5'
  alb.ingress.kubernetes.io/success-codes: '200'
  alb.ingress.kubernetes.io/healthy-threshold-count: '2'
  alb.ingress.kubernetes.io/unhealthy-threshold-count: '2'

  # SSL/TLS configuration
  alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}, {"HTTP":80}]'
  alb.ingress.kubernetes.io/certificate-arn: <your-certificate-arn>
  alb.ingress.kubernetes.io/ssl-redirect: '443'

  # DNS configuration
  external-dns.alpha.kubernetes.io/hostname: <your-domain>
```

### ECR Image Pull Authentication

EKS nodes authenticate to ECR using the IAM role attached to the node group. Ensure the node IAM role includes the managed policy:
- `arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly`

Alternatively, use a custom policy with minimum required permissions.

## Features

### 1. Private Container Registry Integration
- Secure storage of container images in Amazon ECR
- Automatic authentication from EKS to ECR via IAM roles
- Image versioning with semantic tags (1.0.0)
- Vulnerability scanning support (enable in ECR repository settings)

### 2. High Availability Deployment
- Multiple replica pods (2) for redundancy
- Pod anti-affinity can be configured for zone distribution
- Health checks ensure traffic only routes to healthy pods
- Rolling update strategy for zero-downtime deployments

### 3. Application Load Balancer Integration
- Internet-facing ALB provisioned automatically via Kubernetes Ingress
- Path-based and host-based routing support
- SSL/TLS termination at the load balancer
- HTTP to HTTPS automatic redirection
- Health checks with configurable thresholds

### 4. SSL/TLS Security
- ACM certificate integration for HTTPS
- Automatic SSL certificate validation
- Support for multiple certificates (SNI)
- Secure communication from clients to load balancer

### 5. DNS Management
- External DNS integration for automatic Route53 record creation
- Custom domain support
- Automatic DNS record updates when load balancer changes

### 6. Resource Management
- CPU and memory requests/limits defined
- Efficient pod scheduling based on resource availability
- Prevention of resource over-commitment

## Troubleshooting

### Issue: Pods Show ImagePullBackOff Error

**Symptoms:**
```bash
kubectl get pods
# kubeapp-ecr-xxx   0/1   ImagePullBackOff
```

**Solutions:**

1. Verify ECR repository exists:
```bash
aws ecr describe-repositories --repository-names aws-ecr-kubenginx
```

2. Check node IAM role has ECR permissions:
```bash
# Get node instance role
kubectl get nodes -o jsonpath='{.items[0].spec.providerID}' | cut -d'/' -f5

# Verify IAM role has ECR access
aws iam list-attached-role-policies --role-name <node-role-name>
```

3. Verify image exists in ECR:
```bash
aws ecr describe-images --repository-name aws-ecr-kubenginx
```

4. Check pod events:
```bash
kubectl describe pod <pod-name>
```

### Issue: Ingress Not Creating Load Balancer

**Symptoms:**
```bash
kubectl get ingress
# No ADDRESS shown
```

**Solutions:**

1. Verify AWS Load Balancer Controller is running:
```bash
kubectl get deployment -n kube-system aws-load-balancer-controller
```

2. Check controller logs:
```bash
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

3. Verify service account has correct IAM role:
```bash
kubectl describe sa -n kube-system aws-load-balancer-controller
```

4. Check ingress events:
```bash
kubectl describe ingress ecr-ingress-service
```

### Issue: SSL Certificate Error

**Symptoms:**
- Browser shows certificate warning
- SSL handshake failures

**Solutions:**

1. Verify certificate ARN is correct in ingress annotation
2. Ensure certificate is issued (not pending validation):
```bash
aws acm describe-certificate --certificate-arn <your-cert-arn>
```

3. Verify certificate domain matches the ingress hostname
4. Ensure certificate is in the same region as the load balancer

### Issue: DNS Resolution Fails

**Symptoms:**
- Domain doesn't resolve to load balancer
- Route53 record not created

**Solutions:**

1. Verify External DNS is installed and running:
```bash
kubectl get pods -n kube-system -l app=external-dns
```

2. Check External DNS logs:
```bash
kubectl logs -n kube-system -l app=external-dns
```

3. Verify External DNS has Route53 permissions:
```bash
# Check service account annotation
kubectl describe sa -n kube-system external-dns
```

4. Manually create Route53 record if needed:
```bash
aws route53 change-resource-record-sets \
    --hosted-zone-id <zone-id> \
    --change-batch file://change-batch.json
```

### Issue: Health Check Failures

**Symptoms:**
- Targets show unhealthy in target group
- 502 Bad Gateway errors

**Solutions:**

1. Verify health check path exists:
```bash
kubectl exec -it <pod-name> -- curl http://localhost:80/index.html
```

2. Check security groups allow health check traffic:
```bash
# Verify node security group allows traffic from ALB
aws ec2 describe-security-groups --group-ids <node-sg-id>
```

3. Adjust health check parameters in ingress annotations if needed:
```yaml
alb.ingress.kubernetes.io/healthcheck-interval-seconds: '30'
alb.ingress.kubernetes.io/healthy-threshold-count: '3'
```

## Best Practices

### 1. ECR Repository Management
- Enable image scanning on push for vulnerability detection
- Implement lifecycle policies to remove old/untagged images
- Use semantic versioning for image tags
- Never use `latest` tag in production deployments

```bash
# Enable image scanning
aws ecr put-image-scanning-configuration \
    --repository-name aws-ecr-kubenginx \
    --image-scanning-configuration scanOnPush=true

# Create lifecycle policy
aws ecr put-lifecycle-policy \
    --repository-name aws-ecr-kubenginx \
    --lifecycle-policy-text file://lifecycle-policy.json
```

Example lifecycle policy:
```json
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Keep last 10 images",
      "selection": {
        "tagStatus": "any",
        "countType": "imageCountMoreThan",
        "countNumber": 10
      },
      "action": {
        "type": "expire"
      }
    }
  ]
}
```

### 2. Security Configuration
- Use AWS Secrets Manager or Kubernetes Secrets for sensitive data
- Enable encryption at rest for ECR repositories
- Restrict ECR access using IAM policies and repository policies
- Use VPC endpoints for ECR to avoid internet traffic

```bash
# Enable ECR encryption
aws ecr put-repository-policy \
    --repository-name aws-ecr-kubenginx \
    --policy-text file://repo-policy.json
```

### 3. High Availability
- Deploy pods across multiple availability zones
- Use pod disruption budgets to ensure availability during updates
- Configure appropriate replica counts based on load

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: kubeapp-ecr-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: kubeapp-ecr
```

### 4. Resource Management
- Always define resource requests and limits
- Use horizontal pod autoscaling for dynamic workloads
- Monitor resource utilization with CloudWatch Container Insights

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: kubeapp-ecr-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: kubeapp-ecr
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 5. Monitoring and Observability
- Enable CloudWatch Container Insights for EKS
- Configure application logging to CloudWatch Logs
- Set up CloudWatch alarms for critical metrics
- Use AWS X-Ray for distributed tracing

### 6. Cost Optimization
- Right-size pod resource requests/limits
- Use ECR lifecycle policies to reduce storage costs
- Consider using Fargate for variable workloads
- Review and optimize ALB target group configurations

### 7. Deployment Strategy
- Use rolling updates with proper maxSurge and maxUnavailable values
- Implement readiness and liveness probes
- Test deployments in staging environment first
- Use GitOps practices (ArgoCD, Flux) for deployment automation

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```
