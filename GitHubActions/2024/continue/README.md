# GitHub Actions Continue on Error Pattern

## Overview

This project demonstrates error handling and conditional execution patterns in GitHub Actions using `continue-on-error`, conditional job execution with `if`, and failure recovery workflows. It showcases how to build resilient CI/CD pipelines that can handle failures gracefully and provide comprehensive error reporting.

## GitHub Actions Concepts

### Continue on Error

The `continue-on-error` directive allows a step or job to fail without stopping the workflow:

```yaml
- name: Test code
  continue-on-error: true
  run: npm test
```

### Conditional Execution

The `if` conditional controls whether a job or step runs:

```yaml
deploy:
  if: success()  # Only run if previous jobs succeeded
  runs-on: ubuntu-latest
```

### Status Check Functions

GitHub Actions provides status check functions:
- `success()`: Previous steps/jobs succeeded
- `failure()`: Previous steps/jobs failed
- `always()`: Always run regardless of status
- `cancelled()`: Workflow was cancelled

### Job Dependencies

Multiple job dependencies can be specified:

```yaml
report:
  needs: [lint, deploy]  # Depends on multiple jobs
  if: failure()          # Only runs if any dependency failed
```

### Cache Conditionals

Cache steps can be conditional:

```yaml
- name: Install dependencies
  if: steps.cache.outputs.cache-hit != 'true'
  run: npm ci
```

## Prerequisites

- GitHub repository with Actions enabled
- Node.js project with npm scripts:
  - `lint`: Code linting
  - `test`: Unit tests (may fail)
  - `build`: Build process
- `package.json` and `package-lock.json` files
- Understanding of job dependencies

## Project Structure

```
continue/
├── continue.yml          # Workflow with error handling
└── README.md            # This file
```

## Workflow Files

### continue.yml

This workflow demonstrates comprehensive error handling:

```yaml
name: Continue Website Deployment
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
        path: node_modules
        key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
    - name: Install dependencies
      if: steps.cache.outputs.cache-hit != 'true'
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
        path: node_modules
        key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
    - name: Install dependencies
      if: steps.cache.outputs.cache-hit != 'true'
      run: npm ci
    - name: Test code
      continue-on-error: true
      id: run-tests
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
        path: node_modules
        key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
    - name: Install dependencies
      if: steps.cache.outputs.cache-hit != 'true'
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
  report:
    needs: [ lint, deploy ]
    if: failure()
    runs-on: ubuntu-latest
    steps:
    - name: Output information
      run: |
        echo "Something went wrong"
        echo "${{ toJSON(github) }}"
```

### Workflow Architecture

```
┌────────────────────────────────────┐
│     Trigger: push to main          │
└─────────────┬──────────────────────┘
              │
      ┌───────┴────────┐
      │                │
      ▼                ▼
  ┌──────┐        ┌──────┐
  │ lint │        │ test │  ← continue-on-error: true
  └───┬──┘        └───┬──┘
      │               │
      │               │ needs: test
      │               ▼
      │           ┌───────┐
      │           │ build │  ← Runs even if test fails
      │           └───┬───┘
      │               │
      │               │ needs: build
      │               ▼
      │           ┌────────┐
      │           │ deploy │
      │           └────┬───┘
      │                │
      └────────┬───────┘
               │ needs: [lint, deploy]
               │ if: failure()
               ▼
          ┌────────┐
          │ report │  ← Only runs on failure
          └────────┘
```

### Error Handling Flow

#### Scenario 1: All Jobs Succeed
```
lint ✓ → test ✓ → build ✓ → deploy ✓
                              ↓
                          report (skipped - no failures)
```

#### Scenario 2: Test Fails
```
lint ✓ → test ✗ (continues) → build ✓ → deploy ✓
                                         ↓
                                     report ✓ (runs due to test failure)
```

#### Scenario 3: Lint Fails
```
lint ✗ → test ✓ → build ✓ → deploy ✓
                             ↓
                         report ✓ (runs due to lint failure)
```

#### Scenario 4: Build Fails
```
lint ✓ → test ✓ → build ✗ → deploy (skipped)
                             ↓
                         report ✓ (runs due to build failure)
```

### Key Components Breakdown

#### 1. Lint Job (Standard Execution)
```yaml
lint:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - uses: actions/cache@v3
      id: cache
      with:
        path: node_modules
        key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
    - name: Install dependencies
      if: steps.cache.outputs.cache-hit != 'true'
      run: npm ci
    - run: npm run lint
```
- No error handling
- Failure blocks dependent jobs
- Uses conditional dependency installation

#### 2. Test Job (Continue on Error)
```yaml
test:
  steps:
    - name: Test code
      continue-on-error: true
      id: run-tests
      run: npm run test
    - name: Upload test report
      uses: actions/upload-artifact@v3
      with:
        name: test-report
        path: test.json
```
- **Key Feature**: `continue-on-error: true`
- Test failures don't stop workflow
- Test report uploaded regardless of test result
- Build can proceed even with failing tests

#### 3. Build Job (Depends on Test)
```yaml
build:
  needs: test
  steps:
    # Standard build steps
```
- Runs even if test job has step failures (due to continue-on-error)
- Would be skipped if test job itself failed

#### 4. Report Job (Conditional Failure Reporting)
```yaml
report:
  needs: [ lint, deploy ]
  if: failure()
  runs-on: ubuntu-latest
  steps:
    - name: Output information
      run: |
        echo "Something went wrong"
        echo "${{ toJSON(github) }}"
```
- **Key Feature**: `if: failure()`
- Only runs if lint or deploy (or their dependencies) failed
- Outputs GitHub context for debugging
- Useful for notifications and error logging

## Usage

### Running the Workflow

1. **Trigger on Push**:
   ```bash
   git checkout main
   git add .
   git commit -m "Update code"
   git push origin main
   ```

2. **Observe Error Handling**:
   - Watch workflow in Actions tab
   - Note that test failures don't stop the workflow
   - See report job only runs on failures

### Testing Error Scenarios

#### Test Failure Scenario
```bash
# Modify test to fail
# Test will fail but workflow continues
git push origin main
# Result: Report job runs, deployment still happens
```

#### Lint Failure Scenario
```bash
# Add linting error
# Lint fails and blocks build
git push origin main
# Result: Test runs, build/deploy skip, report runs
```

#### Build Failure Scenario
```bash
# Break build process
git push origin main
# Result: Lint/test run, deploy skips, report runs
```

## Key Features

### 1. Continue on Error
```yaml
- name: Test code
  continue-on-error: true
  id: run-tests
  run: npm run test
```
**Use Case**: Allow workflow to proceed despite step failure

### 2. Conditional Dependency Installation
```yaml
- name: Cache dependencies
  id: cache
  uses: actions/cache@v3
  with:
    path: node_modules
    key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
- name: Install dependencies
  if: steps.cache.outputs.cache-hit != 'true'
  run: npm ci
```
**Use Case**: Skip installation when cache is available

### 3. Failure Reporting
```yaml
report:
  needs: [ lint, deploy ]
  if: failure()
  runs-on: ubuntu-latest
```
**Use Case**: Run cleanup or notification jobs only on failure

### 4. Multi-Job Dependencies
```yaml
needs: [ lint, deploy ]
```
**Use Case**: Wait for multiple jobs before executing

### 5. Node Modules Caching
```yaml
path: node_modules  # Cache node_modules directly
```
**Use Case**: Faster caching than `~/.npm` for smaller projects

### 6. Artifact Upload Regardless of Status
```yaml
- name: Test code
  continue-on-error: true
  run: npm run test
- name: Upload test report
  uses: actions/upload-artifact@v3
  with:
    name: test-report
    path: test.json
```
**Use Case**: Always preserve test results for analysis

## Troubleshooting

### Workflow Doesn't Continue After Failure

**Problem**: Workflow stops on test failure despite continue-on-error
- **Solution**: Verify `continue-on-error: true` is at step level:
  ```yaml
  # Correct - step level
  - name: Test
    continue-on-error: true
    run: npm test

  # Wrong - job level (different behavior)
  job:
    continue-on-error: true
  ```

### Report Job Always Runs

**Problem**: Report job runs even when workflow succeeds
- **Solution**: Check `if` condition:
  ```yaml
  report:
    if: failure()  # Ensure this is present
  ```

**Problem**: Report job never runs
- **Solution**: Verify job dependencies include all critical jobs:
  ```yaml
  report:
    needs: [ lint, deploy ]  # Should include all jobs to monitor
    if: failure()
  ```

### Cache Not Working

**Problem**: Dependencies installed every time
- **Solution**: Verify cache key and path:
  ```yaml
  - uses: actions/cache@v3
    id: cache
    with:
      path: node_modules
      key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
  ```

**Problem**: Cache conditional not working
- **Solution**: Check cache step has ID and if condition references it:
  ```yaml
  - name: Cache dependencies
    id: cache  # Required
    uses: actions/cache@v3
  - name: Install
    if: steps.cache.outputs.cache-hit != 'true'  # Reference ID
  ```

### Build Runs When It Shouldn't

**Problem**: Build runs even when test job fails
- **Solution**: This is expected with `continue-on-error`. To prevent:
  ```yaml
  test:
    steps:
      - id: test-step
        continue-on-error: true
        run: npm test
  build:
    needs: test
    if: success()  # Explicit success check
  ```

## Best Practices

### 1. Use Continue-on-Error Strategically
```yaml
# Good - for optional steps
- name: Optional security scan
  continue-on-error: true
  run: npm audit

# Bad - for critical steps
- name: Build application
  continue-on-error: true  # Don't do this!
  run: npm run build
```

### 2. Always Upload Reports
```yaml
- name: Run tests
  continue-on-error: true
  run: npm test
- name: Upload results
  if: always()  # Upload even if test fails
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: test-results/
```

### 3. Implement Failure Notifications
```yaml
notify:
  needs: [test, build, deploy]
  if: failure()
  steps:
    - name: Send notification
      run: |
        curl -X POST ${{ secrets.WEBHOOK_URL }} \
          -d "Workflow failed: ${{ github.workflow }}"
```

### 4. Use Step Outcomes
```yaml
- name: Test
  id: test
  continue-on-error: true
  run: npm test
- name: Check result
  if: steps.test.outcome == 'failure'
  run: echo "Tests failed but continuing"
```

### 5. Conditional Deployment
```yaml
deploy:
  needs: [test, build]
  if: success() && github.ref == 'refs/heads/main'
  steps:
    - name: Deploy
      run: ./deploy.sh
```

### 6. Comprehensive Error Reporting
```yaml
report:
  needs: [lint, test, build, deploy]
  if: failure()
  steps:
    - name: Collect logs
      run: |
        echo "Failed job: ${{ needs.*.result }}"
        echo "Event: ${{ github.event_name }}"
        echo "Actor: ${{ github.actor }}"
        echo "Ref: ${{ github.ref }}"
```

### 7. Cache with Restore Keys
```yaml
- uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-deps-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-deps-
```

### 8. Job-Level Continue on Error
```yaml
test:
  continue-on-error: true  # Entire job can fail
  steps:
    - run: npm test
```

### 9. Status-Based Conditionals
```yaml
cleanup:
  if: always()  # Run regardless of status
  steps:
    - name: Clean up
      run: rm -rf temp/

notify-success:
  if: success()
  steps:
    - name: Success notification
      run: echo "All good!"

notify-failure:
  if: failure()
  steps:
    - name: Failure notification
      run: echo "Something failed!"
```

### 10. Combine Conditions
```yaml
deploy:
  needs: build
  if: success() && github.event_name == 'push' && github.ref == 'refs/heads/main'
  steps:
    - name: Deploy to production
      run: ./deploy.sh
```
