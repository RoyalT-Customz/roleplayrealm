# Database Setup Guide

## Using Supabase's Built-in PostgreSQL Database

Since you're using Supabase, you can use their built-in PostgreSQL database. Here's how to get your connection string:

### Step 1: Get Your Database Connection String

1. Go to your Supabase project dashboard
2. Click on **Settings** (gear icon) in the left sidebar
3. Click on **Database** (under Configuration)
4. Scroll down to find **Connection string** or **Connection pooling**
5. You'll see different connection options:
   - **URI** - Direct connection (for migrations)
   - **Connection pooling** - For serverless (recommended for production)

### Step 2: Get the Connection String

Look for the **Connection string** section. You'll see something like:

```
postgresql://postgres:[YOUR-PASSWORD]@db.vsmmckdupahrglrsoyaj.supabase.co:5432/postgres
```

**Important:** You need to replace `[YOUR-PASSWORD]` with your actual database password.

### Step 3: Find Your Database Password

If you don't know your database password:

1. In the Database settings page, look for **Database password**
2. If you set it when creating the project, use that
3. If you forgot it, you can reset it (this will require updating the connection string)

### Step 4: Update Your .env File

Update the `DATABASE_URL` in your `.env` file:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.vsmmckdupahrglrsoyaj.supabase.co:5432/postgres
```

Replace `YOUR_PASSWORD` with your actual database password.

### Step 5: Run Migrations

After updating the DATABASE_URL, run:

```bash
npm run migrate
```

This will create all the database tables.

### Step 6: Seed the Database (Optional)

To add sample data:

```bash
npm run seed
```

## Alternative: Use Connection Pooling (Recommended for Production)

For better performance and connection management, use the connection pooling URL:

1. In Database settings, find **Connection pooling**
2. Use the **Transaction** mode connection string
3. It will look like:
   ```
   postgresql://postgres.vsmmckdupahrglrsoyaj:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

## Troubleshooting

### "Connection refused" error
- Check that your password is correct
- Make sure you're using the right connection string format
- Verify your Supabase project is active

### "Database does not exist" error
- Use `postgres` as the database name (Supabase's default)
- Don't change the database name in the connection string

### "Password authentication failed"
- Reset your database password in Supabase settings
- Update the connection string with the new password

