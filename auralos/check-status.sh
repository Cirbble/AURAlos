#!/bin/bash
# AURAlos Project Status Check - Verify Complete Guide Compliance

echo "═══════════════════════════════════════════════════════════"
echo "  🎯 AURAlos Project Status Check"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
PASS=0
FAIL=0

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        ((PASS++))
    else
        echo -e "${RED}❌${NC} $2 - Missing: $1"
        ((FAIL++))
    fi
}

check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $3"
        ((PASS++))
    else
        echo -e "${RED}❌${NC} $3"
        ((FAIL++))
    fi
}

echo "📁 Core Files:"
check_file "src/App.tsx" "App.tsx with routing"
check_file "src/pages/Home.tsx" "Homepage with AI banner"
check_file "src/pages/AICollection.tsx" "AI Collection page"
check_file "src/services/bedrockService.ts" "Bedrock service"
check_file "src/services/s3Service.ts" "S3 service"
check_file "src/services/types.ts" "Type definitions"

echo ""
echo "🔧 Configuration Files:"
check_file ".env" ".env file"
check_file "cors.json" "S3 CORS configuration"
check_file "package.json" "Package.json"

echo ""
echo "📚 Documentation:"
check_file "COMPLETE-GUIDE.md" "Complete guide"
check_file "QUICK-REF.md" "Quick reference"
check_file "START-DEMO.md" "Demo start guide"
check_file "agent-instructions.md" "Agent instructions"

echo ""
echo "🔑 AWS Configuration (.env):"
check_content ".env" "VITE_AGENT_ID=FRRCR9P4RM" "Agent ID configured"
check_content ".env" "VITE_AGENT_ALIAS_ID=UPTUU6OAKD" "Agent Alias configured"
check_content ".env" "VITE_S3_BUCKET=muhammadaliullah" "S3 Bucket configured"
check_content ".env" "VITE_AWS_ACCESS_KEY_ID" "AWS credentials present"

echo ""
echo "🎨 Integration Points:"
check_content "src/pages/Home.tsx" "AI Visual Search" "AI banner on homepage"
check_content "src/pages/Home.tsx" "/ai-collection" "Links to AI Collection"
check_content "src/App.tsx" "AICollection" "AICollection route defined"
check_content "src/pages/AICollection.tsx" "uploadImageToS3" "Image upload integrated"
check_content "src/pages/AICollection.tsx" "invokeAgent" "Agent integration"

echo ""
echo "📦 Dependencies:"
if npm list @aws-sdk/client-bedrock-agent-runtime &>/dev/null; then
    echo -e "${GREEN}✅${NC} Bedrock SDK installed"
    ((PASS++))
else
    echo -e "${RED}❌${NC} Bedrock SDK not installed"
    ((FAIL++))
fi

if npm list @aws-sdk/client-s3 &>/dev/null; then
    echo -e "${GREEN}✅${NC} S3 SDK installed"
    ((PASS++))
else
    echo -e "${RED}❌${NC} S3 SDK not installed"
    ((FAIL++))
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "  Results: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Ready to demo!${NC}"
    echo ""
    echo "To start the app:"
    echo "  ./fresh-start.sh"
    echo ""
    echo "Or manually:"
    echo "  npm run dev"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  Some checks failed. Review the issues above.${NC}"
    echo ""
    exit 1
fi

