# Free Deployment Guide for Snappy Chat

## Overview
Deploy your MERN stack chat application for free using:
- **Frontend**: Vercel or Netlify (free)
- **Backend**: Render or Railway (free tier)
- **Database**: MongoDB Atlas (free tier)

---

## Prerequisites
1. GitHub account
2. MongoDB Atlas account (free)
3. Vercel/Render/Railway accounts (free)

---

## Step 1: Prepare Your Code

### 1.1 Update Environment Variables

**Server (`server/.env`):**
```env
PORT=3001
NODE_ENV=production
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_strong_random_secret
FRONTEND_URL=https://your-frontend.vercel.app
```

**Client (`cHat/.env`):**
```env
VITE_API_URL=https://your-backend.onrender.com
VITE_APP_NAME=Snappy Chat
VITE_APP_VERSION=1.0.0
```

### 1.2 Add Build Script to Server
Update `server/package.json`:
```json
{
  "scripts": {
    "start": "node index.js",
    "build": "echo 'No build step for server'"
  }
}
```

---

## Step 2: Deploy MongoDB (Free)

### 2.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas/database)
2. Sign up for free account
3. Create a free cluster (select AWS, Google, or Azure)
4. Choose a region close to your users

### 2.2 Configure Network Access
1. Go to **Network Access** → **Add IP Address**
2. Select **Allow Access from Anywhere** (0.0.0.0/0) for development
3. Click **Confirm**

### 2.3 Create Database User
1. Go to **Database Access** → **Add New Database User**
2. Set username and password
3. Grant **Read and Write to any database** role

### 2.4 Get Connection String
1. Click **Database** → **Connect** → **Connect your application**
2. Copy the connection string
3. Replace `<password>` with your database user password

---

## Step 3: Deploy Backend (Free Options)

### Option A: Render (Recommended - Free)

1. **Create Render Account**
   - Go to [Render](https://render.com)
   - Sign up with GitHub

2. **Create Web Service**
   - Click **New** → **Web Service**
   - Connect your GitHub repository
   - Select the `server` folder or root directory

3. **Configure Service**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add all variables from `server/.env`

4. **Deploy**
   - Click **Create Web Service**
   - Wait for deployment (free tier may take a few minutes)

5. **Get Backend URL**: `https://your-service-name.onrender.com`

### Option B: Railway

1. **Create Railway Account**
   - Go to [Railway](https://railway.app)
   - Sign up with GitHub

2. **Deploy**
   - Click **New Project** → **Deploy from GitHub repo**
   - Select your repository
   - Select the `server` folder

3. **Configure**
   - Add environment variables in Railway dashboard
   - Set `PORT` to `3001`

4. **Get Backend URL**: `https://your-project.up.railway.app`

---

## Step 4: Deploy Frontend (Free)

### Option A: Vercel (Recommended)

1. **Create Vercel Account**
   - Go to [Vercel](https://vercel.com)
   - Sign up with GitHub

2. **Deploy**
   - Click **Add New** → **Project**
   - Select your GitHub repository
   - Select the `cHat` folder as root directory

3. **Configure**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**: Add `VITE_API_URL=https://your-backend-url.com`

4. **Deploy**
   - Click **Deploy**
   - Get frontend URL: `https://your-app.vercel.app`

### Option B: Netlify

1. **Create Netlify Account**
   - Go to [Netlify](https://netlify.com)
   - Sign up with GitHub

2. **Deploy**
   - Click **Add new site** → **Import an existing project**
   - Select your GitHub repository
   - Select the `cHat` folder

3. **Configure**
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Environment Variables**: Add `VITE_API_URL=https://your-backend-url.com`

4. **Deploy**
   - Click **Deploy site**
   - Get frontend URL: `https://your-site.netlify.app`

---

## Step 5: Update CORS and Environment

### 5.1 Update Server CORS
Edit `server/index.js`:
```javascript
const corsOptions = {
    origin: ['https://your-frontend.vercel.app', 'https://your-frontend.netlify.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
```

### 5.2 Update Frontend API URL
Edit `cHat/.env`:
```env
VITE_API_URL=https://your-backend-service.onrender.com
```

### 5.3 Rebuild and Redeploy
1. Commit and push changes to GitHub
2. Both frontend and backend will automatically redeploy

---

## Step 6: Verify Deployment

1. Open your frontend URL
2. Test registration/login
3. Test sending messages
4. Check browser console for errors

---

## Cost Summary

| Service | Free Tier | Limitations |
|---------|-----------|-------------|
| MongoDB Atlas | 512 MB storage | Limited compute |
| Render | 750 hours/month | Sleeps after 15 min inactivity |
| Railway | $5 credit/month | Limited hours |
| Vercel | 100 GB bandwidth | Bandwidth limit |
| Netlify | 100 GB bandwidth | Build minutes limit |

---

## Troubleshooting

### Backend not starting
- Check logs in Render/Railway dashboard
- Ensure all environment variables are set
- Verify MongoDB connection string

### CORS errors
- Update `corsOptions.origin` in `server/index.js`
- Add your frontend URL to allowed origins

### WebSocket issues
- Ensure `socket.io` CORS is configured
- Check for HTTPS mixed content errors

---

## Alternative: Coolify (Self-Hosted Free)

If you have a Linux server, consider [Coolify](https://coolify.io):
- Free, open-source alternative
- Deploys to your own server
- Includes database management

```bash
# Install Coolify on your server
docker run -d --pull always --name coolify -p 8000:8000 -p 80:80 -p 443:443 coolifyio/self-hosted
```

---

## Quick Commands

```bash
# Build frontend
cd cHat
npm run build

# Test backend locally with production settings
cd server
npm start
```

---

## Next Steps for Production

1. **Custom Domain**: Connect your own domain (free on most platforms)
2. **HTTPS**: Automatic SSL certificates
3. **Monitoring**: Use free monitoring tools
4. **Backups**: Configure MongoDB Atlas backups
