# Vercel Deployment Configuration Guide

## Overview
This guide explains how to configure environment variables in Vercel for successful deployment of BookCraft AI.

## Build Status
✅ **Local build successful** - All import/export issues have been resolved.

## Required Environment Variables

To complete the deployment, you need to add the following environment variables in your Vercel project settings:

### 1. OpenRouter API Key
```
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```
- **Purpose**: Required for AI text generation features (content generation, suggestions, etc.)
- **Where to get**: Sign up at https://openrouter.ai/ and create an API key
- **Note**: This key should be kept secret and never committed to the repository

### 2. Gemini API Key  
```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```
- **Purpose**: Required for Google's Gemini AI features (if used)
- **Where to get**: Get from Google AI Studio at https://makersuite.google.com/app/apikey
- **Note**: This key should be kept secret and never committed to the repository

### 3. Supabase Configuration (Optional for Cloud Sync)
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
- **Purpose**: Required for cloud storage and sync features
- **Where to get**: Create a project at https://supabase.com/ and find these in project settings
- **Note**: If not provided, app will work in local-only mode (IndexedDB)

## How to Add Environment Variables in Vercel

### Option 1: Via Vercel Dashboard (Recommended)
1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project (bookcraft-ai-claudecode)
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Key**: Enter the variable name (e.g., `VITE_OPENROUTER_API_KEY`)
   - **Value**: Paste your API key
   - **Environment**: Select all (Production, Preview, Development)
5. Click **Save**
6. Trigger a new deployment:
   - Go to **Deployments** tab
   - Click the **...** menu on the latest deployment
   - Select **Redeploy**

### Option 2: Via Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link your project (if not already linked)
vercel link

# Add environment variables
vercel env add VITE_OPENROUTER_API_KEY
# (Enter your key when prompted)

vercel env add VITE_GEMINI_API_KEY
# (Enter your key when prompted)

# Add Supabase variables if using cloud sync
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Redeploy
vercel --prod
```

## Security Best Practices

### DO ✅
- Store API keys in Vercel environment variables
- Use `.env.local` for local development (already in .gitignore)
- Rotate keys periodically
- Monitor API usage and set up billing alerts

### DON'T ❌
- Never commit API keys to the repository
- Never share API keys in issue trackers or public forums
- Never hardcode keys in source code
- Don't use production keys for development

## Verifying Deployment

After adding environment variables and redeploying:

1. Check the **Deployments** tab for build status
2. Look for **"Build successful"** message
3. Visit your deployed URL (e.g., `https://bookcraft-ai.vercel.app`)
4. Test basic functionality:
   - Create a new project
   - Try generating content with AI
   - Check if sync works (if Supabase configured)

## Troubleshooting

### Build Still Fails After Adding Environment Variables
- Double-check variable names (they're case-sensitive!)
- Ensure all required variables are set for all environments
- Clear Vercel's build cache: Settings → General → Clear Cache

### Environment Variables Not Working
- Make sure variable names start with `VITE_` prefix (required for Vite)
- Redeploy after adding/changing variables (they don't apply to existing deployments)
- Check Vercel deployment logs for specific errors

### API Calls Failing
- Verify API keys are valid and active
- Check API rate limits and quotas
- Review browser console for error messages
- Check Vercel function logs if using serverless functions

## Build Fixes Applied

The following issues have been resolved in the codebase:

### 1. Fixed syncEngine Import Issues
**Problem**: `storageService.ts` was calling non-existent functions:
- `syncEngine.syncProject()`
- `syncEngine.syncChapter()`
- `syncEngine.syncResearchItem()`
- `syncEngine.syncMaterial()`
- `syncEngine.syncAll()`

**Solution**: Replaced with the actual exported function:
```typescript
await syncEngine.performSync()
```

Individual item sync will be implemented in a future update. Currently, full sync is triggered on intervals.

### 2. Added GrammarCheckerPanel Component
**Problem**: Component was imported but the file was empty, causing build failure.

**Solution**: Created a placeholder component that displays "Coming soon" message. Will be implemented with grammar checking service integration in the future.

## Next Steps

1. ✅ Add environment variables to Vercel (as described above)
2. ✅ Redeploy the project
3. ✅ Test the deployment
4. 📋 Optional: Set up Supabase for cloud sync
5. 📋 Optional: Configure custom domain
6. 📋 Monitor usage and performance

## Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vite Environment Variables Guide](https://vitejs.dev/guide/env-and-mode.html)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Google AI Documentation](https://ai.google.dev/tutorials/get_started_web)
- [Supabase Documentation](https://supabase.com/docs)

## Support

If you encounter any issues:
1. Check Vercel deployment logs
2. Review browser console errors
3. Verify all environment variables are set correctly
4. Ensure API keys are valid and have sufficient quota

---

Last Updated: January 2025
