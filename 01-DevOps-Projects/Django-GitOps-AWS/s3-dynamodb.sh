# Create the S3 bucket for state storage
aws s3api create-bucket \
  --bucket django-gitops-tfstate \
  --region us-east-1

# Enable versioning — lets you recover from accidental state corruption
aws s3api put-bucket-versioning \
  --bucket django-gitops-tfstate \
  --versioning-configuration Status=Enabled

# Enable server-side encryption
aws s3api put-bucket-encryption \
  --bucket django-gitops-tfstate \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block all public access to the state bucket
aws s3api put-public-access-block \
  --bucket django-gitops-tfstate \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name django-gitops-tfstate-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

echo "✓ Remote state backend ready"

export TF_VAR_rds_password="$(openssl rand -hex 16)"

echo "RDS Password: $TF_VAR_rds_password"


