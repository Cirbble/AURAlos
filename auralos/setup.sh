#!/bin/bash
# Complete Setup Script for AURAlos (No API Gateway)

echo "🚀 Setting up AURAlos..."
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI configured"
echo ""

# Step 1: Get AWS credentials
echo "📋 Step 1: Getting AWS credentials..."
ACCESS_KEY=$(aws configure get aws_access_key_id)
SECRET_KEY=$(aws configure get aws_secret_access_key)

if [ -z "$ACCESS_KEY" ] || [ -z "$SECRET_KEY" ]; then
    echo "⚠️  No credentials found. Creating new IAM user..."

    # Create IAM user
    aws iam create-user --user-name auralos-demo 2>/dev/null

    # Attach policies
    aws iam attach-user-policy \
      --user-name auralos-demo \
      --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

    aws iam attach-user-policy \
      --user-name auralos-demo \
      --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

    # Create access keys
    KEYS=$(aws iam create-access-key --user-name auralos-demo --output json)
    ACCESS_KEY=$(echo $KEYS | jq -r '.AccessKey.AccessKeyId')
    SECRET_KEY=$(echo $KEYS | jq -r '.AccessKey.SecretAccessKey')

    echo "✅ Created new IAM user: auralos-demo"
else
    echo "✅ Using existing AWS credentials"
fi

echo ""

# Step 2: Update .env file
echo "📝 Step 2: Updating .env file..."
if [ -f .env ]; then
    # Update existing .env
    sed -i.bak "s/VITE_AWS_ACCESS_KEY_ID=.*/VITE_AWS_ACCESS_KEY_ID=$ACCESS_KEY/" .env
    sed -i.bak "s/VITE_AWS_SECRET_ACCESS_KEY=.*/VITE_AWS_SECRET_ACCESS_KEY=$SECRET_KEY/" .env
    rm .env.bak
else
    # Create new .env
    cp .env.example .env
    sed -i.bak "s/your-access-key-id-here/$ACCESS_KEY/" .env
    sed -i.bak "s/your-secret-access-key-here/$SECRET_KEY/" .env
    rm .env.bak
fi

echo "✅ .env file updated"
echo ""

# Step 3: Configure S3 CORS
echo "🔧 Step 3: Configuring S3 CORS..."
aws s3api put-bucket-cors \
  --bucket muhammadaliullah \
  --cors-configuration file://cors.json 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ S3 CORS configured"
else
    echo "⚠️  Could not configure CORS (bucket may not exist or insufficient permissions)"
fi

echo ""

# Step 4: Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Step 4: Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Open: http://localhost:5173"
echo "3. Click: 'AI Visual Search' banner"
echo "4. Demo AURAlos to the judges! 🏆"
echo ""

