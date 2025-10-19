# EKS NLB Internal Load Balancer

## Overview

This project demonstrates how to configure an **internal** AWS Network Load Balancer (NLB) for Kubernetes services on Amazon EKS. Internal NLBs are deployed in private subnets and are only accessible from within your VPC or connected networks (via VPN, Direct Connect, or VPC peering). This is essential for internal microservices, databases, and backend applications that should not be exposed to the internet.

Internal NLBs are ideal for:
- **Private microservices**: Backend services not exposed to internet
- **Database connections**: PostgreSQL, MySQL, MongoDB, etc.
- **Internal APIs**: Services accessed only within VPC
- **Cross-VPC communication**: Via VPC peering or Transit Gateway
- **Hybrid cloud**: On-premises to AWS connectivity via VPN/Direct Connect
- **PrivateLink services**: Creating VPC endpoint services

## Architecture

```
VPC (10.0.0.0/16)
  |
  +-- Private Subnet 1 (10.0.1.0/24)
  |       |
  |       +-- Internal NLB
  |
  +-- Private Subnet 2 (10.0.2.0/24)
  |       |
  |       +-- Internal NLB
  |
  +-- Private Subnet 3 (10.0.3.0/24)
          |
          +-- EKS Worker Nodes
          |   |
          |   +-- app3-nginx Pods
          |
          +-- Bastion Host (for testing)
```

### Access Pattern

```
On-Premises Network (via VPN/Direct Connect)
                |
                v
         VPC Peered Network
                |
                v
        Internal NLB (Private)
                |
                v
         EKS Worker Nodes
                |
                v
         Application Pods
```

### Internal vs Internet-Facing NLB

| Aspect | Internal NLB | Internet-Facing NLB |
|--------|-------------|---------------------|
| **Subnet Type** | Private subnets | Public subnets |
| **IP Addresses** | Private IPs only | Public IPs |
| **Internet Access** | No | Yes |
| **Access From** | VPC, peered VPCs, VPN/DX | Internet |
| **Security** | Higher (not internet exposed) | Requires careful security groups |
| **Use Case** | Internal services | Public-facing services |

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.0
- kubectl configured to interact with your EKS cluster
- AWS Load Balancer Controller installed
- VPC with private subnets properly tagged
- Bastion host or VPN connection to test internal connectivity
- Understanding of VPC networking and routing

## Project Structure

```
EKS-NLB-InternalLB/
├── ekscluster-terraform-manifests/          # EKS cluster infrastructure
│   ├── c1-versions.tf                        # Provider versions
│   ├── c3-01-vpc-variables.tf               # VPC configuration
│   ├── c5-06-eks-cluster.tf                 # EKS cluster definition
│   └── ...
├── lbc-install-terraform-manifests/         # AWS Load Balancer Controller
│   ├── c1-versions.tf
│   ├── c4-03-lbc-install.tf                 # LBC Helm installation
│   └── ...
├── externaldns-install-terraform-manifests/ # ExternalDNS setup (optional)
│   ├── c4-03-externaldns-install.tf
│   └── ...
├── nlb-tls-extdns-terraform-manifests/      # Terraform-managed NLB resources
│   └── ...
├── kube-manifests-nlb-tls-externaldns/      # Kubernetes manifests for internal NLB
│   ├── 01-Nginx-App3-Deployment.yml
│   └── 02-LBC-NLB-LoadBalancer-Service.yml
└── kube-manifests-curl/                     # Test pod for internal access
    └── curl-pod.yml
```

## Usage

### Step 1: Deploy EKS Cluster

Ensure your VPC has properly tagged private subnets:

```bash
# Private subnets must have this tag for internal NLB
aws ec2 create-tags \
  --resources subnet-xxx subnet-yyy subnet-zzz \
  --tags Key=kubernetes.io/role/internal-elb,Value=1
```

Deploy the cluster:
```bash
cd ekscluster-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

### Step 2: Install AWS Load Balancer Controller

```bash
cd ../lbc-install-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

Verify installation:
```bash
kubectl get deployment -n kube-system aws-load-balancer-controller
```

### Step 3: Install ExternalDNS (Optional)

For internal DNS records in Route53 private hosted zone:

```bash
cd ../externaldns-install-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

### Step 4: Deploy Application with Internal NLB

You can deploy using either Terraform or kubectl:

#### Option A: Using kubectl

```bash
cd ../kube-manifests-nlb-tls-externaldns

# Deploy the application
kubectl apply -f 01-Nginx-App3-Deployment.yml

# Deploy internal NLB service
kubectl apply -f 02-LBC-NLB-LoadBalancer-Service.yml
```

#### Option B: Using Terraform

```bash
cd ../nlb-tls-extdns-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

### Step 5: Verify Deployment

```bash
# Check deployment
kubectl get deployment app3-nginx-deployment

# Check pods
kubectl get pods -l app=app3-nginx

# Check service (note the internal DNS name)
kubectl get service lbc-network-lb-internal

# Get NLB DNS name
NLB_DNS=$(kubectl get service lbc-network-lb-internal -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "Internal NLB DNS: $NLB_DNS"
```

### Step 6: Verify NLB in AWS Console

1. Navigate to EC2 Console → Load Balancers
2. Find your NLB (name: `lbc-network-lb-internal`)
3. Verify:
   - **Type**: network
   - **Scheme**: internal
   - **Availability Zones**: Subnets are private
   - **DNS name**: Contains `internal` prefix
   - **Target groups**: Registered and healthy

### Step 7: Test Internal Access

Since the NLB is internal, you need to test from within the VPC:

#### Option A: Using a Test Pod

```bash
cd ../kube-manifests-curl

# Deploy test pod
kubectl run test-curl --image=curlimages/curl:7.85.0 --rm -it -- sh

# Inside the pod, test access
curl http://<NLB-INTERNAL-DNS>/
```

#### Option B: Using Bastion Host

```bash
# SSH to bastion host in the VPC
ssh -i your-key.pem ec2-user@<bastion-public-ip>

# Test NLB access
curl http://<NLB-INTERNAL-DNS>/
```

#### Option C: Port Forward (for development)

```bash
# Port forward through kubectl (not recommended for production)
kubectl port-forward service/lbc-network-lb-internal 8080:80

# In another terminal
curl http://localhost:8080/
```

### Step 8: Monitor Target Health

```bash
# Check target group health in AWS CLI
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>
```

## Configuration

### Internal NLB Service Configuration

**File**: `kube-manifests-nlb-tls-externaldns/02-LBC-NLB-LoadBalancer-Service.yml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: lbc-network-lb-internal
  annotations:
    # Traffic Routing
    service.beta.kubernetes.io/aws-load-balancer-name: lbc-network-lb-internal
    service.beta.kubernetes.io/aws-load-balancer-type: external
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: instance

    # Health Check Settings
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-protocol: http
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-port: traffic-port
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-path: /index.html
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-healthy-threshold: "3"
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-unhealthy-threshold: "3"
    service.beta.kubernetes.io/aws-load-balancer-healthcheck-interval: "10"

    # Access Control - INTERNAL SCHEME
    service.beta.kubernetes.io/aws-load-balancer-scheme: "internal"

    # AWS Resource Tags
    service.beta.kubernetes.io/aws-load-balancer-additional-resource-tags: Environment=dev,Team=test

spec:
  type: LoadBalancer
  selector:
    app: app3-nginx
  ports:
  - port: 80
    targetPort: 80
```

### Key Configuration Differences

The critical annotation that makes the NLB internal:

```yaml
service.beta.kubernetes.io/aws-load-balancer-scheme: "internal"
```

This single annotation changes:
1. **Subnet selection**: Uses private subnets (tagged with `kubernetes.io/role/internal-elb`)
2. **IP addressing**: Assigns only private IPs
3. **Accessibility**: Only reachable from within VPC or connected networks

### Source IP Ranges

For internal NLBs, the source ranges annotation behaves differently:

```yaml
# For internet-facing NLBs
service.beta.kubernetes.io/load-balancer-source-ranges: 0.0.0.0/0

# For internal NLBs (commented out in manifest)
# The VPC CIDR will be used automatically if service scheme is internal
# service.beta.kubernetes.io/load-balancer-source-ranges: 0.0.0.0/0
```

When scheme is `internal`, AWS automatically restricts access to the VPC CIDR range.

### Deployment Configuration

**File**: `kube-manifests-nlb-tls-externaldns/01-Nginx-App3-Deployment.yml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app3-nginx-deployment
  labels:
    app: app3-nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: app3-nginx
  template:
    metadata:
      labels:
        app: app3-nginx
    spec:
      containers:
      - name: app3-nginx
        image: stacksimplify/kube-nginxapp1:1.0.0
        ports:
        - containerPort: 80
```

## Features

### 1. Internal-Only Access

**VPC Isolation**:
- Not accessible from internet
- Only reachable from VPC resources
- Ideal for backend services

**Multi-VPC Access**:
- VPC peering connections
- Transit Gateway
- PrivateLink endpoints

**Hybrid Cloud**:
- VPN connections
- AWS Direct Connect
- Private connectivity to on-premises

### 2. Automatic Subnet Discovery

The AWS Load Balancer Controller automatically discovers private subnets based on tags:

```bash
# Required tag for private subnets
Key: kubernetes.io/role/internal-elb
Value: 1

# Optional: Tag for specific cluster
Key: kubernetes.io/cluster/<cluster-name>
Value: shared or owned
```

### 3. Security Benefits

**Reduced Attack Surface**:
- No internet exposure
- Smaller security group footprint
- Private IP addresses only

**Network Segmentation**:
- Clear separation of internal/external services
- Comply with security requirements
- Better defense in depth

### 4. Cross-Zone Load Balancing

Internal NLBs support cross-zone load balancing:

```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"
```

### 5. Integration with Private Route53

Create internal DNS records:

```yaml
annotations:
  external-dns.alpha.kubernetes.io/hostname: myservice.internal.example.com
```

ExternalDNS creates records in private hosted zone associated with the VPC.

## Troubleshooting

### Issue: NLB Created in Public Subnets

**Symptoms**: NLB has scheme "internal" but is in public subnets

**Solutions**:

1. Verify private subnet tags:
```bash
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=<vpc-id>" \
  --query 'Subnets[*].[SubnetId,Tags[?Key==`kubernetes.io/role/internal-elb`].Value]' \
  --output table
```

2. Add required tag to private subnets:
```bash
aws ec2 create-tags \
  --resources subnet-xxx \
  --tags Key=kubernetes.io/role/internal-elb,Value=1
```

3. Delete and recreate the service:
```bash
kubectl delete service lbc-network-lb-internal
kubectl apply -f 02-LBC-NLB-LoadBalancer-Service.yml
```

### Issue: Cannot Access NLB from Internet

**Symptoms**: NLB not accessible from public IP

**Expected Behavior**: This is correct! Internal NLBs are not internet-accessible.

**Solutions**:
- Use bastion host in VPC
- Use VPN connection
- Use AWS Systems Manager Session Manager
- Change to `internet-facing` if internet access is required

### Issue: Cannot Access from Bastion Host

**Symptoms**: Connection timeout when accessing from bastion host

**Solutions**:

1. Verify bastion is in same VPC:
```bash
aws ec2 describe-instances \
  --instance-ids <bastion-instance-id> \
  --query 'Reservations[0].Instances[0].VpcId'
```

2. Check security groups:
```bash
# Bastion security group must allow outbound to NLB
# NLB security group must allow inbound from bastion
```

3. Verify route tables:
```bash
# Ensure private subnets have routes to each other
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=<vpc-id>"
```

4. Test DNS resolution:
```bash
# From bastion
nslookup <nlb-internal-dns>
dig <nlb-internal-dns>
```

### Issue: Targets Unhealthy

**Symptoms**: NLB created but all targets unhealthy

**Solutions**:

1. Check security group rules:
```bash
# Worker node security group must allow health check traffic
# From NLB subnets to NodePort range (30000-32767)
```

2. Verify pods are running:
```bash
kubectl get pods -l app=app3-nginx -o wide
```

3. Test health check endpoint:
```bash
# From bastion, test NodePort directly
NODE_PORT=$(kubectl get service lbc-network-lb-internal -o jsonpath='{.spec.ports[0].nodePort}')
curl http://<worker-node-ip>:$NODE_PORT/index.html
```

4. Check AWS Load Balancer Controller logs:
```bash
kubectl logs -n kube-system deployment/aws-load-balancer-controller --tail=100
```

### Issue: VPC Peering Connection Not Working

**Symptoms**: Cannot access NLB from peered VPC

**Solutions**:

1. Verify VPC peering connection is active:
```bash
aws ec2 describe-vpc-peering-connections \
  --filters "Name=status-code,Values=active"
```

2. Update route tables in both VPCs:
```bash
# In requester VPC, add route to accepter VPC CIDR via peering connection
# In accepter VPC, add route to requester VPC CIDR via peering connection
```

3. Check security groups:
```bash
# Allow traffic from peered VPC CIDR
aws ec2 authorize-security-group-ingress \
  --group-id <nlb-sg-id> \
  --protocol tcp \
  --port 80 \
  --cidr <peered-vpc-cidr>
```

4. Verify DNS resolution:
```bash
# Enable DNS resolution for peering connection
aws ec2 modify-vpc-peering-connection-options \
  --vpc-peering-connection-id <pcx-id> \
  --requester-peering-connection-options AllowDnsResolutionFromRemoteVpc=true \
  --accepter-peering-connection-options AllowDnsResolutionFromRemoteVpc=true
```

### Issue: ExternalDNS Not Creating Private Records

**Symptoms**: No DNS record in private hosted zone

**Solutions**:

1. Verify private hosted zone exists:
```bash
aws route53 list-hosted-zones --query 'HostedZones[?Config.PrivateZone==`true`]'
```

2. Check hosted zone is associated with VPC:
```bash
aws route53 get-hosted-zone --id <hosted-zone-id>
```

3. Verify ExternalDNS has permissions for Route53:
```bash
kubectl logs deployment/external-dns -n default
```

4. Check annotation format:
```bash
kubectl get service lbc-network-lb-internal -o yaml | grep hostname
```

## Best Practices

### 1. Subnet Tagging

**Tag private subnets consistently**:
```bash
# Required for internal NLB
Key: kubernetes.io/role/internal-elb
Value: 1

# For cluster-specific resources
Key: kubernetes.io/cluster/<cluster-name>
Value: shared
```

**Separate subnet tiers**:
- Data tier: Databases, caches
- Application tier: Business logic
- Integration tier: Internal APIs, message queues

### 2. Security Group Design

**Principle of least privilege**:
```yaml
# Allow only necessary source CIDRs
# Use security group references instead of CIDR ranges
```

**Example security group rules**:
```bash
# Allow health checks from NLB subnets
aws ec2 authorize-security-group-ingress \
  --group-id <worker-sg-id> \
  --protocol tcp \
  --port 30000-32767 \
  --source-group <nlb-sg-id>

# Allow application traffic from specific security groups
aws ec2 authorize-security-group-ingress \
  --group-id <nlb-sg-id> \
  --protocol tcp \
  --port 80 \
  --source-group <app-sg-id>
```

### 3. High Availability

**Multi-AZ deployment**:
```yaml
spec:
  replicas: 3  # Spread across AZs
```

**Pod anti-affinity**:
```yaml
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        topologyKey: topology.kubernetes.io/zone
        labelSelector:
          matchLabels:
            app: app3-nginx
```

**Cross-zone load balancing**:
```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"
```

### 4. Network Connectivity

**Document access patterns**:
- Which VPCs/networks need access?
- What protocols and ports are required?
- Are there compliance requirements?

**Test connectivity**:
```bash
# From each source network
nc -zv <nlb-dns> 80
telnet <nlb-dns> 80
```

### 5. DNS Management

**Use private hosted zones**:
- Associate with VPC
- Create meaningful internal names
- Keep external and internal DNS separate

**Example private zone setup**:
```bash
# Create private hosted zone
aws route53 create-hosted-zone \
  --name internal.example.com \
  --vpc VPCRegion=us-east-1,VPCId=<vpc-id> \
  --caller-reference $(date +%s)
```

### 6. Monitoring and Alerting

**CloudWatch metrics to monitor**:
- HealthyHostCount (should be > 0)
- UnHealthyHostCount (should be 0)
- ProcessedBytes
- ActiveFlowCount
- NewFlowCount

**VPC Flow Logs**:
```bash
# Enable for troubleshooting connectivity
aws ec2 create-flow-logs \
  --resource-type VPC \
  --resource-ids <vpc-id> \
  --traffic-type ALL \
  --log-destination-type cloud-watch-logs \
  --log-group-name /aws/vpc/flowlogs
```

**Set up alarms**:
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name internal-nlb-no-healthy-targets \
  --metric-name HealthyHostCount \
  --namespace AWS/NetworkELB \
  --statistic Average \
  --period 60 \
  --evaluation-periods 2 \
  --threshold 1 \
  --comparison-operator LessThanThreshold
```

### 7. Access Control

**Use VPC endpoints for AWS services**:
- Avoid NAT Gateway costs
- Improve security
- Better performance

**Implement network segmentation**:
- Use Network ACLs for subnet-level control
- Security groups for instance-level control
- Combine for defense in depth

### 8. Cost Optimization

**Internal NLBs have lower data transfer costs**:
- No internet data transfer charges
- Cheaper cross-AZ transfer
- Free data transfer within same AZ

**Consolidate services**:
```yaml
spec:
  ports:
  - name: http
    port: 80
    targetPort: 80
  - name: custom
    port: 8080
    targetPort: 8080
```
