# CloudFormation ConfigSets - Ordered Multi-Stage Configuration

## Overview

This project demonstrates AWS::CloudFormation::Init ConfigSets, which enable complex, multi-stage instance configurations with controlled execution order. ConfigSets allow you to organize configuration blocks into logical groups and chain them together, creating sophisticated deployment patterns with conditional execution, reusable components, and hierarchical configuration management.

ConfigSets extend the basic cfn-init capability by allowing you to define multiple named configurations and specify which ones to execute, in what order, and under what conditions. This is essential for complex deployments requiring staged execution, such as installing base dependencies before applications, or running different configurations for different environments.

## CloudFormation Concepts

### ConfigSets

ConfigSets are named collections of configuration keys that control the order and composition of cfn-init execution.

**Structure:**
```yaml
AWS::CloudFormation::Init:
  configSets:
    # Define execution order
    default:
      - config1
      - config2
    SetName:
      - configA
      - ConfigSet: "AnotherSet"
      - configB

  # Individual configurations
  config1: { ... }
  config2: { ... }
  configA: { ... }
  configB: { ... }
```

### Execution Order

ConfigSets control execution in several ways:

1. **Sequential Execution**: Configs run in listed order
2. **Nested ConfigSets**: Include other ConfigSets
3. **Named Invocation**: Call specific ConfigSet from cfn-init
4. **Default ConfigSet**: Runs when no ConfigSet specified

### ConfigSet Nesting

ConfigSets can reference other ConfigSets:

```yaml
configSets:
  Base:
    - InstallPackages
    - CreateUsers
  Application:
    - ConfigSet: "Base"    # Run Base ConfigSet first
    - DeployApp
    - StartServices
  default:
    - ConfigSet: "Application"
```

### cfn-init with ConfigSets

Invoke specific ConfigSet:

```bash
# Run default ConfigSet
/opt/aws/bin/cfn-init -v --stack ${StackName} --resource ${Resource} --region ${Region}

# Run named ConfigSet
/opt/aws/bin/cfn-init -v --stack ${StackName} --resource ${Resource} --configsets ConfigSetName --region ${Region}
```

## Prerequisites

- AWS Account with EC2 and CloudFormation permissions
- AWS CLI configured with credentials
- EC2 Key Pair in your region
- S3 bucket with application archives
- Understanding of:
  - CloudFormation templates
  - AWS::CloudFormation::Init basics
  - cfn-init helper scripts
  - Linux system administration

## Project Structure

```
Configsets/
├── README.md                                          # This file
├── 00-base.yml                                       # Base template without ConfigSets
├── 01-cfn-init-Single-configSet.yml                  # Single ConfigSet example
├── 02-cfn-init-Multiple-configSets-SingleAppCS.yml   # Multiple ConfigSets, single app
├── 03-cfn-init-Multiple-configSets-DualAppCS.yml     # Nested ConfigSets, two apps
├── 04-cfn-init-Multiple-configSets-default.yml       # Default ConfigSet with nesting
└── Sample_MultipleConfigSets.yml                     # Comprehensive example
```

### File Progression

**00-base.yml**
- Basic EC2 instance with simple cfn-init
- No ConfigSets defined
- Single configuration block

**01-cfn-init-Single-configSet.yml**
- Introduces single ConfigSet
- Named configuration execution
- Foundation for multiple ConfigSets

**02-cfn-init-Multiple-configSets-SingleAppCS.yml**
- Multiple ConfigSets defined
- Single application ConfigSet invoked
- Demonstrates selective execution

**03-cfn-init-Multiple-configSets-DualAppCS.yml**
- Nested ConfigSet pattern
- DualAppCS includes SingleAppCS
- Adds second application on top of first
- Shows ConfigSet composition

**04-cfn-init-Multiple-configSets-default.yml**
- Default ConfigSet implementation
- Three-level nesting (default -> DualAppCS -> SingleAppCS)
- Automatic execution without explicit ConfigSet parameter
- Production-ready pattern

## Usage

### Deploy with Default ConfigSet

```bash
# Deploys using default ConfigSet (all configurations)
aws cloudformation create-stack \
  --stack-name configsets-demo \
  --template-body file://04-cfn-init-Multiple-configSets-default.yml \
  --parameters ParameterKey=KeyName,ParameterValue=your-key-name \
  --region us-east-2
```

### Deploy with Specific ConfigSet

```bash
# Deploy only SingleAppCS (first application only)
aws cloudformation create-stack \
  --stack-name configsets-single-app \
  --template-body file://02-cfn-init-Multiple-configSets-SingleAppCS.yml \
  --parameters ParameterKey=KeyName,ParameterValue=your-key-name \
  --region us-east-2

# Deploy DualAppCS (both applications)
aws cloudformation create-stack \
  --stack-name configsets-dual-app \
  --template-body file://03-cfn-init-Multiple-configSets-DualAppCS.yml \
  --parameters ParameterKey=KeyName,ParameterValue=your-key-name \
  --region us-east-2
```

### Verify ConfigSet Execution

```bash
# SSH to instance
ssh -i your-key.pem ec2-user@<instance-public-ip>

# Check cfn-init execution log
sudo cat /var/log/cfn-init.log

# Look for ConfigSet execution order
sudo grep "Processing config set" /var/log/cfn-init.log
sudo grep "Processing config key" /var/log/cfn-init.log

# Verify first application
curl http://localhost:8080/demo/hello

# Verify second application (if DualAppCS or default)
curl http://localhost:8080/index.html

# Check both applications
sudo ls -la /var/lib/tomcat8/webapps/
```

### Test Different ConfigSets on Same Instance

```bash
# Run specific ConfigSet manually
ssh -i your-key.pem ec2-user@<instance-public-ip>

# Run SingleAppCS
sudo /opt/aws/bin/cfn-init -v \
  --stack configsets-demo \
  --resource MyVMInstance \
  --configsets SingleAppCS \
  --region us-east-2

# Run DualAppCS
sudo /opt/aws/bin/cfn-init -v \
  --stack configsets-demo \
  --resource MyVMInstance \
  --configsets DualAppCS \
  --region us-east-2
```

### Monitor Execution Order

```bash
# Watch logs in real-time during deployment
aws cloudformation describe-stack-events \
  --stack-name configsets-demo \
  --region us-east-2 \
  --query 'StackEvents[].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId]' \
  --output table

# On instance, watch cfn-init progress
sudo tail -f /var/log/cfn-init.log
```

### Update Stack with Different ConfigSet

```bash
# Update template to use different ConfigSet
aws cloudformation update-stack \
  --stack-name configsets-demo \
  --template-body file://04-cfn-init-Multiple-configSets-default.yml \
  --parameters ParameterKey=KeyName,ParameterValue=your-key-name \
  --region us-east-2

# cfn-hup will detect change and re-run cfn-init
# Check on instance:
sudo cat /var/log/cfn-hup.log
```

### Delete Stack

```bash
aws cloudformation delete-stack \
  --stack-name configsets-demo \
  --region us-east-2
```

## Template Examples

### Basic ConfigSet Structure

```yaml
AWS::CloudFormation::Init:
  configSets:
    # Simple sequential execution
    default:
      - config1
      - config2
      - config3

  config1:
    packages:
      yum:
        httpd: []

  config2:
    files:
      "/var/www/html/index.html":
        content: "Hello World"

  config3:
    services:
      sysvinit:
        httpd:
          enabled: "true"
          ensureRunning: "true"
```

### Nested ConfigSets

```yaml
AWS::CloudFormation::Init:
  configSets:
    # Base configuration
    Base:
      - InstallPackages
      - ConfigureSystem

    # Application builds on Base
    Application:
      - ConfigSet: "Base"
      - DeployApp
      - StartServices

    # Default runs everything
    default:
      - ConfigSet: "Application"

  InstallPackages:
    packages:
      yum:
        java-1.8.0-openjdk: []
        tomcat8: []

  ConfigureSystem:
    users:
      tomcat:
        homeDir: "/opt/tomcat"

  DeployApp:
    sources:
      /tmp: "https://s3.amazonaws.com/bucket/app.zip"
    commands:
      deploy:
        command: "cp /tmp/app.war /var/lib/tomcat8/webapps/"

  StartServices:
    services:
      sysvinit:
        tomcat8:
          enabled: "true"
          ensureRunning: "true"
```

### Environment-Specific ConfigSets

```yaml
AWS::CloudFormation::Init:
  configSets:
    # Common configuration
    Base:
      - InstallPackages
      - CreateUsers
      - BaseConfig

    # Development environment
    Development:
      - ConfigSet: "Base"
      - DevTools
      - DevConfig

    # Production environment
    Production:
      - ConfigSet: "Base"
      - ProdConfig
      - SecurityHardening
      - Monitoring

    # Default based on parameter
    default:
      - ConfigSet: !Ref EnvironmentConfigSet

  InstallPackages:
    packages:
      yum:
        java-1.8.0-openjdk: []

  DevTools:
    packages:
      yum:
        git: []
        vim: []

  ProdConfig:
    files:
      "/etc/app/config.properties":
        content: |
          environment=production
          log.level=INFO

  DevConfig:
    files:
      "/etc/app/config.properties":
        content: |
          environment=development
          log.level=DEBUG
```

### Conditional ConfigSet Execution

```yaml
Parameters:
  DeploymentType:
    Type: String
    AllowedValues:
      - BasicWeb
      - FullStack
      - Database
    Default: BasicWeb

Mappings:
  ConfigSetMapping:
    BasicWeb:
      ConfigSet: "WebOnly"
    FullStack:
      ConfigSet: "FullApplication"
    Database:
      ConfigSet: "DatabaseServer"

Resources:
  MyInstance:
    Type: AWS::EC2::Instance
    Metadata:
      AWS::CloudFormation::Init:
        configSets:
          WebOnly:
            - InstallWeb
          FullApplication:
            - InstallWeb
            - InstallApp
            - InstallDatabase
          DatabaseServer:
            - InstallDatabase
          default:
            - ConfigSet: !FindInMap [ConfigSetMapping, !Ref DeploymentType, ConfigSet]
```

### Multi-Application Deployment

```yaml
AWS::CloudFormation::Init:
  configSets:
    # First application only
    App1Only:
      - App1

    # Second application only
    App2Only:
      - App2

    # Both applications
    BothApps:
      - ConfigSet: "App1Only"
      - ConfigSet: "App2Only"

    # All applications with monitoring
    Production:
      - ConfigSet: "BothApps"
      - Monitoring
      - LogAggregation

    default:
      - ConfigSet: "Production"

  App1:
    packages:
      yum:
        java-1.8.0-openjdk: []
        tomcat8: []
    sources:
      /tmp: "https://s3.amazonaws.com/bucket/app1.zip"
    commands:
      deploy_app1:
        command: "cp /tmp/app1.war /var/lib/tomcat8/webapps/"
    services:
      sysvinit:
        tomcat8:
          enabled: "true"
          ensureRunning: "true"

  App2:
    commands:
      create_root:
        command: "mkdir -p ROOT"
        cwd: "/var/lib/tomcat8/webapps"
      create_index:
        command: "echo 'App2 Homepage' > index.html"
        cwd: "/var/lib/tomcat8/webapps/ROOT"
```

### Incremental Deployment Pattern

```yaml
AWS::CloudFormation::Init:
  configSets:
    # Stage 1: System preparation
    Stage1_Prepare:
      - UpdateSystem
      - InstallDependencies
      - CreateUsers

    # Stage 2: Application installation
    Stage2_Install:
      - ConfigSet: "Stage1_Prepare"
      - DownloadApplication
      - InstallApplication

    # Stage 3: Configuration
    Stage3_Configure:
      - ConfigSet: "Stage2_Install"
      - ConfigureApplication
      - SetupDatabase

    # Stage 4: Service startup
    Stage4_Start:
      - ConfigSet: "Stage3_Configure"
      - StartServices
      - HealthCheck

    # Full deployment
    default:
      - ConfigSet: "Stage4_Start"

  UpdateSystem:
    commands:
      update:
        command: "yum update -y"

  InstallDependencies:
    packages:
      yum:
        java-1.8.0-openjdk: []
        postgresql: []

  # ... other configurations ...
```

## Features

### Execution Control

1. **Sequential Ordering**
   - ConfigSets execute in defined order
   - Within each config, sections follow standard order
   - Predictable, repeatable deployments

2. **Nested ConfigSets**
   - Reuse common configurations
   - Build complex configurations from simple blocks
   - Reduce duplication

3. **Selective Execution**
   - Choose which ConfigSets to run
   - Skip unnecessary configurations
   - Faster iterations during development

4. **Conditional Logic**
   - Different ConfigSets for different environments
   - Parameter-driven configuration selection
   - Flexible deployment patterns

### Configuration Organization

1. **Modular Design**
   - Separate concerns into distinct configs
   - Easy to understand and maintain
   - Reusable components

2. **Hierarchical Structure**
   - Base configurations
   - Environment-specific configurations
   - Application-specific configurations

3. **Dependency Management**
   - Ensure prerequisites are met
   - Control installation order
   - Handle configuration dependencies

## Troubleshooting

### ConfigSet Execution Issues

**1. Wrong ConfigSet Executed**

```bash
# Check which ConfigSet was invoked
sudo grep "Processing config set" /var/log/cfn-init.log

# Verify UserData
sudo curl http://169.254.169.254/latest/user-data

# Check for --configsets parameter in cfn-init call
# Should be:
/opt/aws/bin/cfn-init -v --stack ${StackName} --resource ${Resource} --configsets ConfigSetName --region ${Region}
```

**2. ConfigSet Not Found**

```bash
# Error: "Config set not found"
# Check ConfigSet name spelling in:

# 1. ConfigSets definition
AWS::CloudFormation::Init:
  configSets:
    MyConfigSet:  # Check spelling

# 2. cfn-init invocation
--configsets MyConfigSet  # Must match exactly

# 3. Nested ConfigSet reference
- ConfigSet: "MyConfigSet"  # Must match exactly
```

**3. Execution Order Issues**

```bash
# Check actual execution order
sudo grep "Processing config key" /var/log/cfn-init.log

# Example output:
# Processing config key: InstallPackages
# Processing config key: CreateUsers
# Processing config key: DeployApp

# Verify order matches configSets definition
```

**4. Nested ConfigSet Loops**

```yaml
# WRONG: Creates infinite loop
configSets:
  SetA:
    - ConfigSet: "SetB"
  SetB:
    - ConfigSet: "SetA"  # Don't do this!

# CORRECT: Hierarchical nesting
configSets:
  Base:
    - Config1
  Application:
    - ConfigSet: "Base"  # Base doesn't reference Application
    - Config2
```

**5. Configuration Not Applied**

```bash
# Check if config exists
sudo /opt/aws/bin/cfn-get-metadata \
  --stack stack-name \
  --resource MyVMInstance \
  --region us-east-2 | jq '.["AWS::CloudFormation::Init"]'

# Re-run specific ConfigSet
sudo /opt/aws/bin/cfn-init -v \
  --stack stack-name \
  --resource MyVMInstance \
  --configsets ConfigSetName \
  --region us-east-2

# Check for errors in specific config
sudo grep "config key: ConfigName" /var/log/cfn-init-cmd.log -A 20
```

### Common Errors

**1. Syntax Errors in ConfigSets**

```yaml
# WRONG: Missing colon
configSets:
  default
    - Config1

# CORRECT:
configSets:
  default:
    - Config1

# WRONG: Using dash for nested ConfigSet
configSets:
  default:
    - - ConfigSet: "Base"  # Extra dash

# CORRECT:
configSets:
  default:
    - ConfigSet: "Base"
```

**2. Invalid ConfigSet References**

```yaml
# WRONG: ConfigSet doesn't exist
configSets:
  default:
    - ConfigSet: "NonExistent"  # Must exist

# CORRECT: Reference existing ConfigSet
configSets:
  Base:
    - Config1
  default:
    - ConfigSet: "Base"  # Base exists
```

**3. Mixed Naming Styles**

```yaml
# WRONG: Inconsistent naming
configSets:
  MyConfigSet:  # CamelCase
    - install_packages  # snake_case
    - DeployApp  # Mixed

# BETTER: Consistent naming
configSets:
  MyConfigSet:
    - InstallPackages
    - DeployApp
```

### Debug ConfigSet Execution

```bash
# Enable verbose logging
/opt/aws/bin/cfn-init -v -v \
  --stack stack-name \
  --resource MyVMInstance \
  --configsets ConfigSetName \
  --region us-east-2

# Trace execution order
sudo grep -E "(Processing config set|Processing config key)" /var/log/cfn-init.log

# Check specific config execution
sudo grep "Config key: ConfigName" /var/log/cfn-init-cmd.log -B 5 -A 20

# Verify all configs executed
sudo tail -100 /var/log/cfn-init.log
```

## Best Practices

### 1. Use Hierarchical ConfigSets

```yaml
# Good: Build from simple to complex
configSets:
  Base:
    - SystemPrep
    - InstallDependencies

  Application:
    - ConfigSet: "Base"
    - InstallApp

  Production:
    - ConfigSet: "Application"
    - SecurityHardening
    - Monitoring

  default:
    - ConfigSet: "Production"
```

### 2. Name ConfigSets Descriptively

```yaml
# Good: Clear, descriptive names
configSets:
  WebServerWithPHP:
    - InstallApache
    - InstallPHP
    - ConfigureVirtualHosts

  DatabaseServer:
    - InstallPostgreSQL
    - ConfigureDatabase

# Bad: Vague names
configSets:
  Config1:  # What does this do?
    - Stuff
    - Things
```

### 3. Create Reusable Base Configurations

```yaml
configSets:
  # Reusable base
  CommonBase:
    - UpdateSystem
    - InstallCloudWatch
    - InstallSSMAgent
    - ConfigureLogging

  # Specific applications use base
  WebServer:
    - ConfigSet: "CommonBase"
    - InstallApache

  AppServer:
    - ConfigSet: "CommonBase"
    - InstallTomcat

  DBServer:
    - ConfigSet: "CommonBase"
    - InstallPostgreSQL
```

### 4. Use Default ConfigSet Wisely

```yaml
# Default should be the most common/complete deployment
configSets:
  # Minimal for testing
  Minimal:
    - InstallPackages

  # Standard for most deployments
  Standard:
    - ConfigSet: "Minimal"
    - ConfigureApp
    - StartServices

  # Full for production
  Full:
    - ConfigSet: "Standard"
    - SecurityHardening
    - Monitoring

  # Default = most common use case
  default:
    - ConfigSet: "Standard"
```

### 5. Document ConfigSet Purpose

```yaml
AWS::CloudFormation::Init:
  # ConfigSets organize installation into logical stages
  configSets:
    # Base: System preparation and dependencies (5-10 min)
    Base:
      - UpdateSystem
      - InstallDependencies

    # Application: Deploy and configure app (10-15 min)
    Application:
      - ConfigSet: "Base"
      - DownloadApp
      - ConfigureApp

    # Production: Full deployment with monitoring (15-20 min)
    # This is the default for new stacks
    Production:
      - ConfigSet: "Application"
      - InstallMonitoring
      - ConfigureBackups

    default:
      - ConfigSet: "Production"
```

### 6. Separate Concerns

```yaml
# Good: Each config has single responsibility
configSets:
  default:
    - InstallPackages    # Only package installation
    - ConfigureNetwork   # Only network config
    - DeployApplication  # Only app deployment
    - StartServices      # Only service management

# Bad: Everything in one config
configSets:
  default:
    - DoEverything  # Packages, config, deployment, services all mixed
```

### 7. Use Parameters for ConfigSet Selection

```yaml
Parameters:
  Environment:
    Type: String
    Default: Production
    AllowedValues:
      - Development
      - Staging
      - Production

Mappings:
  EnvironmentConfig:
    Development:
      ConfigSet: "DevConfig"
    Staging:
      ConfigSet: "StagingConfig"
    Production:
      ConfigSet: "ProdConfig"

Resources:
  Instance:
    Type: AWS::EC2::Instance
    Metadata:
      AWS::CloudFormation::Init:
        configSets:
          # ... define ConfigSets ...
          default:
            - ConfigSet: !FindInMap [EnvironmentConfig, !Ref Environment, ConfigSet]
```

### 8. Test ConfigSets Independently

```bash
# Test individual ConfigSets
/opt/aws/bin/cfn-init -v \
  --stack stack-name \
  --resource MyVMInstance \
  --configsets Base \
  --region us-east-2

# Verify results before proceeding
# Then test next level
/opt/aws/bin/cfn-init -v \
  --stack stack-name \
  --resource MyVMInstance \
  --configsets Application \
  --region us-east-2
```

### 9. Version Your ConfigSets

```yaml
# Include version in comments
AWS::CloudFormation::Init:
  # Configuration version: 2.1.0
  # Last updated: 2024-01-15
  # Changes: Added monitoring configuration
  configSets:
    Base:  # v1.0
      - InstallPackages
    Application:  # v2.0
      - ConfigSet: "Base"
      - DeployApp
    Production:  # v2.1 - Added monitoring
      - ConfigSet: "Application"
      - InstallMonitoring
```

### 10. Use cfn-hup with ConfigSets

```yaml
files:
  "/etc/cfn/hooks.d/cfn-auto-reloader.conf":
    content: !Sub |
      [cfn-auto-reloader-hook]
      triggers=post.update
      path=Resources.MyVMInstance.Metadata.AWS::CloudFormation::Init
      # Specify ConfigSet to run on updates
      action=/opt/aws/bin/cfn-init -v --stack ${AWS::StackName} --resource MyVMInstance --configsets ${ConfigSetName} --region ${AWS::Region}
      runas=root
```
