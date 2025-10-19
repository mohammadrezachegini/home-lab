# Environment Variables and Secrets Management

## Overview

This project demonstrates advanced environment variable and secrets management in GitHub Actions. It showcases how to securely handle sensitive data like database credentials, API keys, and configuration values across different environments (testing, staging, production).

The workflow implements best practices for separating configuration from code, using GitHub Secrets for sensitive data, and managing environment-specific variables. This is essential for secure deployments and maintaining separation between development, testing, and production environments.

## GitHub Actions Concepts

### Secrets
Encrypted environment variables stored in GitHub that provide secure access to sensitive data. Secrets are:
- Never exposed in logs
- Encrypted at rest
- Only accessible to authorized workflows
- Can be repository, environment, or organization-level

### Environment Variables
Configuration values that can be defined at multiple levels:
- **Workflow level**: Available to all jobs using `env:` at the root
- **Job level**: Specific to a single job using `env:` within the job
- **Step level**: Specific to a single step using `env:` within the step

### Environments
Named deployment targets (testing, staging, production) that can have:
- Protection rules (required reviewers, wait timers)
- Environment-specific secrets
- Environment-specific variables
- Deployment logs and history

### Variable Precedence
When the same variable is defined at multiple levels:
1. Step-level variables (highest priority)
2. Job-level variables
3. Workflow-level variables (lowest priority)

## Prerequisites

### Repository Setup
- Node.js application with MongoDB database connection
- Test suite that requires database connectivity
- Package.json with test and start scripts

### GitHub Secrets Configuration

Navigate to **Settings > Secrets and variables > Actions** and add:

#### Repository Secrets
```
MONGODB_USERNAME: your-mongodb-username
MONGODB_PASSWORD: your-mongodb-password
```

#### Environment Setup
Create a "testing" environment:
1. Go to **Settings > Environments**
2. Click "New environment"
3. Name it "testing"
4. Optionally add protection rules
5. Add environment-specific secrets if needed

### MongoDB Atlas Configuration
For the workflow to connect to MongoDB Atlas:
1. Create a cluster in MongoDB Atlas
2. Configure Network Access to allow GitHub Actions IPs
3. Create database user with appropriate permissions
4. Get the cluster address (e.g., cluster0.ntrwp.mongodb.net)

### Required Dependencies
```json
{
  "dependencies": {
    "mongodb": "^5.0.0",
    "express": "^4.18.0"
  },
  "devDependencies": {
    "wait-on": "^7.0.0"
  },
  "scripts": {
    "start": "node app.js",
    "test": "jest"
  }
}
```

## Project Structure

```
deploy-env-var-secrets/
└── deploy-env-var-secrets.yml    # Main workflow file with secrets management
```

### Workflow Location
```
.github/workflows/deploy-env-var-secrets.yml
```

## Workflow Files

### deploy-env-var-secrets.yml

**Purpose**: Demonstrates comprehensive environment variable and secrets management across testing and deployment phases.

**Trigger Events**:
- Push to `master` or `dev` branches

**Global Environment Variables**:
```yaml
env:
  MONGODB_DB_NAME: gha-demo  # Available to all jobs
```

**Jobs**:

#### 1. Test Job
Runs tests with MongoDB connection using secrets and environment variables.

```yaml
test:
  environment: testing           # Uses "testing" environment
  runs-on: ubuntu-latest
  env:
    MONGODB_CLUSTER_ADDRESS: cluster0.ntrwp.mongodb.net
    MONGODB_USERNAME: ${{ secrets.MONGODB_USERNAME }}
    MONGODB_PASSWORD: ${{ secrets.MONGODB_PASSWORD }}
    PORT: 8080
```

**Steps**:
1. **Get Code**: Checks out repository
2. **Cache dependencies**: Caches npm dependencies for faster runs
3. **Install dependencies**: Runs `npm ci`
4. **Run server**: Starts application in background with wait-on
5. **Run tests**: Executes test suite
6. **Output information**: Displays MONGODB_USERNAME (demonstrates variable access)

**Key Features**:
- Uses GitHub Secrets for sensitive credentials
- Implements dependency caching for performance
- Starts server and waits for readiness before testing
- References secrets using `${{ secrets.SECRET_NAME }}`

#### 2. Deploy Job
Demonstrates variable scope and precedence.

```yaml
deploy:
  needs: test
  runs-on: ubuntu-latest
  steps:
    - name: Output information
      env:
        PORT: 3000  # Step-level variable overrides
      run: |
        echo "MONGODB_DB_NAME: $MONGODB_DB_NAME"
        echo "MONGODB_USERNAME: $MONGODB_USERNAME"
        echo "${{ env.PORT }}"
```

**Demonstrates**:
- Variable inheritance from workflow level (MONGODB_DB_NAME)
- Step-level variable precedence (PORT: 3000 overrides job/workflow level)
- Accessing variables in different scopes

## Usage

### Setting Up Secrets

#### Via GitHub UI
1. Navigate to your repository
2. Go to **Settings > Secrets and variables > Actions**
3. Click **New repository secret**
4. Add secret name and value
5. Click **Add secret**

#### Required Secrets for This Workflow
```
Name: MONGODB_USERNAME
Value: your_mongodb_user

Name: MONGODB_PASSWORD
Value: your_secure_password
```

### Setting Up Environments

1. **Create Environment**:
   - Go to **Settings > Environments**
   - Click **New environment**
   - Name: `testing`
   - Click **Configure environment**

2. **Add Protection Rules (Optional)**:
   - Required reviewers
   - Wait timer
   - Allowed branches

3. **Add Environment Secrets (Optional)**:
   - Environment-specific secrets override repository secrets
   - Useful for separate staging/production credentials

### Running the Workflow

1. **Automatic Trigger**:
   ```bash
   git checkout master  # or dev
   git add .
   git commit -m "Update application"
   git push origin master
   ```

2. **Monitor Execution**:
   - Go to Actions tab
   - Click on the workflow run
   - Observe test job connecting to MongoDB
   - Check deploy job output for variable values

### Customizing for Your Application

#### Update Connection String
```yaml
env:
  MONGODB_CLUSTER_ADDRESS: your-cluster.mongodb.net
  MONGODB_CONNECTION_PROTOCOL: mongodb+srv  # or mongodb
```

#### Add Additional Secrets
```yaml
env:
  API_KEY: ${{ secrets.API_KEY }}
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  ENCRYPTION_KEY: ${{ secrets.ENCRYPTION_KEY }}
```

#### Configure Multiple Environments
```yaml
jobs:
  deploy-staging:
    environment: staging
    env:
      MONGODB_USERNAME: ${{ secrets.MONGODB_USERNAME }}
      # staging-specific configuration

  deploy-production:
    environment: production
    needs: deploy-staging
    env:
      MONGODB_USERNAME: ${{ secrets.MONGODB_USERNAME }}
      # production-specific configuration
```

## Key Features

### 1. Multi-Level Environment Variables
Demonstrates three levels of variable scope:

```yaml
# Workflow level
env:
  MONGODB_DB_NAME: gha-demo

jobs:
  test:
    # Job level
    env:
      PORT: 8080
    steps:
      - name: Example
        # Step level (highest priority)
        env:
          PORT: 3000
```

### 2. Secure Secrets Management
Uses GitHub Secrets to protect sensitive data:

```yaml
env:
  MONGODB_USERNAME: ${{ secrets.MONGODB_USERNAME }}
  MONGODB_PASSWORD: ${{ secrets.MONGODB_PASSWORD }}
```

**Security Features**:
- Secrets are encrypted in GitHub
- Never appear in logs (shown as `***`)
- Only accessible to authorized workflows
- Can be scoped to specific environments

### 3. Environment-Based Configuration
Uses GitHub Environments for deployment isolation:

```yaml
test:
  environment: testing  # Isolates testing environment
```

**Benefits**:
- Separate secrets per environment
- Protection rules for production deployments
- Deployment history tracking
- Required approvals for sensitive environments

### 4. Dependency Caching
Implements caching for faster workflow execution:

```yaml
- name: Cache dependencies
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: npm-deps-${{ hashFiles('**/package-lock.json') }}
```

**Performance Impact**:
- First run: ~30-60 seconds for dependencies
- Cached runs: ~5-10 seconds
- Automatic cache invalidation on lock file changes

### 5. Service Health Checks
Waits for service readiness before testing:

```yaml
- name: Run server
  run: npm start & npx wait-on http://127.0.0.1:$PORT
```

**Ensures**:
- Server is fully started before tests run
- Database connections are established
- Reduces flaky test failures

### 6. Branch-Based Deployment
Triggers only on specific branches:

```yaml
on:
  push:
    branches:
      - master
      - dev
```

**Use Cases**:
- `master`: Production deployments
- `dev`: Development/staging deployments
- Feature branches: No deployment

## Troubleshooting

### Secrets Not Found

**Problem**: Workflow fails with "secret not found" error.

**Solutions**:
- Verify secret name matches exactly (case-sensitive)
- Check secret is created at repository level or environment level
- Ensure workflow has permission to access the environment
- For organization secrets, verify repository has access

```yaml
# Correct
${{ secrets.MONGODB_USERNAME }}

# Incorrect (case mismatch)
${{ secrets.mongodb_username }}
```

### MongoDB Connection Failures

**Problem**: Tests fail with "connection refused" or "connection timeout".

**Solutions**:

1. **Check MongoDB Atlas Network Access**:
   - Go to MongoDB Atlas > Network Access
   - Add IP address: `0.0.0.0/0` (allow from anywhere)
   - Note: For production, use more restrictive rules

2. **Verify Connection String**:
   ```yaml
   env:
     MONGODB_CLUSTER_ADDRESS: cluster0.ntrwp.mongodb.net  # No protocol prefix
     MONGODB_CONNECTION_PROTOCOL: mongodb+srv  # or mongodb
   ```

3. **Check Credentials**:
   - Verify username/password are correct
   - Ensure database user has appropriate permissions
   - Check if user is configured for the correct database

4. **Review Logs**:
   ```bash
   # In workflow logs, look for connection details
   echo "Connecting to: $MONGODB_CONNECTION_PROTOCOL://$MONGODB_CLUSTER_ADDRESS"
   ```

### Environment Variables Not Available

**Problem**: Variables show as empty or undefined.

**Solutions**:

1. **Check Variable Scope**:
   ```yaml
   # Variable defined in job, not available in another job
   jobs:
     job1:
       env:
         MY_VAR: value
     job2:
       steps:
         - run: echo $MY_VAR  # Empty! Not in scope
   ```

2. **Use Correct Syntax**:
   ```yaml
   # In YAML
   echo "${{ env.MY_VAR }}"

   # In shell commands
   echo "$MY_VAR"
   ```

3. **Verify Precedence**:
   - Step-level overrides job-level
   - Job-level overrides workflow-level
   - Check which scope your variable is defined in

### Cache Not Working

**Problem**: Dependencies are installed on every run.

**Solutions**:

1. **Verify Cache Key**:
   ```yaml
   key: npm-deps-${{ hashFiles('**/package-lock.json') }}
   # Must match across runs for the same lock file
   ```

2. **Check Cache Hit**:
   ```yaml
   - name: Cache dependencies
     id: cache
     uses: actions/cache@v4
     with:
       path: ~/.npm
       key: npm-deps-${{ hashFiles('**/package-lock.json') }}

   - name: Check cache
     run: echo "Cache hit: ${{ steps.cache.outputs.cache-hit }}"
   ```

3. **Clear Cache** (if corrupted):
   - Go to Actions > Caches
   - Delete the cache
   - Next run will recreate it

### Tests Timing Out

**Problem**: Workflow hangs during test execution.

**Solutions**:

1. **Add Job Timeout**:
   ```yaml
   test:
     timeout-minutes: 10
     runs-on: ubuntu-latest
   ```

2. **Add Step Timeout**:
   ```yaml
   - name: Run tests
     timeout-minutes: 5
     run: npm test
   ```

3. **Check Server Startup**:
   ```yaml
   - name: Run server with timeout
     run: |
       npm start &
       npx wait-on -t 30000 http://127.0.0.1:$PORT
   ```

### Secrets Appearing in Logs

**Problem**: Concerned about secrets being exposed.

**Solutions**:
- GitHub automatically masks secrets in logs (shown as `***`)
- Never echo secrets directly: `echo ${{ secrets.MY_SECRET }}`
- Use secrets only in secure contexts
- Review logs to verify masking is working

```yaml
# Avoid
- run: echo "Password is ${{ secrets.MONGODB_PASSWORD }}"

# Safe
- run: echo "Connecting to database..."
```

## Best Practices

### 1. Use Environments for Deployment Isolation

```yaml
jobs:
  deploy-production:
    environment: production  # Requires approval, has specific secrets
    steps:
      - run: deploy to production
```

**Benefits**:
- Separate secrets per environment
- Required approvals for production
- Clear deployment history
- Environment-specific protection rules

### 2. Never Hardcode Secrets

```yaml
# Bad - Never do this
env:
  API_KEY: sk_live_12345678

# Good - Use secrets
env:
  API_KEY: ${{ secrets.API_KEY }}
```

### 3. Use Descriptive Secret Names

```yaml
# Good
MONGODB_USERNAME
MONGODB_PASSWORD
AWS_ACCESS_KEY_ID
STRIPE_API_KEY

# Avoid
USER
PASS
KEY1
SECRET
```

### 4. Implement Least Privilege Access

- Create service accounts with minimal required permissions
- Use read-only credentials where possible
- Rotate secrets regularly
- Use different credentials for different environments

```yaml
# Testing environment - limited permissions
test:
  environment: testing
  env:
    DB_USER: ${{ secrets.TEST_DB_USER }}  # Read-only access

# Production environment - full permissions
deploy:
  environment: production
  env:
    DB_USER: ${{ secrets.PROD_DB_USER }}  # Write access
```

### 5. Use Environment Variables for Configuration

Separate configuration from code:

```yaml
# Good - Configurable
env:
  NODE_ENV: production
  LOG_LEVEL: info
  MAX_CONNECTIONS: 100

# Avoid - Hardcoded in application
```

### 6. Cache Dependencies Strategically

```yaml
- name: Cache dependencies
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

**Benefits**:
- Faster workflow execution (5-10x speedup)
- Reduced network usage
- Automatic invalidation on dependency changes

### 7. Validate Secrets Exist

Add validation steps to catch missing secrets early:

```yaml
- name: Validate secrets
  run: |
    if [ -z "${{ secrets.MONGODB_USERNAME }}" ]; then
      echo "Error: MONGODB_USERNAME secret not set"
      exit 1
    fi
    if [ -z "${{ secrets.MONGODB_PASSWORD }}" ]; then
      echo "Error: MONGODB_PASSWORD secret not set"
      exit 1
    fi
```

### 8. Use Step Outputs for Sharing Data

```yaml
- name: Set output
  id: vars
  run: echo "deployment-url=https://app.example.com" >> $GITHUB_OUTPUT

- name: Use output
  run: echo "Deployed to ${{ steps.vars.outputs.deployment-url }}"
```

### 9. Document Required Secrets

Create a secrets documentation file:

```markdown
# Required Secrets

## Repository Secrets
- `MONGODB_USERNAME`: MongoDB database username
- `MONGODB_PASSWORD`: MongoDB database password

## Environment: Production
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
```

### 10. Monitor Secret Usage

Regularly audit secret usage:
- Review workflow runs for authentication failures
- Check for deprecated secrets
- Rotate secrets periodically
- Remove unused secrets

### 11. Use Environment Protection Rules

For production environments:

```yaml
# Settings > Environments > production
- Required reviewers: 2
- Wait timer: 5 minutes
- Allowed branches: main only
```

### 12. Test with Service Containers

For database testing, consider service containers:

```yaml
services:
  mongodb:
    image: mongo:latest
    ports:
      - 27017:27017
    env:
      MONGO_INITDB_ROOT_USERNAME: test
      MONGO_INITDB_ROOT_PASSWORD: test
```
