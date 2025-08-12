# 🔧 Railway + Supabase Database Connection Fix

## Issue Found
Your Railway deployment has a **Prisma connection pooling conflict** with Supabase:
```
Error: prepared statement "s0" already exists
```

## ✅ Solution 1: Update DATABASE_URL Format

In your **Railway environment variables**, update your `DATABASE_URL` to include connection pooling parameters:

**Current format:**
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
```

**Updated format (add these parameters):**
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres?schema=public&connection_limit=1&pool_timeout=10
```

## ✅ Solution 2: Use Supabase Connection Pooling

Even better - use Supabase's **Transaction mode** pooler:

1. **Go to Supabase Dashboard** → Your project → Settings → Database
2. **Find "Connection Pooling" section**
3. **Copy the "Transaction" mode connection string**
4. **Use this format in Railway:**
```
DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

## ✅ Solution 3: Add Connection Parameters

If using the direct connection, add these query parameters:
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres?schema=public&sslmode=require&connect_timeout=10&pool_timeout=10&connection_limit=1
```

## 🚀 Apply the Fix

1. **Go to Railway Dashboard** → Your project → Backend service → Variables
2. **Edit DATABASE_URL** with one of the formats above
3. **Railway will auto-redeploy**
4. **Test:** `https://planix-production-5228.up.railway.app/api/health`

## ✅ Expected Result

After the fix, the health endpoint should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "env_check": {
    "DATABASE_URL": "set",
    "JWT_SECRET": "set"
  }
}
```

**Then your signup will work perfectly!** 🎉
