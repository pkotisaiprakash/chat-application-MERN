# 🚀 Deploy Snappy Chat for Free with Custom Domain

This guide covers deploying your Snappy Chat application for free using Vercel (frontend) and Render/Railway (backend), plus setting up a custom domain.

## Option 1: Vercel + Render (Recommended)

### Part 1: Deploy Backend on Render

1. **Create a Render account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/snappy-chat.git
   git push -u origin main
   ```

3. **Create a Web Service on Render**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: snappy-chat-api
     - **Branch**: main
     - **Build Command**: `npm install`
     - **Start Command**: `node index.js`
     - **Root Directory**: server

4. **Add Environment Variables**
   - Go to "Environment" tab
   - Add these variables:
   ```
   PORT=10000
   NODE_ENV=production
   MONGO_URI=your-mongodb-atlas-connection-string
   JWT_SECRET=your-super-secure-jwt-secret
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=noreply@gmail.com
   FRONTEND_URL=https://yourdomain.com
   ```

5. **Create Database**
   - Render offers free MongoDB or use MongoDB Atlas
   - For MongoDB Atlas: Create free cluster at [mongodb.com](https://mongodb.com)
   - Get connection string and add to MONGO_URI

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your API will be at: `https://snappy-chat-api.onrender.com`

---

### Part 2: Deploy Frontend on Vercel

1. **Create a Vercel account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import your project**
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Configure:
     - **Root Directory**: cHat
     - **Framework Preset**: Vite

3. **Add Environment Variables**
   - Go to "Environment Variables"
   - Add:
   ```
   VITE_API_URL=https://your-render-api-url.onrender.com
   VITE_APP_NAME=Snappy Chat
   VITE_ENABLE_ANIMATIONS=true
   ```

4. **Deploy**
   - Click "Deploy"
   - Your site will be at: `https://snappy-chat.vercel.app`

---

## Option 2: Vercel + Railway

### Deploy Backend on Railway

1. **Create Railway account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Configure:
     - **Root Directory**: server
     - **Start Command**: `node index.js`

3. **Add Environment Variables**
   - Go to "Variables" tab
   - Add all server environment variables

4. **Deploy MongoDB**
   - Click "New" → "Database" → "MongoDB"
   - Copy connection string to MONGO_URI

---

## Option 3: Single Backend on Railway (Monorepo)

Railway supports monorepos - deploy both frontend and backend together:

1. **Create railway.json in root**
   ```json
   {
     "$schema": "https://railway.app/railway.json",
     "build": {
       "nixpacks": "nodejs"
     },
     "deploy": {
       "startCommand": "cd server && node index.js",
       "restartPolicy": "always"
     }
   }
   ```

2. **Update server/index.js to serve static files**
   ```javascript
   const path = require('path');
   
   if (process.env.NODE_ENV === 'production') {
     app.use(express.static(path.join(__dirname, '../cHat/dist')));
     app.get('*', (req, res) => {
       res.sendFile(path.join(__dirname, '../cHat/dist/index.html'));
     });
   }
   ```

3. **Deploy entire project to Railway**

---

## 🌍 Setting Up Custom Domain

### On Vercel (Frontend)

1. **Go to your Vercel project**
   - Navigate to "Settings" → "Domains"

2. **Add your domain**
   - Enter your custom domain (e.g., `chat.yourdomain.com`)
   - Click "Add"

3. **Configure DNS**

   **If using Cloudflare:**
   - Add a CNAME record:
     - Type: CNAME
     - Name: chat
     - Target: cname.vercel-dns.com

   **If using Namecheap:**
   - Add CNAME record:
     - Type: CNAME
     - Host: chat
     - Value: alias..vercel-sites.com

   **If using GoDaddy:**
   - Add CNAME record:
     - Type: CNAME
     - Name: chat
     - Value: cname.vercel-dns.com

4. **Wait for DNS propagation** (up to 24 hours, usually minutes)

### On Render/Railway (Backend)

1. **On Render:**
   - Go to your web service → "Settings"
   - Scroll to "Custom Domain"
   - Add your API subdomain (e.g., `api.yourdomain.com`)
   - Add CNAME record pointing to `snappy-chat-api.onrender.com`

2. **On Railway:**
   - Go to your project → "Settings" → "Domains"
   - Add custom domain
   - Configure DNS

### Update Frontend .env

After setting up custom domain:
```
VITE_API_URL=https://api.yourdomain.com
FRONTEND_URL=https://chat.yourdomain.com
```

---

## 📋 Complete Deployment Checklist

### Before Deploying

- [ ] Remove all console.log statements (optional)
- [ ] Update JWT_SECRET to a strong random string
- [ ] Set NODE_ENV=production
- [ ] Update CORS settings in server/index.js

### Server CORS Configuration

```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
};
app.use(cors(corsOptions));
```

### MongoDB Atlas Setup (Free Tier)

1. Create account at [mongodb.com](https://mongodb.com)
2. Create free cluster
3. Create database user
4. Add IP address `0.0.0.0/0` (allow all IPs) for development
5. Get connection string:
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/chat_app?retryWrites=true&w=majority
   ```

---

## 🔒 Security Checklist

- [ ] Use strong JWT_SECRET (32+ random characters)
- [ ] Never commit .env files
- [ ] Use environment variables for all secrets
- [ ] Enable 2FA on your email account
- [ ] Use App Passwords for Gmail SMTP
- [ ] Restrict MongoDB access by IP in production

---

## 💰 Cost Summary

| Service | Free Tier | Cost |
|---------|-----------|------|
| Vercel | 100GB bandwidth, unlimited sites | $0 |
| Render | 750 hours/month | $0 |
| Railway | $5 credit/month | $0 |
| MongoDB Atlas | 512MB storage | $0 |
| Custom Domain | - | ~$12/year |
| SSL Certificate | - | FREE (Let's Encrypt) |

---

## 🆘 Troubleshooting

### CORS Errors
- Ensure FRONTEND_URL matches your frontend URL exactly
- Check for trailing slashes

### WebSocket Connection Failed
- Ensure your hosting provider supports WebSockets (Render free tier has limitations)
- Check that port 3001 is not blocked

### MongoDB Connection Failed
- Verify IP whitelist includes hosting provider IPs
- Check connection string format
- Ensure database user has correct permissions

### Build Errors
- Check Node.js version compatibility (use v18)
- Ensure all dependencies are in package.json

---

## 📞 Useful Links

- **Vercel**: https://vercel.com
- **Render**: https://render.com
- **Railway**: https://railway.app
- **MongoDB Atlas**: https://mongodb.com
- **Cloudflare DNS**: https://cloudflare.com
- **Custom Domain Guide**: https://vercel.com/docs/concepts/projects/domains
