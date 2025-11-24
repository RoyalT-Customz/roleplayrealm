# Setting Up Admin and Owner Status

This guide explains how to set yourself as the only admin and owner of Roleplay Realm.

## Current Setup

- **Admin Status**: Controlled by the `isAdmin` field in the `users` table
- **Owner Status**: Determined by email address (`kingroyalt.vu@gmail.com`) in `components/layout/Navbar.tsx`

## Method 1: Using the Script (Recommended)

### Local Development

1. Make sure your `.env` file has the correct `DATABASE_URL`
2. Run the script:
   ```bash
   npm run make-admin
   ```

### Production (Vercel)

You have a few options:

#### Option A: Run Locally with Production Database

1. Get your production `DATABASE_URL` from Vercel (Settings → Environment Variables)
2. Temporarily set it in your local `.env` file
3. Run: `npm run make-admin`
4. Remove the production URL from your local `.env` (for safety)

#### Option B: Use Prisma Studio

1. Set your production `DATABASE_URL` in `.env`
2. Run: `npm run db:studio`
3. Find your user by email
4. Check the `isAdmin` checkbox
5. Save

#### Option C: Direct SQL (Supabase Dashboard)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run this SQL (replace with your email):

```sql
-- Remove admin from all users
UPDATE users SET "isAdmin" = false;

-- Set yourself as admin
UPDATE users 
SET "isAdmin" = true 
WHERE email = 'your-email@example.com';
```

## Method 2: Change Owner Email

If you want to use a different email for owner status:

1. Edit `components/layout/Navbar.tsx`
2. Change line 21:
   ```typescript
   const OWNER_EMAIL = 'your-email@example.com'
   ```
3. Commit and redeploy

## Verification

After running the script:

1. Sign in to your application
2. You should see:
   - "Admin" link in the navbar (orange shield icon)
   - "Owners" link in the navbar (yellow crown icon)
3. Visit `/admin` to access the admin dashboard

## Notes

- The script automatically removes admin status from all other users
- Owner status is based on email matching, so make sure you're signed in with the correct email
- If you haven't signed up yet, the script will create your user account automatically

