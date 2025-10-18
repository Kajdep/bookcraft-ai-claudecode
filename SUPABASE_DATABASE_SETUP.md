# Supabase Database Setup Guide

## Overview
This guide explains how to set up your Supabase database connection for BookCraft AI, including how to find your database password and configure both application access and direct database access.

## Two Types of Supabase Access

### 1. Application Access (Client SDK)
Used by the BookCraft AI web application to access Supabase from the browser.

**Required Environment Variables:**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Direct Database Access (PostgreSQL)
Used for running migrations, database administration, and direct SQL queries.

**Connection String Format:**
```
postgresql://postgres:[YOUR_PASSWORD]@db.poyldekwoklkmfnfrnuh.supabase.co:5432/postgres
```

## How to Find Your Supabase Database Password

### Step 1: Access Your Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project: `bookcraft-ai` (or your project name)

### Step 2: Locate Database Credentials

#### Option A: From Project Settings
1. In your Supabase project dashboard, click **Settings** (gear icon in the left sidebar)
2. Navigate to **Database** section
3. Scroll down to **Connection string** or **Connection info**
4. You'll see several connection strings and the database password

#### Option B: From Database Settings
1. In your Supabase project dashboard, click **Settings**
2. Click **Database** in the left submenu
3. Find the **Connection pooling** section
4. Look for **Database password** - it may be shown or have a "Reset" button

#### Option C: From API Settings (for ANON key)
1. Go to **Settings** → **API**
2. Find your **Project URL** (this is your `VITE_SUPABASE_URL`)
3. Find your **anon public** key (this is your `VITE_SUPABASE_ANON_KEY`)

### Step 3: Reset Password (If Needed)

If you can't find your database password or need to reset it:

1. Go to **Settings** → **Database**
2. Find the **Database Password** section
3. Click **Reset database password**
4. Copy the new password immediately (it won't be shown again!)
5. Store it securely (e.g., in a password manager)

**⚠️ Important:** Resetting the database password will affect all applications using direct PostgreSQL connections.

## Connection String Examples

### For Your Project (poyldekwoklkmfnfrnuh)

Based on your project ID, your connection details are:

**Project URL:**
```
https://poyldekwoklkmfnfrnuh.supabase.co
```

**Database Host:**
```
db.poyldekwoklkmfnfrnuh.supabase.co
```

**Full PostgreSQL Connection String:**
```
postgresql://postgres:[YOUR_PASSWORD]@db.poyldekwoklkmfnfrnuh.supabase.co:5432/postgres
```

Replace `[YOUR_PASSWORD]` with your actual database password from Supabase dashboard.

## Setting Up Environment Variables

### For Local Development

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```bash
   # Supabase Configuration (for application access)
   VITE_SUPABASE_URL=https://poyldekwoklkmfnfrnuh.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   
   # Optional: Direct database connection (for migrations)
   DATABASE_URL=postgresql://postgres:your_password@db.poyldekwoklkmfnfrnuh.supabase.co:5432/postgres
   ```

3. Never commit `.env.local` to version control (already in `.gitignore`)

### For Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

   ```
   VITE_SUPABASE_URL = https://poyldekwoklkmfnfrnuh.supabase.co
   VITE_SUPABASE_ANON_KEY = <your_anon_key>
   ```

4. Click **Save** and **Redeploy**

## Running Database Migrations

Once you have your database password, you can run migrations:

### Using Supabase CLI

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref poyldekwoklkmfnfrnuh
   ```

4. Run migrations:
   ```bash
   supabase db push
   ```

### Using SQL Editor (Web UI)

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Create a **New query**
4. Paste the contents of `supabase-schema.sql` or individual migration files
5. Click **Run** to execute

### Using psql Command Line

If you have PostgreSQL client installed:

```bash
psql "postgresql://postgres:YOUR_PASSWORD@db.poyldekwoklkmfnfrnuh.supabase.co:5432/postgres" -f supabase-schema.sql
```

## Verifying Your Setup

### Test Application Access

Run the development server and check the browser console:

```bash
npm run dev
```

In your browser console, you should see:
- No Supabase connection errors
- Successful authentication (if configured)
- Data syncing working (if you have data)

### Test Direct Database Access

Using psql:
```bash
psql "postgresql://postgres:YOUR_PASSWORD@db.poyldekwoklkmfnfrnuh.supabase.co:5432/postgres" -c "SELECT version();"
```

This should return the PostgreSQL version if successful.

## Security Best Practices

### ✅ DO:
- Store database password in a secure password manager
- Use environment variables for all credentials
- Keep `.env.local` in `.gitignore`
- Use separate credentials for development and production
- Rotate passwords periodically
- Enable Row Level Security (RLS) on all tables

### ❌ DON'T:
- Never commit passwords to version control
- Never share database passwords in chat/email
- Never hardcode credentials in source code
- Never use production credentials in development
- Never disable RLS without good reason

## Troubleshooting

### Issue: "Connection refused" or "Could not connect to server"

**Possible causes:**
- Incorrect database password
- Database host is wrong
- Firewall/network issues
- Supabase project is paused (free tier inactivity)

**Solutions:**
1. Verify your password is correct
2. Check if your Supabase project is active (may be paused after inactivity)
3. Try resetting your database password
4. Check Supabase status page: [https://status.supabase.com](https://status.supabase.com)

### Issue: "Authentication failed for user postgres"

**Solution:**
- Your password is incorrect
- Reset your database password in Supabase dashboard
- Update your connection string with the new password

### Issue: "SSL connection is required"

**Solution:**
Add SSL parameters to your connection string:
```
postgresql://postgres:YOUR_PASSWORD@db.poyldekwoklkmfnfrnuh.supabase.co:5432/postgres?sslmode=require
```

### Issue: "Permission denied" or RLS errors

**Solution:**
1. Check that RLS policies are configured correctly
2. Verify your user has the necessary permissions
3. Review the RLS policies in `supabase-schema.sql`
4. Test with a Supabase admin user first

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Database Settings](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)

## Quick Reference

### Your Supabase Project Details

```
Project ID: poyldekwoklkmfnfrnuh
Project URL: https://poyldekwoklkmfnfrnuh.supabase.co
Database Host: db.poyldekwoklkmfnfrnuh.supabase.co
Database Name: postgres
Database User: postgres
Database Port: 5432
```

### Files in This Repository

- `supabase-schema.sql` - Complete database schema
- `supabase/migrations/` - Individual migration files
- `.env.example` - Environment variable template
- `SUPABASE_PERSISTENCE_IMPLEMENTATION.md` - Implementation details

## Next Steps

1. ✅ Find your database password in Supabase dashboard
2. ✅ Update `.env.local` with your credentials
3. ✅ Run database migrations using SQL Editor or CLI
4. ✅ Test the application locally
5. ✅ Add environment variables to Vercel (for production)
6. ✅ Deploy and test in production

---

**Last Updated:** October 2025  
**For Support:** Check Supabase dashboard and documentation
