# Using Reusable GitHub Actions Workflows

## Overview

This project demonstrates how to consume and integrate reusable workflows in GitHub Actions. It shows a complete CI/CD pipeline that calls a reusable deployment workflow, illustrating how to pass inputs, receive outputs, and structure workflows to maximize code reuse. This example showcases the caller-side implementation of reusable workflows, complementing the workflow definition shown in the reusable workflows project.

## GitHub Actions Concepts

### Consuming Reusable Workflows

When consuming reusable workflows, you:

- **Call workflows as jobs**: Use `uses` keyword at the job level
- **Pass inputs**: Provide configuration through the `with` keyword
- **Pass secrets**: Securely provide credentials through the `secrets` keyword
- **Receive outputs**: Access returned values using `needs.<job-id>.outputs.<output-name>`
- **Chain workflows**: Create dependencies between jobs including reusable workflow calls

### Key Concepts Demonstrated

- **Job-level workflow calls**: Calling reusable workflows as complete jobs
- **Input passing**: Providing parameters to reusable workflows
- **Output consumption**: Using values returned from reusable workflows
- **Job dependencies**: Orchestrating workflow execution with `needs`
- **Conditional execution**: Running jobs based on previous job results
- **Artifact passing**: Uploading artifacts for reusable workflows to consume

## Prerequisites

- GitHub repository with Actions enabled
- Reusable workflow defined in the repository (see GitHubActions/reusable)
- Understanding of GitHub Actions workflow syntax
- Node.js project with build scripts (for this example)
- Familiarity with artifacts and caching

## Project Structure

```
use-reuse/
├── use-reuse.yml         # Workflow that calls reusable workflow
└── README.md             # This documentation
```

## Workflow Files

### Main Workflow Using Reusable Deployment

**File**: `use-reuse.yml`

This workflow demonstrates a complete CI/CD pipeline that calls a reusable deployment workflow.

```yaml
name: Using Reusable Workflow
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
      id: run-tests
      run: npm run test
    - name: Upload test report
      if: failure() && steps.run-tests.outcome == 'failure'
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
    uses: ./.github/workflows/reusable.yml
    with:
      artifact-name: dist-files
  print-deploy-result:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
    - name: Print deploy output
      run: echo "${{ needs.deploy.outputs.result }}"
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

This workflow demonstrates a typical CI/CD pipeline structure:

```
lint ──────┐
           ├─> report (if failure)
test ──> build ──> deploy ──> print-deploy-result
                      └──────────┘
```

### Key Components

#### Calling a Reusable Workflow

```yaml
deploy:
  needs: build
  uses: ./.github/workflows/reusable.yml
  with:
    artifact-name: dist-files
```

**Key Points**:
- `uses` at job level references the reusable workflow
- Relative path starts with `./` for same repository
- `needs` ensures build completes before deployment
- `with` passes inputs to the reusable workflow
- No `runs-on` needed (defined in reusable workflow)

#### Consuming Workflow Outputs

```yaml
print-deploy-result:
  needs: deploy
  runs-on: ubuntu-latest
  steps:
  - name: Print deploy output
    run: echo "${{ needs.deploy.outputs.result }}"
```

**Key Points**:
- Access outputs using `needs.<job-id>.outputs.<output-name>`
- Requires `needs` to establish dependency
- Outputs are available to all dependent jobs

#### Dependency Caching

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

**Key Points**:
- Cache key uses `hashFiles()` for automatic invalidation
- Conditional install skips if cache hit
- Significantly speeds up workflow execution

#### Artifact Upload/Download

**Upload in build job**:
```yaml
- name: Upload artifacts
  uses: actions/upload-artifact@v3
  with:
    name: dist-files
    path: dist
```

**Download in reusable workflow**:
```yaml
- name: Get Code
  uses: actions/download-artifact@v3
  with:
    name: ${{ inputs.artifact-name }}
```

#### Multi-Job Dependencies

```yaml
report:
  needs: [ lint, deploy ]
  if: failure()
  runs-on: ubuntu-latest
```

**Key Points**:
- Multiple dependencies in array format
- Runs only if any dependency fails
- Useful for failure notifications

## Usage

### Basic Reusable Workflow Call

Simplest form of calling a reusable workflow:

```yaml
jobs:
  deploy:
    uses: ./.github/workflows/reusable.yml
```

### With Inputs

Pass configuration to the reusable workflow:

```yaml
jobs:
  deploy:
    uses: ./.github/workflows/reusable.yml
    with:
      artifact-name: dist-files
      environment: production
      timeout: 300
```

### With Secrets

Pass secrets to the reusable workflow:

```yaml
jobs:
  deploy:
    uses: ./.github/workflows/reusable.yml
    with:
      artifact-name: dist-files
    secrets:
      deploy-token: ${{ secrets.DEPLOY_TOKEN }}
      api-key: ${{ secrets.API_KEY }}
```

### Inherit All Secrets

Pass all repository secrets:

```yaml
jobs:
  deploy:
    uses: ./.github/workflows/reusable.yml
    secrets: inherit
    with:
      artifact-name: dist-files
```

### From Different Repository

Call reusable workflow from another repository:

```yaml
jobs:
  deploy:
    uses: my-org/shared-workflows/.github/workflows/deploy.yml@v1
    with:
      artifact-name: dist-files
    secrets:
      deploy-token: ${{ secrets.DEPLOY_TOKEN }}
```

### With Permissions

Explicitly set permissions for the reusable workflow:

```yaml
jobs:
  deploy:
    permissions:
      contents: read
      deployments: write
      id-token: write
    uses: ./.github/workflows/reusable.yml
    with:
      artifact-name: dist-files
```

### Multiple Reusable Workflows

Call multiple reusable workflows in sequence:

```yaml
jobs:
  deploy-staging:
    uses: ./.github/workflows/deploy.yml
    with:
      environment: staging

  test-staging:
    needs: deploy-staging
    uses: ./.github/workflows/integration-tests.yml
    with:
      environment: staging

  deploy-production:
    needs: test-staging
    uses: ./.github/workflows/deploy.yml
    with:
      environment: production
```

### Parallel Reusable Workflows

Run multiple reusable workflows in parallel:

```yaml
jobs:
  deploy-us:
    uses: ./.github/workflows/deploy.yml
    with:
      region: us-east-1

  deploy-eu:
    uses: ./.github/workflows/deploy.yml
    with:
      region: eu-west-1

  deploy-asia:
    uses: ./.github/workflows/deploy.yml
    with:
      region: ap-southeast-1

  verify:
    needs: [deploy-us, deploy-eu, deploy-asia]
    runs-on: ubuntu-latest
    steps:
      - name: Verify all deployments
        run: echo "All regions deployed successfully"
```

### Conditional Reusable Workflow Call

Call reusable workflow conditionally:

```yaml
jobs:
  deploy-dev:
    if: github.ref == 'refs/heads/develop'
    uses: ./.github/workflows/deploy.yml
    with:
      environment: development

  deploy-prod:
    if: github.ref == 'refs/heads/main'
    uses: ./.github/workflows/deploy.yml
    with:
      environment: production
```

## Key Features

### Job Orchestration

This workflow demonstrates sophisticated job orchestration:

1. **Parallel execution**: `lint` and `test` run in parallel
2. **Sequential execution**: `build` waits for `test`, `deploy` waits for `build`
3. **Conditional execution**: `report` only runs on failure
4. **Multiple dependencies**: `report` depends on both `lint` and `deploy`

### Artifact Management

Efficient artifact handling:

```yaml
# Upload in build job
- name: Upload artifacts
  uses: actions/upload-artifact@v3
  with:
    name: dist-files
    path: dist

# Pass artifact name to reusable workflow
deploy:
  uses: ./.github/workflows/reusable.yml
  with:
    artifact-name: dist-files
```

### Output Propagation

Using outputs from reusable workflows:

```yaml
# Reusable workflow returns outputs
deploy:
  uses: ./.github/workflows/reusable.yml
  with:
    artifact-name: dist-files

# Use outputs in dependent job
print-deploy-result:
  needs: deploy
  steps:
    - run: echo "${{ needs.deploy.outputs.result }}"
    - run: echo "${{ needs.deploy.outputs.url }}"
```

### Failure Handling

Comprehensive error reporting:

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

## Troubleshooting

### Reusable Workflow Not Found

**Error**: `Unable to resolve action ./.github/workflows/reusable.yml`

**Solution**:
- Ensure the reusable workflow file exists at the specified path
- Verify the workflow has `workflow_call` trigger defined
- Check file naming and path are correct
- Ensure code is checked out if needed (usually not required)

### Input Not Passed Correctly

**Error**: Reusable workflow receives empty or wrong input values

**Solution**:
- Verify input names match exactly (case-sensitive)
- Check that input types match expected types
- Ensure required inputs are provided

```yaml
# Correct
with:
  artifact-name: dist-files  # Matches input name exactly

# Incorrect
with:
  artifactName: dist-files  # Different case
```

### Output Not Available

**Error**: `needs.deploy.outputs.result` is empty

**Solution**:
- Ensure reusable workflow defines outputs at workflow level
- Verify job dependency with `needs`
- Check that reusable workflow actually sets the output
- Confirm output name matches exactly

```yaml
# In calling workflow
deploy:
  needs: build
  uses: ./.github/workflows/reusable.yml

use-output:
  needs: deploy  # Required to access outputs
  steps:
    - run: echo "${{ needs.deploy.outputs.result }}"
```

### Artifact Not Found

**Error**: `Artifact 'dist-files' not found`

**Solution**:
- Ensure artifact is uploaded before reusable workflow runs
- Verify artifact name matches exactly
- Check that upload job completes successfully
- Add job dependency with `needs`

```yaml
build:
  steps:
    - uses: actions/upload-artifact@v3
      with:
        name: dist-files  # Must match exactly

deploy:
  needs: build  # Ensures artifact is uploaded first
  uses: ./.github/workflows/reusable.yml
  with:
    artifact-name: dist-files  # Must match upload name
```

### Secrets Not Working

**Error**: Secret is empty in reusable workflow

**Solution**:
- Pass secrets explicitly or use `secrets: inherit`
- Ensure secrets are defined in repository settings
- Check that reusable workflow declares required secrets

```yaml
# Option 1: Explicit secrets
deploy:
  uses: ./.github/workflows/reusable.yml
  secrets:
    deploy-token: ${{ secrets.DEPLOY_TOKEN }}

# Option 2: Inherit all secrets
deploy:
  uses: ./.github/workflows/reusable.yml
  secrets: inherit
```

### Circular Dependency

**Error**: Workflow run fails with circular dependency error

**Solution**:
- Review job dependencies to identify circular references
- Reusable workflows cannot call themselves
- Restructure jobs to remove circular `needs` chains

```yaml
# Incorrect - circular dependency
job-a:
  needs: job-b

job-b:
  needs: job-a

# Correct - linear dependency
job-a:
  runs-on: ubuntu-latest

job-b:
  needs: job-a
```

### Permission Denied

**Error**: `Resource not accessible by integration`

**Solution**:
- Add necessary permissions to the job or workflow
- Check that GITHUB_TOKEN has required scopes
- For reusable workflows, permissions can be set at job level

```yaml
deploy:
  permissions:
    contents: read
    deployments: write
    id-token: write
  uses: ./.github/workflows/reusable.yml
```

## Best Practices

### Workflow Organization

1. **Separate concerns**: Keep build, test, and deploy logic separate
2. **Reuse common patterns**: Extract repeated workflow logic to reusable workflows
3. **Clear naming**: Use descriptive job and step names
4. **Consistent structure**: Follow a consistent pattern across workflows

### Dependency Management

1. **Cache dependencies**: Use caching to speed up workflows
2. **Minimize redundancy**: Don't repeat dependency installation in every job
3. **Use cache-hit**: Conditionally skip installation when cache is available

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

### Artifact Handling

1. **Name artifacts clearly**: Use descriptive artifact names
2. **Clean up artifacts**: Set retention days to avoid storage costs
3. **Minimize artifact size**: Only upload necessary files

```yaml
- name: Upload artifacts
  uses: actions/upload-artifact@v3
  with:
    name: dist-files
    path: dist
    retention-days: 7
```

### Error Handling

1. **Fail fast**: Use job dependencies to stop on critical failures
2. **Report failures**: Create notification jobs for failures
3. **Conditional steps**: Use `if: failure()` for cleanup or reporting

```yaml
cleanup:
  needs: [build, deploy]
  if: always()  # Runs even if previous jobs fail
  runs-on: ubuntu-latest
  steps:
    - name: Clean up resources
      run: ./cleanup.sh

notify:
  needs: [build, deploy]
  if: failure()  # Only runs on failure
  runs-on: ubuntu-latest
  steps:
    - name: Send failure notification
      run: ./notify-failure.sh
```

### Reusable Workflow Integration

1. **Version pinning**: Use specific versions for stability
2. **Input validation**: Validate inputs in reusable workflows
3. **Output documentation**: Document what outputs to expect
4. **Secret management**: Use `secrets: inherit` carefully

```yaml
# Production: Use tagged version
deploy:
  uses: org/repo/.github/workflows/deploy.yml@v1.2.0

# Development: Use branch
deploy:
  uses: org/repo/.github/workflows/deploy.yml@main
```

### Performance Optimization

1. **Parallel execution**: Run independent jobs in parallel
2. **Conditional execution**: Skip unnecessary jobs
3. **Efficient caching**: Use appropriate cache keys
4. **Minimize checkouts**: Only checkout when needed

```yaml
# Good: Parallel independent jobs
jobs:
  lint:
    runs-on: ubuntu-latest
  test:
    runs-on: ubuntu-latest
  build:
    needs: [lint, test]

# Bad: Unnecessary sequential execution
jobs:
  lint:
    runs-on: ubuntu-latest
  test:
    needs: lint  # Unnecessary dependency
  build:
    needs: test
```

### Security

1. **Minimal permissions**: Grant only necessary permissions
2. **Validate inputs**: Don't trust input values
3. **Protect secrets**: Never log secret values
4. **Pin actions**: Use commit SHAs for third-party actions

```yaml
jobs:
  deploy:
    permissions:
      contents: read      # Minimal permissions
      deployments: write
    uses: ./.github/workflows/reusable.yml
    secrets: inherit
```
