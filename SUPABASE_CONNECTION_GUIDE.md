# Supabase Connection Guide

Based on the [Supabase documentation](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler), here are your connection options:

## Connection Methods

### 1. Direct Connection (Port 5432)
- **Best for**: Persistent backend services, Prisma migrations
- **Format**: `postgresql://postgres:[PASSWORD]@db.vsmmckdupahrglrsoyaj.supabase.co:5432/postgres`
- **Limitation**: IPv6 only (may not work on all networks)

### 2. Pooler Session Mode (Port 5432)
- **Best for**: Persistent backends that need IPv4 support
- **Format**: `postgres://postgres.vsmmckdupahrglrsoyaj:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`
- **Supports**: Both IPv4 and IPv6

### 3. Pooler Transaction Mode (Port 6543)
- **Best for**: Serverless/edge functions
- **Format**: `postgres://postgres:[PASSWORD]@db.vsmmckdupahrglrsoyaj.supabase.co:6543/postgres`
- **Note**: Does NOT support prepared statements (Prisma uses these, so not ideal for migrations)

## How to Get Your Connection String

1. Go to your Supabase Dashboard
2. Click the **"Connect"** button at the top of the page (not in Settings)
3. You'll see different connection options:
   - **Direct connection** - for IPv6
   - **Session pooler** - for IPv4/IPv6
   - **Transaction pooler** - for serverless (not recommended for Prisma migrations)

## For Prisma Migrations

**Recommended**: Use **Direct connection** or **Session pooler** (not Transaction mode)

Since you're on Windows and having connection issues, try the **Session pooler** connection string.

## Current Issue

Your current connection string format looks correct, but it's not connecting. This could be:
1. IPv6 not supported on your network (try Session pooler instead)
2. Incorrect password
3. Project paused or inactive

## Next Steps

1. Go to Supabase Dashboard
2. Click **"Connect"** button (top of page)
3. Copy the **Session pooler** connection string
4. Update your `.env` file with that connection string

