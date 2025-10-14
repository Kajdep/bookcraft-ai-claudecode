# Quick Start: Storage & Sync Setup

## What's Included

Your WrittenUpAi app now has **three storage systems**:

1. **✅ Local Storage (IndexedDB)** - Already working! No setup needed
2. **✅ Cloud Sync (Supabase)** - Already configured! Just sign up
3. **⚙️ Google Drive Backup** - Requires setup (optional)

---

## Immediate Use (No Setup)

**Local Storage works right now:**
- All data saved to browser IndexedDB
- Works offline
- Instant saves
- No account needed

---

## Cloud Sync (2 minutes)

**What you get:**
- Automatic cloud backup every 30 seconds
- Access from multiple devices
- Never lose your work

**Setup Steps:**

### 1. Just Use the App!
The Supabase connection is already configured. You'll see:
- Login/Register screen on first visit
- Create account with email/password
- Start writing immediately
- Auto-sync happens in background

### 2. Verify Sync
Look for sync indicator in header:
- **Green checkmark** = Synced
- **Blue arrow** = Syncing
- Click it to force manual sync

**That's it!** Cloud sync is now active.

---

## Google Drive Backup (Optional, 10 minutes)

**What you get:**
- Manual backup to your personal Google Drive
- Full project exports in JSON
- Extra safety net

**Setup Steps:**

### 1. Create Google Cloud Project
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project"
3. Name it "WrittenUpAi Backup"
4. Click "Create"

### 2. Enable Drive API
1. Go to "APIs & Services" > "Library"
2. Search "Google Drive API"
3. Click "Enable"

### 3. Create OAuth Client
1. Go to "APIs & Services" > "Credentials"
2. Click "Configure Consent Screen"
   - Choose "External"
   - App name: "WrittenUpAi"
   - Your email for support
   - Save
3. Click "Create Credentials" > "OAuth client ID"
   - Type: "Web application"
   - Add Authorized JavaScript origin: `http://localhost:5173`
   - Add your production URL if deployed
   - Click "Create"
4. **Copy the Client ID**

### 4. Create API Key
1. Click "Create Credentials" > "API key"
2. **Copy the API Key**
3. Click "Restrict Key":
   - API restrictions: Google Drive API
   - Save

### 5. Add to Environment
Edit `.env` file:
```bash
VITE_GDRIVE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
VITE_GDRIVE_API_KEY=YOUR_API_KEY_HERE
```

### 6. Use in App
1. Refresh the app
2. Click sync indicator in header
3. Click "Backup to Drive"
4. Authorize access (first time only)
5. Done! Your projects are backed up

---

## Quick Comparison

| Feature | Local | Supabase | Google Drive |
|---------|-------|----------|--------------|
| Setup Time | 0 min | 0 min | 10 min |
| Works Offline | ✅ Yes | ❌ No | ❌ No |
| Multi-Device | ❌ No | ✅ Yes | ⚠️ Manual |
| Auto-Sync | N/A | ✅ 30s | ❌ Manual |
| Storage Limit | 50MB | 500MB | 15GB |
| Cost | Free | Free | Free |
| Account Needed | ❌ No | ✅ Yes | ✅ Yes |

---

## Recommended Setup

**For Solo Writing (Local Only):**
- Nothing to configure
- Just start writing
- Data stays in browser

**For Multi-Device (Cloud Sync):**
- Create account in app
- Auto-sync enabled
- Access anywhere

**For Maximum Safety (All Three):**
- Use Local + Cloud Sync normally
- Manual Google Drive backup weekly
- Triple redundancy

---

## Testing Your Setup

### Test Local Storage
1. Create a test project
2. Write some text
3. Refresh browser
4. Text should remain ✅

### Test Cloud Sync
1. Sign up/login
2. Check sync indicator shows green
3. Open app on different device (or incognito)
4. Login with same account
5. Projects should appear ✅

### Test Google Drive
1. Configure credentials
2. Click "Backup to Drive"
3. Authorize access
4. Visit [Google Drive](https://drive.google.com)
5. Look for "WrittenUpAi_Backups" folder ✅

---

## Common Issues

**"Sync indicator shows offline"**
- Check internet connection
- Verify signed in to app
- Try manual sync

**"Google Drive authorization fails"**
- Check Client ID and API Key in `.env`
- Verify authorized origins include your URL
- Disable popup blocker

**"Projects not syncing between devices"**
- Sign in with same account on both
- Wait for sync (green checkmark)
- Try manual sync if needed

---

## Next Steps

✅ **All done!** Your storage is configured.

**Recommended:**
1. Write some test content
2. Verify sync works
3. Create first real project
4. Set up weekly Google Drive backup routine

**Learn More:**
- Read `STORAGE_AND_SYNC_GUIDE.md` for advanced features
- Check `README.md` for app usage
- See `COMPLETE_FEATURE_GUIDE.md` for all features

---

## Summary

- **Local storage:** Works immediately
- **Cloud sync:** Sign up and write
- **Google Drive:** 10 minute setup for extra safety

Your writing is protected! 🎉
