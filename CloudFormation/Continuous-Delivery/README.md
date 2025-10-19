# CloudFormation Continuous Delivery - Full CI/CD Pipeline

## Overview

This project demonstrates building a complete Continuous Integration and Continuous Delivery (CI/CD) pipeline using AWS CodePipeline, CodeBuild, and CodeDeploy, all orchestrated through CloudFormation templates. The pipeline automates the entire software delivery process from source code commit to production deployment, including building artifacts, deploying to staging, manual approval gates, and production releases.

This comprehensive example shows how to implement enterprise-grade CI/CD workflows including multi-stage deployments, approval processes, role-based permissions, artifact management, and integration with EC2 instances. The templates demonstrate progressive complexity from simple EC2 deployments to full automated pipelines with manual approval stages.

## CloudFormation Concepts

### AWS CodePipeline

A fully managed continuous delivery service that automates release pipelines.

**Key Components:**
- **Stages**: Logical divisions in the pipeline (Source, Build, Test, Deploy)
- **Actions**: Tasks performed within stages (build, deploy, approve)
- **Artifacts**: Files passed between stages
- **Transitions**: Control flow between stages

### AWS CodeBuild

Fully managed build service that compiles source code, runs tests, and produces deployable artifacts.

**Features:**
- Managed build environments
- Custom buildspec.yml for build commands
- Support for multiple runtimes
- Integration with CodePipeline
- Build artifacts stored in S3

### AWS CodeDeploy

Automated deployment service for EC2, Lambda, and on-premises servers.

**Components:**
- **Application**: Logical grouping of deployment configurations
- **Deployment Group**: Target instances (by tags, ASG, etc.)
- **Deployment Configuration**: Rules for deployment (all at once, rolling, etc.)
- **AppSpec**: Deployment instructions and lifecycle hooks

### IAM Roles and Permissions

Different AWS services require specific IAM roles:

1. **EC2 Instance Profile Role**: Allows EC2 to interact with CodeDeploy
2. **CodeBuild Service Role**: Permissions for building artifacts
3. **CodeDeploy Service Role**: Permissions for deploying to EC2
4. **CodePipeline Service Role**: Orchestrates the entire pipeline

### Build Specification (buildspec.yml)

Defines build commands and phases:

```yaml
version: 0.2
phases:
  install:
    runtime-versions:
      java: openjdk8
  pre_build:
    commands:
      - echo Pre-build phase
  build:
    commands:
      - mvn install
  post_build:
    commands:
      - echo Build completed
artifacts:
  files:
    - target/*.war
```

### Application Specification (appspec.yml)

Defines deployment instructions:

```yaml
version: 0.0
os: linux
files:
  - source: target/app.war
    destination: /var/lib/tomcat8/webapps/
hooks:
  BeforeInstall:
    - location: scripts/before_install.sh
  ApplicationStart:
    - location: scripts/start_server.sh
```

## Prerequisites

- AWS Account with full permissions for:
  - CloudFormation
  - CodePipeline, CodeBuild, CodeDeploy
  - EC2, IAM, S3, SNS
- AWS CLI configured with credentials
- EC2 instances tagged appropriately (Name: dev, Name: prod)
- CodeCommit repository with application code
- S3 bucket for artifacts
- Email for approval notifications
- Understanding of:
  - CI/CD concepts
  - AWS Developer Tools
  - Maven build process
  - Application deployment patterns

## Project Structure

```
Continuous-Delivery/
├── README.md                                      # This file
├── 01-CFN-EC2-Instance.yml                       # EC2 instances for deployment
├── 02-CFN-CI-CD-CodeBuild.yml                    # CodeBuild project
├── 03-CFN-CI-CD-CodeDeploy.yml                   # CodeDeploy application
├── 04-CFN-CI-CD-CodeDeploy-Deployment.yml        # Deployment group configuration
├── 05-CFN-CI-CD-CodePipeline.yml                 # Complete pipeline without approval
├── 06-CFN-CI-CD-CodePipeline-ApprovalStage.yml   # Pipeline with manual approval
├── All-Roles/
│   ├── 00-01-EC2-Instance-Profile-Role.yml       # EC2 instance role
│   ├── 00-02-CodeBuildService-Role.yml           # CodeBuild service role
│   ├── 00-03-CodeDeployService-Role.yml          # CodeDeploy service role
│   └── 00-04-CodePipeline-Role.yml               # CodePipeline service role
└── Other-files/
    ├── appspec.yml                                # Application spec for CodeDeploy
    ├── buildspec-during-build-phase.yml          # Build phase buildspec
    └── buildspec-during-deploy-phase.yml         # Deploy phase buildspec
```

### File Descriptions

**Infrastructure Templates:**

- **01-CFN-EC2-Instance.yml**: Basic EC2 instance setup for deployment targets
- **All-Roles/**: IAM roles required for CI/CD services

**Service-Specific Templates:**

- **02-CFN-CI-CD-CodeBuild.yml**: CodeBuild project with IAM role
- **03-CFN-CI-CD-CodeDeploy.yml**: CodeDeploy application and deployment groups
- **04-CFN-CI-CD-CodeDeploy-Deployment.yml**: Deployment group configurations

**Pipeline Templates:**

- **05-CFN-CI-CD-CodePipeline.yml**: Full pipeline (Source -> Build -> Deploy to Staging)
- **06-CFN-CI-CD-CodePipeline-ApprovalStage.yml**: Complete pipeline with:
  - Source stage (CodeCommit)
  - Build stage (CodeBuild)
  - Deploy to Staging (CodeDeploy)
  - Manual Approval (SNS notification)
  - Deploy to Production (CodeDeploy)

**Configuration Files:**

- **appspec.yml**: CodeDeploy deployment specification
- **buildspec files**: CodeBuild build instructions

## Usage

### 1. Prepare Prerequisites

```bash
# Create S3 bucket for artifacts
aws s3 mb s3://your-artifact-bucket --region us-east-2

# Create CodeCommit repository
aws codecommit create-repository \
  --repository-name ccdemo \
  --repository-description "CI/CD Demo Repository" \
  --region us-east-2

# Clone and push your application code
# Application should include:
# - pom.xml (Maven project)
# - buildspec.yml
# - appspec.yml
# - deployment scripts
```

### 2. Deploy EC2 Instances

```bash
# Deploy instances for dev and prod environments
# Tag them appropriately: Name=dev and Name=prod

# Install CodeDeploy agent on instances
# SSH to each instance:
sudo yum update -y
sudo yum install -y ruby wget
cd /home/ec2-user
wget https://aws-codedeploy-us-east-2.s3.us-east-2.amazonaws.com/latest/install
chmod +x ./install
sudo ./install auto
sudo service codedeploy-agent status
```

### 3. Deploy IAM Roles

```bash
# Deploy all required IAM roles
cd All-Roles

# EC2 Instance Profile
aws cloudformation create-stack \
  --stack-name cicd-ec2-role \
  --template-body file://00-01-EC2-Instance-Profile-Role.yml \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-2

# CodeBuild Role
aws cloudformation create-stack \
  --stack-name cicd-codebuild-role \
  --template-body file://00-02-CodeBuildService-Role.yml \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-2

# CodeDeploy Role
aws cloudformation create-stack \
  --stack-name cicd-codedeploy-role \
  --template-body file://00-03-CodeDeployService-Role.yml \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-2

# CodePipeline Role
aws cloudformation create-stack \
  --stack-name cicd-codepipeline-role \
  --template-body file://00-04-CodePipeline-Role.yml \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-2
```

### 4. Deploy CodeBuild Project

```bash
# Deploy CodeBuild project
aws cloudformation create-stack \
  --stack-name cicd-codebuild \
  --template-body file://02-CFN-CI-CD-CodeBuild.yml \
  --parameters \
    ParameterKey=ApplicationRepoName,ParameterValue=ccdemo \
    ParameterKey=ArtifactStoreS3Location,ParameterValue=your-artifact-bucket \
  --region us-east-2

# Monitor creation
aws cloudformation wait stack-create-complete \
  --stack-name cicd-codebuild \
  --region us-east-2
```

### 5. Deploy CodeDeploy Application

```bash
# Deploy CodeDeploy resources
aws cloudformation create-stack \
  --stack-name cicd-codedeploy \
  --template-body file://03-CFN-CI-CD-CodeDeploy.yml \
  --region us-east-2

# Verify deployment groups created
aws deploy list-deployment-groups \
  --application-name RestApp-cicd-codedeploy \
  --region us-east-2
```

### 6. Deploy Complete Pipeline (Without Approval)

```bash
# Deploy basic pipeline
aws cloudformation create-stack \
  --stack-name cicd-pipeline-basic \
  --template-body file://05-CFN-CI-CD-CodePipeline.yml \
  --parameters \
    ParameterKey=ApplicationRepoName,ParameterValue=ccdemo \
    ParameterKey=ArtifactStoreS3Location,ParameterValue=your-artifact-bucket \
    ParameterKey=Email,ParameterValue=your-email@example.com \
  --region us-east-2

# Pipeline automatically starts on creation
# Monitor pipeline
aws codepipeline get-pipeline-state \
  --name CICDPipe-cicd-pipeline-basic \
  --region us-east-2
```

### 7. Deploy Complete Pipeline (With Approval)

```bash
# Deploy full pipeline with manual approval
aws cloudformation create-stack \
  --stack-name cicd-pipeline-production \
  --template-body file://06-CFN-CI-CD-CodePipeline-ApprovalStage.yml \
  --parameters \
    ParameterKey=ApplicationRepoName,ParameterValue=ccdemo \
    ParameterKey=ArtifactStoreS3Location,ParameterValue=your-artifact-bucket \
    ParameterKey=Email,ParameterValue=your-email@example.com \
  --region us-east-2

# Confirm SNS subscription email
# Check your email and confirm subscription

# Monitor pipeline
aws codepipeline list-pipeline-executions \
  --pipeline-name CICDPipe-cicd-pipeline-production \
  --region us-east-2
```

### 8. Trigger Pipeline Execution

```bash
# Pipeline triggers automatically on code commit
# To manually trigger:
aws codepipeline start-pipeline-execution \
  --name CICDPipe-cicd-pipeline-production \
  --region us-east-2

# Watch pipeline progress
aws codepipeline get-pipeline-state \
  --name CICDPipe-cicd-pipeline-production \
  --region us-east-2 \
  --query 'stageStates[].{Stage:stageName,Status:latestExecution.status}' \
  --output table
```

### 9. Approve Production Deployment

```bash
# List pending approvals
aws codepipeline get-pipeline-state \
  --name CICDPipe-cicd-pipeline-production \
  --region us-east-2 \
  --query 'stageStates[?actionStates[?latestExecution.status==`InProgress`]]'

# Approve via CLI
aws codepipeline put-approval-result \
  --pipeline-name CICDPipe-cicd-pipeline-production \
  --stage-name ProductionApproval \
  --action-name ProdApproval \
  --result status=Approved,summary="Approved for production" \
  --token <token-from-get-pipeline-state> \
  --region us-east-2

# Or approve via email link (sent to your email)
# Or approve via AWS Console
```

### 10. Monitor Deployments

```bash
# View CodeBuild logs
aws codebuild batch-get-builds \
  --ids <build-id> \
  --region us-east-2

# View CodeDeploy deployment
aws deploy list-deployments \
  --application-name RestApp-cicd-pipeline-production \
  --deployment-group-name DeploymentGroup-cicd-pipeline-production \
  --region us-east-2

# Get deployment details
aws deploy get-deployment \
  --deployment-id <deployment-id> \
  --region us-east-2

# View deployment on EC2 instance
# SSH to instance and check:
sudo tail -f /var/log/aws/codedeploy-agent/codedeploy-agent.log
ls -la /var/lib/tomcat8/webapps/
```

### 11. Test Application

```bash
# Test on staging (dev) instance
curl http://<dev-instance-ip>:8080/ccdemo/hello

# Test on production instance (after approval)
curl http://<prod-instance-ip>:8080/ccdemo/hello
```

### 12. Update Application

```bash
# Make changes to application code
# Commit and push to CodeCommit
git add .
git commit -m "Update application"
git push origin master

# Pipeline automatically triggers
# Watch execution
aws codepipeline list-pipeline-executions \
  --pipeline-name CICDPipe-cicd-pipeline-production \
  --max-items 5 \
  --region us-east-2
```

### 13. Cleanup

```bash
# Delete pipeline stack
aws cloudformation delete-stack \
  --stack-name cicd-pipeline-production \
  --region us-east-2

# Delete CodeDeploy stack
aws cloudformation delete-stack \
  --stack-name cicd-codedeploy \
  --region us-east-2

# Delete CodeBuild stack
aws cloudformation delete-stack \
  --stack-name cicd-codebuild \
  --region us-east-2

# Delete IAM role stacks
aws cloudformation delete-stack --stack-name cicd-codepipeline-role --region us-east-2
aws cloudformation delete-stack --stack-name cicd-codedeploy-role --region us-east-2
aws cloudformation delete-stack --stack-name cicd-codebuild-role --region us-east-2
aws cloudformation delete-stack --stack-name cicd-ec2-role --region us-east-2

# Clean up S3 bucket (empty first)
aws s3 rm s3://your-artifact-bucket --recursive
aws s3 rb s3://your-artifact-bucket
```

## Template Examples

### Complete Pipeline with All Stages

```yaml
Resources:
  Pipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: MyPipeline
      RoleArn: !GetAtt PipelineRole.Arn
      Stages:
        # Source Stage
        - Name: Source
          Actions:
            - Name: SourceAction
              ActionTypeId:
                Category: Source
                Owner: AWS
                Provider: CodeCommit
                Version: 1
              Configuration:
                RepositoryName: !Ref RepoName
                BranchName: master
              OutputArtifacts:
                - Name: SourceOutput

        # Build Stage
        - Name: Build
          Actions:
            - Name: BuildAction
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: 1
              InputArtifacts:
                - Name: SourceOutput
              OutputArtifacts:
                - Name: BuildOutput
              Configuration:
                ProjectName: !Ref BuildProject

        # Deploy to Staging
        - Name: DeployStaging
          Actions:
            - Name: DeployAction
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CodeDeploy
                Version: 1
              InputArtifacts:
                - Name: BuildOutput
              Configuration:
                ApplicationName: !Ref Application
                DeploymentGroupName: !Ref StagingDeploymentGroup

        # Manual Approval
        - Name: ApproveProduction
          Actions:
            - Name: ManualApproval
              ActionTypeId:
                Category: Approval
                Owner: AWS
                Provider: Manual
                Version: 1
              Configuration:
                NotificationArn: !Ref SNSTopic
                CustomData: "Approve production deployment"

        # Deploy to Production
        - Name: DeployProduction
          Actions:
            - Name: DeployAction
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CodeDeploy
                Version: 1
              InputArtifacts:
                - Name: BuildOutput
              Configuration:
                ApplicationName: !Ref Application
                DeploymentGroupName: !Ref ProductionDeploymentGroup

      ArtifactStore:
        Type: S3
        Location: !Ref ArtifactBucket
```

### CodeBuild Project

```yaml
Resources:
  BuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: MyBuildProject
      ServiceRole: !GetAtt BuildRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/standard:5.0
        EnvironmentVariables:
          - Name: ARTIFACT_BUCKET
            Value: !Ref ArtifactBucket
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            install:
              runtime-versions:
                java: corretto11
            build:
              commands:
                - mvn clean package
          artifacts:
            files:
              - target/*.war
              - appspec.yml
              - scripts/**/*
```

### CodeDeploy Application and Deployment Groups

```yaml
Resources:
  Application:
    Type: AWS::CodeDeploy::Application
    Properties:
      ApplicationName: MyApp
      ComputePlatform: Server

  StagingDeploymentGroup:
    Type: AWS::CodeDeploy::DeploymentGroup
    Properties:
      ApplicationName: !Ref Application
      DeploymentGroupName: Staging
      ServiceRoleArn: !GetAtt DeployRole.Arn
      Ec2TagFilters:
        - Key: Environment
          Value: Staging
          Type: KEY_AND_VALUE
      DeploymentConfigName: CodeDeployDefault.OneAtATime

  ProductionDeploymentGroup:
    Type: AWS::CodeDeploy::DeploymentGroup
    Properties:
      ApplicationName: !Ref Application
      DeploymentGroupName: Production
      ServiceRoleArn: !GetAtt DeployRole.Arn
      Ec2TagFilters:
        - Key: Environment
          Value: Production
          Type: KEY_AND_VALUE
      DeploymentConfigName: CodeDeployDefault.AllAtOnce
      AutoRollbackConfiguration:
        Enabled: true
        Events:
          - DEPLOYMENT_FAILURE
          - DEPLOYMENT_STOP_ON_ALARM
```

### SNS Topic for Notifications

```yaml
Resources:
  NotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      DisplayName: Pipeline Notifications
      Subscription:
        - Endpoint: !Ref EmailAddress
          Protocol: email

  # Use in pipeline approval
  ApprovalStage:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Stages:
        - Name: Approval
          Actions:
            - Name: ManualApproval
              ActionTypeId:
                Category: Approval
                Owner: AWS
                Provider: Manual
                Version: 1
              Configuration:
                NotificationArn: !Ref NotificationTopic
                CustomData: !Sub "Approve deployment to production"
```

## Features

### Multi-Stage Pipeline

1. **Source Stage**
   - Monitors CodeCommit repository
   - Triggers on commits to master branch
   - Outputs source code artifact

2. **Build Stage**
   - Compiles Java application with Maven
   - Runs unit tests
   - Packages WAR file
   - Outputs build artifact

3. **Deploy to Staging**
   - Deploys to dev environment
   - EC2 instances tagged with Name=dev
   - Automated deployment
   - No approval required

4. **Manual Approval**
   - Sends SNS notification
   - Requires manual approval
   - Can include custom approval message
   - Blocks production deployment until approved

5. **Deploy to Production**
   - Deploys to prod environment
   - EC2 instances tagged with Name=prod
   - Automated after approval
   - Can include rollback configuration

### IAM Role Separation

1. **EC2 Instance Profile**
   - Allows EC2 to communicate with CodeDeploy
   - Access to S3 for artifacts

2. **CodeBuild Role**
   - Pull from CodeCommit
   - Write logs to CloudWatch
   - Store artifacts in S3

3. **CodeDeploy Role**
   - Manage EC2 instances
   - Publish to SNS
   - CloudWatch alarms

4. **CodePipeline Role**
   - Orchestrate all services
   - Access S3, CodeCommit, CodeBuild, CodeDeploy
   - Publish to SNS

### Deployment Lifecycle Hooks

CodeDeploy supports multiple lifecycle event hooks:

1. **ApplicationStop**: Stop running application
2. **BeforeInstall**: Pre-installation tasks
3. **AfterInstall**: Post-installation tasks
4. **ApplicationStart**: Start application
5. **ValidateService**: Verify deployment success

## Troubleshooting

### Pipeline Issues

**1. Pipeline Fails at Source Stage**

```bash
# Check CodeCommit repository exists
aws codecommit get-repository \
  --repository-name ccdemo \
  --region us-east-2

# Verify repository has commits
aws codecommit get-branch \
  --repository-name ccdemo \
  --branch-name master \
  --region us-east-2

# Check pipeline role has CodeCommit permissions
aws iam get-role-policy \
  --role-name CodePipelineRole \
  --policy-name CodePipelineCICDAccessPolicy
```

**2. Build Stage Fails**

```bash
# View build logs
aws codebuild batch-get-builds \
  --ids <build-id> \
  --query 'builds[0].logs' \
  --region us-east-2

# Common issues:
# - buildspec.yml missing or incorrect syntax
# - Maven dependencies not available
# - Insufficient CodeBuild role permissions
# - Build timeout

# Test buildspec locally using CodeBuild local agent
docker pull amazon/aws-codebuild-local:latest
./codebuild_build.sh -i aws/codebuild/standard:5.0 -a /tmp/artifacts -s /path/to/source
```

**3. Deploy Stage Fails**

```bash
# Check CodeDeploy agent status on EC2
ssh -i key.pem ec2-user@instance-ip
sudo service codedeploy-agent status

# View CodeDeploy agent logs
sudo tail -f /var/log/aws/codedeploy-agent/codedeploy-agent.log

# Check deployment details
aws deploy get-deployment \
  --deployment-id <deployment-id> \
  --region us-east-2

# Common issues:
# - CodeDeploy agent not running
# - Incorrect EC2 tags
# - appspec.yml errors
# - Script execution failures
# - Insufficient permissions
```

**4. Approval Stage Not Working**

```bash
# Verify SNS topic subscription confirmed
aws sns list-subscriptions \
  --region us-east-2 \
  --query 'Subscriptions[?TopicArn==`<topic-arn>`]'

# Check email for confirmation
# Resend confirmation if needed
aws sns subscribe \
  --topic-arn <topic-arn> \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region us-east-2

# Manual approval via CLI
aws codepipeline get-pipeline-state \
  --name pipeline-name \
  --query 'stageStates[?stageName==`ProductionApproval`].actionStates[0].latestExecution.token' \
  --output text

aws codepipeline put-approval-result \
  --pipeline-name pipeline-name \
  --stage-name ProductionApproval \
  --action-name ProdApproval \
  --result status=Approved,summary="Approved" \
  --token <token> \
  --region us-east-2
```

### CodeDeploy Issues

**5. Deployment Fails on Instance**

```bash
# Check deployment lifecycle events
aws deploy get-deployment \
  --deployment-id <deployment-id> \
  --query 'deploymentInfo.deploymentOverview'

# View instance-specific failure
aws deploy list-deployment-instances \
  --deployment-id <deployment-id>

aws deploy get-deployment-instance \
  --deployment-id <deployment-id> \
  --instance-id <instance-id>

# Common appspec.yml errors:
# - Incorrect file paths
# - Script permissions
# - Missing scripts
# - Invalid hooks
```

**6. Application Not Starting**

```bash
# Check application logs on instance
sudo tail -f /var/log/tomcat8/catalina.out

# Verify files deployed
ls -la /var/lib/tomcat8/webapps/

# Check Tomcat status
sudo systemctl status tomcat8

# Manually start if needed
sudo systemctl start tomcat8

# Check for port conflicts
sudo netstat -tulpn | grep 8080
```

### IAM Permission Issues

**7. Access Denied Errors**

```bash
# Check service role trust policy
aws iam get-role \
  --role-name CodeBuildRole \
  --query 'Role.AssumeRolePolicyDocument'

# Check inline policies
aws iam list-role-policies \
  --role-name CodeBuildRole

aws iam get-role-policy \
  --role-name CodeBuildRole \
  --policy-name PolicyName

# Common missing permissions:
# - CodeBuild: codecommit:GitPull, s3:PutObject, logs:CreateLogStream
# - CodeDeploy: ec2:DescribeInstances, s3:GetObject
# - CodePipeline: codebuild:StartBuild, codedeploy:CreateDeployment
```

## Best Practices

### 1. Use Separate Environments

```yaml
# Tag instances clearly
Tags:
  - Key: Environment
    Value: Development
  - Key: Name
    Value: dev

# Separate deployment groups
StagingDeploymentGroup:
  Ec2TagFilters:
    - Key: Environment
      Value: Staging

ProductionDeploymentGroup:
  Ec2TagFilters:
    - Key: Environment
      Value: Production
```

### 2. Implement Manual Approval for Production

```yaml
# Always require approval before production
Stages:
  - Name: DeployStaging
    # ... staging deployment ...

  - Name: ApproveProduction
    Actions:
      - Name: ManualApproval
        ActionTypeId:
          Category: Approval
          Owner: AWS
          Provider: Manual
          Version: 1
        Configuration:
          NotificationArn: !Ref SNSTopic

  - Name: DeployProduction
    # ... production deployment ...
```

### 3. Enable Auto-Rollback

```yaml
DeploymentGroup:
  Type: AWS::CodeDeploy::DeploymentGroup
  Properties:
    AutoRollbackConfiguration:
      Enabled: true
      Events:
        - DEPLOYMENT_FAILURE
        - DEPLOYMENT_STOP_ON_ALARM
        - DEPLOYMENT_STOP_ON_REQUEST
```

### 4. Use Deployment Configurations

```yaml
# For production, use gradual rollout
ProductionDeploymentGroup:
  Properties:
    DeploymentConfigName: CodeDeployDefault.HalfAtATime

# Or create custom config
CustomDeploymentConfig:
  Type: AWS::CodeDeploy::DeploymentConfig
  Properties:
    MinimumHealthyHosts:
      Type: FLEET_PERCENT
      Value: 75
```

### 5. Implement Comprehensive Logging

```yaml
# CloudWatch log group for CodeBuild
BuildLogGroup:
  Type: AWS::Logs::LogGroup
  Properties:
    LogGroupName: /aws/codebuild/myproject
    RetentionInDays: 30

# Enable detailed monitoring
# Check logs in deployment scripts
#!/bin/bash
exec > >(tee /var/log/deployment.log)
exec 2>&1
echo "Deployment started at $(date)"
```

### 6. Version Your Artifacts

```yaml
# Include version in build
BuildProject:
  Environment:
    EnvironmentVariables:
      - Name: BUILD_VERSION
        Value: !Ref Version
      - Name: BUILD_TIMESTAMP
        Value: !Sub ${AWS::StackName}-${AWS::StackId}
```

### 7. Use Parameter Store for Secrets

```bash
# Store sensitive data in Parameter Store
aws ssm put-parameter \
  --name /myapp/db/password \
  --value "password" \
  --type SecureString

# Reference in buildspec.yml
env:
  parameter-store:
    DB_PASSWORD: /myapp/db/password
```

### 8. Implement Health Checks

```yaml
# In appspec.yml
hooks:
  ValidateService:
    - location: scripts/validate.sh
      timeout: 300
```

```bash
# scripts/validate.sh
#!/bin/bash
# Wait for application to start
sleep 30

# Check if application responds
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)
if [ $response -eq 200 ]; then
  echo "Application healthy"
  exit 0
else
  echo "Application health check failed"
  exit 1
fi
```

### 9. Tag All Resources

```yaml
Tags:
  - Key: Project
    Value: CICD-Demo
  - Key: Environment
    Value: !Ref Environment
  - Key: ManagedBy
    Value: CloudFormation
  - Key: CostCenter
    Value: Engineering
```

### 10. Monitor Pipeline Metrics

```bash
# Set up CloudWatch dashboard
# Monitor:
# - Pipeline execution success rate
# - Build duration
# - Deployment success rate
# - Time to production

# Create alarms
aws cloudwatch put-metric-alarm \
  --alarm-name pipeline-failure \
  --alarm-description "Alert on pipeline failure" \
  --metric-name PipelineExecutionFailure \
  --namespace AWS/CodePipeline \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions <sns-topic-arn>
```
