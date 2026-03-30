# Secure Deployment Guide

## Architecture Overview

Your DalviCard app now has a secure 2-tier architecture:

```
┌─────────────────────────────────────────┐
│  Browser (Frontend - React + Vite)      │
│  - No API keys exposed                  │
│  - Safe to host publicly                │
└────────────────┬────────────────────────┘
                 │ request
                 ▼
┌─────────────────────────────────────────┐
│  Your Server (Backend - Node.js)        │
│  - Holds API keys securely              │
│  - Proxies to OpenAI/OpenRouter         │
└─────────────────────────────────────────┘
```

## Deployment Steps

### Step 1: Build Frontend for Production

```bash
cd "c:\Users\devev\.gemini\antigravity\scratch\dalvicard"
npm run build
```

This creates a `/dist` folder with the compiled frontend.

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Implement secure backend proxy architecture"
git push origin main
```

⚠️ **WARNING**: Your `.env.local` with API keys is in `.gitignore` and will NOT be pushed. That's correct!

### Step 3: Deploy Backend to Your Server

Upload to your server:
1. The `/server` folder
2. A copy of `.env.local` with your API keys

Commands to run on your server:
```bash
cd /your/app/server
npm install
npm start
```

Or use `npm run dev` for development with auto-reload.

### Step 4: Deploy Frontend to Your Server

Upload the `/dist` folder to your web server's public directory.

#### For Apache / Traditional Server:
```bash
# Copy dist/* to /var/www/html/ or your public folder
cp -r dist/* /var/www/html/
```

#### For Nginx:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    root /var/www/html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3001;
    }
}
```

### Step 5: Update Backend URL (Production)

If your backend runs on a different domain:

Update `src/App.tsx` line 171:
```typescript
const response = await fetch('https://yourdomain.com:3001/api/process-cards', {
```

Then rebuild: `npm run build`

## Environment Variables on Server

Create `.env.local` on your server:
```
VITE_OPENROUTER_KEY=your_openrouter_key
VITE_OPENAI_KEY=your_openai_key
```

Only the backend reads this file - frontend never sees it.

## Running Both Servers

### Development:
```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
npm run dev
```

### Production:
```bash
# Backend (with PM2 for auto-restart)
npm install -g pm2
pm2 start "node index.js" --name "dalvicard-backend"
pm2 save
pm2 startup

# Frontend: Served by web server
```

## Security Checklist

- ✅ API keys NOT in frontend code
- ✅ API keys NOT in GitHub commits
- ✅ `.env.local` in `.gitignore`
- ✅ Backend holds secrets
- ✅ Frontend safe for public hosting
- ✅ CORS enabled for frontend requests

## Troubleshooting

### Backend won't start
```bash
# Check if port 3001 is in use
lsof -i :3001
# Kill the process
kill -9 <PID>
```

### Frontend can't reach backend
- Check backend is running: `curl http://localhost:3001/health`
- Update API URL in App.tsx if using different domain
- Check CORS headers in browser DevTools

### API calls failing
1. Check backend logs: `pm2 logs`
2. Verify `.env.local` has correct keys
3. Check API key validity on respective platforms

## Monitoring

Use PM2 for production:
```bash
# Dashboard
pm2 monit

# Logs
pm2 logs dalvicard-backend

# Restart on changes
pm2 restart dalvicard-backend
```

## Performance Notes

- Frontend: ~500KB gzipped (cached by browser)
- Backend: Lightweight Express.js server
- Database: Uses Supabase (cloud hosted)

## Next Steps

After deployment:
1. Set up SSL certificate (HTTPS)
2. Configure CloudFlare or similar for DDoS protection
3. Set up monitoring and alerts
4. Add rate limiting to backend
5. Implement user authentication
