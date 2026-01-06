# 🚀 Deploy Lume on Vercel - Quick Start

Deploy Lume **without** configuring any API keys on the server. Each user will configure their own credentials through the app.

## 📋 Prerequisites

- GitHub account with Lume repository
- Vercel account (free tier works)
- No API keys needed on Vercel! ✨

## ⚡ Quick Deploy (5 minutes)

### 1. Push to GitHub

Ensure your code is on GitHub with the new configuration files:
```bash
git add .
git commit -m "Add user-configured API keys system"
git push origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Click **Deploy**

That's it! Vercel will automatically use the `.env.production` file with placeholder values.

### 3. Verify Deployment

1. Wait 2-3 minutes for build to complete
2. Visit your deployed URL
3. App should load in **Demo Mode** ✅

## 🎯 What Happens Next?

When users visit your app:

1. **Demo Mode**: App starts with placeholder keys
2. **User Configuration**: Users add their own API keys in Settings
3. **Production Mode**: App uses user's keys for real data

## 📚 Documentation

For detailed information, see:
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Complete deployment guide
- **[.env.production](./.env.production)** - Production environment template
- **[Docs Page](./app/(dashboard)/docs/page.tsx)** - In-app documentation

## 🔒 Security

✅ **No API keys on server**
✅ **Each user has isolated configuration**
✅ **Keys stored in user's browser (encrypted)**
✅ **Demo mode works without any credentials**

## 🐛 Troubleshooting

### Build fails
- Ensure `.env.production` is in your repository
- Check that `lib/config/env.ts` exists

### 500 error on deploy
- Verify all files were committed
- Check Vercel build logs for specific errors
- Ensure `.env.production` has placeholder values

### App not loading
- Check browser console for errors
- Verify deployment completed successfully
- Try clearing browser cache

## 🎉 Success!

Your Lume app is now live! Users can:
- Explore in Demo Mode immediately
- Configure their own API keys
- Use production features with their credentials

**Next Steps:**
- Share the URL with your team
- Customize your domain (optional)
- Monitor usage in Vercel Dashboard

---

**Need Help?** Check the [complete deployment guide](./VERCEL_DEPLOYMENT.md)
