# AWS EKS - Network Load Balancer (NLB) with AWS Load Balancer Controller

## Overview

This project demonstrates advanced Network Load Balancer (NLB) implementations for Amazon EKS using the AWS Load Balancer Controller (LBC). Unlike Application Load Balancers that operate at Layer 7 (HTTP/HTTPS), Network Load Balancers operate at Layer 4 (TCP/UDP) and provide ultra-low latency, high throughput, and support for static IP addresses.

The AWS Load Balancer Controller enables advanced NLB features through Kubernetes Service annotations, including TLS termination, IP target mode, Elastic IP allocation, internal load balancing, and integration with AWS Fargate. This approach offers significantly more control and features compared to the legacy in-tree Kubernetes cloud provider.

## Architecture

### Network Load Balancer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet Gateway                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│         Network Load Balancer (NLB)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Listeners (TCP/TLS)                                 │   │
│  │  • Port 80  (HTTP)                                   │   │
│  │  • Port 443 (TLS Termination)                        │   │
│  │  • Port 81, 82 (Custom)                              │   │
│  └──────────────┬───────────────────────────────────────┘   │
│                 │                                            │
│  ┌──────────────▼───────────────────────────────────────┐   │
│  │  Target Groups (Instance or IP)                      │   │
│  │  • Health Checks (HTTP/TCP)                          │   │
│  │  • Connection Tracking                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Optional: Elastic IPs for Static Addresses                 │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ EIP: x.x.x.1 │  │ EIP: y.y.y.2 │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  EKS Cluster                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AWS Load Balancer Controller                          │ │
│  │  (Watches LoadBalancer Services)                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Instance Mode:              IP Mode:                       │
│  ┌──────────────┐            ┌──────────────┐              │
│  │ NodePort     │            │ ClusterIP    │              │
│  │ Service      │            │ Service      │              │
│  └──────┬───────┘            └──────┬───────┘              │
│         │                           │                       │
│  ┌──────▼───────┐            ┌──────▼───────┐              │
│  │ Node:30080   │            │ Pod IP       │              │
│  │  └─> Pods    │            │ Direct Route │              │
│  └──────────────┘            └──────────────┘              │
│                                                              │
│  Fargate Mode (Requires IP):                                │
│  ┌──────────────────────────────────────────────┐          │
│  │  Fargate Profile                              │          │
│  │  ┌──────────────┐  ┌──────────────┐          │          │
│  │  │ Fargate Pod  │  │ Fargate Pod  │          │          │
│  │  └──────────────┘  └──────────────┘          │          │
│  └──────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────┘
```

### Key Components

1. **AWS Load Balancer Controller**: Manages NLB lifecycle through Kubernetes Service resources
2. **Network Load Balancer**: Layer 4 load balancer with ultra-low latency and static IP support
3. **Target Groups**: Route traffic to EC2 instances or pod IPs
4. **TLS Termination**: Decrypt TLS traffic at the NLB using ACM certificates
5. **Elastic IPs**: Static IP addresses for NLB endpoints
6. **ExternalDNS**: Automatic DNS record management in Route53
7. **Health Checks**: TCP or HTTP health checks for target monitoring

## Prerequisites

### Required Components

1. **Amazon EKS Cluster** (v1.21+)
   ```bash
   eksctl create cluster --name=eksdemo1 \
     --region=us-east-1 \
     --zones=us-east-1a,us-east-1b \
     --without-nodegroup
   ```

2. **AWS Load Balancer Controller** installed
   ```bash
   # Install AWS Load Balancer Controller
   # See ALB-Application-LoadBalancers/Load-Balancer-Controller-Install/

   # Verify installation
   kubectl get deployment -n kube-system aws-load-balancer-controller
   ```

3. **kubectl** configured
   ```bash
   aws eks update-kubeconfig --name eksdemo1 --region us-east-1
   ```

4. **IAM Permissions**
   - Create/Delete/Modify Network Load Balancers
   - Manage Target Groups
   - Allocate/Associate Elastic IPs
   - Modify Security Groups
   - EC2 and EKS resource access

5. **For Fargate Examples**
   - Fargate profile created
   - Namespace configured for Fargate
   ```bash
   eksctl create fargateprofile \
     --cluster eksdemo1 \
     --name fp-app3 \
     --namespace fp-app3
   ```

6. **For TLS Examples**
   - ACM certificate created and validated
   - Certificate ARN available

7. **For Elastic IP Examples**
   - Elastic IPs allocated (one per availability zone)
   ```bash
   aws ec2 allocate-address --domain vpc --region us-east-1
   ```

8. **For ExternalDNS Examples**
   - Route53 hosted zone
   - ExternalDNS deployed with proper IAM permissions

### Network Requirements

- VPC with public and/or private subnets
- Subnets tagged for automatic discovery:
  - Public: `kubernetes.io/role/elb=1`
  - Private: `kubernetes.io/role/internal-elb=1`
- Security groups allowing NLB traffic

## Project Structure

```
ELB-Network-LoadBalancers-with-LBC/
├── README.md
│
├── LBC-NLB-Basic/                              # Basic NLB with instance targets
│   └── kube-manifests/
│       ├── 01-Nginx-App3-Deployment.yml
│       └── 02-LBC-NLB-LoadBalancer-Service.yml
│
├── LBC-NLB-Internal/                           # Internal NLB for private workloads
│   ├── kube-manifests/
│   │   ├── 01-Nginx-App3-Deployment.yml
│   │   └── 02-LBC-NLB-LoadBalancer-Service.yml
│   └── kube-manifests-curl/                    # Test pod for internal access
│       └── 01-curl-pod.yml
│
├── LBC-NLB-TLS/                                # TLS termination at NLB
│   └── kube-manifests/
│       ├── 01-Nginx-App3-Deployment.yml
│       └── 02-LBC-NLB-LoadBalancer-Service.yml # Multiple ports (80,443,81,82)
│
├── LBC-NLB-ElasticIP/                          # NLB with static Elastic IPs
│   └── kube-manifests/
│       ├── 01-Nginx-App3-Deployment.yml
│       └── 02-LBC-NLB-LoadBalancer-Service.yml
│
├── LBC-NLB-ExternalDNS/                        # NLB with automatic DNS records
│   └── kube-manifests/
│       ├── 01-Nginx-App3-Deployment.yml
│       └── 02-LBC-NLB-LoadBalancer-Service.yml
│
└── LBC-NLB-Fargate-External/                   # NLB with Fargate pods (IP mode)
    ├── fargate-profile/
    │   └── 01-fargate-profiles.yml
    └── kube-manifests/
        ├── 00-namespace.yml
        ├── 01-Nginx-App3-Deployment.yml
        └── 02-LBC-NLB-LoadBalancer-Service.yml
```

## Usage

### 1. Basic NLB with Instance Target Type

Deploy a simple internet-facing NLB with instance targets:

```bash
# Deploy application
kubectl apply -f LBC-NLB-Basic/kube-manifests/01-Nginx-App3-Deployment.yml

# Deploy NLB service
kubectl apply -f LBC-NLB-Basic/kube-manifests/02-LBC-NLB-LoadBalancer-Service.yml

# Verify NLB creation
kubectl get svc basics-lbc-network-lb

# Get NLB DNS name
kubectl get svc basics-lbc-network-lb -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Test the NLB
NLB_DNS=$(kubectl get svc basics-lbc-network-lb -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
curl http://$NLB_DNS

# Check NLB details in AWS
aws elbv2 describe-load-balancers --names basics-lbc-network-lb

# Check target group health
aws elbv2 describe-target-groups --load-balancer-arn <nlb-arn>
```

**Key Service Configuration**:
```yaml
metadata:
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: external
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: instance
    service.beta.kubernetes.io/aws-load-balancer-scheme: internet-facing
spec:
  type: LoadBalancer
```

### 2. Internal NLB

Create an internal NLB for private workloads (accessible only within VPC):

```bash
# Deploy application
kubectl apply -f LBC-NLB-Internal/kube-manifests/01-Nginx-App3-Deployment.yml

# Deploy internal NLB service
kubectl apply -f LBC-NLB-Internal/kube-manifests/02-LBC-NLB-LoadBalancer-Service.yml

# Deploy test curl pod
kubectl apply -f LBC-NLB-Internal/kube-manifests-curl/01-curl-pod.yml

# Get internal NLB DNS
kubectl get svc lbc-network-lb-internal

# Test from within cluster
kubectl exec -it curl-pod -- curl http://<internal-nlb-dns>

# Or from EC2 instance in same VPC
# ssh to EC2 instance
curl http://<internal-nlb-dns>
```

**Key Configuration**:
```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-scheme: "internal"
```

### 3. NLB with TLS Termination

Terminate TLS at the NLB using ACM certificates:

```bash
# Update certificate ARN in manifest
# Edit: LBC-NLB-TLS/kube-manifests/02-LBC-NLB-LoadBalancer-Service.yml
# Set your ACM certificate ARN

# Deploy application
kubectl apply -f LBC-NLB-TLS/kube-manifests/01-Nginx-App3-Deployment.yml

# Deploy NLB with TLS
kubectl apply -f LBC-NLB-TLS/kube-manifests/02-LBC-NLB-LoadBalancer-Service.yml

# Get NLB DNS
kubectl get svc tls-lbc-network-lb

# Test HTTP (port 80)
curl http://<nlb-dns>

# Test HTTPS (port 443)
curl https://<nlb-dns>

# Test custom ports
curl http://<nlb-dns>:81
curl http://<nlb-dns>:82
```

**Key TLS Configuration**:
```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-ssl-cert: arn:aws:acm:...
  service.beta.kubernetes.io/aws-load-balancer-ssl-ports: "443"
  service.beta.kubernetes.io/aws-load-balancer-ssl-negotiation-policy: ELBSecurityPolicy-TLS13-1-2-2021-06
  service.beta.kubernetes.io/aws-load-balancer-backend-protocol: tcp

spec:
  ports:
  - name: http
    port: 80
    targetPort: 80
  - name: https
    port: 443        # TLS termination here
    targetPort: 80   # Backend is HTTP
  - name: http81
    port: 81
    targetPort: 80
  - name: http82
    port: 82
    targetPort: 80
```

**Important Notes**:
- Each listener creates a separate target group
- HTTPS listener (443) terminates TLS, forwards HTTP to pods
- Backend protocol is TCP (pods receive unencrypted traffic)

### 4. NLB with Elastic IPs (Static IP Addresses)

Assign static Elastic IPs to your NLB:

```bash
# Allocate Elastic IPs (one per AZ)
EIP1=$(aws ec2 allocate-address --domain vpc --region us-east-1 --query 'AllocationId' --output text)
EIP2=$(aws ec2 allocate-address --domain vpc --region us-east-1 --query 'AllocationId' --output text)

echo "EIP1: $EIP1"
echo "EIP2: $EIP2"

# Update manifest with EIP allocation IDs
# Edit: LBC-NLB-ElasticIP/kube-manifests/02-LBC-NLB-LoadBalancer-Service.yml
# Set: service.beta.kubernetes.io/aws-load-balancer-eip-allocations: eipalloc-xxx, eipalloc-yyy

# Deploy application
kubectl apply -f LBC-NLB-ElasticIP/kube-manifests/01-Nginx-App3-Deployment.yml

# Deploy NLB with EIPs
kubectl apply -f LBC-NLB-ElasticIP/kube-manifests/02-LBC-NLB-LoadBalancer-Service.yml

# Verify EIPs are associated
aws ec2 describe-addresses --allocation-ids $EIP1 $EIP2

# Get public IPs
aws ec2 describe-addresses --allocation-ids $EIP1 --query 'Addresses[0].PublicIp' --output text
aws ec2 describe-addresses --allocation-ids $EIP2 --query 'Addresses[0].PublicIp' --output text

# Test via static IP
curl http://<static-ip>
```

**Key EIP Configuration**:
```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-eip-allocations: eipalloc-xxx, eipalloc-yyy
```

**Benefits**:
- Static IP addresses that don't change
- Simplified firewall rules
- Easy IP whitelisting
- Consistent DNS records

### 5. NLB with ExternalDNS Integration

Automatically create Route53 DNS records:

```bash
# Ensure ExternalDNS is deployed
kubectl get deployment external-dns

# Update hostname in manifest
# Edit: LBC-NLB-ExternalDNS/kube-manifests/02-LBC-NLB-LoadBalancer-Service.yml
# Set: external-dns.alpha.kubernetes.io/hostname: myapp.example.com

# Deploy application
kubectl apply -f LBC-NLB-ExternalDNS/kube-manifests/01-Nginx-App3-Deployment.yml

# Deploy NLB with ExternalDNS annotation
kubectl apply -f LBC-NLB-ExternalDNS/kube-manifests/02-LBC-NLB-LoadBalancer-Service.yml

# Check ExternalDNS logs
kubectl logs deployment/external-dns

# Verify Route53 record created
aws route53 list-resource-record-sets --hosted-zone-id <zone-id> \
  | grep myapp.example.com

# Test via custom domain
curl http://myapp.example.com
```

**Key ExternalDNS Configuration**:
```yaml
annotations:
  external-dns.alpha.kubernetes.io/hostname: myapp.example.com
```

### 6. NLB with AWS Fargate (IP Target Type)

Deploy NLB with Fargate pods (requires IP target mode):

```bash
# Create Fargate profile
eksctl create fargateprofile \
  --cluster eksdemo1 \
  --name fp-app3 \
  --namespace fp-app3

# Or apply existing profile
kubectl apply -f LBC-NLB-Fargate-External/fargate-profile/01-fargate-profiles.yml

# Create namespace
kubectl apply -f LBC-NLB-Fargate-External/kube-manifests/00-namespace.yml

# Deploy application (will run on Fargate)
kubectl apply -f LBC-NLB-Fargate-External/kube-manifests/01-Nginx-App3-Deployment.yml

# Deploy NLB with IP target type
kubectl apply -f LBC-NLB-Fargate-External/kube-manifests/02-LBC-NLB-LoadBalancer-Service.yml

# Verify pods are on Fargate
kubectl get pods -n fp-app3 -o wide

# Get NLB DNS
kubectl get svc -n fp-app3

# Test NLB
curl http://<nlb-dns>
```

**Key Fargate Configuration**:
```yaml
annotations:
  # Must use IP target type for Fargate
  service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip
```

**Important for Fargate**:
- **Must use IP target type** (Fargate doesn't support instance mode)
- Pods get dedicated ENI with IP address
- NLB routes directly to pod IPs
- No NodePort overhead

## Configuration

### Core NLB Service Annotations

#### Basic Configuration

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-nlb-service
  annotations:
    # Required: Specify external load balancer type
    service.beta.kubernetes.io/aws-load-balancer-type: external

    # Load balancer name
    service.beta.kubernetes.io/aws-load-balancer-name: my-nlb

    # Target type: instance (default) or ip
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: instance

    # Scheme: internet-facing or internal
    service.beta.kubernetes.io/aws-load-balancer-scheme: internet-facing

spec:
  type: LoadBalancer  # Required
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080
```

#### Health Check Configuration

```yaml
annotations:
  # Health check protocol: http or tcp
  service.beta.kubernetes.io/aws-load-balancer-healthcheck-protocol: http

  # Health check port
  service.beta.kubernetes.io/aws-load-balancer-healthcheck-port: traffic-port
  # Or specific port: "8080"

  # Health check path (HTTP only)
  service.beta.kubernetes.io/aws-load-balancer-healthcheck-path: /health

  # Healthy threshold (2-10)
  service.beta.kubernetes.io/aws-load-balancer-healthcheck-healthy-threshold: "3"

  # Unhealthy threshold (2-10)
  service.beta.kubernetes.io/aws-load-balancer-healthcheck-unhealthy-threshold: "3"

  # Health check interval (10 or 30 seconds)
  service.beta.kubernetes.io/aws-load-balancer-healthcheck-interval: "10"

  # Note: Timeout is fixed (10s for TCP, 6s for HTTP)
```

#### TLS Configuration

```yaml
annotations:
  # ACM certificate ARN
  service.beta.kubernetes.io/aws-load-balancer-ssl-cert: arn:aws:acm:region:account:certificate/xxx

  # Ports that should use TLS
  service.beta.kubernetes.io/aws-load-balancer-ssl-ports: "443,8443"

  # SSL negotiation policy
  service.beta.kubernetes.io/aws-load-balancer-ssl-negotiation-policy: ELBSecurityPolicy-TLS13-1-2-2021-06

  # Backend protocol (tcp or tls)
  service.beta.kubernetes.io/aws-load-balancer-backend-protocol: tcp

spec:
  ports:
  - name: https
    port: 443        # TLS listener
    targetPort: 80   # Backend HTTP
```

**Available SSL Policies**:
- `ELBSecurityPolicy-TLS13-1-2-2021-06` (Recommended - TLS 1.3 and 1.2)
- `ELBSecurityPolicy-TLS-1-2-2017-01` (TLS 1.2 only)
- `ELBSecurityPolicy-TLS-1-2-Ext-2018-06` (Extended TLS 1.2)
- `ELBSecurityPolicy-2016-08` (Legacy - includes TLS 1.0/1.1)

#### Elastic IP Configuration

```yaml
annotations:
  # Elastic IP allocation IDs (one per AZ)
  service.beta.kubernetes.io/aws-load-balancer-eip-allocations: eipalloc-xxx,eipalloc-yyy
```

**Requirements**:
- EIPs must be in same region as cluster
- One EIP per availability zone
- EIPs must be unassociated
- Must be internet-facing NLB

#### Network Configuration

```yaml
annotations:
  # Subnet selection
  service.beta.kubernetes.io/aws-load-balancer-subnets: subnet-xxx,subnet-yyy

  # Private IPv4 addresses
  service.beta.kubernetes.io/aws-load-balancer-private-ipv4-addresses: 10.0.1.15,10.0.2.15

  # IP address type
  service.beta.kubernetes.io/aws-load-balancer-ip-address-type: ipv4
  # Options: ipv4, dualstack
```

#### Access Control

```yaml
annotations:
  # Source IP ranges (CIDR blocks)
  service.beta.kubernetes.io/load-balancer-source-ranges: 0.0.0.0/0
  # Or restrict: 10.0.0.0/8,172.16.0.0/12

  # Note: For internal NLB, VPC CIDR is used by default
```

#### Advanced Configuration

```yaml
annotations:
  # Cross-zone load balancing (enabled by default for NLB)
  service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"

  # Resource tags
  service.beta.kubernetes.io/aws-load-balancer-additional-resource-tags: Environment=prod,Team=platform

  # Target group attributes
  service.beta.kubernetes.io/aws-load-balancer-target-group-attributes: deregistration_delay.timeout_seconds=30,preserve_client_ip.enabled=true

  # Proxy protocol v2
  service.beta.kubernetes.io/aws-load-balancer-proxy-protocol: "*"

  # Connection settings
  service.beta.kubernetes.io/aws-load-balancer-target-group-attributes: deregistration_delay.connection_termination.enabled=true
```

#### ExternalDNS Integration

```yaml
annotations:
  # Hostname for DNS record
  external-dns.alpha.kubernetes.io/hostname: myapp.example.com

  # TTL for DNS record
  external-dns.alpha.kubernetes.io/ttl: "300"
```

### Complete Production Example

```yaml
apiVersion: v1
kind: Service
metadata:
  name: production-nlb
  annotations:
    # Load Balancer Configuration
    service.beta.kubernetes.io/aws-load-balancer-name: production-api-nlb
    service.beta.kubernetes.io/aws-load-balancer-type: external
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip
    service.beta.kubernetes.io/aws-load-balancer-scheme: internet-facing

    # Health Checks
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-protocol: http
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-port: traffic-port
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-path: /health
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-healthy-threshold: "3"
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-unhealthy-threshold: "3"
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-interval: "10"

    # TLS Configuration
    service.beta.kubernetes.io/aws-load-balancer-ssl-cert: arn:aws:acm:us-east-1:123456789:certificate/xxx
    service.beta.kubernetes.io/aws-load-balancer-ssl-ports: "443"
    service.beta.kubernetes.io/aws-load-balancer-ssl-negotiation-policy: ELBSecurityPolicy-TLS13-1-2-2021-06
    service.beta.kubernetes.io/aws-load-balancer-backend-protocol: tcp

    # Access Control
    service.beta.kubernetes.io/load-balancer-source-ranges: 0.0.0.0/0

    # Tags
    service.beta.kubernetes.io/aws-load-balancer-additional-resource-tags: Environment=production,Application=api,ManagedBy=kubernetes

    # DNS
    external-dns.alpha.kubernetes.io/hostname: api.example.com

    # Target Group Settings
    service.beta.kubernetes.io/aws-load-balancer-target-group-attributes: deregistration_delay.timeout_seconds=30,preserve_client_ip.enabled=true

spec:
  type: LoadBalancer
  selector:
    app: production-api
  ports:
  - name: http
    port: 80
    targetPort: 8080
    protocol: TCP
  - name: https
    port: 443
    targetPort: 8080
    protocol: TCP
```

## Features

### 1. Target Type Modes

#### Instance Mode (Default)
```yaml
service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: instance
```
- Traffic: NLB → EC2 Instance:NodePort → kube-proxy → Pod
- Use with: EC2 node groups
- Service Type: Any (but typically LoadBalancer)
- Preserves source IP: Partial (requires proxy protocol)

#### IP Mode
```yaml
service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip
```
- Traffic: NLB → Pod IP directly
- Use with: Fargate, EC2 for better performance
- Service Type: Must use ClusterIP or LoadBalancer (not NodePort)
- Preserves source IP: Yes (natively)
- **Required for AWS Fargate**

### 2. TLS Termination

- **Frontend TLS**: NLB terminates TLS using ACM certificates
- **Backend Protocol**: TCP (unencrypted to pods) or TLS (encrypted end-to-end)
- **Multiple Certificates**: Not supported (use one certificate per NLB)
- **SNI**: Not supported on NLB (use ALB for SNI)

**TLS Listener Flow**:
```
Client --[TLS]--> NLB --[TCP]--> Pod
       (encrypted)     (unencrypted)
```

### 3. Static IP Addresses (Elastic IPs)

- One EIP per availability zone
- Static IP addresses that never change
- Perfect for IP whitelisting scenarios
- Only available for internet-facing NLBs

### 4. Internal vs External Load Balancers

| Feature | Internet-Facing | Internal |
|---------|----------------|----------|
| Scheme | `internet-facing` | `internal` |
| Subnets | Public subnets | Private subnets |
| IP Type | Public IPs | Private IPs only |
| Access | From Internet | Within VPC only |
| Elastic IP | Supported | Not supported |

### 5. Multiple Listeners and Target Groups

Each port in the Service spec creates:
- One listener on the NLB
- One target group
- 1:1 mapping (listener : target group)

```yaml
spec:
  ports:
  - port: 80    # → Listener 80 → Target Group 80
  - port: 443   # → Listener 443 → Target Group 443 (same backend port)
  - port: 8080  # → Listener 8080 → Target Group 8080
```

### 6. Health Check Options

- **Protocol**: HTTP or TCP
  - HTTP: More intelligent (checks HTTP response code)
  - TCP: Faster (just checks connection)
- **Interval**: 10 or 30 seconds only
- **Timeout**: Fixed (10s for TCP, 6s for HTTP)
- **Thresholds**: 2-10 checks to mark healthy/unhealthy

### 7. Cross-Zone Load Balancing

- **Enabled by default** for NLB (no annotation needed)
- Distributes traffic evenly across all zones
- Prevents hot spots
- Can be disabled if needed (not recommended)

## Troubleshooting

### NLB Not Created

**Symptoms**: Service stays in pending state, no NLB in AWS console

```bash
# Check service status
kubectl describe svc <service-name>

# Look for events
kubectl get events --sort-by='.lastTimestamp'

# Check AWS LBC logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

**Common Issues**:

1. **Missing annotation** `service.beta.kubernetes.io/aws-load-balancer-type: external`
   ```yaml
   # Required for LBC to manage NLB
   annotations:
     service.beta.kubernetes.io/aws-load-balancer-type: external
   ```

2. **Service type not LoadBalancer**
   ```yaml
   spec:
     type: LoadBalancer  # Required
   ```

3. **IAM permissions insufficient**
   - Check LBC has permissions to create NLB
   - Review IAM role attached to service account

### Unhealthy Targets

**Symptoms**: NLB created but targets show unhealthy

```bash
# Check target group health
aws elbv2 describe-target-health --target-group-arn <arn>

# Check service endpoints
kubectl get endpoints <service-name>

# Check pod status
kubectl get pods -l app=<app-label>
```

**Solutions**:

1. **Health check path incorrect**
   ```yaml
   # Ensure path exists and returns 200
   annotations:
     service.beta.kubernetes.io/aws-load-balancer-healthcheck-path: /health
   ```

   Test from within pod:
   ```bash
   kubectl exec -it <pod-name> -- curl localhost:8080/health
   ```

2. **Security group blocking health checks**
   - NLB health checks come from NLB node IPs
   - Ensure pod security groups allow traffic

3. **Pod not ready**
   ```bash
   kubectl describe pod <pod-name>
   # Check readiness probe
   ```

### TLS Issues

**Symptoms**: TLS not working, certificate errors

**Solutions**:

1. **Wrong certificate ARN**
   ```bash
   # List certificates
   aws acm list-certificates --region us-east-1

   # Verify certificate is valid
   aws acm describe-certificate --certificate-arn <arn>
   ```

2. **Certificate in wrong region**
   - Certificate must be in same region as NLB
   - Create/import certificate in correct region

3. **Wrong ports configured**
   ```yaml
   # TLS ports must match listener ports
   annotations:
     service.beta.kubernetes.io/aws-load-balancer-ssl-ports: "443"
   spec:
     ports:
     - port: 443  # Must match annotation
   ```

### Elastic IP Issues

**Symptoms**: EIPs not associated with NLB

**Solutions**:

1. **EIPs already in use**
   ```bash
   # Check EIP status
   aws ec2 describe-addresses --allocation-ids eipalloc-xxx

   # Release if associated elsewhere
   aws ec2 disassociate-address --association-id <assoc-id>
   ```

2. **Wrong number of EIPs**
   - Must provide one EIP per availability zone
   - If cluster spans 3 AZs, need 3 EIPs

3. **EIPs in wrong region**
   ```bash
   # Allocate in correct region
   aws ec2 allocate-address --domain vpc --region us-east-1
   ```

### Fargate Specific Issues

**Symptoms**: NLB not working with Fargate pods

**Solutions**:

1. **Not using IP target type**
   ```yaml
   # REQUIRED for Fargate
   annotations:
     service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip
   ```

2. **Fargate profile not configured**
   ```bash
   # Check Fargate profiles
   eksctl get fargateprofile --cluster eksdemo1

   # Verify namespace matches profile
   kubectl get pods -n <namespace> -o wide
   ```

3. **Service type mismatch**
   - Use LoadBalancer or ClusterIP (not NodePort)

### ExternalDNS Not Creating Records

```bash
# Check ExternalDNS logs
kubectl logs deployment/external-dns

# Common issues:
# 1. Annotation typo
kubectl get svc <svc-name> -o yaml | grep external-dns

# 2. IAM permissions missing
kubectl describe sa external-dns

# 3. Hosted zone doesn't exist
aws route53 list-hosted-zones

# 4. Domain doesn't match hosted zone
# Ensure hostname matches a hosted zone domain
```

### Connection Timeouts

**Symptoms**: Connections hang or timeout

**Solutions**:

1. **Check security groups**
   ```bash
   # Verify NLB security groups allow traffic
   aws elbv2 describe-load-balancers --names <nlb-name>

   # Check target security groups
   kubectl get pods -o wide
   ```

2. **Verify network ACLs**
   - Check VPC network ACLs aren't blocking

3. **Check target deregistration delay**
   ```yaml
   # Reduce if pods are terminating
   annotations:
     service.beta.kubernetes.io/aws-load-balancer-target-group-attributes: deregistration_delay.timeout_seconds=30
   ```

## Best Practices

### 1. Use IP Target Type for Better Performance

```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip
```

**Benefits**:
- Direct pod routing (bypasses NodePort)
- Preserves client source IP
- Required for Fargate
- Better for high-throughput applications

**Use ClusterIP service** (not NodePort) with IP target type.

### 2. Implement Proper Health Checks

```yaml
annotations:
  # Use HTTP for intelligent health checks
  service.beta.kubernetes.io/aws-load-balancer-healthcheck-protocol: http
  service.beta.kubernetes.io/aws-load-balancer-healthcheck-path: /health

  # Tune thresholds for your application
  service.beta.kubernetes.io/aws-load-balancer-healthcheck-healthy-threshold: "3"
  service.beta.kubernetes.io/aws-load-balancer-healthcheck-interval: "10"
```

**Health Check Best Practices**:
- Create dedicated `/health` endpoint
- Return 200 OK only when truly healthy
- Include dependency checks (database, cache, etc.)
- Keep health checks lightweight

### 3. Use TLS Termination for HTTPS Traffic

```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-ssl-cert: arn:aws:acm:...
  service.beta.kubernetes.io/aws-load-balancer-ssl-ports: "443"
  service.beta.kubernetes.io/aws-load-balancer-ssl-negotiation-policy: ELBSecurityPolicy-TLS13-1-2-2021-06
```

**Benefits**:
- Offload TLS processing from pods
- Centralized certificate management via ACM
- Support modern TLS versions
- Automatic certificate renewal

### 4. Use Elastic IPs for Static Addressing

```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-eip-allocations: eipalloc-xxx,eipalloc-yyy
```

**When to Use**:
- IP whitelisting requirements
- DNS records pointing to IPs
- Third-party integrations requiring static IPs
- Compliance requirements

### 5. Tag Resources for Cost Tracking

```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-additional-resource-tags: Environment=production,Team=platform,CostCenter=engineering,Application=api
```

Use tags to:
- Track costs by team/application
- Implement automated governance
- Generate cost reports

### 6. Optimize Deregistration Delay

```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-target-group-attributes: deregistration_delay.timeout_seconds=30
```

**Default**: 300 seconds (5 minutes)
**Recommended**: 30-60 seconds for most applications

**Benefits**:
- Faster pod replacements during deployments
- Reduced connection draining time
- Better rolling update performance

### 7. Use Internal NLB for Private Services

```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-scheme: "internal"
```

**Use Cases**:
- Database access from applications
- Internal microservices
- Admin interfaces
- Private APIs

**Benefits**:
- Better security (no internet exposure)
- Lower latency (VPC routing)
- Reduced data transfer costs

### 8. Preserve Client IP

```yaml
# For IP target type (automatic)
annotations:
  service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip

# For instance target type (requires proxy protocol)
annotations:
  service.beta.kubernetes.io/aws-load-balancer-proxy-protocol: "*"
```

**Why It Matters**:
- Accurate access logs
- Geo-location services
- Security policies based on IP
- Rate limiting

### 9. Enable Connection Termination on Deregistration

```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-target-group-attributes: deregistration_delay.connection_termination.enabled=true
```

**Benefits**:
- Terminate connections immediately when pod is terminating
- Prevent new requests to terminating pods
- Faster deployments

### 10. Use ExternalDNS for Automatic DNS

```yaml
annotations:
  external-dns.alpha.kubernetes.io/hostname: api.example.com
```

**Benefits**:
- Automatic DNS record creation
- Automatic cleanup on deletion
- Consistent DNS management
- Reduced manual errors

### 11. Monitor NLB Metrics

Key CloudWatch metrics to monitor:
- **ActiveFlowCount**: Number of concurrent flows
- **NewFlowCount**: New flows per minute
- **ProcessedBytes**: Data processed
- **HealthyHostCount**: Healthy targets
- **UnHealthyHostCount**: Unhealthy targets
- **TCP_Client_Reset_Count**: Client resets
- **TCP_Target_Reset_Count**: Target resets

Set up CloudWatch alarms for unhealthy hosts.

### 12. Security Hardening

```yaml
annotations:
  # Restrict source IPs
  service.beta.kubernetes.io/load-balancer-source-ranges: 10.0.0.0/8,172.16.0.0/12

  # Use latest TLS policy
  service.beta.kubernetes.io/aws-load-balancer-ssl-negotiation-policy: ELBSecurityPolicy-TLS13-1-2-2021-06

  # Internal for private workloads
  service.beta.kubernetes.io/aws-load-balancer-scheme: "internal"
```

### Troubleshooting Tools

```bash
# Check NLB status
aws elbv2 describe-load-balancers --names <nlb-name>

# Check target health
aws elbv2 describe-target-health --target-group-arn <arn>

# List listeners
aws elbv2 describe-listeners --load-balancer-arn <arn>

# List target groups
aws elbv2 describe-target-groups --load-balancer-arn <arn>

# Check AWS LBC logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller -f

# Test connectivity
telnet <nlb-dns> 80
curl -v http://<nlb-dns>
```

---

## Quick Reference

### Common kubectl Commands

```bash
# List LoadBalancer services
kubectl get svc -o wide

# Describe service
kubectl describe svc <service-name>

# Get NLB DNS name
kubectl get svc <service-name> -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Check endpoints
kubectl get endpoints <service-name>

# Check AWS LBC logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Delete service (deletes NLB)
kubectl delete svc <service-name>
```

### Common AWS CLI Commands

```bash
# List NLBs
aws elbv2 describe-load-balancers --query 'LoadBalancers[?Type==`network`]'

# Get NLB details
aws elbv2 describe-load-balancers --names <nlb-name>

# Check target health
aws elbv2 describe-target-health --target-group-arn <arn>

# List Elastic IPs
aws ec2 describe-addresses

# Allocate new EIP
aws ec2 allocate-address --domain vpc --region us-east-1
```

---

