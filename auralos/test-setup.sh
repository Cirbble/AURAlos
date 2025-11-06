#!/bin/bash
# Quick test script for AURAlos

echo "🧪 Testing AURAlos Setup..."
echo ""

# Check .env file
if [ -f .env ]; then
    echo "✅ .env file exists"

    if grep -q "ASIATCKARDBCA2WHHRZM" .env; then
        echo "✅ AWS credentials configured"
    else
        echo "❌ AWS credentials not found in .env"
        exit 1
    fi
else
    echo "❌ .env file not found"
    exit 1
fi

# Check S3 CORS
echo ""
echo "🔧 Checking S3 CORS..."
if aws s3api get-bucket-cors --bucket muhammadaliullah &> /dev/null; then
    echo "✅ S3 CORS configured"
else
    echo "⚠️  S3 CORS not configured (may cause upload issues)"
fi

# Check Agent
echo ""
echo "🤖 Testing Bedrock Agent..."
aws bedrock-agent get-agent --agent-id FRRCR9P4RM &> /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Bedrock Agent accessible"
else
    echo "⚠️  Cannot access Bedrock Agent (check permissions)"
fi

# Check Knowledge Base
echo ""
echo "📚 Testing Knowledge Base..."
aws bedrock-agent get-knowledge-base --knowledge-base-id V2ZQ4NNM16 &> /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Knowledge Base accessible"
else
    echo "⚠️  Cannot access Knowledge Base (check permissions)"
fi

# Check node_modules
echo ""
if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed"
else
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "🎉 Setup complete! Ready to demo."
echo ""
echo "To start the app:"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo "Click: 'AI Visual Search' banner"
echo ""

