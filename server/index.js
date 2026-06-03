import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize AI clients with keys from environment variables
const OPENROUTER_KEY = process.env.VITE_OPENROUTER_KEY || '';

// Verify keys are loaded
if (!OPENROUTER_KEY) {
  console.warn('⚠️  Warning: OpenRouter API key not found in environment variables');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'DalviCard backend is running' });
});

// Process business cards with AI
app.post('/api/process-cards', async (req, res) => {
  try {
    const { imageUrls, model } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ error: 'imageUrls array is required' });
    }

    if (!model || (model !== 'Alpha' && model !== 'Beta')) {
      return res.status(400).json({ error: 'model must be "Alpha" or "Beta"' });
    }

    const isAlpha = model === 'Alpha';
    const apiKey = OPENROUTER_KEY;
    const baseURL = 'https://openrouter.ai/api/v1';
    const modelIdentifier = isAlpha ? 'google/gemini-flash-latest' : 'openai/gpt-5.5';

    if (!apiKey) {
      return res.status(503).json({
        error: 'OpenRouter API key not configured on server',
      });
    }

    const openai = new OpenAI({
      apiKey,
      baseURL,
      dangerouslyAllowBrowser: false,
    });

    const response = await openai.chat.completions.create({
      model: modelIdentifier,
      messages: [
        {
          role: 'system',
          content:
            'Extract business card data into JSON: { leads: [{ name, company, role, emails: [], phones: [], address }] }',
        },
        {
          role: 'user',
          content: imageUrls.map((url) => ({
            type: 'image_url',
            image_url: { url },
          })),
        },
      ],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{"leads":[]}');
    res.json(parsed);
  } catch (error) {
    console.error('AI Processing Error:', error);
    res.status(500).json({
      error: 'AI processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║  🚀 DalviCard Backend Server Running      ║
║  📍 http://localhost:${PORT}                    ║
║  ✅ API keys loaded from environment      ║
╚══════════════════════════════════════════╝
  `);
});
