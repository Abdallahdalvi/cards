# GitHub & Deployment Guide for DalviCard

## 1. Push to GitHub

### Create Repository on GitHub
1. Go to https://github.com/new
2. Create a new repository named `dalvicard`
3. Do NOT initialize with README (we already have one)

### Push Your Code
```bash
cd "c:\Users\devev\.gemini\antigravity\scratch\dalvicard"
git init
git add .
git commit -m "Initial commit - DalviCard CRM"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dalvicard.git
git push -u origin main
```

## 2. Deploy to Your Server

### Option A: GitHub Pages (Free Hosting)
1. Go to your GitHub repository Settings
2. Navigate to "Pages" section
3. Select "Deploy from a branch"
4. Choose branch: `main`, folder: `/(root)`
5. Run locally first: `npm run build`
6. Push the `dist/` folder contents

### Option B: Traditional Web Server (Apache, Nginx)

#### Build for Production:
```bash
npm run build
```

#### Upload to Server:
1. FTP/SSH into your server
2. Upload all files from `dist/` folder to your web root (e.g., `/public_html/`)
3. Configure your web server:

**For Apache (.htaccess):**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**For Nginx:**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Option C: Deploy to Netlify or Vercel

#### Netlify:
```bash
npm run build
# Then drag & drop the dist/ folder to Netlify
# Or connect your GitHub repo for auto-deployment
```

#### Vercel:
```bash
npm run build
# Install vercel CLI
npm install -g vercel
vercel
```

## 3. Environment Variables on Server

Create `.env.local` file on your server with:
```
VITE_OPENROUTER_KEY=your_key
VITE_OPENAI_KEY=your_key
```

Then rebuild before deploying:
```bash
npm install
npm run build
```

## 4. Continuous Deployment (Recommended)

After pushing to GitHub, you can set up automatic deployments:

### Netlify Auto-Deploy:
1. Connect your GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

### Vercel Auto-Deploy:
1. Import your Git repository
2. Vercel auto-detects Vite configuration
3. Add environment variables in project settings
4. Deploy!

## File Size Note
The production build should be ~500KB-1MB (gzipped)

## Testing Before Deploy
```bash
npm run build
npm run preview
```
Visit http://localhost:4173 to test the production build locally.

## Troubleshooting

**Build fails:**
```bash
npm install
npm run build
```

**Environment variables not loading:**
- Ensure `.env.local` is in project root
- Restart dev server after creating `.env.local`
- Variables must be prefixed with `VITE_`

**API requests failing:**
- Check that API keys are valid
- Verify CORS settings if calling from different domain
- Check browser console for error details
