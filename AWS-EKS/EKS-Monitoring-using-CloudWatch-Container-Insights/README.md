# EKS Monitoring using CloudWatch Container Insights

## Overview

This project demonstrates how to implement comprehensive monitoring and observability for Amazon EKS clusters using CloudWatch Container Insights. Container Insights provides automated dashboards, metrics collection, and log aggregation for containerized applications running on EKS, enabling real-time visibility into cluster performance, resource utilization, and application health.

CloudWatch Container Insights collects, aggregates, and summarizes metrics and logs from your containerized applications and microservices. It provides diagnostic information such as container restart failures, CPU and memory utilization, and enables you to set CloudWatch alarms on metrics that Container Insights collects.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    EKS Cluster                             │ │
│  │                                                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │ │
│  │  │   Pod 1      │  │   Pod 2      │  │   Pod 3      │   │ │
│  │  │  (Nginx App) │  │  (Nginx App) │  │ (Your App)   │   │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │ │
│  │         │                  │                  │           │ │
│  │         └──────────────────┴──────────────────┘           │ │
│  │                            │                              │ │
│  │                            ▼                              │ │
│  │                 ┌──────────────────────┐                 │ │
│  │                 │  CloudWatch Agent    │                 │ │
│  │                 │    (DaemonSet)       │                 │ │
│  │                 │  - Metrics collector │                 │ │
│  │                 │  - Log aggregator    │                 │ │
│  │                 └──────────┬───────────┘                 │ │
│  │                            │                              │ │
│  └────────────────────────────┼──────────────────────────────┘ │
│                               │                                 │
│                               ▼                                 │
│                   ┌───────────────────────┐                     │
│                   │  CloudWatch Logs      │                     │
│                   │  - Container logs     │                     │
│                   │  - Application logs   │                     │
│                   │  - Performance logs   │                     │
│                   └───────────────────────┘                     │
│                               │                                 │
│                               ▼                                 │
│                   ┌───────────────────────┐                     │
│                   │  CloudWatch Metrics   │                     │
│                   │  - CPU utilization    │                     │
│                   │  - Memory usage       │                     │
│                   │  - Network I/O        │                     │
│                   │  - Disk I/O           │                     │
│                   └───────────┬───────────┘                     │
│                               │                                 │
│                               ▼                                 │
│                   ┌───────────────────────┐                     │
│                   │ Container Insights    │                     │
│                   │    Dashboards         │                     │
│                   │ - Performance metrics │                     │
│                   │ - Resource analytics  │                     │
│                   │ - Logs insights       │                     │
│                   └───────────────────────┘                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

1. **CloudWatch Agent (DaemonSet)**: Runs on every node to collect metrics and logs
2. **Fluent Bit or Fluentd**: Log router for container logs
3. **CloudWatch Container Insights**: Automated monitoring and dashboards
4. **CloudWatch Metrics**: Custom and standard metrics storage
5. **CloudWatch Logs**: Centralized log aggregation and analysis
6. **CloudWatch Alarms**: Automated alerting based on metric thresholds

## Prerequisites

Before implementing Container Insights monitoring, ensure you have:

### AWS Requirements
- **AWS Account** with appropriate permissions
- **IAM Roles** configured for EKS nodes with CloudWatch permissions
- **EKS Cluster** (version 1.21 or later recommended)
- **kubectl** configured to access your EKS cluster
- **AWS CLI** version 2.x installed and configured

### Required IAM Permissions
The EKS node IAM role must have the following policies:
- `CloudWatchAgentServerPolicy`
- `AmazonEC2ContainerRegistryReadOnly` (for pulling CloudWatch agent images)

### Tools and CLI
```bash
# AWS CLI
aws --version  # Should be 2.x or later

# kubectl
kubectl version --client

# eksctl (optional but recommended)
eksctl version
```

### Cluster Prerequisites
- EKS cluster must be running and accessible
- Nodes must have internet access (or VPC endpoints configured)
- Sufficient node resources for CloudWatch agent DaemonSet

## Project Structure

```
EKS-Monitoring-using-CloudWatch-Container-Insights/
├── README.md
└── kube-manifests/
    └── Sample-Nginx-App.yml        # Sample application for testing monitoring
```

### File Descriptions

#### Sample-Nginx-App.yml
Sample NGINX application deployment with proper resource requests and limits configured for accurate monitoring.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sample-nginx-deployment
  labels:
    app: sample-nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app: sample-nginx
  template:
    metadata:
      labels:
        app: sample-nginx
    spec:
      containers:
      - name: sample-nginx
        image: stacksimplify/kubenginx:1.0.0
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: "5m"
            memory: "5Mi"
          limits:
            cpu: "10m"
            memory: "10Mi"
```

## Usage

### Step 1: Enable Container Insights on EKS Cluster

#### Using AWS CLI
```bash
# Enable Container Insights for your cluster
aws eks update-cluster-config \
    --region us-east-1 \
    --name your-cluster-name \
    --logging '{"clusterLogging":[{"types":["api","audit","authenticator","controllerManager","scheduler"],"enabled":true}]}'

# Install CloudWatch Observability Add-on
aws eks create-addon \
    --cluster-name your-cluster-name \
    --addon-name amazon-cloudwatch-observability \
    --region us-east-1
```

#### Using eksctl
```bash
# Enable Container Insights during cluster creation
eksctl create cluster \
    --name your-cluster-name \
    --region us-east-1 \
    --enable-cloudwatch

# Enable Container Insights on existing cluster
eksctl utils update-cluster-logging \
    --enable-types all \
    --region us-east-1 \
    --cluster your-cluster-name \
    --approve
```

### Step 2: Install CloudWatch Agent (Alternative Manual Method)

If not using the managed add-on, install the CloudWatch agent manually:

```bash
# Create namespace for CloudWatch
kubectl create namespace amazon-cloudwatch

# Download and apply CloudWatch agent configuration
curl https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/quickstart/cwagent-fluentd-quickstart.yaml | \
  sed "s/{{cluster_name}}/your-cluster-name/;s/{{region_name}}/us-east-1/" | \
  kubectl apply -f -
```

### Step 3: Verify Installation

```bash
# Check CloudWatch agent pods are running
kubectl get pods -n amazon-cloudwatch

# Expected output:
# NAME                     READY   STATUS    RESTARTS   AGE
# cloudwatch-agent-xxxxx   1/1     Running   0          2m
# fluentd-cloudwatch-xxxxx 1/1     Running   0          2m

# Check DaemonSet status
kubectl get daemonset -n amazon-cloudwatch

# View CloudWatch agent logs
kubectl logs -n amazon-cloudwatch -l name=cloudwatch-agent
```

### Step 4: Deploy Sample Application

```bash
# Navigate to project directory
cd /Users/reza/home-lab/AWS-EKS/EKS-Monitoring-using-CloudWatch-Container-Insights

# Deploy sample NGINX application
kubectl apply -f kube-manifests/Sample-Nginx-App.yml

# Verify deployment
kubectl get deployments
kubectl get pods
kubectl get services

# Generate some traffic to create metrics
kubectl port-forward service/sample-nginx-service 8080:80

# In another terminal, generate traffic
for i in {1..100}; do curl http://localhost:8080; sleep 1; done
```

### Step 5: Access CloudWatch Container Insights

1. **Navigate to CloudWatch Console**
   ```bash
   # Open AWS Console
   https://console.aws.amazon.com/cloudwatch/
   ```

2. **Access Container Insights**
   - Go to CloudWatch → Container Insights
   - Select your cluster from the dropdown
   - Explore different views:
     - **Cluster View**: Overall cluster health
     - **Node View**: Individual node performance
     - **Pod View**: Pod-level metrics
     - **Service View**: Service performance
     - **Namespace View**: Namespace-level aggregation

3. **View Metrics and Logs**
   ```bash
   # View available metrics
   aws cloudwatch list-metrics \
       --namespace ContainerInsights \
       --dimensions Name=ClusterName,Value=your-cluster-name
   ```

### Step 6: Query Logs with CloudWatch Logs Insights

```sql
-- Find all container logs
fields @timestamp, @message
| filter kubernetes.namespace_name = "default"
| sort @timestamp desc
| limit 100

-- Find error logs
fields @timestamp, kubernetes.pod_name, @message
| filter @message like /error/i
| sort @timestamp desc
| limit 50

-- Analyze pod CPU usage
fields @timestamp, kubernetes.pod_name, container_cpu_usage_total
| filter kubernetes.namespace_name = "default"
| sort container_cpu_usage_total desc
| limit 20

-- Memory usage by pod
fields @timestamp, kubernetes.pod_name, container_memory_usage_bytes
| filter kubernetes.namespace_name = "default"
| stats max(container_memory_usage_bytes) by kubernetes.pod_name
```

## Configuration

### CloudWatch Agent Configuration

The CloudWatch agent can be customized using ConfigMap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cwagentconfig
  namespace: amazon-cloudwatch
data:
  cwagentconfig.json: |
    {
      "logs": {
        "metrics_collected": {
          "kubernetes": {
            "cluster_name": "your-cluster-name",
            "metrics_collection_interval": 60
          }
        },
        "force_flush_interval": 15
      },
      "metrics": {
        "namespace": "ContainerInsights",
        "metrics_collected": {
          "cpu": {
            "measurement": [
              {"name": "cpu_usage_total", "rename": "CPU_USAGE", "unit": "Percent"}
            ],
            "metrics_collection_interval": 60,
            "totalcpu": true
          },
          "memory": {
            "measurement": [
              {"name": "mem_used_percent", "rename": "MEMORY_USAGE", "unit": "Percent"}
            ],
            "metrics_collection_interval": 60
          },
          "disk": {
            "measurement": [
              {"name": "used_percent", "rename": "DISK_USAGE", "unit": "Percent"}
            ],
            "metrics_collection_interval": 60
          }
        }
      }
    }
```

### Resource Requests and Limits Best Practices

Always specify resource requests and limits for accurate monitoring:

```yaml
resources:
  requests:
    cpu: "100m"      # Minimum CPU required
    memory: "128Mi"  # Minimum memory required
  limits:
    cpu: "500m"      # Maximum CPU allowed
    memory: "512Mi"  # Maximum memory allowed
```

### Metric Retention Configuration

```bash
# Set log retention for Container Insights logs
aws logs put-retention-policy \
    --log-group-name /aws/containerinsights/your-cluster-name/application \
    --retention-in-days 7

aws logs put-retention-policy \
    --log-group-name /aws/containerinsights/your-cluster-name/performance \
    --retention-in-days 7
```

## Features

### 1. Automated Metrics Collection

Container Insights automatically collects the following metrics:

**Cluster Metrics:**
- CPU and memory utilization
- Network I/O
- Disk I/O
- Number of pods, nodes, and services

**Node Metrics:**
- CPU and memory utilization per node
- Disk usage
- Network throughput
- Pod count per node

**Pod Metrics:**
- CPU and memory usage per pod
- Container restart counts
- Pod status and health

**Namespace Metrics:**
- Aggregated resource usage by namespace
- Pod count per namespace

### 2. Log Aggregation and Analysis

**Container Logs:**
- Automatic collection of stdout/stderr
- Structured log parsing
- Log correlation with metrics

**System Logs:**
- Kubernetes API server logs
- Controller manager logs
- Scheduler logs
- Kubelet logs

### 3. Performance Monitoring Dashboards

Pre-built dashboards for:
- Cluster-level performance overview
- Node performance comparison
- Pod resource utilization trends
- Service performance metrics
- Namespace resource consumption

### 4. Anomaly Detection

- Automatic detection of unusual patterns
- CPU/memory spike identification
- Container crash detection
- Performance degradation alerts

### 5. Custom Metrics Support

```yaml
# Example: Adding custom application metrics
apiVersion: v1
kind: ConfigMap
metadata:
  name: custom-metrics-config
data:
  custom_metrics.conf: |
    [OUTPUT]
        Name cloudwatch_logs
        Match custom.*
        region us-east-1
        log_group_name /aws/containerinsights/cluster/custom
```

## Troubleshooting

### CloudWatch Agent Not Running

```bash
# Check agent pod status
kubectl get pods -n amazon-cloudwatch

# View agent logs
kubectl logs -n amazon-cloudwatch -l name=cloudwatch-agent --tail=100

# Check for permission issues
kubectl describe pod -n amazon-cloudwatch -l name=cloudwatch-agent

# Verify IAM role permissions
aws iam get-role --role-name <node-iam-role-name>
```

### Metrics Not Appearing in CloudWatch

```bash
# Verify metrics are being published
aws cloudwatch list-metrics \
    --namespace ContainerInsights \
    --region us-east-1

# Check agent configuration
kubectl get configmap cwagentconfig -n amazon-cloudwatch -o yaml

# Restart CloudWatch agent
kubectl rollout restart daemonset/cloudwatch-agent -n amazon-cloudwatch
```

### High CloudWatch Costs

```bash
# Reduce metrics collection interval
# Edit cwagentconfig ConfigMap and increase interval from 60s to 300s

# Disable specific metrics
# Modify CloudWatch agent configuration to exclude unnecessary metrics

# Adjust log retention
aws logs put-retention-policy \
    --log-group-name /aws/containerinsights/your-cluster/application \
    --retention-in-days 3
```

### Logs Not Appearing

```bash
# Check Fluent Bit/Fluentd status
kubectl get pods -n amazon-cloudwatch -l k8s-app=fluentd-cloudwatch

# View Fluent Bit logs
kubectl logs -n amazon-cloudwatch -l k8s-app=fluentd-cloudwatch

# Verify log groups exist
aws logs describe-log-groups \
    --log-group-name-prefix /aws/containerinsights/
```

### DaemonSet Pods Pending

```bash
# Check node resources
kubectl describe nodes

# Verify DaemonSet tolerations
kubectl get daemonset cloudwatch-agent -n amazon-cloudwatch -o yaml

# Check for node taints
kubectl get nodes -o custom-columns=NAME:.metadata.name,TAINTS:.spec.taints
```

## Best Practices

### 1. Resource Configuration

```yaml
# Always set resource requests and limits
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```

### 2. Metric Collection Optimization

- **Adjust Collection Intervals**: Set appropriate intervals based on monitoring needs
  - Production critical apps: 30-60 seconds
  - Development environments: 120-300 seconds
- **Selective Metric Collection**: Only collect metrics you actually use
- **Use Metric Filters**: Filter metrics at collection time to reduce costs

### 3. Log Management

```bash
# Set appropriate retention periods
# Production: 7-30 days
# Development: 1-7 days
# Testing: 1-3 days

aws logs put-retention-policy \
    --log-group-name /aws/containerinsights/cluster/application \
    --retention-in-days 7
```

### 4. Cost Optimization

- **Use CloudWatch Metric Streams**: For high-volume metrics, consider streaming to S3
- **Implement Log Sampling**: Sample high-volume logs instead of collecting all
- **Archive Old Logs**: Export to S3 for long-term storage
- **Use Contributor Insights**: Identify top contributors to costs

```bash
# Export logs to S3 for archival
aws logs create-export-task \
    --log-group-name /aws/containerinsights/cluster/application \
    --from $(date -d '30 days ago' +%s)000 \
    --to $(date +%s)000 \
    --destination s3-bucket-name \
    --destination-prefix container-insights/
```

### 5. Alerting Strategy

```yaml
# Example: CloudWatch Alarm for high CPU usage
aws cloudwatch put-metric-alarm \
    --alarm-name eks-high-cpu \
    --alarm-description "Alert when CPU exceeds 80%" \
    --metric-name pod_cpu_utilization \
    --namespace ContainerInsights \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --dimensions Name=ClusterName,Value=your-cluster
```

### 6. Security Best Practices

- **Use IAM Roles for Service Accounts (IRSA)**: Avoid using node IAM roles
- **Encrypt Logs at Rest**: Enable encryption for CloudWatch log groups
- **Implement Least Privilege**: Grant minimal required permissions
- **Audit Access**: Enable CloudTrail logging for CloudWatch API calls

### 7. Performance Monitoring

- Monitor CloudWatch agent resource usage
- Set up alerts for agent failures
- Regularly review and optimize metric collection
- Use CloudWatch Logs Insights for efficient querying

