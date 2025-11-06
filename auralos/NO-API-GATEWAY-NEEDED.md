# ⚡ Quick Setup - NO API Gateway Needed!

## You're Using: Direct AWS SDK (Option A)

**Good news:** Your frontend is configured to talk **directly** to AWS Bedrock and S3.
**You DON'T need API Gateway** for the hackathon demo!

---

## 🚀 3-Step Setup (5 minutes)

### Step 1: Get Your AWS Credentials

```bash
# If you already have AWS CLI configured:
aws configure get aws_access_key_id
aws configure get aws_secret_access_key

# Copy these values!
```

**OR create new credentials:**

```bash
# Create IAM user
aws iam create-user --user-name auralos-demo

# Create access keys
aws iam create-access-key --user-name auralos-demo

# Attach required policies
aws iam attach-user-policy \
  --user-name auralos-demo \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam attach-user-policy \
  --user-name auralos-demo \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

---

### Step 2: Add Credentials to .env

Open `.env` file and replace these lines:

```env
VITE_AWS_ACCESS_KEY_ID=your-access-key-id-here
VITE_AWS_SECRET_ACCESS_KEY=your-secret-access-key-here
```

With your actual credentials:

```env
VITE_AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
VITE_AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

---

### Step 3: Configure S3 CORS

```bash
# Allow frontend to upload images to your S3 bucket
aws s3api put-bucket-cors \
  --bucket muhammadaliullah \
  --cors-configuration file://cors.json
```

---

## ✅ That's It! No API Gateway Needed

Now test it:

```bash
npm run dev
```

Open http://localhost:5173 and:
1. Click "AI Visual Search" banner
2. Upload a test image
3. Chat with the agent
4. See the magic happen! ✨

---

## 🔐 Security Note

**For Hackathon Demo:** This setup is perfect!
**For Production:** You should use API Gateway + Lambda (see `aws-setup-guide.md`)

The credentials are only visible in your browser's memory during development.

---

## 🆘 Troubleshooting

### "Access Denied" error?
```bash
# Check your IAM policies
aws iam list-attached-user-policies --user-name auralos-demo
```

### CORS error when uploading?
```bash
# Verify CORS is configured
aws s3api get-bucket-cors --bucket muhammadaliullah
```

### Agent not responding?
```bash
# Test agent directly
aws bedrock-agent-runtime invoke-agent \
  --agent-id FRRCR9P4RM \
  --agent-alias-id UPTUU6OAKD \
  --session-id test-123 \
  --input-text "Hello" \
  output.txt
```

---

## 📋 Summary

**What you have:**
- ✅ Frontend talks directly to AWS
- ✅ No backend/API Gateway needed
- ✅ Perfect for hackathon demo

**What you need:**
- ✅ AWS credentials in `.env`
- ✅ S3 CORS configured
- ✅ That's it!

**API Gateway is OPTIONAL** - only needed for production deployment!

🚀 Ready to demo AURAlos!

