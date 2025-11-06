#!/bin/bash

# Update Bedrock Agent Instructions
# This script updates your agent with the new instructions

echo "🤖 Updating Bedrock Agent Instructions..."
echo ""

AGENT_ID="FRRCR9P4RM"
REGION="us-east-1"

# Check if agent exists
echo "📋 Checking agent status..."
AGENT_STATUS=$(aws bedrock-agent get-agent --agent-id $AGENT_ID --region $REGION 2>&1)

if [ $? -ne 0 ]; then
    echo "❌ Failed to access agent. Make sure:"
    echo "   1. AWS CLI is configured"
    echo "   2. You have permissions to access Bedrock"
    echo "   3. Agent ID is correct: $AGENT_ID"
    exit 1
fi

echo "✅ Agent found!"
echo ""

# Read the instructions file
if [ ! -f "agent-instructions.md" ]; then
    echo "❌ agent-instructions.md not found!"
    echo "   Make sure you're running this from the project root"
    exit 1
fi

INSTRUCTIONS=$(cat agent-instructions.md)

echo "📝 Preparing to update agent instructions..."
echo ""
echo "⚠️  IMPORTANT: This will update your agent's instructions."
echo "   The agent will need to be prepared again after this update."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🔄 Updating agent..."

# Note: The AWS CLI doesn't directly support updating instructions via command line easily
# You need to use the AWS Console or SDK

echo ""
echo "⚠️  AWS CLI Limitation Notice:"
echo ""
echo "To update agent instructions, you need to:"
echo ""
echo "1. Go to AWS Bedrock Console:"
echo "   https://console.aws.amazon.com/bedrock/home?region=us-east-1#/agents/$AGENT_ID"
echo ""
echo "2. Click 'Edit' on your agent"
echo ""
echo "3. Scroll to 'Instructions' section"
echo ""
echo "4. Copy the contents of 'agent-instructions.md' and paste it there"
echo ""
echo "5. Click 'Save and exit'"
echo ""
echo "6. Create a new version (click 'Create version' button)"
echo ""
echo "7. Update your alias to point to the new version"
echo ""
echo "📄 Your instructions file is ready at: $(pwd)/agent-instructions.md"
echo ""
echo "💡 TIP: I'll copy the key section to your clipboard if you have pbcopy:"

if command -v pbcopy &> /dev/null; then
    cat agent-instructions.md | pbcopy
    echo "✅ Instructions copied to clipboard! Just paste in AWS Console."
else
    echo "⚠️  pbcopy not available. Manually copy from agent-instructions.md"
fi

echo ""
echo "🔗 Quick link to your agent:"
echo "   https://console.aws.amazon.com/bedrock/home?region=us-east-1#/agents/$AGENT_ID"

