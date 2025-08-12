# 🚀 Vercel Frontend Setup Guide

## Current Issue: Network Error on Signup

Your **Vercel frontend cannot connect to the Railway backend**. Here's how to fix it:

## ✅ Step 1: Add Environment Variables to Vercel

1. **Go to your Vercel dashboard**
2. **Select your project** (planix-frontend or similar)
3. **Go to Settings → Environment Variables**
4. **Add these variables:**

```bash
NEXT_PUBLIC_API_URL=https://planix-production-5228.up.railway.app
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

## ✅ Step 2: Redeploy Vercel

After adding environment variables:
1. **Go to Deployments tab**
2. **Click the 3 dots** on the latest deployment
3. **Click "Redeploy"**

## ✅ Step 3: Test Signup

Once redeployed, your signup should work because:
- ✅ Backend is working on Railway
- ✅ Database is connected
- ✅ CORS is configured properly
- ✅ All URLs are consistent

## 🔧 Common Issues & Solutions

### Issue: Still getting network error
**Solution:** Check browser developer tools (F12) → Network tab to see the exact error

### Issue: CORS error
**Solution:** The backend now accepts requests from `*.vercel.app` domains

### Issue: Environment variables not loading
**Solution:** Make sure variable names start with `NEXT_PUBLIC_`

## 📝 Quick Test

You can test your backend directly:
```bash
curl -X POST https://planix-production-5228.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

Should return: `User created successfully`
