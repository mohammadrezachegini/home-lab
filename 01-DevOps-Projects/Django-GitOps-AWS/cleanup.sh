#!/bin/bash
# cleanup.sh — Delete everything created outside of Terraform

set -e

echo "=== Step 1: Destroy Terraform infrastructure ==="
cd ~/Desktop/Projects/django-gitops-aws/terraform
terraform destroy -auto-approve
cd ~

echo "=== Step 2: Delete EBS CSI addon ==="
aws eks delete-addon \
  --cluster-name django-gitops-eks \
  --addon-name aws-ebs-csi-driver \
  --region us-east-1 2>/dev/null || echo "addon already deleted"

echo "=== Step 3: Delete EBS CSI IAM service account ==="
eksctl delete iamserviceaccount \
  --name ebs-csi-controller-sa \
  --namespace kube-system \
  --cluster django-gitops-eks \
  --region us-east-1 2>/dev/null || echo "service account already deleted"

echo "=== Step 4: Delete EBS CSI IAM role ==="
aws iam detach-role-policy \
  --role-name AmazonEKS_EBS_CSI_DriverRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy 2>/dev/null || echo "policy already detached"

aws iam delete-role \
  --role-name AmazonEKS_EBS_CSI_DriverRole 2>/dev/null || echo "role already deleted"

echo "=== Step 5: Delete OIDC provider ==="
# Get all OIDC providers and delete the ones for this cluster
aws iam list-open-id-connect-providers --query 'OpenIDConnectProviderList[*].Arn' --output text | \
  tr '\t' '\n' | grep "oidc.eks.us-east-1" | while read arn; do
    echo "Deleting OIDC provider: $arn"
    aws iam delete-open-id-connect-provider --open-id-connect-provider-arn "$arn"
  done

echo "=== Step 6: Delete ECR repository ==="
aws ecr delete-repository \
  --repository-name django-gitops/django-api \
  --region us-east-1 \
  --force 2>/dev/null || echo "ECR repo already deleted"

echo "=== Step 7: Empty and delete S3 state bucket ==="
# Must empty the bucket first (versioned buckets need special handling)
aws s3api list-object-versions \
  --bucket django-gitops-tfstate \
  --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}' \
  --output json | \
  python3 -c "
import json, sys, subprocess
data = json.load(sys.stdin)
objects = data.get('Objects', [])
if objects:
    delete_payload = json.dumps({'Objects': objects, 'Quiet': True})
    subprocess.run(['aws', 's3api', 'delete-objects',
                   '--bucket', 'django-gitops-tfstate',
                   '--delete', delete_payload])
    print(f'Deleted {len(objects)} versions')
"

# Delete delete markers too
aws s3api list-object-versions \
  --bucket django-gitops-tfstate \
  --query '{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}' \
  --output json | \
  python3 -c "
import json, sys, subprocess
data = json.load(sys.stdin)
objects = data.get('Objects', [])
if objects:
    delete_payload = json.dumps({'Objects': objects, 'Quiet': True})
    subprocess.run(['aws', 's3api', 'delete-objects',
                   '--bucket', 'django-gitops-tfstate',
                   '--delete', delete_payload])
    print(f'Deleted {len(objects)} delete markers')
"

aws s3api delete-bucket \
  --bucket django-gitops-tfstate \
  --region us-east-1 2>/dev/null || echo "bucket already deleted"

echo "=== Step 8: Delete DynamoDB lock table ==="
aws dynamodb delete-table \
  --table-name django-gitops-tfstate-lock \
  --region us-east-1 2>/dev/null || echo "table already deleted"

echo ""
echo "✓ All AWS resources deleted"
echo ""
echo "Verify nothing is left:"
echo "  aws eks list-clusters --region us-east-1"
echo "  aws rds describe-db-instances --region us-east-1"
echo "  aws s3 ls | grep django-gitops"