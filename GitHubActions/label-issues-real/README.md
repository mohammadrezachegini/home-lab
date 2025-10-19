# GitHub Actions: Automated Issue Labeling

## Overview

This project demonstrates how to automate issue labeling in GitHub using GitHub Actions and the GitHub REST API. It shows how to integrate with GitHub's API using the built-in GITHUB_TOKEN, configure proper permissions, and respond to issue events. This workflow automatically labels issues containing the word "bug" in their title, showcasing practical automation and API integration in GitHub Actions.

## GitHub Actions Concepts

### GitHub API Integration

GitHub Actions provides seamless integration with the GitHub API through:

- **GITHUB_TOKEN**: Automatically generated authentication token
- **GitHub Context**: Access to event data and repository information
- **REST API**: Full access to GitHub's REST API endpoints
- **Webhook Events**: Trigger workflows based on repository events

### Key Concepts Demonstrated

- **Issue Events**: Triggering workflows on issue creation
- **Permissions**: Granular permission control for GITHUB_TOKEN
- **GitHub Context**: Accessing event payload data
- **API Authentication**: Using GITHUB_TOKEN for API requests
- **Conditional Execution**: Running steps based on issue content
- **curl Commands**: Making HTTP requests to GitHub API

## Prerequisites

- GitHub repository with Issues enabled
- Understanding of GitHub Actions workflow syntax
- Familiarity with REST API concepts
- Basic knowledge of curl or HTTP requests
- Knowledge of JSON data format

## Project Structure

```
label-issues-real/
├── label-issues-real.yml         # Automated issue labeling workflow
└── README.md                     # This documentation
```

## Workflow Files

### Automated Issue Labeling Workflow

**File**: `label-issues-real.yml`

This workflow automatically labels issues when they are opened.

```yaml
name: Label Issues (Permissions Example)
on:
  issues:
    types:
      - opened
jobs:
  assign-label:
    permissions:
      issues: write
    runs-on: ubuntu-latest
    steps:
      - name: Assign label
        if: contains(github.event.issue.title, 'bug')
        run: |
          curl -X POST \
          --url https://api.github.com/repos/${{ github.repository }}/issues/${{ github.event.issue.number }}/labels \
          -H 'authorization: Bearer ${{ secrets.GITHUB_TOKEN }}' \
          -H 'content-type: application/json' \
          -d '{
              "labels": ["bug"]
            }' \
          --fail
```

### Workflow Components

#### Event Trigger

```yaml
on:
  issues:
    types:
      - opened
```

**Key Points**:
- Triggers when a new issue is opened
- Other available types: `edited`, `deleted`, `reopened`, `closed`, `labeled`, `unlabeled`
- Multiple types can be specified in an array
- Event payload available via `github.event` context

#### Permissions Configuration

```yaml
permissions:
  issues: write
```

**Key Points**:
- Grants write permission for issues
- Required to add labels to issues
- Follows principle of least privilege
- Can be set at workflow or job level
- GITHUB_TOKEN automatically has these permissions

#### Conditional Execution

```yaml
if: contains(github.event.issue.title, 'bug')
```

**Key Points**:
- Checks if issue title contains "bug"
- Uses `contains()` function for string matching
- Case-sensitive comparison
- Prevents unnecessary API calls
- Can use complex expressions with `&&`, `||`

#### API Request with curl

```yaml
run: |
  curl -X POST \
  --url https://api.github.com/repos/${{ github.repository }}/issues/${{ github.event.issue.number }}/labels \
  -H 'authorization: Bearer ${{ secrets.GITHUB_TOKEN }}' \
  -H 'content-type: application/json' \
  -d '{
      "labels": ["bug"]
    }' \
  --fail
```

**Key Points**:
- Uses GitHub REST API v3
- `${{ github.repository }}`: Current repository (owner/repo format)
- `${{ github.event.issue.number }}`: Issue number from event payload
- `${{ secrets.GITHUB_TOKEN }}`: Auto-generated authentication token
- `--fail`: Causes curl to fail on HTTP errors
- Labels are sent as JSON array

## Usage

### Basic Issue Labeling

The workflow runs automatically when issues are opened. To test:

1. Create a new issue with "bug" in the title
2. The workflow will automatically trigger
3. The issue will be labeled with "bug" label

### GitHub Context Variables

Access event data using the `github` context:

```yaml
# Repository information
${{ github.repository }}           # owner/repo
${{ github.repository_owner }}     # owner
${{ github.event.repository.name }} # repo name

# Issue information
${{ github.event.issue.number }}   # Issue number
${{ github.event.issue.title }}    # Issue title
${{ github.event.issue.body }}     # Issue body
${{ github.event.issue.user.login }} # Issue author

# Actor information
${{ github.actor }}                # User who triggered workflow
```

### Multiple Labels

Add multiple labels to an issue:

```yaml
- name: Assign multiple labels
  run: |
    curl -X POST \
    --url https://api.github.com/repos/${{ github.repository }}/issues/${{ github.event.issue.number }}/labels \
    -H 'authorization: Bearer ${{ secrets.GITHUB_TOKEN }}' \
    -H 'content-type: application/json' \
    -d '{
        "labels": ["bug", "needs-triage", "high-priority"]
      }' \
    --fail
```

### Conditional Labels Based on Content

Apply different labels based on issue content:

```yaml
jobs:
  categorize-issue:
    permissions:
      issues: write
    runs-on: ubuntu-latest
    steps:
      - name: Label as bug
        if: contains(github.event.issue.title, 'bug') || contains(github.event.issue.body, 'bug')
        run: |
          curl -X POST \
          --url https://api.github.com/repos/${{ github.repository }}/issues/${{ github.event.issue.number }}/labels \
          -H 'authorization: Bearer ${{ secrets.GITHUB_TOKEN }}' \
          -H 'content-type: application/json' \
          -d '{"labels": ["bug"]}' \
          --fail

      - name: Label as feature request
        if: contains(github.event.issue.title, 'feature') || contains(github.event.issue.title, 'enhancement')
        run: |
          curl -X POST \
          --url https://api.github.com/repos/${{ github.repository }}/issues/${{ github.event.issue.number }}/labels \
          -H 'authorization: Bearer ${{ secrets.GITHUB_TOKEN }}' \
          -H 'content-type: application/json' \
          -d '{"labels": ["enhancement"]}' \
          --fail

      - name: Label as documentation
        if: contains(github.event.issue.title, 'docs') || contains(github.event.issue.title, 'documentation')
        run: |
          curl -X POST \
          --url https://api.github.com/repos/${{ github.repository }}/issues/${{ github.event.issue.number }}/labels \
          -H 'authorization: Bearer ${{ secrets.GITHUB_TOKEN }}' \
          -H 'content-type: application/json' \
          -d '{"labels": ["documentation"]}' \
          --fail
```

### Using GitHub CLI

Alternative approach using GitHub CLI (gh):

```yaml
steps:
  - name: Label issue with gh CLI
    if: contains(github.event.issue.title, 'bug')
    env:
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    run: |
      gh issue edit ${{ github.event.issue.number }} \
        --repo ${{ github.repository }} \
        --add-label "bug"
```

### Using Actions/GitHub Package

Use the official GitHub Actions toolkit:

```yaml
steps:
  - name: Checkout code
    uses: actions/checkout@v3

  - name: Setup Node.js
    uses: actions/setup-node@v3
    with:
      node-version: '16'

  - name: Label issue
    uses: actions/github-script@v6
    with:
      script: |
        if (context.payload.issue.title.includes('bug')) {
          await github.rest.issues.addLabels({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: context.payload.issue.number,
            labels: ['bug']
          });
        }
```

### Auto-Assign Issues

Automatically assign issues to team members:

```yaml
- name: Auto-assign issue
  if: contains(github.event.issue.title, 'bug')
  run: |
    curl -X POST \
    --url https://api.github.com/repos/${{ github.repository }}/issues/${{ github.event.issue.number }}/assignees \
    -H 'authorization: Bearer ${{ secrets.GITHUB_TOKEN }}' \
    -H 'content-type: application/json' \
    -d '{
        "assignees": ["team-member-1", "team-member-2"]
      }' \
    --fail
```

### Add Comments to Issues

Automatically comment on issues:

```yaml
- name: Add comment
  if: contains(github.event.issue.title, 'bug')
  run: |
    curl -X POST \
    --url https://api.github.com/repos/${{ github.repository }}/issues/${{ github.event.issue.number }}/comments \
    -H 'authorization: Bearer ${{ secrets.GITHUB_TOKEN }}' \
    -H 'content-type: application/json' \
    -d '{
        "body": "Thank you for reporting this bug! Our team will review it shortly."
      }' \
    --fail
```

## Key Features

### Permission Control

The workflow demonstrates granular permission management:

```yaml
permissions:
  issues: write        # Can create, edit, label issues
  contents: read       # Can read repository contents
  pull-requests: write # Can edit pull requests
```

Available permissions:
- `actions`: GitHub Actions workflow permissions
- `checks`: Check runs and check suites
- `contents`: Repository contents
- `deployments`: Deployments
- `issues`: Issues and comments
- `packages`: GitHub Packages
- `pull-requests`: Pull requests
- `repository-projects`: Projects
- `security-events`: Security events
- `statuses`: Commit statuses

### Event Payload Access

Access rich event data through `github.event`:

```yaml
# Issue data
${{ github.event.issue.title }}
${{ github.event.issue.body }}
${{ github.event.issue.state }}
${{ github.event.issue.number }}
${{ github.event.issue.html_url }}

# User data
${{ github.event.issue.user.login }}
${{ github.event.issue.user.id }}

# Repository data
${{ github.event.repository.name }}
${{ github.event.repository.full_name }}
```

### API Error Handling

Handle API errors gracefully:

```yaml
- name: Label issue with error handling
  run: |
    response=$(curl -X POST \
      --url https://api.github.com/repos/${{ github.repository }}/issues/${{ github.event.issue.number }}/labels \
      -H 'authorization: Bearer ${{ secrets.GITHUB_TOKEN }}' \
      -H 'content-type: application/json' \
      -d '{"labels": ["bug"]}' \
      -w "%{http_code}" \
      -s -o /dev/null)

    if [ $response -eq 200 ] || [ $response -eq 201 ]; then
      echo "Label added successfully"
    else
      echo "Failed to add label. HTTP status: $response"
      exit 1
    fi
```

### Pattern Matching

Use regex for more sophisticated matching:

```yaml
- name: Label based on regex pattern
  if: |
    contains(github.event.issue.title, 'bug') ||
    contains(github.event.issue.title, 'error') ||
    contains(github.event.issue.title, 'issue')
  run: |
    # Add bug label
```

## Troubleshooting

### Permission Denied Error

**Error**: `Resource not accessible by integration`

**Solution**:
- Add appropriate permissions to the job:

```yaml
permissions:
  issues: write
```

- Verify the workflow has access to GITHUB_TOKEN
- Check repository settings for Actions permissions

### Label Not Applied

**Error**: Label not added to issue

**Solution**:
- Ensure the label exists in the repository
- Create labels manually or via API before using them
- Check conditional logic is evaluating correctly
- Verify API request syntax and payload

Create label if it doesn't exist:

```yaml
- name: Create label if not exists
  run: |
    # Try to create the label (will fail if it exists, but that's ok)
    curl -X POST \
    --url https://api.github.com/repos/${{ github.repository }}/labels \
    -H 'authorization: Bearer ${{ secrets.GITHUB_TOKEN }}' \
    -H 'content-type: application/json' \
    -d '{
        "name": "bug",
        "color": "d73a4a",
        "description": "Something is not working"
      }' || true
```

### Conditional Not Working

**Error**: Step runs when it shouldn't or doesn't run when it should

**Solution**:
- Verify case sensitivity in `contains()` function
- Use `||` for multiple conditions
- Test with different issue titles
- Add debug output to check values

```yaml
- name: Debug issue title
  run: |
    echo "Issue title: ${{ github.event.issue.title }}"
    echo "Contains 'bug': ${{ contains(github.event.issue.title, 'bug') }}"

- name: Case-insensitive check
  if: contains(toLower(github.event.issue.title), 'bug')
  run: echo "Bug detected"
```

### GITHUB_TOKEN Authentication Fails

**Error**: Authentication failed with GITHUB_TOKEN

**Solution**:
- Ensure GITHUB_TOKEN is available (automatically provided)
- Check token is passed correctly in Authorization header
- Verify permissions are set at job or workflow level
- Don't override GITHUB_TOKEN with custom token unless needed

```yaml
# Correct
-H 'authorization: Bearer ${{ secrets.GITHUB_TOKEN }}'

# Also correct
-H 'Authorization: token ${{ secrets.GITHUB_TOKEN }}'
```

### API Rate Limiting

**Error**: API rate limit exceeded

**Solution**:
- GITHUB_TOKEN has higher rate limits than unauthenticated requests
- Add delays between API calls if making many requests
- Use conditional logic to minimize API calls
- Check rate limit status:

```yaml
- name: Check rate limit
  run: |
    curl -H 'authorization: Bearer ${{ secrets.GITHUB_TOKEN }}' \
    https://api.github.com/rate_limit
```

### curl Command Fails

**Error**: curl command exits with non-zero status

**Solution**:
- Use `--fail` flag to fail on HTTP errors
- Add `-v` flag for verbose output during debugging
- Check JSON syntax is valid
- Verify URL is correct

```yaml
# Debug curl request
- name: Debug API call
  run: |
    curl -v -X POST \
    --url https://api.github.com/repos/${{ github.repository }}/issues/${{ github.event.issue.number }}/labels \
    -H 'authorization: Bearer ${{ secrets.GITHUB_TOKEN }}' \
    -H 'content-type: application/json' \
    -d '{"labels": ["bug"]}' \
    --fail
```

## Best Practices

### Security

1. **Use GITHUB_TOKEN**: Prefer built-in token over personal access tokens
2. **Minimal permissions**: Grant only required permissions
3. **Input validation**: Validate issue content before processing
4. **Avoid logging secrets**: Never echo or log GITHUB_TOKEN

```yaml
permissions:
  issues: write  # Only what's needed
```

### Performance

1. **Conditional execution**: Use `if` to avoid unnecessary API calls
2. **Combine operations**: Make fewer API calls when possible
3. **Efficient filters**: Filter early in the workflow

```yaml
# Good: Check condition before running job
jobs:
  label-bug:
    if: contains(github.event.issue.title, 'bug')
    runs-on: ubuntu-latest
    steps:
      - name: Add label
        run: # API call
```

### Maintainability

1. **Clear naming**: Use descriptive names for steps
2. **Comments**: Document complex logic
3. **Error messages**: Provide helpful error messages
4. **Modular design**: Separate concerns into different jobs

```yaml
- name: Label bug report
  # Automatically labels issues containing 'bug' in the title
  # This helps the team prioritize and categorize issues
  if: contains(github.event.issue.title, 'bug')
  run: |
    # Add bug label via GitHub API
```

### Reliability

1. **Error handling**: Handle API failures gracefully
2. **Idempotent operations**: Ensure operations can be safely retried
3. **Validation**: Validate inputs and API responses
4. **Fail flag**: Use `--fail` with curl to catch HTTP errors

```yaml
- name: Reliable label addition
  run: |
    if ! curl -X POST \
      --url https://api.github.com/repos/${{ github.repository }}/issues/${{ github.event.issue.number }}/labels \
      -H 'authorization: Bearer ${{ secrets.GITHUB_TOKEN }}' \
      -H 'content-type: application/json' \
      -d '{"labels": ["bug"]}' \
      --fail; then
      echo "Failed to add label, but continuing workflow"
      # Don't fail the entire workflow
    fi
```

### Label Management

1. **Create labels proactively**: Ensure labels exist before use
2. **Consistent naming**: Use consistent label names across projects
3. **Color coding**: Use meaningful colors for labels
4. **Documentation**: Document what each label means

```yaml
# Create standard labels
- name: Ensure labels exist
  run: |
    labels='[
      {"name":"bug","color":"d73a4a","description":"Something is not working"},
      {"name":"enhancement","color":"a2eeef","description":"New feature or request"},
      {"name":"documentation","color":"0075ca","description":"Improvements or additions to documentation"}
    ]'

    echo "$labels" | jq -c '.[]' | while read label; do
      curl -X POST \
        --url https://api.github.com/repos/${{ github.repository }}/labels \
        -H 'authorization: Bearer ${{ secrets.GITHUB_TOKEN }}' \
        -H 'content-type: application/json' \
        -d "$label" || true
    done
```
