resource "aws_s3_bucket" "mywebsite" {
    bucket = var.bucket_name
    tags   = var.tags
    force_destroy = true
  
}

resource "aws_s3_bucket_website_configuration" "mywebsite" {
    bucket = aws_s3_bucket.mywebsite.id

    index_document {
        suffix = "index.html"
    }

    error_document {
        key = "error.html"
    }

}

resource "aws_s3_bucket_versioning" "mywebsite" {
    bucket = aws_s3_bucket.mywebsite.id
    versioning_configuration {
        status = "Enabled"
    }
}

resource "aws_s3_bucket_ownership_controls" "mywebsite" {

    bucket = aws_s3_bucket.mywebsite.id
    rule {
        object_ownership = "BucketOwnerPreferred"
    }
  
}

resource "aws_s3_bucket_public_access_block" "mywebsite" {
    bucket = aws_s3_bucket.mywebsite.id
    block_public_acls       = false
    block_public_policy     = false
    ignore_public_acls      = false
    restrict_public_buckets = false
  
}

resource "aws_s3_bucket_acl" "mywebsite" {
    depends_on = [ 
        aws_s3_bucket_ownership_controls.mywebsite,
        aws_s3_bucket_public_access_block.mywebsite
     ]
     bucket = aws_s3_bucket.mywebsite.id
     acl = "public-read"
  
}

resource "aws_s3_bucket_policy" "mywebsite" {
  bucket = aws_s3_bucket.mywebsite.id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
      {
          "Sid": "PublicReadGetObject",
          "Effect": "Allow",
          "Principal": "*",
          "Action": "*",
          "Resource": [
              "arn:aws:s3:::${var.bucket_name}/*"
          ]
      }
  ]
}  
EOF
}