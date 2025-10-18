# Supabase Connection Troubleshooting Guide

This guide helps you solve common issues when connecting to your Supabase database.

## Quick Diagnostics

Run this command to check your configuration:

```bash
./validate-db-connection.sh
```

If the script is not executable, run:
```bash
chmod +x validate-db-connection.sh
./validate-db-connection.sh
```

## Common Issues and Solutions

### Issue 1: "Cannot find password" or "Password not working"

#### Where to Find Your Supabase Database Password

Your Supabase database password is **NOT the same** as your Supabase account password.

**To find it:**

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Select your project (e.g., `bookcraft-ai`)
3. Click **Settings** (gear icon) in the left sidebar
4. Click **Database** in the submenu
5. Scroll to **Connection string** or **Connection info** section
6. You'll see your database password here OR a button to reset it

**If you need to reset it:**

1. In the same location, click **Reset database password**
2. A new password will be generated
3. **Copy it immediately** - you won't see it again!
4. Store it securely (password manager recommended)

#### Project-Specific Information (poyldekwoklkmfnfrnuh)

For your specific project, the connection details are:

- **Project URL:** `https://poyldekwoklkmfnfrnuh.supabase.co`
- **Database Host:** `db.poyldekwoklkmfnfrnuh.supabase.co`
- **Database Port:** `5432`
- **Database Name:** `postgres`
- **Database User:** `postgres`
- **Database Password:** [Find in Supabase Dashboard → Settings → Database]

**Full Connection String Format:**
```
postgresql://postgres:[YOUR_PASSWORD]@db.poyldekwoklkmfnfrnuh.supabase.co:5432/postgres
```

### Issue 2: "Connection refused" or "Could not connect to server"

**Possible causes:**

1. **Inactive project (free tier)** - Supabase pauses projects after 7 days of inactivity
2. **Wrong connection details** - Check your project ID in the URL
3. **Network/firewall issues** - VPN or corporate firewall blocking connections

**Solutions:**

```bash
# Test if project is active
curl https://poyldekwoklkmfnfrnuh.supabase.co

# If you get a response, the project is active
# If you get an error, the project may be paused
```

**To resume a paused project:**
1. Go to your Supabase dashboard
2. Select the project
3. Click "Resume project" if prompted
4. Wait a few minutes for it to start

### Issue 3: "Authentication failed for user postgres"

This means your password is incorrect.

**Solution:**

1. Go to Supabase Dashboard → Settings → Database
2. Click **Reset database password**
3. Copy the new password
4. Update your `.env.local` file:
   ```bash
   DATABASE_URL=postgresql://postgres:NEW_PASSWORD@db.poyldekwoklkmfnfrnuh.supabase.co:5432/postgres
   ```
5. Test the connection again

### Issue 4: "SSL connection is required"

Some PostgreSQL clients require SSL connections.

**Solution:**

Add `?sslmode=require` to your connection string:

```
postgresql://postgres:YOUR_PASSWORD@db.poyldekwoklkmfnfrnuh.supabase.co:5432/postgres?sslmode=require
```

### Issue 5: "VITE_SUPABASE_URL is not defined"

This error occurs when environment variables are not loaded properly.

**For Development:**

1. Make sure `.env.local` exists in your project root
2. Verify it contains:
   ```bash
   VITE_SUPABASE_URL=https://poyldekwoklkmfnfrnuh.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```
3. Restart your development server:
   ```bash
   npm run dev
   ```

**For Production (Vercel):**

1. Go to Vercel Dashboard → Your Project → Settings
2. Click **Environment Variables**
3. Add:
   - `VITE_SUPABASE_URL` = `https://poyldekwoklkmfnfrnuh.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your_anon_key`
4. Redeploy your application

### Issue 6: "Permission denied" or "Row Level Security" errors

This means RLS (Row Level Security) is blocking your queries.

**Solution:**

1. Make sure you're authenticated as the correct user
2. Check that RLS policies are set up correctly
3. Run the migration file to create all policies:
   ```bash
   # In Supabase SQL Editor, run:
   ```
   Then paste the contents of `supabase-schema.sql`

### Issue 7: "Cannot read properties of null (reading 'from')"

This error occurs when the Supabase client is not initialized.

**Solution:**

1. Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
2. Restart your development server
3. Clear browser cache and localStorage:
   ```javascript
   // In browser console:
   localStorage.clear();
   location.reload();
   ```

### Issue 8: "Migration file not found" or "Cannot run migrations"

**Solution Options:**

**Option A: Use Supabase SQL Editor (Easiest)**
1. Go to your Supabase project
2. Click **SQL Editor** in sidebar
3. Create **New query**
4. Copy the contents of `supabase-schema.sql`
5. Paste and click **Run**

**Option B: Use Supabase CLI**
```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref poyldekwoklkmfnfrnuh

# Push migrations
supabase db push
```

**Option C: Use psql (if installed)**
```bash
psql "postgresql://postgres:YOUR_PASSWORD@db.poyldekwoklkmfnfrnuh.supabase.co:5432/postgres" -f supabase-schema.sql
```

## Testing Your Connection

### Test Application Access

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:5173 in your browser

3. Open browser DevTools (F12) and check Console

4. Look for:
   - ✅ No Supabase connection errors
   - ✅ No authentication errors
   - ✅ Successful API requests

### Test Direct Database Access

```bash
# Using psql
psql "postgresql://postgres:YOUR_PASSWORD@db.poyldekwoklkmfnfrnuh.supabase.co:5432/postgres" -c "SELECT version();"

# Using Node.js
node -e "const { createClient } = require('@supabase/supabase-js'); const client = createClient('https://poyldekwoklkmfnfrnuh.supabase.co', 'YOUR_ANON_KEY'); client.from('projects').select('count').then(console.log);"
```

## Still Having Issues?

### Check Supabase Status

- [Supabase Status Page](https://status.supabase.com)
- Check if there are any ongoing incidents

### Verify Your Project Settings

1. Go to Supabase Dashboard
2. Select your project
3. Click **Settings** → **General**
4. Verify:
   - Project is not paused
   - Project ID matches: `poyldekwoklkmfnfrnuh`
   - Region is accessible from your location

### Review Logs

**Application Logs:**
- Browser Console (F12 → Console tab)
- Look for red error messages

**Supabase Logs:**
1. Go to Supabase Dashboard
2. Select your project
3. Click **Logs** in the sidebar
4. Check for errors or authentication failures

### Get Help

If you're still stuck:

1. Check the comprehensive guide: [SUPABASE_DATABASE_SETUP.md](SUPABASE_DATABASE_SETUP.md)
2. Review Supabase documentation: https://supabase.com/docs
3. Check project-specific README: [supabase/README.md](supabase/README.md)

## Quick Reference Commands

```bash
# Check environment variables
cat .env.local | grep SUPABASE

# Validate configuration
./validate-db-connection.sh

# Test connection with curl
curl https://poyldekwoklkmfnfrnuh.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"

# Test database with psql
psql "postgresql://postgres:PASSWORD@db.poyldekwoklkmfnfrnuh.supabase.co:5432/postgres" -c "SELECT 1;"

# Rebuild and restart
npm run build
npm run dev
```

## Security Reminders

- ✅ Never commit `.env.local` to version control
- ✅ Keep your database password secure
- ✅ Use different credentials for development and production
- ✅ Rotate passwords periodically
- ✅ Enable RLS on all tables

---

**Last Updated:** October 2025  
**For More Help:** See [SUPABASE_DATABASE_SETUP.md](SUPABASE_DATABASE_SETUP.md)
