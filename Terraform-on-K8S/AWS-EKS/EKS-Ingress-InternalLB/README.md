# EKS Ingress Internal Load Balancer

## Overview

This project demonstrates how to configure AWS Application Load Balancer as an internal (private) load balancer on Amazon EKS. Unlike internet-facing ALBs, internal ALBs are only accessible from within your VPC or connected networks, providing a secure way to expose applications to internal users while keeping them isolated from the public internet.

The implementation features:
- Internal (private) Application Load Balancer configuration
- Host-based routing on internal ALB
- SSL/TLS support with automatic certificate discovery
- Access restricted to VPC and connected networks
- Testing pod for internal access validation
- External DNS for internal DNS management

This pattern is ideal for internal microservices, administrative interfaces, backend APIs, and any application that should only be accessible from within your network infrastructure.

## Architecture

### Components

1. **Internal Application Load Balancer**: Private ALB in private subnets
2. **Private Subnets**: ALB deployed in private subnets only
3. **VPC Networking**: Access limited to VPC CIDR and peered networks
4. **Testing Pod**: Curl pod for internal access testing
5. **External DNS**: Manages internal Route53 records
6. **ACM Certificate**: SSL certificate for internal domains
7. **Multiple Backend Services**: Internal applications

### Traffic Flow

```
Internal User/Application (within VPC)
    |
    | Internal DNS Resolution
    v
Internal ALB (Private Subnets)
    |
    | SSL Termination (optional)
    v
Host-Based Routing
    ├─ Host: internal-app1.domain.com -> app1-service
    ├─ Host: internal-app2.domain.com -> app2-service
    └─ Host: * (default) -> app3-service
```

### Network Architecture

```
VPC (10.0.0.0/16)
│
├── Public Subnets (10.0.1.0/24, 10.0.2.0/24)
│   └── NAT Gateways
│
├── Private Subnets (10.0.11.0/24, 10.0.12.0/24)
│   ├── Internal ALB (scheme: internal)
│   ├── EKS Worker Nodes
│   └── Application Pods
│
└── Access Paths:
    ├── From EC2 bastion in public subnet
    ├── From EKS pods (testing pod)
    ├── From VPN connection
    └── From VPC peering/Transit Gateway
```

### Access Restrictions

```
✓ Allowed:
- EC2 instances in same VPC
- EKS pods in cluster
- VPN connected clients
- VPC peered networks
- Direct Connect connections
- Transit Gateway connections

✗ Blocked:
- Public internet
- External IP addresses
- Unconnected networks
```

## Prerequisites

### Required Tools
- AWS CLI configured with appropriate credentials
- kubectl (v1.21+)
- Terraform (v1.0+)
- VPN or bastion host for testing (or curl pod in cluster)

### AWS Resources
- Existing EKS cluster with worker nodes
- VPC with properly tagged private subnets
- Route53 private hosted zone (optional but recommended)
- ACM certificate for internal domains
- AWS Load Balancer Controller installed
- External DNS controller installed

### Subnet Requirements
- Private subnets must have tag: `kubernetes.io/role/internal-elb = 1`
- Minimum 2 availability zones for HA
- Subnets must have outbound internet access (via NAT Gateway) for health checks
- Proper routing tables configured

### Access Requirements
- Bastion host in public subnet, or
- VPN connection to VPC, or
- Curl pod running in EKS cluster (included in this project)

### Knowledge Requirements
- Understanding of VPC networking (public vs private subnets)
- ALB internal vs internet-facing concepts
- Security group configuration
- Private DNS concepts

## Project Structure

```
EKS-Ingress-InternalLB/
├── ekscluster-terraform-manifests/     # EKS cluster infrastructure
│   ├── c1-versions.tf                  # Terraform and provider versions
│   ├── c2-*.tf                         # Variables and local values
│   ├── c3-*.tf                         # VPC configuration
│   ├── c4-*.tf                         # Bastion host setup
│   ├── c5-*.tf                         # EKS cluster and node groups
│   ├── c6-*.tf                         # OIDC provider
│   ├── c7-*.tf                         # Kubernetes provider
│   └── c8-c11-*.tf                     # IAM users and RBAC
│
├── lbc-install-terraform-manifests/    # Load Balancer Controller
│   ├── c1-versions.tf                  # Terraform versions
│   ├── c2-remote-state-datasource.tf   # EKS cluster state reference
│   ├── c3-*.tf                         # Variables and locals
│   ├── c4-*.tf                         # LBC IAM, Helm installation
│   └── c5-*.tf                         # Kubernetes provider, IngressClass
│
├── externaldns-install-terraform-manifests/  # External DNS
│   ├── c1-versions.tf                  # Terraform versions
│   ├── c2-remote-state-datasource.tf   # Reference to EKS state
│   ├── c3-*.tf                         # Variables and locals
│   └── c4-*.tf                         # External DNS IAM and Helm
│
├── ingress-InternalLB-terraform-manifests/  # Internal LB configuration
│   ├── c1-versions.tf                  # Terraform versions
│   ├── c2-remote-state-datasource.tf   # Reference to cluster state
│   ├── c3-providers.tf                 # Kubernetes provider
│   ├── c4-kubernetes-app1-deployment.tf    # App1 deployment
│   ├── c5-kubernetes-app2-deployment.tf    # App2 deployment
│   ├── c5-kubernetes-app3-deployment.tf    # App3 deployment
│   ├── c7-kubernetes-app1-nodeport-service.tf  # App1 service
│   ├── c8-kubernetes-app2-nodeport-service.tf  # App2 service
│   ├── c9-kubernetes-app3-nodeport-service.tf  # App3 service
│   ├── c10-kubernetes-ingress-service.tf       # Internal ingress
│   ├── c11-kubernetes-curl-pod-for-testing-InternalLB.tf  # Testing pod
│   └── listen-ports/listen-ports.json  # ALB listener configuration
│
├── kube-manifests-ingress-InternalLB/  # Pure Kubernetes manifests
│   ├── 01-Nginx-App1-Deployment-and-NodePortService.yml
│   ├── 02-Nginx-App2-Deployment-and-NodePortService.yml
│   ├── 03-Nginx-App3-Deployment-and-NodePortService.yml
│   └── 04-ALB-Ingress-CertDiscovery-host.yml
│
└── kube-manifests-curl/                # Testing pod manifests
    └── 01-curl-pod.yml
```

## Usage

### Step 1: Verify Subnet Tags

```bash
# Verify private subnets have correct tag for internal ALB
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=<vpc-id>" \
  --query 'Subnets[*].[SubnetId,Tags[?Key==`kubernetes.io/role/internal-elb`].Value]' \
  --output table

# Add tag if missing (replace subnet IDs)
aws ec2 create-tags \
  --resources subnet-xxxxx subnet-yyyyy \
  --tags Key=kubernetes.io/role/internal-elb,Value=1

# Verify private subnets (should not have direct internet access)
aws ec2 describe-route-tables \
  --filters "Name=association.subnet-id,Values=<subnet-id>" \
  --query 'RouteTables[*].Routes[?GatewayId!=`local`]'
# Should route to NAT Gateway, not Internet Gateway
```

### Step 2: Deploy EKS Cluster (if not exists)

```bash
cd ekscluster-terraform-manifests/
terraform init
terraform apply -auto-approve

aws eks update-kubeconfig --region <region> --name <cluster-name>
```

### Step 3: Install AWS Load Balancer Controller

```bash
cd ../lbc-install-terraform-manifests/
terraform init
terraform apply -auto-approve

kubectl get deployment -n kube-system aws-load-balancer-controller
```

### Step 4: Install External DNS

```bash
cd ../externaldns-install-terraform-manifests/
terraform init
terraform apply -auto-approve

kubectl get deployment external-dns
```

### Step 5: Deploy Internal ALB Ingress

```bash
cd ../ingress-InternalLB-terraform-manifests/

terraform init
terraform apply -auto-approve

# Verify ingress
kubectl get ingress ingress-target-type-ip-demo
kubectl describe ingress ingress-target-type-ip-demo
```

### Step 6: Verify Internal ALB Created

```bash
# Check ingress status
kubectl get ingress

# Get internal ALB DNS (will be internal-only address)
INTERNAL_ALB=$(kubectl get ingress ingress-target-type-ip-demo \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo "Internal ALB DNS: $INTERNAL_ALB"

# Verify ALB is internal in AWS Console
# - Navigate to EC2 > Load Balancers
# - Find your ALB
# - Scheme should show: internal
# - Subnets should be private subnets only

# Check ALB scheme via CLI
aws elbv2 describe-load-balancers \
  --query "LoadBalancers[?DNSName=='$INTERNAL_ALB'].Scheme" \
  --output text
# Should return: internal
```

### Step 7: Test Internal Access with Curl Pod

```bash
# Verify curl pod is running
kubectl get pods | grep curl

# If not running, it should be deployed by terraform
# Otherwise deploy manually:
# kubectl run curl-pod --image=curlimages/curl --command -- sleep 3600

# Test access from within cluster
kubectl exec -it curl-pod -- sh

# Inside pod, test internal ALB (replace with your internal DNS or ALB DNS)
curl http://target-type-ip-501.stacksimplify.com/app1
curl http://target-type-ip-501.stacksimplify.com/app2

# Test HTTPS if configured
curl https://target-type-ip-501.stacksimplify.com/app1

# Exit pod
exit
```

### Step 8: Test from Bastion Host (if available)

```bash
# SSH to bastion host in public subnet
ssh -i <key.pem> ec2-user@<bastion-public-ip>

# Test internal ALB access
curl http://<internal-alb-dns>/app1
curl http://<internal-alb-dns>/app2

# Test with internal domain if External DNS configured
curl http://target-type-ip-501.stacksimplify.com/app1

# Verify DNS resolution
nslookup target-type-ip-501.stacksimplify.com
# Should resolve to internal ALB private IP
```

### Step 9: Verify External Access is Blocked

```bash
# From your local machine (outside VPC)
# This should FAIL with timeout or connection refused

curl http://<internal-alb-dns>/app1
# Expected: Timeout or "Could not resolve host" (public DNS won't resolve internal addresses)

# This is correct behavior - internal ALB is not accessible from internet
```

### Step 10: Monitor and Verify

```bash
# Check ALB target health
kubectl describe ingress ingress-target-type-ip-demo

# View ALB security groups
aws elbv2 describe-load-balancers \
  --query "LoadBalancers[?DNSName=='$INTERNAL_ALB'].[SecurityGroups]" \
  --output table

# Check target groups
aws elbv2 describe-target-groups \
  --load-balancer-arn <alb-arn>

# Verify targets are healthy
aws elbv2 describe-target-health \
  --target-group-arn <tg-arn>
```

### Step 11: Clean Up

```bash
cd ingress-InternalLB-terraform-manifests/
terraform destroy -auto-approve

cd ../externaldns-install-terraform-manifests/
terraform destroy -auto-approve

cd ../lbc-install-terraform-manifests/
terraform destroy -auto-approve

cd ../ekscluster-terraform-manifests/
terraform destroy -auto-approve
```

## Configuration

### Internal ALB Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-target-type-ip-demo
  annotations:
    # Load Balancer Configuration
    alb.ingress.kubernetes.io/load-balancer-name: target-type-ip-ingress

    # KEY SETTING: Internal scheme (not internet-facing)
    alb.ingress.kubernetes.io/scheme: internal

    # Health Check Settings
    alb.ingress.kubernetes.io/healthcheck-protocol: HTTP
    alb.ingress.kubernetes.io/healthcheck-port: traffic-port
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: '15'
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: '5'
    alb.ingress.kubernetes.io/success-codes: '200'
    alb.ingress.kubernetes.io/healthy-threshold-count: '2'
    alb.ingress.kubernetes.io/unhealthy-threshold-count: '2'

    # SSL Settings (optional for internal)
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}, {"HTTP":80}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'

    # External DNS for internal DNS records
    external-dns.alpha.kubernetes.io/hostname: target-type-ip-501.stacksimplify.com

    # Target Type: IP (recommended for internal ALB)
    alb.ingress.kubernetes.io/target-type: ip

spec:
  ingressClassName: my-aws-ingress-class
  defaultBackend:
    service:
      name: app3-nginx-clusterip-service
      port:
        number: 80

  # TLS for certificate discovery (optional)
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
      - path: /app2
        pathType: Prefix
        backend:
          service:
            name: app2-nginx-clusterip-service
            port:
              number: 80
```

### Key Configuration Differences: Internal vs Internet-Facing

```yaml
# Internal ALB Configuration
alb.ingress.kubernetes.io/scheme: internal
# - Deployed in private subnets
# - Private IP addresses only
# - Accessible only within VPC
# - Requires private subnet tag: kubernetes.io/role/internal-elb=1

# Internet-Facing ALB Configuration
alb.ingress.kubernetes.io/scheme: internet-facing
# - Deployed in public subnets
# - Public IP addresses
# - Accessible from internet
# - Requires public subnet tag: kubernetes.io/role/elb=1
```

### Service Type Considerations for Internal ALB

```yaml
# Option 1: ClusterIP Services (Recommended for IP target type)
apiVersion: v1
kind: Service
metadata:
  name: app1-nginx-clusterip-service
spec:
  type: ClusterIP  # <-- ClusterIP for IP target type
  selector:
    app: app1-nginx
  ports:
    - port: 80
      targetPort: 80

# With annotation:
alb.ingress.kubernetes.io/target-type: ip

# Option 2: NodePort Services (For instance target type)
apiVersion: v1
kind: Service
metadata:
  name: app1-nginx-nodeport-service
spec:
  type: NodePort  # <-- NodePort for instance target type
  selector:
    app: app1-nginx
  ports:
    - port: 80
      targetPort: 80

# With annotation (or default):
alb.ingress.kubernetes.io/target-type: instance
```

### Testing Pod Configuration

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: curl-pod
  labels:
    app: curl
spec:
  containers:
  - name: curl
    image: curlimages/curl:latest
    command: ['sh', '-c', 'sleep 3600']
  restartPolicy: Always
```

### Required Subnet Tags

```bash
# For Internal ALB - Tag private subnets
Key: kubernetes.io/role/internal-elb
Value: 1

# For Internet-Facing ALB - Tag public subnets
Key: kubernetes.io/role/elb
Value: 1

# Both types should also have cluster tag
Key: kubernetes.io/cluster/<cluster-name>
Value: shared
```

## Features

### Internal Load Balancer
- Private IP addresses only
- Deployed in private subnets
- Access restricted to VPC and connected networks
- Enhanced security for internal applications
- No exposure to public internet

### VPC Integration
- Seamless integration with VPC networking
- Support for VPC peering
- Direct Connect compatibility
- Transit Gateway support
- VPN access support

### Target Type Options
- **IP Target Type**: Routes directly to pod IPs (recommended)
- **Instance Target Type**: Routes to node ports
- Better performance with IP target type
- Supports Fargate with IP target type

### Security Features
- No public exposure
- VPC security group controls
- Private DNS support
- SSL/TLS support with ACM
- Network isolation

### Access Methods
- From EKS pods (same cluster)
- From EC2 instances in VPC
- Via VPN connection
- Via VPC peering
- Via Transit Gateway
- Via Direct Connect

## Troubleshooting

### ALB Not Created or in Wrong Subnets

**Issue**: ALB not created or created in public subnets

**Solutions**:
```bash
# Verify private subnet tags
aws ec2 describe-subnets \
  --filters "Name=tag:kubernetes.io/role/internal-elb,Values=1" \
  --query 'Subnets[*].[SubnetId,Tags[?Key==`Name`].Value|[0]]' \
  --output table

# Ensure at least 2 subnets in different AZs
# Check ALB configuration
kubectl describe ingress <ingress-name> | grep -A5 annotation

# Verify scheme annotation
kubectl get ingress -o yaml | grep scheme
# Should show: alb.ingress.kubernetes.io/scheme: internal

# Check LBC logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller | grep -i subnet
```

### Cannot Access Internal ALB

**Issue**: Timeout when accessing internal ALB

**Solutions**:
```bash
# Verify you're testing from within VPC
# Internal ALB is NOT accessible from public internet

# Test from bastion host or curl pod
kubectl exec -it curl-pod -- curl http://<internal-alb-dns>

# Check security groups
# ALB security group must allow traffic from:
# - Worker node security group
# - Bastion security group
# - VPN/client CIDR

# Verify ALB is actually internal
aws elbv2 describe-load-balancers \
  --query "LoadBalancers[?DNSName=='<alb-dns>'].Scheme"

# Check target health
aws elbv2 describe-target-health --target-group-arn <tg-arn>
```

### DNS Resolution Fails

**Issue**: Internal domain doesn't resolve

**Solutions**:
```bash
# For internal ALB, use private hosted zone in Route53
# Public hosted zones won't work for internal IPs

# Check if External DNS created record
kubectl logs deployment/external-dns | grep <domain>

# Verify Route53 hosted zone type
aws route53 get-hosted-zone --id <zone-id>
# Should be private hosted zone associated with VPC

# Test DNS from within VPC
kubectl exec -it curl-pod -- nslookup <internal-domain>

# Check Route53 record
aws route53 list-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --query "ResourceRecordSets[?Name=='<domain>']"
```

### Health Checks Failing

**Issue**: Targets unhealthy in internal ALB

**Solutions**:
```bash
# Check health check configuration
kubectl describe ingress <ingress-name> | grep healthcheck

# Verify health check path exists
kubectl exec -it <pod-name> -- curl http://localhost/health

# Check security groups
# Worker nodes must allow traffic from ALB on health check port

# Verify NAT Gateway connectivity
# Private subnets need NAT for health check responses

# Check pod logs
kubectl logs <pod-name>

# Verify service endpoints
kubectl get endpoints <service-name>
```

### Target Type Issues

**Issue**: Using IP target type but pods not registered

**Solutions**:
```bash
# Verify target-type annotation
kubectl get ingress -o yaml | grep target-type

# For IP target type, use ClusterIP services (not NodePort)
kubectl get svc
# Should show ClusterIP for services

# Check CNI plugin supports IP mode
# AWS VPC CNI supports IP mode by default

# Verify pod IPs are in VPC CIDR
kubectl get pods -o wide

# Check LBC logs for IP registration
kubectl logs -n kube-system deployment/aws-load-balancer-controller \
  | grep -i "target\|register"
```

### Security Group Issues

**Issue**: ALB created but traffic blocked

**Solutions**:
```bash
# Get ALB security group
ALB_SG=$(aws elbv2 describe-load-balancers \
  --query "LoadBalancers[?DNSName=='<alb-dns>'].SecurityGroups[]" \
  --output text)

# Check ALB security group rules
aws ec2 describe-security-groups --group-ids $ALB_SG

# ALB SG should allow:
# - Inbound from VPC CIDR (or specific sources) on ports 80/443
# - Outbound to worker nodes on application ports

# Worker node SG should allow:
# - Inbound from ALB SG on NodePort range (30000-32767) or pod ports

# Verify rules
aws ec2 describe-security-group-rules \
  --filters "Name=group-id,Values=$ALB_SG"
```

## Best Practices

### Networking
1. **Subnet Design**: Deploy internal ALB in dedicated private subnets
2. **Multi-AZ**: Always use at least 2 availability zones
3. **NAT Gateway**: Ensure private subnets have NAT for health checks
4. **Subnet Tags**: Properly tag subnets for auto-discovery
5. **CIDR Planning**: Plan IP addressing for growth

### Security
1. **Security Groups**: Configure least-privilege security group rules
2. **Private DNS**: Use Route53 private hosted zones
3. **Network ACLs**: Implement network ACLs as additional layer
4. **VPN/Bastion**: Require VPN or bastion for management access
5. **Audit Logging**: Enable ALB access logs to S3

### Access Control
1. **VPN Required**: Require VPN for external access to internal ALB
2. **Bastion Host**: Use hardened bastion hosts for admin access
3. **Service Mesh**: Consider service mesh for internal service-to-service
4. **Network Policies**: Implement Kubernetes network policies
5. **IAM Roles**: Use IAM roles for service-to-service authentication

### High Availability
1. **Multi-AZ Deployment**: Deploy across multiple AZs
2. **Redundant NAT**: Use NAT Gateway in each AZ
3. **Health Checks**: Configure appropriate health check intervals
4. **Pod Replicas**: Run multiple replicas across AZs
5. **Connection Draining**: Configure deregistration delay

### Performance
1. **Target Type**: Use IP target type for better performance
2. **Keep-Alive**: Enable connection keep-alive
3. **Health Check Tuning**: Balance responsiveness with overhead
4. **Connection Pooling**: Implement client-side connection pooling
5. **Proximity**: Place ALB close to consumers


### Monitoring and Operations
1. **CloudWatch Metrics**: Monitor ALB and target metrics
2. **Alarms**: Set up alarms for unhealthy targets
3. **Access Logs**: Enable and analyze ALB access logs
4. **VPC Flow Logs**: Enable flow logs for troubleshooting
5. **Testing**: Maintain curl pod or bastion for testing
6. **Documentation**: Document internal access procedures
