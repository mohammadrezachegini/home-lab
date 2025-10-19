# EKS ExternalDNS with Kubernetes Service

## Overview

This project demonstrates how to use **ExternalDNS** with Kubernetes **LoadBalancer Services** to automatically create and manage DNS records in AWS Route53. When you deploy a LoadBalancer service with the appropriate ExternalDNS annotation, a DNS record is automatically created pointing to the load balancer endpoint, eliminating manual DNS configuration.

This pattern is ideal for:
- **Simple service exposure**: Quick DNS setup for services
- **Load balanced applications**: Direct DNS to Classic/Network/Application Load Balancers
- **Automated DNS**: Zero-touch DNS record management
- **Development environments**: Rapid service deployment with DNS
- **Microservices**: Each service gets its own DNS name

Key benefits:
- No manual Route53 record creation
- DNS automatically updated when load balancer changes
- DNS automatically deleted when service is removed
- Support for multiple DNS names per service
- Custom TTL configuration

## Architecture

```
Client Request
    |
    v
Route53 DNS (extdns-k8s-service-demo101.rezaops.com)
    |  [A/CNAME Record - Managed by ExternalDNS]
    |
    v
Classic Load Balancer (ELB)
    |  [Created by Kubernetes Service Controller]
    |
    v
Kubernetes Service (LoadBalancer)
    |  [Service: app1-nginx-loadbalancer-service]
    |
    v
+-------+-------+-------+
|       |       |       |
v       v       v       v
Pod1   Pod2   Pod3   Pod4
(app1-nginx)
```

### Flow Diagram

```
1. Deploy Service with ExternalDNS annotation
                ↓
2. Kubernetes creates Load Balancer (ELB/NLB/ALB)
                ↓
3. Load Balancer gets DNS name (*.elb.amazonaws.com)
                ↓
4. ExternalDNS watches Service resource
                ↓
5. ExternalDNS extracts hostname annotation
                ↓
6. ExternalDNS creates Route53 record
   (extdns-k8s-service-demo101.rezaops.com → ELB DNS)
                ↓
7. Clients access service via friendly DNS name
```

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.0
- kubectl configured to interact with your EKS cluster
- **ExternalDNS already installed** (see EKS-ExternalDNS-Install project)
- AWS Load Balancer Controller installed (optional, for ALB/NLB)
- Route53 hosted zone for your domain
- Understanding of Kubernetes Services (LoadBalancer type)

## Project Structure

```
EKS-ExternalDNS-with-k8s-Service/
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
├── k8sService-externaldns-terraform-manifests/  # Terraform-managed resources
│   └── ...
└── kube-manifests-k8sService-externaldns/   # Kubernetes manifests
    ├── 01-Nginx-App1-Deployment.yml
    └── 02-Nginx-App1-LoadBalancer-Service.yml
```

## Usage

### Step 1: Ensure Prerequisites are Met

Verify ExternalDNS is running:

```bash
# Check ExternalDNS deployment
kubectl get deployment external-dns -n default

# Check ExternalDNS logs
kubectl logs -n default deployment/external-dns --tail=20

# Should see: "All records are already up to date" (if no resources yet)
```

Verify Route53 hosted zone exists:

```bash
# List your hosted zones
aws route53 list-hosted-zones

# Note your hosted zone ID for domain (e.g., rezaops.com)
```

### Step 2: Review the Service Manifest

The service manifest includes the ExternalDNS annotation:

```bash
cd kube-manifests-k8sService-externaldns
cat 02-Nginx-App1-LoadBalancer-Service.yml
```

Key annotation to note:
```yaml
annotations:
  external-dns.alpha.kubernetes.io/hostname: extdns-k8s-service-demo101.rezaops.com
```

### Step 3: Deploy the Application and Service

You can deploy using either Terraform or kubectl:

#### Option A: Using kubectl

```bash
cd kube-manifests-k8sService-externaldns

# Deploy the application
kubectl apply -f 01-Nginx-App1-Deployment.yml

# Deploy the LoadBalancer service
kubectl apply -f 02-Nginx-App1-LoadBalancer-Service.yml
```

#### Option B: Using Terraform

```bash
cd k8sService-externaldns-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

### Step 4: Verify Service Creation

```bash
# Check the deployment
kubectl get deployment app1-nginx-deployment

# Check pods
kubectl get pods -l app=app1-nginx

# Check service (wait for EXTERNAL-IP to be assigned)
kubectl get service app1-nginx-loadbalancer-service

# Watch service until load balancer is provisioned
kubectl get service app1-nginx-loadbalancer-service --watch
```

Example output:
```
NAME                               TYPE           EXTERNAL-IP                          PORT(S)
app1-nginx-loadbalancer-service    LoadBalancer   a1b2c3d4e5f6g7h8.us-east-1.elb...    80:31234/TCP
```

### Step 5: Verify DNS Record Creation

ExternalDNS will automatically create the Route53 record:

```bash
# Watch ExternalDNS logs
kubectl logs -n default deployment/external-dns --follow

# You should see log entries like:
# time="..." level=info msg="Desired change: CREATE extdns-k8s-service-demo101.rezaops.com A"
# time="..." level=info msg="Record was changed"
```

Wait for DNS propagation (typically 30-60 seconds):

```bash
# Test DNS resolution
nslookup extdns-k8s-service-demo101.rezaops.com

# Or use dig
dig extdns-k8s-service-demo101.rezaops.com

# Should return the load balancer DNS name as CNAME or A record
```

### Step 6: Verify in Route53 Console

1. Go to Route53 Console → Hosted Zones
2. Click on your hosted zone (rezaops.com)
3. Look for the record: `extdns-k8s-service-demo101.rezaops.com`
4. Verify it points to the load balancer DNS name

Or use AWS CLI:

```bash
# List records in hosted zone
aws route53 list-resource-record-sets \
  --hosted-zone-id <your-zone-id> \
  --query "ResourceRecordSets[?Name=='extdns-k8s-service-demo101.rezaops.com.']"
```

### Step 7: Test Access

```bash
# Access via the DNS name
curl http://extdns-k8s-service-demo101.rezaops.com/

# Should return the application response
# For nginx app1, you'll see HTML with app1 branding

# Test multiple times to see load balancing
for i in {1..5}; do
  curl -s http://extdns-k8s-service-demo101.rezaops.com/ | grep -i "application"
done
```

### Step 8: Test DNS Cleanup

When you delete the service, ExternalDNS automatically removes the DNS record:

```bash
# Delete the service
kubectl delete -f 02-Nginx-App1-LoadBalancer-Service.yml

# Watch ExternalDNS logs
kubectl logs -n default deployment/external-dns --follow

# Should see:
# time="..." level=info msg="Desired change: DELETE extdns-k8s-service-demo101.rezaops.com A"

# Verify DNS record is removed
aws route53 list-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --query "ResourceRecordSets[?Name=='extdns-k8s-service-demo101.rezaops.com.']"
# Should return empty
```

## Configuration

### LoadBalancer Service with ExternalDNS

**File**: `kube-manifests-k8sService-externaldns/02-Nginx-App1-LoadBalancer-Service.yml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: app1-nginx-loadbalancer-service
  labels:
    app: app1-nginx
  annotations:
    # Health check path for ALB (if using AWS LBC)
    alb.ingress.kubernetes.io/healthcheck-path: /app1/index.html

    # ExternalDNS annotation - CRITICAL
    external-dns.alpha.kubernetes.io/hostname: extdns-k8s-service-demo101.rezaops.com

spec:
  type: LoadBalancer
  selector:
    app: app1-nginx
  ports:
  - port: 80
    targetPort: 80
```

### Key Annotations Explained

| Annotation | Purpose | Example Value |
|------------|---------|---------------|
| `external-dns.alpha.kubernetes.io/hostname` | DNS name to create in Route53 | `myapp.example.com` |
| `external-dns.alpha.kubernetes.io/ttl` | TTL for DNS record (optional) | `300` (5 minutes) |
| `external-dns.alpha.kubernetes.io/alias` | Use Route53 ALIAS record (optional) | `true` or `false` |
| `alb.ingress.kubernetes.io/healthcheck-path` | Health check path for ALB (if using LBC) | `/health` |

### ExternalDNS Annotation Details

**Basic hostname**:
```yaml
annotations:
  external-dns.alpha.kubernetes.io/hostname: myapp.example.com
```

**Multiple hostnames**:
```yaml
annotations:
  external-dns.alpha.kubernetes.io/hostname: myapp.example.com,app.example.com,service.example.com
```

**Custom TTL**:
```yaml
annotations:
  external-dns.alpha.kubernetes.io/hostname: myapp.example.com
  external-dns.alpha.kubernetes.io/ttl: "60"  # 60 seconds
```

**ALIAS records** (AWS-specific, recommended):
```yaml
annotations:
  external-dns.alpha.kubernetes.io/hostname: myapp.example.com
  external-dns.alpha.kubernetes.io/alias: "true"
```

**TXT record for ownership** (automatic):
ExternalDNS creates a TXT record for ownership tracking:
```
TXT "heritage=external-dns,external-dns/owner=default"
```

### Application Deployment

**File**: `kube-manifests-k8sService-externaldns/01-Nginx-App1-Deployment.yml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app1-nginx-deployment
  labels:
    app: app1-nginx
spec:
  replicas: 3
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
```

## Features

### 1. Automatic DNS Record Creation

**No manual intervention**:
- Deploy service → DNS record created
- Update service → DNS record updated
- Delete service → DNS record deleted

**DNS record types**:
- **CNAME**: Points to load balancer DNS (default)
- **A**: Points to load balancer IP (if available)
- **ALIAS**: AWS-specific, better for root domains

### 2. Multiple DNS Names

Point multiple DNS names to the same service:

```yaml
annotations:
  external-dns.alpha.kubernetes.io/hostname: |
    app1.example.com,
    app1-prod.example.com,
    application1.example.com
```

### 3. TTL Control

Configure DNS record TTL based on your needs:

```yaml
annotations:
  external-dns.alpha.kubernetes.io/ttl: "60"    # Fast updates
  # or
  external-dns.alpha.kubernetes.io/ttl: "3600"  # Stable services
```

### 4. Load Balancer Types

Works with all Kubernetes LoadBalancer types:

**Classic Load Balancer** (default):
```yaml
spec:
  type: LoadBalancer
# No special annotations needed
```

**Network Load Balancer** (via AWS LBC):
```yaml
metadata:
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: nlb
    external-dns.alpha.kubernetes.io/hostname: myapp.example.com
```

**Application Load Balancer** (via AWS LBC):
```yaml
metadata:
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: external
    service.beta.kubernetes.io/aws-load-balancer-nlb-target-type: ip
    external-dns.alpha.kubernetes.io/hostname: myapp.example.com
```

### 5. Private and Public DNS

**Public hosted zone** (internet-facing):
```yaml
annotations:
  external-dns.alpha.kubernetes.io/hostname: public.example.com
```

**Private hosted zone** (VPC-internal):
```yaml
annotations:
  external-dns.alpha.kubernetes.io/hostname: internal.private.example.com
```

ExternalDNS automatically determines the correct hosted zone.

## Troubleshooting

### Issue: DNS Record Not Created

**Symptoms**: Service created but no DNS record in Route53

**Solutions**:

1. Check ExternalDNS logs:
```bash
kubectl logs -n default deployment/external-dns --tail=50
```

Look for errors related to:
- Permission issues
- Zone not found
- Invalid hostname

2. Verify annotation syntax:
```bash
kubectl get service app1-nginx-loadbalancer-service -o yaml | grep external-dns
```

3. Check service has EXTERNAL-IP:
```bash
kubectl get service app1-nginx-loadbalancer-service
# EXTERNAL-IP must not be <pending>
```

4. Verify hosted zone exists:
```bash
aws route53 list-hosted-zones --query "HostedZones[?Name=='rezaops.com.']"
```

5. Check domain matches hosted zone:
```bash
# Hostname: extdns-k8s-service-demo101.rezaops.com
# Hosted zone must be: rezaops.com
```

### Issue: DNS Record Created but Not Resolving

**Symptoms**: Record exists in Route53 but DNS queries fail

**Solutions**:

1. Wait for DNS propagation:
```bash
# DNS changes can take 30-60 seconds
sleep 60
nslookup extdns-k8s-service-demo101.rezaops.com
```

2. Check from different DNS servers:
```bash
# Google DNS
dig @8.8.8.8 extdns-k8s-service-demo101.rezaops.com

# Cloudflare DNS
dig @1.1.1.1 extdns-k8s-service-demo101.rezaops.com

# Route53 nameservers
aws route53 get-hosted-zone --id <zone-id> --query 'DelegationSet.NameServers'
```

3. Verify record value:
```bash
aws route53 list-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --query "ResourceRecordSets[?Name=='extdns-k8s-service-demo101.rezaops.com.']"
```

### Issue: Permission Denied Errors

**Symptoms**: ExternalDNS logs show "AccessDenied" errors

**Solutions**:

1. Verify ExternalDNS IAM role has permissions:
```bash
# Get ServiceAccount
kubectl get sa external-dns -n default -o yaml

# Check IAM role annotation
kubectl get sa external-dns -n default -o jsonpath='{.metadata.annotations.eks\.amazonaws\.com/role-arn}'

# Verify role exists
aws iam get-role --role-name <role-name>
```

2. Check IAM policy permissions:
```bash
# Should include:
# - route53:ChangeResourceRecordSets
# - route53:ListHostedZones
# - route53:ListResourceRecordSets

aws iam get-role-policy --role-name <role> --policy-name <policy>
```

### Issue: Wrong Load Balancer Type

**Symptoms**: Classic Load Balancer created when NLB/ALB expected

**Solutions**:

1. Install AWS Load Balancer Controller:
```bash
kubectl get deployment -n kube-system aws-load-balancer-controller
```

2. Add proper annotations for NLB:
```yaml
annotations:
  service.beta.kubernetes.io/aws-load-balancer-type: nlb
```

3. Or for ALB (actually requires Ingress, not Service):
```yaml
# ALBs are created via Ingress resources, not Services
# See EKS-ExternalDNS-with-Ingress-Service project
```

### Issue: Multiple DNS Records for Same Service

**Symptoms**: Multiple DNS records exist for same service

**Solutions**:

1. Check for duplicate annotations:
```bash
kubectl get service app1-nginx-loadbalancer-service -o yaml
```

2. Verify only one ExternalDNS instance:
```bash
kubectl get pods -A | grep external-dns
```

3. Use ownership ID to prevent conflicts:
```yaml
# In ExternalDNS Helm values
set {
  name  = "txtOwnerId"
  value = "external-dns-prod"
}
```

### Issue: DNS Record Not Deleted

**Symptoms**: Service deleted but DNS record remains

**Solutions**:

1. Check ExternalDNS policy mode:
```bash
kubectl get deployment external-dns -n default -o yaml | grep -i policy
# Should be "sync" not "upsert-only"
```

2. Manually delete record:
```bash
# Get change batch file
cat > delete-record.json <<EOF
{
  "Changes": [{
    "Action": "DELETE",
    "ResourceRecordSet": {
      "Name": "extdns-k8s-service-demo101.rezaops.com",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "x.x.x.x"}]
    }
  }]
}
EOF

# Apply change
aws route53 change-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --change-batch file://delete-record.json
```

### Issue: Service Stuck in Pending

**Symptoms**: LoadBalancer service shows `<pending>` for EXTERNAL-IP

**Solutions**:

1. Check AWS limits:
```bash
# Verify you haven't hit ELB limit
aws elbv2 describe-load-balancers --query 'length(LoadBalancers)'
```

2. Check service controller logs:
```bash
kubectl logs -n kube-system -l app=cloud-controller-manager
```

3. Verify VPC and subnet configuration:
```bash
# Public subnets need tag:
# kubernetes.io/role/elb = 1

aws ec2 describe-subnets --filters "Name=vpc-id,Values=<vpc-id>"
```

## Best Practices

### 1. Use Meaningful DNS Names

**Environment-based naming**:
```yaml
annotations:
  # Development
  external-dns.alpha.kubernetes.io/hostname: myapp-dev.example.com

  # Production
  external-dns.alpha.kubernetes.io/hostname: myapp.example.com
```

**Service-based naming**:
```yaml
annotations:
  external-dns.alpha.kubernetes.io/hostname: api.example.com
  external-dns.alpha.kubernetes.io/hostname: web.example.com
  external-dns.alpha.kubernetes.io/hostname: admin.example.com
```

### 2. Set Appropriate TTLs

**Development/testing** (fast updates):
```yaml
annotations:
  external-dns.alpha.kubernetes.io/ttl: "60"
```

**Production** (stable):
```yaml
annotations:
  external-dns.alpha.kubernetes.io/ttl: "300"
```

**Static services** (rarely change):
```yaml
annotations:
  external-dns.alpha.kubernetes.io/ttl: "3600"
```

### 3. Use ALIAS Records for Root Domains

```yaml
annotations:
  external-dns.alpha.kubernetes.io/hostname: example.com  # Root domain
  external-dns.alpha.kubernetes.io/alias: "true"
```

**Benefits**:
- Works with root domains (example.com)
- No CNAME flattening needed
- Better for AWS services
- Free queries in Route53

### 4. Monitor DNS Records

**Regular audits**:
```bash
# List all ExternalDNS managed records
aws route53 list-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --query "ResourceRecordSets[?contains(ResourceRecords[0].Value, 'elb')]"
```

**Set up alerts**:
- Monitor ExternalDNS logs for errors
- Alert on DNS resolution failures
- Track DNS record changes

### 5. Implement Health Checks

```yaml
annotations:
  # For ALB
  alb.ingress.kubernetes.io/healthcheck-path: /health

  # Application should expose /health endpoint
```

### 6. Use Multiple Replicas

```yaml
spec:
  replicas: 3  # Minimum for HA
```

Benefits:
- High availability
- Load distribution
- Zero-downtime updates

### 7. Document DNS Names

Keep track of DNS names in:
- Git repository (as annotations)
- DNS inventory spreadsheet
- Infrastructure documentation
- Monitoring dashboards

### 8. Test Before Production

```bash
# Test in dev/staging first
# 1. Deploy service
kubectl apply -f service.yaml

# 2. Verify DNS creation
nslookup myapp-dev.example.com

# 3. Test access
curl http://myapp-dev.example.com

# 4. Delete and verify cleanup
kubectl delete -f service.yaml
nslookup myapp-dev.example.com  # Should fail
```
