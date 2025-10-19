# CloudFormation Parameters

## Overview

This directory demonstrates how to use parameters in CloudFormation templates to make them dynamic and reusable. Parameters allow you to input custom values to your template each time you create or update a stack, eliminating the need to hardcode values and enabling the same template to be used across different environments, regions, or configurations.

Parameters make your templates flexible, portable, and maintainable by separating configuration values from the template logic.

## CloudFormation Concepts

### Parameters Section

The `Parameters` section allows you to declare values that can be passed to the template at stack creation or update time. Each parameter includes:
- **Type**: Data type (String, Number, AWS-specific types)
- **Description**: Help text shown in the console
- **Default**: Optional default value
- **AllowedValues**: Optional list of permitted values
- **AllowedPattern**: Optional regex pattern for validation
- **ConstraintDescription**: Error message for validation failures

### Parameter Types

CloudFormation supports several parameter types:

#### Generic Types
- **String**: Any text value
- **Number**: Integer or floating-point number
- **List<Number>**: Array of numbers
- **CommaDelimitedList**: Comma-separated list of values

#### AWS-Specific Types
- **AWS::EC2::KeyPair::KeyName**: EC2 key pair name (validated)
- **AWS::EC2::SecurityGroup::Id**: Security group ID
- **AWS::EC2::Subnet::Id**: Subnet ID
- **AWS::EC2::VPC::Id**: VPC ID
- **AWS::EC2::AvailabilityZone::Name**: Availability zone name
- **AWS::EC2::Image::Id**: AMI ID

#### SSM Parameter Types
- **AWS::SSM::Parameter::Value<String>**: Value from SSM Parameter Store
- **AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>**: AMI ID from SSM

### Referencing Parameters

Use the `!Ref` intrinsic function to reference parameter values in your template:

```yaml
KeyName: !Ref MyKeyName
```

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Basic understanding of CloudFormation templates
- EC2 key pairs created in your AWS account
- (Optional) SSM parameters configured for SSM examples

## Project Structure

```
Parameters/
├── 01-cfn-ec2-ParameterType-AWS-KeyName.yml   # AWS-specific parameter type
├── 02-cfn-ec2-ParameterType-String.yml        # String parameter with constraints
├── 03-cfn-ec2-ParameterType-InstanceType.yml  # Multiple parameters
├── 04-cfn-ec2-ParameterType-SSM.yml           # SSM Parameter Store integration
└── README.md                                   # This file
```

## Usage

### Deploy with Parameters (Interactive)

```bash
# AWS CLI will prompt for parameter values
aws cloudformation create-stack \
  --stack-name my-parameterized-stack \
  --template-body file://01-cfn-ec2-ParameterType-AWS-KeyName.yml \
  --region us-east-2
```

### Deploy with Parameter Values

```bash
# Specify parameters directly
aws cloudformation create-stack \
  --stack-name my-parameterized-stack \
  --template-body file://02-cfn-ec2-ParameterType-String.yml \
  --parameters \
    ParameterKey=MyKeyName,ParameterValue=my-key \
    ParameterKey=MyAvailabilityZone,ParameterValue=us-east-2a \
  --region us-east-2
```

### Using Parameter Files

Create a parameters JSON file:

```json
[
  {
    "ParameterKey": "MyKeyName",
    "ParameterValue": "my-key"
  },
  {
    "ParameterKey": "MyInstanceType",
    "ParameterValue": "t2.small"
  },
  {
    "ParameterKey": "MyAvailabilityZone",
    "ParameterValue": "us-east-2b"
  }
]
```

Deploy with parameter file:

```bash
aws cloudformation create-stack \
  --stack-name my-stack \
  --template-body file://03-cfn-ec2-ParameterType-InstanceType.yml \
  --parameters file://parameters.json \
  --region us-east-2
```

## Template Examples

### Example 1: AWS-Specific Parameter Type (KeyPair)

```yaml
AWSTemplateFormatVersion: 2010-09-09
Description: EC2 Instance with KeyPair parameter.

Parameters:
  MyKeyName:
    Description: Select the Key Name to be used for the instance.
    Type: AWS::EC2::KeyPair::KeyName

Resources:
  DevEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-063d43db0594b521b
      InstanceType: t2.micro
      KeyName: !Ref MyKeyName
      SecurityGroups:
      - default
```

**Key Points:**
- `AWS::EC2::KeyPair::KeyName` type validates against existing key pairs
- Console provides dropdown of available key pairs
- No default value - user must select a key pair

### Example 2: String Parameter with Constraints

```yaml
Parameters:
  MyKeyName:
    Description: Select the Key Name to be used for the instance.
    Type: AWS::EC2::KeyPair::KeyName

  MyAvailabilityZone:
    Description: Select the AZ to be used for the instance.
    Type: String
    Default: us-east-2a
    AllowedValues:
    - us-east-2a
    - us-east-2b
    - us-east-2c

Resources:
  DevEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-063d43db0594b521b
      InstanceType: t2.micro
      KeyName: !Ref MyKeyName
      AvailabilityZone: !Ref MyAvailabilityZone
```

**Key Points:**
- `Default` provides a value if none is specified
- `AllowedValues` restricts input to specific options
- Console shows dropdown for AllowedValues

### Example 3: Multiple Parameter Types

```yaml
Parameters:
  MyKeyName:
    Description: Select the Key Name to be used for the instance.
    Type: AWS::EC2::KeyPair::KeyName

  MyAvailabilityZone:
    Description: Select the AZ to be used for the instance.
    Type: String
    Default: us-east-2a
    AllowedValues:
    - us-east-2a
    - us-east-2b
    - us-east-2c

  MyInstanceType:
    Description: Select the ec2 instance type from list
    Type: String
    Default: t2.micro
    AllowedValues:
    - t2.micro
    - t2.small

Resources:
  DevEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-063d43db0594b521b
      InstanceType: !Ref MyInstanceType
      KeyName: !Ref MyKeyName
      AvailabilityZone: !Ref MyAvailabilityZone
```

**Key Points:**
- Multiple parameters provide flexibility
- Each parameter can have different types and constraints
- All parameters referenced with `!Ref`

### Example 4: SSM Parameter Store Integration

```yaml
Parameters:
  MyKeyName:
    Description: Select the Key Name to be used for the instance.
    Type: AWS::EC2::KeyPair::KeyName

  MyAvailabilityZone:
    Description: Select the AZ to be used for the instance.
    Type: AWS::SSM::Parameter::Value<String>

  MyInstanceType:
    Description: Select the ec2 instance type from list
    Type: String
    Default: t2.micro
    AllowedValues:
    - t2.micro
    - t2.small

Resources:
  DevEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-063d43db0594b521b
      InstanceType: !Ref MyInstanceType
      KeyName: !Ref MyKeyName
      AvailabilityZone: !Ref MyAvailabilityZone
```

**Key Points:**
- `AWS::SSM::Parameter::Value<String>` fetches value from SSM Parameter Store
- User provides the SSM parameter name, CloudFormation retrieves the value
- Enables centralized parameter management
- Can be used for AMI IDs, configuration values, secrets, etc.

## Features

### 1. Input Validation
- Type checking ensures correct data types
- AllowedValues restricts to predefined options
- AllowedPattern validates against regex patterns
- AWS-specific types validate against actual AWS resources

### 2. Default Values
- Simplify stack creation with sensible defaults
- Users can override defaults when needed
- Reduce required inputs

### 3. AWS Resource Validation
- AWS-specific types validate in real-time
- Dropdown menus in console for easier selection
- Prevents typos and invalid references

### 4. SSM Integration
- Centralize parameter management
- Share values across multiple stacks
- Update values without modifying templates
- Support for versioning and encryption

### 5. Constraints and Validation
- Min/Max values for numbers
- Min/Max length for strings
- Pattern matching with regex
- Custom error messages

## Troubleshooting

### Common Issues

#### 1. Parameter Validation Errors

```
Error: Value not in AllowedValues
```

**Solution:**
- Check the parameter value matches one of the AllowedValues exactly
- Values are case-sensitive
- Remove leading/trailing whitespace

#### 2. Missing Required Parameters

```
Error: Parameters: [MyKeyName] must have values
```

**Solution:**
- Provide values for all parameters without defaults
- Use --parameters flag with CLI
- Or provide values in console during stack creation

#### 3. SSM Parameter Not Found

```
Error: SSM parameter /path/to/param does not exist
```

**Solution:**
- Verify SSM parameter exists in the same region
- Check IAM permissions for SSM access
- Ensure parameter name is correct (case-sensitive)

#### 4. Invalid Key Pair

```
Error: The key pair 'xxx' does not exist
```

**Solution:**
- Create the key pair before stack creation
- Use AWS::EC2::KeyPair::KeyName type for automatic validation
- Verify key pair exists in the correct region

#### 5. Type Mismatch

```
Error: Parameter validation failed
```

**Solution:**
- Ensure parameter value matches the declared type
- Numbers should be numeric (not quoted in JSON)
- Lists should be properly formatted

### Debug Parameters

```bash
# Describe stack parameters
aws cloudformation describe-stacks \
  --stack-name my-stack \
  --query 'Stacks[0].Parameters'

# Validate template
aws cloudformation validate-template \
  --template-body file://template.yml \
  --query 'Parameters'
```

## Best Practices

### 1. Use Descriptive Names
- Use clear, descriptive parameter names (e.g., `InstanceType` not `IT`)
- Follow consistent naming conventions (PascalCase recommended)
- Make purpose obvious from the name

### 2. Provide Good Descriptions
- Write clear, helpful descriptions
- Explain what the parameter controls
- Include example values or format guidance

### 3. Set Sensible Defaults
- Provide defaults for non-critical parameters
- Use most common values as defaults
- Consider security when setting defaults

### 4. Use Appropriate Types
- Use AWS-specific types for validation
- Prefer AWS::EC2::KeyPair::KeyName over String for key pairs
- Use Number type for numeric values

### 5. Constrain Input
- Use AllowedValues to limit options
- Use AllowedPattern for string format validation
- Use Min/Max for numeric ranges
- Provide ConstraintDescription for better error messages

### 6. Leverage SSM Parameter Store
- Use for values shared across stacks
- Store AMI IDs in SSM for easier updates
- Use for configuration values
- Consider AWS Secrets Manager for sensitive data

### 7. Parameter Organization
- Group related parameters logically
- Order parameters by importance
- Use Metadata section for better organization (see Metadata examples)

### 8. Avoid Hardcoding
- Use parameters instead of hardcoded values
- Make templates reusable across environments
- Consider using Mappings for environment-specific values

### 9. Security Considerations
- Use NoEcho: true for sensitive parameters
- Don't set defaults for security-sensitive values
- Consider AWS Secrets Manager for secrets
- Use SSM SecureString parameters when appropriate

### 10. Testing
- Test with various parameter combinations
- Validate parameter constraints work as expected
- Test default values
- Verify SSM parameter retrieval
