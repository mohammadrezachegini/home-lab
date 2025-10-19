# EKS ExternalDNS Installation

## Overview

This project provides the foundational setup for **ExternalDNS** on Amazon EKS. ExternalDNS is a Kubernetes controller that automatically manages DNS records in external DNS providers (like AWS Route53) based on Kubernetes resources such as Services and Ingresses. This eliminates the need for manual DNS management and ensures your DNS records stay synchronized with your Kubernetes deployments.

ExternalDNS automates:
- **DNS record creation**: Automatically creates records when Services/Ingresses are deployed
- **DNS record updates**: Updates records when load balancer endpoints change
- **DNS record deletion**: Removes records when resources are deleted
- **Multi-domain support**: Manages records across multiple hosted zones
- **TTL management**: Configurable DNS record TTL values

## Architecture

```
Kubernetes Cluster (EKS)
    |
    +-- ExternalDNS Controller
            |
            +-- Watches Kubernetes Resources
            |   - Services (LoadBalancer type)
            |   - Ingresses
            |   - Other supported resources
            |
            +-- Synchronizes with AWS Route53
                    |
                    v
            AWS Route53 Hosted Zones
                    |
                    +-- Public Hosted Zones
                    |       - Internet-facing services
                    |
                    +-- Private Hosted Zones
                            - Internal services within VPC
```

### How ExternalDNS Works

1. **Watch**: ExternalDNS watches Kubernetes API for annotated resources
2. **Extract**: Extracts hostname from annotations (e.g., `external-dns.alpha.kubernetes.io/hostname`)
3. **Determine**: Determines the target (load balancer DNS, IP address, etc.)
4. **Synchronize**: Creates/Updates/Deletes DNS records in Route53
5. **Repeat**: Continuously monitors for changes

### Key Components

1. **IAM Role**: IRSA (IAM Roles for Service Accounts) for Route53 permissions
2. **IAM Policy**: Permissions to modify Route53 records
3. **Kubernetes ServiceAccount**: Links to IAM role via annotations
4. **ExternalDNS Deployment**: Helm chart deployment
5. **OIDC Provider**: Enables IRSA for secure AWS API access

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.0
- kubectl configured to interact with your EKS cluster
- EKS cluster with OIDC provider configured
- At least one Route53 hosted zone (public or private)
- Understanding of Kubernetes ServiceAccounts and IRSA
- Helm 3.x (used by Terraform helm provider)

## Project Structure

```
EKS-ExternalDNS-Install/
├── ekscluster-terraform-manifests/          # EKS cluster infrastructure
│   ├── c1-versions.tf                        # Provider versions
│   ├── c3-01-vpc-variables.tf               # VPC configuration
│   ├── c5-06-eks-cluster.tf                 # EKS cluster definition
│   ├── c6-02-iam-oidc-connect-provider.tf   # OIDC provider for IRSA
│   └── ...
├── lbc-install-terraform-manifests/         # AWS Load Balancer Controller
│   ├── c1-versions.tf
│   ├── c4-03-lbc-install.tf                 # LBC Helm installation
│   └── ...
└── externaldns-install-terraform-manifests/ # ExternalDNS installation
    ├── c1-versions.tf                        # Terraform and provider versions
    ├── c2-remote-state-datasource.tf        # Remote state for EKS outputs
    ├── c3-01-generic-variables.tf           # Common variables
    ├── c3-02-local-values.tf                # Local values
    ├── c4-01-externaldns-iam-policy-and-role.tf  # IAM permissions
    ├── c4-02-externaldns-helm-provider.tf   # Helm provider configuration
    ├── c4-03-externaldns-install.tf         # ExternalDNS Helm deployment
    └── c4-04-externaldns-outputs.tf         # Terraform outputs
```

## Usage

### Step 1: Deploy EKS Cluster with OIDC Provider

The EKS cluster must have an OIDC provider configured for IRSA:

```bash
cd ekscluster-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

Verify OIDC provider:
```bash
# Get cluster OIDC issuer URL
aws eks describe-cluster \
  --name <cluster-name> \
  --query "cluster.identity.oidc.issuer" \
  --output text

# Verify OIDC provider exists
aws iam list-open-id-connect-providers
```

### Step 2: Install AWS Load Balancer Controller (Optional but Recommended)

While not strictly required for ExternalDNS, the Load Balancer Controller is commonly used together:

```bash
cd ../lbc-install-terraform-manifests
terraform init
terraform plan
terraform apply -auto-approve
```

### Step 3: Review and Configure ExternalDNS Settings

Before deployment, review the ExternalDNS configuration:

```bash
cd ../externaldns-install-terraform-manifests

# Review the variables
cat c3-01-generic-variables.tf

# Review the IAM policy
cat c4-01-externaldns-iam-policy-and-role.tf

# Review the Helm values
cat c4-03-externaldns-install.tf
```

### Step 4: Deploy ExternalDNS

```bash
# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the configuration
terraform apply -auto-approve
```

This will:
1. Create IAM policy with Route53 permissions
2. Create IAM role with trust policy for IRSA
3. Attach policy to role
4. Deploy ExternalDNS via Helm chart
5. Create ServiceAccount with IAM role annotation

### Step 5: Verify Installation

```bash
# Check ExternalDNS deployment
kubectl get deployment external-dns -n default

# Check pods
kubectl get pods -n default -l app.kubernetes.io/name=external-dns

# Verify ServiceAccount has IAM role annotation
kubectl get sa external-dns -n default -o yaml

# Check logs
kubectl logs -n default deployment/external-dns --tail=50
```

Expected log output:
```
time="2024-10-17..." level=info msg="Connected to cluster at https://..."
time="2024-10-17..." level=info msg="All records are already up to date"
```

### Step 6: Verify IAM Role and Permissions

```bash
# Get IAM role ARN from Terraform output
terraform output externaldns_iam_role_arn

# Verify role exists
aws iam get-role --role-name <role-name>

# Verify policy is attached
aws iam list-attached-role-policies --role-name <role-name>

# Test permissions (optional)
aws iam simulate-principal-policy \
  --policy-source-arn <role-arn> \
  --action-names route53:ListHostedZones route53:ChangeResourceRecordSets
```

### Step 7: Verify Route53 Access

```bash
# List hosted zones (to confirm access)
aws route53 list-hosted-zones

# ExternalDNS should be able to access these zones
```

## Configuration

### IAM Policy for ExternalDNS

**File**: `externaldns-install-terraform-manifests/c4-01-externaldns-iam-policy-and-role.tf`

The IAM policy grants ExternalDNS the minimum required permissions:

```hcl
resource "aws_iam_policy" "externaldns_iam_policy" {
  name        = "${local.name}-AllowExternalDNSUpdates"
  path        = "/"
  description = "External DNS IAM Policy"
  policy = jsonencode({
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
  })
}
```

**Permissions explained**:
- `route53:ChangeResourceRecordSets`: Create, update, delete DNS records
- `route53:ListHostedZones`: Discover available hosted zones
- `route53:ListResourceRecordSets`: List existing records in zones

### IAM Role with IRSA Trust Policy

```hcl
resource "aws_iam_role" "externaldns_iam_role" {
  name = "${local.name}-externaldns-iam-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = "${data.terraform_remote_state.eks.outputs.aws_iam_openid_connect_provider_arn}"
        }
        Condition = {
          StringEquals = {
            "${data.terraform_remote_state.eks.outputs.aws_iam_openid_connect_provider_extract_from_arn}:aud": "sts.amazonaws.com",
            "${data.terraform_remote_state.eks.outputs.aws_iam_openid_connect_provider_extract_from_arn}:sub": "system:serviceaccount:default:external-dns"
          }
        }
      },
    ]
  })
}
```

**Trust policy explained**:
- Uses `AssumeRoleWithWebIdentity` for IRSA
- Scoped to specific ServiceAccount: `default:external-dns`
- Only this ServiceAccount can assume the role

### ExternalDNS Helm Chart Configuration

**File**: `externaldns-install-terraform-manifests/c4-03-externaldns-install.tf`

```hcl
resource "helm_release" "external_dns" {
  depends_on = [aws_iam_role.externaldns_iam_role]
  name       = "external-dns"

  repository = "https://kubernetes-sigs.github.io/external-dns/"
  chart      = "external-dns"
  namespace  = "default"

  set {
    name  = "image.repository"
    value = "registry.k8s.io/external-dns/external-dns"
  }

  set {
    name  = "serviceAccount.create"
    value = "true"
  }

  set {
    name  = "serviceAccount.name"
    value = "external-dns"
  }

  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = "${aws_iam_role.externaldns_iam_role.arn}"
  }

  set {
    name  = "provider"
    value = "aws"
  }

  set {
    name  = "policy"
    value = "sync"
  }
}
```

### Key Configuration Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| `provider` | `aws` | DNS provider (AWS Route53) |
| `policy` | `sync` | Sync mode: creates AND deletes records |
| `serviceAccount.create` | `true` | Create ServiceAccount automatically |
| `serviceAccount.name` | `external-dns` | ServiceAccount name |
| `serviceAccount.annotations` | IAM role ARN | Links ServiceAccount to IAM role |
| `image.repository` | `registry.k8s.io/external-dns/external-dns` | Official ExternalDNS image |

### Policy Modes

ExternalDNS supports two policy modes:

**sync** (Recommended):
```hcl
set {
  name  = "policy"
  value = "sync"
}
```
- Creates records when resources are created
- **Deletes** records when resources are deleted
- Keeps Route53 in sync with Kubernetes state
- Best for production environments

**upsert-only** (Conservative):
```hcl
set {
  name  = "policy"
  value = "upsert-only"
}
```
- Creates records when resources are created
- **Does NOT delete** records when resources are deleted
- Safer but requires manual cleanup
- Use for testing or if you want to preserve DNS records

## Features

### 1. IAM Roles for Service Accounts (IRSA)

**Secure AWS authentication**:
- No AWS credentials stored in pods
- Temporary credentials via STS
- Fine-grained permissions
- Automatic credential rotation

**How IRSA works**:
```
Pod → ServiceAccount → IAM Role → AWS API
```

### 2. Automatic DNS Management

**Supported Kubernetes resources**:
- Services (type: LoadBalancer)
- Ingress resources
- Gateway API resources
- Custom resources

**DNS record types**:
- A records (IPv4)
- AAAA records (IPv6)
- CNAME records
- ALIAS records (AWS-specific)

### 3. Multi-Zone Support

ExternalDNS can manage multiple hosted zones:
- Public hosted zones (internet-facing)
- Private hosted zones (VPC-internal)
- Cross-account hosted zones (with proper IAM permissions)

### 4. Annotation-Based Configuration

Control DNS behavior with annotations:

```yaml
annotations:
  external-dns.alpha.kubernetes.io/hostname: myapp.example.com
  external-dns.alpha.kubernetes.io/ttl: "300"
  external-dns.alpha.kubernetes.io/alias: "true"
```

### 5. Ownership Management

ExternalDNS tracks which records it owns:
- TXT records for ownership tracking
- Prevents conflicts with manually created records
- Supports multiple ExternalDNS instances

## Troubleshooting

### Issue: ExternalDNS Pod Not Starting

**Symptoms**: Pod in CrashLoopBackOff or Pending state

**Solutions**:

1. Check pod status and events:
```bash
kubectl get pods -n default -l app.kubernetes.io/name=external-dns
kubectl describe pod -n default -l app.kubernetes.io/name=external-dns
```

2. Check logs:
```bash
kubectl logs -n default deployment/external-dns
```

3. Verify Helm release:
```bash
helm list -n default
helm status external-dns -n default
```

### Issue: IAM Role Not Assumed

**Symptoms**: Logs show "AccessDenied" errors

**Solutions**:

1. Verify ServiceAccount has IAM role annotation:
```bash
kubectl get sa external-dns -n default -o yaml | grep eks.amazonaws.com/role-arn
```

2. Check OIDC provider exists:
```bash
aws iam list-open-id-connect-providers
```

3. Verify trust relationship:
```bash
aws iam get-role --role-name <externaldns-role> --query 'Role.AssumeRolePolicyDocument'
```

4. Check namespace and ServiceAccount name match:
```bash
# ServiceAccount MUST be in 'default' namespace with name 'external-dns'
# Or update IAM role trust policy accordingly
```

### Issue: DNS Records Not Created

**Symptoms**: ExternalDNS running but no records in Route53

**Solutions**:

1. Check ExternalDNS logs for errors:
```bash
kubectl logs -n default deployment/external-dns --tail=100 | grep -i error
```

2. Verify resources have correct annotations:
```bash
# For services
kubectl get service <service-name> -o yaml | grep external-dns

# For ingresses
kubectl get ingress <ingress-name> -o yaml | grep external-dns
```

3. Check hosted zone exists:
```bash
aws route53 list-hosted-zones --query "HostedZones[?Name=='example.com.']"
```

4. Verify IAM permissions:
```bash
# Check ExternalDNS can list zones
aws iam simulate-principal-policy \
  --policy-source-arn <role-arn> \
  --action-names route53:ListHostedZones
```

### Issue: Permission Denied Errors

**Symptoms**: Logs show "AccessDenied" or "User is not authorized"

**Solutions**:

1. Verify IAM policy is attached to role:
```bash
aws iam list-attached-role-policies --role-name <role-name>
```

2. Check policy permissions:
```bash
aws iam get-policy-version \
  --policy-arn <policy-arn> \
  --version-id v1 \
  --query 'PolicyVersion.Document'
```

3. Ensure policy allows all required actions:
   - `route53:ListHostedZones`
   - `route53:ListResourceRecordSets`
   - `route53:ChangeResourceRecordSets`

4. For specific hosted zones, update policy:
```hcl
"Resource": [
  "arn:aws:route53:::hostedzone/Z1234567890ABC"  # Specific zone
]
```

### Issue: OIDC Provider Not Found

**Symptoms**: ServiceAccount exists but role not assumed

**Solutions**:

1. Verify OIDC provider exists:
```bash
aws iam list-open-id-connect-providers
```

2. Check EKS cluster has OIDC issuer:
```bash
aws eks describe-cluster \
  --name <cluster-name> \
  --query "cluster.identity.oidc.issuer"
```

3. Create OIDC provider if missing:
```bash
# This should be done via Terraform in ekscluster-terraform-manifests
terraform apply -target=aws_iam_openid_connect_provider.oidc_provider
```

### Issue: Multiple ExternalDNS Instances Conflict

**Symptoms**: DNS records being created/deleted repeatedly

**Solutions**:

1. Use ownership filters:
```yaml
set {
  name  = "txtOwnerId"
  value = "external-dns-prod"
}
```

2. Limit to specific namespaces:
```yaml
set {
  name  = "namespaced"
  value = "true"
}
```

3. Use different hosted zones:
```yaml
set {
  name  = "domainFilters[0]"
  value = "prod.example.com"
}
```

### Issue: Private Hosted Zone Not Working

**Symptoms**: Records not created in private hosted zone

**Solutions**:

1. Verify private hosted zone is associated with VPC:
```bash
aws route53 get-hosted-zone --id <zone-id>
```

2. Check VPC ID matches cluster VPC:
```bash
aws eks describe-cluster \
  --name <cluster-name> \
  --query "cluster.resourcesVpcConfig.vpcId"
```

3. Ensure ExternalDNS has access to private zones:
```yaml
# No special configuration needed, IAM policy covers all zones
```

## Best Practices

### 1. Use Sync Policy for Production

```hcl
set {
  name  = "policy"
  value = "sync"
}
```
- Automatically cleans up deleted resources
- Keeps DNS in sync with cluster state
- Prevents stale DNS records

### 2. Implement Least Privilege IAM

**Restrict to specific hosted zones**:
```hcl
"Resource": [
  "arn:aws:route53:::hostedzone/Z1234567890ABC",
  "arn:aws:route53:::hostedzone/Z9876543210XYZ"
]
```

**Use resource tags for filtering**:
```hcl
"Condition": {
  "StringEquals": {
    "aws:ResourceTag/Environment": "production"
  }
}
```

### 3. Monitor ExternalDNS Logs

**Set up log aggregation**:
- Forward logs to CloudWatch Logs
- Use ELK/EFK stack
- Monitor for errors and warnings

**Example log monitoring**:
```bash
# Watch for errors
kubectl logs -n default deployment/external-dns --follow | grep ERROR

# Check sync frequency
kubectl logs -n default deployment/external-dns | grep "All records are already up to date"
```

### 4. Configure Appropriate TTL

```yaml
annotations:
  external-dns.alpha.kubernetes.io/ttl: "300"  # 5 minutes
```

**TTL guidelines**:
- **Low TTL (60-300s)**: Frequently changing services
- **Medium TTL (300-1800s)**: Standard applications
- **High TTL (3600s+)**: Stable, rarely changing services

### 5. Use Domain Filters

Limit ExternalDNS to specific domains:

```yaml
set {
  name  = "domainFilters[0]"
  value = "example.com"
}

set {
  name  = "domainFilters[1]"
  value = "internal.example.com"
}
```

### 6. Implement Source Filtering

Control which resources ExternalDNS watches:

```yaml
# Only watch Services
set {
  name  = "sources[0]"
  value = "service"
}

# Watch both Services and Ingress
set {
  name  = "sources[0]"
  value = "service"
}
set {
  name  = "sources[1]"
  value = "ingress"
}
```

### 7. Enable Logging and Metrics

```yaml
set {
  name  = "logLevel"
  value = "info"  # or "debug" for troubleshooting
}

set {
  name  = "metrics.enabled"
  value = "true"
}
```

### 8. Regular Updates

**Keep ExternalDNS updated**:
```bash
# Check current version
helm list -n default | grep external-dns

# Update to latest version
helm repo update
helm upgrade external-dns kubernetes-sigs/external-dns -n default
```

### 9. Disaster Recovery

**Document DNS records**:
```bash
# Export DNS records before major changes
aws route53 list-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --output json > route53-backup.json
```

**Test recovery**:
- Delete a test service
- Verify DNS record is removed
- Recreate service
- Verify DNS record is recreated
