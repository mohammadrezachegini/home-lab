# CloudFormation Outputs

## Overview

This directory demonstrates how to use the Outputs section in CloudFormation templates to declare values that can be viewed in the CloudFormation console, retrieved via CLI/API, or imported by other stacks. Outputs are essential for exposing information about your stack's resources, enabling cross-stack references, and providing important details to users or automation systems.

Outputs enable you to build modular, interconnected infrastructure by allowing one stack to export values that other stacks can import and use.

## CloudFormation Concepts

### Outputs Section

The `Outputs` section declares values to be returned when you view your stack's properties:

```yaml
Outputs:
  OutputName:
    Description: Description of the output
    Value: !Ref ResourceName
    Export:
      Name: ExportName
    Condition: OptionalCondition
```

### Output Components

- **Description**: Human-readable description of the output
- **Value**: The actual value to output (required)
- **Export**: (Optional) Makes the output available for cross-stack references
- **Condition**: (Optional) Controls whether the output is created

### Cross-Stack References

Export outputs from one stack and import them in another:

**Stack A (Exporting):**
```yaml
Outputs:
  SecurityGroupId:
    Value: !Ref MySecurityGroup
    Export:
      Name: SharedSecurityGroup
```

**Stack B (Importing):**
```yaml
Resources:
  MyInstance:
    Properties:
      SecurityGroups:
        - !ImportValue SharedSecurityGroup
```

### Common Intrinsic Functions with Outputs

- **!Ref**: Get resource ID or parameter value
- **!GetAtt**: Get resource attributes
- **!Sub**: Substitute variables in strings
- **!Join**: Concatenate strings
- **!ImportValue**: Import exported values from other stacks

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Understanding of CloudFormation basics
- Multiple stacks for cross-stack reference examples

## Project Structure

```
Outputs/
├── 00-Base.yml                                          # Base template without outputs
├── 01-cfn-ec2-Outputs-InstanceId.yml                   # Basic output with !Ref
├── 02-cfn-ec2-Outputs-Intrinsic-Fn-GetAtt.yml         # Using !GetAtt for attributes
├── 03-cfn-ec2-Outputs-Export-Intrinsic-Fn-Sub.yml     # Exports with !Sub
├── 04-cfn-ec2-Outputs-Cross-Reference-Fn-ImportValue.yml  # Importing from other stacks
├── 05-cfn-ec2-Outputs-Conditions.yml                   # Conditional outputs
├── 06-cfn-ec2-Outputs-Export-Intrinsic-Fn-Join.yml    # Exports with !Join
└── README.md                                            # This file
```

## Usage

### View Stack Outputs

```bash
# View outputs in CLI
aws cloudformation describe-stacks \
  --stack-name my-stack \
  --query 'Stacks[0].Outputs'

# View specific output value
aws cloudformation describe-stacks \
  --stack-name my-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`InstanceId`].OutputValue' \
  --output text
```

### List All Exports

```bash
# List all exported outputs in a region
aws cloudformation list-exports

# List specific export
aws cloudformation list-exports \
  --query 'Exports[?Name==`MyDevSSHGlobalSG`]'
```

### Use in Scripts

```bash
# Get instance ID from outputs
INSTANCE_ID=$(aws cloudformation describe-stacks \
  --stack-name my-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`MyInstanceId`].OutputValue' \
  --output text)

echo "Instance ID: $INSTANCE_ID"

# SSH using output values
INSTANCE_DNS=$(aws cloudformation describe-stacks \
  --stack-name my-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`MyDNSName`].OutputValue' \
  --output text)

ssh -i my-key.pem ec2-user@$INSTANCE_DNS
```

## Template Examples

### Example 1: Basic Output with !Ref

```yaml
Resources:
  MyVMInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [MyRegionMap, !Ref 'AWS::Region', HVM64]
      InstanceType: !FindInMap [MyEnvironmentMap, !Ref MyEnvironmentName, instanceType]
      KeyName: !Ref MyKeyName

Outputs:
  MyInstanceId:
    Description: My instance id
    Value: !Ref MyVMInstance
```

**Key Points:**
- `!Ref MyVMInstance` returns the instance ID
- Simple and straightforward output
- No export - only visible to this stack
- Use when you just need to view values

**Output Example:**
```json
{
  "OutputKey": "MyInstanceId",
  "OutputValue": "i-0123456789abcdef0",
  "Description": "My instance id"
}
```

### Example 2: Using !GetAtt for Resource Attributes

```yaml
Outputs:
  MyInstanceId:
    Description: My instance id
    Value: !Ref MyVMInstance

  MyDNSName:
    Description: My Public DNS Name
    Value: !GetAtt MyVMInstance.PublicDnsName

  MyInstanceAvailabilityZone:
    Description: My Instance Availability Zone
    Value: !GetAtt MyVMInstance.AvailabilityZone
```

**Key Points:**
- `!GetAtt` retrieves specific resource attributes
- Different resources have different available attributes
- More informative than just resource IDs
- Common attributes: PublicDnsName, PublicIp, AvailabilityZone

**Output Example:**
```json
[
  {
    "OutputKey": "MyInstanceId",
    "OutputValue": "i-0123456789abcdef0"
  },
  {
    "OutputKey": "MyDNSName",
    "OutputValue": "ec2-18-222-123-45.us-east-2.compute.amazonaws.com"
  },
  {
    "OutputKey": "MyInstanceAvailabilityZone",
    "OutputValue": "us-east-2a"
  }
]
```

### Example 3: Exports with !Sub (Substitution)

```yaml
Outputs:
  MyInstanceId:
    Description: My instance id
    Value: !Ref MyVMInstance

  MyDNSName:
    Description: My Public DNS Name
    Value: !GetAtt MyVMInstance.PublicDnsName

  MyInstanceAvailabilityZone:
    Description: My Instance Availability Zone
    Value: !GetAtt MyVMInstance.AvailabilityZone
    Export:
      Name: !Sub "${AWS::StackName}-InstanceAz"

  MyDevGlobalSecurityGroup:
    Description: My Dev SG
    Value: !Ref MyDevGlobalSecurityGroup
    Export:
      Name: MyDevSSHGlobalSG
```

**Key Points:**
- `Export` makes outputs available for cross-stack references
- `!Sub` enables variable substitution
- `${AWS::StackName}` is a pseudo parameter
- Export names must be unique in a region

**Export Examples:**
- Stack name: "dev-stack" → Export name: "dev-stack-InstanceAz"
- Fixed export name: "MyDevSSHGlobalSG"

### Example 4: Cross-Stack References with !ImportValue

```yaml
# This template imports values from another stack
Resources:
  MyVMInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [MyRegionMap, !Ref 'AWS::Region', HVM64]
      InstanceType: !FindInMap [MyEnvironmentMap, !Ref MyEnvironmentName, instanceType]
      KeyName: !Ref MyKeyName
      SecurityGroups:
      - !ImportValue MyDevSSHGlobalSG
      AvailabilityZone: !ImportValue stack1-InstanceAz
```

**Key Points:**
- `!ImportValue` retrieves exported values from other stacks
- The exporting stack must exist and have the export
- Export names are case-sensitive
- Cannot delete exporting stack while import exists

**Workflow:**
1. Stack A exports: `MyDevSSHGlobalSG`
2. Stack B imports: `!ImportValue MyDevSSHGlobalSG`
3. Stack B uses the imported security group ID

### Example 5: Conditional Outputs

```yaml
Parameters:
  MyEnvironmentName:
    Type: String
    Default: dev
    AllowedValues:
    - dev
    - prod

Conditions:
  CreateDevSecurityGroup: !Equals [ !Ref MyEnvironmentName, dev ]

Resources:
  MyDevGlobalSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Condition: CreateDevSecurityGroup
    Properties:
      GroupDescription: My Dev environment Global Security Group

Outputs:
  MyInstanceId:
    Description: My instance id
    Value: !Ref MyVMInstance

  MyDNSName:
    Description: My Public DNS Name
    Value: !GetAtt MyVMInstance.PublicDnsName

  MyInstanceAvailabilityZone:
    Description: My Instance Availability Zone
    Value: !GetAtt MyVMInstance.AvailabilityZone
    Export:
      Name: !Sub "${AWS::StackName}-InstanceAz"

  MyDevGlobalSecurityGroup:
    Description: My Dev SG
    Value: !Ref MyDevGlobalSecurityGroup
    Condition: CreateDevSecurityGroup
    Export:
      Name: MyDevSSHGlobalSG
```

**Key Points:**
- Outputs can be conditional
- Output only appears when condition is true
- Useful when resources are conditionally created
- Export only exists when output exists

**Behavior:**
- **dev environment**: All outputs created including MyDevGlobalSecurityGroup
- **prod environment**: MyDevGlobalSecurityGroup output omitted

### Example 6: Exports with !Join

```yaml
Outputs:
  MyInstanceId:
    Description: My instance id
    Value: !Ref MyVMInstance

  MyDNSName:
    Description: My Public DNS Name
    Value: !GetAtt MyVMInstance.PublicDnsName

  MyInstanceAvailabilityZone:
    Description: My Instance Availability Zone
    Value: !GetAtt MyVMInstance.AvailabilityZone
    Export:
      Name: !Sub "${AWS::StackName}-InstanceAz"

  MyDevGlobalSecurityGroup:
    Description: My Dev SG
    Value: !Ref MyDevGlobalSecurityGroup
    Condition: CreateDevSecurityGroup
    Export:
      Name: !Join [ "-", [ !Ref "AWS::StackName", MyDevSSHGlobalSG ] ]
```

**Key Points:**
- `!Join` concatenates strings with a delimiter
- Alternative to !Sub for string building
- First parameter is delimiter
- Second parameter is list of strings to join

**Example:**
- Stack name: "dev-stack"
- Export name: "dev-stack-MyDevSSHGlobalSG"

## Features

### 1. Stack Information Visibility
- View resource IDs and attributes
- Access values without querying resources directly
- Convenient for automation and scripts
- Better than manual resource lookup

### 2. Cross-Stack References
- Build modular infrastructure
- Share resources between stacks
- Reduce duplication
- Create dependencies between stacks

### 3. Dynamic Export Names
- Use !Sub and !Join for dynamic names
- Include stack name in exports
- Avoid naming conflicts
- Enable multi-environment deployments

### 4. Conditional Outputs
- Output values only when relevant
- Align with conditional resources
- Clean output lists
- Environment-specific exports

### 5. Automation Support
- Retrieve values programmatically
- Pass outputs to other tools
- Chain stack deployments
- Integration with CI/CD

## Troubleshooting

### Common Issues

#### 1. Export Name Already Exists

```
Error: Export MyExportName cannot be created as it already exists
```

**Solution:**
- Export names must be unique per region
- Use dynamic names with stack name: `!Sub "${AWS::StackName}-ExportName"`
- Check existing exports: `aws cloudformation list-exports`
- Delete the conflicting stack or change export name

#### 2. Cannot Delete Stack (Export in Use)

```
Error: Export MyExportName is still imported by stack OtherStack
```

**Solution:**
- Delete or update importing stacks first
- Find importing stacks: `aws cloudformation list-imports --export-name MyExportName`
- Remove !ImportValue references
- Then delete the exporting stack

#### 3. Import Value Not Found

```
Error: ImportValue: MyExportName not found
```

**Solution:**
- Verify exporting stack exists
- Check export name spelling (case-sensitive)
- Ensure export is in the same region
- Use `aws cloudformation list-exports` to verify

#### 4. Circular Dependencies

```
Error: Circular dependency between stacks
```

**Solution:**
- Stack A cannot import from Stack B if B imports from A
- Restructure stack dependencies
- Consider a third stack for shared resources
- Review import/export relationships

#### 5. Cannot Update Export Name

```
Error: Export name cannot be updated
```

**Solution:**
- Export names cannot be changed if imported
- Delete importing stacks first
- Or create a new output with new export name
- Migrate imports to new export name
- Delete old output

### Debugging Outputs

```bash
# View all stack outputs
aws cloudformation describe-stacks \
  --stack-name my-stack \
  --query 'Stacks[0].Outputs'

# Check if output is exported
aws cloudformation describe-stacks \
  --stack-name my-stack \
  --query 'Stacks[0].Outputs[?ExportName!=`null`]'

# Find what's importing an export
aws cloudformation list-imports \
  --export-name MyExportName

# List all exports in region
aws cloudformation list-exports
```

## Best Practices

### 1. Descriptive Output Names
- Use clear, descriptive names
- Follow consistent naming conventions
- Make purpose obvious
- Avoid abbreviations

### 2. Always Add Descriptions
- Write helpful descriptions
- Explain what the value represents
- Include usage information
- Help future users

### 3. Use Dynamic Export Names
- Include stack name in exports: `!Sub "${AWS::StackName}-ResourceName"`
- Prevents naming conflicts
- Enables multi-environment deployments
- Makes exports more maintainable

### 4. Document Exports
- Document which stacks import your exports
- Note dependencies between stacks
- Maintain export contracts
- Version exported interfaces

### 5. Export Only What's Needed
- Don't export everything
- Only export values used by other stacks
- Reduces coupling
- Easier to understand dependencies

### 6. Consider Export Stability
- Changing exports breaks importing stacks
- Plan exports carefully
- Version exports if needed
- Communicate changes to consumers

### 7. Use Appropriate Functions
- !Ref for resource IDs
- !GetAtt for resource attributes
- !Sub for dynamic strings
- !Join for concatenation

### 8. Conditional Exports Alignment
- If resource is conditional, output should be too
- Use same condition for both
- Prevents reference errors
- Maintains consistency

### 9. Security Considerations
- Don't output sensitive values
- Be careful with security group IDs
- Limit access to stack outputs
- Consider who can view outputs

### 10. Automation-Friendly
- Design outputs for programmatic access
- Use consistent naming
- Output values needed by scripts
- Support CI/CD pipelines

### 11. Cross-Stack Design
- Minimize cross-stack dependencies
- Create shared resource stacks
- Order stack deployments properly
- Document dependency chains

### 12. Testing
- Test cross-stack references
- Verify import/export relationships
- Test stack deletion order
- Validate output values
