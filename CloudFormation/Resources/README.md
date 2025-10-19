# CloudFormation Resources

## Overview

This directory demonstrates how to define and manage AWS resources using CloudFormation templates. Resources are the essential building blocks of CloudFormation templates - they represent the AWS components you want to create and configure, such as EC2 instances, security groups, and Elastic IPs.

The Resources section is the only mandatory section in a CloudFormation template and contains declarations of AWS resources with their properties and configurations.

## CloudFormation Concepts

### Resources Section

The `Resources` section is the heart of every CloudFormation template. Each resource is defined with:
- **Logical ID**: A unique identifier within the template
- **Type**: The AWS resource type (e.g., AWS::EC2::Instance)
- **Properties**: Configuration settings specific to the resource type

### Resource Dependencies

CloudFormation automatically determines the order in which to create resources based on references between them. When you use the `!Ref` intrinsic function to reference one resource from another, CloudFormation creates an implicit dependency.

### Resource Types

AWS supports hundreds of resource types across various services. Common types include:
- AWS::EC2::Instance (Virtual machines)
- AWS::EC2::SecurityGroup (Firewall rules)
- AWS::EC2::EIP (Elastic IP addresses)
- AWS::S3::Bucket (Object storage)
- AWS::RDS::DBInstance (Databases)

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Basic understanding of YAML syntax
- Familiarity with EC2 and VPC concepts
- An existing EC2 key pair in your AWS account (referenced as `cfn-key-1` in examples)

## Project Structure

```
Resources/
├── 01-cfn-ec2-instance.yml                    # Basic EC2 instance
├── 02-cfn-ec2-add-new-security-group.yml     # EC2 with security group
├── 03-cfn-ec2-add-new-rule.yml               # Multiple security group rules
├── 04-cfn-ec2-add-elasticIP.yml              # EC2 with Elastic IP
├── 05-cfn-ec2-case-sensitive-test.yml        # Case sensitivity demonstration
└── README.md                                  # This file
```

## Usage

### Deploy a Stack

```bash
# Deploy basic EC2 instance
aws cloudformation create-stack \
  --stack-name my-ec2-stack \
  --template-body file://01-cfn-ec2-instance.yml \
  --region us-east-2

# Deploy EC2 with security group
aws cloudformation create-stack \
  --stack-name my-ec2-sg-stack \
  --template-body file://02-cfn-ec2-add-new-security-group.yml \
  --region us-east-2
```

### Update a Stack

```bash
aws cloudformation update-stack \
  --stack-name my-ec2-stack \
  --template-body file://03-cfn-ec2-add-new-rule.yml \
  --region us-east-2
```

### Delete a Stack

```bash
aws cloudformation delete-stack \
  --stack-name my-ec2-stack \
  --region us-east-2
```

### Monitor Stack Events

```bash
aws cloudformation describe-stack-events \
  --stack-name my-ec2-stack \
  --region us-east-2
```

## Template Examples

### Example 1: Basic EC2 Instance

```yaml
AWSTemplateFormatVersion: 2010-09-09
Description: Basic EC2 Instance.

Resources:
  DevEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-063d43db0594b521b
      InstanceType: t2.micro
      KeyName: cfn-key-1
      SecurityGroups:
      - default
```

**Key Points:**
- `DevEC2Instance` is the logical ID
- `Type: AWS::EC2::Instance` specifies this is an EC2 instance
- `ImageId` specifies the AMI (Amazon Machine Image)
- `SecurityGroups` references the default security group

### Example 2: EC2 with Custom Security Group

```yaml
Resources:
  DevEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-063d43db0594b521b
      InstanceType: t2.micro
      KeyName: cfn-key-1
      SecurityGroups:
      - default
      - !Ref SSHSecurityGroup

  SSHSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: My new ssh security group
      SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: '22'
        ToPort: '22'
        CidrIp: 0.0.0.0/0
```

**Key Points:**
- `!Ref SSHSecurityGroup` creates a reference to the security group
- CloudFormation creates the security group before the EC2 instance
- The security group allows SSH access from anywhere (0.0.0.0/0)

### Example 3: Multiple Security Group Rules

```yaml
SSHSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: My new ssh security group
    SecurityGroupIngress:
    - IpProtocol: tcp
      FromPort: '22'
      ToPort: '22'
      CidrIp: 0.0.0.0/0
    - IpProtocol: tcp
      FromPort: '8080'
      ToPort: '8080'
      CidrIp: 0.0.0.0/0
```

**Key Points:**
- Multiple ingress rules in a single security group
- Allows SSH (22) and HTTP alternate port (8080)

### Example 4: EC2 with Elastic IP

```yaml
Resources:
  DevEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-063d43db0594b521b
      InstanceType: t2.micro
      KeyName: cfn-key-1
      SecurityGroups:
      - default
      - !Ref SSHSecurityGroup

  MyElasticIP:
    Type: AWS::EC2::EIP
    Properties:
      InstanceId: !Ref DevEC2Instance
```

**Key Points:**
- Elastic IP provides a static public IP address
- The EIP is automatically associated with the instance
- The `!Ref DevEC2Instance` creates a dependency

## Features

### 1. Resource Declaration
- Define AWS resources with their types and properties
- Use logical IDs to reference resources within templates
- CloudFormation manages the entire lifecycle

### 2. Implicit Dependencies
- Use `!Ref` to create references between resources
- CloudFormation automatically determines creation order
- No need to manually specify dependencies in most cases

### 3. Resource Properties
- Each resource type has specific properties
- Properties can be hardcoded or dynamically referenced
- Required vs optional properties vary by resource type

### 4. Security Groups
- Control inbound and outbound traffic
- Define rules for specific protocols and ports
- Can be referenced by EC2 instances and other resources

### 5. Elastic IPs
- Persistent public IP addresses
- Automatically associate with EC2 instances
- Survive instance stops and starts

## Troubleshooting

### Common Issues

#### 1. Stack Creation Fails

```
Error: Resource creation cancelled
```

**Solution:**
- Check CloudFormation events for specific error messages
- Verify AMI ID is valid in your region
- Ensure key pair exists before creating stack
- Check IAM permissions for resource creation

#### 2. Security Group Creation Error

```
Error: AWS::EC2::SecurityGroup should be AWS::EC2::SecurityGroup
```

**Solution:**
- Resource type names are case-sensitive
- Verify exact spelling: `AWS::EC2::SecurityGroup` (not SecurityGroups)
- See template 05 for case sensitivity examples

#### 3. Invalid AMI ID

```
Error: The image id '[ami-xxxxx]' does not exist
```

**Solution:**
- AMI IDs are region-specific
- Use AWS console or CLI to find valid AMIs in your region
- Update the ImageId property with a valid AMI

#### 4. Key Pair Not Found

```
Error: The key pair 'cfn-key-1' does not exist
```

**Solution:**
- Create the key pair before deploying the stack
- Or update the KeyName property to match an existing key pair

#### 5. Elastic IP Association Fails

```
Error: You do not have enough quota to allocate addresses
```

**Solution:**
- Check your Elastic IP quota in the AWS console
- Release unused Elastic IPs
- Request a quota increase if needed

### Validation

```bash
# Validate template syntax
aws cloudformation validate-template \
  --template-body file://01-cfn-ec2-instance.yml

# Check stack status
aws cloudformation describe-stacks \
  --stack-name my-ec2-stack \
  --query 'Stacks[0].StackStatus'
```

## Best Practices

### 1. Resource Naming
- Use descriptive logical IDs (e.g., `DevEC2Instance` not `EC2`)
- Follow consistent naming conventions
- Logical IDs must be alphanumeric

### 2. Case Sensitivity
- Resource types are case-sensitive
- Property names are case-sensitive
- Use exact casing from AWS documentation

### 3. Security
- Avoid opening security groups to 0.0.0.0/0 in production
- Use specific CIDR blocks for SSH access
- Implement least privilege access

### 4. Dependencies
- Let CloudFormation manage implicit dependencies via `!Ref`
- Use `DependsOn` only when implicit dependencies aren't sufficient
- Understand resource creation order

### 5. AMI Management
- Don't hardcode AMI IDs - they're region-specific
- Consider using Mappings or Parameters for AMI IDs
- Use AWS Systems Manager Parameter Store for latest AMIs

### 6. Resource Limits
- Be aware of AWS service quotas
- Request limit increases before large deployments
- Monitor quota usage

### 7. Testing
- Validate templates before deployment
- Test in development environment first
- Use change sets to preview updates

### 8. Documentation
- Add meaningful descriptions to templates
- Comment complex resource configurations
- Document any manual steps required
