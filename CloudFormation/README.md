# CloudFormation Projects

A comprehensive collection of AWS CloudFormation templates covering various AWS services, patterns, and best practices for Infrastructure as Code (IaC).

## Repository Structure

```
CloudFormation/
├── Conditions/           # Conditional resource creation examples
├── Configsets/          # CloudFormation Init configuration sets
├── Continuous-Delivery/ # CI/CD pipeline templates
├── EC2-UserData/        # EC2 instance initialization scripts
├── Mappings/            # Template mapping examples
├── Metadata/            # CloudFormation metadata configurations
├── NestedStacks/        # Nested stack patterns
├── Outputs/             # Template output examples
├── Parameters/          # Parameter type demonstrations
├── Resources/           # Basic resource creation templates
└── StackConcepts/       # Stack lifecycle management examples
```

## Getting Started

### Prerequisites

- AWS CLI configured with appropriate permissions
- Basic understanding of AWS services
- Familiarity with YAML/JSON syntax

### Quick Start

1. Clone this repository
2. Navigate to the desired template directory
3. Deploy using AWS CLI:

```bash
aws cloudformation create-stack \
  --stack-name my-stack \
  --template-body file://template.yml \
  --parameters file://parameters.json \
  --capabilities CAPABILITY_IAM
```

## Template Categories

### Conditions
Templates demonstrating conditional resource creation using CloudFormation intrinsic functions:

- **Fn::Equals**: Compare values for conditional logic
- **Fn::If**: Conditional resource properties
- **Fn::Not**: Logical negation operations
- **Fn::Or**: Multiple condition evaluation
- **Fn::And**: Compound conditional logic

**Use Cases**: Environment-specific deployments, optional resource creation

### Configuration Sets
CloudFormation Init examples for EC2 instance configuration:

- **Base Configuration**: Simple package installation and service management
- **Multiple ConfigSets**: Complex deployment scenarios with dependencies
- **Application Deployment**: Tomcat server setup with custom applications

**Use Cases**: Application server setup, multi-tier deployments, software installation

### Continuous Delivery
Complete CI/CD pipeline implementations using AWS Developer Tools:

- **CodeBuild**: Build automation and artifact creation
- **CodeDeploy**: Application deployment to EC2 instances
- **CodePipeline**: End-to-end delivery pipelines with approval gates
- **IAM Roles**: Service-specific permission configurations

**Components**:
- EC2 instances with CodeDeploy agents
- S3 artifact storage
- SNS notifications
- Manual approval processes

### Mappings
Region and environment-specific configurations:

- **AMI Mappings**: Region-specific Amazon Machine Image IDs
- **Environment Mappings**: Development, staging, and production configurations
- **Instance Type Mappings**: Environment-appropriate sizing

**Benefits**: Template portability, environment standardization

### Nested Stacks
Modular infrastructure patterns for complex deployments:

- **VPC Stack**: Network infrastructure components
- **Security Group Stack**: Reusable security configurations
- **Root Stack**: Orchestration of child stacks

**Advantages**: Reusability, maintainability, separation of concerns

### Parameters
Various parameter types and validation examples:

- **AWS-Specific Types**: KeyPair, VPC, Subnet selections
- **String Parameters**: Custom validation and allowed values
- **SSM Parameters**: Dynamic parameter resolution

## Key Features

### Infrastructure Components

**Networking**
- VPC with public/private subnets
- Internet Gateway configuration
- Route table associations
- Security group definitions

**Compute**
- EC2 instances with user data
- Auto Scaling configurations
- Load balancer integration
- Elastic IP assignments

**Storage & Database**
- EBS volume attachments
- S3 bucket policies
- RDS database instances

**Security**
- IAM roles and policies
- Security group rules
- Instance profiles
- Cross-stack references

### Deployment Patterns

**Environment Management**
- Development, staging, production configurations
- Conditional resource creation
- Parameter-driven deployments

**Application Deployment**
- Java/Tomcat application servers
- Automated software installation
- Service configuration management

**CI/CD Integration**
- Source code management with CodeCommit
- Build automation with CodeBuild
- Deployment orchestration with CodePipeline
- Multi-environment promotion workflows

## Best Practices Demonstrated

### Template Organization
- Logical parameter grouping
- Consistent naming conventions
- Comprehensive documentation
- Modular design patterns

### Security
- Least privilege IAM policies
- Security group best practices
- Resource-level permissions
- Cross-stack reference security

### Operational Excellence
- Stack lifecycle management
- Change set previews
- Rollback strategies
- Output value exports

### Performance & Cost Optimization
- Instance type mappings
- Environment-specific sizing
- Resource tagging strategies
- Conditional resource creation

## Common Use Cases

### Development Environment Setup
```bash
# Deploy development infrastructure
aws cloudformation create-stack \
  --stack-name dev-infrastructure \
  --template-body file://EC2-UserData/01-cfn-ec2-UserData.yml \
  --parameters ParameterKey=EnvironmentName,ParameterValue=dev
```

### Production CI/CD Pipeline
```bash
# Deploy complete CI/CD pipeline
aws cloudformation create-stack \
  --stack-name production-pipeline \
  --template-body file://Continuous-Delivery/06-CFN-CI-CD-CodePipeline-ApprovalStage.yml \
  --capabilities CAPABILITY_NAMED_IAM
```

### Multi-Tier Application
```bash
# Deploy using nested stacks
aws cloudformation create-stack \
  --stack-name multi-tier-app \
  --template-body file://NestedStacks/04-RootStack-EC2-SG.yml \
  --capabilities CAPABILITY_IAM
```

## Template Validation

All templates include:
- Syntax validation
- Parameter constraints
- Resource dependency management
- Output value definitions

## Troubleshooting

### Common Issues

**Stack Creation Failures**
- Verify IAM permissions
- Check parameter values
- Validate resource limits
- Review CloudFormation events

**Update Failures**
- Use change sets for preview
- Check for resource replacement requirements
- Verify parameter compatibility
- Review stack policies

**Deployment Issues**
- Monitor CloudFormation events
- Check EC2 user data logs
- Verify security group rules
- Validate network connectivity


## Security Considerations

- Review IAM policies before deployment
- Use least privilege access principles
- Regularly audit security group rules
- Monitor CloudFormation stack events
- Implement proper secret management

## Cost Management

- Use appropriate instance types for environments
- Implement resource tagging strategies
- Monitor usage with AWS Cost Explorer
- Set up billing alerts
- Regularly review resource utilization


## Resources

- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [CloudFormation Template Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-reference.html)
- [AWS Developer Tools](https://aws.amazon.com/products/developer-tools/)
- [Infrastructure as Code Best Practices](https://docs.aws.amazon.com/whitepapers/latest/introduction-devops-aws/infrastructure-as-code.html)