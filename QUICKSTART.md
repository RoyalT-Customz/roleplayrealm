
# Quick Start Guide

Get Roleplay Realm up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- PostgreSQL database (local or remote)
- Supabase account (free tier works)

## Step 1: Install Dependencies

```bash
pnpm install
```

## Step 2: Set Up Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your values:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL`: From Supabase dashboard
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: From Supabase dashboard
- `SUPABASE_SERVICE_ROLE_KEY`: From Supabase dashboard

## Step 3: Set Up Database

```bash
# Create database schema
pnpm migrate

# Seed with sample data
pnpm seed
```

## Step 4: Set Up Supabase Storage

1. Go to your Supabase project dashboard
2. Navigate to Storage
3. Create a new bucket named `uploads`
4. Make it public (or set up RLS policies)
5. Add this policy (SQL Editor):

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');
```

## Step 5: Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## First Steps

1. **Sign Up**: Create an account at `/auth/signup`
2. **Create a Post**: Click "Create Post" on the home page
3. **Browse Servers**: Check out `/servers` for server listings
4. **Explore Marketplace**: Visit `/marketplace` for scripts and assets

## Admin Access

To make a user an admin, update the database:

```sql
UPDATE users SET "isAdmin" = true WHERE email = 'your-email@example.com';
```

Then access the admin dashboard at `/admin`.

## Troubleshooting

### Database Connection Error
- Check your `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Verify network access if using remote database

### Supabase Auth Not Working
- Verify your Supabase URL and keys
- Check Supabase project is active
- Ensure email confirmation is disabled (or verify your email)

### Uploads Not Working
- Check Supabase Storage bucket exists
- Verify storage policies are set correctly
- Check browser console for errors

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && pnpm install`

## Next Steps

- Read the [README.md](./README.md) for full documentation
- Check [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for extending the app
- Review [API_EXAMPLES.md](./API_EXAMPLES.md) for API usage

## Need Help?

- Check existing GitHub issues
- Review the documentation files
- Open a new issue if needed

Happy coding! 🚀

