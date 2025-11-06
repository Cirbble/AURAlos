# AURAlos - Quick Start Guide

## 📋 What You Have Now

### 1. **Agent Instructions** (`agent-instructions.md`)
Complete instructions for your Bedrock Agent including:
- Conversation flow
- Tone and style guidelines
- Product matching strategy
- Response formats
- Error handling

### 2. **AWS Setup Guide** (`aws-setup-guide.md`)
Step-by-step AWS CLI commands for:
- S3 bucket creation
- Vector database setup (OpenSearch)
- Knowledge Base configuration
- Bedrock Agent creation
- Lambda functions deployment
- API Gateway setup

### 3. **Lambda Functions** (`lambda/`)
Two Lambda functions ready to deploy:
- **image-upload**: Uploads images to S3 and generates embeddings
- **product-search**: Searches products, ranks results, generates pros/cons

## 🎯 Next Steps for Your Hackathon

### Phase 1: AWS Backend Setup (Do First)
```bash
# 1. Set your AWS credentials
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_REGION="us-east-1"

# 2. Follow aws-setup-guide.md step by step
# This will create all necessary AWS resources

# 3. Save these values after setup:
export AGENT_ID="your-agent-id"
export AGENT_ALIAS_ID="your-alias-id"
export API_GATEWAY_URL="your-api-url"
export S3_BUCKET="auralos-product-images"
export KB_ID="your-kb-id"
```

### Phase 2: Product Data Preparation
You need to create a product catalog JSON file:
```json
[
  {
    "id": "product-001",
    "name": "Kaydienh Knee-High Boot",
    "description": "Elegant knee-high boots with block heel",
    "price": 182,
    "color": "Dark Brown",
    "material": "Leather",
    "category": "womens",
    "subcategory": "boots",
    "imageUrl": "s3://bucket/products/product-001.jpg",
    "features": ["Pillow Walk", "Block Heel", "Side Zipper"],
    "sizes": ["6", "6.5", "7", "7.5", "8", "8.5", "9"],
    "promo": "BOGO 40% off at cart"
  }
]
```

### Phase 3: Frontend Development (I'll Help With This)
Once you have AWS configured, I'll build:
1. Visual search input UI
2. AI chat interface
3. Results page with pros/cons
4. AWS SDK integration

## 📞 Information I Need From You

Before I can build the frontend integration, please provide:

### Critical AWS IDs:
```
AWS_REGION: ?
AGENT_ID: ?
AGENT_ALIAS_ID: ?
KNOWLEDGE_BASE_ID: ?
S3_BUCKET_NAME: ?
API_GATEWAY_URL: ?
```

### Product Data Questions:
1. Do you have product images ready?
2. Do you have product data in JSON/CSV format?
3. How many products in your catalog?
4. Are you using real ALDO data or synthetic data?

## 🔑 Key Features Your Backend Will Support

### 1. Visual Search Flow
```
User uploads image 
  → Lambda generates embedding
  → Agent analyzes visual features
  → Agent asks clarifying questions (2-4)
  → Agent queries Knowledge Base with filters
  → Vector search finds similar products
  → Lambda ranks and generates pros/cons
  → Return top 3 results
```

### 2. Agent Actions
Your agent can call these Lambda functions:
- `searchProducts(embedding, filters, limit)`
- `getProductDetails(productId)`
- `rankProducts(products, userPreferences)`

### 3. User Experience
- Image/text input
- Natural conversation
- Budget/preference collection
- Visual similarity matching
- Attribute filtering (price, color, material)
- Pros/cons for each result
- Refine search option
- Show more results

## 🚨 Common Issues & Solutions

### Issue 1: "Agent not responding"
**Solution**: Make sure you ran `prepare-agent` and created an alias

### Issue 2: "No products found"
**Solution**: Check if Knowledge Base ingestion job completed

### Issue 3: "CORS errors"
**Solution**: Verify API Gateway CORS settings in aws-setup-guide.md

### Issue 4: "Lambda timeout"
**Solution**: Increase timeout to 30s and memory to 1024MB

## 📊 Demo Preparation

For the hackathon demo, you should:
1. ✅ Have AWS infrastructure set up
2. ✅ Upload sample product data (10-20 products minimum)
3. ✅ Test agent conversation flow
4. ✅ Prepare test images (boots, bags, shoes)
5. ✅ Create frontend UI (I'll help!)
6. ✅ Practice the demo flow

## 🎤 Demo Script
1. Show ALDO homepage
2. Click "AI Discover!"
3. Upload inspiration image
4. Show agent asking clarifying questions
5. Show top 3 results with pros/cons
6. Click "Refine" to adjust search
7. Show updated results
8. Click "Show More" for additional options

## 💡 Tips for Success

1. **Start with small dataset**: 10-20 products for testing
2. **Use placeholder images**: via.placeholder.com works fine
3. **Test agent locally**: Use AWS CLI to test agent responses
4. **Mock data for demo**: Don't need real ALDO inventory
5. **Focus on UX**: Make the UI smooth and intuitive
6. **Prepare fallbacks**: Have screenshots if live demo fails

## 📝 What to Tell the Judges

**Business Value:**
- Reduces search friction for Gen Z customers
- Increases conversion rates
- Enables visual-first shopping
- Provides transparent AI reasoning

**Technical Innovation:**
- Multimodal AI (Claude 3.5 Sonnet)
- Vector similarity search
- Conversational refinement
- Explainable recommendations

**Scalability:**
- Serverless architecture
- Fully AWS-managed services
- Production-ready design

## 🎯 Your Team Responsibilities

Based on your team composition:
- **Radman**: AWS setup, Lambda functions, API Gateway
- **Eric**: Test user flows, gather feedback
- **Muhammad**: Create product dataset, validate results
- **Benjamin**: Agent prompt engineering, API integration
- **William**: Overall solution presentation, UX design

## 📞 Ready to Continue?

Once you complete the AWS setup, tell me:
1. Your AWS configuration values
2. Whether you want me to build the frontend now
3. Any specific features to prioritize

I'm ready to build the complete frontend UI as soon as you give me the go-ahead! 🚀

