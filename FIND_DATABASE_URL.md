# How to Find Your Supabase Database Connection String

## Method 1: Direct Connection String (for migrations)

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click on your project: **Roleplay Realm**
3. In the left sidebar, click **Settings** (gear icon at the bottom)
4. Click **Database** (under "Configuration" section)
5. Scroll down to find **Connection string** section
6. Look for **URI** tab (not "JDBC" or "Golang")
7. You'll see something like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.vsmmckdupahrglrsoyaj.supabase.co:5432/postgres
   ```
8. Replace `[YOUR-PASSWORD]` with your actual database password

## Method 2: Connection Pooling (Alternative)

1. Same steps 1-4 as above
2. Look for **Connection pooling** section (below Connection string)
3. Click on **Transaction** mode
4. Copy that connection string
5. It will look like:
   ```
   postgresql://postgres.vsmmckdupahrglrsoyaj:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

## Method 3: Find Your Database Password

If you don't know your password:

1. Go to Settings → Database
2. Look for **Database password** section
3. If you see "Reset database password" button, you may need to reset it
4. **Important**: If you reset it, you'll need to update the connection string with the new password

## Method 4: Use Supabase's Built-in Connection Info

1. Go to Settings → Database
2. Look for **Connection info** or **Connection parameters**
3. You should see:
   - Host: `db.vsmmckdupahrglrsoyaj.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - User: `postgres`
   - Password: (your password)

Then construct the URL manually:
```
postgresql://postgres:YOUR_PASSWORD@db.vsmmckdupahrglrsoyaj.supabase.co:5432/postgres
```

## Quick Test

If you can't find it, we can try using Prisma's `db push` command instead of migrations, which might work better with Supabase.

