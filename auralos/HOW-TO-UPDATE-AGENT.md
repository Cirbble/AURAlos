# 🚨 URGENT: Update Your Bedrock Agent Instructions

## The Problem

Your agent is still using old instructions that offer to help with pancakes! We need to update the agent in AWS Console.

---

## ✅ SOLUTION: Update Agent in AWS Console (5 minutes)

### Step 1: Open AWS Bedrock Console

Click this link (or copy/paste):
```
https://console.aws.amazon.com/bedrock/home?region=us-east-1#/agents/FRRCR9P4RM
```

### Step 2: Edit the Agent

1. Click the **"Edit"** button (top right)
2. Scroll down to the **"Instructions"** section
3. **Delete ALL existing text** in the instructions box

### Step 3: Copy New Instructions

**Option A - Manual Copy:**
1. Open the file: `agent-instructions.md` 
2. Select all (Cmd+A)
3. Copy (Cmd+C)

**Option B - Terminal:**
```bash
# Run this to copy to clipboard:
pbcopy < agent-instructions.md
```

### Step 4: Paste in AWS Console

1. Click in the empty "Instructions" text box
2. Paste (Cmd+V)
3. Verify the text starts with: **"# AURAlos Bedrock Agent Instructions"**
4. Verify it includes: **"## CRITICAL: SCOPE LIMITATION"**

### Step 5: Save Changes

1. Scroll to bottom of page
2. Click **"Save and exit"** button
3. Wait for save confirmation

### Step 6: Create New Version

1. Click **"Create version"** button (top right)
2. Enter description: "Updated scope limitation for ALDO products only"
3. Click **"Create version"**
4. Wait for version to be created (takes 1-2 minutes)

### Step 7: Update Alias

1. Go to **"Aliases"** tab
2. Click on your alias (likely named "live" or similar)
3. Click **"Edit"**
4. Update version to the new version you just created
5. Click **"Save"**

---

## 🧪 Test the Update

After completing steps above:

1. **Refresh your browser** at: http://localhost:5175/ai-collection
2. Click **"New Search"** if you have an old session
3. Type: **"I want pancakes"**
4. Click **"Start AI Search"**

### ✅ Expected Result:
```
AI: "I'd love to help, but I'm your ALDO footwear expert - 
not a food expert! 🥞

I can help you find amazing shoes, boots, bags, and 
accessories though! What style are you looking for? 👟👜"
```

### ❌ Old (Wrong) Result:
```
AI: "I'd be happy to help you with pancakes! However, 
I need a bit more information..."
```

---

## 🔑 Key Changes in New Instructions

The new `agent-instructions.md` includes:

### 1. CRITICAL Section at Top
```markdown
## CRITICAL: SCOPE LIMITATION
**YOU ONLY HELP WITH ALDO PRODUCTS - NOTHING ELSE!**
```

### 2. Explicit Out-of-Scope Responses
```markdown
**For food, recipes, restaurants:**
I'd love to help, but I'm your ALDO footwear expert - 
not a food expert! 🥞

I can help you find amazing shoes, boots, bags, and 
accessories though! What style are you looking for? 👟👜
```

### 3. Clear NEVER/ALWAYS Rules
```markdown
**NEVER:**
- Offer to help with recipes
- Recommend other stores or restaurants  

**ALWAYS:**
- Immediately acknowledge it's outside ALDO's range
- Redirect to ALDO footwear/accessories
```

---

## 📋 Quick Checklist

Before testing:
- [ ] Opened AWS Bedrock Console
- [ ] Clicked "Edit" on agent FRRCR9P4RM
- [ ] Deleted old instructions
- [ ] Pasted new instructions from `agent-instructions.md`
- [ ] Clicked "Save and exit"
- [ ] Clicked "Create version"
- [ ] Updated alias to new version
- [ ] Refreshed browser
- [ ] Tested with "I want pancakes"

---

## 🆘 Troubleshooting

### Issue: Can't find "Edit" button
**Solution:** Make sure you're on the agent detail page, not the list page

### Issue: Instructions box is greyed out
**Solution:** You might not have edit permissions. Check IAM permissions

### Issue: Changes not taking effect
**Solution:** Make sure you:
1. Created a NEW VERSION (not just saved)
2. Updated the ALIAS to point to the new version
3. Refreshed your browser completely

### Issue: Still getting old responses
**Solution:** 
1. Clear browser cache
2. Start a completely new conversation (click "New Search")
3. Wait 2-3 minutes after updating alias (propagation time)

---

## 🎯 What the Agent Should Say Now

| User Query | Agent Response |
|-----------|----------------|
| "I want pancakes" | "I'd love to help, but I'm your ALDO footwear expert - not a food expert! 🥞 I can help you find amazing shoes..." |
| "Show me laptops" | "We don't sell laptops at ALDO - we specialize in footwear and fashion accessories! Can I help you find some stylish shoes..." |
| "Black boots under $150" | *Normal conversation flow, asks clarifying questions* |

---

## 📞 Still Not Working?

If after following all steps the agent still offers pancake help:

1. **Check the version number:**
   - Go to agent in console
   - Check "Versions" tab
   - Verify new version was created

2. **Check the alias:**
   - Go to "Aliases" tab
   - Verify it points to NEW version

3. **Wait and retry:**
   - Sometimes takes 2-3 minutes to propagate
   - Try in an incognito/private browser window

4. **View the actual instructions:**
   - Go to your agent version
   - Click into it
   - Scroll to instructions
   - Verify they start with "## CRITICAL: SCOPE LIMITATION"

---

## ✨ Success Indicator

You'll know it's working when:
- ✅ Agent refuses to help with pancakes
- ✅ Agent redirects to ALDO products
- ✅ Response is friendly but firm about scope
- ✅ No multiple choice questions about what help is needed

---

**Estimated Time: 5 minutes**

**Start here:** https://console.aws.amazon.com/bedrock/home?region=us-east-1#/agents/FRRCR9P4RM

Good luck! 🚀

