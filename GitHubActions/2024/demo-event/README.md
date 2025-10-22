# GitHub Actions Events and Triggers Demo

## Overview

This project demonstrates how to use various GitHub Actions event triggers to control when workflows execute. It showcases different event types, activity types, branch filters, and path filters to create precise workflow automation rules. Understanding event triggers is fundamental to building efficient CI/CD pipelines that run only when necessary.

## GitHub Actions Concepts

### Events and Triggers

GitHub Actions workflows are triggered by specific events that occur in your repository. This project demonstrates three primary trigger types:

- **push**: Triggered when commits are pushed to the repository
- **pull_request**: Triggered when pull request activities occur
- **workflow_dispatch**: Allows manual workflow execution from the GitHub UI

### Event Filtering

Events can be filtered using:

- **Activity Types**: Specific actions within an event (e.g., `opened`, `closed`, `reopened`)
- **Branch Filters**: Target specific branches using exact names or patterns
- **Path Filters**: Include or exclude workflows based on changed file paths

### Branch Patterns

GitHub Actions supports glob patterns for branch matching:
- Exact match: `main`
- Wildcard prefix: `dev-*` (matches `dev-feature`, `dev-bug`, etc.)
- Wildcard suffix: `feat/*` (matches `feat/login`, `feat/api`, etc.)

## Prerequisites

- GitHub repository with Actions enabled
- Node.js project with `package.json` configured
- Basic understanding of YAML syntax
- NPM scripts defined for: `test` and `build`

## Project Structure

```
demo-event/
├── demo-event.yml          # Main workflow file demonstrating event triggers
└── README.md              # This file
```

## Workflow Files

### demo-event.yml

This workflow demonstrates comprehensive event filtering and triggers:

```yaml
name: Deploy project events
on:
    pull_request:
        types:
            - opened
        branches:
            -   main
            -   'dev-*'
            -   'feat/*'
    workflow_dispatch:
    push:
        branches:
            -   main
            -   'dev-*'
            -   'feat/*'
        paths-ignore:
            -   '.github/workflows/output.yml'
            -   '.github/workflows/deployment.yml'

jobs:
    deploy:
        runs-on: ubuntu-latest
        steps:
            -   name: Get Code
                uses: actions/checkout@v4
            -   name: Install NodeJS
                uses: actions/setup-node@v4
                with:
                    node-version: '18'
            -   name: Install Dependencies
                run: npm ci
            -   name: Run Tests
                run: npm test
            -   name: Build project
                run: npm run build
            -   name: Deploy
                run: echo "Deploying ..."
```

### Event Trigger Breakdown

#### Pull Request Trigger
```yaml
pull_request:
    types:
        - opened
    branches:
        - main
        - 'dev-*'
        - 'feat/*'
```
- Triggers only when PRs are **opened** (not synchronized, reopened, etc.)
- Only for PRs targeting: `main`, branches starting with `dev-`, or branches in `feat/` folder

#### Workflow Dispatch Trigger
```yaml
workflow_dispatch:
```
- Enables manual workflow execution from GitHub UI
- Useful for on-demand deployments or testing

#### Push Trigger
```yaml
push:
    branches:
        - main
        - 'dev-*'
        - 'feat/*'
    paths-ignore:
        - '.github/workflows/output.yml'
        - '.github/workflows/deployment.yml'
```
- Triggers on pushes to `main`, `dev-*`, or `feat/*` branches
- **Ignores** changes to specific workflow files (prevents circular triggers)

## Usage

### Triggering the Workflow

1. **Automatic on Push**:
   ```bash
   git checkout main
   git add .
   git commit -m "Update application"
   git push origin main
   ```

2. **Automatic on Pull Request**:
   ```bash
   git checkout -b feat/new-feature
   git add .
   git commit -m "Add new feature"
   git push origin feat/new-feature
   # Create PR to main branch on GitHub
   ```

3. **Manual Trigger**:
   - Navigate to Actions tab in GitHub
   - Select "Deploy project events" workflow
   - Click "Run workflow" button
   - Choose branch and click "Run workflow"

### Testing Different Triggers

**Test branch patterns**:
```bash
# Should trigger
git push origin dev-api
git push origin feat/authentication

# Should NOT trigger
git push origin bugfix/fix-typo  # Commented out in workflow
```

**Test path filters**:
```bash
# Should NOT trigger workflow
git add .github/workflows/output.yml
git commit -m "Update output workflow"
git push origin main

# Should trigger workflow
git add src/app.js
git commit -m "Update app"
git push origin main
```

## Key Features

### 1. Multiple Event Types
Demonstrates combining multiple trigger events in a single workflow for maximum flexibility.

### 2. Activity Type Filtering
Shows how to trigger on specific pull request activities (`opened` only), preventing unnecessary runs on every PR update.

### 3. Branch Pattern Matching
Implements flexible branch targeting using:
- Direct branch names
- Prefix wildcards (`dev-*`)
- Directory-style patterns (`feat/*`)

### 4. Path-Based Filtering
Uses `paths-ignore` to prevent workflow execution when only documentation or other workflow files change, saving CI/CD resources.

### 5. Manual Workflow Control
Includes `workflow_dispatch` for on-demand execution, useful for:
- Manual deployments
- Testing workflow changes
- Recovery operations

### 6. Standard CI/CD Pipeline
Demonstrates complete build pipeline:
- Code checkout
- Environment setup (Node.js)
- Dependency installation
- Testing
- Building
- Deployment

## Troubleshooting

### Workflow Not Triggering

**Problem**: Workflow doesn't run on push
- **Solution**: Verify branch name matches patterns in workflow
- **Check**: Ensure changed files aren't in `paths-ignore` list
- **Verify**: Workflow file is in `.github/workflows/` directory

**Problem**: Pull request doesn't trigger workflow
- **Solution**: Check PR target branch matches configured branches
- **Verify**: PR activity type is `opened` (not `synchronize` or `reopened`)

### Workflow Runs Too Often

**Problem**: Workflow triggers on every file change
- **Solution**: Add `paths-ignore` or `paths` filters:
  ```yaml
  push:
    paths-ignore:
      - '**.md'
      - 'docs/**'
  ```

**Problem**: Workflow runs on PR updates
- **Solution**: Limit activity types:
  ```yaml
  pull_request:
    types: [opened, ready_for_review]
  ```

### Manual Trigger Not Available

**Problem**: "Run workflow" button not showing
- **Solution**: Ensure `workflow_dispatch:` is in the `on:` section
- **Verify**: Workflow file is on the branch you're viewing
- **Check**: You have write permissions to the repository

## Best Practices

### 1. Use Specific Event Types
```yaml
# Good - specific activity types
pull_request:
  types: [opened, synchronize, reopened]

# Less optimal - triggers on all PR activities
pull_request:
```

### 2. Implement Path Filtering
Reduce unnecessary workflow runs:
```yaml
push:
  paths:
    - 'src/**'
    - 'package*.json'
  paths-ignore:
    - '**.md'
    - 'docs/**'
```

### 3. Use Branch Protection
Combine with branch patterns for security:
```yaml
push:
  branches:
    - main
    - 'release/**'
  # Prevents accidental runs on feature branches
```

### 4. Include Workflow Dispatch
Always add manual trigger capability:
```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:  # Enables manual runs
```

### 5. Document Your Triggers
Add comments explaining trigger logic:
```yaml
on:
  push:
    branches:
      - main
      - 'dev-*'      # Development branches
      - 'feat/*'     # Feature branches
      # - 'bugfix/*' # Disabled for testing
```

### 6. Avoid Circular Triggers
Prevent workflows from triggering themselves:
```yaml
push:
  paths-ignore:
    - '.github/workflows/**'  # Ignore workflow changes
```

### 7. Combine Events Strategically
```yaml
# Deploy on main, test on PRs
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```
