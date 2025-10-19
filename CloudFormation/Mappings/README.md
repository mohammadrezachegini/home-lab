# CloudFormation Mappings

## Overview

This directory demonstrates how to use mappings in CloudFormation templates to define lookup tables of key-value pairs. Mappings enable you to create conditional values based on inputs like AWS regions, environment names, or other keys, making your templates more dynamic and maintainable.

Mappings are particularly useful for handling region-specific values (like AMI IDs), environment-specific configurations (dev vs prod instance sizes), or any scenario where you need to map one set of values to another.

## CloudFormation Concepts

### Mappings Section

The `Mappings` section contains one or more mappings that match a key to a corresponding set of named values. The structure is:

```yaml
Mappings:
  MappingName:
    Key1:
      Name1: Value1
      Name2: Value2
    Key2:
      Name1: Value3
      Name2: Value4
```

### FindInMap Function

The `!FindInMap` intrinsic function retrieves values from mappings. Syntax:

```yaml
!FindInMap [ MapName, TopLevelKey, SecondLevelKey ]
```

Or in long form:

```yaml
!FindInMap
  - MapName
  - TopLevelKey
  - SecondLevelKey
```

### Common Use Cases

1. **Region-Specific AMIs**: Different AMI IDs for each region
2. **Environment Configurations**: Different instance sizes for dev/prod
3. **Network CIDR Blocks**: Different IP ranges per environment
4. **Tag Values**: Environment-specific tagging schemes
5. **Feature Flags**: Enable/disable features by environment

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Basic understanding of CloudFormation templates and parameters
- Valid AMI IDs for your target regions

## Project Structure

```
Mappings/
├── 00-Base.yml                                    # Basic region mapping
├── 01-cfn-ec2-Mapping-AMI.yml                    # Single mapping for AMIs (empty file)
├── 02-cfn-ec2-Mapping-AMI-and-Environment.yml    # Multiple mappings
└── README.md                                      # This file
```

## Usage

### Deploy with Mappings

```bash
# Deploy stack with region mapping
aws cloudformation create-stack \
  --stack-name my-mapped-stack \
  --template-body file://00-Base.yml \
  --parameters ParameterKey=MyKeyName,ParameterValue=my-key \
  --region us-east-2

# Deploy to different region (uses different AMI from mapping)
aws cloudformation create-stack \
  --stack-name my-mapped-stack-west \
  --template-body file://00-Base.yml \
  --parameters ParameterKey=MyKeyName,ParameterValue=my-key \
  --region us-west-1
```

### Deploy with Environment Selection

```bash
# Deploy development environment
aws cloudformation create-stack \
  --stack-name dev-env-stack \
  --template-body file://02-cfn-ec2-Mapping-AMI-and-Environment.yml \
  --parameters \
    ParameterKey=MyKeyName,ParameterValue=my-key \
    ParameterKey=EnviromentName,ParameterValue=dev \
  --region us-east-2

# Deploy production environment (uses different instance type)
aws cloudformation create-stack \
  --stack-name prod-env-stack \
  --template-body file://02-cfn-ec2-Mapping-AMI-and-Environment.yml \
  --parameters \
    ParameterKey=MyKeyName,ParameterValue=my-key \
    ParameterKey=EnviromentName,ParameterValue=prod \
  --region us-east-2
```

## Template Examples

### Example 1: Basic Region Mapping

```yaml
AWSTemplateFormatVersion: 2010-09-09

Parameters:
  MyKeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: Select the keypair

Mappings:
  MyRegionMap:
    us-east-2:
      HVM64: ami-013ce69c368262d19
    us-west-1:
      HVM64: ami-06f932bfd69e55cc3

Resources:
  MyVMInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap
        - MyRegionMap
        - !Ref AWS::Region
        - HVM64
      InstanceType: t2.micro
      KeyName: !Ref MyKeyName
```

**Key Points:**
- `MyRegionMap` contains AMI IDs for different regions
- `AWS::Region` is a pseudo parameter (automatically provided by CloudFormation)
- `!FindInMap` looks up the AMI ID based on the current region
- Same template works in multiple regions without modification

**How it works:**
1. CloudFormation determines the current region (e.g., us-east-2)
2. `!FindInMap` looks up `MyRegionMap[us-east-2][HVM64]`
3. Returns `ami-013ce69c368262d19`
4. EC2 instance is created with the correct regional AMI

### Example 2: Multiple Mappings (Region + Environment)

```yaml
AWSTemplateFormatVersion: 2010-09-09

Parameters:
  MyKeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: Select the keypair
  EnviromentName:
    Description: Select the environment
    Type: String
    Default: dev
    AllowedValues:
    - dev
    - prod

Mappings:
  MyRegionMap:
    us-east-2:
      HVM64: ami-013ce69c368262d19
    us-west-1:
      HVM64: ami-06f932bfd69e55cc3

  MyEnvironmentMap:
    dev:
      InstanceType: t2.micro
    prod:
      InstanceType: t2.small

Resources:
  MyVMInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap
        - MyRegionMap
        - !Ref AWS::Region
        - HVM64
      InstanceType: !FindInMap
        - MyEnvironmentMap
        - !Ref EnviromentName
        - InstanceType
      KeyName: !Ref MyKeyName
```

**Key Points:**
- Two separate mappings: one for AMIs, one for environment configs
- `MyRegionMap` handles region-specific AMI IDs
- `MyEnvironmentMap` handles environment-specific instance types
- Parameters combined with mappings for maximum flexibility

**Example Scenarios:**

| Region    | Environment | AMI ID              | Instance Type |
|-----------|-------------|---------------------|---------------|
| us-east-2 | dev         | ami-013ce69c368262d19 | t2.micro      |
| us-east-2 | prod        | ami-013ce69c368262d19 | t2.small      |
| us-west-1 | dev         | ami-06f932bfd69e55cc3 | t2.micro      |
| us-west-1 | prod        | ami-06f932bfd69e55cc3 | t2.small      |

### Example 3: Extended Environment Mapping

```yaml
Mappings:
  MyEnvironmentMap:
    dev:
      InstanceType: t2.micro
      VolumeSize: 8
      EnableBackups: false
      MaxInstances: 2
    staging:
      InstanceType: t2.small
      VolumeSize: 20
      EnableBackups: true
      MaxInstances: 3
    prod:
      InstanceType: t2.medium
      VolumeSize: 50
      EnableBackups: true
      MaxInstances: 10

Resources:
  MyVMInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !FindInMap [MyEnvironmentMap, !Ref EnviromentName, InstanceType]
      BlockDeviceMappings:
        - DeviceName: /dev/sda1
          Ebs:
            VolumeSize: !FindInMap [MyEnvironmentMap, !Ref EnviromentName, VolumeSize]
```

**Key Points:**
- Single mapping with multiple attributes per environment
- Centralized configuration management
- Easy to add new environments or attributes

## Features

### 1. Region Portability
- Same template works across multiple regions
- No hardcoded region-specific values
- Automatically selects correct values based on deployment region

### 2. Environment-Specific Configurations
- Different settings for dev, staging, prod
- Centralized configuration management
- Easy to understand and maintain

### 3. Reduced Complexity
- Simpler than complex conditions
- Cleaner than multiple parameters
- Better organization of related values

### 4. Type Safety
- Values are defined in template
- No runtime input required for mapped values
- Reduced chance of typos or invalid values

### 5. Maintainability
- Single place to update AMI IDs or configurations
- Easy to add new regions or environments
- Clear structure for team collaboration

## Troubleshooting

### Common Issues

#### 1. FindInMap Returns Nothing

```
Error: Template error: instance of Fn::FindInMap references undefined map
```

**Solution:**
- Verify mapping name is spelled correctly (case-sensitive)
- Ensure mapping exists in Mappings section
- Check for YAML indentation issues

#### 2. Key Not Found in Mapping

```
Error: Template error: instance of Fn::FindInMap references undefined key
```

**Solution:**
- Verify the key exists in the mapping
- Check if pseudo parameter value exists (e.g., AWS::Region)
- Ensure parameter value matches a mapping key exactly

#### 3. Wrong AMI for Region

```
Error: The image id '[ami-xxxxx]' does not exist
```

**Solution:**
- Update mapping with correct AMI IDs for each region
- Verify AMI IDs are current (AMIs can be deprecated)
- Ensure AMI is available in the target region

#### 4. Invalid Pseudo Parameter

```
Error: Unresolved resource dependencies [AWS::Region]
```

**Solution:**
- Use `!Ref "AWS::Region"` with quotes in some contexts
- Or use without quotes: `!Ref AWS::Region`
- Verify correct syntax for your YAML parser

#### 5. Mapping Depth Issues

```
Error: Mappings must have exactly 2 levels
```

**Solution:**
- CloudFormation mappings support only 2 levels
- Restructure data if you need more levels
- Consider using nested stacks or external data sources

### Testing Mappings

```bash
# Validate template
aws cloudformation validate-template \
  --template-body file://02-cfn-ec2-Mapping-AMI-and-Environment.yml

# Test in multiple regions
for region in us-east-2 us-west-1; do
  echo "Testing in $region"
  aws cloudformation validate-template \
    --template-body file://00-Base.yml \
    --region $region
done
```

## Best Practices

### 1. Use Mappings for Known Values
- AMI IDs that vary by region
- Instance types that vary by environment
- CIDR blocks that vary by VPC
- Any predefined lookup table

### 2. Keep AMI IDs Updated
- Regularly update AMI IDs in mappings
- Use AWS Systems Manager Parameter Store for latest AMIs
- Document AMI selection criteria
- Consider automated AMI ID updates

### 3. Organize Mappings Logically
- Group related values together
- Use descriptive mapping names
- Order keys alphabetically or by importance
- Add comments for complex mappings

### 4. Combine with Parameters
- Use parameters for user input
- Use mappings for predefined values
- Combine both for maximum flexibility
- Parameters select which mapping values to use

### 5. Document Mapping Keys
- Comment the purpose of each mapping
- Document expected keys
- Explain the second-level key structure
- Include example values

### 6. Validate All Branches
- Test each environment setting
- Verify mappings for all supported regions
- Ensure all combinations work correctly
- Use change sets to preview changes

### 7. Consider Alternatives
- Parameters for simple choices
- SSM Parameter Store for dynamic values
- Conditions for boolean logic
- Nested stacks for complex scenarios

### 8. Limit Mapping Size
- Don't create overly large mappings
- Split into multiple mappings if needed
- Consider external configuration for very large datasets
- Keep mappings maintainable

### 9. Use Pseudo Parameters
- `AWS::Region` for region-specific values
- `AWS::StackName` for naming resources
- `AWS::AccountId` for account-specific configs
- See AWS documentation for full list

### 10. Version Control
- Track mapping changes in version control
- Document why values were changed
- Use pull requests for mapping updates
- Maintain historical context
