# CloudFormation Nested Stacks - Modular Template Architecture

## Overview

This project demonstrates CloudFormation Nested Stacks, a powerful pattern for creating modular, reusable infrastructure components. Nested stacks enable you to break down complex infrastructure into smaller, manageable templates that can be referenced and reused across multiple deployments. This approach promotes separation of concerns, reduces duplication, and makes infrastructure code more maintainable.

Nested stacks work by having a root (parent) stack that creates child stacks using the AWS::CloudFormation::Stack resource type. Each child stack is a complete CloudFormation template stored in S3, which can have its own resources, parameters, and outputs. The parent stack passes parameters to child stacks and consumes their outputs, creating a cohesive infrastructure deployment.

## CloudFormation Concepts

### Nested Stacks

A nested stack is a stack created as a resource within another stack using the AWS::CloudFormation::Stack resource type.

**Key Characteristics:**
- Child stacks are complete CloudFormation templates
- Stored in S3 (accessible via HTTPS)
- Created, updated, and deleted as part of parent stack
- Can have their own parameters and outputs
- Can be reused across multiple parent stacks

### Root Stack vs Nested Stack

**Root Stack (Parent):**
- Top-level stack created by user
- Creates nested stack resources
- Passes parameters to child stacks
- Consumes outputs from child stacks
- Controls lifecycle of all nested stacks

**Nested Stack (Child):**
- Created by AWS::CloudFormation::Stack resource
- Receives parameters from parent
- Exports outputs to parent
- Can itself contain nested stacks

### AWS::CloudFormation::Stack Resource

```yaml
Resources:
  NestedStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: https://s3.region.amazonaws.com/bucket/template.yml
      Parameters:
        ParameterName: ParameterValue
      TimeoutInMinutes: 10
      Tags:
        - Key: Name
          Value: MyNestedStack
```

### Parameter Passing

Parent passes values to nested stack:

```yaml
# Parent Stack
Resources:
  VPCStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: https://s3.../vpc.yml
      Parameters:
        VpcCIDR: !Ref VpcBlock
        SubnetCIDR: !Ref Subnet01Block
```

### Output Consumption

Parent consumes nested stack outputs:

```yaml
# Parent Stack
Resources:
  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      # Get SubnetId from nested VPC stack
      SubnetId: !GetAtt VPCStack.Outputs.Subnet01Id
      # Get VPCId from nested stack
      VpcId: !GetAtt VPCStack.Outputs.VpcId
```

## Prerequisites

- AWS Account with CloudFormation and S3 permissions
- AWS CLI configured with credentials
- S3 bucket for storing nested stack templates
- EC2 Key Pair in your region
- Understanding of:
  - CloudFormation templates and stacks
  - VPC networking (subnets, route tables, internet gateways)
  - Security groups
  - S3 bucket access and URLs

## Project Structure

```
NestedStacks/
├── README.md                          # This file
├── 01-NestedStack-VPC.yml            # Nested VPC template
├── 02-RootStack-EC2-VPC.yml          # Root stack using VPC nested stack
├── 03-NestedStack-SG.yml             # Nested Security Group template
├── 04-RootStack-EC2-SG.yml           # Root stack using SG nested stack
└── Updated-SG/
    └── 03-NestedStack-SG.yml         # Updated security group template
```

### File Descriptions

**01-NestedStack-VPC.yml**
- Complete VPC infrastructure template
- Creates VPC, subnet, route table, internet gateway
- Parameters for CIDR blocks
- Outputs VPC ID and Subnet ID
- Designed to be used as nested stack

**02-RootStack-EC2-VPC.yml**
- Root stack that creates VPC using nested stack
- Creates EC2 instance using VPC from nested stack
- Demonstrates parameter passing to nested stack
- Shows output consumption from nested stack
- Complete working example

**03-NestedStack-SG.yml**
- Security group template as nested stack
- Parameterized for flexibility
- Can be reused across environments

**04-RootStack-EC2-SG.yml**
- Root stack using security group nested stack
- Demonstrates multiple nested stacks
- Shows dependency management

**Updated-SG/**
- Updated version of security group template
- Demonstrates template versioning
- Stack update without instance replacement

## Usage

### Prepare S3 Bucket for Templates

```bash
# Create S3 bucket (if needed)
aws s3 mb s3://your-nested-stack-bucket --region us-east-2

# Upload nested stack templates
aws s3 cp 01-NestedStack-VPC.yml s3://your-nested-stack-bucket/nestedstacks/ --region us-east-2
aws s3 cp 03-NestedStack-SG.yml s3://your-nested-stack-bucket/nestedstacks/ --region us-east-2

# Verify uploads
aws s3 ls s3://your-nested-stack-bucket/nestedstacks/
```

### Update Template URLs

Edit root stack templates to use your S3 bucket:

```yaml
# In 02-RootStack-EC2-VPC.yml
Resources:
  VPCStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      # Update this URL to your bucket
      TemplateURL: https://s3.us-east-2.amazonaws.com/your-nested-stack-bucket/nestedstacks/01-NestedStack-VPC.yml
```

### Deploy Root Stack with Nested VPC

```bash
# Deploy complete infrastructure
aws cloudformation create-stack \
  --stack-name root-stack-with-vpc \
  --template-body file://02-RootStack-EC2-VPC.yml \
  --parameters \
    ParameterKey=MyKeyName,ParameterValue=your-key-name \
    ParameterKey=VpcBlock,ParameterValue=10.0.0.0/16 \
    ParameterKey=Subnet01Block,ParameterValue=10.0.1.0/24 \
  --region us-east-2
```

### Monitor Nested Stack Creation

```bash
# List all stacks (root and nested)
aws cloudformation list-stacks \
  --stack-status-filter CREATE_IN_PROGRESS CREATE_COMPLETE \
  --region us-east-2 \
  --query 'StackSummaries[].[StackName,StackStatus,ParentId]' \
  --output table

# Describe root stack
aws cloudformation describe-stacks \
  --stack-name root-stack-with-vpc \
  --region us-east-2

# Describe nested VPC stack (name auto-generated)
aws cloudformation describe-stacks \
  --stack-name root-stack-with-vpc-VPCStack-XXXXX \
  --region us-east-2

# Watch events for root stack
aws cloudformation describe-stack-events \
  --stack-name root-stack-with-vpc \
  --region us-east-2 \
  --query 'StackEvents[].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId]' \
  --output table
```

### Verify Nested Stack Resources

```bash
# List resources in root stack
aws cloudformation list-stack-resources \
  --stack-name root-stack-with-vpc \
  --region us-east-2

# Get nested stack outputs
aws cloudformation describe-stacks \
  --stack-name root-stack-with-vpc-VPCStack-XXXXX \
  --region us-east-2 \
  --query 'Stacks[0].Outputs'

# Verify VPC was created
aws ec2 describe-vpcs \
  --filters "Name=tag:Name,Values=*myVPC" \
  --region us-east-2

# Verify EC2 instance is in correct subnet
aws cloudformation describe-stack-resources \
  --stack-name root-stack-with-vpc \
  --logical-resource-id MyVMInstance \
  --region us-east-2 \
  --query 'StackResources[0].PhysicalResourceId'
```

### Update Nested Stack Template

```bash
# Upload updated template to S3
aws s3 cp Updated-SG/03-NestedStack-SG.yml \
  s3://your-nested-stack-bucket/nestedstacks/ \
  --region us-east-2

# Update root stack (will update nested stack)
aws cloudformation update-stack \
  --stack-name root-stack-with-vpc \
  --template-body file://02-RootStack-EC2-VPC.yml \
  --parameters \
    ParameterKey=MyKeyName,ParameterValue=your-key-name \
    ParameterKey=VpcBlock,ParameterValue=10.0.0.0/16 \
    ParameterKey=Subnet01Block,ParameterValue=10.0.1.0/24 \
  --region us-east-2

# CloudFormation detects template change and updates nested stack
```

### Delete Stacks

```bash
# Delete root stack (automatically deletes nested stacks)
aws cloudformation delete-stack \
  --stack-name root-stack-with-vpc \
  --region us-east-2

# Watch deletion progress
aws cloudformation describe-stack-events \
  --stack-name root-stack-with-vpc \
  --region us-east-2 \
  --query 'StackEvents[?ResourceStatus==`DELETE_IN_PROGRESS` || ResourceStatus==`DELETE_COMPLETE`]'

# Note: Never delete nested stacks directly
# Always delete the root stack
```

### Access Application

```bash
# Get application URL from root stack outputs
aws cloudformation describe-stacks \
  --stack-name root-stack-with-vpc \
  --region us-east-2 \
  --query 'Stacks[0].Outputs[?OutputKey==`AppURL`].OutputValue' \
  --output text

# Test application
curl http://<instance-dns>:8080/index.html
```

## Template Examples

### Basic Nested Stack Pattern

```yaml
# Root Stack
AWSTemplateFormatVersion: '2010-09-09'
Description: Root Stack with Nested VPC

Parameters:
  VpcCIDR:
    Type: String
    Default: 10.0.0.0/16

Resources:
  # Nested VPC Stack
  NetworkStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: https://s3.amazonaws.com/bucket/vpc.yml
      Parameters:
        VpcBlock: !Ref VpcCIDR
      TimeoutInMinutes: 10

  # Use nested stack outputs
  MyInstance:
    Type: AWS::EC2::Instance
    Properties:
      SubnetId: !GetAtt NetworkStack.Outputs.SubnetId
      ImageId: ami-xxxxx
      InstanceType: t2.micro

Outputs:
  VPCId:
    Description: VPC from nested stack
    Value: !GetAtt NetworkStack.Outputs.VpcId
```

```yaml
# Nested VPC Template (vpc.yml)
AWSTemplateFormatVersion: '2010-09-09'
Description: VPC Nested Stack

Parameters:
  VpcBlock:
    Type: String
    Default: 10.0.0.0/16

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcBlock
      EnableDnsHostnames: true

  Subnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Cidr [!Ref VpcBlock, 4, 8]]

Outputs:
  VpcId:
    Description: VPC ID
    Value: !Ref VPC

  SubnetId:
    Description: Subnet ID
    Value: !Ref Subnet
```

### Multiple Nested Stacks

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Root Stack with Multiple Nested Stacks

Resources:
  # Network infrastructure
  NetworkStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: https://s3.amazonaws.com/bucket/network.yml
      Parameters:
        VpcCIDR: 10.0.0.0/16

  # Security groups
  SecurityStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: https://s3.amazonaws.com/bucket/security.yml
      Parameters:
        VpcId: !GetAtt NetworkStack.Outputs.VpcId

  # Application servers
  AppStack:
    Type: AWS::CloudFormation::Stack
    DependsOn:
      - NetworkStack
      - SecurityStack
    Properties:
      TemplateURL: https://s3.amazonaws.com/bucket/application.yml
      Parameters:
        SubnetId: !GetAtt NetworkStack.Outputs.SubnetId
        SecurityGroupId: !GetAtt SecurityStack.Outputs.SecurityGroupId

  # Database
  DatabaseStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: https://s3.amazonaws.com/bucket/database.yml
      Parameters:
        VpcId: !GetAtt NetworkStack.Outputs.VpcId
        SubnetIds: !GetAtt NetworkStack.Outputs.PrivateSubnetIds
```

### Nested Stack with Conditions

```yaml
Parameters:
  Environment:
    Type: String
    AllowedValues:
      - dev
      - prod

Conditions:
  IsProduction: !Equals [!Ref Environment, prod]

Resources:
  # Always create network
  NetworkStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: https://s3.amazonaws.com/bucket/network.yml

  # Only create in production
  MonitoringStack:
    Type: AWS::CloudFormation::Stack
    Condition: IsProduction
    Properties:
      TemplateURL: https://s3.amazonaws.com/bucket/monitoring.yml
      Parameters:
        VpcId: !GetAtt NetworkStack.Outputs.VpcId
```

### Cross-Stack References Pattern

```yaml
# Network Stack with Exports
Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub "${AWS::StackName}-VPCId"

  SubnetId:
    Description: Subnet ID
    Value: !Ref Subnet
    Export:
      Name: !Sub "${AWS::StackName}-SubnetId"

# Application Stack Using Imports
Resources:
  Instance:
    Type: AWS::EC2::Instance
    Properties:
      SubnetId: !ImportValue NetworkStack-SubnetId
```

### Nested Stack with All Features

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Complete Nested Stack Example

Parameters:
  KeyName:
    Type: AWS::EC2::KeyPair::KeyName
  Environment:
    Type: String
    Default: dev

Mappings:
  EnvironmentConfig:
    dev:
      InstanceType: t2.micro
      VpcCIDR: 10.0.0.0/16
    prod:
      InstanceType: t2.small
      VpcCIDR: 10.1.0.0/16

Resources:
  # VPC Infrastructure
  VPCStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: !Sub "https://s3.${AWS::Region}.amazonaws.com/bucket/vpc.yml"
      Parameters:
        VpcBlock: !FindInMap [EnvironmentConfig, !Ref Environment, VpcCIDR]
        Environment: !Ref Environment
      TimeoutInMinutes: 10
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Type
          Value: Network

  # Security Groups
  SecurityStack:
    Type: AWS::CloudFormation::Stack
    DependsOn: VPCStack
    Properties:
      TemplateURL: !Sub "https://s3.${AWS::Region}.amazonaws.com/bucket/security.yml"
      Parameters:
        VpcId: !GetAtt VPCStack.Outputs.VpcId
        Environment: !Ref Environment

  # Application Tier
  ApplicationStack:
    Type: AWS::CloudFormation::Stack
    DependsOn:
      - VPCStack
      - SecurityStack
    Properties:
      TemplateURL: !Sub "https://s3.${AWS::Region}.amazonaws.com/bucket/application.yml"
      Parameters:
        SubnetId: !GetAtt VPCStack.Outputs.SubnetId
        SecurityGroupId: !GetAtt SecurityStack.Outputs.SecurityGroupId
        InstanceType: !FindInMap [EnvironmentConfig, !Ref Environment, InstanceType]
        KeyName: !Ref KeyName

Outputs:
  ApplicationURL:
    Description: Application URL
    Value: !GetAtt ApplicationStack.Outputs.AppURL

  VPCId:
    Description: VPC ID
    Value: !GetAtt VPCStack.Outputs.VpcId
    Export:
      Name: !Sub "${AWS::StackName}-VPCId"
```

## Features

### Modularity and Reusability

1. **Component Isolation**
   - VPC in separate template
   - Security groups in separate template
   - Application logic in separate template
   - Each can be updated independently

2. **Template Reuse**
   - Same VPC template across multiple stacks
   - Same security group template for different apps
   - Standard components as building blocks

3. **Version Control**
   - Different template versions in S3
   - Controlled updates through S3 versioning
   - Easy rollback to previous versions

### Organization Benefits

1. **Separation of Concerns**
   - Network team manages network templates
   - Security team manages security templates
   - Application team manages app templates

2. **Reduced Complexity**
   - Smaller, focused templates
   - Easier to understand and maintain
   - Simpler testing and validation

3. **Team Collaboration**
   - Different teams work on different templates
   - Clear interfaces via parameters/outputs
   - Independent development cycles

### Lifecycle Management

1. **Unified Deployment**
   - Single root stack deployment
   - Automatic nested stack creation
   - Coordinated resource provisioning

2. **Dependency Handling**
   - DependsOn between nested stacks
   - Automatic ordering
   - Output-based dependencies

3. **Update Coordination**
   - Update root stack updates nested stacks
   - Change detection in nested templates
   - Rollback propagation

## Troubleshooting

### Common Issues

**1. Nested Stack Creation Fails**

```bash
# Check nested stack events
aws cloudformation describe-stack-events \
  --stack-name root-stack-VPCStack-XXXXX \
  --region us-east-2 \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'

# Common causes:
# - Invalid parameter values passed from root
# - S3 template not accessible
# - Resource limits exceeded
# - IAM permissions insufficient
```

**2. Template URL Issues**

```bash
# Verify template is accessible
curl -I https://s3.us-east-2.amazonaws.com/bucket/template.yml

# Common issues:
# - Bucket not public (use bucket policy or pre-signed URL)
# - Wrong region in URL
# - Template not uploaded
# - Typo in URL

# Make bucket/object readable
aws s3api put-bucket-policy \
  --bucket your-bucket \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket/nestedstacks/*"
    }]
  }'
```

**3. Parameter Passing Errors**

```bash
# Error: "Parameter X not defined in template"
# Check nested template parameters match root stack

# Root Stack:
Parameters:
  VpcCIDR: !Ref VpcBlock  # Wrong parameter name

# Should be:
Parameters:
  VpcBlock: !Ref VpcBlock  # Matches nested template

# Validate parameter names
grep "Parameters:" nested-template.yml
```

**4. Output Not Found**

```bash
# Error: "Output X does not exist"
# Check nested template has output defined

# Get all outputs from nested stack
aws cloudformation describe-stacks \
  --stack-name nested-stack-name \
  --query 'Stacks[0].Outputs[].OutputKey'

# Verify output exists before using in root:
# !GetAtt NestedStack.Outputs.OutputName
```

**5. Circular Dependency**

```yaml
# WRONG: Creates circular dependency
Resources:
  Stack1:
    Type: AWS::CloudFormation::Stack
    Properties:
      Parameters:
        Param1: !GetAtt Stack2.Outputs.Output2

  Stack2:
    Type: AWS::CloudFormation::Stack
    Properties:
      Parameters:
        Param2: !GetAtt Stack1.Outputs.Output1  # Circular!

# CORRECT: One-way dependency
Resources:
  Stack1:
    Type: AWS::CloudFormation::Stack
    Properties:
      Parameters:
        Param1: !Ref SomeParameter

  Stack2:
    Type: AWS::CloudFormation::Stack
    DependsOn: Stack1
    Properties:
      Parameters:
        Param2: !GetAtt Stack1.Outputs.Output1  # OK
```

**6. Cannot Delete Nested Stack**

```bash
# Error when trying to delete nested stack directly
# Don't delete nested stacks directly!

# WRONG:
aws cloudformation delete-stack --stack-name nested-stack-xxxxx

# CORRECT: Delete root stack (deletes nested automatically)
aws cloudformation delete-stack --stack-name root-stack

# If nested stack stuck in DELETE_FAILED:
# 1. Check events for reason
aws cloudformation describe-stack-events \
  --stack-name nested-stack-xxxxx

# 2. Fix issue (e.g., manually delete resource)
# 3. Delete root stack again
```

**7. Update Rollback Issues**

```bash
# Nested stack update fails and rolls back
# Check nested stack events
aws cloudformation describe-stack-events \
  --stack-name root-stack-NestedStack-XXXXX \
  --query 'StackEvents[?ResourceStatus==`UPDATE_FAILED`]'

# Common causes:
# - Resource replacement not allowed
# - Parameter validation failed
# - Insufficient capacity
# - Resource in use

# Resume update after fixing:
aws cloudformation continue-update-rollback \
  --stack-name root-stack
```

### Debug Nested Stacks

```bash
# List all stacks with parent info
aws cloudformation describe-stacks \
  --query 'Stacks[].[StackName,StackStatus,ParentId]' \
  --output table

# Get nested stack physical ID
aws cloudformation describe-stack-resources \
  --stack-name root-stack \
  --logical-resource-id VPCStack \
  --query 'StackResources[0].PhysicalResourceId'

# View nested stack template
aws cloudformation get-template \
  --stack-name nested-stack-xxxxx

# Compare with S3 template
aws s3 cp s3://bucket/template.yml - | diff - <(aws cloudformation get-template --stack-name nested-stack-xxxxx --query TemplateBody)
```

## Best Practices

### 1. Store Templates in Versioned S3 Bucket

```bash
# Enable versioning
aws s3api put-bucket-versioning \
  --bucket your-bucket \
  --versioning-configuration Status=Enabled

# Upload with version
aws s3 cp template.yml s3://bucket/templates/vpc-v1.0.0.yml

# Use versioned URLs in templates
TemplateURL: https://s3.amazonaws.com/bucket/templates/vpc-v1.0.0.yml
```

### 2. Use Meaningful Stack Names

```yaml
Resources:
  NetworkStack:  # Descriptive name
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: ...
      Tags:
        - Key: Component
          Value: Network
```

### 3. Document Parameters and Outputs

```yaml
# Nested Template
Parameters:
  VpcBlock:
    Type: String
    Description: "CIDR block for VPC (e.g., 10.0.0.0/16)"
    AllowedPattern: "^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$"

Outputs:
  VpcId:
    Description: "VPC ID - Use this for security groups and subnets"
    Value: !Ref VPC
  SubnetId:
    Description: "Public Subnet ID - Use for EC2 instances"
    Value: !Ref Subnet
```

### 4. Use DependsOn for Ordering

```yaml
Resources:
  NetworkStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: ...

  SecurityStack:
    Type: AWS::CloudFormation::Stack
    DependsOn: NetworkStack  # Ensure network exists first
    Properties:
      TemplateURL: ...
      Parameters:
        VpcId: !GetAtt NetworkStack.Outputs.VpcId
```

### 5. Set Appropriate Timeouts

```yaml
Resources:
  ComplexStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: ...
      # Adjust based on stack complexity
      TimeoutInMinutes: 30  # Default is no timeout
```

### 6. Tag Nested Stacks

```yaml
Resources:
  VPCStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: ...
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Component
          Value: Network
        - Key: ManagedBy
          Value: CloudFormation
```

### 7. Use Parameters for Template URLs

```yaml
Parameters:
  TemplateBucket:
    Type: String
    Default: my-templates-bucket

Resources:
  VPCStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      # Flexible template location
      TemplateURL: !Sub "https://s3.${AWS::Region}.amazonaws.com/${TemplateBucket}/vpc.yml"
```

### 8. Implement Rollback Configuration

```yaml
Resources:
  AppStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: ...
      # CloudFormation will monitor these alarms
      # and rollback if triggered during update
      NotificationARNs:
        - !Ref AlertSNSTopic
```

### 9. Create Reusable Template Library

```
s3://templates-bucket/
├── network/
│   ├── vpc-v1.0.0.yml
│   ├── vpc-v1.1.0.yml
│   └── subnet-v1.0.0.yml
├── security/
│   ├── sg-web-v1.0.0.yml
│   └── sg-db-v1.0.0.yml
└── compute/
    ├── ec2-web-v1.0.0.yml
    └── asg-v1.0.0.yml
```

### 10. Use Cross-Stack References Wisely

```yaml
# Nested stacks within same root: Use GetAtt
SubnetId: !GetAtt NetworkStack.Outputs.SubnetId

# Independent stacks: Use Exports/Imports
# Stack 1:
Outputs:
  VPCId:
    Value: !Ref VPC
    Export:
      Name: SharedVPC-VPCId

# Stack 2:
Resources:
  Instance:
    Properties:
      SubnetId: !ImportValue SharedVPC-SubnetId
```
