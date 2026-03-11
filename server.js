import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.llmapi.ai/v1/chat/completions";

app.post('/api/ai/chat', async (req, res) => {
    try {
        const { messages, type = 'chat' } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        if (!OPENAI_API_KEY) {
            return res.status(500).json({ error: 'VITE_OPENAI_API_KEY not configured on server' });
        }

        let systemMessage = "";
        if (type === 'suggestions') {
            systemMessage = `You are a maternal health content curator. Suggest 5-7 high-quality maternal health resources including:
1. Recent maternal health articles from reputable sources (WHO, CDC, medical journals)
2. Educational YouTube videos about pregnancy and maternal care
3. Publications from maternal health doctors and experts
4. Evidence-based pregnancy guides

Format your response as a structured list with titles, brief descriptions, and why each resource is valuable. Use Markdown for formatting (bold for titles, bullet points, etc.) to make it highly readable.`;
        } else {
            systemMessage = `You are a compassionate maternal health assistant for NgaoMaternal Care. Provide:
- Evidence-based pregnancy and maternal health information
- Supportive and empathetic responses
- Clear guidance on when to seek medical attention
- Culturally sensitive advice

IMPORTANT: Always recommend consulting healthcare providers for medical concerns. You provide information, not medical diagnosis. Use Markdown for formatting.`;
        }

        const payload = {
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemMessage },
                ...messages
            ],
            temperature: 0.7
        };

        const response = await axios.post(OPENAI_API_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
        });

        const content = response.data.choices?.[0]?.message?.content || "";
        res.json({ content });

    } catch (error) {
        console.error('[AI Error]:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: 'AI Service Error',
            details: error.response?.data || error.message
        });
    }
});

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')));

app.use((req, res, next) => {
    if (req.url.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
