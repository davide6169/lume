# Deploy Lume on Vercel (User-Configured API Keys)

This guide explains how to deploy Lume on Vercel **without** configuring API keys in the Vercel dashboard. Each user who uses your deployed app will configure their own API keys through the app's settings UI.

## Architecture Overview

```
┌─────────────────┐
│  Vercel Deploy  │
│  (No API Keys)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   User Opens    │
│   the App       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  App Runs in Demo Mode          │
│  (Uses placeholder keys)        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  User Configures Own Keys       │
│  (In Settings UI)               │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  App Uses User's Keys           │
│  (Stored in browser storage)    │
└─────────────────────────────────┘
```

## Benefits

✅ **No API keys on Vercel** - Your deployment doesn't contain any sensitive credentials
✅ **Multi-tenant ready** - Each user can use their own API keys
✅ **Secure by default** - Keys are stored in user's browser (localStorage)
✅ **Demo mode** - App works immediately without configuration

## Deployment Steps

### Step 1: Prepare Your Repository

1. **Ensure `.env.production` is committed** to your repository:
   ```bash
   git add .env.production
   git commit -m "Add production environment template"
   ```

2. **Push to GitHub** (if not already done):
   ```bash
   git push origin main
   ```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and log in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

5. **Environment Variables**:
   - Vercel will automatically load variables from `.env.production`
   - **DO NOT** add any real API keys
   - The placeholder values (starting with `your-`) are intentional!

6. Click **"Deploy"**

### Step 3: Verify Deployment

1. Wait for deployment to complete (2-3 minutes)
2. Visit your deployed URL (e.g., `https://lume-xxx.vercel.app`)
3. The app should load in **Demo Mode** with placeholder keys

### Step 4: User Configuration Flow

When users open your app:

1. **Initial State**: App runs in Demo Mode
   - Uses demo data
   - No real API calls
   - All features visible

2. **User Configures Keys**:
   - User goes to **Settings** → **API Keys**
   - Enters their own API credentials
   - Keys are encrypted and stored in browser

3. **Production Mode**:
   - App uses user's keys for real API calls
   - Data persists in user's Supabase instance
   - Each user has their own isolated environment

## Environment Variables Explained

The `.env.production` file contains **placeholder values** that allow the app to start without real API keys:

```bash
# Placeholder URL structure
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
                           ^^^^^^^^^^^^
                           User replaces this

# Placeholder keys
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
                              ^^^^^^^^
                              User replaces this
```

### How Placeholders Work

The app's configuration system (`lib/config/env.ts`) automatically:

1. **Detects placeholders**: Values starting with `your-` are recognized as placeholders
2. **Enables demo mode**: When placeholders are detected, app runs in demo mode
3. **Prevents crashes**: Supabase clients initialize without errors
4. **Allows configuration**: Users can input real keys through the UI

## Security Considerations

### ✅ What's Secure

- **No keys on server**: Vercel deployment contains no sensitive credentials
- **Client-side storage**: Keys stored in user's browser (localStorage)
- **Encrypted storage**: Keys are encrypted before storing
- **Demo mode safe**: No accidental API calls with invalid credentials

### ⚠️ What Users Should Know

- **Key visibility**: Users' API keys are stored in their browser
- **Shared devices**: Keys are accessible to anyone with browser access
- **Browser sync**: Keys sync across devices if using browser sync
- **Clearing data**: Clearing browser data removes API keys

## Custom Domain (Optional)

To use a custom domain:

1. In Vercel Dashboard, go to **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Update `.env.production`:
   ```bash
   NEXT_PUBLIC_APP_URL=https://your-custom-domain.com
   ```

## Testing the Deployment

### 1. Verify Demo Mode Works

Open your deployed app and verify:
- ✅ App loads without 500 errors
- ✅ Dashboard displays demo data
- ✅ Settings → API Keys section is accessible

### 2. Test User Key Configuration

1. Go to **Settings** → **API Keys**
2. Enter test API credentials
3. Verify keys are saved and persist on refresh
4. Try a production feature (should use real APIs)

### 3. Test Demo → Production Transition

1. Start in demo mode (default)
2. Configure API keys
3. Verify app switches to production mode
4. Verify real API calls work

## Troubleshooting

### Error: "Your project's URL and Key are required"

**Cause**: Supabase client initialization failing

**Solution**:
- Ensure `.env.production` exists in repository
- Verify placeholder values are present
- Check that `lib/config/env.ts` is deployed

### App Shows 500 Error

**Cause**: Missing environment variables

**Solution**:
- Check Vercel build logs
- Ensure all variables from `.env.production` are loaded
- Try redeploying with cleared cache

### Demo Mode Not Working

**Cause**: Placeholders not detected correctly

**Solution**:
- Verify placeholder values start with `your-`
- Check `lib/config/env.ts` has correct detection logic
- Ensure no real keys are accidentally configured

## Multiple User Support

This architecture naturally supports multiple users:

1. **User A** configures their Supabase instance → Uses their data
2. **User B** configures their Supabase instance → Uses their data
3. **User C** stays in demo mode → Uses demo data

Each user's experience is completely isolated based on their configured keys.

## Next Steps

After successful deployment:

1. **Monitor usage**: Check Vercel Analytics
2. **User feedback**: Collect feedback on the key configuration flow
3. **Documentation**: Consider adding user-facing docs
4. **Enhancements**: Add features like key validation, presets, etc.

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Client Setup](https://supabase.com/docs/guides/with-nextjs)

## Support

If you encounter issues:

1. Check the main [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)
2. Review [Lume-Project.md](./Lume-Project.md) for architecture details
3. Open an issue on GitHub with:
   - Vercel deployment URL
   - Error messages
   - Steps to reproduce
