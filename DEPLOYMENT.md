# Deployment Guide - CareerOS Resume Builder

> Last Updated: April 13, 2026


## Frontend Deployment (Vercel)

### 1. Prepare Frontend

Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

Create `.env.production`:
```
VITE_API_URL=https://your-backend-url.com/api
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Or use Vercel Dashboard:
1. Go to https://vercel.com
2. Import Git repository
3. Configure:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variables:
   - `VITE_API_URL`: Your backend URL
5. Deploy

---

## Backend Deployment (Render)

### 1. Prepare Backend

Create `render.yaml`:
```yaml
services:
  - type: web
    name: careeros-backend
    env: node
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5000
      - key: MONGO_URI
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_EXPIRES_IN
        value: 7d
```

Update `backend/server.js` CORS:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
```

### 2. Deploy to Render

1. Go to https://render.com
2. New → Web Service
3. Connect Git repository
4. Configure:
   - Name: `careeros-backend`
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Root Directory: `backend`
5. Add environment variables:
   - `MONGO_URI`: MongoDB connection string
   - `JWT_SECRET`: Random secure string
   - `JWT_EXPIRES_IN`: `7d`
   - `FRONTEND_URL`: Your Vercel URL
6. Deploy

---

## Alternative: Railway Deployment

### Backend on Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
cd backend
railway init

# Add environment variables
railway variables set MONGO_URI="your-mongo-uri"
railway variables set JWT_SECRET="your-secret"
railway variables set FRONTEND_URL="your-vercel-url"

# Deploy
railway up
```

---

## MongoDB Setup (MongoDB Atlas)

1. Go to https://cloud.mongodb.com
2. Create free cluster
3. Database Access → Add User
4. Network Access → Add IP (0.0.0.0/0 for all)
5. Connect → Get connection string
6. Replace `<password>` with your password
7. Use in `MONGO_URI` environment variable

---

## Environment Variables Summary

### Frontend (.env.production)
```
VITE_API_URL=https://your-backend.onrender.com/api
```

### Backend (Render/Railway)
```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/resume-builder
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-app.vercel.app
```

---

## Post-Deployment Checklist

✅ Frontend builds successfully
✅ Backend starts without errors
✅ MongoDB connection works
✅ CORS configured correctly
✅ Environment variables set
✅ API endpoints accessible
✅ Authentication works
✅ File uploads work (if applicable)
✅ SSL/HTTPS enabled
✅ Custom domain configured (optional)

---

## Testing Deployment

```bash
# Test backend health
curl https://your-backend.onrender.com/

# Test auth endpoint
curl -X POST https://your-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test frontend
open https://your-app.vercel.app
```

---

## Troubleshooting

**Frontend not loading:**
- Check build logs in Vercel
- Verify `VITE_API_URL` is set correctly
- Check browser console for errors

**Backend errors:**
- Check Render/Railway logs
- Verify MongoDB connection string
- Ensure all environment variables are set
- Check CORS configuration

**CORS errors:**
- Add frontend URL to CORS origin
- Ensure credentials: true if using cookies
- Check preflight OPTIONS requests

**Database connection failed:**
- Verify MongoDB Atlas IP whitelist
- Check connection string format
- Ensure database user has correct permissions

---

## Continuous Deployment

Both Vercel and Render support automatic deployments:

1. Push to `main` branch
2. Automatic build and deploy
3. Zero-downtime deployment
4. Rollback available if needed

---

## Custom Domain Setup

### Vercel (Frontend)
1. Domains → Add Domain
2. Add DNS records from your provider
3. Wait for SSL certificate

### Render (Backend)
1. Settings → Custom Domain
2. Add CNAME record: `backend.yourdomain.com`
3. SSL auto-configured

---

## Monitoring

**Vercel:**
- Analytics dashboard
- Function logs
- Performance metrics

**Render:**
- Logs tab for real-time logs
- Metrics for CPU/Memory
- Health checks

**MongoDB Atlas:**
- Performance monitoring
- Query profiler
- Alerts for issues

