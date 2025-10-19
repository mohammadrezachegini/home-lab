# Container Deployment Workflows

## Overview

This project demonstrates containerized testing and deployment using GitHub Actions. It showcases how to use service containers (like MongoDB) in your CI/CD pipeline, enabling isolated and reproducible testing environments without relying on external services.

The workflow implements testing with local containerized services, eliminating the need for cloud-hosted databases during testing. This approach provides faster, more reliable tests, reduces external dependencies, and ensures consistent testing environments across all workflow runs.

## GitHub Actions Concepts

### Service Containers
Docker containers that run alongside your workflow jobs, providing services like databases, cache servers, or message queues.

**Key Features**:
- Automatically started before job steps
- Accessible via localhost or Docker network
- Isolated per workflow run
- Automatically cleaned up after job completion

### Container Jobs
Jobs that run entirely inside a Docker container instead of directly on the runner.

**Benefits**:
- Consistent environment across all runs
- Custom runtime environments
- Reduced setup steps
- Faster startup times

### Network Communication
- **Direct runner**: Services accessible via `localhost:port`
- **Container job**: Services accessible via `service-name:port`

### Environment Variables
Container-specific configuration:
- `MONGO_INITDB_ROOT_USERNAME`: MongoDB initialization user
- `MONGO_INITDB_ROOT_PASSWORD`: MongoDB initialization password
- Service connection parameters

## Prerequisites

### Application Requirements
- Node.js application with MongoDB integration
- Test suite that requires database connectivity
- Express server or similar web application

### Required Files Structure
```
your-repo/
├── .github/
│   └── workflows/
│       └── deploy-container.yml
├── package.json
├── package-lock.json
├── app.js (or index.js)
└── tests/
    └── (your test files)
```

### Package.json Configuration
```json
{
  "name": "your-app",
  "scripts": {
    "start": "node app.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0",
    "mongodb": "^5.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "wait-on": "^7.0.0"
  }
}
```

### MongoDB Connection Code
Your application should support configurable connection strings:

```javascript
const { MongoClient } = require('mongodb');

const protocol = process.env.MONGODB_CONNECTION_PROTOCOL || 'mongodb';
const address = process.env.MONGODB_CLUSTER_ADDRESS || 'localhost:27017';
const username = process.env.MONGODB_USERNAME || 'root';
const password = process.env.MONGODB_PASSWORD || 'example';
const dbName = process.env.MONGODB_DB_NAME || 'test';

const uri = `${protocol}://${username}:${password}@${address}/${dbName}`;
const client = new MongoClient(uri);
```

## Project Structure

```
deploy-container/
└── deploy-container.yml    # Workflow with service containers
```

### Workflow Location
```
.github/workflows/deploy-container.yml
```

## Workflow Files

### deploy-container.yml

**Purpose**: Implements containerized testing with MongoDB service container for isolated, reproducible test environments.

**Trigger Events**:
- Push to `main` or `dev` branches

**Global Environment Variables**:
```yaml
env:
  CACHE_KEY: node-deps           # Cache key identifier
  MONGODB_DB_NAME: gha-demo      # Database name
```

**Jobs**:

#### 1. Test Job with Service Container

Uses a MongoDB service container for testing:

```yaml
test:
  environment: testing
  runs-on: ubuntu-latest
  env:
    MONGODB_CONNECTION_PROTOCOL: mongodb
    MONGODB_CLUSTER_ADDRESS: 127.0.0.1:27017
    MONGODB_USERNAME: root
    MONGODB_PASSWORD: example
    PORT: 8080
  services:
    mongodb:
      image: mongo
      ports:
        - 27017:27017
      env:
        MONGO_INITDB_ROOT_USERNAME: root
        MONGO_INITDB_ROOT_PASSWORD: example
```

**Service Container Configuration**:
- **Image**: Official MongoDB Docker image
- **Ports**: Maps container port 27017 to host port 27017
- **Environment**: Initializes MongoDB with root credentials
- **Lifecycle**: Starts before steps, stops after job completion

**Steps**:
1. **Get Code**: Checks out repository
2. **Cache dependencies**: Caches npm packages using cache key
3. **Install dependencies**: Runs `npm ci`
4. **Run server**: Starts application in background
5. **Run tests**: Executes test suite against local MongoDB
6. **Output information**: Displays configuration details

**Key Features**:
- Local MongoDB instance (no cloud dependencies)
- Consistent test environment
- Fast database operations (localhost)
- Automatic service cleanup

#### 2. Deploy Job

```yaml
deploy:
  needs: test
  runs-on: ubuntu-latest
  steps:
    - name: Output information
      env:
        PORT: 3000
      run: |
        echo "MONGODB_DB_NAME: $MONGODB_DB_NAME"
        echo "MONGODB_USERNAME: $MONGODB_USERNAME"
        echo "${{ env.PORT }}"
```

**Purpose**: Placeholder deployment showing variable scope and inheritance.

### Alternative: Container Job (Commented)

The workflow includes a commented-out container job configuration:

```yaml
# container:
#   image: node:16
```

**When to Use**:
- Need specific Node.js version not available in runner
- Require custom base image with pre-installed tools
- Want consistent environment across different runner types

**Network Changes When Enabled**:
```yaml
# When using container job:
MONGODB_CLUSTER_ADDRESS: mongodb:27017  # Use service name

# When using runner directly:
MONGODB_CLUSTER_ADDRESS: 127.0.0.1:27017  # Use localhost
```

## Usage

### Basic Setup

1. **Copy workflow to your repository**:
   ```bash
   mkdir -p .github/workflows
   cp deploy-container.yml .github/workflows/
   ```

2. **Ensure MongoDB connection code is configurable**:
   ```javascript
   const mongoUri = `${process.env.MONGODB_CONNECTION_PROTOCOL}://` +
                    `${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@` +
                    `${process.env.MONGODB_CLUSTER_ADDRESS}/${process.env.MONGODB_DB_NAME}`;
   ```

3. **Create "testing" environment** (Settings > Environments > New environment)

4. **Commit and push**:
   ```bash
   git add .github/workflows/deploy-container.yml
   git commit -m "Add containerized deployment workflow"
   git push origin main
   ```

### Using Different Service Containers

#### PostgreSQL
```yaml
services:
  postgres:
    image: postgres:15
    ports:
      - 5432:5432
    env:
      POSTGRES_USER: testuser
      POSTGRES_PASSWORD: testpass
      POSTGRES_DB: testdb
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

Connection in application:
```javascript
const connectionString = 'postgresql://testuser:testpass@localhost:5432/testdb';
```

#### Redis
```yaml
services:
  redis:
    image: redis:7
    ports:
      - 6379:6379
    options: >-
      --health-cmd "redis-cli ping"
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

Connection in application:
```javascript
const redis = require('redis');
const client = redis.createClient({
  url: 'redis://localhost:6379'
});
```

#### MySQL
```yaml
services:
  mysql:
    image: mysql:8.0
    ports:
      - 3306:3306
    env:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: testdb
    options: >-
      --health-cmd="mysqladmin ping"
      --health-interval=10s
      --health-timeout=5s
      --health-retries=3
```

#### Multiple Services
```yaml
services:
  mongodb:
    image: mongo:latest
    ports:
      - 27017:27017
    env:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: example

  redis:
    image: redis:7
    ports:
      - 6379:6379

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - 5672:5672
      - 15672:15672
```

### Using Container Jobs

Enable container job by uncommenting and configuring:

```yaml
test:
  environment: testing
  runs-on: ubuntu-latest
  container:
    image: node:18
    env:
      NODE_ENV: test
    options: --cpus 2 --memory 2g
  env:
    # Use service name instead of localhost
    MONGODB_CLUSTER_ADDRESS: mongodb:27017
  services:
    mongodb:
      image: mongo
      env:
        MONGO_INITDB_ROOT_USERNAME: root
        MONGO_INITDB_ROOT_PASSWORD: example
```

**Important**: Change connection address from `127.0.0.1` to service name (`mongodb`).

### Advanced Caching Strategies

#### Cache with Multiple Paths
```yaml
- name: Cache dependencies and build
  uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      ./node_modules
      ./.next/cache
    key: ${{ runner.os }}-multi-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-multi-
```

#### Conditional Caching
```yaml
- name: Cache dependencies
  if: github.event_name == 'push'
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: npm-${{ hashFiles('**/package-lock.json') }}
```

## Key Features

### 1. Service Containers for Testing

Run databases and services as Docker containers:

```yaml
services:
  mongodb:
    image: mongo              # Official Docker Hub image
    ports:
      - 27017:27017          # Map container port to host
    env:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: example
```

**Advantages**:
- No external service dependencies
- Faster tests (localhost connection)
- Consistent environment across runs
- Isolated data (fresh database each run)
- Cost-effective (no cloud database costs)

### 2. Health Checks

Ensure services are ready before running tests:

```yaml
services:
  mongodb:
    image: mongo
    options: >-
      --health-cmd "mongosh --eval 'db.adminCommand(\"ping\")'"
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

### 3. Dependency Caching

Cache npm dependencies for faster workflows:

```yaml
- name: Cache dependencies
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ env.CACHE_KEY }}-${{ hashFiles('**/package-lock.json') }}
```

**Performance Impact**:
- Uncached: 30-60 seconds
- Cached: 5-10 seconds
- Cache hit rate: ~90% for stable dependencies

### 4. Service Readiness Waiting

Use wait-on to ensure services are ready:

```yaml
- name: Run server
  run: npm start & npx wait-on http://127.0.0.1:$PORT
```

**Prevents**:
- Race conditions
- Connection refused errors
- Flaky tests

### 5. Environment Isolation

Each workflow run gets:
- Fresh database instance
- Clean state
- Isolated data
- No cross-test contamination

### 6. Configurable Environment Variables

Centralized configuration management:

```yaml
env:
  MONGODB_CONNECTION_PROTOCOL: mongodb
  MONGODB_CLUSTER_ADDRESS: 127.0.0.1:27017
  MONGODB_USERNAME: root
  MONGODB_PASSWORD: example
  PORT: 8080
```

### 7. Port Mapping

Make container services accessible:

```yaml
ports:
  - 27017:27017  # host:container
```

Access from tests: `localhost:27017`

## Troubleshooting

### Service Container Not Starting

**Problem**: Tests fail with "connection refused" to database.

**Solutions**:

1. **Check service logs**:
   Add debugging step:
   ```yaml
   - name: Check MongoDB status
     run: docker ps -a
   ```

2. **Add health checks**:
   ```yaml
   services:
     mongodb:
       image: mongo
       options: >-
         --health-cmd "mongosh --eval 'db.adminCommand(\"ping\")'"
         --health-interval 10s
         --health-timeout 5s
         --health-retries 5
   ```

3. **Wait for service**:
   ```yaml
   - name: Wait for MongoDB
     run: |
       timeout 60 bash -c 'until nc -z localhost 27017; do sleep 1; done'
   ```

### Connection Address Issues

**Problem**: Tests can't connect to service container.

**Solutions**:

1. **For runner-based jobs** (default):
   ```yaml
   env:
     MONGODB_CLUSTER_ADDRESS: 127.0.0.1:27017  # or localhost:27017
   ```

2. **For container jobs**:
   ```yaml
   container:
     image: node:18
   env:
     MONGODB_CLUSTER_ADDRESS: mongodb:27017  # Use service name
   ```

3. **Debug connection**:
   ```yaml
   - name: Test connection
     run: |
       nc -zv localhost 27017
       echo "MongoDB connection successful"
   ```

### Port Conflicts

**Problem**: Service fails to bind to port.

**Solutions**:

1. **Use different ports**:
   ```yaml
   services:
     mongodb:
       ports:
         - 27018:27017  # Map to different host port
   ```

   Update connection:
   ```yaml
   env:
     MONGODB_CLUSTER_ADDRESS: 127.0.0.1:27018
   ```

2. **Let GitHub assign port**:
   ```yaml
   services:
     mongodb:
       ports:
         - 27017/tcp  # Random host port assigned
   ```

   Access via:
   ```yaml
   env:
     MONGODB_PORT: ${{ job.services.mongodb.ports[27017] }}
   ```

### Authentication Failures

**Problem**: Database connection fails with authentication error.

**Solutions**:

1. **Verify credentials match**:
   ```yaml
   services:
     mongodb:
       env:
         MONGO_INITDB_ROOT_USERNAME: root
         MONGO_INITDB_ROOT_PASSWORD: example

   # Must match in job env:
   env:
     MONGODB_USERNAME: root
     MONGODB_PASSWORD: example
   ```

2. **Check connection string format**:
   ```javascript
   // Correct
   mongodb://root:example@localhost:27017/testdb

   // Incorrect - missing credentials
   mongodb://localhost:27017/testdb
   ```

### Service Not Ready

**Problem**: Tests run before service is fully initialized.

**Solutions**:

1. **Add explicit wait**:
   ```yaml
   - name: Wait for MongoDB
     run: sleep 10
   ```

2. **Use wait-on package**:
   ```yaml
   - name: Wait for service
     run: npx wait-on tcp:127.0.0.1:27017 -t 30000
   ```

3. **Implement retry logic in tests**:
   ```javascript
   async function connectWithRetry(maxRetries = 5) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         await client.connect();
         return;
       } catch (err) {
         if (i === maxRetries - 1) throw err;
         await new Promise(resolve => setTimeout(resolve, 1000));
       }
     }
   }
   ```

### Cache Not Restoring

**Problem**: Dependencies are installed on every run.

**Solutions**:

1. **Verify cache key**:
   ```yaml
   - name: Cache with output
     id: cache
     uses: actions/cache@v4
     with:
       path: ~/.npm
       key: ${{ env.CACHE_KEY }}-${{ hashFiles('**/package-lock.json') }}

   - name: Check cache hit
     run: echo "Cache hit - ${{ steps.cache.outputs.cache-hit }}"
   ```

2. **Check restore-keys**:
   ```yaml
   - uses: actions/cache@v4
     with:
       path: ~/.npm
       key: npm-${{ hashFiles('**/package-lock.json') }}
       restore-keys: |
         npm-
   ```

3. **Clear corrupted cache**:
   - Go to Actions > Caches in GitHub
   - Delete the cache entry
   - Next run will recreate it

### Memory or CPU Limitations

**Problem**: Service container crashes or tests fail due to resource limits.

**Solutions**:

1. **Add resource limits**:
   ```yaml
   services:
     mongodb:
       image: mongo
       options: >-
         --memory=2g
         --cpus=2
   ```

2. **Use lighter images**:
   ```yaml
   services:
     mongodb:
       image: mongo:7-jammy  # Lighter than latest
   ```

3. **Optimize container startup**:
   ```yaml
   services:
     mongodb:
       image: mongo
       env:
         MONGO_INITDB_ROOT_USERNAME: root
         MONGO_INITDB_ROOT_PASSWORD: example
       options: >-
         --wiredTigerCacheSizeGB=1
   ```

## Best Practices

### 1. Use Service Containers for Testing

Prefer local services over cloud services for testing:

```yaml
# Good - Fast, reliable, isolated
services:
  mongodb:
    image: mongo

# Avoid - Slower, requires network, shared state
env:
  MONGODB_CLUSTER_ADDRESS: cluster0.mongodb.net
```

### 2. Implement Health Checks

Always add health checks for critical services:

```yaml
services:
  postgres:
    image: postgres:15
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

### 3. Pin Image Versions

Use specific versions for reproducibility:

```yaml
# Good - Predictable
services:
  mongodb:
    image: mongo:7.0

# Avoid - Unpredictable updates
services:
  mongodb:
    image: mongo:latest
```

### 4. Use Environment Variables

Make connections configurable:

```yaml
env:
  DB_HOST: ${{ secrets.DB_HOST || 'localhost' }}
  DB_PORT: ${{ secrets.DB_PORT || '27017' }}
```

### 5. Clean Up After Tests

Ensure proper cleanup in test teardown:

```javascript
afterAll(async () => {
  await client.close();
  await server.close();
});
```

### 6. Cache Dependencies Effectively

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### 7. Use Appropriate Service Images

Choose official, maintained images:

```yaml
services:
  # Official images (recommended)
  mongodb:
    image: mongo:7.0
  postgres:
    image: postgres:15
  redis:
    image: redis:7

  # Avoid unofficial or outdated images
```

### 8. Set Resource Limits

Prevent resource exhaustion:

```yaml
services:
  mongodb:
    image: mongo
    options: >-
      --memory=1g
      --cpus=1
```

### 9. Implement Proper Wait Strategies

Don't rely on fixed sleep times:

```yaml
# Good - Waits until ready
- run: npx wait-on tcp:localhost:27017 -t 30000

# Avoid - Fixed delay
- run: sleep 15
```

### 10. Use Matrix Strategy for Multiple Databases

Test against multiple database versions:

```yaml
strategy:
  matrix:
    mongodb-version: ['5.0', '6.0', '7.0']
services:
  mongodb:
    image: mongo:${{ matrix.mongodb-version }}
```

### 11. Secure Service Credentials

Even in testing, use proper credentials:

```yaml
# Good
env:
  MONGO_INITDB_ROOT_USERNAME: ${{ secrets.TEST_DB_USER }}
  MONGO_INITDB_ROOT_PASSWORD: ${{ secrets.TEST_DB_PASS }}

# Acceptable for testing only
env:
  MONGO_INITDB_ROOT_USERNAME: testuser
  MONGO_INITDB_ROOT_PASSWORD: testpass123
```

### 12. Monitor Service Container Logs

Add debugging for troubleshooting:

```yaml
- name: Show service logs
  if: failure()
  run: docker logs ${{ job.services.mongodb.id }}
```
