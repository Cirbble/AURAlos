# 🚀 AURAlos Quick Reference Card

## ⚡ 30-Second Setup

```bash
# 1. Add AWS credentials
echo "VITE_AWS_ACCESS_KEY_ID=YOUR_KEY" >> .env
echo "VITE_AWS_SECRET_ACCESS_KEY=YOUR_SECRET" >> .env

# 2. Start the app
npm run dev

# 3. Test at http://localhost:5173
```

---

## 🎯 Your Configuration

```
✅ Agent ID: FRRCR9P4RM
✅ Alias ID: UPTUU6OAKD
✅ Knowledge Base: V2ZQ4NNM16
✅ S3 Bucket: muhammadaliullah
✅ Region: us-east-1
```

---

## 📍 User Flow

```
1. Homepage → Click "AI Visual Search" banner
2. Upload image OR type description
3. AI asks 2-4 clarifying questions
4. Chat with AI agent
5. Get top 3 results with pros/cons
6. Refine or show more
```

---

## 🔧 Key Files

- **Homepage**: `src/pages/Home.tsx` (banner added)
- **AI Page**: `src/pages/AICollection.tsx` (full UI)
- **Agent**: `src/services/bedrockService.ts`
- **Upload**: `src/services/s3Service.ts`
- **Config**: `.env` (add your AWS keys here)

---

## 🎤 Demo Script (2 minutes)

1. "This is ALDO's website" (10s)
2. "We added AI Visual Search" (10s)
3. *Click banner, upload image* (20s)
4. "AI analyzes and asks questions" (20s)
5. *Answer 2-3 questions* (30s)
6. "Here are personalized matches" (20s)
7. "With clear pros and cons" (10s)

**Total**: ~2 minutes

---

## ⚠️ If Something Breaks

### CORS Error?
```bash
aws s3api put-bucket-cors --bucket muhammadaliullah \
  --cors-configuration file://cors.json
```

### Agent Not Responding?
- Check credentials in `.env`
- Verify agent is prepared in AWS
- Check browser console for errors

### Can't Upload?
- Verify S3 bucket exists
- Check IAM permissions
- File must be < 10MB

---

## 🎯 What to Say to Judges

**Problem**: "Gen Z shoppers struggle to describe what they want in words"

**Solution**: "AURAlos lets them upload inspiration images and chat with AI"

**Tech**: "We use Claude 3.5, vector search, and conversational AI"

**Impact**: "Faster product discovery, higher conversion, better UX"

**Demo**: "Let me show you..." *[do live demo]*

---

## 📞 Need Help?

Check these files:
- `COMPLETE-GUIDE.md` - Full documentation
- `API-SETUP.md` - Credential setup
- `aws-setup-guide.md` - All AWS commands
- `agent-instructions.md` - Agent configuration

---

## ✅ You're Ready!

Everything works through the "AI Visual Search" banner on the homepage.
Just add your AWS credentials and you're good to go! 🎉

**Good luck!** 🏆

