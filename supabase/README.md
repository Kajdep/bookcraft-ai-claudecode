# Supabase Database Configuration

## Quick Start

### Finding Your Database Credentials

1. **Supabase URL and Anon Key** (for application access):
   - Go to [https://supabase.com](https://supabase.com)
   - Select your project
   - Navigate to: **Settings** → **API**
   - Copy:
     - **Project URL** → Use as `VITE_SUPABASE_URL`
     - **anon public key** → Use as `VITE_SUPABASE_ANON_KEY`

2. **Database Password** (for migrations and direct access):
   - In your Supabase project, go to: **Settings** → **Database**
   - Find the **Database password** section
   - If you don't see it, click **Reset database password**
   - Copy the password immediately (it won't be shown again!)

### Your Project Connection String

For this project (ID: `poyldekwoklkmfnfrnuh`):

```
postgresql://postgres:[YOUR_PASSWORD]@db.poyldekwoklkmfnfrnuh.supabase.co:5432/postgres
```

Replace `[YOUR_PASSWORD]` with your actual database password from Supabase dashboard.

## Running Migrations

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Create a new query
4. Copy and paste the contents of `supabase-schema.sql` or migration files
5. Click **Run** to execute

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref poyldekwoklkmfnfrnuh

# Push migrations
supabase db push
```

### Option 3: Using psql

If you have PostgreSQL client installed:

```bash
psql "postgresql://postgres:YOUR_PASSWORD@db.poyldekwoklkmfnfrnuh.supabase.co:5432/postgres" -f supabase-schema.sql
```

## Files in This Directory

- `supabase-schema.sql` - Complete database schema (for reference)
- `migrations/` - Individual migration files
  - `20251013045150_initial_bookcraft_schema.sql` - Initial schema setup

## Environment Variables

### For Local Development

Create `.env.local` in the project root:

```bash
VITE_SUPABASE_URL=https://poyldekwoklkmfnfrnuh.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Optional: for direct database access
DATABASE_URL=postgresql://postgres:your_password@db.poyldekwoklkmfnfrnuh.supabase.co:5432/postgres
```

### For Production (Vercel)

Add these in Vercel dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://poyldekwoklkmfnfrnuh.supabase.co
VITE_SUPABASE_ANON_KEY=<your_anon_key>
```

## Database Schema Overview

The database includes tables for:

- **projects** - User book projects
- **chapters** - Book chapters with content
- **research_items** - Research notes and references
- **plot_points** - Story structure and plot points
- **visuals** - AI-generated diagrams and images
- **materials** - Reference materials and files
- **writing_sessions** - Analytics and tracking
- **writing_goals** - Goal tracking
- **daily_metrics** - Productivity metrics

All tables have:
- Row Level Security (RLS) enabled
- User-specific access policies
- Auto-updating timestamps
- Proper indexes for performance

## Troubleshooting

### "Connection refused" error
- Check if your Supabase project is active (free tier may pause after inactivity)
- Verify your database password is correct
- Try resetting your database password

### "Authentication failed" error
- Your password is incorrect
- Reset your database password in Supabase dashboard

### "SSL connection required" error
Add SSL parameter to connection string:
```
postgresql://postgres:YOUR_PASSWORD@db.poyldekwoklkmfnfrnuh.supabase.co:5432/postgres?sslmode=require
```

## Need More Help?

See the comprehensive guide: [SUPABASE_DATABASE_SETUP.md](../SUPABASE_DATABASE_SETUP.md)

This guide includes:
- Detailed screenshots and step-by-step instructions
- Security best practices
- Troubleshooting for common issues
- Connection string examples
- Testing and verification steps
