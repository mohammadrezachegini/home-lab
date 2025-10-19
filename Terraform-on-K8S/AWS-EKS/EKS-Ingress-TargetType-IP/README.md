# EKS Ingress TargetType IP

## Overview

This project demonstrates how to configure AWS Application Load Balancer (ALB) Ingress with **IP target type** instead of the default instance target type. When using IP mode, the ALB forwards traffic directly to pod IP addresses rather than to EC2 instance node ports. This approach provides better performance, more efficient network utilization, and enables features like Fargate support.

The IP target type is particularly beneficial for:
- **AWS Fargate**: Required for Fargate pods (no instance target available)
- **Better performance**: Direct pod-to-pod communication without NodePort overhead
- **Improved security**: No need to open NodePort range on security groups
- **Accurate source IP**: Preserves client IP address without additional configuration

## Architecture

```
Internet
    |
    v
AWS Application Load Balancer (ALB)
    |
    +-- Target Group (IP mode) --+
                                  |
                                  v
                          Direct to Pod IPs
                                  |
        +-------------------------+-------------------------+
        |                         |                         |
        v                         v                         v
   Pod (10.0.1.5)          Pod (10.0.2.8)           Pod (10.0.3.12)
   /app1                   /app2                    /app3 (default)
```

### Key Difference: IP vs Instance Mode

**Instance Mode (Default)**:
```
ALB → EC2 Instance NodePort → kube-proxy → Pod IP
```

**IP Mode**:
```
ALB → Pod IP directly
```

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.0
- kubectl configured to interact with your EKS cluster
- A registered domain name in Route53
- ACM certificate for your domain
- Understanding of Kubernetes networking and CNI
- EKS cluster with VPC CNI plugin (enables pod IPs routable from ALB)

## Project Structure

```
EKS-Ingress-TargetType-IP/
├── ekscluster-terraform-manifests/          # EKS cluster infrastructure
│   ├── c1-versions.tf                        # Provider versions
│   ├── c3-01-vpc-variables.tf               # VPC configuration
│   ├── c5-06-eks-cluster.tf                 # EKS cluster definition
│   └── ...
├── lbc-install-terraform-manifests/         # AWS Load Balancer Controller
│   ├── c1-versions.tf
│   ├── c4-03-lbc-install.tf                 # LBC Helm installation
│   └── ...
├── externaldns-install-terraform-manifests/ # ExternalDNS setup
│   ├── c4-03-externaldns-install.tf
│   └── ...
├── ingress-TargetType-IP-terraform-manifests/  # Terraform-managed Ingress resources
│   └── ...
└── kube-manifests-ingress-TargetType-IP/    # Kubernetes manifests for IP target type
    ├── 01-Nginx-App1-Deployment-and-NodePortService.yml
    ├── 02-Nginx-App2-Deployment-and-NodePortService.yml
    ├── 03-Nginx-App3-Deployment-and-NodePortService.yml
    └── 04-ALB-Ingress-CertDiscovery-host.yml
```

## Usage

### Step 1: Deploy EKS Cluster

```bash
cd ekscluster-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

**Important**: Ensure the VPC CNI plugin is properly configured. EKS uses this by default, but verify:

```bash
kubectl get pods -n kube-system | grep aws-node
```

### Step 2: Install AWS Load Balancer Controller

```bash
cd ../lbc-install-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

### Step 3: Install ExternalDNS

```bash
cd ../externaldns-install-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

### Step 4: Deploy Applications with IP Target Type

You can deploy using either Terraform or kubectl:

#### Option A: Using kubectl

```bash
cd ../kube-manifests-ingress-TargetType-IP

# Deploy all applications and Ingress
kubectl apply -f .
```

#### Option B: Using Terraform

```bash
cd ../ingress-TargetType-IP-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

### Step 5: Verify Deployment

```bash
# Check deployments
kubectl get deployments

# Check services (Note: ClusterIP instead of NodePort)
kubectl get svc

# Check ingress
kubectl get ingress

# Describe ingress to see ALB details
kubectl describe ingress ingress-target-type-ip-demo

# Get ALB DNS name
kubectl get ingress ingress-target-type-ip-demo -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

### Step 6: Verify IP Target Type in AWS Console

1. Navigate to EC2 Console → Load Balancers
2. Find your ALB (name: `target-type-ip-ingress`)
3. Go to Target Groups
4. Click on each target group
5. Check "Targets" tab - you should see **Pod IP addresses** instead of EC2 instance IDs

### Step 7: Test Access

```bash
# Wait for DNS propagation (if using ExternalDNS)
nslookup target-type-ip-501.stacksimplify.com

# Test each application path
curl https://target-type-ip-501.stacksimplify.com/app1
curl https://target-type-ip-501.stacksimplify.com/app2
curl https://target-type-ip-501.stacksimplify.com/app3

# Or use ALB DNS directly
ALB_DNS=$(kubectl get ingress ingress-target-type-ip-demo -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
curl https://$ALB_DNS/app1
curl https://$ALB_DNS/app2
curl https://$ALB_DNS/app3
```

## Configuration

### Ingress with IP Target Type

**File**: `kube-manifests-ingress-TargetType-IP/04-ALB-Ingress-CertDiscovery-host.yml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-target-type-ip-demo
  annotations:
    # Load Balancer Name
    alb.ingress.kubernetes.io/load-balancer-name: target-type-ip-ingress

    # Ingress Core Settings
    alb.ingress.kubernetes.io/scheme: internet-facing

    # Health Check Settings
    alb.ingress.kubernetes.io/healthcheck-protocol: HTTP
    alb.ingress.kubernetes.io/healthcheck-port: traffic-port
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: '15'
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: '5'
    alb.ingress.kubernetes.io/success-codes: '200'
    alb.ingress.kubernetes.io/healthy-threshold-count: '2'
    alb.ingress.kubernetes.io/unhealthy-threshold-count: '2'

    # SSL Settings
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}, {"HTTP":80}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'

    # External DNS
    external-dns.alpha.kubernetes.io/hostname: target-type-ip-501.stacksimplify.com

    # TARGET TYPE: IP - This is the key annotation!
    alb.ingress.kubernetes.io/target-type: ip

spec:
  ingressClassName: my-aws-ingress-class
  defaultBackend:
    service:
      name: app3-nginx-clusterip-service
      port:
        number: 80
  tls:
  - hosts:
    - "*.stacksimplify.com"
  rules:
  - http:
      paths:
      - path: /app1
        pathType: Prefix
        backend:
          service:
            name: app1-nginx-clusterip-service
            port:
              number: 80
  - http:
      paths:
      - path: /app2
        pathType: Prefix
        backend:
          service:
            name: app2-nginx-clusterip-service
            port:
              number: 80
```

### Service Configuration for IP Target Type

When using IP target type, services should be **ClusterIP** (not NodePort):

**File**: `kube-manifests-ingress-TargetType-IP/01-Nginx-App1-Deployment-and-NodePortService.yml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: app1-nginx-clusterip-service
  labels:
    app: app1-nginx
  annotations:
    alb.ingress.kubernetes.io/healthcheck-path: /app1/index.html
spec:
  type: ClusterIP  # Use ClusterIP for IP target type
  selector:
    app: app1-nginx
  ports:
  - port: 80
    targetPort: 80
```

### Certificate Discovery with TLS Hosts

The Ingress uses TLS host-based certificate discovery:

```yaml
spec:
  tls:
  - hosts:
    - "*.stacksimplify.com"  # Wildcard certificate discovery
```

The AWS Load Balancer Controller will:
1. Search for ACM certificates matching `*.stacksimplify.com`
2. Automatically attach the certificate to the ALB
3. Enable HTTPS on port 443

### Key Annotations Explained

| Annotation | Purpose | Value for IP Mode |
|------------|---------|-------------------|
| `alb.ingress.kubernetes.io/target-type` | Specifies target registration mode | `ip` (default is `instance`) |
| `alb.ingress.kubernetes.io/scheme` | ALB visibility | `internet-facing` or `internal` |
| `alb.ingress.kubernetes.io/healthcheck-protocol` | Health check protocol | `HTTP` or `HTTPS` |
| `alb.ingress.kubernetes.io/ssl-redirect` | Redirect HTTP to HTTPS | `443` |
| `external-dns.alpha.kubernetes.io/hostname` | DNS record to create | Your domain name |

## Features

### 1. IP Target Type Benefits

**Direct Pod Communication**
- No NodePort overhead
- Reduced network hops
- Better performance and lower latency

**Source IP Preservation**
- Client IP addresses preserved without additional configuration
- No need for proxy protocol or X-Forwarded-For headers

**Security Improvements**
- No need to open NodePort range (30000-32767) on security groups
- Smaller attack surface
- More granular security group rules

**Fargate Support**
- Required for AWS Fargate pods
- Enables serverless container deployments

### 2. Certificate Discovery

**Automatic ACM Certificate Discovery**
- No need to manually specify certificate ARN
- Controller searches ACM for matching certificates
- Supports wildcard certificates
- Automatically renews when certificates are updated in ACM

### 3. Path-Based Routing

- Multiple applications behind single ALB
- Default backend for unmatched paths
- Efficient resource utilization

### 4. SSL/TLS Termination

- HTTPS termination at ALB
- HTTP to HTTPS automatic redirect
- Modern TLS policies

### 5. External DNS Integration

- Automatic Route53 record creation
- DNS updates on Ingress changes
- Cleanup on Ingress deletion

## Troubleshooting

### Issue: Targets Not Registering in Target Group

**Symptoms**: ALB created but no healthy targets

**Solutions**:

1. Verify VPC CNI plugin is running:
```bash
kubectl get pods -n kube-system -l k8s-app=aws-node
kubectl logs -n kube-system -l k8s-app=aws-node --tail=50
```

2. Check pod IP allocation:
```bash
kubectl get pods -o wide
# Verify pods have IP addresses from VPC CIDR
```

3. Verify security group rules allow ALB to reach pods:
```bash
# Check EKS cluster security group
aws eks describe-cluster --name <cluster-name> --query 'cluster.resourcesVpcConfig.clusterSecurityGroupId'

# Ensure it allows ingress from ALB security group on pod ports
```

4. Check AWS Load Balancer Controller logs:
```bash
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

### Issue: 503 Service Unavailable

**Symptoms**: ALB returns 503 errors

**Solutions**:

1. Check target health in AWS Console:
   - EC2 → Load Balancers → Target Groups
   - Look for unhealthy targets and reasons

2. Verify health check path is accessible:
```bash
# Port forward to pod and test health check path
kubectl port-forward deployment/app1-nginx-deployment 8080:80
curl http://localhost:8080/app1/index.html
```

3. Check security groups:
```bash
# Ensure ALB security group can reach pod IPs
# Ensure pod security groups allow traffic from ALB
```

### Issue: Certificate Not Found

**Symptoms**: ALB created without HTTPS listener

**Solutions**:

1. List ACM certificates in the region:
```bash
aws acm list-certificates --region us-east-1
```

2. Verify certificate matches TLS host pattern:
```bash
aws acm describe-certificate --certificate-arn <arn> --region us-east-1
```

3. Ensure certificate is in ISSUED status:
```bash
aws acm describe-certificate --certificate-arn <arn> --query 'Certificate.Status'
```

4. Alternatively, specify certificate ARN explicitly:
```yaml
annotations:
  alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:xxx:certificate/xxx
```

### Issue: DNS Record Not Created

**Symptoms**: ExternalDNS doesn't create Route53 record

**Solutions**:

1. Check ExternalDNS logs:
```bash
kubectl logs deployment/external-dns -n default
```

2. Verify hosted zone exists:
```bash
aws route53 list-hosted-zones --query 'HostedZones[?Name==`stacksimplify.com.`]'
```

3. Check ExternalDNS IAM permissions:
```bash
# Ensure ExternalDNS role has Route53 permissions
kubectl describe sa external-dns -n default
```

### Issue: Pods Not Getting IP Addresses

**Symptoms**: Pods stuck in pending or CrashLoopBackOff due to IP allocation issues

**Solutions**:

1. Check VPC CNI configuration:
```bash
kubectl get daemonset aws-node -n kube-system -o yaml | grep -A 5 WARM_
```

2. Verify subnet has available IPs:
```bash
aws ec2 describe-subnets --subnet-ids <subnet-id> --query 'Subnets[0].AvailableIpAddressCount'
```

3. Increase ENI limits or use prefix delegation:
```bash
kubectl set env daemonset aws-node -n kube-system ENABLE_PREFIX_DELEGATION=true
```

### Issue: ClusterIP Service Not Working

**Symptoms**: Services don't respond when using ClusterIP

**Solutions**:

1. Verify service endpoints exist:
```bash
kubectl get endpoints
```

2. Check that pods are running and ready:
```bash
kubectl get pods -o wide
```

3. Test service from within the cluster:
```bash
kubectl run test-pod --rm -it --image=busybox -- wget -O- http://app1-nginx-clusterip-service/app1/index.html
```

## Best Practices

### 1. Use ClusterIP Services

- Always use `type: ClusterIP` when target type is IP
- NodePort is unnecessary and adds overhead
- LoadBalancer type conflicts with Ingress management

### 2. Security Group Configuration

**Simplify security groups**:
- No need for NodePort range (30000-32767)
- Allow ALB security group to reach pod ports directly
- Use more restrictive rules for better security

**Example**: Allow only port 80/443 from ALB SG to pod SG

### 3. Health Check Configuration

**Configure proper health check paths**:
```yaml
annotations:
  alb.ingress.kubernetes.io/healthcheck-path: /health
  alb.ingress.kubernetes.io/healthcheck-protocol: HTTP
```

**Use application-specific health endpoints**:
- Verify application functionality, not just pod liveness
- Return 200 only when app is ready to serve traffic

### 4. VPC CNI Optimization

**Enable prefix delegation for more IPs**:
```bash
kubectl set env daemonset aws-node -n kube-system ENABLE_PREFIX_DELEGATION=true
```

**Configure WARM IP pools appropriately**:
```bash
kubectl set env daemonset aws-node -n kube-system WARM_IP_TARGET=2
kubectl set env daemonset aws-node -n kube-system MINIMUM_IP_TARGET=10
```

### 5. Certificate Management

**Use wildcard certificates**:
- Simplifies multi-subdomain deployments
- Reduces certificate management overhead
- Example: `*.example.com` covers all subdomains

**Automate certificate renewal**:
- ACM automatically renews certificates
- Load Balancer Controller picks up new certificates automatically

### 6. Performance Optimization

**Enable connection draining**:
```yaml
annotations:
  alb.ingress.kubernetes.io/target-group-attributes: deregistration_delay.timeout_seconds=30
```

**Configure sticky sessions if needed**:
```yaml
annotations:
  alb.ingress.kubernetes.io/target-group-attributes: stickiness.enabled=true,stickiness.lb_cookie.duration_seconds=86400
```

### 7. Monitoring and Logging

**Enable ALB access logs**:
```yaml
annotations:
  alb.ingress.kubernetes.io/load-balancer-attributes: access_logs.s3.enabled=true,access_logs.s3.bucket=my-bucket
```

**Monitor target health**:
- Set up CloudWatch alarms for unhealthy target count
- Monitor target response time
- Track HTTP error rates (4xx, 5xx)

### 8. Fargate Compatibility

If using Fargate:
- IP target type is required (instance mode not available)
- Ensure Fargate profile covers the namespace
- Verify pods are scheduled on Fargate nodes

### 9. Network Policy Considerations

When using IP target type with Network Policies:
- ALB needs to reach pod IPs directly
- Ensure Network Policies allow ingress from ALB subnet CIDR
- Test policies thoroughly before applying in production
