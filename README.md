# DevOps Home Lab Projects

Welcome to my DevOps learning journey! This repository contains hands-on projects and implementations that demonstrate my skills and continuous learning in DevOps engineering, cloud infrastructure, and modern software deployment practices.

## About Me

I'm a junior DevOps engineer passionate about cloud technologies, automation, and infrastructure as code. This home lab serves as my practical learning environment where I experiment with industry-standard tools and best practices. I'm actively seeking opportunities to contribute to DevOps teams and grow my expertise in a professional setting.

## Technologies & Skills

This repository showcases my hands-on experience with:

### Cloud Platforms
- **AWS** - EC2, EKS, VPC, IAM, Load Balancers, Route53
- **Google Cloud Platform (GCP)** - Compute Engine, GKE, Cloud Storage
- **Azure** - ARM Templates, Bicep, Azure Pipelines, VMs, Web Apps

### Container Orchestration
- **Kubernetes** - Deployments, Services, Ingress, Storage, RBAC
- **Amazon EKS** - Managed Kubernetes clusters
- **Docker** - Containerization and multi-stage builds
- **Helm** - Kubernetes package management

### Infrastructure as Code
- **Terraform** - Multi-cloud provisioning (AWS, GCP, Kubernetes, Terraform Cloud)
- **CloudFormation** - AWS native IaC
- **Ansible** - Configuration management and automation
- **Azure ARM / Bicep** - Azure native IaC

### CI/CD & GitOps
- **GitHub Actions** - Workflow automation and custom actions
- **Jenkins** - Pipeline automation, multi-branch workflows
- **GitLab CI/CD** - Automated testing and deployment
- **ArgoCD** - GitOps continuous delivery
- **Azure Pipelines** - Azure DevOps CI/CD

### Monitoring & Observability
- **Prometheus** - Metrics collection and alerting
- **Grafana** - Visualization and dashboards
- **Alertmanager** - Alert routing and management
- **AWS CloudWatch** - Cloud-native monitoring
- **ELK Stack** - Elasticsearch, Logstash, Kibana

### Security
- **HashiCorp Vault** - Secrets management
- **IAM Least Privilege** - Fine-grained access control
- **RBAC** - Role-based access control in Kubernetes

### AI & Local Models
- **Phi-3.5 Mini Instruct** - Running local LLMs with Docker

### Application Development
- **Django** - REST API development
- **Node.js** - JavaScript backend applications
- **Java** - Enterprise application deployment

## Project Structure

```
home-lab/
├── 01-DevOps-Projects/             # Full end-to-end DevOps projects
│   ├── Django-GitOps-AWS/          # Django app with GitOps on AWS (Terraform, K8s, Vault)
│   ├── fullstack-gitops-argocd-project/  # Fullstack app with ArgoCD GitOps
│   ├── microservices-ecommerce-project/  # Microservices ecommerce with Helm & Kubernetes
│   └── nodejs-jenkins-elk-project/ # Node.js app with Jenkins CI/CD and ELK logging
├── 02-Cloud-Projects/              # Cloud infrastructure projects
│   ├── iam-least-privilege-project/ # IAM least privilege implementation
│   └── multi-vpc-networking-project/ # Multi-cloud VPC networking (AWS, Azure, GCP)
├── AI/                             # Local AI model deployments
├── Ansible/                        # Configuration management playbooks
├── AWS/                            # AWS standalone resources
├── AWS-EKS/                        # Amazon EKS implementations
├── Azure/                          # Azure cloud projects
│   ├── ARM/                        # ARM template examples
│   ├── Bicep/                      # Bicep IaC templates
│   └── Pipeline/                   # Azure Pipelines configurations
├── CloudFormation/                 # AWS infrastructure templates
├── Django/                         # Python web framework projects
├── Docker/                         # Containerization examples
├── GitHubActions/                  # CI/CD workflow automation
│   ├── 2024/
│   └── 2025/
├── GitLab/                         # GitLab CI/CD pipelines
├── Java/                           # Java application deployments
├── Jenkins/                        # CI/CD pipeline configurations
├── K8S/
│   └── K8S-Fundamentals/           # Core Kubernetes concepts
├── Monitoring/                     # Prometheus & Grafana stack
├── NodeJS/                         # Node.js applications
├── Terraform/
│   └── Terraform-Cloud/            # Terraform Cloud workspace management
├── Terraform-On-AWS/               # AWS infrastructure with Terraform
├── Terraform-On-GCP/               # GCP infrastructure with Terraform
└── Terraform-on-K8S/               # Kubernetes resources via Terraform
```

## Featured Projects

### End-to-End DevOps Projects
- **[Django GitOps on AWS](01-DevOps-Projects/Django-GitOps-AWS/)** - Full pipeline: Django app deployed on EKS using Terraform, Vault for secrets, and GitOps workflows
- **[Fullstack GitOps with ArgoCD](01-DevOps-Projects/fullstack-gitops-argocd-project/)** - Fullstack app (frontend + backend) with ArgoCD, Ansible, and Kubernetes
- **[Microservices Ecommerce](01-DevOps-Projects/microservices-ecommerce-project/)** - Microservices architecture with Helm charts, Jenkinsfile CI/CD, and Kubernetes
- **[Node.js Jenkins + ELK](01-DevOps-Projects/nodejs-jenkins-elk-project/)** - Node.js app with Jenkins CI/CD pipeline and ELK stack for centralized logging

### Cloud Infrastructure Projects
- **[IAM Least Privilege](02-Cloud-Projects/iam-least-privilege-project/)** - Implementing fine-grained AWS IAM policies with Terraform and auditing
- **[Multi-VPC Networking](02-Cloud-Projects/multi-vpc-networking-project/)** - Multi-cloud VPC networking across AWS, Azure, GCP, with on-prem VPN modules

### Kubernetes & Container Orchestration
- **[Kubernetes Fundamentals](K8S/K8S-Fundamentals/)** - Core concepts including Pods, ReplicaSets, Deployments, and Services
- **[EKS Cluster Management](AWS-EKS/)** - Production-grade EKS clusters with autoscaling, storage, monitoring, and Fargate
- **[Microservices on EKS](AWS-EKS/Microservices-Deployment-on-EKS/)** - Full microservices deployment with canary releases and distributed tracing

### CI/CD Pipelines
- **[GitHub Actions](GitHubActions/)** - Workflow automation with custom actions (2024 & 2025)
- **[Jenkins Pipelines](Jenkins/)** - Automated build and deployment workflows for Java, Node.js, Python, and PHP
- **[GitLab CI/CD](GitLab/)** - Continuous integration and deployment automation
- **[Azure Pipelines](Azure/Pipeline/)** - Azure DevOps CI/CD configurations

### Infrastructure as Code
- **[AWS with Terraform](Terraform-On-AWS/)** - AWS infrastructure automation (ALB, NLB, VPC, CloudWatch, Autoscaling)
- **[GCP with Terraform](Terraform-On-GCP/)** - Google Cloud resource provisioning with regional load balancers and Cloud SQL
- **[Kubernetes with Terraform](Terraform-on-K8S/)** - Kubernetes resources via Terraform
- **[Terraform Cloud](Terraform/Terraform-Cloud/)** - Remote state and workspace management
- **[Azure ARM Templates](Azure/ARM/)** - Azure infrastructure with ARM templates (VMs, SQL, Web Apps, VMSS)
- **[Azure Bicep](Azure/Bicep/)** - Modern Azure IaC with Bicep (VNets, NSGs, VMs, Storage)
- **[Ansible Automation](Ansible/)** - Configuration management and server orchestration

### Monitoring & Observability
- **[Prometheus Stack](Monitoring/Prometheus/)** - Complete monitoring setup with Prometheus, Grafana, and Alertmanager

### AI & Local Models
- **[Local LLM with Docker](AI/)** - Running Phi-3.5 Mini Instruct model locally using Docker Compose

### Application Development
- **[Django REST APIs](Django/)** - Modern Python web applications (Profiles API, Recipe App API)
- **[Node.js Applications](NodeJS/)** - JavaScript backend services including MERN stack, ecommerce, and REST APIs
- **[Containerized Java Apps](Java/)** - Enterprise application deployment

## Learning Focus Areas

- Infrastructure automation and provisioning
- Container orchestration with Kubernetes
- CI/CD pipeline design and implementation
- GitOps workflows with ArgoCD
- Cloud-native application deployment
- Multi-cloud architecture (AWS, GCP, Azure)
- Security best practices, RBAC, and secrets management
- Monitoring and observability
- Local AI model deployment

## Skills Demonstrated

- Writing clean, maintainable infrastructure code
- Implementing automated testing and deployment pipelines
- Managing cloud resources efficiently
- Troubleshooting distributed systems
- Documentation and knowledge sharing
- Version control with Git
- Linux system administration

## Getting Started

Each project directory contains its own README with:
- Project objectives and learning goals
- Prerequisites and setup instructions
- Step-by-step implementation guides
- Architecture diagrams and explanations
- Troubleshooting tips

Feel free to explore individual projects to see detailed implementations!

## Career Goals

I'm actively seeking junior DevOps or Cloud Engineer positions where I can:
- Apply and expand my infrastructure automation skills
- Work with modern cloud-native technologies
- Contribute to CI/CD pipeline development
- Learn from experienced engineers
- Grow into a well-rounded DevOps professional

## Connect With Me

I'm always eager to learn, collaborate, and discuss DevOps practices. If you're reviewing this repository as part of a hiring process or are interested in my work, I'd love to connect!

---

**Note**: This is a living repository that grows as I learn new technologies and practices. Projects are continuously updated with improvements and new features.

**Status**: Actively maintained and expanding
**Last Updated**: March 2026
.