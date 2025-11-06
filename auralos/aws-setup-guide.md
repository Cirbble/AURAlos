# AURAlos AWS Setup Guide

## Prerequisites
- AWS CLI installed and configured
- AWS account with appropriate permissions
- Node.js installed for frontend

## 1. S3 Bucket Setup

### Create S3 Bucket for Product Images
```bash
# Set your variables
export BUCKET_NAME="auralos-product-images"
export REGION="us-east-1"

# Create bucket
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Enable public read access for product images (adjust based on security needs)
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
    }
  ]
}'

# Enable CORS for frontend uploads
aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}'
```

### Upload Product Data to S3
```bash
# Create folder structure
aws s3api put-object --bucket $BUCKET_NAME --key products/
aws s3api put-object --bucket $BUCKET_NAME --key user-uploads/

# Upload product catalog (you'll need to create this JSON file)
aws s3 cp product-catalog.json s3://$BUCKET_NAME/products/catalog.json
```

## 2. Vector Database Setup (Amazon OpenSearch Serverless)

### Create OpenSearch Serverless Collection
```bash
# Create collection for vector embeddings
aws opensearchserverless create-collection \
  --name auralos-vectors \
  --type VECTORSEARCH \
  --region $REGION

# Wait for collection to be active (check status)
aws opensearchserverless list-collections --region $REGION
```

### Create Vector Index
```bash
# Get the collection endpoint
export OPENSEARCH_ENDPOINT=$(aws opensearchserverless list-collections \
  --region $REGION \
  --query "collectionSummaries[?name=='auralos-vectors'].id" \
  --output text)

# You'll need to create the index using the OpenSearch API
# This requires authentication - see docs for detailed setup
```

## 3. Knowledge Base Setup

### Create Bedrock Knowledge Base
```bash
# First, create an IAM role for the Knowledge Base
aws iam create-role \
  --role-name AuralosKnowledgeBaseRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {
        "Service": "bedrock.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach necessary policies
aws iam attach-role-policy \
  --role-name AuralosKnowledgeBaseRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam attach-role-policy \
  --role-name AuralosKnowledgeBaseRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

# Create Knowledge Base
aws bedrock-agent create-knowledge-base \
  --name "AuralosProductKnowledgeBase" \
  --role-arn "arn:aws:iam::YOUR_ACCOUNT_ID:role/AuralosKnowledgeBaseRole" \
  --knowledge-base-configuration '{
    "type": "VECTOR",
    "vectorKnowledgeBaseConfiguration": {
      "embeddingModelArn": "arn:aws:bedrock:'$REGION'::foundation-model/amazon.titan-embed-image-v1"
    }
  }' \
  --storage-configuration '{
    "type": "OPENSEARCH_SERVERLESS",
    "opensearchServerlessConfiguration": {
      "collectionArn": "YOUR_COLLECTION_ARN",
      "vectorIndexName": "auralos-products",
      "fieldMapping": {
        "vectorField": "embedding",
        "textField": "description",
        "metadataField": "metadata"
      }
    }
  }' \
  --region $REGION

# Save the Knowledge Base ID
export KB_ID="YOUR_KB_ID_FROM_OUTPUT"
```

### Create Data Source for Knowledge Base
```bash
aws bedrock-agent create-data-source \
  --knowledge-base-id $KB_ID \
  --name "ProductCatalog" \
  --data-source-configuration '{
    "type": "S3",
    "s3Configuration": {
      "bucketArn": "arn:aws:s3:::'$BUCKET_NAME'",
      "inclusionPrefixes": ["products/"]
    }
  }' \
  --region $REGION

# Start ingestion job
aws bedrock-agent start-ingestion-job \
  --knowledge-base-id $KB_ID \
  --data-source-id "YOUR_DATA_SOURCE_ID" \
  --region $REGION
```

## 4. Lambda Functions Setup

### Create IAM Role for Lambda
```bash
aws iam create-role \
  --role-name AuralosLambdaRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach policies
aws iam attach-role-policy \
  --role-name AuralosLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
  --role-name AuralosLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam attach-role-policy \
  --role-name AuralosLambdaRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

### Create Lambda Function for Image Upload
```bash
# Create deployment package (you'll need to create the function code)
zip function.zip index.js

# Create Lambda function
aws lambda create-function \
  --function-name AuralosImageUpload \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/AuralosLambdaRole \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 512 \
  --region $REGION

export IMAGE_UPLOAD_LAMBDA_ARN=$(aws lambda get-function \
  --function-name AuralosImageUpload \
  --query 'Configuration.FunctionArn' \
  --output text)
```

### Create Lambda for Product Search
```bash
# Create and deploy search function
aws lambda create-function \
  --function-name AuralosProductSearch \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/AuralosLambdaRole \
  --handler index.handler \
  --zip-file fileb://search-function.zip \
  --timeout 30 \
  --memory-size 1024 \
  --region $REGION

export SEARCH_LAMBDA_ARN=$(aws lambda get-function \
  --function-name AuralosProductSearch \
  --query 'Configuration.FunctionArn' \
  --output text)
```

## 5. Bedrock Agent Setup

### Create the Agent
```bash
# Create IAM role for Agent
aws iam create-role \
  --role-name AuralosAgentRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {
        "Service": "bedrock.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach policies
aws iam attach-role-policy \
  --role-name AuralosAgentRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

# Create the Agent
aws bedrock-agent create-agent \
  --agent-name "AuralosShoppingAssistant" \
  --foundation-model "anthropic.claude-3-5-sonnet-20241022-v2:0" \
  --instruction "$(cat agent-instructions.md)" \
  --agent-resource-role-arn "arn:aws:iam::YOUR_ACCOUNT_ID:role/AuralosAgentRole" \
  --region $REGION

# Save Agent ID
export AGENT_ID="YOUR_AGENT_ID_FROM_OUTPUT"
```

### Associate Knowledge Base with Agent
```bash
aws bedrock-agent associate-agent-knowledge-base \
  --agent-id $AGENT_ID \
  --agent-version DRAFT \
  --knowledge-base-id $KB_ID \
  --description "ALDO Product Catalog" \
  --region $REGION
```

### Create Action Group for Product Search
```bash
# Create action group with Lambda function
aws bedrock-agent create-agent-action-group \
  --agent-id $AGENT_ID \
  --agent-version DRAFT \
  --action-group-name "ProductSearchActions" \
  --action-group-executor '{
    "lambda": "'$SEARCH_LAMBDA_ARN'"
  }' \
  --function-schema '{
    "functions": [
      {
        "name": "searchProducts",
        "description": "Search for products based on visual similarity and filters",
        "parameters": {
          "imageEmbedding": {
            "type": "array",
            "description": "Vector embedding of the user image",
            "required": true
          },
          "filters": {
            "type": "object",
            "description": "Product filters (price, color, material, category)",
            "required": false
          },
          "limit": {
            "type": "number",
            "description": "Number of results to return",
            "required": false
          }
        }
      },
      {
        "name": "getProductDetails",
        "description": "Get detailed information about a specific product",
        "parameters": {
          "productId": {
            "type": "string",
            "description": "The product ID",
            "required": true
          }
        }
      },
      {
        "name": "rankProducts",
        "description": "Rank products based on user preferences and generate pros/cons",
        "parameters": {
          "products": {
            "type": "array",
            "description": "Array of product IDs to rank",
            "required": true
          },
          "userPreferences": {
            "type": "object",
            "description": "User stated preferences and constraints",
            "required": true
          }
        }
      }
    ]
  }' \
  --region $REGION
```

### Prepare and Create Agent Alias
```bash
# Prepare the agent
aws bedrock-agent prepare-agent \
  --agent-id $AGENT_ID \
  --region $REGION

# Wait for preparation to complete (check status)
aws bedrock-agent get-agent \
  --agent-id $AGENT_ID \
  --region $REGION

# Create alias
aws bedrock-agent create-agent-alias \
  --agent-id $AGENT_ID \
  --agent-alias-name "production" \
  --region $REGION

export AGENT_ALIAS_ID="YOUR_ALIAS_ID_FROM_OUTPUT"
```

## 6. API Gateway Setup

### Create REST API
```bash
# Create API
aws apigateway create-rest-api \
  --name "AuralosAPI" \
  --description "API for AURAlos visual search" \
  --region $REGION

export API_ID=$(aws apigateway get-rest-apis \
  --query "items[?name=='AuralosAPI'].id" \
  --output text)

# Get root resource ID
export ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --query 'items[?path==`/`].id' \
  --output text)
```

### Create Resources and Methods
```bash
# Create /upload-image resource
aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part "upload-image"

export UPLOAD_RESOURCE_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --query "items[?path=='/upload-image'].id" \
  --output text)

# Create POST method for image upload
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $UPLOAD_RESOURCE_ID \
  --http-method POST \
  --authorization-type NONE

# Integrate with Lambda
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $UPLOAD_RESOURCE_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$IMAGE_UPLOAD_LAMBDA_ARN/invocations

# Create /agent/invoke resource for agent chat
aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part "agent"

export AGENT_RESOURCE_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --query "items[?path=='/agent'].id" \
  --output text)

aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $AGENT_RESOURCE_ID \
  --path-part "invoke"

# Deploy API
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod

# Get API endpoint
echo "Your API Gateway endpoint:"
echo "https://$API_ID.execute-api.$REGION.amazonaws.com/prod"
```

### Grant API Gateway Permission to Invoke Lambda
```bash
aws lambda add-permission \
  --function-name AuralosImageUpload \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:YOUR_ACCOUNT_ID:$API_ID/*/POST/upload-image"
```

## 7. Environment Variables for Frontend

Create `.env` file in your frontend:
```bash
cat > .env << EOF
VITE_AWS_REGION=$REGION
VITE_AGENT_ID=$AGENT_ID
VITE_AGENT_ALIAS_ID=$AGENT_ALIAS_ID
VITE_API_GATEWAY_URL=https://$API_ID.execute-api.$REGION.amazonaws.com/prod
VITE_S3_BUCKET=$BUCKET_NAME
EOF
```

## 8. Test the Setup

### Test Image Upload
```bash
curl -X POST \
  https://$API_ID.execute-api.$REGION.amazonaws.com/prod/upload-image \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_encoded_image_data"}'
```

### Test Agent Invocation
```bash
aws bedrock-agent-runtime invoke-agent \
  --agent-id $AGENT_ID \
  --agent-alias-id $AGENT_ALIAS_ID \
  --session-id "test-session-123" \
  --input-text "I'm looking for brown leather boots" \
  --region $REGION \
  output.txt
```

## Summary of Required IDs

After running all commands, you should have:
- **S3 Bucket Name**: `auralos-product-images`
- **Knowledge Base ID**: From step 3
- **Agent ID**: From step 5
- **Agent Alias ID**: From step 5
- **API Gateway URL**: From step 6
- **Region**: `us-east-1` (or your chosen region)

Save these values - you'll need them for the frontend configuration!

