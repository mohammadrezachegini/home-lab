# GitHub Actions Basic Output and Context

## Overview

This project demonstrates how to access and output GitHub Actions context information, including the GitHub context object and event details. Understanding context objects is essential for debugging workflows, accessing metadata, and building dynamic CI/CD pipelines that respond to repository events.

## GitHub Actions Concepts

### Context Objects

GitHub Actions provides several context objects containing information about the workflow run:

- **github**: Information about the workflow run, repository, and event
- **env**: Environment variables set in the workflow
- **job**: Information about the currently running job
- **steps**: Information about steps in the current job
- **runner**: Information about the runner executing the job
- **secrets**: Encrypted secrets configured in the repository
- **needs**: Outputs from jobs that the current job depends on

### The GitHub Context

The `github` context contains:
- Repository information (`github.repository`, `github.ref`)
- Event data (`github.event`, `github.event_name`)
- Actor information (`github.actor`)
- SHA and ref information (`github.sha`, `github.ref`)
- Workflow details (`github.workflow`, `github.run_id`)

### Context Functions

- `toJSON()`: Converts objects to formatted JSON strings
- `hashFiles()`: Generates hash of file patterns
- `contains()`: Checks if string contains substring
- `startsWith()`: Checks if string starts with substring

## Prerequisites

- GitHub repository with Actions enabled
- Basic understanding of YAML syntax
- Familiarity with JSON format

## Project Structure

```
output-basic/
├── output-basic.yml       # Workflow demonstrating context output
└── README.md             # This file
```

## Workflow Files

### output-basic.yml

This simple workflow outputs GitHub context information:

```yaml
name: Output information
on: workflow_dispatch
jobs:
    info:
        runs-on: ubuntu-latest
        steps:
            - name: Output GitHub context
              run: echo "${{ toJSON(github) }}"
            - name: Output event details
              run: echo "${{ toJSON(github.event) }}"
```

### Workflow Breakdown

#### Manual Trigger
```yaml
on: workflow_dispatch
```
- Allows manual execution from GitHub UI
- No automatic triggers
- Useful for debugging and exploration

#### Info Job
```yaml
jobs:
    info:
        runs-on: ubuntu-latest
```
- Single job that outputs context information
- Runs on Ubuntu runner

#### Step 1: Output GitHub Context
```yaml
- name: Output GitHub context
  run: echo "${{ toJSON(github) }}"
```
Outputs the entire GitHub context object, including:
- Repository details
- Workflow run information
- Event data
- Actor information
- Git references

#### Step 2: Output Event Details
```yaml
- name: Output event details
  run: echo "${{ toJSON(github.event) }}"
```
Outputs specific event details, which vary based on trigger type:
- For `workflow_dispatch`: User who triggered, inputs provided
- For `push`: Commits, pusher, before/after refs
- For `pull_request`: PR details, changes, base/head info

## Usage

### Running the Workflow

1. **Navigate to Actions Tab**:
   - Go to your repository on GitHub
   - Click "Actions" tab
   - Select "Output information" workflow

2. **Trigger Manually**:
   - Click "Run workflow" button
   - Select branch (default: main)
   - Click "Run workflow"

3. **View Output**:
   - Click on the running workflow
   - Click on "info" job
   - Expand each step to see JSON output

### Example Output

#### GitHub Context Output
```json
{
  "token": "***",
  "job": "info",
  "ref": "refs/heads/main",
  "sha": "abc123def456...",
  "repository": "username/repo-name",
  "repository_owner": "username",
  "repositoryUrl": "git://github.com/username/repo-name.git",
  "run_id": "1234567890",
  "run_number": "42",
  "retention_days": "90",
  "run_attempt": "1",
  "actor": "username",
  "workflow": "Output information",
  "head_ref": "",
  "base_ref": "",
  "event_name": "workflow_dispatch",
  "event": { ... },
  "server_url": "https://github.com",
  "api_url": "https://api.github.com",
  "graphql_url": "https://api.github.com/graphql",
  "ref_name": "main",
  "ref_protected": false,
  "ref_type": "branch",
  "workspace": "/home/runner/work/repo-name/repo-name",
  "action": "__run",
  "action_path": "",
  "action_ref": "",
  "action_repository": "",
  "action_status": "",
  "path": "/home/runner/work/_temp/_runner_file_commands/...",
  "env": "/home/runner/work/_temp/_runner_file_commands/..."
}
```

#### Event Context Output (workflow_dispatch)
```json
{
  "inputs": null,
  "ref": "refs/heads/main",
  "repository": {
    "id": 123456789,
    "name": "repo-name",
    "full_name": "username/repo-name",
    "private": false,
    "owner": {
      "login": "username",
      "id": 987654321
    },
    "html_url": "https://github.com/username/repo-name",
    "description": "Repository description",
    "fork": false,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T12:00:00Z",
    "default_branch": "main"
  },
  "sender": {
    "login": "username",
    "id": 987654321,
    "type": "User"
  },
  "workflow": ".github/workflows/output-basic.yml"
}
```

## Key Features

### 1. Context Inspection
Enables viewing complete GitHub context for debugging and understanding available data.

### 2. Event Data Access
Shows event-specific information that varies based on trigger type.

### 3. JSON Formatting
Uses `toJSON()` function to output structured, readable data.

### 4. Manual Triggering
Demonstrates `workflow_dispatch` for on-demand execution.

### 5. Minimal Setup
Simple workflow requiring no dependencies or code checkout.

## Troubleshooting

### Empty or Missing Output

**Problem**: No output visible in step logs
- **Solution**: Ensure step is expanded in GitHub Actions UI
- **Check**: Click on step name to expand output

**Problem**: Output shows `{}`
- **Solution**: Context might be empty for this event type
- **Verify**: Try different trigger (push vs workflow_dispatch)

### JSON Parsing Issues

**Problem**: Output not formatted as JSON
- **Solution**: Ensure using `toJSON()` function:
  ```yaml
  # Correct
  run: echo "${{ toJSON(github) }}"

  # Incorrect
  run: echo "${{ github }}"
  ```

### Sensitive Data Exposure

**Problem**: Tokens visible in output
- **Solution**: GitHub automatically masks secrets
- **Note**: `github.token` will show as `***` in logs

**Problem**: Need to output secrets safely
- **Solution**: Don't output secrets directly. Use for authentication only:
  ```yaml
  # Bad - exposes secret
  run: echo "${{ secrets.API_KEY }}"

  # Good - uses secret for auth
  run: curl -H "Authorization: Bearer ${{ secrets.API_KEY }}" ...
  ```

## Best Practices

### 1. Use Context for Dynamic Workflows
```yaml
steps:
  - name: Set environment based on branch
    run: |
      if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
        echo "ENV=production" >> $GITHUB_ENV
      else
        echo "ENV=development" >> $GITHUB_ENV
      fi
```

### 2. Access Specific Context Properties
```yaml
# More efficient than outputting entire context
- name: Show specific info
  run: |
    echo "Repository: ${{ github.repository }}"
    echo "Branch: ${{ github.ref_name }}"
    echo "Actor: ${{ github.actor }}"
    echo "SHA: ${{ github.sha }}"
```

### 3. Conditional Execution Based on Context
```yaml
- name: Deploy to production
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  run: ./deploy.sh
```

### 4. Use Event Data for Logic
```yaml
- name: Comment on PR
  if: github.event_name == 'pull_request'
  run: |
    echo "PR #${{ github.event.pull_request.number }}"
    echo "Author: ${{ github.event.pull_request.user.login }}"
```

### 5. Debugging with Context Output
```yaml
# Add debugging step during development
- name: Debug workflow
  if: runner.debug == '1'
  run: |
    echo "GitHub Context:"
    echo "${{ toJSON(github) }}"
    echo "Environment Variables:"
    env
```

### 6. Access Commit Information
```yaml
- name: Show commit details
  run: |
    echo "Commit SHA: ${{ github.sha }}"
    echo "Commit message: ${{ github.event.head_commit.message }}"
    echo "Author: ${{ github.event.head_commit.author.name }}"
```

### 7. Use Context in Artifact Names
```yaml
- uses: actions/upload-artifact@v3
  with:
    name: build-${{ github.sha }}
    path: dist
```

### 8. Reference Context in Environment Variables
```yaml
env:
  GITHUB_BRANCH: ${{ github.ref_name }}
  GITHUB_ACTOR: ${{ github.actor }}
  COMMIT_SHA: ${{ github.sha }}
```
