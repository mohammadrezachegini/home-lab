# Microservices Distributed Tracing using AWS X-Ray on EKS

## Overview

This project demonstrates implementing comprehensive distributed tracing for microservices on Amazon EKS using AWS X-Ray. Distributed tracing is essential for understanding request flows, identifying performance bottlenecks, and debugging issues in complex microservices architectures where a single user request may traverse multiple services.

AWS X-Ray provides end-to-end visibility into requests as they travel through your application, allowing you to analyze latency, identify errors, and understand service dependencies. This implementation shows how to instrument microservices, deploy the X-Ray daemon as a DaemonSet, and visualize traces in the AWS X-Ray console.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         User Request Flow                                 │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 │ 1. HTTPS Request
                                 │ Trace ID: 1-5e1234ab-12d3...
                                 │
                    ┌────────────▼────────────┐
                    │   Route 53 (DNS)        │
                    │  ums.rezaops.com        │
                    └────────────┬────────────┘
                                 │
                                 │ 2. Forward with Trace ID
                                 │
                    ┌────────────▼─────────────┐
                    │ Application Load         │
                    │    Balancer (ALB)        │
                    │  - SSL Termination       │
                    │  - Adds X-Ray headers    │
                    └────────────┬─────────────┘
                                 │
┌────────────────────────────────┼──────────────────────────────────────────┐
│                         EKS Cluster                                       │
│                                │                                           │
│                    ┌───────────▼──────────┐                               │
│                    │   Ingress            │                               │
│                    │  - Propagates Trace  │                               │
│                    └───────────┬──────────┘                               │
│                                │                                           │
│                                │ 3. Routes to Service                      │
│                                │                                           │
│         ┌──────────────────────┴──────────────────────┐                  │
│         │                                              │                  │
│  ┌──────▼───────────────┐                  ┌──────────▼──────────┐      │
│  │  User Management     │                  │   Notification      │      │
│  │   Microservice       │   4. Calls       │   Microservice      │      │
│  │  (X-Ray Instrumented)│──────────────────>│  (X-Ray Instrumented)│     │
│  │                      │   Notification   │                     │      │
│  │  ┌────────────────┐  │   Service        │  ┌──────────────┐  │      │
│  │  │ X-Ray SDK      │  │                  │  │ X-Ray SDK    │  │      │
│  │  │ - Segments     │  │                  │  │ - Subsegments│  │      │
│  │  │ - Annotations  │  │                  │  │ - Metadata   │  │      │
│  │  │ - Metadata     │  │                  │  └──────┬───────┘  │      │
│  │  └────────┬───────┘  │                  │         │          │      │
│  │           │          │                  │         │          │      │
│  │           │ 5. Send  │                  │         │ 6. Send  │      │
│  │           │ Segments │                  │         │ Segments │      │
│  │           │          │                  │         │          │      │
│  └───────────┼──────────┘                  └─────────┼──────────┘      │
│              │                                        │                  │
│              └────────────────┬───────────────────────┘                  │
│                               │                                          │
│                               │ UDP/TCP 2000                             │
│                               │                                          │
│                    ┌──────────▼────────────┐                            │
│                    │   X-Ray DaemonSet     │                            │
│                    │  (Runs on all nodes)  │                            │
│                    │                       │                            │
│  ┌─────────────────┼───────────────────────┼─────────────────────────┐ │
│  │ Node 1          │ Node 2                │ Node 3                  │ │
│  │ ┌─────────────┐ │ ┌─────────────┐       │ ┌─────────────┐        │ │
│  │ │  X-Ray      │ │ │  X-Ray      │       │ │  X-Ray      │        │ │
│  │ │  Daemon Pod │ │ │  Daemon Pod │       │ │  Daemon Pod │        │ │
│  │ │             │ │ │             │       │ │             │        │ │
│  │ │ Port: 2000  │ │ │ Port: 2000  │       │ │ Port: 2000  │        │ │
│  │ │ (UDP/TCP)   │ │ │ (UDP/TCP)   │       │ │ (UDP/TCP)   │        │ │
│  │ └─────┬───────┘ │ └─────┬───────┘       │ └─────┬───────┘        │ │
│  └───────┼─────────┴───────┼───────────────┴───────┼────────────────┘ │
│          │                 │                       │                    │
│          └─────────────────┴───────────────────────┘                    │
│                            │                                            │
│                            │ 7. Batch and Forward                       │
│                            │                                            │
└────────────────────────────┼────────────────────────────────────────────┘
                             │
                             │ HTTPS
                             │
                  ┌──────────▼──────────┐
                  │   AWS X-Ray         │
                  │   Service           │
                  │                     │
                  │  ┌───────────────┐  │
                  │  │ Trace Index   │  │
                  │  │ - Service Map │  │
                  │  │ - Segments    │  │
                  │  │ - Analytics   │  │
                  │  └───────────────┘  │
                  │                     │
                  │  ┌───────────────┐  │
                  │  │ Trace Details │  │
                  │  │ - Timeline    │  │
                  │  │ - Latency     │  │
                  │  │ - Errors      │  │
                  │  │ - Annotations │  │
                  │  └───────────────┘  │
                  └─────────────────────┘
                             │
                             │ 8. View and Analyze
                             │
                  ┌──────────▼──────────┐
                  │  X-Ray Console      │
                  │  - Service Map      │
                  │  - Traces           │
                  │  - Analytics        │
                  │  - Insights         │
                  └─────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│                         Trace Structure                                   │
│                                                                            │
│  Trace ID: 1-5e1234ab-12d3...                                             │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │ Segment: User Management Service                                     ││
│  │ Start: 10:30:00.100  Duration: 245ms                                 ││
│  │                                                                       ││
│  │  ┌────────────────────────────────────────────────────────────────┐ ││
│  │  │ Subsegment: MySQL Query                                        │ ││
│  │  │ Start: 10:30:00.120  Duration: 85ms                            │ ││
│  │  │ Annotations: {query: "SELECT * FROM users", rows: 5}           │ ││
│  │  └────────────────────────────────────────────────────────────────┘ ││
│  │                                                                       ││
│  │  ┌────────────────────────────────────────────────────────────────┐ ││
│  │  │ Subsegment: HTTP Call to Notification Service                  │ ││
│  │  │ Start: 10:30:00.210  Duration: 130ms                           │ ││
│  │  │ Annotations: {endpoint: "/notification/send"}                  │ ││
│  │  └────────────────────────────────────────────────────────────────┘ ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │ Segment: Notification Service                                        ││
│  │ Start: 10:30:00.210  Duration: 130ms                                 ││
│  │                                                                       ││
│  │  ┌────────────────────────────────────────────────────────────────┐ ││
│  │  │ Subsegment: AWS SES Email Send                                 │ ││
│  │  │ Start: 10:30:00.220  Duration: 115ms                           │ ││
│  │  │ Annotations: {recipient: "user@example.com", status: "sent"}   │ ││
│  │  └────────────────────────────────────────────────────────────────┘ ││
│  └──────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────┘
```

### Key Components

1. **X-Ray Daemon DaemonSet**: Runs on every node to collect trace data
2. **X-Ray SDK**: Application-level instrumentation in microservices
3. **Trace Segments**: Individual service request records
4. **Subsegments**: Downstream calls and operations within a service
5. **Annotations**: Indexed key-value pairs for filtering traces
6. **Metadata**: Non-indexed additional trace information
7. **Service Map**: Visual representation of service dependencies

## Prerequisites

### AWS Requirements
- **EKS Cluster** running (version 1.21 or later)
- **IAM Role** for X-Ray daemon with appropriate permissions
- **Amazon RDS MySQL** instance configured
- **AWS SES** configured for email notifications
- **ACM Certificate** for SSL/TLS
- **Route53 Hosted Zone** for domain

### IAM Permissions for X-Ray

Create IAM policy for X-Ray daemon:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords",
        "xray:GetSamplingRules",
        "xray:GetSamplingTargets",
        "xray:GetSamplingStatisticSummaries"
      ],
      "Resource": "*"
    }
  ]
}
```

### Create IAM Role for Service Account (IRSA)

```bash
# Create OIDC provider (if not already created)
eksctl utils associate-iam-oidc-provider \
  --region us-east-1 \
  --cluster eksdemo1 \
  --approve

# Create IAM policy
aws iam create-policy \
  --policy-name AWSXRayDaemonWriteAccess \
  --policy-document file://xray-policy.json

# Create service account with IAM role
eksctl create iamserviceaccount \
  --name xray-daemon \
  --namespace default \
  --cluster eksdemo1 \
  --attach-policy-arn arn:aws:iam::<AWS_ACCOUNT_ID>:policy/AWSXRayDaemonWriteAccess \
  --approve \
  --override-existing-serviceaccounts
```

### Kubernetes Prerequisites
- **AWS Load Balancer Controller** installed
- **ExternalDNS** configured
- **kubectl** configured with cluster access

### Required Tools
```bash
# AWS CLI
aws --version

# kubectl
kubectl version --client

# eksctl
eksctl version
```

## Project Structure

```
Microservices-Distributed-Tracing-using-AWS-XRay-on-EKS/
├── README.md
├── kube-manifests/
│   ├── 01-XRay-DaemonSet/
│   │   └── xray-k8s-daemonset.yml
│   └── 02-Applications/
│       ├── 01-MySQL-externalName-Service.yml
│       ├── 02-UserManagementMicroservice-Deployment.yml
│       ├── 03-UserManagement-NodePort-Service.yml
│       ├── 04-NotificationMicroservice-Deployment.yml
│       ├── 05-NotificationMicroservice-SMTP-externalName-Service.yml
│       ├── 06-NotificationMicroservice-ClusterIP-Service.yml
│       └── 07-ALB-Ingress-SSL-Redirect-ExternalDNS.yml
└── AWS-EKS-Masterclass-Microservices.postman_collection.json
```

### File Descriptions

| File | Description |
|------|-------------|
| `xray-k8s-daemonset.yml` | X-Ray daemon configuration with ServiceAccount, DaemonSet, ConfigMap, and Service |
| `02-UserManagementMicroservice-Deployment.yml` | User service with X-Ray SDK integration |
| `04-NotificationMicroservice-Deployment.yml` | Notification service with X-Ray SDK (v4.0.0-AWS-XRay) |
| Other manifests | Supporting infrastructure (same as Microservices-Deployment-on-EKS) |

## Usage

### Step 1: Deploy X-Ray Daemon

```bash
# Navigate to X-Ray daemon directory
cd /Users/reza/home-lab/AWS-EKS/Microservices-Distributed-Tracing-using-AWS-XRay-on-EKS/kube-manifests/01-XRay-DaemonSet

# Update IAM role ARN in xray-k8s-daemonset.yml
# Replace: arn:aws:iam::381492238320:role/eksctl-eksdemo1-addon-iamserviceaccount-defau-Role1-ToPV2jDJIpmA
# With your actual IAM role ARN

# Deploy X-Ray daemon
kubectl apply -f xray-k8s-daemonset.yml

# Verify deployment
kubectl get daemonset xray-daemon
kubectl get pods -l app=xray-daemon

# Check daemon logs
kubectl logs -l app=xray-daemon --tail=50

# Expected output:
# 2024-01-15T10:30:00Z [Info] Initializing AWS X-Ray daemon
# 2024-01-15T10:30:01Z [Info] Using buffer memory limit of 24 MB
# 2024-01-15T10:30:01Z [Info] Listening on address 0.0.0.0:2000
```

**X-Ray DaemonSet Configuration:**

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: xray-daemon
  namespace: default
spec:
  selector:
    matchLabels:
      app: xray-daemon
  template:
    metadata:
      labels:
        app: xray-daemon
    spec:
      serviceAccountName: xray-daemon
      containers:
      - name: xray-daemon
        image: amazon/aws-xray-daemon:3.3.8
        command: ["/usr/bin/xray", "-c", "/aws/xray/config.yaml"]
        resources:
          requests:
            cpu: 256m
            memory: 32Mi
          limits:
            cpu: 512m
            memory: 64Mi
        ports:
        - name: xray-ingest
          containerPort: 2000
          hostPort: 2000
          protocol: UDP
        - name: xray-tcp
          containerPort: 2000
          hostPort: 2000
          protocol: TCP
```

### Step 2: Verify X-Ray Daemon Connectivity

```bash
# Check X-Ray service
kubectl get svc xray-service

# Test UDP connectivity from a test pod
kubectl run test-xray --image=busybox --rm -it --restart=Never -- \
  sh -c "echo 'test' | nc -u xray-service.default.svc.cluster.local 2000"

# Verify daemon can reach X-Ray API
kubectl exec -it <xray-daemon-pod> -- \
  curl -I https://xray.us-east-1.amazonaws.com
```

### Step 3: Deploy Microservices with X-Ray SDK

```bash
# Navigate to applications directory
cd /Users/reza/home-lab/AWS-EKS/Microservices-Distributed-Tracing-using-AWS-XRay-on-EKS/kube-manifests/02-Applications

# Create database secret
kubectl create secret generic mysql-db-password \
  --from-literal=db-password=your-db-password

# Deploy all services
kubectl apply -f 01-MySQL-externalName-Service.yml
kubectl apply -f 02-UserManagementMicroservice-Deployment.yml
kubectl apply -f 03-UserManagement-NodePort-Service.yml
kubectl apply -f 04-NotificationMicroservice-Deployment.yml
kubectl apply -f 05-NotificationMicroservice-SMTP-externalName-Service.yml
kubectl apply -f 06-NotificationMicroservice-ClusterIP-Service.yml
kubectl apply -f 07-ALB-Ingress-SSL-Redirect-ExternalDNS.yml

# Verify all pods are running
kubectl get pods
kubectl get svc
kubectl get ingress

# Check application logs for X-Ray initialization
kubectl logs -l app=usermgmt-restapp | grep -i xray
kubectl logs -l app=notification-restapp | grep -i xray
```

**Note**: The microservices must be instrumented with X-Ray SDK. The notification service uses image version `4.0.0-AWS-XRay` which includes X-Ray instrumentation.

### Step 4: Configure X-Ray SDK in Applications

For applications not pre-instrumented, add X-Ray SDK:

**Java/Spring Boot Example:**

```java
// Add dependency to pom.xml
<dependency>
    <groupId>com.amazonaws</groupId>
    <artifactId>aws-xray-recorder-sdk-spring</artifactId>
    <version>2.14.0</version>
</dependency>

// Configure X-Ray in application
import com.amazonaws.xray.javax.servlet.AWSXRayServletFilter;
import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.AWSXRayRecorderBuilder;
import com.amazonaws.xray.plugins.EKSPlugin;

@Configuration
public class XRayConfig {

    @Bean
    public Filter TracingFilter() {
        return new AWSXRayServletFilter("UserManagementService");
    }

    @PostConstruct
    public void init() {
        AWSXRayRecorderBuilder builder = AWSXRayRecorderBuilder.standard()
            .withPlugin(new EKSPlugin());
        AWSXRay.setGlobalRecorder(builder.build());
    }
}
```

**Environment Variables for X-Ray:**

```yaml
env:
- name: AWS_XRAY_DAEMON_ADDRESS
  value: "xray-service.default.svc.cluster.local:2000"
- name: AWS_XRAY_CONTEXT_MISSING
  value: "LOG_ERROR"
- name: AWS_XRAY_TRACING_NAME
  value: "UserManagementService"
```

### Step 5: Generate Traffic and Create Traces

```bash
# Get ingress URL
INGRESS_URL=$(kubectl get ingress eks-microservices-demo -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "Ingress URL: https://ums.rezaops.com"

# Generate test traffic
for i in {1..50}; do
  echo "Request $i"

  # Create user
  curl -X POST https://ums.rezaops.com/usermgmt/user \
    -H "Content-Type: application/json" \
    -d "{
      \"username\": \"user$i\",
      \"email\": \"user$i@example.com\",
      \"firstname\": \"Test\",
      \"lastname\": \"User$i\"
    }"

  # Get users
  curl https://ums.rezaops.com/usermgmt/users

  sleep 2
done

# Generate some errors for trace analysis
curl -X POST https://ums.rezaops.com/usermgmt/user \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'

# Trigger notification flow
curl -X POST https://ums.rezaops.com/usermgmt/notification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "subject": "Test Notification",
    "body": "This is a test message"
  }'
```

### Step 6: View Traces in X-Ray Console

```bash
# Open AWS X-Ray Console
# URL: https://console.aws.amazon.com/xray/home

# Or use AWS CLI to get traces
aws xray get-trace-summaries \
  --start-time $(date -u -d '30 minutes ago' +%s) \
  --end-time $(date -u +%s) \
  --region us-east-1

# Get specific trace details
TRACE_ID="1-5e1234ab-12d3..."  # Replace with actual trace ID
aws xray batch-get-traces \
  --trace-ids $TRACE_ID \
  --region us-east-1
```

**In X-Ray Console:**

1. **Service Map View**
   - Navigate to: X-Ray → Service map
   - See visual representation of service dependencies
   - Identify latency and errors between services

2. **Traces View**
   - Navigate to: X-Ray → Traces
   - Filter by:
     - Time range
     - Service name
     - Response time
     - HTTP status code
     - Annotations

3. **Analytics View**
   - Navigate to: X-Ray → Analytics
   - Create custom queries
   - Analyze latency distributions
   - Identify error patterns

### Step 7: Add Custom Annotations and Metadata

**Annotations (Indexed - Searchable):**

```java
import com.amazonaws.xray.AWSXRay;

// Add annotations
AWSXRay.getCurrentSegment().putAnnotation("userId", userId);
AWSXRay.getCurrentSegment().putAnnotation("operation", "createUser");
AWSXRay.getCurrentSegment().putAnnotation("region", "us-east-1");

// Search in X-Ray console: annotation.userId = "12345"
```

**Metadata (Non-indexed - For context):**

```java
// Add metadata
Map<String, Object> metadata = new HashMap<>();
metadata.put("requestBody", requestJson);
metadata.put("responseCode", 200);
metadata.put("timestamp", System.currentTimeMillis());

AWSXRay.getCurrentSegment().putMetadata("request", metadata);
```

### Step 8: Create Subsegments for Detailed Tracing

```java
import com.amazonaws.xray.entities.Subsegment;

// Database operation subsegment
Subsegment subsegment = AWSXRay.beginSubsegment("MySQL-Query");
try {
    subsegment.putAnnotation("query", "SELECT * FROM users");
    subsegment.putMetadata("table", "users");

    // Execute database query
    List<User> users = userRepository.findAll();

    subsegment.putMetadata("rowCount", users.size());
} catch (Exception e) {
    subsegment.addException(e);
    throw e;
} finally {
    AWSXRay.endSubsegment();
}

// HTTP call subsegment
Subsegment httpSubsegment = AWSXRay.beginSubsegment("HTTP-Call-NotificationService");
try {
    httpSubsegment.putAnnotation("endpoint", "/notification/send");
    httpSubsegment.putAnnotation("method", "POST");

    // Make HTTP call
    ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

    httpSubsegment.putMetadata("statusCode", response.getStatusCodeValue());
} catch (Exception e) {
    httpSubsegment.addException(e);
    throw e;
} finally {
    AWSXRay.endSubsegment();
}
```

### Step 9: Monitor and Analyze Traces

```bash
# View X-Ray daemon logs
kubectl logs -l app=xray-daemon --tail=100 -f

# Check trace submission rate
kubectl logs -l app=xray-daemon | grep "Successfully sent batch"

# Monitor daemon resource usage
kubectl top pods -l app=xray-daemon

# Check for errors
kubectl logs -l app=xray-daemon | grep -i error

# Verify IAM permissions
kubectl logs -l app=xray-daemon | grep -i "access denied\|forbidden"
```

## Configuration

### X-Ray Daemon Configuration

**ConfigMap:**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: xray-config
  namespace: default
data:
  config.yaml: |-
    TotalBufferSizeMB: 24        # Memory buffer for segments
    Socket:
      UDPAddress: "0.0.0.0:2000" # Listen on all interfaces
      TCPAddress: "0.0.0.0:2000"
    Version: 2
    # Optional: Sampling configuration
    # LocalSampling:
    #   Rules:
    #   - Description: "Sample 10% of requests"
    #     Service: "*"
    #     Method: "*"
    #     Path: "*"
    #     FixedRate: 0.1
```

### X-Ray Service Configuration

```yaml
apiVersion: v1
kind: Service
metadata:
  name: xray-service
  namespace: default
spec:
  selector:
    app: xray-daemon
  clusterIP: None  # Headless service
  ports:
  - name: xray-ingest
    port: 2000
    protocol: UDP
  - name: xray-tcp
    port: 2000
    protocol: TCP
```

### Sampling Rules

Control trace sampling to manage costs:

```json
{
  "version": 2,
  "rules": [
    {
      "description": "Sample all errors",
      "service_name": "*",
      "http_method": "*",
      "url_path": "*",
      "fixed_target": 0,
      "rate": 1.0,
      "attributes": {
        "http.status_code": "5**"
      }
    },
    {
      "description": "Sample 10% of normal traffic",
      "service_name": "*",
      "http_method": "*",
      "url_path": "*",
      "fixed_target": 1,
      "rate": 0.1
    }
  ],
  "default": {
    "fixed_target": 1,
    "rate": 0.05
  }
}
```

### Resource Allocation

**Development:**
```yaml
resources:
  requests:
    cpu: 256m
    memory: 32Mi
  limits:
    cpu: 512m
    memory: 64Mi
```

**Production:**
```yaml
resources:
  requests:
    cpu: 512m
    memory: 64Mi
  limits:
    cpu: 1000m
    memory: 128Mi
```

## Features

### 1. Service Map Visualization

Automatically generates visual representation of:
- Service dependencies
- Traffic flow between services
- Latency at each hop
- Error rates per service
- Request volume

**Benefits:**
- Identify bottlenecks visually
- Understand service interactions
- Detect circular dependencies
- Plan capacity and scaling

### 2. End-to-End Request Tracing

Track individual requests across:
- Multiple microservices
- Database calls
- External API calls
- Message queues
- Cache operations

**Trace Timeline:**
```
User Request → ALB → UserMgmt Service → MySQL Query
                                      → Notification Service → AWS SES
```

### 3. Performance Analysis

Analyze:
- **Latency Distribution**: P50, P90, P95, P99 percentiles
- **Service Latency**: Time spent in each service
- **External Call Latency**: Database, AWS services, third-party APIs
- **Bottleneck Identification**: Slowest operations

**Example Query:**
```
Response time > 500ms AND http.status = 200
```

### 4. Error Tracking and Debugging

Identify:
- Error rates per service
- Exception stack traces
- Failed subsegments
- Fault propagation paths

**Example Filters:**
```
http.status = 500
error = true
fault = true
throttle = true
```

### 5. Annotations for Filtering

Add custom searchable fields:

```java
// Business context
AWSXRay.getCurrentSegment().putAnnotation("customerId", customerId);
AWSXRay.getCurrentSegment().putAnnotation("orderValue", orderValue);
AWSXRay.getCurrentSegment().putAnnotation("region", "us-east-1");

// Feature flags
AWSXRay.getCurrentSegment().putAnnotation("featureEnabled", true);

// Search in X-Ray: annotation.customerId = "12345"
```

### 6. Metadata for Context

Add detailed non-searchable information:

```java
Map<String, Object> requestMetadata = new HashMap<>();
requestMetadata.put("headers", headers);
requestMetadata.put("queryParams", params);
requestMetadata.put("requestBody", body);

AWSXRay.getCurrentSegment().putMetadata("request", requestMetadata);
```

### 7. Integration with AWS Services

Automatic tracing for:
- **AWS SDK calls**: S3, DynamoDB, SQS, SNS, etc.
- **RDS queries**: MySQL, PostgreSQL
- **ElastiCache**: Redis, Memcached
- **AWS Lambda**: Downstream Lambda invocations
- **API Gateway**: Upstream API calls

### 8. CloudWatch Integration

```bash
# Create CloudWatch alarm for high latency
aws cloudwatch put-metric-alarm \
  --alarm-name high-latency-notification-service \
  --alarm-description "Alert when p95 latency > 500ms" \
  --metric-name ResponseTime \
  --namespace AWS/X-Ray \
  --statistic Average \
  --period 300 \
  --threshold 500 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

## Troubleshooting

### X-Ray Daemon Not Starting

```bash
# Check DaemonSet status
kubectl get daemonset xray-daemon
kubectl describe daemonset xray-daemon

# Check pod events
kubectl get pods -l app=xray-daemon
kubectl describe pod <xray-daemon-pod>

# View logs
kubectl logs -l app=xray-daemon

# Common issues:
# 1. IAM role not attached
kubectl get sa xray-daemon -o yaml | grep eks.amazonaws.com/role-arn

# 2. Image pull issues
kubectl describe pod <xray-daemon-pod> | grep -A 5 "Events"

# 3. Resource constraints
kubectl describe node | grep -A 5 "Allocated resources"
```

### Traces Not Appearing in X-Ray Console

```bash
# Check daemon is receiving traces
kubectl logs -l app=xray-daemon | grep "Sending batch"

# Verify IAM permissions
aws xray put-trace-segments \
  --trace-segment-documents '{"trace_id":"test","id":"test","start_time":1.0}'

# Check application SDK configuration
kubectl logs <app-pod> | grep -i xray

# Verify daemon endpoint
kubectl exec -it <app-pod> -- env | grep XRAY

# Test connectivity to X-Ray service
kubectl run test-xray --image=curlimages/curl --rm -it --restart=Never -- \
  curl -v xray-service.default.svc.cluster.local:2000

# Check firewall/security groups
kubectl get pods -o wide
# Verify pod can reach daemon on port 2000
```

### High X-Ray Daemon Memory Usage

```bash
# Check current usage
kubectl top pods -l app=xray-daemon

# View daemon stats
kubectl logs -l app=xray-daemon | grep "memory\|buffer"

# Adjust buffer size in ConfigMap
kubectl edit configmap xray-config
# Reduce TotalBufferSizeMB from 24 to 16

# Restart daemon
kubectl rollout restart daemonset xray-daemon

# Increase sampling rate to reduce volume
# Update sampling rules in X-Ray console
```

### Incomplete Traces

```bash
# Check for missing segments
# In X-Ray Console: Look for "Pending" segments

# Verify all services have X-Ray SDK
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].image}{"\n"}{end}'

# Check trace context propagation
kubectl logs <app-pod> | grep "X-Amzn-Trace-Id"

# Ensure HTTP headers are forwarded
# Add trace header forwarding in ingress
```

### Sampling Rate Too High/Low

```bash
# View current sampling rules
aws xray get-sampling-rules

# Update sampling configuration
aws xray update-sampling-rule \
  --rule-name "Default" \
  --sampling-rule '{
    "RuleName": "Default",
    "ResourceARN": "*",
    "Priority": 10000,
    "FixedRate": 0.05,
    "ReservoirSize": 1,
    "ServiceName": "*",
    "ServiceType": "*",
    "Host": "*",
    "HTTPMethod": "*",
    "URLPath": "*",
    "Version": 1
  }'
```

### IAM Permission Errors

```bash
# Check daemon logs for permission errors
kubectl logs -l app=xray-daemon | grep -i "access denied\|unauthorized"

# Verify IAM role trust policy
aws iam get-role --role-name <xray-daemon-role>

# Verify policy attachment
aws iam list-attached-role-policies --role-name <xray-daemon-role>

# Test permissions
aws xray put-trace-segments \
  --trace-segment-documents '[]' \
  --region us-east-1
```

## Best Practices

### 1. Strategic Instrumentation

**What to Trace:**
- ✅ All incoming requests (entry points)
- ✅ Service-to-service calls
- ✅ Database queries
- ✅ External API calls
- ✅ Expensive operations (> 100ms)
- ❌ Internal utility functions
- ❌ High-frequency background jobs (use sampling)

### 2. Effective Use of Annotations

```java
// Good annotations (indexed, searchable)
AWSXRay.getCurrentSegment().putAnnotation("customerId", "12345");
AWSXRay.getCurrentSegment().putAnnotation("operationType", "purchase");
AWSXRay.getCurrentSegment().putAnnotation("environment", "production");

// Avoid (use metadata instead)
// AWSXRay.getCurrentSegment().putAnnotation("fullRequestBody", largeJson);
```

**Annotation Limits:**
- Maximum 50 annotations per segment
- Keys limited to 500 characters
- Values limited to 1000 characters

### 3. Cost Optimization

**Sampling Strategy:**

```yaml
# High-value traces: 100% sampling
- Errors (5xx status codes)
- Slow requests (> 1s)
- New feature rollouts

# Normal traffic: 5-10% sampling
- Successful requests
- Fast requests (< 100ms)

# Low-value traces: 1% sampling
- Health checks
- Monitoring probes
- Internal administrative calls
```

**Cost Calculation:**
```
Cost per million traces recorded: $5.00
Cost per million traces scanned: $0.50

Example:
1M requests/month × 10% sampling = 100K traces
Recording cost: $0.50
Scanning cost (1% of traces): $0.005
Total: ~$0.51/month
```

### 4. Sampling Configuration

```json
{
  "version": 2,
  "rules": [
    {
      "description": "High priority - errors",
      "service_name": "*",
      "http_method": "*",
      "url_path": "*",
      "fixed_target": 0,
      "rate": 1.0,
      "attributes": {
        "http.status_code": "5**"
      }
    },
    {
      "description": "Medium priority - slow requests",
      "service_name": "*",
      "http_method": "*",
      "url_path": "*",
      "fixed_target": 1,
      "rate": 0.5,
      "attributes": {
        "response_time": "> 1000"
      }
    },
    {
      "description": "Low priority - normal traffic",
      "service_name": "*",
      "http_method": "*",
      "url_path": "*",
      "fixed_target": 1,
      "rate": 0.05
    }
  ]
}
```

### 5. Performance Impact Mitigation

**X-Ray Daemon Resource Allocation:**

```yaml
# Start conservative
resources:
  requests:
    cpu: 256m
    memory: 32Mi
  limits:
    cpu: 512m
    memory: 64Mi

# Scale based on load
# For high-traffic clusters (> 1000 req/s):
resources:
  requests:
    cpu: 512m
    memory: 64Mi
  limits:
    cpu: 1000m
    memory: 128Mi
```

**Application SDK Overhead:**
- Expect 1-2% CPU overhead
- Negligible memory impact
- Network: ~1KB per trace segment

### 6. Security Best Practices

**IAM Least Privilege:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
```

**Data Sanitization:**

```java
// Sanitize sensitive data before tracing
public void traceRequest(Request request) {
    Request sanitized = sanitize(request);
    AWSXRay.getCurrentSegment().putMetadata("request", sanitized);
}

private Request sanitize(Request request) {
    // Remove passwords, tokens, PII
    request.setPassword("***");
    request.setCreditCard("***");
    return request;
}
```

### 7. Correlation with Other Tools

**Link to CloudWatch Logs:**

```java
import org.slf4j.MDC;

// Add trace ID to logs
String traceId = AWSXRay.getGlobalRecorder()
    .getTraceEntity()
    .getTraceId()
    .toString();

MDC.put("traceId", traceId);
log.info("Processing request"); // Log includes traceId

// Search CloudWatch Logs by trace ID
```

**Integration with Prometheus:**

```java
// Export X-Ray metrics to Prometheus
@Component
public class XRayMetricsExporter {
    private final Counter tracesRecorded = Counter.build()
        .name("xray_traces_recorded_total")
        .help("Total traces recorded")
        .register();

    public void recordTrace() {
        tracesRecorded.inc();
        // ... X-Ray tracing code
    }
}
```

### 8. Alert Configuration

```bash
# CloudWatch alarm for high error rate
aws cloudwatch put-metric-alarm \
  --alarm-name xray-high-error-rate \
  --alarm-description "Alert when error rate > 5%" \
  --metric-name ErrorRate \
  --namespace AWS/X-Ray \
  --statistic Average \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ServiceName,Value=UserManagementService

# Alarm for high latency
aws cloudwatch put-metric-alarm \
  --alarm-name xray-high-latency \
  --alarm-description "Alert when P95 latency > 500ms" \
  --metric-name Latency \
  --namespace AWS/X-Ray \
  --statistic p95 \
  --period 300 \
  --threshold 500 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```
