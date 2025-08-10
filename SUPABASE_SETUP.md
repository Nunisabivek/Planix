# 🚀 Supabase Setup Guide for Planix

## Step 1: Create Supabase Project

1. **Go to [supabase.com](https://supabase.com)** and sign in
2. **Click "New Project"**
3. **Fill in the details:**
   - **Organization**: Select or create one
   - **Name**: `Planix`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select closest to your users (e.g., Asia Pacific - Mumbai)
   - **Pricing Plan**: Start with Free tier
4. **Click "Create new project"** (takes ~2 minutes)

## Step 2: Get Connection Details

Once your project is ready:

1. **Go to Settings → Database**
2. **Find "Connection string"** section
3. **Copy the "URI" connection string** (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

## Step 3: URL Encode Your Password

If your password contains special characters, encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `&` → `%26`
- `+` → `%2B`
- ` ` (space) → `%20`

**Example:**
- Password: `MyPass@123#`
- Encoded: `MyPass%40123%23`

## Step 4: Update Environment Variables

### Local Development (.env file)
Update your `backend/.env` file:
```env
DATABASE_URL="postgresql://postgres:[ENCODED-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
JWT_SECRET="your-jwt-secret-here"
RAZORPAY_KEY_ID="your-razorpay-key-id"
RAZORPAY_KEY_SECRET="your-razorpay-key-secret"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
FRONTEND_URL="https://your-frontend-url.vercel.app"
DEEPSEEK_API_KEY="your-deepseek-api-key"
```

### Railway Deployment
1. **Go to your Railway project dashboard**
2. **Navigate to Variables tab**
3. **Add/Update:**
   - `DATABASE_URL`: Your Supabase connection string (with encoded password)

## Step 5: Test Database Connection

Once you've updated the DATABASE_URL:

```bash
cd backend
npx prisma migrate dev --name init
```

This should create the database tables successfully.

## Step 6: Deploy to Railway

Push your changes to trigger Railway deployment:

```bash
git add .
git commit -m "feat: Configure for Supabase database"
git push origin main
```

## Step 7: Verify Deployment

1. **Check Railway logs** to ensure migrations run successfully
2. **Test signup** on your Vercel frontend
3. **Check Supabase dashboard** → Table Editor to see your data

## Troubleshooting

### Connection Issues
- Verify the connection string format
- Check if password is properly URL encoded
- Ensure Supabase project is active

### Migration Issues
- If migrations fail, try: `npx prisma db push --accept-data-loss`
- Check Railway logs for specific error messages

### Environment Variables
- Make sure DATABASE_URL is set in Railway
- Verify no extra spaces or quotes in the connection string

## Next Steps

Once Supabase is working:
1. Test user registration
2. Test login functionality
3. Test forgot password flow
4. Monitor database usage in Supabase dashboard
