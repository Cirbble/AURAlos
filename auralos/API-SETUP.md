# API Setup Instructions for AURAlos

## 🔑 AWS Credentials Configuration

You have two options for authenticating with AWS services:

### Option 1: Use AWS IAM User Credentials (Quick for Hackathon)

1. **Create IAM User in AWS Console:**
   ```bash
   # Via AWS CLI
   aws iam create-user --user-name auralos-frontend-user
   ```

2. **Create Access Keys:**
   ```bash
   aws iam create-access-key --user-name auralos-frontend-user
   ```
   Save the `AccessKeyId` and `SecretAccessKey` from the output.

3. **Attach Required Policies:**
   ```bash
   # Bedrock Agent access
   aws iam attach-user-policy \
     --user-name auralos-frontend-user \
     --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess
   
   # S3 access
   aws iam attach-user-policy \
     --user-name auralos-frontend-user \
     --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
   ```

4. **Update `.env` file:**
   ```env
   VITE_AWS_ACCESS_KEY_ID=your-access-key-id
   VITE_AWS_SECRET_ACCESS_KEY=your-secret-access-key
   ```

⚠️ **SECURITY WARNING**: Don't commit `.env` to git! This is OK for hackathon demo but NOT for production.

---

### Option 2: Use API Gateway + Lambda (Production Ready)

If you don't want to expose AWS credentials in the frontend, create API Gateway endpoints:

#### Required Endpoints:

**1. POST /upload-image**
- Upload image to S3
- Generate embeddings
- Return S3 key and URL

**2. POST /agent/invoke**
- Invoke Bedrock Agent
- Handle streaming responses
- Manage session state

**3. GET /search-results**
- Retrieve ranked product results
- Include pros/cons reasoning

---

## 🚀 Quick Setup (Choose One)

### Setup A: Direct AWS SDK (Fastest for Demo)

```bash
# 1. Get your AWS credentials
aws configure

# 2. Update .env with your credentials
cat >> .env << EOF
VITE_AWS_ACCESS_KEY_ID=$(aws configure get aws_access_key_id)
VITE_AWS_SECRET_ACCESS_KEY=$(aws configure get aws_secret_access_key)
EOF

# 3. Start the app
npm run dev
```

**Pros:**
- ✅ Fastest to set up (5 minutes)
- ✅ No backend needed
- ✅ Perfect for hackathon demo

**Cons:**
- ⚠️ Credentials in browser (demo only)
- ⚠️ Can't hide API keys

---

### Setup B: API Gateway + Lambda (Production)

Use the Lambda functions in `/lambda` folder:

```bash
# 1. Deploy Lambda functions
cd lambda
./deploy-lambdas.sh

# 2. Create API Gateway
aws apigateway create-rest-api --name AuralosAPI

# 3. Link Lambda functions to API routes
# (See aws-setup-guide.md for detailed steps)

# 4. Update .env with API Gateway URL
VITE_API_GATEWAY_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
```

**Pros:**
- ✅ Secure (no credentials in browser)
- ✅ Production-ready
- ✅ Better performance with caching

**Cons:**
- ⚠️ More setup time (30 minutes)
- ⚠️ Requires Lambda deployment

---

## 🎯 Recommended for Hackathon: Setup A

Since you're at a hackathon and time is limited, I recommend **Setup A (Direct AWS SDK)**:

### Quick Commands:

```bash
# 1. Navigate to project
cd /Users/muhammadaliullah/WebstormProjects/AURAlos/auralos

# 2. Create IAM user for frontend
aws iam create-user --user-name auralos-demo-user

# 3. Create access keys
aws iam create-access-key --user-name auralos-demo-user > credentials.json

# 4. Attach policies
aws iam attach-user-policy \
  --user-name auralos-demo-user \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam attach-user-policy \
  --user-name auralos-demo-user \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# 5. Extract credentials and update .env
ACCESS_KEY=$(cat credentials.json | grep AccessKeyId | cut -d'"' -f4)
SECRET_KEY=$(cat credentials.json | grep SecretAccessKey | cut -d'"' -f4)

echo "VITE_AWS_ACCESS_KEY_ID=$ACCESS_KEY" >> .env
echo "VITE_AWS_SECRET_ACCESS_KEY=$SECRET_KEY" >> .env

# 6. Delete credentials file (security)
rm credentials.json

# 7. Start the app
npm run dev
```

---

## ✅ Testing Your Setup

Once configured, test the integration:

```bash
# Start the dev server
npm run dev

# Open browser to http://localhost:5173
# Click "AI Discover!" button
# Upload a test image
# Check browser console for any errors
```

### Expected Behavior:
1. ✅ Image uploads to S3 successfully
2. ✅ Agent responds with greeting + clarifying questions
3. ✅ Chat interface works smoothly
4. ✅ No CORS or authentication errors

### Common Issues:

**Issue: "Access Denied" error**
```bash
# Solution: Check IAM permissions
aws iam list-attached-user-policies --user-name auralos-demo-user
```

**Issue: "Invalid credentials"**
```bash
# Solution: Verify .env file
cat .env | grep AWS
```

**Issue: "CORS error"**
```bash
# Solution: Add to S3 bucket CORS configuration
aws s3api put-bucket-cors --bucket muhammadaliullah --cors-configuration file://cors.json
```

Create `cors.json`:
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["http://localhost:5173", "http://localhost:5174"],
      "ExposeHeaders": ["ETag"]
    }
  ]
}
```

---

## 📋 Current Configuration Status

Your provided values:
```
✅ AGENT_ID: FRRCR9P4RM
✅ AGENT_ALIAS_ID: UPTUU6OAKD
✅ KNOWLEDGE_BASE_ID: V2ZQ4NNM16
✅ S3_BUCKET: muhammadaliullah
✅ AWS_REGION: us-east-1 (default)
```

What you still need:
```
❓ AWS_ACCESS_KEY_ID: [Run commands above to get this]
❓ AWS_SECRET_ACCESS_KEY: [Run commands above to get this]
```

OR (if using API Gateway):
```
❓ API_GATEWAY_URL: [Create API Gateway to get this]
```

---

## 🎉 Once Setup is Complete

You'll be able to:
1. ✅ Upload images directly from the frontend
2. ✅ Chat with the Bedrock Agent in real-time
3. ✅ Get AI-powered product recommendations
4. ✅ Show refined search results
5. ✅ Demo the full AURAlos experience

The app is now **fully integrated** and ready for your hackathon demo! 🚀

