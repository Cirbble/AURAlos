#!/bin/bash

# Lambda Deployment Script
# Usage: ./deploy-lambdas.sh

set -e

echo "🚀 Deploying AURAlos Lambda Functions..."

# Set variables
REGION=${AWS_REGION:-us-east-1}
IMAGE_UPLOAD_FUNCTION="AuralosImageUpload"
PRODUCT_SEARCH_FUNCTION="AuralosProductSearch"

# Deploy Image Upload Lambda
echo "📦 Deploying Image Upload Lambda..."
cd lambda/image-upload
npm install
zip -r function.zip . -x "*.git*" "node_modules/aws-sdk/*"
aws lambda update-function-code \
  --function-name $IMAGE_UPLOAD_FUNCTION \
  --zip-file fileb://function.zip \
  --region $REGION
echo "✅ Image Upload Lambda deployed"
cd ../..

# Deploy Product Search Lambda
echo "📦 Deploying Product Search Lambda..."
cd lambda/product-search
npm install
zip -r function.zip . -x "*.git*" "node_modules/aws-sdk/*"
aws lambda update-function-code \
  --function-name $PRODUCT_SEARCH_FUNCTION \
  --zip-file fileb://function.zip \
  --region $REGION
echo "✅ Product Search Lambda deployed"
cd ../..

echo "🎉 All Lambda functions deployed successfully!"
{
  "name": "auralos-image-upload-lambda",
  "version": "1.0.0",
  "description": "Lambda function for image upload and embedding generation",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-s3": "^3.470.0",
    "@aws-sdk/client-bedrock-runtime": "^3.470.0"
  }
}

