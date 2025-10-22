# GitHub Actions Matrix Strategy

## Overview

This project demonstrates the matrix strategy in GitHub Actions for running parallel jobs across multiple configurations. Matrix builds enable testing code against different versions, operating systems, and configurations simultaneously, providing comprehensive testing coverage and faster CI/CD pipelines through parallelization.

## GitHub Actions Concepts

### Matrix Strategy

A matrix strategy creates multiple job runs based on variable combinations:

```yaml
strategy:
  matrix:
    node-version: [12, 14, 16]
    os: [ubuntu-latest, windows-latest]
# Creates 6 jobs: 3 versions × 2 OSes
```

### Matrix Variables

Access matrix variables using `${{ matrix.variable }}`:

```yaml
runs-on: ${{ matrix.os }}
steps:
  - uses: actions/setup-node@v3
    with:
      node-version: ${{ matrix.node-version }}
```

### Include Directive

Add specific matrix combinations:

```yaml
include:
  - node-version: 18
    os: ubuntu-latest
# Adds one additional combination
```

### Exclude Directive

Remove specific matrix combinations:

```yaml
exclude:
  - node-version: 12
    os: windows-latest
# Removes this specific combination
```

### Continue on Error

Allow matrix jobs to fail without stopping others:

```yaml
strategy:
  matrix:
    # ...
continue-on-error: true
```

## Prerequisites

- GitHub repository with Actions enabled
- Node.js project with npm scripts:
  - `build`: Build process that works across Node versions
- `package.json` file compatible with multiple Node versions
- Understanding of parallel job execution

## Project Structure

```
matrix/
├── matrix.yml            # Matrix strategy workflow
└── README.md            # This file
```

## Workflow Files

### matrix.yml

This workflow demonstrates comprehensive matrix configuration:

```yaml
name: Matrix Demo
on: push
jobs:
  build:
    continue-on-error: true
    strategy:
      matrix:
        node-version: [ 12, 14, 16 ]
        operating-system: [ ubuntu-latest, windows-latest ]
        include:
        - node-version: 18
          operating-system: ubuntu-latest
        exclude:
        - node-version: 12
          operating-system: windows-latest
    runs-on: ${{ matrix.operating-system }}
    steps:
    - name: Get Code
      uses: actions/checkout@v3
    - name: Install NodeJS
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
    - name: Install Dependencies
      run: npm ci
    - name: Build project
      run: npm run build
```

### Matrix Expansion

The workflow creates the following job matrix:

**Base Matrix** (3 versions × 2 OSes = 6 combinations):
```
node-12 + ubuntu-latest
node-12 + windows-latest  ← EXCLUDED
node-14 + ubuntu-latest
node-14 + windows-latest
node-16 + ubuntu-latest
node-16 + windows-latest
```

**After Exclude**:
```
node-12 + ubuntu-latest
node-14 + ubuntu-latest
node-14 + windows-latest
node-16 + ubuntu-latest
node-16 + windows-latest
```

**After Include** (adds 1 combination):
```
node-12 + ubuntu-latest
node-14 + ubuntu-latest
node-14 + windows-latest
node-16 + ubuntu-latest
node-16 + windows-latest
node-18 + ubuntu-latest  ← ADDED
```

**Total: 6 parallel jobs**

### Job Visualization

```
┌─────────────────────────────────┐
│     Trigger: push (any branch)  │
└────────────┬────────────────────┘
             │
             │ Matrix Strategy
             │
      ┌──────┴──────┬──────┬──────┬──────┬──────┐
      │             │      │      │      │      │
      ▼             ▼      ▼      ▼      ▼      ▼
  ┌────────┐  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
  │ Node 12│  │ Node 14│ │ Node 14│ │ Node 16│ │ Node 16│ │ Node 18│
  │ Ubuntu │  │ Ubuntu │ │Windows │ │ Ubuntu │ │Windows │ │ Ubuntu │
  └────────┘  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
      │             │      │      │      │      │
      └──────┬──────┴──────┴──────┴──────┴──────┘
             │
             ▼
      All jobs run in parallel
```

### Detailed Configuration Breakdown

#### Strategy Definition
```yaml
strategy:
  matrix:
    node-version: [ 12, 14, 16 ]
    operating-system: [ ubuntu-latest, windows-latest ]
```
- Defines two matrix dimensions
- Creates cartesian product of combinations
- 3 Node versions × 2 OSes = 6 base jobs

#### Include Additional Configurations
```yaml
include:
  - node-version: 18
    operating-system: ubuntu-latest
```
- Adds Node 18 on Ubuntu
- Useful for testing latest/specific versions
- Can include additional variables per combination

#### Exclude Specific Combinations
```yaml
exclude:
  - node-version: 12
    operating-system: windows-latest
```
- Removes Node 12 on Windows
- Useful when certain combinations are incompatible
- Must match all specified fields

#### Continue on Error
```yaml
continue-on-error: true
```
- Job-level error handling
- Failed jobs don't stop other matrix jobs
- Useful for experimental configurations

#### Dynamic Runner Selection
```yaml
runs-on: ${{ matrix.operating-system }}
```
- Runner selected based on matrix variable
- Supports: ubuntu-latest, windows-latest, macos-latest

#### Dynamic Node Version
```yaml
- uses: actions/setup-node@v3
  with:
    node-version: ${{ matrix.node-version }}
```
- Node.js version from matrix variable
- Each job uses different version

## Usage

### Running the Workflow

1. **Trigger on Any Push**:
   ```bash
   git add .
   git commit -m "Test matrix build"
   git push origin main  # Or any branch
   ```

2. **View Matrix Jobs**:
   - Go to Actions tab on GitHub
   - Select the workflow run
   - See all 6 jobs listed separately
   - Each shows Node version and OS in job name

3. **Monitor Parallel Execution**:
   - All jobs start simultaneously
   - View individual job logs
   - See which configurations pass/fail

### Understanding Job Names

GitHub automatically generates descriptive job names:
```
build (12, ubuntu-latest)
build (14, ubuntu-latest)
build (14, windows-latest)
build (16, ubuntu-latest)
build (16, windows-latest)
build (18, ubuntu-latest)
```

### Testing Specific Scenarios

**Test Node version compatibility**:
```bash
# Make changes that might break on older Node
git commit -m "Update to ES2020 features"
git push
# Matrix tests all versions automatically
```

**Test OS-specific issues**:
```bash
# Add OS-specific code
git commit -m "Add path handling"
git push
# Tests both Ubuntu and Windows
```

## Key Features

### 1. Multi-Dimensional Matrix
```yaml
strategy:
  matrix:
    node-version: [ 12, 14, 16 ]
    operating-system: [ ubuntu-latest, windows-latest ]
```
**Use Case**: Test across multiple Node versions and operating systems

### 2. Include Directive
```yaml
include:
  - node-version: 18
    operating-system: ubuntu-latest
```
**Use Case**: Add specific configurations not in base matrix

### 3. Exclude Directive
```yaml
exclude:
  - node-version: 12
    operating-system: windows-latest
```
**Use Case**: Remove unsupported or unnecessary combinations

### 4. Matrix Variable Access
```yaml
runs-on: ${{ matrix.operating-system }}
node-version: ${{ matrix.node-version }}
```
**Use Case**: Configure jobs based on matrix values

### 5. Parallel Execution
All matrix jobs run simultaneously, significantly reducing total execution time.

### 6. Continue on Error
```yaml
continue-on-error: true
```
**Use Case**: Allow failing configurations without blocking others

### 7. Cross-Platform Testing
Automatically tests code on different operating systems to catch platform-specific bugs.

## Troubleshooting

### Too Many Jobs Created

**Problem**: Matrix creates too many combinations
- **Solution**: Use exclude to remove unnecessary combinations:
  ```yaml
  strategy:
    matrix:
      node: [12, 14, 16, 18]
      os: [ubuntu, windows, macos]
      exclude:
        - node: 12
          os: macos
        - node: 12
          os: windows
  ```

**Problem**: Need to limit job count
- **Solution**: Use max-parallel:
  ```yaml
  strategy:
    max-parallel: 4
    matrix:
      # ...
  ```

### Include Not Working

**Problem**: Include adds unexpected combinations
- **Solution**: Include adds to base matrix, doesn't replace:
  ```yaml
  matrix:
    os: [ubuntu-latest]
    node: [14]
  include:
    - os: ubuntu-latest
      node: 16  # Adds 2nd job
  # Result: 2 jobs total
  ```

**Problem**: Include creates duplicate
- **Solution**: Check if combination already exists in base matrix

### Exclude Not Working

**Problem**: Exclude doesn't remove combination
- **Solution**: Must match ALL fields exactly:
  ```yaml
  # Won't work - missing fields
  exclude:
    - node: 12

  # Works - all fields specified
  exclude:
    - node: 12
      os: windows-latest
  ```

### Matrix Variable Issues

**Problem**: Matrix variable not accessible
- **Solution**: Verify syntax:
  ```yaml
  # Correct
  ${{ matrix.node-version }}

  # Wrong
  ${{ matrix.nodeVersion }}
  ```

**Problem**: Variable names with special characters
- **Solution**: Use hyphens, not underscores:
  ```yaml
  # Recommended
  node-version: [12, 14]

  # Less readable
  node_version: [12, 14]
  ```

### Platform-Specific Failures

**Problem**: Build fails only on Windows
- **Solution**: Check path separators and line endings:
  ```yaml
  - name: Cross-platform path
    run: |
      echo "Path: ${{ github.workspace }}"
      # Use forward slashes or path.join
  ```

**Problem**: Commands not found on Windows
- **Solution**: Ensure cross-platform commands or use conditionals:
  ```yaml
  - name: List files (Unix)
    if: runner.os != 'Windows'
    run: ls -la
  - name: List files (Windows)
    if: runner.os == 'Windows'
    run: dir
  ```

## Best Practices

### 1. Define Meaningful Matrix Variables
```yaml
strategy:
  matrix:
    node-version: [14, 16, 18]
    os: [ubuntu-latest, windows-latest, macos-latest]
    include:
      - node-version: 18
        os: ubuntu-latest
        experimental: true
```

### 2. Use Include for Special Cases
```yaml
include:
  # Test LTS versions
  - node-version: 18
    os: ubuntu-latest
    lts: true
  # Test latest features
  - node-version: 20
    os: ubuntu-latest
    experimental: true
```

### 3. Exclude Wisely
```yaml
exclude:
  # Old Node on expensive runners
  - node-version: 12
    os: macos-latest
  # Incompatible combinations
  - node-version: 12
    os: windows-latest
```

### 4. Limit Parallel Jobs for Cost
```yaml
strategy:
  max-parallel: 3
  matrix:
    # Large matrix
```

### 5. Use Fail-Fast Strategically
```yaml
strategy:
  fail-fast: false  # Don't cancel other jobs on first failure
  matrix:
    # ...
```

### 6. Add Matrix Context to Artifacts
```yaml
- uses: actions/upload-artifact@v3
  with:
    name: build-${{ matrix.os }}-node${{ matrix.node-version }}
    path: dist/
```

### 7. Conditional Steps Based on Matrix
```yaml
- name: Windows-specific build
  if: matrix.os == 'windows-latest'
  run: npm run build:windows

- name: Unix build
  if: matrix.os != 'windows-latest'
  run: npm run build:unix
```

### 8. Matrix for Environment Variables
```yaml
strategy:
  matrix:
    include:
      - environment: production
        api-url: https://api.prod.com
      - environment: staging
        api-url: https://api.staging.com
steps:
  - run: echo "Testing ${{ matrix.environment }}"
    env:
      API_URL: ${{ matrix.api-url }}
```

### 9. Complex Matrix with Multiple Variables
```yaml
strategy:
  matrix:
    node: [14, 16, 18]
    package-manager: [npm, yarn, pnpm]
    os: [ubuntu-latest]
    exclude:
      - node: 14
        package-manager: pnpm
```

### 10. Name Matrix Jobs Clearly
```yaml
jobs:
  test:
    name: Test Node ${{ matrix.node }} on ${{ matrix.os }}
    strategy:
      matrix:
        # ...
```
