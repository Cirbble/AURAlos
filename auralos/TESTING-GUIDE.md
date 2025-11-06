# 🧪 AURAlos AI Testing Guide

## ✅ Quick Start

Your dev server is running at: **http://localhost:5175/**

## 🎯 Test Scenarios

### Test 1: Image Upload Only
1. Navigate to http://localhost:5175/ai-collection
2. Click or drag an image file (shoe, boot, sandal)
3. Click "Start AI Search"
4. ✅ **Expected**: Image uploads to S3, AI agent responds with questions

### Test 2: Text Prompt Only
1. Navigate to http://localhost:5175/ai-collection
2. Enter: "Black leather ankle boots under $150"
3. Click "Start AI Search"
4. ✅ **Expected**: AI agent starts conversation asking for details

### Test 3: Image + Text Prompt
1. Navigate to http://localhost:5175/ai-collection
2. Upload an image of shoes
3. Enter: "I need these for office wear"
4. Click "Start AI Search"
5. ✅ **Expected**: AI analyzes both image and text, asks clarifying questions

### Test 4: Full Conversation Flow
1. Start search (image or text)
2. AI asks: "What's your budget?"
   - You respond: "$100-$200"
3. AI asks: "What occasion?"
   - You respond: "Work and casual"
4. AI asks: "Any color preference?"
   - You respond: "Black or brown"
5. ✅ **Expected**: AI provides product recommendations

### Test 5: Multiple Conversations
1. Complete one search
2. Click "New Search"
3. Start another search
4. ✅ **Expected**: Fresh session, new conversation starts

## 🔍 What to Check

### Frontend Checks:
- [ ] Image drag & drop works
- [ ] Image click-to-browse works
- [ ] Image preview shows correctly
- [ ] Remove image button (X) works
- [ ] Textarea accepts text input
- [ ] Button is disabled when no input
- [ ] Button is enabled with input
- [ ] Loading spinner appears during upload
- [ ] Error messages display properly

### Backend Checks:
- [ ] Image uploads to S3 (check console for logs)
- [ ] Bedrock agent receives messages
- [ ] Agent responses appear in chat
- [ ] Session ID is unique each time
- [ ] Chat history persists during session
- [ ] Messages have timestamps

### UI/UX Checks:
- [ ] Purple gradient banner looks good
- [ ] Chat bubbles are styled correctly
- [ ] User messages on right (blue)
- [ ] Agent messages on left (gray)
- [ ] Typing animation shows when loading
- [ ] Scroll to bottom on new messages
- [ ] "New Search" button works
- [ ] Layout is responsive

## 🐛 Common Issues & Solutions

### Issue: "Failed to upload image"
**Check:**
```bash
# Verify S3 bucket name in .env
cat .env | grep VITE_S3_BUCKET

# Should show: VITE_S3_BUCKET=muhammadaliullah
```

**Fix:** Ensure AWS credentials have S3 write permissions

### Issue: "Failed to communicate with AI agent"
**Check:**
```bash
# Verify Bedrock agent ID
cat .env | grep VITE_AGENT_ID

# Should show: VITE_AGENT_ID=FRRCR9P4RM
```

**Fix:** 
1. Check if AWS credentials are valid
2. Verify agent is deployed and active in AWS console
3. Check if session token is expired (they expire after a few hours)

### Issue: Credentials Expired
**Symptoms:** Works initially, then stops after a few hours

**Fix:**
```bash
# Get new temporary credentials
aws sts get-session-token

# Update .env with new credentials:
# VITE_AWS_ACCESS_KEY_ID=new_key
# VITE_AWS_SECRET_ACCESS_KEY=new_secret
# VITE_AWS_SESSION_TOKEN=new_token

# Restart dev server
npm run dev
```

### Issue: Image uploads but AI doesn't respond
**Check console logs:**
```javascript
// Open browser DevTools (F12)
// Look for errors in Console tab
// Look for network requests in Network tab
```

**Common causes:**
- Agent not properly configured
- Knowledge Base not connected
- Lambda functions not deployed

### Issue: CORS errors
**Fix:**
```bash
# Apply CORS configuration to S3 bucket
aws s3api put-bucket-cors --bucket muhammadaliullah --cors-configuration file://cors.json
```

## 📊 Browser Console Checks

Open DevTools (F12) and look for:

### Successful S3 Upload:
```
Uploading to S3: user-uploads/1699999999999-abc123.jpg
Upload successful: { s3Key: "...", s3Url: "..." }
```

### Successful Agent Call:
```
Invoking agent with message: ...
Agent response: { text: "...", sessionId: "...", isComplete: true }
```

### Expected Network Calls:
1. `PUT` to S3 bucket (image upload)
2. `POST` to Bedrock API (agent invocation)

## 🎨 Visual Testing

### Homepage:
- [ ] "Discover AI!" link in header
- [ ] Purple gradient banner if added to Home.tsx
- [ ] All links work

### AI Collection Page:
- [ ] Hero banner with gradient
- [ ] Upload area with dashed border
- [ ] Upload icon (arrow up)
- [ ] Text prompt textarea
- [ ] "OR" divider between sections
- [ ] "Start AI Search" button (gradient purple)

### Chat Interface:
- [ ] White background for chat area
- [ ] User messages: right-aligned, blue background
- [ ] Agent messages: left-aligned, gray background
- [ ] Timestamps below each message
- [ ] Input box at bottom
- [ ] "Send" button (gradient purple)
- [ ] Typing indicator (dots animation)

## 📝 Test Data

### Good Test Prompts:
1. "Black leather ankle boots for women under $150"
2. "Summer sandals, casual style, size 8"
3. "Professional office shoes, comfortable for all-day wear"
4. "Evening heels, elegant style, red or burgundy"
5. "Sneakers for daily commute, breathable material"

### Test Images:
- Use any shoe/boot images from Google Images
- Supported formats: JPG, PNG, WebP
- Max size: 10MB

## 🚀 Performance Testing

### Load Times:
- [ ] Page loads in < 2 seconds
- [ ] Image upload completes in < 5 seconds
- [ ] Agent responds in < 10 seconds
- [ ] Chat messages appear instantly

### Stress Testing:
1. Upload large image (near 10MB limit)
2. Send multiple messages quickly
3. Open multiple browser tabs
4. Test on different browsers (Chrome, Firefox, Safari)

## ✅ Pre-Demo Checklist

**30 Minutes Before Demo:**
- [ ] Run `npm run dev`
- [ ] Test one complete flow
- [ ] Clear browser cache
- [ ] Close unnecessary tabs
- [ ] Prepare test images
- [ ] Check AWS console (agent is active)
- [ ] Check internet connection
- [ ] Have backup demo video ready

**5 Minutes Before Demo:**
- [ ] Refresh the page
- [ ] Test one quick search
- [ ] Have browser at 100% zoom
- [ ] Close DevTools (unless needed)
- [ ] Position browser window nicely

## 🎯 Demo Flow (3 minutes)

**Minute 1: Problem & Solution**
- "Gen Z shops visually, not with text"
- "We built AI Visual Search for ALDO"

**Minute 2: Live Demo**
- Show homepage
- Navigate to AI Collection
- Upload image OR type prompt
- Show AI conversation
- Highlight natural language
- Show product recommendations

**Minute 3: Technical & Business Value**
- AWS Bedrock + Claude 3.5 Sonnet
- Knowledge Base integration
- Vector similarity search
- Increases conversion, reduces friction
- Transparent AI = trust

## 📞 Emergency Contacts

**If something breaks during demo:**
1. Have backup demo video ready
2. Show INTEGRATION-COMPLETE.md to explain architecture
3. Show code in IDE as fallback
4. Explain what _would_ happen (walk through flow)

## 🎉 Success Criteria

You know it's working when:
- ✅ Image uploads without errors
- ✅ AI responds within 10 seconds
- ✅ Conversation flows naturally
- ✅ UI looks polished
- ✅ No console errors
- ✅ Judges are impressed!

---

**Pro Tip:** Always test the full flow at least once before showing it to anyone. Murphy's law applies to demos! 😄

Good luck! 🚀

