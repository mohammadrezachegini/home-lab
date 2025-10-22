# GitHub Actions Workflow Execution Flow

## Overview

This project demonstrates workflow execution control flow in GitHub Actions, including job dependencies, parallel execution, sequential processing, caching strategies, and artifact management. It showcases how to orchestrate multiple jobs in a CI/CD pipeline with proper dependency chains and data flow between jobs.

## GitHub Actions Concepts

### Job Dependencies

Jobs can be configured to run in sequence using the `needs` keyword:

```yaml
jobs:
  job1:
    # runs first
  job2:
    needs: job1  # waits for job1 to complete
  job3:
    needs: [job1, job2]  # waits for both jobs
```

### Parallel vs Sequential Execution

- **Parallel**: Jobs without dependencies run simultaneously
- **Sequential**: Jobs with `needs` dependencies run after prerequisite jobs complete

### Caching

The `actions/cache` action stores and restores dependencies to speed up workflows:

```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
```

### Artifacts

Artifacts allow sharing data between jobs:
- **Upload**: `actions/upload-artifact@v3`
- **Download**: `actions/download-artifact@v3`

## Prerequisites

- GitHub repository with Actions enabled
- Node.js project with the following npm scripts:
  - `lint`: Code linting (e.g., ESLint)
  - `test`: Unit tests
  - `build`: Build process
- Valid `package.json` and `package-lock.json` files

## Project Structure

```
execution-flow/
├── execution-flow.yml      # Main workflow demonstrating execution flow
└── README.md              # This file
```

## Workflow Files

### execution-flow.yml

This workflow demonstrates a complete CI/CD pipeline with multiple jobs:

```yaml
name: Website Deployment
on:
  push:
    branches:
      - main
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - name: Get code
        uses: actions/checkout@v3
      - name: Cache dependencies
        id: cache
        uses: actions/cache@v3
        with:
          path: ~/.npm
          key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
      - name: Install dependencies
        run: npm ci
      - name: Lint code
        run: npm run lint
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Get code
        uses: actions/checkout@v3
      - name: Cache dependencies
        id: cache
        uses: actions/cache@v3
        with:
          path: ~/.npm
          key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
      - name: Install dependencies
        run: npm ci
      - name: Test code
        run: npm run test
      - name: Upload test report
        uses: actions/upload-artifact@v3
        with:
          name: test-report
          path: test.json
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Get code
        uses: actions/checkout@v3
      - name: Cache dependencies
        id: cache
        uses: actions/cache@v3
        with:
          path: ~/.npm
          key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
      - name: Install dependencies
        run: npm ci
      - name: Build website
        id: build-website
        run: npm run build
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist-files
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Get build artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist-files
      - name: Output contents
        run: ls
      - name: Deploy
        run: echo "Deploying..."
```

### Execution Flow Visualization

```
┌─────────────────────────────────────┐
│          Trigger: push to main      │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
   ┌──────┐        ┌──────┐
   │ lint │        │ test │  ← Parallel execution
   └──────┘        └──┬───┘
                      │
                      │ needs: test
                      ▼
                  ┌───────┐
                  │ build │  ← Sequential execution
                  └───┬───┘
                      │
                      │ needs: build
                      ▼
                  ┌────────┐
                  │ deploy │  ← Sequential execution
                  └────────┘
```

### Job Breakdown

#### 1. Lint Job (Parallel)
- Runs independently without dependencies
- Checks code quality and style
- Uses npm cache for faster execution

#### 2. Test Job (Parallel)
- Runs independently without dependencies
- Executes test suite
- Generates test report (`test.json`)
- Uploads test report as artifact

#### 3. Build Job (Sequential)
- **Depends on**: `test` job completion
- Only runs if tests pass
- Builds production-ready code
- Uploads build artifacts (`dist` directory)

#### 4. Deploy Job (Sequential)
- **Depends on**: `build` job completion
- Downloads build artifacts
- Performs deployment (simulated)

## Usage

### Running the Workflow

1. **Automatic Trigger**:
   ```bash
   git checkout main
   git add .
   git commit -m "Update application"
   git push origin main
   ```

2. **Monitor Execution**:
   - Go to GitHub Actions tab
   - Select the running workflow
   - View job execution graph
   - Observe parallel lint/test execution
   - See sequential build/deploy execution

### Understanding Job Dependencies

**Scenario 1: All jobs succeed**
```
lint ✓ (starts immediately)
test ✓ (starts immediately)
  └─> build ✓ (starts after test)
       └─> deploy ✓ (starts after build)
```

**Scenario 2: Test fails**
```
lint ✓ (completes)
test ✗ (fails)
  └─> build (skipped)
       └─> deploy (skipped)
```

**Scenario 3: Lint fails**
```
lint ✗ (fails, but doesn't block other jobs)
test ✓ (completes)
  └─> build ✓ (continues)
       └─> deploy ✓ (continues)
```

## Key Features

### 1. Parallel Job Execution
```yaml
jobs:
  lint:    # No needs - runs immediately
  test:    # No needs - runs immediately
```
Benefits:
- Faster total workflow execution
- Independent quality checks
- Resource optimization

### 2. Sequential Job Dependencies
```yaml
build:
  needs: test    # Waits for test completion
deploy:
  needs: build   # Waits for build completion
```
Benefits:
- Ensures build happens only after tests pass
- Prevents deployment of broken code
- Logical pipeline progression

### 3. Dependency Caching
```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
```
Benefits:
- Faster workflow execution (skip npm install)
- Reduced network usage
- Cache invalidation on dependency changes

### 4. Artifact Management
```yaml
# Upload in test job
- uses: actions/upload-artifact@v3
  with:
    name: test-report
    path: test.json

# Upload in build job
- uses: actions/upload-artifact@v3
  with:
    name: dist-files
    path: dist
```
Benefits:
- Share data between jobs
- Preserve build outputs
- Enable deployment without rebuilding

### 5. Artifact Download
```yaml
- uses: actions/download-artifact@v3
  with:
    name: dist-files
```
Benefits:
- Access build artifacts in deploy job
- No need to rebuild in deployment
- Consistent deployment artifacts

## Troubleshooting

### Jobs Not Running in Expected Order

**Problem**: Build starts before test completes
- **Solution**: Verify `needs` keyword is correctly specified
  ```yaml
  build:
    needs: test  # Ensure this is present
  ```

**Problem**: All jobs run in parallel
- **Solution**: Check job dependency chain
  ```yaml
  job2:
    needs: job1  # Missing this causes parallel execution
  ```

### Cache Not Working

**Problem**: Dependencies installed on every run
- **Solution**: Verify cache key matches path
  ```yaml
  - uses: actions/cache@v3
    with:
      path: ~/.npm  # Must match npm cache location
      key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
  ```

**Problem**: Cache not invalidating on dependency changes
- **Solution**: Ensure using `hashFiles()` in cache key
  ```yaml
  key: deps-${{ hashFiles('**/package-lock.json') }}  # Updates on lock file change
  ```

### Artifact Issues

**Problem**: Artifact not found in download job
- **Solution**: Verify artifact name matches between upload/download
  ```yaml
  # Upload
  name: dist-files
  # Download
  name: dist-files  # Must match exactly
  ```

**Problem**: Artifact upload fails
- **Solution**: Ensure path exists before upload
  ```yaml
  - name: Build website
    run: npm run build  # Creates dist directory
  - name: Upload artifacts
    uses: actions/upload-artifact@v3
    with:
      path: dist  # Path must exist
  ```

### Job Dependencies Skipped

**Problem**: Deploy job skipped even though build succeeded
- **Solution**: Check if previous job actually succeeded
- **Verify**: Use `if: success()` or `if: always()` conditionally
  ```yaml
  deploy:
    needs: build
    if: success()  # Explicit success check
  ```

## Best Practices

### 1. Optimize Parallel Execution
```yaml
# Run independent jobs in parallel
jobs:
  lint:
    # No dependencies
  test:
    # No dependencies
  security-scan:
    # No dependencies
```

### 2. Use Dependency Chains Wisely
```yaml
# Create logical progression
jobs:
  test:
  build:
    needs: test
  deploy:
    needs: build
```

### 3. Implement Effective Caching
```yaml
# Cache strategy
- uses: actions/cache@v3
  id: cache
  with:
    path: node_modules  # Or ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### 4. Conditional Step Execution
```yaml
- name: Install dependencies
  if: steps.cache.outputs.cache-hit != 'true'
  run: npm ci
```

### 5. Meaningful Artifact Names
```yaml
# Good - descriptive names
- uses: actions/upload-artifact@v3
  with:
    name: build-artifacts-${{ github.sha }}
    path: dist

# Better - include version/commit
- uses: actions/upload-artifact@v3
  with:
    name: app-v1.0-${{ github.run_number }}
    path: dist
```

### 6. Multiple Dependency Jobs
```yaml
deploy:
  needs: [build, test, security-scan]
  # Waits for all three jobs to complete
```

### 7. Artifact Retention
```yaml
- uses: actions/upload-artifact@v3
  with:
    name: dist-files
    path: dist
    retention-days: 5  # Keep artifacts for 5 days
```

### 8. Checkout Code in Each Job
```yaml
# Each job needs to checkout code
jobs:
  test:
    steps:
      - uses: actions/checkout@v3
  build:
    needs: test
    steps:
      - uses: actions/checkout@v3  # Still needed
```
