# Vercel Deployment Guide

This guide will walk you through deploying Roleplay Realm to Vercel.

## Prerequisites

1. **GitHub Account** - Your code needs to be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free tier works)
3. **Database** - Production PostgreSQL database (Supabase recommended)
4. **Supabase Project** - For authentication and storage

## Step 1: Push Your Code to GitHub

If you haven't already, push your code to a GitHub repository:

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add your GitHub repository as remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/roleplay-realm.git

# Push to GitHub
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings
5. **Configure the project:**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from your project directory)
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? roleplay-realm (or your choice)
# - Directory? ./
# - Override settings? No
```

## Step 3: Configure Environment Variables

**IMPORTANT**: You must add all environment variables in Vercel before deploying.

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add the following variables:

### Required Environment Variables

```
DATABASE_URL=postgresql://user:password@host:5432/database?pgbouncer=true
```

**Important for Vercel**: Use a connection pooling URL for `DATABASE_URL`:
- If using Supabase: Use the **Connection Pooling** URL (Transaction mode)
- Format: `postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true`
- Get it from: Supabase Dashboard → Settings → Database → Connection Pooling

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Optional:
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### How to Get Your Values

**Supabase Credentials:**
1. Go to your Supabase project dashboard
2. Settings → API
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

**Database URL:**
1. Supabase Dashboard → Settings → Database
2. Under **Connection Pooling**, copy the **Transaction** mode URL
3. Replace `[YOUR-PASSWORD]` with your database password
4. This becomes your `DATABASE_URL`

### Setting Environment Variables in Vercel

For each variable:
1. Click **"Add New"**
2. Enter the **Key** (e.g., `DATABASE_URL`)
3. Enter the **Value**
4. Select environments: **Production**, **Preview**, and **Development** (or just Production)
5. Click **"Save"**

## Step 4: Run Database Migrations

After deploying, you need to run Prisma migrations on your production database:

```bash
# Set your production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Run migrations
npm run migrate:deploy
```

Or use Vercel's CLI:

```bash
vercel env pull .env.production
npm run migrate:deploy
```

## Step 5: Deploy!

1. After adding all environment variables, go to the **Deployments** tab
2. Click **"Redeploy"** on your latest deployment (or push a new commit)
3. Wait for the build to complete
4. Your app will be live at `https://your-project.vercel.app`

## Step 6: Verify Deployment

1. Visit your Vercel URL
2. Test authentication (sign up/sign in)
3. Check that database connections work
4. Verify file uploads work (Supabase Storage)

## Troubleshooting

### Build Fails with Prisma Error

- Make sure `postinstall` script is in `package.json` (already added)
- Check that `prisma` is in `devDependencies` (it is)
- Vercel should auto-generate Prisma client during build

### Database Connection Errors

- Verify `DATABASE_URL` uses connection pooling URL
- Check that your database allows connections from Vercel's IPs
- For Supabase: Make sure you're using the **pooled** connection string, not direct

### Environment Variables Not Working

- Make sure variables are set for the correct environment (Production/Preview)
- Redeploy after adding new environment variables
- Check variable names match exactly (case-sensitive)

### Supabase Storage Not Working

- Verify storage bucket `uploads` exists in Supabase
- Check storage policies allow public read access
- Verify `NEXT_PUBLIC_SUPABASE_URL` and keys are correct

## Next Steps

1. **Set up a custom domain** (optional):
   - Vercel Dashboard → Settings → Domains
   - Add your domain and follow DNS setup instructions

2. **Enable Analytics** (optional):
   - Vercel Dashboard → Analytics
   - Enable Web Analytics for your project

3. **Set up monitoring**:
   - Check Vercel's built-in monitoring
   - Set up error tracking (e.g., Sentry)

## Production Checklist

- [ ] All environment variables set in Vercel
- [ ] Database migrations run on production database
- [ ] Supabase storage bucket created and configured
- [ ] Test authentication flow
- [ ] Test file uploads
- [ ] Verify API routes work
- [ ] Check error logs in Vercel dashboard
- [ ] Set up custom domain (optional)
- [ ] Configure CORS if needed

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Vercel function logs
3. Verify all environment variables are set correctly
4. Ensure database is accessible from Vercel

