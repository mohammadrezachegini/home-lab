# CloudFormation Stack Concepts - Lifecycle and Operations

## Overview

This project demonstrates core CloudFormation stack concepts including stack creation, updates, change sets, rollback operations, and stack deletion. Understanding stack lifecycle management is critical for production deployments, as it allows you to safely modify infrastructure, preview changes before applying them, handle failures gracefully, and maintain infrastructure reliability.

CloudFormation stacks have a complex lifecycle with multiple states and transition paths. This project provides hands-on examples of stack operations, update behaviors, resource replacement scenarios, change set workflows, and rollback mechanisms that are essential for managing production infrastructure.

## CloudFormation Concepts

### Stack Lifecycle States

**Creation States:**
- CREATE_IN_PROGRESS - Stack creation started
- CREATE_COMPLETE - Stack created successfully
- CREATE_FAILED - Stack creation failed
- ROLLBACK_IN_PROGRESS - Rolling back failed creation
- ROLLBACK_COMPLETE - Creation rolled back successfully
- ROLLBACK_FAILED - Rollback failed (manual intervention needed)

**Update States:**
- UPDATE_IN_PROGRESS - Stack update started
- UPDATE_COMPLETE - Stack updated successfully
- UPDATE_COMPLETE_CLEANUP_IN_PROGRESS - Cleaning up old resources
- UPDATE_ROLLBACK_IN_PROGRESS - Rolling back failed update
- UPDATE_ROLLBACK_COMPLETE - Update rolled back successfully
- UPDATE_ROLLBACK_FAILED - Update rollback failed

**Deletion States:**
- DELETE_IN_PROGRESS - Stack deletion started
- DELETE_COMPLETE - Stack deleted successfully
- DELETE_FAILED - Stack deletion failed

### Stack Updates

CloudFormation updates can result in different actions:

**1. No Interruption**
- Resource updated without any disruption
- Examples: Tags, descriptions, some properties

**2. Some Interruption**
- Resource experiences brief interruption
- Examples: Stopping/starting services

**3. Replacement**
- Resource must be replaced with new resource
- Examples: Changing EC2 instance type, KeyName

**Update Behavior:**
- **Update with No Interruption**: Property changed in place
- **Update Requires: Some Interruption**: Resource stopped and started
- **Update Requires: Replacement**: New resource created, old deleted

### Change Sets

Change sets allow you to preview changes before executing:

**Benefits:**
- See what will be modified, added, or deleted
- Understand replacement behavior
- Review impact before applying
- Prevent unexpected resource deletion
- Enable approval workflows

**Workflow:**
1. Create change set
2. Review proposed changes
3. Execute or delete change set

### Stack Rollback

**Automatic Rollback:**
- Occurs when stack creation/update fails
- Returns stack to previous stable state
- Deletes newly created resources
- Restores modified resources

**Manual Rollback:**
- Continue update rollback (for stuck rollbacks)
- Cancel update (for in-progress updates)

### Resource Update Behavior

Different properties have different update behaviors:

**Static Properties (Replacement):**
- EC2 Instance: KeyName, InstanceType (sometimes), AvailabilityZone
- RDS: DBInstanceIdentifier, Engine
- S3: BucketName

**Dynamic Properties (No Replacement):**
- EC2: Tags, SecurityGroups (VPC instances)
- RDS: BackupRetentionPeriod, PreferredBackupWindow
- S3: Tags, LifecycleConfiguration

## Prerequisites

- AWS Account with CloudFormation and EC2 permissions
- AWS CLI configured with credentials
- EC2 Key Pairs created (multiple for testing updates)
- VPC and Subnet IDs for your region
- Understanding of:
  - CloudFormation templates
  - EC2 instances
  - Stack lifecycle
  - Update policies

## Project Structure

```
StackConcepts/
├── README.md                                              # This file
├── 01-cfn-ec2-instance-create.yml                        # Initial stack creation
├── 02-cfn-ec2-instance-update-Add-Key.yml                # Add KeyName (update)
├── 03-cfn-ec2-instance-change-set-Change-Key.yml         # Change KeyName (replacement)
├── 04-cfn-ec2-instance-change-set-Change-InstanceType.yml # Change instance type
├── 05-cfn-ec2-instance-Update-rollback.yml               # Trigger rollback scenario
└── 06-cfn-ec2-instance-CreateStack-Invalid-Template.yml  # Invalid template test
```

### File Progression

**01-cfn-ec2-instance-create.yml**
- Creates basic EC2 instance
- No KeyName initially
- Demonstrates initial stack creation
- Starting point for updates

**02-cfn-ec2-instance-update-Add-Key.yml**
- Adds KeyName property
- **Results in instance replacement**
- Shows update behavior
- Demonstrates resource recreation

**03-cfn-ec2-instance-change-set-Change-Key.yml**
- Changes existing KeyName to different key
- Uses change set to preview replacement
- Shows change set workflow
- Demonstrates preview-then-execute pattern

**04-cfn-ec2-instance-change-set-Change-InstanceType.yml**
- Changes instance type (t2.micro -> t2.small)
- May or may not require replacement
- Depends on instance state and type
- Shows instance type update behavior

**05-cfn-ec2-instance-Update-rollback.yml**
- Contains errors that trigger rollback
- Demonstrates automatic rollback
- Shows error handling
- Returns to previous stable state

**06-cfn-ec2-instance-CreateStack-Invalid-Template.yml**
- Invalid template syntax
- Fails validation
- Shows template validation errors
- Demonstrates pre-creation validation

## Usage

### 1. Create Initial Stack

```bash
# Note: Update SubnetId in template first!
# Edit 01-cfn-ec2-instance-create.yml and replace subnet-xxxxxxxxxxxx

# Create stack without KeyName
aws cloudformation create-stack \
  --stack-name stack-concepts-demo \
  --template-body file://01-cfn-ec2-instance-create.yml \
  --region us-east-2

# Monitor creation
aws cloudformation describe-stacks \
  --stack-name stack-concepts-demo \
  --region us-east-2 \
  --query 'Stacks[0].StackStatus'

# Wait for CREATE_COMPLETE
aws cloudformation wait stack-create-complete \
  --stack-name stack-concepts-demo \
  --region us-east-2

# Get instance ID
aws cloudformation describe-stack-resources \
  --stack-name stack-concepts-demo \
  --logical-resource-id DevEC2Instance \
  --query 'StackResources[0].PhysicalResourceId' \
  --output text
```

### 2. Update Stack (Add KeyName - Causes Replacement)

```bash
# Update SubnetId and KeyName in template
# Edit 02-cfn-ec2-instance-update-Add-Key.yml

# Update stack
aws cloudformation update-stack \
  --stack-name stack-concepts-demo \
  --template-body file://02-cfn-ec2-instance-update-Add-Key.yml \
  --region us-east-2

# Watch update events
aws cloudformation describe-stack-events \
  --stack-name stack-concepts-demo \
  --region us-east-2 \
  --query 'StackEvents[].[Timestamp,ResourceStatus,ResourceType,ResourceStatusReason]' \
  --output table

# Note the instance replacement:
# 1. New instance created (CREATE_IN_PROGRESS)
# 2. New instance complete (CREATE_COMPLETE)
# 3. Old instance deleted (DELETE_IN_PROGRESS)
# 4. Old instance removed (DELETE_COMPLETE)

# Get new instance ID (will be different)
aws cloudformation describe-stack-resources \
  --stack-name stack-concepts-demo \
  --logical-resource-id DevEC2Instance \
  --query 'StackResources[0].PhysicalResourceId' \
  --output text
```

### 3. Create Change Set (Preview Changes)

```bash
# Update KeyName in template
# Edit 03-cfn-ec2-instance-change-set-Change-Key.yml

# Create change set
aws cloudformation create-change-set \
  --stack-name stack-concepts-demo \
  --change-set-name change-keyname \
  --template-body file://03-cfn-ec2-instance-change-set-Change-Key.yml \
  --region us-east-2

# Wait for change set creation
aws cloudformation wait change-set-create-complete \
  --stack-name stack-concepts-demo \
  --change-set-name change-keyname \
  --region us-east-2

# Review changes
aws cloudformation describe-change-set \
  --stack-name stack-concepts-demo \
  --change-set-name change-keyname \
  --region us-east-2 \
  --query 'Changes[].{Action:ResourceChange.Action,LogicalId:ResourceChange.LogicalResourceId,ResourceType:ResourceChange.ResourceType,Replacement:ResourceChange.Replacement}' \
  --output table

# Expected output shows:
# Action: Modify
# Replacement: True (instance will be replaced)

# Execute change set if acceptable
aws cloudformation execute-change-set \
  --stack-name stack-concepts-demo \
  --change-set-name change-keyname \
  --region us-east-2

# Or delete change set if not acceptable
# aws cloudformation delete-change-set \
#   --stack-name stack-concepts-demo \
#   --change-set-name change-keyname \
#   --region us-east-2
```

### 4. Change Set for Instance Type

```bash
# Update InstanceType in template
# Edit 04-cfn-ec2-instance-change-set-Change-InstanceType.yml

# Create change set
aws cloudformation create-change-set \
  --stack-name stack-concepts-demo \
  --change-set-name change-instance-type \
  --template-body file://04-cfn-ec2-instance-change-set-Change-InstanceType.yml \
  --region us-east-2

# Review changes
aws cloudformation describe-change-set \
  --stack-name stack-concepts-demo \
  --change-set-name change-instance-type \
  --region us-east-2

# Note: Replacement behavior depends on instance state
# For stopped instances: Often no replacement
# For running instances: May require replacement

# Execute or delete
aws cloudformation execute-change-set \
  --stack-name stack-concepts-demo \
  --change-set-name change-instance-type \
  --region us-east-2
```

### 5. Test Rollback (Update with Error)

```bash
# Attempt update with invalid configuration
# This will fail and trigger rollback

# Note: This is a demonstration - you may need to create
# an intentionally failing update for your environment

# Monitor rollback
aws cloudformation describe-stack-events \
  --stack-name stack-concepts-demo \
  --region us-east-2 \
  --query 'StackEvents[?ResourceStatus==`UPDATE_ROLLBACK_IN_PROGRESS` || ResourceStatus==`UPDATE_ROLLBACK_COMPLETE`]' \
  --output table

# Stack returns to UPDATE_ROLLBACK_COMPLETE
# Resources restored to pre-update state
```

### 6. Test Invalid Template

```bash
# Try to create stack with invalid template
aws cloudformation create-stack \
  --stack-name invalid-stack-test \
  --template-body file://06-cfn-ec2-instance-CreateStack-Invalid-Template.yml \
  --region us-east-2

# Expected: Validation error
# Template may have syntax errors or invalid resource properties
# CloudFormation validates before creating any resources
```

### 7. View Stack Events

```bash
# Get all events
aws cloudformation describe-stack-events \
  --stack-name stack-concepts-demo \
  --region us-east-2

# Get only failures
aws cloudformation describe-stack-events \
  --stack-name stack-concepts-demo \
  --region us-east-2 \
  --query 'StackEvents[?contains(ResourceStatus, `FAILED`)]'

# Get events for specific resource
aws cloudformation describe-stack-events \
  --stack-name stack-concepts-demo \
  --region us-east-2 \
  --query 'StackEvents[?LogicalResourceId==`DevEC2Instance`]'
```

### 8. Delete Stack

```bash
# Delete stack and all resources
aws cloudformation delete-stack \
  --stack-name stack-concepts-demo \
  --region us-east-2

# Wait for deletion
aws cloudformation wait stack-delete-complete \
  --stack-name stack-concepts-demo \
  --region us-east-2

# Verify deletion
aws cloudformation describe-stacks \
  --stack-name stack-concepts-demo \
  --region us-east-2
# Should return error: Stack does not exist
```

## Template Examples

### Stack with Update Policy

```yaml
Resources:
  MyInstance:
    Type: AWS::EC2::Instance
    UpdateReplacePolicy: Retain  # Keep resource on replacement
    DeletionPolicy: Snapshot     # Snapshot on deletion (for EBS)
    Properties:
      ImageId: ami-xxxxx
      InstanceType: t2.micro
```

### Stack with DependsOn

```yaml
Resources:
  MyEIP:
    Type: AWS::EC2::EIP
    Properties:
      InstanceId: !Ref MyInstance

  MyInstance:
    Type: AWS::EC2::Instance
    DependsOn: MyIGWAttachment  # Ensure IGW attached first
    Properties:
      ImageId: ami-xxxxx
      InstanceType: t2.micro
```

### Stack with CreationPolicy

```yaml
Resources:
  MyInstance:
    Type: AWS::EC2::Instance
    CreationPolicy:
      ResourceSignal:
        Timeout: PT15M
        Count: 1
    Properties:
      ImageId: ami-xxxxx
      InstanceType: t2.micro
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          # ... setup ...
          /opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource MyInstance --region ${AWS::Region}
```

### Stack with UpdatePolicy

```yaml
Resources:
  MyASG:
    Type: AWS::AutoScaling::AutoScalingGroup
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 2
        PauseTime: PT5M
        WaitOnResourceSignals: true
    Properties:
      # ... ASG properties ...
```

### Change Set Example

```yaml
# Original Template
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-bucket

# Updated Template (change set will show BucketName change requires replacement)
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-new-bucket  # Replacement required!
```

## Features

### Stack Operations

1. **Create**
   - Validates template
   - Creates resources in dependency order
   - Rolls back on failure
   - Supports wait conditions

2. **Update**
   - Detects changes
   - Determines update behavior
   - Creates/updates/deletes resources
   - Automatic rollback on failure

3. **Delete**
   - Deletes resources in reverse order
   - Handles dependencies
   - Retains resources with retention policy
   - Fails if resources in use

4. **Change Sets**
   - Preview changes
   - Review impact
   - Approve before execution
   - Multiple change sets per stack

### Resource Management

1. **Update Behaviors**
   - No interruption
   - Some interruption
   - Replacement

2. **Policies**
   - DeletionPolicy: Retain, Delete, Snapshot
   - UpdateReplacePolicy: Retain, Delete, Snapshot
   - CreationPolicy: Wait for signals
   - UpdatePolicy: Control update behavior

3. **Drift Detection**
   - Detect manual changes
   - Compare actual vs template
   - Identify drift per resource

## Troubleshooting

### Stack Creation Failures

**1. Stack Stuck in CREATE_IN_PROGRESS**

```bash
# Check which resource is pending
aws cloudformation describe-stack-resources \
  --stack-name stack-name \
  --query 'StackResources[?ResourceStatus==`CREATE_IN_PROGRESS`]'

# Common causes:
# - Waiting for CreationPolicy signal
# - Resource dependency not met
# - Resource creation hanging

# Check events for details
aws cloudformation describe-stack-events \
  --stack-name stack-name \
  --max-items 20
```

**2. Stack in ROLLBACK_COMPLETE**

```bash
# Stack failed creation and rolled back
# Cannot update stack in ROLLBACK_COMPLETE
# Must delete and recreate

# View failure reason
aws cloudformation describe-stack-events \
  --stack-name stack-name \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'

# Delete stack
aws cloudformation delete-stack --stack-name stack-name

# Fix issue and recreate
aws cloudformation create-stack --stack-name stack-name --template-body file://fixed-template.yml
```

**3. Stack in ROLLBACK_FAILED**

```bash
# Rollback failed - manual intervention needed
# Common causes:
# - Resource cannot be deleted (in use, permission denied)
# - Dependencies prevent deletion

# View errors
aws cloudformation describe-stack-events \
  --stack-name stack-name \
  --query 'StackEvents[?ResourceStatus==`DELETE_FAILED`]'

# Fix issues (e.g., manually delete stuck resources)
# Then continue rollback
aws cloudformation continue-update-rollback \
  --stack-name stack-name
```

### Stack Update Failures

**4. UPDATE_ROLLBACK_COMPLETE**

```bash
# Update failed and rolled back
# Stack is in previous working state

# Find why update failed
aws cloudformation describe-stack-events \
  --stack-name stack-name \
  --query 'StackEvents[?ResourceStatus==`UPDATE_FAILED`]'

# Fix issue and retry update
aws cloudformation update-stack \
  --stack-name stack-name \
  --template-body file://fixed-template.yml
```

**5. Unexpected Resource Replacement**

```bash
# Use change sets to preview replacements
aws cloudformation create-change-set \
  --stack-name stack-name \
  --change-set-name preview-update \
  --template-body file://template.yml

# Review what will be replaced
aws cloudformation describe-change-set \
  --stack-name stack-name \
  --change-set-name preview-update \
  --query 'Changes[?ResourceChange.Replacement==`True`]'

# If replacements unacceptable, delete change set
aws cloudformation delete-change-set \
  --stack-name stack-name \
  --change-set-name preview-update
```

**6. Update Rollback Failed**

```bash
# Check which resources failed to rollback
aws cloudformation describe-stack-events \
  --stack-name stack-name \
  --query 'StackEvents[?contains(ResourceStatus, `ROLLBACK`) && contains(ResourceStatus, `FAILED`)]'

# Skip resources that cannot be rolled back
aws cloudformation continue-update-rollback \
  --stack-name stack-name \
  --resources-to-skip Resource1 Resource2
```

### Stack Deletion Failures

**7. DELETE_FAILED**

```bash
# Find resources that failed to delete
aws cloudformation describe-stack-events \
  --stack-name stack-name \
  --query 'StackEvents[?ResourceStatus==`DELETE_FAILED`]'

# Common causes:
# - S3 bucket not empty
# - Resource in use by another resource
# - Insufficient permissions
# - Resource created outside stack (imported)

# Fix issues then retry deletion
aws cloudformation delete-stack --stack-name stack-name

# Or skip problematic resources
aws cloudformation delete-stack \
  --stack-name stack-name \
  --retain-resources Resource1 Resource2
```

### Change Set Issues

**8. Change Set Creation Failed**

```bash
# Check why change set failed
aws cloudformation describe-change-set \
  --stack-name stack-name \
  --change-set-name change-set-name \
  --query 'StatusReason'

# Common causes:
# - No changes detected
# - Invalid template
# - Parameter validation failed

# Delete failed change set
aws cloudformation delete-change-set \
  --stack-name stack-name \
  --change-set-name change-set-name
```

### General Debugging

**9. Enable Termination Protection**

```bash
# Prevent accidental deletion
aws cloudformation update-termination-protection \
  --stack-name stack-name \
  --enable-termination-protection

# Must disable before deletion
aws cloudformation update-termination-protection \
  --stack-name stack-name \
  --no-enable-termination-protection
```

**10. Drift Detection**

```bash
# Detect configuration drift
aws cloudformation detect-stack-drift \
  --stack-name stack-name

# Get drift detection status
aws cloudformation describe-stack-drift-detection-status \
  --stack-drift-detection-id drift-id

# View drifted resources
aws cloudformation describe-stack-resource-drifts \
  --stack-name stack-name \
  --stack-resource-drift-status-filters MODIFIED DELETED
```

## Best Practices

### 1. Always Use Change Sets for Production

```bash
# Never update production directly
# Always create and review change set first

# Create change set
aws cloudformation create-change-set \
  --stack-name prod-stack \
  --change-set-name prod-update-v2 \
  --template-body file://template.yml

# Review thoroughly
aws cloudformation describe-change-set \
  --stack-name prod-stack \
  --change-set-name prod-update-v2

# Execute only after approval
aws cloudformation execute-change-set \
  --stack-name prod-stack \
  --change-set-name prod-update-v2
```

### 2. Set Appropriate Deletion Policies

```yaml
# Protect critical data
Resources:
  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      # ...

  DataBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      # ...
```

### 3. Use Stack Policies

```bash
# Protect specific resources from updates
cat > stack-policy.json << EOF
{
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "Update:*",
      "Resource": "LogicalResourceId/ProductionDB"
    },
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "Update:*",
      "Resource": "*"
    }
  ]
}
EOF

# Set stack policy
aws cloudformation set-stack-policy \
  --stack-name stack-name \
  --stack-policy-body file://stack-policy.json
```

### 4. Enable Termination Protection

```bash
# Protect production stacks
aws cloudformation create-stack \
  --stack-name prod-stack \
  --template-body file://template.yml \
  --enable-termination-protection
```

### 5. Tag Your Stacks

```yaml
# In template
Resources:
  MyResource:
    Type: AWS::EC2::Instance
    Properties:
      Tags:
        - Key: Environment
          Value: Production
        - Key: Application
          Value: WebApp
        - Key: ManagedBy
          Value: CloudFormation
        - Key: CostCenter
          Value: Engineering
```

```bash
# Or during stack creation
aws cloudformation create-stack \
  --stack-name stack-name \
  --template-body file://template.yml \
  --tags Key=Environment,Value=Production Key=Application,Value=WebApp
```

### 6. Monitor Stack Events

```bash
# Set up notifications
aws cloudformation create-stack \
  --stack-name stack-name \
  --template-body file://template.yml \
  --notification-arns arn:aws:sns:region:account:topic-name

# Subscribe to SNS topic for stack events
```

### 7. Use DependsOn for Ordering

```yaml
Resources:
  # Ensure network ready before instances
  MyInstance:
    Type: AWS::EC2::Instance
    DependsOn:
      - InternetGatewayAttachment
      - RouteTableAssociation
    Properties:
      # ...
```

### 8. Implement Rollback Configuration

```yaml
# Template with rollback alarms
Resources:
  MyASG:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      # ...

  CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      # ...

# During update
aws cloudformation update-stack \
  --stack-name stack-name \
  --template-body file://template.yml \
  --rollback-configuration \
    "RollbackTriggers=[{Arn=arn:aws:cloudwatch:...,Type=AWS::CloudWatch::Alarm}],MonitoringTimeInMinutes=5"
```

### 9. Version Your Templates

```bash
# Tag templates with versions
# Store in version control
git tag -a v1.0.0 -m "Initial production release"

# Reference versions in comments
# Template Version: 1.0.0
# Last Updated: 2024-01-15
# Changes: Added RDS instance
```

### 10. Test in Non-Production First

```bash
# Always test stack changes in dev/staging
aws cloudformation create-stack \
  --stack-name dev-stack \
  --template-body file://template.yml \
  --tags Key=Environment,Value=Development

# After validation, promote to production
# Use same template with different parameters
```
