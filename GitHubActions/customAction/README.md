# Custom GitHub Actions

## Overview

This project demonstrates how to create custom GitHub Actions in three different formats: JavaScript-based actions, Docker-based actions, and composite actions. It showcases a complete CI/CD pipeline that uses custom actions for dependency caching and AWS S3 deployment, illustrating the power and flexibility of building reusable action components.

## GitHub Actions Concepts

### Custom Actions Types

GitHub Actions supports three types of custom actions:

1. **JavaScript Actions**: Run directly on the runner using Node.js, providing fast execution and access to the Actions toolkit
2. **Docker Actions**: Package the environment with your code, ensuring consistent execution across different platforms
3. **Composite Actions**: Combine multiple workflow steps into a single reusable action using shell scripts

### Key Concepts Demonstrated

- **Action Metadata**: Defining inputs, outputs, and execution environment in `action.yml`
- **Actions Toolkit**: Using `@actions/core`, `@actions/exec`, and `@actions/github` packages
- **Local Actions**: Referencing actions within the same repository using relative paths
- **Action Inputs/Outputs**: Passing data to actions and receiving results
- **Environment Variables**: Accessing secrets and configuration through environment variables

## Prerequisites

- GitHub repository with Actions enabled
- Node.js 16+ (for JavaScript actions)
- Docker (for Docker-based actions)
- AWS Account with S3 bucket configured (for deployment examples)
- GitHub Secrets configured:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`

## Project Structure

```
customAction/
├── workflows/
│   └── deploy.yml                          # Main workflow using custom actions
├── actions/
│   ├── cached-deps/
│   │   └── action.yml                      # Composite action for dependency caching
│   ├── deploy-s3-javascript/
│   │   ├── action.yml                      # JavaScript action metadata
│   │   ├── main.js                         # JavaScript action implementation
│   │   ├── package.json                    # Node.js dependencies
│   │   └── package-lock.json
│   └── deploy-s3-docker/
│       ├── action.yml                      # Docker action metadata
│       ├── Dockerfile                      # Docker image definition
│       ├── deployment.py                   # Python deployment script
│       └── requirements.txt                # Python dependencies
└── README.md
```

## Workflow Files

### Main Deployment Workflow

**File**: `workflows/deploy.yml`

This workflow demonstrates a complete CI/CD pipeline with lint, test, build, and deploy stages, utilizing custom actions for common operations.

```yaml
name: Deployment
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
      - name: Load & cache dependencies
        id: cache-deps
        uses: ./.github/actions/cached-deps
        with:
          caching: 'false'
      - name: Output information
        run: echo "Cache used? ${{ steps.cache-deps.outputs.used-cache }}"
      - name: Lint code
        run: npm run lint
```

**Key Features**:
- Uses local custom action with `./.github/actions/` path
- Demonstrates input parameters (`caching: 'false'`)
- Shows output usage (`steps.cache-deps.outputs.used-cache`)
- Implements job dependencies with `needs`
- Configures permissions for OIDC authentication

## Custom Actions

### 1. Composite Action: Cached Dependencies

**File**: `actions/cached-deps/action.yml`

A composite action that combines caching and dependency installation into a single reusable component.

```yaml
name: 'Get & Cache Dependencies'
description: 'Get the dependencies (via npm) and cache them.'
inputs:
  caching:
    description: 'Whether to cache dependencies or not.'
    required: false
    default: 'true'
outputs:
  used-cache:
    description: 'Whether the cache was used.'
    value: ${{ steps.install.outputs.cache }}
runs:
  using: 'composite'
  steps:
    - name: Cache dependencies
      if: inputs.caching == 'true'
      id: cache
      uses: actions/cache@v3
      with:
        path: node_modules
        key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
    - name: Install dependencies
      id: install
      if: steps.cache.outputs.cache-hit != 'true' || inputs.caching != 'true'
      run: |
        npm ci
        echo "cache='${{ inputs.caching }}'" >> $GITHUB_OUTPUT
      shell: bash
```

**Features**:
- Conditional caching based on input parameter
- Uses `hashFiles()` for cache key generation
- Outputs cache usage status
- Skips installation if cache hit occurs

### 2. JavaScript Action: S3 Deployment

**File**: `actions/deploy-s3-javascript/action.yml`

```yaml
name: 'Deploy to AWS S3'
description: 'Deploy a static website via AWS S3.'
inputs:
  bucket:
    description: 'The S3 bucket name.'
    required: true
  bucket-region:
    description: 'The region of the S3 bucket.'
    required: false
    default: 'us-east-1'
  dist-folder:
    description: 'The folder containing the deployable files.'
    required: true
outputs:
  website-url:
    description: 'The URL of the deployed website.'
runs:
  using: 'node16'
  main: 'main.js'
```

**Implementation** (`main.js`):

```javascript
const core = require('@actions/core');
const exec = require('@actions/exec');

function run() {
  // 1) Get some input values
  const bucket = core.getInput('bucket', { required: true });
  const bucketRegion = core.getInput('bucket-region', { required: true });
  const distFolder = core.getInput('dist-folder', { required: true });

  // 2) Upload files
  const s3Uri = `s3://${bucket}`;
  exec.exec(`aws s3 sync ${distFolder} ${s3Uri} --region ${bucketRegion}`);

  const websiteUrl = `http://${bucket}.s3-website-${bucketRegion}.amazonaws.com`;
  core.setOutput('website-url', websiteUrl);
}

run();
```

**Dependencies** (`package.json`):

```json
{
  "dependencies": {
    "@actions/core": "^1.9.1",
    "@actions/exec": "^1.1.1",
    "@actions/github": "^5.0.3"
  }
}
```

**Features**:
- Uses Actions toolkit for input/output handling
- Executes AWS CLI commands via `@actions/exec`
- Returns deployment URL as output
- Fast execution on Node.js runtime

### 3. Docker Action: S3 Deployment

**File**: `actions/deploy-s3-docker/action.yml`

```yaml
name: 'Deploy to AWS S3'
description: 'Deploy a static website via AWS S3.'
inputs:
  bucket:
    description: 'The S3 bucket name.'
    required: true
  bucket-region:
    description: 'The region of the S3 bucket.'
    required: false
    default: 'us-east-1'
  dist-folder:
    description: 'The folder containing the deployable files.'
    required: true
outputs:
  website-url:
    description: 'The URL of the deployed website.'
runs:
  using: 'docker'
  image: 'Dockerfile'
```

**Dockerfile**:

```dockerfile
FROM python:3

COPY requirements.txt /requirements.txt
RUN pip install -r requirements.txt

COPY deployment.py /deployment.py

CMD ["python", "/deployment.py"]
```

**Implementation** (`deployment.py`):

```python
import os
import boto3
import mimetypes
from botocore.config import Config

def run():
    bucket = os.environ['INPUT_BUCKET']
    bucket_region = os.environ['INPUT_BUCKET-REGION']
    dist_folder = os.environ['INPUT_DIST-FOLDER']

    configuration = Config(region_name=bucket_region)
    s3_client = boto3.client('s3', config=configuration)

    for root, subdirs, files in os.walk(dist_folder):
        for file in files:
            s3_client.upload_file(
                os.path.join(root, file),
                bucket,
                os.path.join(root, file).replace(dist_folder + '/', ''),
                ExtraArgs={"ContentType": mimetypes.guess_type(file)[0]}
            )

    website_url = f'http://{bucket}.s3-website-{bucket_region}.amazonaws.com'
    with open(os.environ['GITHUB_OUTPUT'], 'a') as gh_output:
        print(f'website-url={website_url}', file=gh_output)

if __name__ == '__main__':
    run()
```

**Features**:
- Uses Python and boto3 for AWS SDK operations
- Proper MIME type detection for uploaded files
- Containerized environment ensures consistency
- Accesses inputs via `INPUT_*` environment variables
- Sets outputs using `GITHUB_OUTPUT` file

## Usage

### Using the Custom Actions

1. **Reference local actions in your workflow**:

```yaml
- name: Cache dependencies
  uses: ./.github/actions/cached-deps
  with:
    caching: 'true'
```

2. **Deploy to S3 with JavaScript action**:

```yaml
- name: Deploy with JavaScript
  uses: ./.github/actions/deploy-s3-javascript
  with:
    bucket: my-bucket-name
    bucket-region: us-east-1
    dist-folder: ./dist
```

3. **Deploy to S3 with Docker action**:

```yaml
- name: Deploy with Docker
  uses: ./.github/actions/deploy-s3-docker
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  with:
    bucket: my-bucket-name
    dist-folder: ./dist
```

### Creating Your Own Custom Action

**Step 1**: Create action directory structure:

```bash
mkdir -p .github/actions/my-action
cd .github/actions/my-action
```

**Step 2**: Create `action.yml`:

```yaml
name: 'My Custom Action'
description: 'Description of what the action does'
inputs:
  my-input:
    description: 'Input description'
    required: true
outputs:
  my-output:
    description: 'Output description'
runs:
  using: 'node16'  # or 'docker' or 'composite'
  main: 'index.js'
```

**Step 3**: Implement action logic (for JavaScript):

```javascript
const core = require('@actions/core');

async function run() {
  try {
    const myInput = core.getInput('my-input');
    // Your logic here
    core.setOutput('my-output', 'result');
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
```

**Step 4**: Install dependencies (for JavaScript):

```bash
npm init -y
npm install @actions/core @actions/github
```

**Step 5**: Use in workflow:

```yaml
- uses: ./.github/actions/my-action
  with:
    my-input: 'value'
```

## Key Features

### Composite Actions
- Combine multiple steps into reusable components
- Use shell scripts without additional dependencies
- Conditional execution with `if` statements
- Output passing between steps

### JavaScript Actions
- Fast execution on Node.js runtime
- Access to GitHub Actions Toolkit
- Direct integration with GitHub API
- No Docker overhead

### Docker Actions
- Consistent execution environment
- Support for any programming language
- Isolated dependencies
- Reproducible builds

### Action Metadata
- Clear input/output definitions
- Required and optional parameters
- Default values
- Comprehensive descriptions

### Output Handling
- Set outputs using `$GITHUB_OUTPUT`
- Reference outputs in subsequent steps
- Pass data between jobs via outputs

## Troubleshooting

### Action Not Found

**Error**: `Unable to resolve action ./.github/actions/my-action`

**Solution**:
- Ensure the action path is correct relative to repository root
- Verify `action.yml` exists in the action directory
- Check that code is checked out before using local actions

```yaml
- name: Checkout code
  uses: actions/checkout@v3
- name: Use local action
  uses: ./.github/actions/my-action
```

### JavaScript Action Fails to Run

**Error**: `Cannot find module '@actions/core'`

**Solution**:
- Install dependencies locally: `npm install`
- Commit `node_modules` directory or use `@vercel/ncc` to compile
- Ensure `package.json` lists all dependencies

```bash
npm install -g @vercel/ncc
ncc build index.js -o dist
```

Update `action.yml`:
```yaml
runs:
  using: 'node16'
  main: 'dist/index.js'
```

### Docker Action Build Failures

**Error**: `docker: Error response from daemon`

**Solution**:
- Validate Dockerfile syntax
- Test Docker build locally: `docker build -t test .`
- Check base image availability
- Verify all COPY sources exist

### Input Not Received

**Error**: Input value is empty or undefined

**Solution**:
- Check input name matches exactly (case-sensitive)
- For JavaScript: Use `core.getInput('input-name')`
- For Docker: Use `INPUT_INPUT-NAME` (uppercase, hyphens preserved)
- Verify required inputs are provided in workflow

### Output Not Set

**Error**: Output is empty or not accessible

**Solution**:
- For modern actions, write to `$GITHUB_OUTPUT` file:

```javascript
// JavaScript
const core = require('@actions/core');
core.setOutput('output-name', 'value');
```

```python
# Python
with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
    print(f'output-name=value', file=f)
```

```bash
# Bash
echo "output-name=value" >> $GITHUB_OUTPUT
```

### AWS Credentials Not Working

**Error**: `Unable to locate credentials`

**Solution**:
- Ensure secrets are configured in repository settings
- Pass credentials as environment variables:

```yaml
env:
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

- Consider using OIDC authentication with `permissions`:

```yaml
permissions:
  id-token: write
  contents: read
```

## Best Practices

### Action Design

1. **Single Responsibility**: Each action should do one thing well
2. **Clear Naming**: Use descriptive names for inputs and outputs
3. **Validation**: Validate inputs and provide helpful error messages
4. **Documentation**: Document inputs, outputs, and usage in action.yml
5. **Versioning**: Tag actions with semantic versions for stability

### Input/Output Management

```yaml
inputs:
  my-input:
    description: 'Clear description of what this input does'
    required: true
    default: 'sensible-default'  # Provide defaults when appropriate

outputs:
  my-output:
    description: 'Clear description of what this output contains'
```

### Error Handling

**JavaScript**:
```javascript
try {
  // Action logic
} catch (error) {
  core.setFailed(`Action failed: ${error.message}`);
}
```

**Python**:
```python
import sys

try:
    # Action logic
except Exception as e:
    print(f"::error::Action failed: {str(e)}")
    sys.exit(1)
```

### Security

1. **Never log secrets**: Use `core.setSecret()` to mask values
2. **Validate inputs**: Sanitize user inputs to prevent injection
3. **Use specific versions**: Pin action dependencies to specific versions
4. **Minimal permissions**: Request only necessary permissions

```javascript
// Mask sensitive values
core.setSecret(apiKey);
```

### Performance

1. **Cache dependencies**: Cache node_modules or pip packages
2. **Minimize Docker layers**: Combine RUN commands in Dockerfile
3. **Use composite actions**: For simple tasks, avoid Docker overhead
4. **Optimize builds**: Use .dockerignore to exclude unnecessary files

### Testing

1. **Test locally**: Test JavaScript actions with Node.js directly
2. **Test Docker builds**: Build and run Docker containers locally
3. **Use act**: Test workflows locally using [act](https://github.com/nektos/act)
4. **Version control**: Test with different input combinations

### Publishing Actions

1. **Create releases**: Tag stable versions
2. **Semantic versioning**: Use v1, v1.0.0 format
3. **Update major version tags**: Keep v1 tag pointing to latest v1.x.x
4. **Document changes**: Maintain CHANGELOG.md

```bash
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```
