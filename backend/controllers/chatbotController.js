const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

const getAIClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is missing");
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

const SYSTEM_PROMPT = `You are Swasthya Sethu AI Assistant, a healthcare application assistant for GraminArogya.
Your main purpose is to help patients navigate the application, answer general health queries, and support them in Gujarati, Hindi, or English.
CRITICAL SAFETY RULES:
- You are not a doctor. Do not provide independent clinical diagnosis.
- Never invent hospital details, appointment slots, government scheme eligibility or medical facts.
- Use actual application data if provided.
- Never claim an appointment has been booked or cancelled unless confirmed by the system.
- Do not prescribe medication or invent dosages.
- Recognize emergencies and guide patients toward verified emergency services (e.g., dial 108 or 112).
- Clearly communicate uncertainty and recommend qualified medical assistance when appropriate.
- Always respond in the language the patient uses, or the language explicitly requested.`;

exports.chatMessage = async (req, res) => {
  try {
    const { message, history, language } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = getAIClient();
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    
    // Format history for Gemini
    const contents = history ? history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.parts[0].text }]
    })) : [];
    
    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: `(Language: ${language || 'auto'}) ${message}` }]
    });

    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.3
      }
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'Failed to process chat message', details: error.message });
  }
};

exports.voiceMessage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const { language } = req.body;
    const ai = getAIClient();
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    const fileBytes = fs.readFileSync(req.file.path);
    const audioBase64 = fileBytes.toString('base64');

    const contents = [{
      role: 'user',
      parts: [
        { text: `Understand this audio message and answer appropriately in ${language || 'the spoken language'}.` },
        { inlineData: { mimeType: req.file.mimetype || 'audio/webm', data: audioBase64 } }
      ]
    }];

    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.3
      }
    });

    // Cleanup temp file
    fs.unlinkSync(req.file.path);

    res.json({ text: response.text });
  } catch (error) {
    console.error('Gemini Voice API Error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to process voice message', details: error.message });
  }
};
