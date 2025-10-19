# Basic Deployment Workflow

## Overview

This project demonstrates a fundamental deployment workflow using GitHub Actions. It showcases the core concepts of CI/CD pipelines including testing, building, and deploying a Node.js application. The workflow implements a sequential job pattern where deployment only occurs after successful test execution.

This is an ideal starting point for understanding GitHub Actions deployment patterns before moving to more complex scenarios involving containers, secrets management, and cloud provider integrations.

## GitHub Actions Concepts

### Workflows
A workflow is an automated process defined in YAML that runs one or more jobs. This project's workflow (`deployment-basic.yml`) is triggered on push events and manual workflow dispatches.

### Jobs
Jobs are sets of steps that execute on the same runner. This workflow demonstrates:
- **Job Dependencies**: The `deploy` job uses `needs: test` to ensure tests pass before deployment
- **Parallel vs Sequential**: While jobs can run in parallel, this workflow uses sequential execution for safety

### Triggers
- **push**: Automatically runs on any push to the repository
- **workflow_dispatch**: Allows manual triggering from the GitHub UI

### Steps
Individual tasks within a job that can run commands or use actions from the marketplace.

### Actions
Reusable units of code that perform specific tasks:
- `actions/checkout@v4`: Checks out repository code
- `actions/setup-node@v4`: Sets up Node.js environment

## Prerequisites

### Repository Requirements
- Node.js project with `package.json`
- Test scripts configured in package.json (`npm test`)
- Build scripts configured in package.json (`npm run build`)

### Required Files
```
your-repo/
├── .github/
│   └── workflows/
│       └── deployment-basic.yml
├── package.json
├── package-lock.json
└── src/
    └── (your application code)
```

### Node.js Configuration
Your `package.json` should include:
```json
{
  "scripts": {
    "test": "jest",
    "build": "webpack --mode production"
  }
}
```

## Project Structure

```
deployment-basic/
└── deployment-basic.yml    # Main workflow file
```

### Workflow Location
GitHub Actions workflows must be placed in:
```
.github/workflows/deployment-basic.yml
```

## Workflow Files

### deployment-basic.yml

**Purpose**: Implements a basic two-stage deployment pipeline with testing and deployment phases.

**Trigger Events**:
- Push to any branch
- Manual workflow dispatch

**Jobs**:

#### 1. Test Job
Validates code quality and functionality before deployment.

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - Get Code (checkout repository)
    - Install NodeJS (version 18)
    - Install Dependencies (npm ci)
    - Run Tests (npm test)
```

**Key Points**:
- Uses `npm ci` instead of `npm install` for consistent, faster installs
- Runs on Ubuntu latest runner
- Must complete successfully for deploy job to start

#### 2. Deploy Job
Builds and deploys the application after successful tests.

```yaml
deploy:
  needs: test
  runs-on: ubuntu-latest
  steps:
    - Get Code (checkout repository)
    - Install NodeJS (version 18)
    - Install Dependencies (npm ci)
    - Build project (npm run build)
    - Deploy (echo placeholder)
```

**Key Points**:
- `needs: test` creates a job dependency
- Repeats checkout and dependency installation (isolated job environment)
- Deploy step is currently a placeholder for actual deployment logic

## Usage

### Setting Up the Workflow

1. **Copy the workflow file to your repository**:
   ```bash
   mkdir -p .github/workflows
   cp deployment-basic.yml .github/workflows/
   ```

2. **Ensure your package.json has required scripts**:
   ```json
   {
     "scripts": {
       "test": "your-test-command",
       "build": "your-build-command"
     }
   }
   ```

3. **Commit and push**:
   ```bash
   git add .github/workflows/deployment-basic.yml
   git commit -m "Add basic deployment workflow"
   git push
   ```

### Triggering the Workflow

**Automatic Trigger**:
- Push any commit to any branch
- Workflow runs automatically

**Manual Trigger**:
1. Navigate to Actions tab in GitHub
2. Select "Deploy project" workflow
3. Click "Run workflow"
4. Choose branch and click "Run workflow"

### Monitoring Workflow Execution

1. Go to the Actions tab in your GitHub repository
2. Click on the workflow run
3. View job execution and logs
4. Check for any failures in test or deploy stages

### Customizing the Deploy Step

Replace the echo command with actual deployment logic:

**Deploy to Static Hosting**:
```yaml
- name: Deploy
  run: |
    npm install -g surge
    surge ./dist your-domain.surge.sh --token ${{ secrets.SURGE_TOKEN }}
```

**Deploy to FTP**:
```yaml
- name: Deploy via FTP
  uses: SamKirkland/FTP-Deploy-Action@4.3.0
  with:
    server: ftp.example.com
    username: ${{ secrets.FTP_USERNAME }}
    password: ${{ secrets.FTP_PASSWORD }}
    local-dir: ./dist/
```

**Deploy to Netlify**:
```yaml
- name: Deploy to Netlify
  uses: nwtgck/actions-netlify@v2.0
  with:
    publish-dir: './dist'
    production-deploy: true
  env:
    NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
    NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## Key Features

### 1. Job Dependencies
The `needs: test` directive ensures deployment only occurs after successful testing:
```yaml
deploy:
  needs: test  # Won't run if test job fails
```

### 2. Consistent Environment Setup
Both jobs use identical Node.js setup for consistency:
```yaml
- name: Install NodeJS
  uses: actions/setup-node@v4
  with:
    node-version: '18'
```

### 3. Reliable Dependency Installation
Uses `npm ci` instead of `npm install`:
- Faster installation
- Requires package-lock.json
- Removes existing node_modules
- Installs exact versions from lockfile
- Ideal for CI/CD environments

### 4. Flexible Triggering
Supports both automated (push) and manual (workflow_dispatch) triggers:
```yaml
on: [push, workflow_dispatch]
```

### 5. Clear Stage Separation
Separates testing from deployment concerns:
- Test job focuses on validation
- Deploy job focuses on build and deployment

## Troubleshooting

### Workflow Not Triggering

**Problem**: Workflow doesn't run after push.

**Solutions**:
- Verify workflow file is in `.github/workflows/` directory
- Check YAML syntax is valid (use YAML linter)
- Ensure file has `.yml` or `.yaml` extension
- Check repository Actions are enabled (Settings > Actions)

### Test Job Failing

**Problem**: Tests fail in CI but pass locally.

**Solutions**:
- Check Node.js version matches local environment
- Verify all test dependencies are in `package.json`
- Review test logs in Actions tab for specific errors
- Ensure tests don't rely on local environment variables
- Check for timezone or locale-dependent tests

### Dependencies Installation Errors

**Problem**: `npm ci` fails with lock file errors.

**Solutions**:
```bash
# Regenerate lock file locally
rm package-lock.json
npm install
git add package-lock.json
git commit -m "Update package-lock.json"
git push
```

### Build Step Failing

**Problem**: Build script fails in deploy job.

**Solutions**:
- Ensure build script exists in package.json
- Check build dependencies are listed in dependencies or devDependencies
- Review build logs for missing modules
- Verify build command works locally with `npm run build`

### Deploy Job Not Running

**Problem**: Deploy job is skipped.

**Solutions**:
- Check if test job completed successfully
- Verify `needs: test` dependency is correctly configured
- Review workflow run logs for skip reasons
- Ensure no required checks are blocking execution

### Permission Issues

**Problem**: Actions fail with permission errors.

**Solutions**:
- Check repository Actions permissions (Settings > Actions > General)
- Ensure `GITHUB_TOKEN` has required permissions
- For private repositories, verify Actions are enabled

## Best Practices

### 1. Use Specific Action Versions
Pin actions to specific versions for reproducibility:
```yaml
# Good
uses: actions/checkout@v4

# Avoid
uses: actions/checkout@main
```

### 2. Implement Proper Job Dependencies
Always use `needs` when jobs have dependencies:
```yaml
deploy:
  needs: test  # Ensures test runs first
```

### 3. Use npm ci in CI/CD
Never use `npm install` in workflows:
```yaml
# Good - Faster, more reliable
- run: npm ci

# Avoid - Slower, can cause inconsistencies
- run: npm install
```

### 4. Separate Test and Build Concerns
Keep testing and building as separate, clear steps:
```yaml
- name: Run Tests
  run: npm test

- name: Build project
  run: npm run build
```

### 5. Add Meaningful Step Names
Use descriptive names for better log readability:
```yaml
# Good
- name: Install Dependencies
  run: npm ci

# Avoid
- name: Install
  run: npm ci
```

### 6. Fail Fast Strategy
Configure tests to fail fast to save execution time:
```json
{
  "scripts": {
    "test": "jest --bail"
  }
}
```

### 7. Use Workflow Status Badges
Add status badge to README.md:
```markdown
![Deployment](https://github.com/username/repo/workflows/Deploy%20project/badge.svg)
```

### 8. Optimize for Speed
Consider caching dependencies:
```yaml
- name: Cache node modules
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### 9. Environment-Specific Deployments
Use branch conditions for environment-specific deploys:
```yaml
deploy:
  if: github.ref == 'refs/heads/main'
  needs: test
```

### 10. Add Timeout Limits
Prevent infinite hangs with timeouts:
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 10
```
