# GitHub Actions Artifacts and Outputs Management

## Overview

This project demonstrates advanced artifact management and job output patterns in GitHub Actions. It showcases how to share data between jobs using both artifacts (for files) and outputs (for values), implement caching strategies for dependencies, and create efficient CI/CD pipelines with proper data flow.

## GitHub Actions Concepts

### Artifacts

Artifacts are files produced by a workflow that can be shared between jobs or downloaded after workflow completion:

- **Upload**: `actions/upload-artifact@v4` - Save files for later use
- **Download**: `actions/download-artifact@v4` - Retrieve saved files
- **Retention**: Artifacts are stored for 90 days (default) or custom period
- **Use Cases**: Build outputs, test reports, logs, compiled binaries

### Job Outputs

Job outputs are string values that can be passed between jobs:

```yaml
jobs:
  job1:
    outputs:
      my-output: ${{ steps.step-id.outputs.value }}
  job2:
    needs: job1
    steps:
      - run: echo "${{ needs.job1.outputs.my-output }}"
```

### Step Outputs

Steps can produce outputs using `$GITHUB_OUTPUT`:

```yaml
- id: my-step
  run: echo "key=value" >> $GITHUB_OUTPUT
- run: echo "${{ steps.my-step.outputs.key }}"
```

### Caching

Caching stores dependencies to speed up workflows:

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ hashFiles('**/package-lock.json') }}
```

## Prerequisites

- GitHub repository with Actions enabled
- Node.js project with npm scripts:
  - `lint`: Code linting
  - `test`: Unit tests
  - `build`: Build process (outputs to `dist/`)
- `package.json` and `package-lock.json` files
- Build process that creates JavaScript files in `dist/assets/`

## Project Structure

```
demo-Artifacts-Outputs/
├── demo-Artifacts-Outputs.yml    # Main workflow file
└── README.md                     # This file
```

## Workflow Files

### demo-Artifacts-Outputs.yml

This workflow demonstrates comprehensive artifact and output management:

```yaml
name: Deploy website
on:
  push:
    branches:
      - master
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Get code
        uses: actions/checkout@v4
      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
      - name: Install dependencies
        run: npm ci
      - name: Lint code
        run: npm run lint
      - name: Test code
        run: npm run test
  build:
    needs: test
    runs-on: ubuntu-latest
    outputs:
      script-file: ${{ steps.publish.outputs.script-file }}
    steps:
      - name: Get code
        uses: actions/checkout@v4
      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
      - name: Install dependencies
        run: npm ci
      - name: Build website
        run: npm run build
      - name: Publish JS filename
        id: publish
        run: find dist/assets/*.js -type f -execdir echo 'script-file={}' >> $GITHUB_OUTPUT ';'
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist-files
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Get build artifacts
        uses: actions/download-artifact@v4
        with:
          name: dist-files
      - name: Output contents
        run: ls
      - name: Output filename
        run: echo "${{ needs.build.outputs.script-file }}"
      - name: Deploy
        run: echo "Deploying..."
```

### Workflow Architecture

```
┌──────────────────────────────────────┐
│       Trigger: push to master        │
└───────────────┬──────────────────────┘
                │
                ▼
           ┌────────┐
           │  test  │  ← Lint & test code
           └────┬───┘
                │ needs: test
                ▼
           ┌────────┐
           │ build  │  ← Build & create outputs
           │        │    - Output: script-file
           │        │    - Artifact: dist-files
           └────┬───┘
                │ needs: build
                ▼
           ┌────────┐
           │ deploy │  ← Download artifacts
           │        │    - Read: script-file output
           └────────┘    - Use: dist-files artifact
```

### Detailed Job Breakdown

#### Test Job
```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - name: Get code
      uses: actions/checkout@v4
    - name: Cache dependencies
      uses: actions/cache@v4
      with:
        path: ~/.npm
        key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
    - name: Install dependencies
      run: npm ci
    - name: Lint code
      run: npm run lint
    - name: Test code
      run: npm run test
```
**Purpose**: Quality assurance
- Checks out code
- Caches npm dependencies
- Runs linting and tests
- Blocks build if tests fail

#### Build Job
```yaml
build:
  needs: test
  runs-on: ubuntu-latest
  outputs:
    script-file: ${{ steps.publish.outputs.script-file }}
  steps:
    - name: Get code
      uses: actions/checkout@v4
    - name: Cache dependencies
      uses: actions/cache@v4
      with:
        path: ~/.npm
        key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
    - name: Install dependencies
      run: npm ci
    - name: Build website
      run: npm run build
    - name: Publish JS filename
      id: publish
      run: find dist/assets/*.js -type f -execdir echo 'script-file={}' >> $GITHUB_OUTPUT ';'
    - name: Upload artifacts
      uses: actions/upload-artifact@v4
      with:
        name: dist-files
        path: dist
```
**Purpose**: Build application and export data
- Waits for test completion
- Builds production code
- Finds generated JavaScript filename
- Exports filename as job output
- Uploads build directory as artifact

#### Deploy Job
```yaml
deploy:
  needs: build
  runs-on: ubuntu-latest
  steps:
    - name: Get build artifacts
      uses: actions/download-artifact@v4
      with:
        name: dist-files
    - name: Output contents
      run: ls
    - name: Output filename
      run: echo "${{ needs.build.outputs.script-file }}"
    - name: Deploy
      run: echo "Deploying..."
```
**Purpose**: Deploy built application
- Downloads build artifacts
- Accesses script filename from build output
- Performs deployment

## Usage

### Running the Workflow

1. **Trigger Workflow**:
   ```bash
   git checkout master
   git add .
   git commit -m "Update application"
   git push origin master
   ```

2. **Monitor Progress**:
   - Go to Actions tab on GitHub
   - Select running workflow
   - View job progression: test → build → deploy

3. **Download Artifacts**:
   - In workflow run view
   - Scroll to "Artifacts" section
   - Download "dist-files" artifact
   - Extract ZIP to view build output

### Understanding Data Flow

#### Caching Flow
```
First Run:
1. Cache miss → Install dependencies → Store cache
2. Build completes

Subsequent Runs (no dependency changes):
1. Cache hit → Skip installation → Use cached deps
2. Build completes faster
```

#### Output Flow
```
Build Job:
1. Build creates: dist/assets/app.abc123.js
2. Find command outputs: script-file=app.abc123.js
3. Step output captured
4. Job output set: script-file=app.abc123.js

Deploy Job:
1. Access via: needs.build.outputs.script-file
2. Value: app.abc123.js
```

#### Artifact Flow
```
Build Job:
1. Build creates dist/ directory
2. Upload dist/ as "dist-files" artifact
3. Artifact stored in GitHub

Deploy Job:
1. Download "dist-files" artifact
2. Files extracted to workspace
3. Ready for deployment
```

## Key Features

### 1. Job Output Sharing
```yaml
# Define output in build job
outputs:
  script-file: ${{ steps.publish.outputs.script-file }}

# Access in deploy job
run: echo "${{ needs.build.outputs.script-file }}"
```
**Use Case**: Share metadata like filenames, versions, URLs between jobs

### 2. Step Output Creation
```yaml
- name: Publish JS filename
  id: publish
  run: find dist/assets/*.js -type f -execdir echo 'script-file={}' >> $GITHUB_OUTPUT ';'
```
**Use Case**: Capture dynamic values from commands

### 3. Artifact Upload
```yaml
- name: Upload artifacts
  uses: actions/upload-artifact@v4
  with:
    name: dist-files
    path: dist
```
**Use Case**: Share files between jobs, preserve build outputs

### 4. Artifact Download
```yaml
- name: Get build artifacts
  uses: actions/download-artifact@v4
  with:
    name: dist-files
```
**Use Case**: Retrieve files in subsequent jobs

### 5. Dependency Caching
```yaml
- name: Cache dependencies
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
```
**Use Case**: Speed up workflows by reusing dependencies

### 6. Cache Key Hashing
```yaml
key: deps-node-modules-${{ hashFiles('**/package-lock.json') }}
```
**Use Case**: Automatic cache invalidation on dependency changes

## Troubleshooting

### Outputs Not Accessible

**Problem**: `needs.build.outputs.script-file` is empty
- **Solution**: Verify output is defined at job level:
  ```yaml
  build:
    outputs:
      script-file: ${{ steps.publish.outputs.script-file }}
  ```

**Problem**: Step output not captured
- **Solution**: Ensure using `$GITHUB_OUTPUT`:
  ```yaml
  # Correct
  run: echo "key=value" >> $GITHUB_OUTPUT

  # Incorrect (old syntax)
  run: echo "::set-output name=key::value"
  ```

**Problem**: Step ID not found
- **Solution**: Verify step has `id` field:
  ```yaml
  - name: My step
    id: my-step-id  # Required for output access
    run: echo "output=value" >> $GITHUB_OUTPUT
  ```

### Artifact Issues

**Problem**: Artifact not found in download
- **Solution**: Check artifact name matches exactly:
  ```yaml
  # Upload
  name: dist-files
  # Download
  name: dist-files  # Must match
  ```

**Problem**: Artifact upload fails
- **Solution**: Verify path exists before upload:
  ```yaml
  - run: npm run build  # Creates dist/
  - run: ls -la dist    # Verify exists
  - uses: actions/upload-artifact@v4
    with:
      path: dist
  ```

**Problem**: Downloaded artifact is empty
- **Solution**: Check upload path is correct:
  ```yaml
  # Wrong - uploads dist directory itself
  path: .
  # Correct - uploads dist contents
  path: dist
  ```

### Cache Issues

**Problem**: Cache not working
- **Solution**: Verify cache key includes hashFiles():
  ```yaml
  key: deps-${{ hashFiles('**/package-lock.json') }}
  ```

**Problem**: Cache not invalidating
- **Solution**: Ensure lock file is committed:
  ```bash
  git add package-lock.json
  git commit -m "Update dependencies"
  ```

**Problem**: Cache size too large
- **Solution**: Cache specific directories:
  ```yaml
  # Better - cache only npm cache
  path: ~/.npm
  # Avoid - may be too large
  path: node_modules
  ```

### Output Formatting Issues

**Problem**: Multi-line output truncated
- **Solution**: Use EOF delimiter:
  ```yaml
  run: |
    echo "output<<EOF" >> $GITHUB_OUTPUT
    cat multi-line-file.txt >> $GITHUB_OUTPUT
    echo "EOF" >> $GITHUB_OUTPUT
  ```

**Problem**: Special characters in output
- **Solution**: Encode output or use base64:
  ```yaml
  run: echo "output=$(echo 'value' | base64)" >> $GITHUB_OUTPUT
  ```

## Best Practices

### 1. Define Outputs at Job Level
```yaml
jobs:
  build:
    outputs:
      version: ${{ steps.version.outputs.value }}
      artifact-name: ${{ steps.artifact.outputs.name }}
    steps:
      - id: version
        run: echo "value=1.0.0" >> $GITHUB_OUTPUT
```

### 2. Use Descriptive Artifact Names
```yaml
- uses: actions/upload-artifact@v4
  with:
    name: build-${{ github.sha }}-${{ runner.os }}
    path: dist
```

### 3. Set Artifact Retention
```yaml
- uses: actions/upload-artifact@v4
  with:
    name: dist-files
    path: dist
    retention-days: 7  # Keep for 1 week
```

### 4. Upload Multiple Artifacts
```yaml
- uses: actions/upload-artifact@v4
  with:
    name: build-outputs
    path: |
      dist/
      logs/
      reports/
```

### 5. Implement Effective Caching
```yaml
- uses: actions/cache@v4
  id: cache
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
      ${{ runner.os }}-
```

### 6. Conditional Step Execution
```yaml
- name: Install dependencies
  if: steps.cache.outputs.cache-hit != 'true'
  run: npm ci
```

### 7. Validate Outputs
```yaml
- name: Validate output
  run: |
    if [ -z "${{ steps.build.outputs.version }}" ]; then
      echo "Error: version output is empty"
      exit 1
    fi
```

### 8. Use Outputs for Deployment Info
```yaml
build:
  outputs:
    deploy-url: ${{ steps.deploy.outputs.url }}
    version: ${{ steps.version.outputs.number }}
notify:
  needs: build
  steps:
    - run: |
        echo "Deployed version ${{ needs.build.outputs.version }}"
        echo "URL: ${{ needs.build.outputs.deploy-url }}"
```

### 9. Artifact Organization
```yaml
# Separate artifacts by type
- uses: actions/upload-artifact@v4
  with:
    name: test-results
    path: test-results/

- uses: actions/upload-artifact@v4
  with:
    name: build-artifacts
    path: dist/
```

### 10. Error Handling for Outputs
```yaml
- name: Set output with fallback
  id: version
  run: |
    VERSION=$(git describe --tags || echo "v0.0.0")
    echo "number=$VERSION" >> $GITHUB_OUTPUT
```
