# CloudFormation Conditions

## Overview

This directory demonstrates how to use conditions in CloudFormation templates to control whether resources are created or how properties are configured based on input values. Conditions enable you to make templates more flexible by creating resources conditionally (e.g., only in production) or configuring properties differently based on parameters.

Conditions use intrinsic functions to evaluate expressions and return boolean values (true/false), which then determine template behavior during stack creation or update.

## CloudFormation Concepts

### Conditions Section

The `Conditions` section defines conditions using intrinsic functions that evaluate to true or false:

```yaml
Conditions:
  ConditionName: !Equals [value1, value2]
```

### Conditional Functions

CloudFormation provides several intrinsic functions for creating conditions:

#### Comparison Functions
- **!Equals**: Returns true if two values are equal
  ```yaml
  !Equals [!Ref EnvType, prod]
  ```

#### Logical Functions
- **!And**: Returns true if all conditions are true
  ```yaml
  !And [condition1, condition2, condition3]
  ```

- **!Or**: Returns true if any condition is true
  ```yaml
  !Or [condition1, condition2]
  ```

- **!Not**: Returns true if condition is false (negation)
  ```yaml
  !Not [condition]
  ```

#### Other Functions
- **!If**: Returns one value if condition is true, another if false
  ```yaml
  !If [condition, valueIfTrue, valueIfFalse]
  ```

### Using Conditions

Conditions can be used in two ways:

1. **Resource Level**: Control whether entire resources are created
   ```yaml
   Resources:
     MyResource:
       Type: AWS::EC2::EIP
       Condition: CreateProdResources
   ```

2. **Property Level**: Control property values using !If
   ```yaml
   Properties:
     InstanceType: !If [IsProd, t2.large, t2.micro]
   ```

### AWS::NoValue

The pseudo parameter `AWS::NoValue` removes a property when used with !If:

```yaml
SecurityGroups: !If [CreateSG, [!Ref MySG], !Ref "AWS::NoValue"]
```

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Understanding of CloudFormation Parameters and Mappings
- Basic knowledge of boolean logic

## Project Structure

```
Conditions/
├── 00-Base.yml                                          # Base template without conditions
├── 01-Conditions-IntrinsicFunction-Fn-Equals.yml      # !Equals function
├── 02-Conditions-IntrinsicFunction-Fn-If-AWS-NoValue.yml  # !If with AWS::NoValue
├── 03-Conditions-IntrinsicFunction-Fn-If.yml          # !If for property selection
├── 04-Conditions-IntrinsicFunction-Fn-Not.yml         # !Not function
├── 05-Conditions-IntrinsicFunction-Fn-Or.yml          # !Or function
├── 06-Conditions-IntrinsicFunction-Fn-And.yml         # !And function
└── README.md                                           # This file
```

## Usage

### Deploy for Development Environment

```bash
aws cloudformation create-stack \
  --stack-name dev-conditional-stack \
  --template-body file://01-Conditions-IntrinsicFunction-Fn-Equals.yml \
  --parameters ParameterKey=EnviromentName,ParameterValue=dev \
               ParameterKey=MyKeyName,ParameterValue=my-key \
  --region us-east-2
```

### Deploy for Production Environment

```bash
aws cloudformation create-stack \
  --stack-name prod-conditional-stack \
  --template-body file://01-Conditions-IntrinsicFunction-Fn-Equals.yml \
  --parameters ParameterKey=EnviromentName,ParameterValue=prod \
               ParameterKey=MyKeyName,ParameterValue=my-key \
  --region us-east-2
```

### Preview Conditional Changes

```bash
# Create a change set to preview what will be created
aws cloudformation create-change-set \
  --stack-name my-stack \
  --change-set-name preview-prod \
  --template-body file://03-Conditions-IntrinsicFunction-Fn-If.yml \
  --parameters ParameterKey=EnviromentName,ParameterValue=prod \
               ParameterKey=MyKeyName,ParameterValue=my-key

# View the change set
aws cloudformation describe-change-set \
  --change-set-name preview-prod \
  --stack-name my-stack
```

## Template Examples

### Example 1: Basic Condition with !Equals

```yaml
Parameters:
  EnviromentName:
    Description: Select the environment
    Type: String
    Default: dev
    AllowedValues:
    - dev
    - prod

Conditions:
  CreateEIPForProd: !Equals [ !Ref EnviromentName, prod ]

Resources:
  MyVMInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [MyRegionMap, !Ref "AWS::Region", HVM64]
      InstanceType: !FindInMap [MyEnvironmentMap, !Ref EnviromentName, InstanceType]
      KeyName: !Ref MyKeyName

  MyProdEIP:
    Type: AWS::EC2::EIP
    Condition: CreateEIPForProd
    Properties:
      InstanceId: !Ref MyVMInstance
```

**Key Points:**
- `CreateEIPForProd` evaluates to true only when environment is "prod"
- Elastic IP is created only in production
- Development environments don't incur EIP costs
- No changes to resources without conditions

**Behavior:**
- **dev**: Creates only EC2 instance (no EIP)
- **prod**: Creates EC2 instance AND Elastic IP

### Example 2: Conditional Property with !If and AWS::NoValue

```yaml
Conditions:
  CreateEIPForProd: !Equals [ !Ref EnviromentName, prod ]
  CreateDevSecurityGroup: !Equals [ !Ref EnviromentName, dev ]

Resources:
  MyVMInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [MyRegionMap, !Ref "AWS::Region", HVM64]
      InstanceType: !FindInMap [MyEnvironmentMap, !Ref EnviromentName, InstanceType]
      KeyName: !Ref MyKeyName
      SecurityGroups: !If [CreateDevSecurityGroup, [!Ref DevEnvSecurityGroups], !Ref "AWS::NoValue"]

  DevEnvSecurityGroups:
    Type: AWS::EC2::SecurityGroup
    Condition: CreateDevSecurityGroup
    Properties:
      GroupDescription: My new ssh security group
      SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: '22'
        ToPort: '22'
        CidrIp: 0.0.0.0/0
```

**Key Points:**
- `AWS::NoValue` removes the SecurityGroups property entirely when condition is false
- Security group only created for dev environment
- In prod, SecurityGroups property is omitted (uses default)

**Behavior:**
- **dev**: Creates custom security group and associates it with instance
- **prod**: Omits SecurityGroups property entirely

### Example 3: Multiple Values with !If

```yaml
Conditions:
  CreateEIPForProd: !Equals [ !Ref EnviromentName, prod ]
  CreateDevSecurityGroup: !Equals [ !Ref EnviromentName, dev ]
  CreateProdSecurityGroup: !Equals [ !Ref EnvironmentName, prod ]

Resources:
  MyVMInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [MyRegionMap, !Ref "AWS::Region", HVM64]
      InstanceType: !FindInMap [MyEnvironmentMap, !Ref EnviromentName, InstanceType]
      KeyName: !Ref MyKeyName
      SecurityGroups: !If [CreateDevSecurityGroup, [!Ref DevEnvSecurityGroups], [!Ref ProdEnvSecurityGroups]]

  DevEnvSecurityGroups:
    Type: AWS::EC2::SecurityGroup
    Condition: CreateDevSecurityGroup
    Properties:
      GroupDescription: DevSG
      SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: '22'
        ToPort: '22'
        CidrIp: 0.0.0.0/0

  ProdEnvSecurityGroups:
    Type: AWS::EC2::SecurityGroup
    Condition: CreateProdSecurityGroup
    Properties:
      GroupDescription: ProdSG
      SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: '22'
        ToPort: '22'
        CidrIp: 0.0.0.0/0
```

**Key Points:**
- Different security groups for dev vs prod
- `!If` selects between two specific values
- Each security group is conditionally created

### Example 4: Negation with !Not

```yaml
Conditions:
  CreateEIPForProd: !Equals [ !Ref EnviromentName, prod ]
  CreateProdSecurityGroup: !Equals [ !Ref EnvironmentName, prod ]
  CreateDevSecurityGroup: !Not [ { Condition: CreateProdSecurityGroup } ]

Resources:
  MyVMInstance:
    Type: AWS::EC2::Instance
    Properties:
      SecurityGroups: !If [CreateDevSecurityGroup, [!Ref DevEnvSecurityGroups], [!Ref ProdEnvSecurityGroups]]
```

**Key Points:**
- `!Not` inverts a condition
- Reference other conditions with `{ Condition: ConditionName }` syntax
- `CreateDevSecurityGroup` is true when `CreateProdSecurityGroup` is false

**Logic:**
- If env = prod: CreateProdSecurityGroup = true, CreateDevSecurityGroup = false
- If env = dev: CreateProdSecurityGroup = false, CreateDevSecurityGroup = true

### Example 5: Multiple Conditions with !Or

```yaml
Conditions:
  CreateEIPForProd: !Equals [ !Ref EnviromentName, prod ]
  CreateProdSecurityGroup: !Equals [ !Ref EnvironmentName, prod ]
  CreateDevSecurityGroup: !Not [ { Condition: CreateProdSecurityGroup } ]
  IfRegionUseKeyName: !Or
    - !Equals [ !Ref "AWS::Region", us-east-2 ]
    - !Equals [ !Ref "AWS::Region", us-west-1 ]

Resources:
  MyVMInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [MyRegionMap, !Ref "AWS::Region", HVM64]
      InstanceType: !FindInMap [MyEnvironmentMap, !Ref EnviromentName, InstanceType]
      KeyName: !If [IfRegionUseKeyName, cfn-key-1, cfn-key-2]
      SecurityGroups: !If [CreateDevSecurityGroup, [!Ref DevEnvSecurityGroups], [!Ref ProdEnvSecurityGroups]]
```

**Key Points:**
- `!Or` returns true if ANY condition is true
- Useful for region-specific logic
- Different key pairs for different regions

**Logic:**
- If region is us-east-2 OR us-west-1: use cfn-key-1
- Otherwise: use cfn-key-2

### Example 6: Complex Logic with !And

```yaml
Conditions:
  CreateEIPForProd: !Equals [ !Ref EnviromentName, prod ]
  CreateProdSecurityGroup: !Equals [ !Ref EnvironmentName, prod ]
  CreateDevSecurityGroup: !Not [ { Condition: CreateProdSecurityGroup } ]
  IfRegionUseKeyName: !And
    - !Or
      - !Equals [ !Ref "AWS::Region", us-east-2 ]
      - !Equals [ !Ref "AWS::Region", us-west-1 ]
    - !Equals [ !Ref EnvironmentName, dev ]

Resources:
  MyVMInstance:
    Type: AWS::EC2::Instance
    Properties:
      KeyName: !If [IfRegionUseKeyName, cfn-key-1, cfn-key-2]
```

**Key Points:**
- `!And` returns true only if ALL conditions are true
- Can nest !Or inside !And and vice versa
- Enables complex conditional logic

**Logic:**
- Use cfn-key-1 if: (region is us-east-2 OR us-west-1) AND (environment is dev)
- Otherwise: use cfn-key-2

## Features

### 1. Conditional Resource Creation
- Create resources only when needed
- Reduce costs in non-production environments
- Environment-specific infrastructure

### 2. Property-Level Conditions
- Configure resources differently per environment
- Use !If for property values
- Use AWS::NoValue to omit properties

### 3. Logical Operators
- Combine multiple conditions with !And
- Create alternatives with !Or
- Invert logic with !Not

### 4. Cost Optimization
- Don't create expensive resources in dev/test
- Scale down instance sizes automatically
- Conditional backups, monitoring, etc.

### 5. Multi-Environment Templates
- Single template for all environments
- Reduces template sprawl
- Easier maintenance and consistency

## Troubleshooting

### Common Issues

#### 1. Condition Not Evaluating

```
Error: Condition evaluation failed
```

**Solution:**
- Check condition syntax
- Verify parameter values match exactly (case-sensitive)
- Use !Ref to reference parameters, not direct values
- Test with change sets to preview evaluation

#### 2. AWS::NoValue Not Working

```
Error: Property validation failed
```

**Solution:**
- AWS::NoValue must be used with !If
- Use !Ref "AWS::NoValue" with quotes
- Can only remove optional properties
- Cannot use for required properties

#### 3. Circular Dependencies

```
Error: Circular dependency between resources
```

**Solution:**
- Condition references can create circular dependencies
- Review resource dependencies
- May need to restructure conditions
- Use DependsOn sparingly

#### 4. Referencing Conditional Resources

```
Error: Referenced resource does not exist
```

**Solution:**
- Cannot reference a resource that might not exist
- Wrap references in !If conditions
- Or use AWS::NoValue to omit the reference
- Ensure referenced resources will exist when needed

#### 5. Complex Condition Errors

```
Error: Invalid template property or properties
```

**Solution:**
- Simplify complex nested conditions
- Break into multiple simpler conditions
- Verify condition reference syntax: `{ Condition: ConditionName }`
- Check indentation in YAML

### Testing Conditions

```bash
# Create change set to preview conditional behavior
aws cloudformation create-change-set \
  --stack-name test-conditions \
  --change-set-name test-dev \
  --template-body file://template.yml \
  --parameters ParameterKey=EnviromentName,ParameterValue=dev

# View what will be created
aws cloudformation describe-change-set \
  --change-set-name test-dev \
  --stack-name test-conditions \
  --query 'Changes[*].ResourceChange'

# Test with different parameter
aws cloudformation create-change-set \
  --stack-name test-conditions \
  --change-set-name test-prod \
  --template-body file://template.yml \
  --parameters ParameterKey=EnviromentName,ParameterValue=prod
```

## Best Practices

### 1. Keep Conditions Simple
- Create small, focused conditions
- Use descriptive names
- Break complex logic into multiple conditions
- Document condition purpose

### 2. Name Conditions Clearly
- Use verb phrases: CreateEIPForProd, IsProdEnvironment
- Make the purpose obvious
- Avoid abbreviations
- Consistent naming conventions

### 3. Use Appropriate Functions
- !Equals for simple comparisons
- !And when all must be true
- !Or when any can be true
- !Not to invert logic

### 4. Leverage AWS::NoValue
- Remove optional properties cleanly
- Better than empty strings or null
- Makes templates cleaner
- Proper way to omit properties

### 5. Test All Branches
- Test with each parameter combination
- Verify resources created/omitted as expected
- Use change sets for validation
- Document expected behavior

### 6. Document Conditions
- Add comments explaining logic
- Document parameter combinations
- Explain business rules
- Include examples

### 7. Avoid Overuse
- Don't create conditions for everything
- Consider separate templates for very different environments
- Balance flexibility with complexity
- Use parameters and mappings when appropriate

### 8. Consider Maintenance
- Complex conditions are hard to maintain
- Team members must understand logic
- Future you will thank present you
- Simplicity wins

### 9. Cost Awareness
- Use conditions to optimize costs
- Don't create expensive resources in dev
- Conditional backups and monitoring
- Scale appropriately per environment

### 10. Security Implications
- Ensure security resources always created when needed
- Don't accidentally skip security groups
- Test security configurations
- Validate compliance requirements
