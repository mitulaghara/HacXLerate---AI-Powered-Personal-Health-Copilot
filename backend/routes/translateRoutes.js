const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

let groqClient = null;
const getGroq = () => {
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
};

const LANG_MAP = {
  hi: 'Hindi (हिन्दी)',
  gu: 'Gujarati (ગુજરાતી)',
  mr: 'Marathi (मराठी)',
  ta: 'Tamil (தமிழ்)',
  te: 'Telugu (తెలుగు)',
  bn: 'Bengali (বাংলা)',
  en: 'English'
};

router.post('/', async (req, res) => {
  const { q, source, target } = req.body;

  if (!q || !target) {
    return res.status(400).json({ error: 'Missing required parameters: q and target' });
  }

  const tgt = (target || 'en').split('-')[0].toLowerCase();
  const src = (source || 'en').split('-')[0].toLowerCase();

  if (tgt === src || (tgt === 'en' && (!source || src === 'en'))) {
    return res.json({ translatedText: q });
  }

  const langName = LANG_MAP[tgt] || tgt;

  // 1. Use Groq AI Translation for high-accuracy medical translation
  try {
    const groq = getGroq();
    if (groq) {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are an expert healthcare multilingual translator. Translate the text into ${langName}. Return ONLY the translation, without explanation or markdown.`
          },
          { role: 'user', content: q }
        ],
        model: 'openai/gpt-oss-20b',
        temperature: 0.1,
        max_tokens: 300
      });

      const translated = completion.choices[0]?.message?.content?.trim();
      if (translated) {
        return res.json({ translatedText: translated });
      }
    }
  } catch (groqErr) {
    console.warn('Groq translation error, trying fallback:', groqErr.message);
  }

  // 2. Fallback to LibreTranslate if configured
  try {
    const apiKey = process.env.LIBRETRANSLATE_API_KEY;
    if (apiKey) {
      const body = new URLSearchParams({
        q,
        source: src || 'en',
        target: tgt,
        format: 'text',
        api_key: apiKey
      });

      const response = await fetch('https://libretranslate.com/translate', {
        method: 'POST',
        body: body.toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.translatedText) {
          return res.json({ translatedText: data.translatedText });
        }
      }
    }
  } catch (err) {
    console.warn('LibreTranslate fallback error:', err.message);
  }

  // Fallback: return original text
  return res.json({ translatedText: q });
});

module.exports = router;
