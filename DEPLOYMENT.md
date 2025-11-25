# 🚀 Deployment Guide

## Prerequisites

1. **GitHub Account** - Code repository
2. **Vercel Account** - Frontend hosting (free)
3. **Render Account** - Backend hosting (free)
4. **MongoDB Atlas** - Database (free)
5. **Cloudinary Account** - File storage (free)

---

## Step 1: Setup MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create new cluster (M0 Free tier)
4. Create database user
5. Whitelist IP: `0.0.0.0/0` (allow all)
6. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/chat?retryWrites=true&w=majority
   ```

---

## Step 2: Setup Cloudinary

1. Go to https://cloudinary.com/
2. Create free account
3. Get credentials from Dashboard:
   - Cloud Name
   - API Key
   - API Secret

---

## Step 3: Deploy Backend to Render

### 3.1. Push code to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 3.2. Deploy on Render

1. Go to https://render.com/
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Select `backend` folder as root directory
6. Configure:
   - **Name:** chad-backend
   - **Region:** Singapore
   - **Branch:** main
   - **Root Directory:** backend
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

### 3.3. Add Environment Variables

In Render dashboard, add these environment variables:

```env
NODE_ENV=production
PORT=10000
MONGODB_CONNECTIONSTRING=<your_mongodb_atlas_connection_string>
ACCESS_TOKEN_SECRET=<generate_random_string_64_chars>
JWT_SECRET=<generate_random_string_64_chars>
CLIENT_URL=<your_vercel_frontend_url>
FRONTEND_URL=<your_vercel_frontend_url>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>

# Google OAuth (optional)
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
GOOGLE_CALLBACK_URL=<your_render_url>/api/auth/google/callback
```

**Generate secrets:**
```bash
# On Linux/Mac
openssl rand -base64 64

# On Windows PowerShell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3.4. Deploy

Click "Create Web Service" and wait for deployment.

Your backend URL will be: `https://chad-backend.onrender.com`

---

## Step 4: Deploy Frontend to Vercel

### 4.1. Deploy on Vercel

1. Go to https://vercel.com/
2. Sign up with GitHub
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** frontend
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### 4.2. Add Environment Variables

In Vercel dashboard → Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://chad-backend.onrender.com
```

### 4.3. Deploy

Click "Deploy" and wait.

Your frontend URL will be: `https://your-app.vercel.app`

---

## Step 5: Update Backend Environment Variables

Go back to Render dashboard and update:

```env
CLIENT_URL=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
```

Then click "Manual Deploy" → "Deploy latest commit"

---

## Step 6: Update OAuth Redirect URLs

### Google OAuth

1. Go to https://console.cloud.google.com/
2. Select your project
3. Go to "Credentials"
4. Edit OAuth 2.0 Client
5. Add Authorized redirect URIs:
   ```
   https://chad-backend.onrender.com/api/auth/google/callback
   ```
6. Add Authorized JavaScript origins:
   ```
   https://your-app.vercel.app
   ```

---

## Step 7: Test Deployment

1. Visit your Vercel URL
2. Try to sign up/login
3. Test messaging
4. Test file upload
5. Test voice/video calls (requires HTTPS ✅)

---

## 🔧 Troubleshooting

### Backend not connecting to MongoDB
- Check MongoDB Atlas IP whitelist
- Check connection string format
- Check database user permissions

### CORS errors
- Check `CLIENT_URL` and `FRONTEND_URL` in backend env
- Make sure URLs don't have trailing slash

### File upload not working
- Check Cloudinary credentials
- Check logs in Render dashboard

### Calls not working
- HTTPS is required for WebRTC ✅ (Vercel provides HTTPS)
- Check browser permissions
- May need TURN server for production

---

## 📊 Free Tier Limits

### Render (Backend)
- ✅ 750 hours/month
- ✅ Sleeps after 15 min inactivity
- ✅ Wakes up on request (cold start ~30s)

### Vercel (Frontend)
- ✅ 100 GB bandwidth/month
- ✅ Unlimited requests
- ✅ Always on (no sleep)

### MongoDB Atlas
- ✅ 512 MB storage
- ✅ Shared cluster

### Cloudinary
- ✅ 25 GB storage
- ✅ 25 GB bandwidth/month

---

## 🚀 Post-Deployment

### Custom Domain (Optional)

**Vercel:**
1. Go to Settings → Domains
2. Add your domain
3. Update DNS records

**Render:**
1. Go to Settings → Custom Domain
2. Add your domain
3. Update DNS records

### Monitoring

- **Render:** Built-in logs and metrics
- **Vercel:** Analytics dashboard
- **MongoDB Atlas:** Monitoring tab

### Scaling

When you outgrow free tier:
- Render: Upgrade to Starter ($7/month)
- Vercel: Pro plan ($20/month)
- MongoDB Atlas: M10 cluster ($0.08/hour)

---

## 🔐 Security Checklist

- ✅ All secrets in environment variables
- ✅ `.env` files in `.gitignore`
- ✅ HTTPS enabled
- ✅ CORS configured
- ✅ Rate limiting enabled
- ✅ Helmet security headers
- ✅ Input validation

---

## 📝 Notes

- First request to Render may be slow (cold start)
- WebRTC calls work on HTTPS ✅
- Consider TURN server for better call quality
- Monitor free tier usage

---

**Deployment Date:** November 24, 2025
**Status:** Ready to Deploy 🚀
