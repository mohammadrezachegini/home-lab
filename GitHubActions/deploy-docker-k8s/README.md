# Docker and Kubernetes Deployment

## Overview

This project demonstrates a complete CI/CD pipeline for building Docker images and deploying them to Kubernetes clusters using GitHub Actions. It showcases production-ready patterns for containerized application deployment, including Docker image building, registry authentication, image pushing, and Kubernetes resource management.

This workflow implements a two-stage deployment process: building and publishing Docker images to Docker Hub, followed by deploying those images to a Kubernetes cluster. This is a fundamental pattern for modern cloud-native application deployment and forms the basis for more advanced deployment strategies including blue-green deployments, canary releases, and GitOps workflows.

## GitHub Actions Concepts

### Multi-Job Workflows
Workflows can contain multiple jobs that run sequentially or in parallel. This workflow uses:
- **build-and-push**: Creates and publishes Docker image
- **deploy-to-k8s**: Deploys image to Kubernetes cluster
- **Job Dependencies**: `needs` keyword ensures proper execution order

### Docker Actions
Specialized actions for Docker operations:
- **docker/login-action**: Authenticates with Docker registries
- **docker/build-push-action**: Builds and pushes images (alternative approach)

### Kubernetes Integration
Actions for Kubernetes cluster management:
- **azure/setup-kubectl**: Installs kubectl CLI tool
- **KUBECONFIG**: Cluster authentication configuration

### Secrets Management
Secure storage for sensitive credentials:
- Docker Hub credentials
- Kubernetes cluster configuration
- Registry authentication tokens

### Artifact Management
Docker images as deployment artifacts:
- Built in one job
- Tagged for identification
- Deployed in another job
- Version tracking via tags

## Prerequisites

### Repository Requirements

1. **Dockerfile in Repository Root**:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --production
   COPY . .
   EXPOSE 3000
   CMD ["node", "app.js"]
   ```

2. **Kubernetes Manifests** (create `k8s/` directory):
   ```
   k8s/
   ├── deployment.yaml
   └── service.yaml
   ```

### Docker Hub Setup

1. **Create Docker Hub Account**: [hub.docker.com](https://hub.docker.com)
2. **Create Repository**: Create a repository named `my-app` (or change workflow)
3. **Generate Access Token**:
   - Go to Account Settings > Security
   - Click "New Access Token"
   - Name it "GitHub Actions"
   - Copy the token

### GitHub Secrets Configuration

Navigate to **Settings > Secrets and variables > Actions** and add:

```
DOCKER_USERNAME: your-dockerhub-username
DOCKER_PASSWORD: your-dockerhub-access-token (or password)
KUBECONFIG: (base64 encoded kubeconfig file content)
```

### Kubernetes Cluster Setup

You need access to a Kubernetes cluster. Options include:

#### Local Cluster (Development)
- **Minikube**: `minikube start`
- **Kind**: `kind create cluster`
- **Docker Desktop**: Enable Kubernetes in settings

#### Cloud Providers
- **AWS EKS**: Elastic Kubernetes Service
- **Google GKE**: Google Kubernetes Engine
- **Azure AKS**: Azure Kubernetes Service
- **DigitalOcean**: Managed Kubernetes

#### Get KUBECONFIG
```bash
# View your kubeconfig
cat ~/.kube/config

# Base64 encode for GitHub Secret
cat ~/.kube/config | base64
```

### kubectl Installation (Local Testing)
```bash
# macOS
brew install kubectl

# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Windows
choco install kubernetes-cli
```

## Project Structure

```
deploy-docker-k8s/
├── deploy-docker-k8s.yml       # Main workflow file
└── k8s/                        # Kubernetes manifests (create these)
    ├── deployment.yaml         # Deployment configuration
    └── service.yaml            # Service configuration
```

### Required Kubernetes Manifests

#### k8s/deployment.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: your-dockerhub-username/my-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### k8s/service.yaml
```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  type: LoadBalancer
  selector:
    app: my-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
```

## Workflow Files

### deploy-docker-k8s.yml

**Purpose**: Complete CI/CD pipeline for Docker image building and Kubernetes deployment.

**Trigger Events**:
- Push to `main` branch

**Jobs**:

#### 1. Build and Push Job

Builds Docker image and pushes to Docker Hub:

```yaml
build-and-push:
  runs-on: ubuntu-latest
  steps:
    - Checkout code
    - Log in to Docker Hub
    - Build Docker image
    - Push Docker image
```

**Detailed Steps**:

1. **Checkout Code**:
   ```yaml
   - name: Checkout code
     uses: actions/checkout@v4
   ```
   - Downloads repository code
   - Includes Dockerfile and application code
   - Required for Docker build context

2. **Docker Hub Authentication**:
   ```yaml
   - name: Log in to Docker Hub
     uses: docker/login-action@v2
     with:
       username: ${{ secrets.DOCKER_USERNAME }}
       password: ${{ secrets.DOCKER_PASSWORD }}
   ```
   - Authenticates with Docker Hub
   - Uses secrets for credentials
   - Enables image pushing

3. **Build Docker Image**:
   ```yaml
   - name: Build Docker image
     run: |
       docker build -t ${{ secrets.DOCKER_USERNAME }}/my-app:latest .
   ```
   - Builds image from Dockerfile in repo root
   - Tags with `latest` tag
   - Uses username from secrets for naming

4. **Push Docker Image**:
   ```yaml
   - name: Push Docker image
     run: |
       docker push ${{ secrets.DOCKER_USERNAME }}/my-app:latest
   ```
   - Uploads image to Docker Hub
   - Makes image available for deployment
   - Requires prior authentication

#### 2. Deploy to Kubernetes Job

Deploys the Docker image to Kubernetes cluster:

```yaml
deploy-to-k8s:
  needs: build-and-push
  runs-on: ubuntu-latest
  steps:
    - Setup kubectl
    - Authenticate with cluster
    - Apply Kubernetes manifests
```

**Detailed Steps**:

1. **Setup kubectl**:
   ```yaml
   - name: Setup Kubernetes context
     uses: azure/setup-kubectl@v3
     with:
       version: 'v1.27.1'
   ```
   - Installs kubectl CLI tool
   - Specifies kubectl version
   - Required for cluster communication

2. **Configure KUBECONFIG**:
   ```yaml
   - name: Set up KUBECONFIG
     env:
       KUBECONFIG: ${{ secrets.KUBECONFIG }}
     run: |
       mkdir -p ~/.kube
       echo "${{ secrets.KUBECONFIG }}" > ~/.kube/config
   ```
   - Creates kubectl configuration directory
   - Writes cluster credentials
   - Enables cluster authentication

3. **Deploy Application**:
   ```yaml
   - name: Apply Kubernetes manifests
     run: |
       kubectl apply -f k8s/deployment.yaml
       kubectl apply -f k8s/service.yaml
   ```
   - Applies deployment configuration
   - Creates or updates service
   - Kubernetes handles rolling update

## Usage

### Initial Setup

1. **Create Kubernetes Manifests**:
   ```bash
   mkdir k8s
   # Create deployment.yaml and service.yaml as shown above
   ```

2. **Create Dockerfile**:
   ```bash
   # Create Dockerfile in repository root
   ```

3. **Configure GitHub Secrets**:
   - Add DOCKER_USERNAME
   - Add DOCKER_PASSWORD
   - Add KUBECONFIG

4. **Update Image Name in Workflow**:
   ```yaml
   # Replace 'my-app' with your app name
   docker build -t ${{ secrets.DOCKER_USERNAME }}/your-app-name:latest .
   ```

5. **Update Kubernetes Manifests**:
   ```yaml
   # In k8s/deployment.yaml, update image:
   image: your-dockerhub-username/your-app-name:latest
   ```

### Triggering Deployment

1. **Commit and Push to Main**:
   ```bash
   git add .
   git commit -m "Deploy application"
   git push origin main
   ```

2. **Monitor Workflow**:
   - Go to Actions tab
   - Watch build-and-push job
   - Watch deploy-to-k8s job
   - Check for any errors

3. **Verify Deployment**:
   ```bash
   # Check deployment status
   kubectl get deployments

   # Check pods
   kubectl get pods

   # Check service
   kubectl get services

   # View application logs
   kubectl logs -l app=my-app

   # Get service URL (for LoadBalancer)
   kubectl get service my-app-service
   ```

### Manual Deployment (Testing)

Test deployment locally before CI/CD:

```bash
# Build image
docker build -t your-username/my-app:latest .

# Push to Docker Hub
docker login
docker push your-username/my-app:latest

# Apply to cluster
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Verify
kubectl get all
```

### Advanced Usage

#### Image Versioning with Git SHA
```yaml
- name: Build Docker image
  run: |
    docker build -t ${{ secrets.DOCKER_USERNAME }}/my-app:${{ github.sha }} .
    docker build -t ${{ secrets.DOCKER_USERNAME }}/my-app:latest .

- name: Push Docker image
  run: |
    docker push ${{ secrets.DOCKER_USERNAME }}/my-app:${{ github.sha }}
    docker push ${{ secrets.DOCKER_USERNAME }}/my-app:latest
```

Update deployment to use specific version:
```bash
kubectl set image deployment/my-app my-app=${{ secrets.DOCKER_USERNAME }}/my-app:${{ github.sha }}
```

#### Multi-Environment Deployment
```yaml
deploy-staging:
  needs: build-and-push
  environment: staging
  steps:
    - name: Deploy to staging
      run: |
        kubectl apply -f k8s/staging/ --namespace=staging

deploy-production:
  needs: deploy-staging
  environment: production
  steps:
    - name: Deploy to production
      run: |
        kubectl apply -f k8s/production/ --namespace=production
```

#### Using Kustomize
```yaml
- name: Deploy with Kustomize
  run: |
    kubectl apply -k k8s/overlays/production
```

#### Helm Charts
```yaml
- name: Deploy with Helm
  run: |
    helm upgrade --install my-app ./helm/my-app \
      --set image.tag=${{ github.sha }} \
      --namespace production
```

## Key Features

### 1. Automated Docker Image Building

Builds Docker images automatically on code changes:

```yaml
- name: Build Docker image
  run: |
    docker build -t ${{ secrets.DOCKER_USERNAME }}/my-app:latest .
```

**Benefits**:
- Consistent image builds
- No manual intervention
- Reproducible deployments
- Version tracking

### 2. Secure Registry Authentication

Uses GitHub Secrets for Docker Hub login:

```yaml
- name: Log in to Docker Hub
  uses: docker/login-action@v2
  with:
    username: ${{ secrets.DOCKER_USERNAME }}
    password: ${{ secrets.DOCKER_PASSWORD }}
```

**Security**:
- Credentials never exposed in logs
- Encrypted at rest
- Scoped access

### 3. Kubernetes Cluster Integration

Seamless kubectl integration:

```yaml
- uses: azure/setup-kubectl@v3
  with:
    version: 'v1.27.1'
```

**Features**:
- Specific kubectl version
- Cross-platform compatibility
- Cached for performance

### 4. Declarative Deployment

Uses Kubernetes manifests for infrastructure as code:

```yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

**Advantages**:
- Version controlled configuration
- Reproducible deployments
- Easy rollback
- GitOps ready

### 5. Job Dependencies

Ensures build completes before deployment:

```yaml
deploy-to-k8s:
  needs: build-and-push
```

**Guarantees**:
- Image exists before deployment
- Failed builds prevent deployment
- Clear workflow progression

### 6. Rolling Updates

Kubernetes handles zero-downtime deployments:

```yaml
# In deployment.yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

### 7. Health Checks

Ensures pods are healthy before routing traffic:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
readinessProbe:
  httpGet:
    path: /ready
    port: 3000
```

## Troubleshooting

### Docker Build Failures

**Problem**: Docker build fails in workflow.

**Solutions**:

1. **Test locally first**:
   ```bash
   docker build -t test:local .
   ```

2. **Check Dockerfile syntax**:
   ```bash
   docker build --dry-run -t test .
   ```

3. **Verify build context**:
   ```yaml
   - name: List files
     run: ls -la
   - name: Build
     run: docker build -t image:tag .
   ```

4. **Check for .dockerignore issues**:
   ```bash
   # Ensure required files aren't ignored
   cat .dockerignore
   ```

### Docker Push Failures

**Problem**: Image push fails with authentication error.

**Solutions**:

1. **Verify secrets are set**:
   - Check Settings > Secrets
   - Ensure DOCKER_USERNAME and DOCKER_PASSWORD exist

2. **Test credentials locally**:
   ```bash
   echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
   ```

3. **Check repository exists**:
   - Verify repository created on Docker Hub
   - Ensure repository name matches

4. **Use access token instead of password**:
   - Generate token at hub.docker.com > Account Settings > Security
   - Update DOCKER_PASSWORD secret with token

### Kubernetes Authentication Failures

**Problem**: kubectl commands fail with authentication errors.

**Solutions**:

1. **Verify KUBECONFIG secret**:
   ```bash
   # Locally test kubeconfig
   kubectl --kubeconfig=/path/to/config get nodes

   # Encode for GitHub
   cat /path/to/config | base64 -w 0  # Linux
   cat /path/to/config | base64        # macOS
   ```

2. **Check kubeconfig format**:
   ```yaml
   - name: Verify kubeconfig
     run: |
       cat ~/.kube/config
       kubectl config view
   ```

3. **Test cluster connectivity**:
   ```yaml
   - name: Test connection
     run: |
       kubectl cluster-info
       kubectl get nodes
   ```

4. **Check certificate expiry**:
   ```bash
   # Certificates might have expired
   kubectl config view --raw | grep certificate-authority-data
   ```

### Deployment Not Updating

**Problem**: New deployment doesn't reflect code changes.

**Solutions**:

1. **Verify image was pushed**:
   ```yaml
   - name: Verify push
     run: |
       docker pull ${{ secrets.DOCKER_USERNAME }}/my-app:latest
   ```

2. **Force pod recreation**:
   ```bash
   kubectl rollout restart deployment/my-app
   ```

3. **Use image digests instead of tags**:
   ```yaml
   # Tag 'latest' doesn't trigger update if image exists
   # Use SHA instead:
   docker build -t username/app:${{ github.sha }} .
   ```

4. **Check deployment status**:
   ```bash
   kubectl rollout status deployment/my-app
   kubectl describe deployment my-app
   ```

### Pods Not Starting

**Problem**: Pods stuck in pending or crash loop.

**Solutions**:

1. **Check pod status**:
   ```bash
   kubectl get pods
   kubectl describe pod <pod-name>
   ```

2. **View pod logs**:
   ```bash
   kubectl logs <pod-name>
   kubectl logs <pod-name> --previous  # Previous instance
   ```

3. **Check resource availability**:
   ```bash
   kubectl describe nodes
   kubectl top nodes
   ```

4. **Verify image pull**:
   ```bash
   kubectl describe pod <pod-name> | grep -i image
   # Look for ImagePullBackOff errors
   ```

5. **Add ImagePullSecrets if using private registry**:
   ```yaml
   spec:
     imagePullSecrets:
     - name: docker-hub-secret
   ```

### Service Not Accessible

**Problem**: Can't access application via service.

**Solutions**:

1. **Check service**:
   ```bash
   kubectl get service my-app-service
   kubectl describe service my-app-service
   ```

2. **Verify endpoints**:
   ```bash
   kubectl get endpoints my-app-service
   # Should list pod IPs
   ```

3. **Test internal connectivity**:
   ```bash
   kubectl run -it --rm debug --image=busybox --restart=Never -- sh
   # Inside pod:
   wget -O- http://my-app-service:80
   ```

4. **Check LoadBalancer status**:
   ```bash
   kubectl get service my-app-service
   # EXTERNAL-IP should not be <pending>
   ```

5. **For local clusters, use port-forward**:
   ```bash
   kubectl port-forward service/my-app-service 8080:80
   # Access at localhost:8080
   ```

### kubectl Version Mismatch

**Problem**: kubectl version incompatible with cluster.

**Solutions**:

1. **Match kubectl to cluster version**:
   ```yaml
   - uses: azure/setup-kubectl@v3
     with:
       version: 'v1.27.1'  # Match your cluster version
   ```

2. **Check cluster version**:
   ```bash
   kubectl version --short
   ```

3. **Use compatible version range**:
   - kubectl supports +/- 1 minor version from cluster

## Best Practices

### 1. Tag Images with Git SHA

Enable version tracking and rollback:

```yaml
- name: Build and tag
  run: |
    docker build \
      -t ${{ secrets.DOCKER_USERNAME }}/my-app:latest \
      -t ${{ secrets.DOCKER_USERNAME }}/my-app:${{ github.sha }} \
      .

- name: Push all tags
  run: |
    docker push --all-tags ${{ secrets.DOCKER_USERNAME }}/my-app
```

### 2. Use Multi-Stage Builds

Reduce image size and improve security:

```dockerfile
# Builder stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER node
CMD ["node", "dist/index.js"]
```

### 3. Implement Health Checks

Ensure application reliability:

```yaml
# In deployment.yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

Application code:
```javascript
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/ready', (req, res) => {
  // Check database, cache, etc.
  res.status(200).send('Ready');
});
```

### 4. Set Resource Limits

Prevent resource starvation:

```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "200m"
```

### 5. Use Secrets for Sensitive Data

Never hardcode credentials:

```yaml
# Create Kubernetes secret
kubectl create secret generic app-secrets \
  --from-literal=DB_PASSWORD=secret123

# Reference in deployment
env:
- name: DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: app-secrets
      key: DB_PASSWORD
```

### 6. Implement Rolling Update Strategy

Zero-downtime deployments:

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  minReadySeconds: 10
```

### 7. Use Namespaces

Isolate environments:

```bash
# Create namespaces
kubectl create namespace staging
kubectl create namespace production

# Deploy to specific namespace
kubectl apply -f k8s/ --namespace=production
```

### 8. Pin Action and Image Versions

Ensure reproducibility:

```yaml
# Actions
uses: actions/checkout@v4  # Not @main
uses: docker/login-action@v2  # Not @latest

# Docker images
FROM node:18.17.0-alpine  # Not node:latest
```

### 9. Add Deployment Verification

Verify successful deployment:

```yaml
- name: Verify deployment
  run: |
    kubectl rollout status deployment/my-app
    kubectl get pods -l app=my-app
```

### 10. Implement Automated Rollback

Rollback on failure:

```yaml
- name: Deploy and verify
  run: |
    kubectl apply -f k8s/deployment.yaml
    kubectl rollout status deployment/my-app --timeout=5m || \
    kubectl rollout undo deployment/my-app
```

### 11. Use Docker Build Cache

Speed up builds:

```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v2

- name: Build and push
  uses: docker/build-push-action@v4
  with:
    context: .
    push: true
    tags: ${{ secrets.DOCKER_USERNAME }}/my-app:latest
    cache-from: type=registry,ref=${{ secrets.DOCKER_USERNAME }}/my-app:cache
    cache-to: type=registry,ref=${{ secrets.DOCKER_USERNAME }}/my-app:cache,mode=max
```

### 12. Scan Images for Vulnerabilities

Security scanning:

```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ secrets.DOCKER_USERNAME }}/my-app:latest
    format: 'sarif'
    output: 'trivy-results.sarif'

- name: Upload Trivy results
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: 'trivy-results.sarif'
```
