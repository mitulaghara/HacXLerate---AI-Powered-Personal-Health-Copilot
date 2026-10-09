const express = require('express');
const router = express.Router();

const LIBRETRANSLATE_API_URL = 'https://libretranslate.com/translate';

router.post('/', async (req, res) => {
  const { q, source, target, format } = req.body;
  const apiKey = process.env.LIBRETRANSLATE_API_KEY;

  if (!q || !target) {
    return res.status(400).json({ error: 'Missing required parameters: q and target' });
  }

  try {
    const body = new URLSearchParams({
      q: q,
      source: source || 'en',
      target: target,
      format: format || 'text'
    });

    if (apiKey) {
      body.append('api_key', apiKey);
    }

    const response = await fetch(LIBRETRANSLATE_API_URL, {
      method: 'POST',
      body: body.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    res.json({ translatedText: data.translatedText });
  } catch (error) {
    console.error('Translation Error:', error);
    res.status(500).json({ error: 'Translation failed', details: error.message });
  }
});

module.exports = router;
