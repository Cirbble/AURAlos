#!/bin/bash

# Credential Refresh Script for AURAlos
# Run this if you get authentication errors

echo "🔑 Refreshing AWS Credentials..."
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured or credentials expired"
    echo ""
    echo "To fix this:"
    echo "1. Run: aws configure"
    echo "2. Enter your AWS Access Key ID"
    echo "3. Enter your AWS Secret Access Key"
    echo "4. Enter region: us-east-1"
    echo "5. Press enter for output format"
    exit 1
fi

echo "✅ AWS CLI is configured"
echo ""

# Get new session token
echo "📝 Getting new session token..."
SESSION_OUTPUT=$(aws sts get-session-token --duration-seconds 43200)

if [ $? -ne 0 ]; then
    echo "❌ Failed to get session token"
    exit 1
fi

# Extract credentials
ACCESS_KEY=$(echo $SESSION_OUTPUT | jq -r '.Credentials.AccessKeyId')
SECRET_KEY=$(echo $SESSION_OUTPUT | jq -r '.Credentials.SecretAccessKey')
SESSION_TOKEN=$(echo $SESSION_OUTPUT | jq -r '.Credentials.SessionToken')

if [ "$ACCESS_KEY" == "null" ] || [ "$SECRET_KEY" == "null" ] || [ "$SESSION_TOKEN" == "null" ]; then
    echo "❌ Failed to parse credentials"
    echo "Make sure jq is installed: brew install jq"
    exit 1
fi

echo "✅ New credentials obtained"
echo ""

# Update .env file
echo "📝 Updating .env file..."

# Create backup
cp .env .env.backup
echo "✅ Backup created: .env.backup"

# Update credentials in .env
sed -i '' "s/VITE_AWS_ACCESS_KEY_ID=.*/VITE_AWS_ACCESS_KEY_ID=$ACCESS_KEY/" .env
sed -i '' "s/VITE_AWS_SECRET_ACCESS_KEY=.*/VITE_AWS_SECRET_ACCESS_KEY=$SECRET_KEY/" .env
sed -i '' "s|VITE_AWS_SESSION_TOKEN=.*|VITE_AWS_SESSION_TOKEN=$SESSION_TOKEN|" .env

echo "✅ .env file updated"
echo ""

# Show expiration
EXPIRATION=$(echo $SESSION_OUTPUT | jq -r '.Credentials.Expiration')
echo "🕐 New credentials expire at: $EXPIRATION"
echo ""

echo "🎉 Credentials refreshed successfully!"
echo ""
echo "Next steps:"
echo "1. Restart your dev server (Ctrl+C then npm run dev)"
echo "2. Refresh your browser"
echo "3. Test the AI search again"

