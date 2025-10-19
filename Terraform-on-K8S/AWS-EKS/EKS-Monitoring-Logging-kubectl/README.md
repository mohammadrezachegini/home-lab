# EKS CloudWatch Container Insights - kubectl Implementation

## Overview

This project implements Amazon CloudWatch Container Insights for Amazon EKS clusters using native Kubernetes manifests and kubectl commands. Unlike the Terraform-based approach, this implementation uses YAML manifests to deploy the CloudWatch Agent and Fluent Bit directly to your existing EKS cluster, providing comprehensive observability through CloudWatch dashboards.

This approach is ideal for teams who prefer imperative deployments, need quick setup without Terraform infrastructure, or want to integrate monitoring into existing GitOps workflows.

## Architecture

### Components

The solution consists of three main directories:

1. **ekscluster-terraform-manifests**: Core EKS cluster infrastructure (Terraform-based)
   - Provides the underlying EKS cluster
   - VPC, subnets, and networking
   - IAM roles and OIDC provider
   - Node groups and bastion host

2. **cwagent-container-insights**: CloudWatch monitoring manifests (kubectl-based)
   - CloudWatch Agent ConfigMap (`01-cw-agent-configmap.yaml`)
   - Fluent Bit ConfigMap (`02-cw-fluentbit-configmap.yaml`)
   - Deployed via kubectl commands from AWS repositories

3. **sample-app-test-container-insights**: Test application
   - Sample deployment to validate monitoring
   - LoadBalancer services (CLB and NLB)

### Architecture Flow

```
kubectl apply → EKS API Server
                    |
                    ↓
        amazon-cloudwatch namespace
                    |
        +-----------+-----------+
        |                       |
   CloudWatch Agent        Fluent Bit
    (DaemonSet)             (DaemonSet)
        |                       |
        ↓                       ↓
   CloudWatch Metrics    CloudWatch Logs
```

### Data Flow

1. **CloudWatch Agent** collects metrics from kubelet and container runtime
2. **Fluent Bit** tails container logs from `/var/log/containers/`
3. Both agents send data to CloudWatch using IAM roles (IRSA or node roles)
4. CloudWatch Container Insights aggregates and displays the data

## Prerequisites

### Required Tools

- **kubectl** v1.24+ configured with EKS cluster access
- **AWS CLI** v2.x configured with appropriate credentials
- **eksctl** (optional, for quick cluster setup)
- **curl** or **wget** for downloading manifests

### AWS Requirements

- Existing Amazon EKS cluster (v1.24+)
- EKS cluster with OIDC provider enabled
- IAM permissions to create/attach policies
- CloudWatch Logs permissions

### Required IAM Permissions

The EKS node group IAM role needs the following managed policy:

```bash
# Attach CloudWatch Agent Server Policy
aws iam attach-role-policy \
  --role-name <node-group-role-name> \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
```

Or create a custom policy:

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

### Verify Prerequisites

```bash
# Check kubectl configuration
kubectl version --client
kubectl cluster-info

# Check cluster access
kubectl get nodes

# Verify OIDC provider
aws eks describe-cluster --name <cluster-name> --query "cluster.identity.oidc.issuer" --output text

# Check node IAM role
kubectl get nodes -o jsonpath='{.items[0].spec.providerID}' | cut -d'/' -f5 | xargs aws ec2 describe-instances --instance-ids --query 'Reservations[0].Instances[0].IamInstanceProfile.Arn'
```

## Project Structure

```
EKS-Monitoring-Logging-kubectl/
│
├── ekscluster-terraform-manifests/
│   └── [Terraform files for EKS cluster setup]
│       ├── c1-versions.tf
│       ├── c5-06-eks-cluster.tf
│       ├── c5-07-eks-node-group-public.tf
│       └── ... (same as Terraform implementation)
│
├── cwagent-container-insights/
│   ├── 01-cw-agent-configmap.yaml      # CloudWatch Agent configuration
│   └── 02-cw-fluentbit-configmap.yaml  # Fluent Bit cluster info
│
└── sample-app-test-container-insights/
    ├── 01-Deployment.yaml              # Test application deployment
    ├── 02-CLB-LoadBalancer-Service.yaml # Classic LoadBalancer
    └── 03-NLB-LoadBalancer-Service.yaml # Network LoadBalancer
```

## Usage

### Step 1: Prepare Your EKS Cluster

If you haven't already deployed the EKS cluster:

```bash
# Deploy the cluster using Terraform
cd ekscluster-terraform-manifests
terraform init
terraform apply -auto-approve

# Configure kubectl
aws eks update-kubeconfig --region us-east-1 --name <cluster-name>

# Verify cluster access
kubectl get nodes
```

### Step 2: Attach IAM Policy to Node Group Role

```bash
# Get the node group IAM role name
NODE_ROLE=$(aws eks describe-nodegroup \
  --cluster-name <cluster-name> \
  --nodegroup-name <nodegroup-name> \
  --query 'nodegroup.nodeRole' --output text | cut -d'/' -f2)

# Attach CloudWatch policy
aws iam attach-role-policy \
  --role-name $NODE_ROLE \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy

# Verify policy attachment
aws iam list-attached-role-policies --role-name $NODE_ROLE
```

### Step 3: Create Namespace

```bash
# Create the amazon-cloudwatch namespace
kubectl create namespace amazon-cloudwatch

# Verify namespace creation
kubectl get namespace amazon-cloudwatch
```

### Step 4: Deploy CloudWatch Agent ConfigMap

```bash
# Apply the CloudWatch Agent ConfigMap
kubectl apply -f cwagent-container-insights/01-cw-agent-configmap.yaml

# Verify ConfigMap
kubectl describe configmap cwagentconfig -n amazon-cloudwatch
```

The ConfigMap contains:

```yaml
apiVersion: v1
data:
  cwagentconfig.json: |
    {
      "logs": {
        "metrics_collected": {
          "kubernetes": {
            "metrics_collection_interval": 60
          }
        },
        "force_flush_interval": 5
      }
    }
kind: ConfigMap
metadata:
  name: cwagentconfig
  namespace: amazon-cloudwatch
```

### Step 5: Deploy Fluent Bit ConfigMap

**IMPORTANT**: Before applying, update the cluster name in `02-cw-fluentbit-configmap.yaml`:

```bash
# Edit the ConfigMap
vim cwagent-container-insights/02-cw-fluentbit-configmap.yaml

# Update these values:
# - cluster.name: <your-cluster-name>
# - logs.region: <your-aws-region>

# Apply the Fluent Bit ConfigMap
kubectl apply -f cwagent-container-insights/02-cw-fluentbit-configmap.yaml

# Verify ConfigMap
kubectl describe configmap fluent-bit-cluster-info -n amazon-cloudwatch
```

Example ConfigMap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-cluster-info
  namespace: amazon-cloudwatch
data:
  cluster.name: my-eks-cluster      # UPDATE THIS
  http.port: "2020"
  http.server: "On"
  logs.region: us-east-1            # UPDATE THIS
  read.head: "Off"
  read.tail: "On"
```

### Step 6: Deploy CloudWatch Agent

Download and apply the official CloudWatch Agent DaemonSet:

```bash
# Download the latest CloudWatch Agent manifest
curl https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/cwagent/cwagent-serviceaccount.yaml | kubectl apply -f -

# Deploy the CloudWatch Agent DaemonSet
curl https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/cwagent/cwagent-daemonset.yaml | kubectl apply -f -

# Verify deployment
kubectl get daemonset cloudwatch-agent -n amazon-cloudwatch
kubectl get pods -n amazon-cloudwatch -l app=cloudwatch-agent
```

### Step 7: Deploy Fluent Bit

Download and apply the official Fluent Bit manifest:

```bash
# Deploy Fluent Bit DaemonSet with all resources
curl https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/fluent-bit/fluent-bit.yaml | kubectl apply -f -

# Verify deployment
kubectl get daemonset fluent-bit -n amazon-cloudwatch
kubectl get pods -n amazon-cloudwatch -l k8s-app=fluent-bit
```

Expected output:

```
NAME         DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
fluent-bit   3         3         3       3            3           <none>          2m
```

### Step 8: Verify Installation

```bash
# Check all resources in amazon-cloudwatch namespace
kubectl get all -n amazon-cloudwatch

# Check logs from CloudWatch Agent
kubectl logs -n amazon-cloudwatch -l app=cloudwatch-agent --tail=50

# Check logs from Fluent Bit
kubectl logs -n amazon-cloudwatch -l k8s-app=fluent-bit --tail=50

# Verify no errors
kubectl get events -n amazon-cloudwatch --sort-by='.lastTimestamp'
```

### Step 9: Deploy Test Application

```bash
# Navigate to sample app directory
cd sample-app-test-container-insights

# Deploy the application
kubectl apply -f 01-Deployment.yaml

# Deploy a LoadBalancer service
kubectl apply -f 03-NLB-LoadBalancer-Service.yaml

# Verify deployment
kubectl get deployment
kubectl get pods
kubectl get svc

# Generate some traffic
LOAD_BALANCER_URL=$(kubectl get svc -o jsonpath='{.items[0].status.loadBalancer.ingress[0].hostname}')
curl http://$LOAD_BALANCER_URL
```

### Step 10: View Metrics in CloudWatch

1. Open AWS Console > CloudWatch > Container Insights
2. Select your cluster from the dropdown
3. Explore different views:
   - **EKS Clusters**: Overall cluster metrics
   - **EKS Nodes**: Node-level performance
   - **EKS Namespaces**: Namespace resource usage
   - **EKS Services**: Service-level metrics
   - **EKS Pods**: Individual pod performance

4. Check CloudWatch Logs:

```bash
# List log groups
aws logs describe-log-groups --log-group-name-prefix /aws/containerinsights/

# View recent application logs
aws logs tail /aws/containerinsights/<cluster-name>/application --follow

# View performance logs
aws logs tail /aws/containerinsights/<cluster-name>/performance --follow
```

## Configuration

### CloudWatch Agent Configuration Options

Edit the `cwagentconfig` ConfigMap to customize metrics collection:

```yaml
data:
  cwagentconfig.json: |
    {
      "logs": {
        "metrics_collected": {
          "kubernetes": {
            "metrics_collection_interval": 60,  # Change interval (seconds)
            "enhanced_container_insights": true  # Enable enhanced metrics
          }
        },
        "force_flush_interval": 5,  # How often to flush data
        "endpoint_override": "monitoring.us-east-1.amazonaws.com"  # Custom endpoint
      }
    }
```

Apply changes:

```bash
kubectl apply -f cwagent-container-insights/01-cw-agent-configmap.yaml

# Restart CloudWatch Agent to pick up changes
kubectl rollout restart daemonset/cloudwatch-agent -n amazon-cloudwatch
```

### Fluent Bit Configuration Options

Edit the `fluent-bit-cluster-info` ConfigMap:

```yaml
data:
  cluster.name: my-eks-cluster
  http.port: "2020"           # Monitoring endpoint port
  http.server: "On"           # Enable monitoring endpoint
  logs.region: us-east-1
  read.head: "Off"            # "On" to read from beginning
  read.tail: "On"             # "On" to read only new logs
```

Apply changes:

```bash
kubectl apply -f cwagent-container-insights/02-cw-fluentbit-configmap.yaml

# Restart Fluent Bit
kubectl rollout restart daemonset/fluent-bit -n amazon-cloudwatch
```

### Advanced Fluent Bit Filtering

For advanced log filtering, modify the Fluent Bit ConfigMap in the full manifest:

```yaml
# Add custom filters to exclude verbose logs
[FILTER]
    Name                kubernetes
    Match               kube.*
    Kube_URL            https://kubernetes.default.svc:443
    Kube_CA_File        /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    Kube_Token_File     /var/run/secrets/kubernetes.io/serviceaccount/token
    Merge_Log           On
    Keep_Log            Off
    K8S-Logging.Parser  On
    K8S-Logging.Exclude On

[FILTER]
    Name    grep
    Match   *
    Exclude log .*health.*  # Exclude health check logs
```

## Features

### Quick Setup Features

- **No Terraform Required**: Direct kubectl deployment
- **Official AWS Manifests**: Uses maintained AWS manifests
- **Simple Updates**: Easy to update with latest manifests
- **GitOps Ready**: YAML manifests integrate with ArgoCD/Flux
- **Namespace Isolation**: All resources in dedicated namespace

### Monitoring Capabilities

- **Real-time Metrics**: CPU, memory, disk, network
- **Log Aggregation**: Application and system logs
- **Performance Insights**: Pod and node performance
- **Resource Tracking**: Namespace and service-level metrics
- **Automatic Discovery**: No manual configuration needed

### CloudWatch Integration

- **Container Insights Dashboard**: Pre-built visualizations
- **CloudWatch Logs**: Centralized log storage
- **Metric Filters**: Create custom metrics from logs
- **Alarms**: Set up CloudWatch alarms
- **Anomaly Detection**: ML-based anomaly detection

## Troubleshooting

### Pods Not Starting

**Problem**: CloudWatch Agent or Fluent Bit pods stuck in Pending or CrashLoopBackOff

**Solutions**:

```bash
# Check pod status
kubectl get pods -n amazon-cloudwatch

# Describe pod for events
kubectl describe pod <pod-name> -n amazon-cloudwatch

# Check pod logs
kubectl logs <pod-name> -n amazon-cloudwatch

# Common issues:
# 1. IAM permissions missing
kubectl get nodes -o jsonpath='{.items[0].spec.providerID}' | cut -d'/' -f5

# 2. ConfigMap not found
kubectl get configmap -n amazon-cloudwatch

# 3. Resource constraints
kubectl describe nodes
```

### No Metrics in CloudWatch

**Problem**: Container Insights dashboard shows no data

**Solutions**:

```bash
# Verify CloudWatch Agent is running
kubectl get pods -n amazon-cloudwatch -l app=cloudwatch-agent

# Check CloudWatch Agent logs for errors
kubectl logs -n amazon-cloudwatch -l app=cloudwatch-agent | grep -i error

# Verify IAM policy attachment
NODE_ROLE=$(aws eks describe-nodegroup --cluster-name <cluster-name> \
  --nodegroup-name <nodegroup-name> \
  --query 'nodegroup.nodeRole' --output text | cut -d'/' -f2)

aws iam list-attached-role-policies --role-name $NODE_ROLE

# Test CloudWatch permissions from pod
kubectl run test-cw --image=amazon/aws-cli --rm -it -- \
  cloudwatch put-metric-data --namespace Test --metric-name TestMetric --value 1
```

### Logs Not Appearing in CloudWatch

**Problem**: CloudWatch Logs groups empty or missing

**Solutions**:

```bash
# Check Fluent Bit status
kubectl get pods -n amazon-cloudwatch -l k8s-app=fluent-bit

# View Fluent Bit logs
kubectl logs -n amazon-cloudwatch -l k8s-app=fluent-bit | tail -100

# Verify cluster name in ConfigMap
kubectl get configmap fluent-bit-cluster-info -n amazon-cloudwatch -o yaml

# Check if log groups exist
aws logs describe-log-groups \
  --log-group-name-prefix /aws/containerinsights/<cluster-name>

# Manually create log group if needed
aws logs create-log-group \
  --log-group-name /aws/containerinsights/<cluster-name>/application
```

### Wrong Cluster Name in Logs

**Problem**: Logs going to wrong cluster or not showing up

**Solution**:

```bash
# Update cluster name in ConfigMap
kubectl edit configmap fluent-bit-cluster-info -n amazon-cloudwatch

# Or reapply with corrected name
vim cwagent-container-insights/02-cw-fluentbit-configmap.yaml
kubectl apply -f cwagent-container-insights/02-cw-fluentbit-configmap.yaml

# Restart Fluent Bit
kubectl rollout restart daemonset/fluent-bit -n amazon-cloudwatch
```

### High Memory Usage

**Problem**: CloudWatch Agent or Fluent Bit using too much memory

**Solutions**:

```bash
# Check resource usage
kubectl top pods -n amazon-cloudwatch

# Add resource limits to DaemonSet
kubectl edit daemonset cloudwatch-agent -n amazon-cloudwatch

# Add these limits:
resources:
  limits:
    cpu: 200m
    memory: 200Mi
  requests:
    cpu: 100m
    memory: 100Mi

# Restart the DaemonSet
kubectl rollout restart daemonset/cloudwatch-agent -n amazon-cloudwatch
```

### DaemonSet Not Scheduling on All Nodes

**Problem**: DaemonSet pods not running on some nodes

**Solutions**:

```bash
# Check for node taints
kubectl get nodes -o custom-columns=NAME:.metadata.name,TAINTS:.spec.taints

# Check DaemonSet node selector
kubectl get daemonset cloudwatch-agent -n amazon-cloudwatch -o yaml | grep -A 5 nodeSelector

# Add toleration if needed
kubectl edit daemonset cloudwatch-agent -n amazon-cloudwatch

# Add tolerations:
tolerations:
- operator: Exists
  effect: NoSchedule
```

### Outdated Manifests

**Problem**: Using old version of CloudWatch Agent or Fluent Bit

**Solution**:

```bash
# Download and apply latest manifests
curl https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluentbit-quickstart.yaml | kubectl apply -f -

# Or use the quick start template (deploys everything)
ClusterName=<cluster-name>
RegionName=<region>
FluentBitHttpPort='2020'
FluentBitReadFromHead='Off'

curl https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluentbit-quickstart.yaml | \
sed "s/{{cluster_name}}/${ClusterName}/;s/{{region_name}}/${RegionName}/;s/{{http_server_toggle}}/\"On\"/;s/{{http_server_port}}/\"${FluentBitHttpPort}\"/;s/{{read_from_head}}/\"${FluentBitReadFromHead}\"/;s/{{read_from_tail}}/\"On\"/" | \
kubectl apply -f -
```

## Best Practices

### 1. Deployment Best Practices

- **Use Version Control**: Store all manifests in Git
- **Review Before Apply**: Use `kubectl diff` before applying changes
- **Namespace Isolation**: Keep monitoring in dedicated namespace
- **Resource Limits**: Always set resource requests and limits
- **Rolling Updates**: Use rolling update strategy for changes

```bash
# Check diff before applying
kubectl diff -f cwagent-container-insights/

# Apply with record flag for history
kubectl apply -f cwagent-container-insights/ --record

# View rollout history
kubectl rollout history daemonset/cloudwatch-agent -n amazon-cloudwatch
```

### 2. Security Best Practices

- **IRSA Preferred**: Use IAM Roles for Service Accounts instead of node roles
- **Least Privilege**: Grant minimum required IAM permissions
- **Network Policies**: Restrict network access to monitoring components
- **Pod Security**: Apply Pod Security Standards

```bash
# Create IRSA for CloudWatch Agent
eksctl create iamserviceaccount \
  --name cloudwatch-agent \
  --namespace amazon-cloudwatch \
  --cluster <cluster-name> \
  --attach-policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy \
  --approve \
  --override-existing-serviceaccounts
```

### 3. Cost Optimization

- **Log Retention**: Set appropriate retention policies
- **Metric Intervals**: Increase collection interval for non-prod
- **Log Filtering**: Filter out verbose logs
- **Sampling**: Use sampling for high-volume apps

```bash
# Set 7-day retention for development
aws logs put-retention-policy \
  --log-group-name /aws/containerinsights/<cluster-name>/application \
  --retention-in-days 7

# Set 30-day retention for production
aws logs put-retention-policy \
  --log-group-name /aws/containerinsights/<cluster-name>/application \
  --retention-in-days 30
```

### 4. Monitoring Strategy

- **Baseline First**: Establish performance baselines
- **Create Alarms**: Set up CloudWatch alarms for critical metrics
- **Custom Dashboards**: Create team-specific dashboards
- **Save Queries**: Save frequently used CloudWatch Insights queries

```bash
# Create CloudWatch alarm for high CPU
aws cloudwatch put-metric-alarm \
  --alarm-name eks-high-cpu \
  --alarm-description "Alert when cluster CPU exceeds 80%" \
  --metric-name cluster_node_cpu_utilization \
  --namespace ContainerInsights \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ClusterName,Value=<cluster-name>
```

### 5. Operational Best Practices

- **Regular Updates**: Keep agents updated with latest manifests
- **Monitoring the Monitors**: Alert on agent failures
- **Documentation**: Document customizations
- **Test Changes**: Test in non-production first
- **Backup ConfigMaps**: Keep copies of configurations

```bash
# Backup all monitoring configs
kubectl get all,configmap,secret -n amazon-cloudwatch -o yaml > monitoring-backup.yaml

# Monitor agent health
kubectl get pods -n amazon-cloudwatch -w
```

### 6. High Availability

- **DaemonSet Mode**: Ensures coverage on all nodes
- **Health Checks**: Configure proper probes
- **Graceful Shutdown**: Set termination grace period
- **Update Strategy**: Use RollingUpdate

```yaml
# Add to DaemonSet spec
updateStrategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 1
```

### 7. Performance Tuning

- **Buffer Settings**: Tune Fluent Bit buffer configuration
- **Batch Size**: Adjust batch size for log shipping
- **Compression**: Enable compression for efficiency
- **Resource Allocation**: Size resources appropriately

### 8. Compliance and Auditing

- **Log Retention**: Meet compliance requirements
- **Encryption**: Enable encryption for CloudWatch Logs
- **Access Control**: Use IAM policies for CloudWatch access
- **Audit Trail**: Enable CloudTrail for CloudWatch API calls

```bash
# Enable encryption for log group
aws logs associate-kms-key \
  --log-group-name /aws/containerinsights/<cluster-name>/application \
  --kms-key-id <kms-key-arn>
```
