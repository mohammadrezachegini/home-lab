# EKS CloudWatch Container Insights - Terraform Implementation

## Overview

This project implements Amazon CloudWatch Container Insights for Amazon EKS clusters using Terraform as Infrastructure as Code (IaC). Container Insights collects, aggregates, and summarizes metrics and logs from containerized applications and microservices running on Amazon EKS, providing comprehensive observability through CloudWatch dashboards.

The solution deploys both CloudWatch Agent for metrics collection and Fluent Bit for log aggregation, enabling detailed monitoring of cluster performance, resource utilization, and application logs.

## Architecture

### Components

The solution consists of three main Terraform manifest directories:

1. **ekscluster-terraform-manifests**: Core EKS cluster infrastructure
   - VPC with public/private subnets
   - EKS cluster and managed node groups
   - IAM roles and OIDC provider
   - EC2 bastion host for cluster access
   - IAM users and groups with various access levels

2. **cloudwatchagent-fluentbit-terraform-manifests**: Monitoring infrastructure
   - CloudWatch Agent DaemonSet for metrics collection
   - Fluent Bit DaemonSet for log forwarding
   - Kubernetes namespace (`amazon-cloudwatch`)
   - ConfigMaps for agent configuration
   - Service accounts with RBAC permissions

3. **sample-app-test-container-insights**: Test application
   - Sample deployment to validate monitoring
   - LoadBalancer services (CLB and NLB)

### Architecture Flow

```
EKS Cluster Nodes
    |
    +-- CloudWatch Agent (DaemonSet) --> CloudWatch Metrics
    |   - Collects node and pod metrics
    |   - Performance data aggregation
    |
    +-- Fluent Bit (DaemonSet) --> CloudWatch Logs
        - Collects container logs
        - Application and system logs
```

### Monitoring Capabilities

- **Cluster Metrics**: CPU, memory, disk, and network utilization
- **Node Metrics**: EC2 instance-level performance data
- **Pod Metrics**: Container resource consumption
- **Namespace Metrics**: Resource usage by namespace
- **Service Metrics**: Application-level performance
- **Log Collection**: Application logs, container logs, and Kubernetes events

## Prerequisites

### Required Tools

- **Terraform** >= 1.0.0
- **AWS CLI** v2.x configured with appropriate credentials
- **kubectl** v1.24+
- **Helm** v3.x (optional for additional tools)

### AWS Requirements

- AWS Account with appropriate permissions
- IAM user/role with following permissions:
  - EKS full access
  - EC2 full access
  - VPC management
  - IAM role/policy creation
  - CloudWatch full access
  - S3 access (for Terraform state)

### Required IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "eks:*",
        "ec2:*",
        "iam:*",
        "cloudwatch:*",
        "logs:*",
        "s3:*",
        "autoscaling:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### CloudWatch Agent IAM Policy

The CloudWatch Agent requires specific IAM permissions attached to the EKS node group role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData",
        "ec2:DescribeVolumes",
        "ec2:DescribeTags",
        "logs:PutLogEvents",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:DescribeLogStreams",
        "logs:DescribeLogGroups"
      ],
      "Resource": "*"
    }
  ]
}
```

## Project Structure

```
EKS-Monitoring-Logging-Terraform/
│
├── ekscluster-terraform-manifests/
│   ├── c1-versions.tf                    # Terraform and provider versions
│   ├── c2-01-generic-variables.tf        # Common variables
│   ├── c2-02-local-values.tf             # Local values and tags
│   ├── c3-01-vpc-variables.tf            # VPC configuration variables
│   ├── c3-02-vpc-module.tf               # VPC module configuration
│   ├── c3-03-vpc-outputs.tf              # VPC outputs
│   ├── c4-01-ec2bastion-variables.tf     # Bastion host variables
│   ├── c4-02-ec2bastion-outputs.tf       # Bastion outputs
│   ├── c4-03-ec2bastion-securitygroups.tf # Bastion security groups
│   ├── c4-04-ami-datasource.tf           # AMI lookup
│   ├── c4-05-ec2bastion-instance.tf      # Bastion EC2 instance
│   ├── c4-06-ec2bastion-elasticip.tf     # Bastion Elastic IP
│   ├── c4-07-ec2bastion-provisioners.tf  # Bastion provisioning
│   ├── c5-01-eks-variables.tf            # EKS variables
│   ├── c5-02-eks-outputs.tf              # EKS outputs
│   ├── c5-03-iamrole-for-eks-cluster.tf  # EKS cluster IAM role
│   ├── c5-04-iamrole-for-eks-nodegroup.tf # Node group IAM role
│   ├── c5-05-securitygroups-eks.tf       # EKS security groups
│   ├── c5-06-eks-cluster.tf              # EKS cluster resource
│   ├── c5-07-eks-node-group-public.tf    # Public node group
│   ├── c5-08-eks-node-group-private.tf   # Private node group
│   ├── c6-01-iam-oidc-connect-provider-variables.tf
│   ├── c6-02-iam-oidc-connect-provider.tf # OIDC provider for IRSA
│   ├── c7-01-kubernetes-provider.tf      # Kubernetes provider
│   ├── c7-02-kubernetes-configmap.tf     # aws-auth ConfigMap
│   ├── c8-01-iam-admin-user.tf           # Admin IAM user
│   ├── c8-02-iam-basic-user.tf           # Basic IAM user
│   ├── c9-01-iam-role-eksadmins.tf       # EKS admin IAM role
│   ├── c9-02-iam-group-and-user-eksadmins.tf
│   ├── c10-01-iam-role-eksreadonly.tf    # Read-only IAM role
│   ├── c10-02-iam-group-and-user-eksreadonly.tf
│   ├── c10-03-k8s-clusterrole-clusterrolebinding.tf
│   ├── c11-01-iam-role-eksdeveloper.tf   # Developer IAM role
│   ├── c11-02-iam-group-and-user-eksdeveloper.tf
│   ├── c11-03-k8s-clusterrole-clusterrolebinding.tf
│   ├── c11-04-namespaces.tf              # Kubernetes namespaces
│   └── c11-05-k8s-role-rolebinding.tf    # Namespace-specific RBAC
│
├── cloudwatchagent-fluentbit-terraform-manifests/
│   ├── c1-versions.tf                    # Terraform versions
│   ├── c2-remote-state-datasource.tf     # Remote state from EKS cluster
│   ├── c3-01-generic-variables.tf        # Variables
│   ├── c3-02-local-values.tf             # Local values
│   ├── c4-01-terraform-providers.tf      # AWS and Kubernetes providers
│   ├── c4-02-cwagent-namespace.tf        # amazon-cloudwatch namespace
│   ├── c4-03-cwagent-service-accounts-cr-crb.tf # ServiceAccount and RBAC
│   ├── c4-04-cwagent-configmap.tf        # CloudWatch Agent config
│   ├── c4-05-cwagent-daemonset.tf        # CloudWatch Agent DaemonSet
│   ├── c5-01-fluentbit-configmap.tf      # Fluent Bit cluster info
│   └── c5-02-fluentbit-daemonset.tf      # Fluent Bit DaemonSet
│
└── sample-app-test-container-insights/
    ├── 01-Deployment.yaml                # Test application deployment
    ├── 02-CLB-LoadBalancer-Service.yaml  # Classic LoadBalancer
    └── 03-NLB-LoadBalancer-Service.yaml  # Network LoadBalancer
```

## Usage

### Step 1: Deploy EKS Cluster

```bash
# Navigate to EKS cluster manifests
cd ekscluster-terraform-manifests

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the configuration
terraform apply -auto-approve

# Configure kubectl
aws eks update-kubeconfig --region us-east-1 --name <cluster-name>

# Verify cluster access
kubectl get nodes
kubectl get namespaces
```

### Step 2: Deploy CloudWatch Container Insights

```bash
# Navigate to monitoring manifests
cd ../cloudwatchagent-fluentbit-terraform-manifests

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Deploy CloudWatch Agent and Fluent Bit
terraform apply -auto-approve

# Verify deployments
kubectl get all -n amazon-cloudwatch
kubectl get daemonsets -n amazon-cloudwatch
kubectl get pods -n amazon-cloudwatch
```

Expected output:
```
NAME                           DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
daemonset.apps/cloudwatch-agent   3         3         3       3            3           <none>          2m
daemonset.apps/fluent-bit         3         3         3       3            3           <none>          2m
```

### Step 3: Deploy Test Application

```bash
# Navigate to sample app directory
cd ../sample-app-test-container-insights

# Deploy the application
kubectl apply -f 01-Deployment.yaml

# Deploy LoadBalancer service (choose one)
kubectl apply -f 02-CLB-LoadBalancer-Service.yaml
# OR
kubectl apply -f 03-NLB-LoadBalancer-Service.yaml

# Verify deployment
kubectl get deployment
kubectl get pods
kubectl get svc
```

### Step 4: Verify Container Insights in CloudWatch

1. Navigate to AWS Console > CloudWatch > Container Insights
2. Select your EKS cluster from the dropdown
3. View metrics for:
   - Cluster performance
   - Node performance
   - Pod performance
   - Service performance
   - Namespace performance

4. Check CloudWatch Logs:
   - Log Group: `/aws/containerinsights/<cluster-name>/application`
   - Log Group: `/aws/containerinsights/<cluster-name>/dataplane`
   - Log Group: `/aws/containerinsights/<cluster-name>/host`
   - Log Group: `/aws/containerinsights/<cluster-name>/performance`

### Step 5: Query Logs Using CloudWatch Insights

```sql
-- View application logs
fields @timestamp, @message
| filter kubernetes.namespace_name = "default"
| sort @timestamp desc
| limit 100

-- View pod errors
fields @timestamp, kubernetes.pod_name, @message
| filter @message like /error/i
| sort @timestamp desc

-- Analyze pod resource usage
fields @timestamp, kubernetes.pod_name, pod_cpu_utilization, pod_memory_utilization
| filter kubernetes.namespace_name = "default"
| stats avg(pod_cpu_utilization) as avg_cpu, max(pod_memory_utilization) as max_memory by kubernetes.pod_name
```

## Configuration

### CloudWatch Agent Configuration

The CloudWatch Agent is configured via ConfigMap (`c4-04-cwagent-configmap.tf`):

```hcl
resource "kubernetes_config_map_v1" "cwagentconfig_configmap" {
  metadata {
    name = "cwagentconfig"
    namespace = kubernetes_namespace_v1.amazon_cloudwatch.metadata[0].name
  }
  data = {
    "cwagentconfig.json" = jsonencode({
      "logs": {
        "metrics_collected": {
          "kubernetes": {
            "metrics_collection_interval": 60  # Collect metrics every 60 seconds
          }
        },
        "force_flush_interval": 5  # Flush data every 5 seconds
      }
    })
  }
}
```

### Fluent Bit Configuration

Fluent Bit cluster information ConfigMap (`c5-01-fluentbit-configmap.tf`):

```hcl
resource "kubernetes_config_map_v1" "fluentbit_configmap" {
  metadata {
    name = "fluent-bit-cluster-info"
    namespace = kubernetes_namespace_v1.amazon_cloudwatch.metadata[0].name
  }
  data = {
    "cluster.name" = data.terraform_remote_state.eks.outputs.cluster_id
    "http.port"   = "2020"
    "http.server" = "On"          # Enable HTTP monitoring
    "logs.region" = var.aws_region
    "read.head" = "Off"            # Don't read from beginning
    "read.tail" = "On"             # Only read new logs
  }
}
```

### Customizing Metrics Collection

To modify metrics collection interval or add custom metrics:

1. Edit `c4-04-cwagent-configmap.tf`
2. Update the `metrics_collection_interval` value
3. Add additional configuration options as needed
4. Reapply Terraform configuration

```hcl
"kubernetes": {
  "metrics_collection_interval": 30,  # Change to 30 seconds
  "enhanced_container_insights": true  # Enable enhanced metrics
}
```

### Customizing Log Collection

To modify log collection behavior:

1. Edit `c5-01-fluentbit-configmap.tf`
2. Change `read.head` to `On` to read historical logs
3. Adjust `http.port` if needed for monitoring
4. Reapply Terraform configuration

## Features

### CloudWatch Agent Features

- **Performance Monitoring**: CPU, memory, disk, and network metrics
- **Cluster-Level Metrics**: Aggregated cluster performance data
- **Node-Level Metrics**: EC2 instance metrics
- **Pod-Level Metrics**: Container resource utilization
- **Service-Level Metrics**: Application performance metrics
- **Automatic Discovery**: Auto-discovers pods and services
- **DaemonSet Deployment**: Runs on every node for complete coverage

### Fluent Bit Features

- **Log Aggregation**: Collects logs from all containers
- **Multiple Log Sources**: Application, host, and data plane logs
- **Log Filtering**: Built-in filters for Kubernetes metadata
- **Efficient Processing**: Lightweight agent with minimal overhead
- **CloudWatch Integration**: Direct integration with CloudWatch Logs
- **Metadata Enrichment**: Adds Kubernetes metadata to logs
- **Multi-line Log Support**: Handles stack traces and multi-line logs

### Container Insights Dashboard Features

- **Pre-built Dashboards**: Ready-to-use visualization
- **Resource Views**: Cluster, Node, Pod, Service, and Namespace views
- **Performance Alarms**: Set up CloudWatch alarms on metrics
- **Log Correlation**: Link metrics with logs for troubleshooting
- **Historical Analysis**: Query historical metrics and logs
- **Anomaly Detection**: CloudWatch anomaly detection on metrics

## Troubleshooting

### CloudWatch Agent Not Collecting Metrics

**Problem**: No metrics appearing in CloudWatch Container Insights

**Solutions**:

```bash
# Check CloudWatch Agent pod status
kubectl get pods -n amazon-cloudwatch

# View CloudWatch Agent logs
kubectl logs -n amazon-cloudwatch -l app=cloudwatch-agent

# Check ConfigMap
kubectl describe configmap cwagentconfig -n amazon-cloudwatch

# Verify IAM permissions on node group role
aws iam list-attached-role-policies --role-name <node-group-role-name>

# Restart CloudWatch Agent
kubectl rollout restart daemonset/cloudwatch-agent -n amazon-cloudwatch
```

### Fluent Bit Not Forwarding Logs

**Problem**: Logs not appearing in CloudWatch Logs

**Solutions**:

```bash
# Check Fluent Bit pod status
kubectl get pods -n amazon-cloudwatch -l k8s-app=fluent-bit

# View Fluent Bit logs
kubectl logs -n amazon-cloudwatch -l k8s-app=fluent-bit

# Check ConfigMap
kubectl describe configmap fluent-bit-cluster-info -n amazon-cloudwatch

# Verify log groups exist in CloudWatch
aws logs describe-log-groups --log-group-name-prefix /aws/containerinsights/

# Check IAM permissions
aws iam get-role-policy --role-name <node-group-role-name> --policy-name CloudWatchAgentPolicy
```

### Pods in CrashLoopBackOff

**Problem**: CloudWatch Agent or Fluent Bit pods crashing

**Solutions**:

```bash
# Describe the pod for events
kubectl describe pod <pod-name> -n amazon-cloudwatch

# Check resource limits
kubectl get pod <pod-name> -n amazon-cloudwatch -o yaml | grep -A 5 resources

# View previous container logs
kubectl logs <pod-name> -n amazon-cloudwatch --previous

# Check node resources
kubectl top nodes
kubectl describe node <node-name>
```

### Incomplete Metrics Data

**Problem**: Some metrics missing or incomplete

**Solutions**:

```bash
# Verify all DaemonSet pods are running
kubectl get daemonset -n amazon-cloudwatch

# Check for node taints
kubectl get nodes -o custom-columns=NAME:.metadata.name,TAINTS:.spec.taints

# Verify service account permissions
kubectl get clusterrolebinding | grep cloudwatch

# Check for network policies blocking traffic
kubectl get networkpolicies -A
```

### High CloudWatch Costs

**Problem**: Unexpected CloudWatch costs

**Solutions**:

1. Reduce metrics collection interval:
```hcl
"metrics_collection_interval": 300  # Change to 5 minutes
```

2. Filter logs to reduce volume:
```bash
# Edit Fluent Bit configuration to exclude verbose logs
# Add filters in the Fluent Bit ConfigMap
```

3. Set log retention policies:
```bash
# Set retention to 7 days for non-production
aws logs put-retention-policy \
  --log-group-name /aws/containerinsights/<cluster-name>/application \
  --retention-in-days 7
```

4. Review and remove unused log groups:
```bash
aws logs describe-log-groups --query 'logGroups[*].logGroupName' --output table
```

### Remote State Issues

**Problem**: Unable to read remote state from EKS cluster

**Solutions**:

```bash
# Verify remote state configuration in c2-remote-state-datasource.tf
# Ensure S3 bucket and state file exist
aws s3 ls s3://<bucket-name>/

# Check DynamoDB table for state locking
aws dynamodb describe-table --table-name <lock-table-name>

# Verify terraform outputs are available
cd ../ekscluster-terraform-manifests
terraform output
```

## Best Practices

### 1. Resource Management

- **Set Resource Limits**: Define CPU and memory limits for CloudWatch Agent and Fluent Bit
- **Node Affinity**: Use node selectors for monitoring DaemonSets
- **PriorityClass**: Set appropriate priority for monitoring workloads

```yaml
resources:
  limits:
    cpu: 200m
    memory: 200Mi
  requests:
    cpu: 100m
    memory: 100Mi
```

### 2. Security Best Practices

- **IRSA (IAM Roles for Service Accounts)**: Use IRSA instead of node IAM roles
- **Least Privilege**: Grant minimum required permissions
- **Secret Management**: Store sensitive data in AWS Secrets Manager
- **Network Policies**: Implement network policies to restrict traffic
- **Pod Security Standards**: Apply Pod Security Standards

### 3. Cost Optimization

- **Adjust Collection Intervals**: Increase intervals for non-critical metrics
- **Log Filtering**: Filter out verbose or unnecessary logs
- **Log Retention**: Set appropriate retention policies (7-30 days)
- **Metric Filters**: Create metric filters for specific log patterns only
- **Sampling**: Use sampling for high-volume applications

### 4. Monitoring Strategy

- **Baseline Metrics**: Establish baseline for normal operations
- **Set Alarms**: Create CloudWatch alarms for critical metrics
- **Dashboard Organization**: Create custom dashboards for teams
- **Log Insights Queries**: Save commonly used queries
- **Anomaly Detection**: Enable CloudWatch anomaly detection

### 5. High Availability

- **DaemonSet Deployment**: Ensures coverage on all nodes
- **Graceful Shutdown**: Configure proper termination grace periods
- **Update Strategy**: Use rolling updates for zero-downtime
- **Health Checks**: Implement liveness and readiness probes

### 6. Performance Optimization

- **Buffer Configuration**: Tune Fluent Bit buffer settings
- **Batch Processing**: Configure batch size for log shipping
- **Compression**: Enable log compression for network efficiency
- **Persistent Volumes**: Use volumes for buffering during outages

### 7. Operational Best Practices

- **Version Control**: Keep all Terraform configurations in Git
- **State Management**: Use remote state with locking
- **Tagging Strategy**: Apply consistent tags to all resources
- **Documentation**: Document custom configurations
- **Testing**: Test changes in non-production first

### 8. Terraform Best Practices

- **Module Organization**: Separate cluster and monitoring configurations
- **Variable Validation**: Add validation rules to variables
- **Output Values**: Export important values for other modules
- **Dependencies**: Use explicit dependencies where needed
- **State Isolation**: Use separate state files for different environments
