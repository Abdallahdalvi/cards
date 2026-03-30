# DalviCard - AI Business Card Scanner

A modern CRM application for scanning and managing business cards with AI-powered data extraction.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Keys

Create a `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add your API keys:

```
VITE_OPENROUTER_KEY=your_openrouter_key
VITE_OPENAI_KEY=your_openai_key
```

#### Getting API Keys:
- **OpenRouter**: https://openrouter.ai/keys (for Gemini 2.0 Flash)
- **OpenAI**: https://platform.openai.com/api-keys (for GPT-4o)

### 3. Configure Supabase

Update the Supabase credentials in `src/supabase.ts`:
- Add your SUPABASE_URL
- Add your SUPABASE_ANON_KEY

### 4. Run Development Server
```bash
npm run dev
```

The app will be available at http://localhost:5174/

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features

- ✅ AI-powered business card scanning
- ✅ Contact management with advanced search
- ✅ Collections/Events organization
- ✅ Bulk operations (delete, move, export)
- ✅ Excel export functionality
- ✅ Real-time synchronization
- ✅ Mobile-responsive design

## Deployment

### GitHub Setup
1. Initialize git and push to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/dalvicard.git
git push -u origin main
```

### Deploy to Server
The `dist/` folder contains the production build ready to deploy to any static hosting:
- GitHub Pages
- Netlify
- Vercel
- Traditional web server (Apache, Nginx, etc.)

#### For Traditional Server:
1. Run `npm run build`
2. Upload the `dist/` folder contents to your web server
3. Configure your web server to serve `index.html` for all routes

## Environment Variables

All environment variables should be prefixed with `VITE_` to be accessible in the browser:

```
VITE_OPENROUTER_KEY - OpenRouter API key
VITE_OPENAI_KEY - OpenAI API key
```

## License

MIT
