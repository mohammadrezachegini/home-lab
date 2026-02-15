const mongoose = require('mongoose');
const Article = require('./models/Article');

const articles = [
  {
    title: "Getting Started with GitOps and ArgoCD",
    slug: "getting-started-gitops-argocd",
    excerpt: "Learn how GitOps changes the way we deploy to Kubernetes. Instead of pushing changes, let ArgoCD pull them automatically.",
    content: `# Getting Started with GitOps and ArgoCD\n\nGitOps is a way of doing Continuous Delivery. The core idea is using Git as the single source of truth for your infrastructure.\n\n## What is ArgoCD?\n\nArgoCD is a declarative GitOps CD tool for Kubernetes. It watches your Git repository and automatically syncs your cluster to match the desired state.\n\n## Why GitOps?\n\n- **Auditability**: Every change is a Git commit\n- **Rollback**: Just revert a commit\n- **Consistency**: Cluster always matches Git\n- **Security**: No kubectl credentials in CI\n\n## Installing ArgoCD\n\n\`\`\`bash\nkubectl create namespace argocd\nkubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml\n\`\`\`\n\nAfter installation, all pods should be running within 2-3 minutes.`,
    category: "GitOps",
    tags: ["argocd", "gitops", "kubernetes", "cd"],
    readTime: 6
  },
  {
    title: "Kubernetes Networking Deep Dive",
    slug: "kubernetes-networking-deep-dive",
    excerpt: "Understanding how pods communicate in Kubernetes. CNI plugins, Services, and why 'No route to host' happens.",
    content: `# Kubernetes Networking Deep Dive\n\nKubernetes networking can be confusing. Let me explain how it actually works.\n\n## The Kubernetes Network Model\n\nEvery pod gets its own IP address. Pods can communicate with each other without NAT.\n\n## CNI Plugins\n\nContainer Network Interface (CNI) plugins handle the actual networking:\n- **Flannel**: Simple overlay network, default in K3s\n- **Calico**: Network policies + routing\n- **Cilium**: eBPF-based, very fast\n\n## Common Issue: No Route to Host\n\nThis happens when two CNI plugins conflict. I experienced this with kube-router orphaned iptables rules conflicting with Flannel in K3s.\n\n## Fix\n\n\`\`\`bash\nsudo iptables -F KUBE-ROUTER-FORWARD\nsudo systemctl restart k3s\n\`\`\``,
    category: "Kubernetes",
    tags: ["kubernetes", "networking", "cni", "k3s"],
    readTime: 8
  },
  {
    title: "GitHub Actions CI/CD Pipeline for Kubernetes",
    slug: "github-actions-cicd-kubernetes",
    excerpt: "Build a complete CI/CD pipeline with GitHub Actions that builds Docker images and updates Kubernetes manifests automatically.",
    content: `# GitHub Actions CI/CD Pipeline for Kubernetes\n\nIn this article I'll show you how to build a real CI/CD pipeline that integrates with ArgoCD.\n\n## The Flow\n\n1. Push code to GitHub\n2. GitHub Actions builds Docker image\n3. Tags image with git SHA\n4. Updates deployment manifest\n5. ArgoCD detects change and deploys\n\n## Key Workflow Steps\n\n\`\`\`yaml\n- name: Set image tag\n  id: tag\n  run: echo "IMAGE_TAG=$(echo $GITHUB_SHA | cut -c1-7)" >> $GITHUB_OUTPUT\n\`\`\`\n\nUsing the git SHA as the image tag gives you full traceability — you always know exactly which commit is running in production.`,
    category: "CI/CD",
    tags: ["github-actions", "cicd", "docker", "kubernetes"],
    readTime: 7
  },
  {
    title: "Prometheus Monitoring for Kubernetes",
    slug: "prometheus-monitoring-kubernetes",
    excerpt: "Set up Prometheus and Grafana on your K3s cluster to monitor everything from node metrics to application performance.",
    content: `# Prometheus Monitoring for Kubernetes\n\nObservability is not optional in production. Here is how to set up a complete monitoring stack.\n\n## Components\n\n- **Prometheus**: Metrics collection and storage\n- **Grafana**: Visualization and dashboards\n- **Node Exporter**: Host-level metrics\n- **kube-state-metrics**: Kubernetes object metrics\n\n## Installation with Helm\n\n\`\`\`bash\nhelm repo add prometheus-community https://prometheus-community.github.io/helm-charts\nhelm install prometheus prometheus-community/kube-prometheus-stack -n monitoring\n\`\`\`\n\n## Key Metrics to Watch\n\n- Pod restart count\n- Memory and CPU usage\n- Deployment sync status (ArgoCD)\n- HTTP error rates`,
    category: "Monitoring",
    tags: ["prometheus", "grafana", "monitoring", "kubernetes"],
    readTime: 9
  },
  {
    title: "Docker Multi-Stage Builds for Production",
    slug: "docker-multi-stage-builds-production",
    excerpt: "Reduce your Docker image size by 80% using multi-stage builds. Smaller images mean faster deployments and less attack surface.",
    content: `# Docker Multi-Stage Builds for Production\n\nLarge Docker images slow down your CI/CD pipeline and increase security risk. Multi-stage builds solve this.\n\n## Before: Single Stage\n\n\`\`\`dockerfile\nFROM node:18\nWORKDIR /app\nCOPY . .\nRUN npm install\nRUN npm run build\nCMD ["node", "server.js"]\n\`\`\`\n\nResult: ~900MB image\n\n## After: Multi-Stage\n\n\`\`\`dockerfile\nFROM node:18-alpine AS builder\nWORKDIR /app\nCOPY package*.json .\nRUN npm ci --only=production\nCOPY . .\nRUN npm run build\n\nFROM node:18-alpine\nWORKDIR /app\nCOPY --from=builder /app/dist ./dist\nCOPY --from=builder /app/node_modules ./node_modules\nCMD ["node", "dist/server.js"]\n\`\`\`\n\nResult: ~120MB image — 87% smaller!`,
    category: "Docker",
    tags: ["docker", "dockerfile", "optimization", "cicd"],
    readTime: 5
  },
  {
    title: "Terraform Infrastructure as Code on AWS",
    slug: "terraform-infrastructure-aws",
    excerpt: "Manage your AWS infrastructure with Terraform. VPCs, EC2 instances, RDS databases — all in code, all version controlled.",
    content: `# Terraform Infrastructure as Code on AWS\n\nInfrastructure as Code means your servers, networks, and databases are defined in version-controlled files.\n\n## Why Terraform?\n\n- **Multi-cloud**: Works with AWS, GCP, Azure\n- **State management**: Tracks what exists\n- **Plan before apply**: See changes before making them\n- **Modules**: Reusable infrastructure components\n\n## Basic AWS VPC Example\n\n\`\`\`hcl\nresource "aws_vpc" "main" {\n  cidr_block = "10.0.0.0/16"\n  \n  tags = {\n    Name = "devops-portfolio"\n    Environment = "production"\n  }\n}\n\`\`\`\n\n## The Workflow\n\n\`\`\`bash\nterraform init\nterraform plan\nterraform apply\n\`\`\``,
    category: "Infrastructure",
    tags: ["terraform", "aws", "iac", "infrastructure"],
    readTime: 10
  }
];

async function seed() {
  try {
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/devops-blog';
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    await Article.deleteMany({});
    console.log('Cleared existing articles');

    await Article.insertMany(articles);
    console.log(`Seeded ${articles.length} articles`);

    await mongoose.disconnect();
    console.log('Done!');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();