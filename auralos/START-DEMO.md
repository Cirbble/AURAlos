# 🚀 START YOUR DEMO

## One Command to Start:
```bash
npm run dev
```

Then open: **http://localhost:5173**

---

## ✅ What's Configured:

- **AWS Credentials**: ✅ Added with session token
- **S3 Bucket**: ✅ muhammadaliullah (CORS configured)
- **Bedrock Agent**: ✅ FRRCR9P4RM
- **Knowledge Base**: ✅ V2ZQ4NNM16
- **Region**: ✅ us-east-1

---

## 🎯 Demo Steps:

1. Homepage → Click "AI Visual Search" banner
2. Upload image OR type description
3. AI asks clarifying questions
4. Chat with the agent
5. Get top 3 results with pros/cons
6. Show refinement option

---

## 📞 Quick Troubleshooting:

**Session expired?**
```bash
# Re-export your AWS credentials
export AWS_SESSION_TOKEN="new-token"
# Update .env file
# Restart: npm run dev
```

**CORS error?**
```bash
aws s3api put-bucket-cors --bucket muhammadaliullah --cors-configuration file://cors.json
```

---

## 🎉 You're Ready!

Just run `npm run dev` and demo AURAlos! 🏆

