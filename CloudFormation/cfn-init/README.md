# CloudFormation Init (cfn-init) - Advanced EC2 Configuration

## Overview

This project demonstrates AWS::CloudFormation::Init metadata and the cfn-init helper script for advanced EC2 instance configuration. Unlike simple UserData scripts, cfn-init provides structured, declarative configuration management with proper ordering, error handling, and the ability to update running instances without replacement.

The cfn-init approach separates configuration from execution logic, making templates more maintainable and enabling sophisticated deployment patterns with features like package management, user/group creation, file management, command execution, and service orchestration.

## CloudFormation Concepts

### AWS::CloudFormation::Init

A metadata section that contains declarative configuration organized into logical blocks. It provides a structured way to configure EC2 instances compared to imperative UserData scripts.

**Structure:**
```yaml
Metadata:
  AWS::CloudFormation::Init:
    config:
      packages: {}      # Package installation
      groups: {}        # System groups
      users: {}         # System users
      sources: {}       # Archive downloads
      files: {}         # File creation
      commands: {}      # Shell commands
      services: {}      # Service management
```

### Helper Scripts

**cfn-init**
- Reads and executes AWS::CloudFormation::Init metadata
- Processes configuration sections in order
- Provides logging and error reporting
- Can be re-run to update configurations

**cfn-signal**
- Signals CloudFormation about resource status
- Works with CreationPolicy to control stack creation
- Sends success/failure status from the instance

**cfn-hup**
- Daemon that monitors for metadata changes
- Automatically updates configuration when stack updates occur
- Enables continuous configuration management

**cfn-get-metadata**
- Retrieves metadata from CloudFormation
- Useful for debugging and custom scripts

### Configuration Sections Execution Order

The cfn-init processes sections in a specific order:

1. **packages** - Install packages from repositories
2. **groups** - Create system groups
3. **users** - Create system users
4. **sources** - Download and extract archives
5. **files** - Create and populate files
6. **commands** - Execute shell commands
7. **services** - Start/stop/enable services

### CreationPolicy

Controls when CloudFormation considers a resource creation complete:

```yaml
CreationPolicy:
  ResourceSignal:
    Timeout: PT5M  # Wait up to 5 minutes for signal
    Count: 1       # Require 1 success signal
```

## Prerequisites

- AWS Account with EC2 and CloudFormation permissions
- AWS CLI configured with credentials
- EC2 Key Pair in your region
- S3 bucket for storing application artifacts (for source downloads)
- Understanding of:
  - CloudFormation templates and stacks
  - Linux system administration
  - Package management (yum/apt)
  - Service management (systemd/sysvinit)

## Project Structure

```
cfn-init/
├── README.md                                    # This file
├── 00-Base-v0.yml                              # Base template without cfn-init
├── 01-cfn-init-v1-Metadata-Base.yml            # Basic AWS::CloudFormation::Init structure
├── 02-cfn-init-v2-packages.yml                 # Package installation
├── 03-cfn-init-v3-groups.yml                   # Group creation
├── 04-cfn-init-v4-users.yml                    # User creation
├── 05-cfn-init-v5-sources.yml                  # Archive downloads
├── 06-cfn-init-v6-files.yml                    # File management
├── 07-cfn-init-v7-commands.yml                 # Command execution
├── 08-cfn-init-v8-services.yml                 # Service management
├── 09-cfn-init-v9-UserData-latest-cfn-package.yml   # AWS helper scripts update
├── 10-cfn-init-v10-UserData-cfn-init.yml       # cfn-init execution
├── 11-cfn-init-v11-UserData-cfn-signal.yml     # Status signaling
├── 12-cfn-init-v12-Outputs.yml                 # Stack outputs
├── 13-cfn-init-v13-CreationPolicy.yml          # Creation policy implementation
└── 14-cfn-init-v14-Update-App.yml              # Application updates with cfn-hup
```

### Progressive File Descriptions

Each template builds upon the previous, adding one feature at a time:

- **v1**: Basic Metadata structure
- **v2**: Package installation (Java, Tomcat)
- **v3**: Group creation examples
- **v4**: User creation and group assignments
- **v5**: Source archive downloads from S3
- **v6**: File creation (configuration files)
- **v7**: Command execution with ordering
- **v8**: Service management configuration
- **v9**: AWS helper scripts update in UserData
- **v10**: cfn-init invocation in UserData
- **v11**: cfn-signal for status reporting
- **v12**: Stack outputs for application access
- **v13**: CreationPolicy for validation
- **v14**: cfn-hup for automatic updates

## Usage

### Deploy Basic cfn-init Stack

```bash
# Deploy complete cfn-init stack with all features
aws cloudformation create-stack \
  --stack-name cfn-init-demo \
  --template-body file://13-cfn-init-v13-CreationPolicy.yml \
  --parameters ParameterKey=KeyName,ParameterValue=your-key-name \
  --region us-east-2
```

### Monitor Stack Creation with Signals

```bash
# Watch stack events (should wait for cfn-signal)
aws cloudformation describe-stack-events \
  --stack-name cfn-init-demo \
  --region us-east-2 \
  --query 'StackEvents[?ResourceStatus!=`CREATE_COMPLETE`]'

# Stack will wait for signal before completing
# Timeout is defined in CreationPolicy (default: PT5M = 5 minutes)
```

### Verify cfn-init Execution

SSH to instance and check logs:

```bash
# SSH to instance
ssh -i your-key.pem ec2-user@<instance-public-ip>

# Check cfn-init logs
sudo cat /var/log/cfn-init.log
sudo cat /var/log/cfn-init-cmd.log

# Check cloud-init logs
sudo cat /var/log/cloud-init-output.log

# Verify installed packages
rpm -qa | grep -E 'java|tomcat'

# Check created users and groups
id user1
getent group groupone grouptwo

# Verify files were created
cat /etc/cfn/cfn-hup.conf
cat /etc/cfn/hooks.d/cfn-auto-reloader.conf

# Check service status
sudo systemctl status tomcat8
```

### Update Stack (cfn-hup demonstrates auto-update)

```bash
# Update the stack with template changes
aws cloudformation update-stack \
  --stack-name cfn-init-demo \
  --template-body file://14-cfn-init-v14-Update-App.yml \
  --parameters ParameterKey=KeyName,ParameterValue=your-key-name \
  --region us-east-2

# cfn-hup will detect changes and run cfn-init automatically
# Check cfn-hup logs on instance
sudo cat /var/log/cfn-hup.log
```

### Test Application

```bash
# Get application URL
aws cloudformation describe-stacks \
  --stack-name cfn-init-demo \
  --region us-east-2 \
  --query 'Stacks[0].Outputs[?OutputKey==`AppURL`].OutputValue' \
  --output text

# Test the application
curl http://<instance-dns>:8080/demo/hello
```

### Delete Stack

```bash
aws cloudformation delete-stack \
  --stack-name cfn-init-demo \
  --region us-east-2
```

## Template Examples

### Complete AWS::CloudFormation::Init Example

```yaml
Metadata:
  Comment: Deploy a simple tomcat Application
  AWS::CloudFormation::Init:
    config:
      # 1. Install packages
      packages:
        yum:
          java-1.8.0-openjdk.x86_64: []
          java-1.8.0-openjdk-devel: []
          tomcat8: []

      # 2. Create groups
      groups:
        groupone: {}
        grouptwo:
          gid: "501"

      # 3. Create users
      users:
        user1:
          groups:
            - groupone
            - grouptwo
          uid: "501"
          homeDir: "/home"

      # 4. Download and extract sources
      sources:
        /tmp: "https://s3.us-east-2.amazonaws.com/bucket/demo1.zip"

      # 5. Create files
      files:
        "/etc/cfn/cfn-hup.conf":
          content: !Sub |
            [main]
            stack=${AWS::StackId}
            region=${AWS::Region}
            interval=3
          mode: "000400"
          owner: "root"
          group: "root"

        "/etc/cfn/hooks.d/cfn-auto-reloader.conf":
          content: !Sub |
            [cfn-auto-reloader-hook]
            triggers=post.update
            path=Resources.MyVMInstance.Metadata.AWS::CloudFormation::Init
            action=/opt/aws/bin/cfn-init -v --stack ${AWS::StackName} --resource MyVMInstance --region ${AWS::Region}
          mode: "000400"
          owner: "root"
          group: "root"

      # 6. Execute commands
      commands:
        test1:
          command: "chmod 755 demo.war"
          cwd: "/tmp"
        test2:
          command: "sudo yum -y erase java-1.7.0-openjdk.x86_64"
          cwd: "~"
        test3:
          command: "rm -rf demo*"
          cwd: "/var/lib/tomcat8/webapps"
        test4:
          command: "cp demo.war /var/lib/tomcat8/webapps"
          cwd: "/tmp"

      # 7. Manage services
      services:
        sysvinit:
          tomcat8:
            enabled: "true"
            ensureRunning: "true"
```

### UserData with cfn-init, cfn-signal, and cfn-hup

```yaml
UserData:
  Fn::Base64: !Sub |
    #!/bin/bash -xe
    # Get latest CloudFormation helper scripts
    yum update -y aws-cfn-bootstrap

    # Execute cfn-init to process metadata
    /opt/aws/bin/cfn-init -s ${AWS::StackId} -r MyVMInstance --region ${AWS::Region} || error_exit 'Failed to run cfn-init'

    # Signal success/failure back to CloudFormation
    /opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackId} --resource MyVMInstance --region ${AWS::Region}

    # Start cfn-hup daemon for automatic updates
    /opt/aws/bin/cfn-hup || error_exit 'Failed to start cfn-hup'
```

### CreationPolicy for Validation

```yaml
MyVMInstance:
  Type: AWS::EC2::Instance
  CreationPolicy:
    ResourceSignal:
      Timeout: PT5M  # 5 minutes timeout
      Count: 1       # Require 1 success signal
  Metadata:
    AWS::CloudFormation::Init:
      # ... configuration ...
  Properties:
    # ... instance properties ...
```

### Packages Section Examples

```yaml
packages:
  # Install from yum
  yum:
    httpd: []
    php: []
    mysql: ["5.7"]  # Specific version

  # Install from apt (Ubuntu/Debian)
  apt:
    apache2: []
    php: []

  # Install from RPM URLs
  rpm:
    epel: "http://download.fedoraproject.org/pub/epel/7/x86_64/e/epel-release-7-5.noarch.rpm"

  # Install Python packages
  python:
    boto3: []
    requests: ["2.28.0"]
```

### Files Section Examples

```yaml
files:
  # Simple text file
  "/tmp/test.txt":
    content: "Hello World"
    mode: "000644"
    owner: "root"
    group: "root"

  # File with CloudFormation substitutions
  "/etc/myapp/config.conf":
    content: !Sub |
      [main]
      region=${AWS::Region}
      stack=${AWS::StackName}
      environment=production
    mode: "000600"
    owner: "myuser"
    group: "mygroup"

  # File from URL
  "/tmp/script.sh":
    source: "https://example.com/script.sh"
    mode: "000755"
    owner: "root"
    group: "root"

  # Base64 encoded content
  "/tmp/binary":
    content: !Base64 |
      Binary content here
    encoding: "base64"
    mode: "000644"
```

### Commands Section Examples

```yaml
commands:
  # Simple command
  01_update_system:
    command: "yum update -y"

  # Command with working directory
  02_build_app:
    command: "mvn clean install"
    cwd: "/opt/myapp"

  # Command with test (only runs if test succeeds)
  03_conditional:
    command: "echo 'Running on AL2'"
    test: "test -f /etc/system-release && grep -q 'Amazon Linux 2' /etc/system-release"

  # Command with environment variables
  04_with_env:
    command: "echo $MYVAR > /tmp/myvar.txt"
    env:
      MYVAR: "Hello World"

  # Command with ignore errors
  05_optional:
    command: "some-optional-command"
    ignoreErrors: "true"

  # Commands run in alphabetical order
  # Use numeric prefixes to control order
  10_first:
    command: "echo 'First'"
  20_second:
    command: "echo 'Second'"
  30_third:
    command: "echo 'Third'"
```

### Services Section Examples

```yaml
services:
  # SystemD services
  sysvinit:
    httpd:
      enabled: "true"
      ensureRunning: "true"
      # Restart if these files change
      files:
        - "/etc/httpd/conf/httpd.conf"
      # Restart if these packages are updated
      packages:
        yum:
          - "httpd"
      # Run these commands after service starts
      commands:
        - "verify_httpd"

    tomcat8:
      enabled: "true"
      ensureRunning: "true"

    # Ensure service is stopped
    postfix:
      enabled: "false"
      ensureRunning: "false"
```

### Sources Section Examples

```yaml
sources:
  # Download and extract to /tmp
  /tmp: "https://s3.amazonaws.com/bucket/app.zip"

  # Download and extract to /opt
  /opt/myapp: "https://github.com/user/repo/archive/v1.0.tar.gz"

  # Multiple sources
  /var/www/html: "https://s3.amazonaws.com/bucket/website.tar.gz"
  /opt/tools: "https://example.com/tools.zip"
```

### Users and Groups Examples

```yaml
groups:
  # Simple group
  developers: {}

  # Group with specific GID
  admins:
    gid: "500"

users:
  # Simple user
  appuser:
    groups:
      - developers
    uid: "1001"
    homeDir: "/home/appuser"

  # User with multiple attributes
  adminuser:
    groups:
      - admins
      - wheel
    uid: "500"
    homeDir: "/home/adminuser"
```

## Features

### Structured Configuration

- **Declarative syntax**: Define what you want, not how to do it
- **Ordered execution**: Predictable execution order across sections
- **Reusable**: Same configuration can be applied to multiple instances
- **Maintainable**: Easier to read and modify than shell scripts

### Advanced Capabilities

1. **Package Management**
   - Install from multiple package managers
   - Specify versions
   - Handle dependencies

2. **User/Group Management**
   - Create system users and groups
   - Set UIDs and GIDs
   - Assign group memberships

3. **File Management**
   - Create files with specific content
   - Set permissions and ownership
   - Download from URLs
   - Use CloudFormation variables

4. **Command Execution**
   - Run shell commands
   - Set working directories
   - Use environment variables
   - Conditional execution with tests

5. **Service Management**
   - Start/stop services
   - Enable on boot
   - Automatic restart on config changes
   - Dependency management

6. **Status Signaling**
   - Report success/failure to CloudFormation
   - Wait for completion before proceeding
   - Automatic rollback on failure

7. **Automatic Updates**
   - cfn-hup monitors for stack updates
   - Automatically applies configuration changes
   - No instance replacement needed

## Troubleshooting

### Common Issues

**1. cfn-init Fails to Execute**

```bash
# Check cfn-init logs
sudo cat /var/log/cfn-init.log
sudo cat /var/log/cfn-init-cmd.log

# Check for syntax errors in metadata
# Validate template before deploying
aws cloudformation validate-template \
  --template-body file://template.yml

# Test cfn-init manually
/opt/aws/bin/cfn-init -v \
  --stack stack-name \
  --resource MyVMInstance \
  --region us-east-2
```

**2. Stack Creation Timeout (Waiting for Signal)**

```bash
# Check if cfn-signal was called
sudo cat /var/log/cloud-init-output.log | grep cfn-signal

# Check instance status
aws ec2 describe-instance-status --instance-ids i-xxxxx

# Common causes:
# - cfn-init failed (check logs)
# - Network issues preventing signal
# - UserData script error before cfn-signal
# - CreationPolicy timeout too short

# Manually send signal for testing
/opt/aws/bin/cfn-signal -e 0 \
  --stack stack-name \
  --resource MyVMInstance \
  --region us-east-2
```

**3. Package Installation Fails**

```bash
# Check package manager logs
sudo cat /var/log/yum.log

# Verify package exists
yum list available | grep package-name

# Check repository configuration
yum repolist

# Update package cache
sudo yum clean all
sudo yum makecache
```

**4. File Creation Issues**

```bash
# Check cfn-init-cmd.log for file operations
sudo grep "files" /var/log/cfn-init-cmd.log

# Verify file was created
ls -la /path/to/file

# Check permissions
namei -l /path/to/file

# Common issues:
# - Parent directory doesn't exist
# - Permission denied
# - Invalid mode format (use "000644" not "644")
```

**5. Commands Not Executing**

```bash
# Check command execution in logs
sudo grep "commands" /var/log/cfn-init-cmd.log

# Commands run in alphabetical order
# Use prefixes: 01_, 02_, 03_ to control order

# Check test conditions
# If test fails, command is skipped

# Verify working directory exists
# Specified in 'cwd' parameter
```

**6. Services Not Starting**

```bash
# Check service status
sudo systemctl status service-name

# Check service logs
sudo journalctl -u service-name -n 50

# Manually start service
sudo systemctl start service-name

# Check if service is enabled
sudo systemctl is-enabled service-name

# Verify service dependencies
# Files and packages should be configured first
```

**7. cfn-hup Not Detecting Updates**

```bash
# Check if cfn-hup is running
ps aux | grep cfn-hup

# Check cfn-hup logs
sudo cat /var/log/cfn-hup.log

# Verify configuration
cat /etc/cfn/cfn-hup.conf
cat /etc/cfn/hooks.d/cfn-auto-reloader.conf

# Restart cfn-hup
sudo systemctl restart cfn-hup

# Check interval setting (default: 15 minutes)
# Set lower for testing: interval=1
```

### Debug Mode

Enable verbose logging:

```yaml
UserData:
  Fn::Base64: !Sub |
    #!/bin/bash -xe

    # Enable debug mode
    /opt/aws/bin/cfn-init -v -v \
      --stack ${AWS::StackId} \
      --resource MyVMInstance \
      --region ${AWS::Region}
```

### Manual Testing

```bash
# Get metadata
/opt/aws/bin/cfn-get-metadata \
  --stack stack-name \
  --resource MyVMInstance \
  --region us-east-2

# Re-run cfn-init
/opt/aws/bin/cfn-init -v \
  --stack stack-name \
  --resource MyVMInstance \
  --region us-east-2

# Test specific section
/opt/aws/bin/cfn-init -v \
  --stack stack-name \
  --resource MyVMInstance \
  --region us-east-2 \
  --configsets configset-name
```

## Best Practices

### 1. Always Use CreationPolicy

```yaml
MyVMInstance:
  Type: AWS::EC2::Instance
  CreationPolicy:
    ResourceSignal:
      Timeout: PT10M  # Adjust based on complexity
      Count: 1
```

### 2. Update aws-cfn-bootstrap First

```yaml
UserData:
  Fn::Base64: !Sub |
    #!/bin/bash -xe
    # Always update helper scripts first
    yum update -y aws-cfn-bootstrap
    # Then run cfn-init
    /opt/aws/bin/cfn-init ...
```

### 3. Use Error Handling in UserData

```yaml
UserData:
  Fn::Base64: !Sub |
    #!/bin/bash -xe

    # Function for error handling
    error_exit() {
      /opt/aws/bin/cfn-signal -e 1 --stack ${AWS::StackId} --resource MyVMInstance --region ${AWS::Region}
      exit 1
    }

    /opt/aws/bin/cfn-init -v ... || error_exit 'cfn-init failed'
    /opt/aws/bin/cfn-signal -e $? ... || error_exit 'cfn-signal failed'
```

### 4. Order Commands with Prefixes

```yaml
commands:
  01_first_step:
    command: "echo 'Step 1'"
  02_second_step:
    command: "echo 'Step 2'"
  03_third_step:
    command: "echo 'Step 3'"
```

### 5. Use Tests for Conditional Execution

```yaml
commands:
  install_docker:
    command: "yum install -y docker"
    test: "! command -v docker"
```

### 6. Set Appropriate Timeouts

```yaml
CreationPolicy:
  ResourceSignal:
    # Adjust based on:
    # - Number of packages
    # - Size of downloads
    # - Number of commands
    Timeout: PT15M  # 15 minutes for complex setups
```

### 7. Enable cfn-hup for Updates

```yaml
files:
  "/etc/cfn/cfn-hup.conf":
    content: !Sub |
      [main]
      stack=${AWS::StackId}
      region=${AWS::Region}
      interval=3  # Check every 3 minutes (default: 15)

  "/etc/cfn/hooks.d/cfn-auto-reloader.conf":
    content: !Sub |
      [cfn-auto-reloader-hook]
      triggers=post.update
      path=Resources.MyVMInstance.Metadata.AWS::CloudFormation::Init
      action=/opt/aws/bin/cfn-init -v --stack ${AWS::StackName} --resource MyVMInstance --region ${AWS::Region}
      runas=root
```

### 8. Separate Configuration from Logic

Keep AWS::CloudFormation::Init for configuration:
- Package installation
- File creation
- User/group management
- Service configuration

Use commands for:
- Application deployment
- Data processing
- Complex logic

### 9. Version Control S3 Sources

```yaml
sources:
  # Use versioned S3 URLs
  /opt/app: "https://s3.amazonaws.com/bucket/app-v1.2.3.tar.gz"

  # Or use CloudFormation parameters
  /opt/app: !Sub "https://s3.amazonaws.com/${AppBucket}/app-${AppVersion}.tar.gz"
```

### 10. Log Everything

```yaml
UserData:
  Fn::Base64: !Sub |
    #!/bin/bash -xe

    # Log all output
    exec > >(tee /var/log/user-data.log)
    exec 2>&1

    echo "Starting configuration at $(date)"
    # ... rest of script
```
