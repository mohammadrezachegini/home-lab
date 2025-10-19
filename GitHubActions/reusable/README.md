# Reusable GitHub Actions Workflows

## Overview

This project demonstrates how to create reusable workflows in GitHub Actions. Reusable workflows allow you to define workflow logic once and call it from multiple workflows across your repository or organization, promoting DRY (Don't Repeat Yourself) principles and simplifying workflow maintenance. This example shows a deployment workflow that can be called from other workflows with configurable inputs and outputs.

## GitHub Actions Concepts

### Reusable Workflows

Reusable workflows are complete workflow files that can be called from other workflows, similar to functions in programming. They help:

- **Reduce duplication**: Define common workflow logic once
- **Centralize maintenance**: Update workflow logic in one place
- **Standardize processes**: Ensure consistent behavior across projects
- **Share workflows**: Reuse workflows across repositories in an organization

### Key Concepts Demonstrated

- **workflow_call trigger**: Special event that allows workflows to be called by other workflows
- **Inputs and Outputs**: Pass data to and from reusable workflows
- **Job-level outputs**: Export data from jobs to be used by callers
- **Secrets passing**: Securely pass secrets to reusable workflows
- **Default values**: Provide sensible defaults for optional inputs

## Prerequisites

- GitHub repository with Actions enabled
- Understanding of basic GitHub Actions syntax
- Familiarity with workflow jobs and steps
- Knowledge of YAML syntax

## Project Structure

```
reusable/
├── reusable.yml          # Reusable deployment workflow
└── README.md             # This documentation
```

## Workflow Files

### Reusable Deployment Workflow

**File**: `reusable.yml`

This workflow defines a reusable deployment process that can be called from other workflows.

```yaml
name: Reusable Deploy
on:
  workflow_call:
    inputs:
      artifact-name:
        description: The name of the deployable artifact files
        required: false
        default: dist
        type: string
    outputs:
      result:
        description: The result of the deployment operation
        value: ${{ jobs.deploy.outputs.outcome }}
jobs:
  deploy:
    outputs:
      outcome: ${{ steps.set-result.outputs.step-result }}
    runs-on: ubuntu-latest
    steps:
    - name: Get Code
      uses: actions/download-artifact@v3
      with:
        name: ${{ inputs.artifact-name }}
    - name: List files
      run: ls
    - name: Output information
      run: echo "Deploying & uploading..."
    - name: Set result output
      id: set-result
      run: echo "step-result=success" >> $GITHUB_OUTPUT
```

### Workflow Components

#### Trigger Configuration

```yaml
on:
  workflow_call:
    inputs:
      artifact-name:
        description: The name of the deployable artifact files
        required: false
        default: dist
        type: string
    outputs:
      result:
        description: The result of the deployment operation
        value: ${{ jobs.deploy.outputs.outcome }}
```

**Key Points**:
- `workflow_call` trigger enables the workflow to be called by other workflows
- `inputs` define parameters that can be passed from calling workflows
- `outputs` define values that will be returned to calling workflows
- Each input must specify a `type` (string, number, boolean)
- Outputs reference job outputs using `jobs.<job-id>.outputs.<output-name>`

#### Job Outputs

```yaml
deploy:
  outputs:
    outcome: ${{ steps.set-result.outputs.step-result }}
  runs-on: ubuntu-latest
```

**Key Points**:
- Job-level `outputs` make step outputs available to the workflow output
- Multiple outputs can be defined at the job level
- Outputs are referenced using `steps.<step-id>.outputs.<output-name>`

#### Setting Step Outputs

```yaml
- name: Set result output
  id: set-result
  run: echo "step-result=success" >> $GITHUB_OUTPUT
```

**Key Points**:
- Use `$GITHUB_OUTPUT` environment file for setting outputs
- Format: `output-name=output-value`
- Step must have an `id` to be referenced

## Usage

### Calling the Reusable Workflow

To use this reusable workflow from another workflow, reference it using the `uses` keyword at the job level:

**Example Caller Workflow**:

```yaml
name: Deploy Application
on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      - name: Build application
        run: npm run build
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: dist-files
          path: dist

  deploy:
    needs: build
    uses: ./.github/workflows/reusable.yml
    with:
      artifact-name: dist-files

  print-result:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - name: Print deployment result
        run: echo "Deployment result: ${{ needs.deploy.outputs.result }}"
```

### Calling from a Different Repository

You can call reusable workflows from other repositories in your organization:

```yaml
jobs:
  deploy:
    uses: org-name/repo-name/.github/workflows/reusable.yml@main
    with:
      artifact-name: my-app-files
```

**Syntax**: `{owner}/{repo}/.github/workflows/{filename}@{ref}`
- `owner/repo`: Repository containing the reusable workflow
- `filename`: Name of the workflow file
- `ref`: Branch, tag, or commit SHA

### With Secrets

If your reusable workflow needs secrets, define them in the workflow:

**Reusable workflow** (`reusable.yml`):

```yaml
on:
  workflow_call:
    secrets:
      deploy-token:
        description: 'Token for deployment'
        required: true
      api-key:
        description: 'API key for service'
        required: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        env:
          TOKEN: ${{ secrets.deploy-token }}
          API_KEY: ${{ secrets.api-key }}
        run: ./deploy.sh
```

**Caller workflow**:

```yaml
jobs:
  deploy:
    uses: ./.github/workflows/reusable.yml
    secrets:
      deploy-token: ${{ secrets.DEPLOY_TOKEN }}
      api-key: ${{ secrets.API_KEY }}
```

### Passing All Secrets

You can pass all secrets to a reusable workflow using `secrets: inherit`:

```yaml
jobs:
  deploy:
    uses: ./.github/workflows/reusable.yml
    secrets: inherit
    with:
      artifact-name: dist-files
```

## Key Features

### Input Types

Reusable workflows support multiple input types:

```yaml
on:
  workflow_call:
    inputs:
      string-input:
        type: string
        required: true
      number-input:
        type: number
        default: 42
      boolean-input:
        type: boolean
        default: false
```

### Multiple Outputs

Define multiple outputs from a reusable workflow:

```yaml
on:
  workflow_call:
    outputs:
      status:
        description: 'Deployment status'
        value: ${{ jobs.deploy.outputs.status }}
      url:
        description: 'Deployment URL'
        value: ${{ jobs.deploy.outputs.url }}
      timestamp:
        description: 'Deployment timestamp'
        value: ${{ jobs.deploy.outputs.timestamp }}

jobs:
  deploy:
    outputs:
      status: ${{ steps.deploy.outputs.status }}
      url: ${{ steps.deploy.outputs.url }}
      timestamp: ${{ steps.timestamp.outputs.time }}
```

### Conditional Execution

Use inputs for conditional logic:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        if: ${{ inputs.environment == 'production' }}
        run: ./deploy-prod.sh

      - name: Deploy to staging
        if: ${{ inputs.environment == 'staging' }}
        run: ./deploy-staging.sh
```

### Matrix Strategy with Inputs

Combine inputs with matrix strategies:

```yaml
on:
  workflow_call:
    inputs:
      environments:
        type: string
        default: '["dev", "staging", "prod"]'

jobs:
  deploy:
    strategy:
      matrix:
        environment: ${{ fromJSON(inputs.environments) }}
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to ${{ matrix.environment }}
        run: ./deploy.sh ${{ matrix.environment }}
```

## Troubleshooting

### Workflow Not Found

**Error**: `Unable to resolve action ./.github/workflows/reusable.yml`

**Solution**:
- Ensure workflow file is in `.github/workflows/` directory
- Verify the path and filename are correct
- Check that the branch/tag/SHA specified exists
- Ensure workflow has `workflow_call` trigger

### Input Not Received

**Error**: Input value is empty or undefined

**Solution**:
- Verify input name matches exactly (case-sensitive)
- Check that required inputs are provided in caller workflow
- Ensure input type matches expected type
- For optional inputs, check if default value is appropriate

```yaml
# Caller workflow
with:
  artifact-name: dist-files  # Must match input name exactly
```

### Output Not Available

**Error**: Output is empty when accessed

**Solution**:
- Ensure job has `outputs` defined
- Verify step has an `id` to be referenced
- Check output is set using `$GITHUB_OUTPUT`
- Confirm output is mapped at workflow level

```yaml
# Reusable workflow
jobs:
  deploy:
    outputs:
      result: ${{ steps.set-result.outputs.value }}  # Map step output to job output
    steps:
      - id: set-result
        run: echo "value=success" >> $GITHUB_OUTPUT

on:
  workflow_call:
    outputs:
      result:
        value: ${{ jobs.deploy.outputs.result }}  # Map job output to workflow output
```

### Secrets Not Passed

**Error**: Secret is empty in reusable workflow

**Solution**:
- Declare secrets in `workflow_call` trigger
- Pass secrets explicitly in caller workflow
- Or use `secrets: inherit` to pass all secrets
- Verify secret exists in repository/organization settings

```yaml
# Reusable workflow
on:
  workflow_call:
    secrets:
      my-secret:
        required: true

# Caller workflow
jobs:
  deploy:
    uses: ./.github/workflows/reusable.yml
    secrets:
      my-secret: ${{ secrets.MY_SECRET }}
```

### Cannot Call Workflow from Different Repository

**Error**: `Permission denied` or `Workflow not found`

**Solution**:
- For private repositories, ensure repository has access to the reusable workflow repo
- For organization-level reusable workflows, check organization settings
- Verify the reference format: `org/repo/.github/workflows/file.yml@ref`
- Ensure the workflow is in a public repository or you have appropriate access

### Circular Dependencies

**Error**: Workflow call creates circular dependency

**Solution**:
- Reusable workflows cannot call themselves
- Reusable workflows cannot call other reusable workflows that call them back
- Restructure your workflows to avoid circular references
- Consider using composite actions for shared steps instead

## Best Practices

### Design Principles

1. **Single Purpose**: Each reusable workflow should have a clear, single purpose
2. **Meaningful Names**: Use descriptive names for inputs and outputs
3. **Documentation**: Provide detailed descriptions for all inputs, outputs, and secrets
4. **Defaults**: Provide sensible default values for optional inputs
5. **Flexibility**: Make workflows configurable through inputs

### Input Validation

Validate inputs at the beginning of the workflow:

```yaml
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Validate environment input
        run: |
          if [[ ! "${{ inputs.environment }}" =~ ^(dev|staging|prod)$ ]]; then
            echo "Error: Invalid environment. Must be dev, staging, or prod"
            exit 1
          fi
```

### Error Handling

Provide meaningful error messages and outputs:

```yaml
jobs:
  deploy:
    outputs:
      status: ${{ steps.deploy.outputs.status || 'failed' }}
      error: ${{ steps.deploy.outputs.error }}
    steps:
      - name: Deploy
        id: deploy
        run: |
          if ! ./deploy.sh; then
            echo "status=failed" >> $GITHUB_OUTPUT
            echo "error=Deployment script failed" >> $GITHUB_OUTPUT
            exit 1
          fi
          echo "status=success" >> $GITHUB_OUTPUT
```

### Versioning

Version your reusable workflows for stability:

```yaml
# Caller workflow - using specific version
jobs:
  deploy:
    uses: org/repo/.github/workflows/reusable.yml@v1.0.0
    with:
      artifact-name: dist-files
```

Versioning strategies:
- Use tags for releases: `@v1.0.0`
- Use branches for development: `@main`, `@develop`
- Use commit SHAs for absolute stability: `@abc1234`

### Documentation

Document your reusable workflow at the top of the file:

```yaml
# Reusable Deployment Workflow
#
# This workflow deploys a static site to cloud storage.
#
# Inputs:
#   - artifact-name: Name of the build artifact (default: dist)
#   - environment: Target environment (dev/staging/prod)
#
# Outputs:
#   - url: Deployed site URL
#   - status: Deployment status (success/failed)
#
# Secrets required:
#   - DEPLOY_TOKEN: Authentication token for deployment
#
# Example usage:
#   jobs:
#     deploy:
#       uses: ./.github/workflows/reusable.yml
#       with:
#         artifact-name: my-app
#         environment: production
#       secrets:
#         DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}

name: Reusable Deploy
on:
  workflow_call:
    # ...
```

### Security

1. **Minimize permissions**: Request only necessary permissions
2. **Validate inputs**: Don't trust input values blindly
3. **Secrets handling**: Never log secrets or expose them in outputs
4. **Access control**: Limit who can call reusable workflows

```yaml
jobs:
  deploy:
    permissions:
      contents: read
      deployments: write
    steps:
      - name: Sanitize input
        env:
          ARTIFACT_NAME: ${{ inputs.artifact-name }}
        run: |
          # Validate artifact name doesn't contain malicious characters
          if [[ "$ARTIFACT_NAME" =~ [^a-zA-Z0-9_-] ]]; then
            echo "Invalid artifact name"
            exit 1
          fi
```

### Testing

1. **Test with different inputs**: Verify all input combinations work
2. **Test outputs**: Ensure outputs are set correctly
3. **Test error scenarios**: Verify error handling works
4. **Use test repositories**: Test changes before using in production

### Performance

1. **Cache dependencies**: Use caching to speed up workflows
2. **Parallel execution**: Run independent jobs in parallel
3. **Minimize checkout**: Only checkout code when necessary
4. **Optimize artifact usage**: Use artifacts efficiently

```yaml
jobs:
  deploy:
    steps:
      - name: Download artifact
        uses: actions/download-artifact@v3
        with:
          name: ${{ inputs.artifact-name }}

      # Don't checkout code if not needed
      # - uses: actions/checkout@v3
```
