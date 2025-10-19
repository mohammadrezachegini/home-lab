# EC2 UserData - Bootstrap Scripts in CloudFormation

## Overview

This project demonstrates how to use EC2 UserData scripts to bootstrap instances during launch. UserData allows you to automate the initial configuration of EC2 instances by executing scripts or commands at launch time. This is the simplest method for configuring EC2 instances in CloudFormation and serves as a foundation before moving to more advanced helper scripts.

## CloudFormation Concepts

### UserData
UserData is a mechanism to pass configuration scripts to EC2 instances that execute automatically at launch. The script runs with root privileges during the first boot cycle.

**Key Characteristics:**
- Executes once during instance initialization
- Runs as root user
- Limited to 16KB of data
- Base64 encoded in CloudFormation templates
- No built-in error handling or signaling back to CloudFormation
- Cannot track execution status natively

### Fn::Base64 Function
The `Fn::Base64` intrinsic function encodes the UserData script, which is required by EC2.

**Syntax:**
```yaml
UserData:
  Fn::Base64: |
    #!/bin/bash
    # Your script here
```

### UserData vs CloudFormation Init
While UserData is simple and straightforward, it has limitations:
- No structured configuration management
- Cannot easily update running instances
- No dependency ordering
- Limited error handling
- Scripts can become complex and hard to maintain

## Prerequisites

- AWS Account with EC2 permissions
- AWS CLI configured with appropriate credentials
- EC2 Key Pair created in your region
- Basic understanding of:
  - Bash scripting
  - Linux package management (yum/apt)
  - EC2 instances and security groups
- VPC with default subnet (or specify custom subnet)

## Project Structure

```
EC2-UserData/
├── README.md                      # This file
├── 00-Base.yml                    # Base EC2 template without UserData
├── 00-Userdata.sh                 # Standalone UserData script
└── 01-cfn-ec2-UserData.yml       # Complete template with UserData
```

### File Descriptions

**00-Base.yml**
- Basic EC2 instance template
- Serves as starting point before adding UserData
- Demonstrates minimal EC2 resource definition

**00-Userdata.sh**
- Standalone bash script showing UserData logic
- Installs Java 8, Tomcat8, and creates a simple web page
- Useful for testing scripts before embedding in templates

**01-cfn-ec2-UserData.yml**
- Complete CloudFormation template with embedded UserData
- Includes parameters for flexibility (InstanceType, KeyName, AvailabilityZone)
- Demonstrates conditional resource creation with EIP for production
- Includes security group configuration

## Usage

### Deploy Stack with UserData

```bash
# Deploy the stack
aws cloudformation create-stack \
  --stack-name ec2-userdata-demo \
  --template-body file://01-cfn-ec2-UserData.yml \
  --parameters \
    ParameterKey=EnvironmentName,ParameterValue=dev \
    ParameterKey=InstanceType,ParameterValue=t2.micro \
    ParameterKey=KeyName,ParameterValue=your-key-name \
    ParameterKey=AvailabilityZone,ParameterValue=us-east-2a \
  --region us-east-2
```

### Monitor Stack Creation

```bash
# Watch stack events
aws cloudformation describe-stack-events \
  --stack-name ec2-userdata-demo \
  --region us-east-2

# Get stack status
aws cloudformation describe-stacks \
  --stack-name ec2-userdata-demo \
  --region us-east-2 \
  --query 'Stacks[0].StackStatus'
```

### Access the Application

```bash
# Get the application URL from stack outputs
aws cloudformation describe-stacks \
  --stack-name ec2-userdata-demo \
  --region us-east-2 \
  --query 'Stacks[0].Outputs[?OutputKey==`AppURL`].OutputValue' \
  --output text

# Or visit the URL directly (after stack creation completes)
# http://<instance-public-dns>:8080/index.html
```

### Verify UserData Execution

SSH into the instance and check:

```bash
# SSH to instance
ssh -i your-key.pem ec2-user@<instance-public-ip>

# Check UserData log
sudo cat /var/log/cloud-init-output.log

# Verify Tomcat is running
sudo service tomcat8 status

# Check Java version
java -version

# Verify the web application
curl http://localhost:8080/index.html
```

### Update Stack (Production with EIP)

```bash
# Update to production environment (creates Elastic IP)
aws cloudformation update-stack \
  --stack-name ec2-userdata-demo \
  --template-body file://01-cfn-ec2-UserData.yml \
  --parameters \
    ParameterKey=EnvironmentName,ParameterValue=prod \
    ParameterKey=InstanceType,ParameterValue=t2.small \
    ParameterKey=KeyName,ParameterValue=your-key-name \
    ParameterKey=AvailabilityZone,ParameterValue=us-east-2a \
  --region us-east-2
```

### Delete Stack

```bash
aws cloudformation delete-stack \
  --stack-name ec2-userdata-demo \
  --region us-east-2
```

## Template Examples

### Basic UserData Script

```yaml
UserData:
  Fn::Base64: |
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "Hello from UserData" > /var/www/html/index.html
```

### UserData with CloudFormation Substitution

```yaml
UserData:
  Fn::Base64: !Sub |
    #!/bin/bash
    echo "Stack Name: ${AWS::StackName}" > /tmp/stack-info.txt
    echo "Region: ${AWS::Region}" >> /tmp/stack-info.txt
    echo "Instance ID: $(ec2-metadata --instance-id)" >> /tmp/stack-info.txt
```

### UserData with Error Handling

```yaml
UserData:
  Fn::Base64: |
    #!/bin/bash -xe
    exec > >(tee /var/log/user-data.log)
    exec 2>&1

    # Exit on any error
    set -e

    # Update system
    yum update -y || exit 1

    # Install packages
    yum install -y httpd || exit 1

    # Start service
    systemctl start httpd || exit 1
    systemctl enable httpd || exit 1
```

### UserData with Package Installation

```yaml
UserData:
  Fn::Base64: |
    #!/bin/bash
    # Update system
    sudo yum update -y

    # Remove old Java
    sudo yum -y erase java-1.7.0-openjdk.x86_64

    # Install Java 8
    sudo yum -y install java-1.8.0-openjdk.x86_64
    sudo yum -y install java-1.8.0-openjdk-devel

    # Install Tomcat
    sudo yum -y install tomcat8

    # Start Tomcat
    service tomcat8 start

    # Create sample application
    mkdir -p /usr/share/tomcat8/webapps/ROOT
    echo "Hello from Tomcat" > /usr/share/tomcat8/webapps/ROOT/index.html
```

### UserData with Environment Variables

```yaml
UserData:
  Fn::Base64: !Sub |
    #!/bin/bash
    export ENVIRONMENT="${EnvironmentName}"
    export APP_VERSION="1.0.0"
    export STACK_NAME="${AWS::StackName}"

    # Save environment variables
    cat >> /etc/environment << EOF
    ENVIRONMENT=${EnvironmentName}
    APP_VERSION=1.0.0
    STACK_NAME=${AWS::StackName}
    EOF
```

## Features

### Demonstrated Features

1. **Parameterized Templates**
   - Environment selection (dev/prod)
   - Instance type flexibility
   - Availability zone configuration
   - SSH key pair specification

2. **Conditional Resources**
   - Elastic IP creation for production only
   - Uses CloudFormation Conditions

3. **Security Group Configuration**
   - Inbound rules for SSH (22) and Tomcat (8080)
   - Inline security group definition

4. **UserData Script Execution**
   - System updates
   - Package installation (Java, Tomcat)
   - Service management
   - File creation and content generation

5. **CloudFormation Interface Metadata**
   - Organized parameter groups
   - Custom parameter labels
   - Improved AWS Console experience

6. **Output Values**
   - Application access URL
   - Uses intrinsic functions for dynamic URLs

## Troubleshooting

### Common Issues

**1. UserData Script Not Executing**

```bash
# Check cloud-init logs
sudo cat /var/log/cloud-init.log
sudo cat /var/log/cloud-init-output.log

# Check for errors
sudo grep -i error /var/log/cloud-init-output.log
```

**2. Application Not Accessible**

```bash
# Verify security group allows inbound traffic
aws ec2 describe-security-groups \
  --group-ids sg-xxxxxxxxx \
  --query 'SecurityGroups[0].IpPermissions'

# Check if Tomcat is running
sudo systemctl status tomcat8

# Check port binding
sudo netstat -tulpn | grep 8080

# Test locally first
curl http://localhost:8080/index.html
```

**3. Stack Creation Fails**

```bash
# Get detailed error information
aws cloudformation describe-stack-events \
  --stack-name ec2-userdata-demo \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'

# Common failures:
# - Invalid KeyName: Ensure key pair exists in the region
# - Insufficient permissions: Check IAM permissions
# - Invalid subnet/AZ: Verify availability zone exists
```

**4. UserData Script Errors**

```bash
# Enable debugging in UserData
#!/bin/bash -xe  # -x for debug, -e for exit on error

# Redirect output to log file
exec > >(tee /var/log/user-data.log)
exec 2>&1

# Add error checking
if ! yum install -y package-name; then
    echo "Failed to install package-name" >> /var/log/user-data-errors.log
    exit 1
fi
```

**5. Services Not Starting**

```bash
# Check service status
sudo systemctl status tomcat8

# View service logs
sudo journalctl -u tomcat8 -n 50

# Check if ports are in use
sudo lsof -i :8080

# Manually start service
sudo systemctl start tomcat8
```

### Debug UserData

Add debugging to your UserData script:

```yaml
UserData:
  Fn::Base64: |
    #!/bin/bash -xe
    # Log all output
    exec > >(tee /var/log/user-data.log)
    exec 2>&1

    echo "Starting UserData execution at $(date)"

    # Add markers for each step
    echo "Step 1: System update"
    yum update -y

    echo "Step 2: Installing Java"
    yum install -y java-1.8.0-openjdk

    echo "UserData execution completed at $(date)"
```

### Verify Instance Metadata

```bash
# Get instance metadata
curl http://169.254.169.254/latest/meta-data/

# Get UserData
curl http://169.254.169.254/latest/user-data

# Get instance ID
curl http://169.254.169.254/latest/meta-data/instance-id
```

## Best Practices

### 1. Use Shebang and Flags

```yaml
UserData:
  Fn::Base64: |
    #!/bin/bash -xe
    # -x: Print commands as they execute
    # -e: Exit on any error
```

### 2. Log Everything

```bash
# Redirect all output to log file
exec > >(tee /var/log/user-data.log)
exec 2>&1
```

### 3. Use Idempotent Operations

```bash
# Check before installing
if ! command -v httpd &> /dev/null; then
    yum install -y httpd
fi

# Use systemctl enable for persistence
systemctl enable httpd
```

### 4. Handle Errors Gracefully

```bash
# Use error checking
if ! yum install -y package-name; then
    echo "ERROR: Failed to install package" >&2
    exit 1
fi

# Use retries for network operations
for i in {1..3}; do
    yum update -y && break || sleep 10
done
```

### 5. Keep Scripts Modular

```bash
# Source external scripts
wget https://s3.bucket.com/scripts/setup.sh
chmod +x setup.sh
./setup.sh

# Or use cfn-init for complex configurations
```

### 6. Use CloudFormation Substitution Carefully

```yaml
UserData:
  Fn::Base64: !Sub |
    #!/bin/bash
    # CloudFormation variables
    REGION=${AWS::Region}
    STACK=${AWS::StackName}

    # Be careful with $ in scripts
    # Use $$ to escape literal $
    echo "Stack: $STACK" > /tmp/info.txt
    echo "User: $(whoami)" >> /tmp/info.txt
```

### 7. Separate Configuration from Code

```bash
# Download configuration files
aws s3 cp s3://my-bucket/config/app.conf /etc/myapp/

# Use Parameter Store
APP_CONFIG=$(aws ssm get-parameter \
    --name /myapp/config \
    --query Parameter.Value \
    --output text)
```

### 8. Version Your Scripts

```bash
#!/bin/bash
# Script version: 1.2.0
# Last updated: 2024-01-15

SCRIPT_VERSION="1.2.0"
echo "Running setup script v${SCRIPT_VERSION}"
```

### 9. Minimize UserData Size

```bash
# Download large scripts instead of embedding
wget https://raw.githubusercontent.com/user/repo/main/setup.sh
chmod +x setup.sh
./setup.sh
```

### 10. Consider Migration Path

When UserData becomes complex, consider migrating to:
- **cfn-init**: For structured configuration
- **AWS Systems Manager**: For centralized management
- **Configuration management tools**: Ansible, Chef, Puppet
- **Container-based deployments**: ECS, EKS
