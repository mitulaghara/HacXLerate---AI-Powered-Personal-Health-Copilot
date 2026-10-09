const Groq = require('groq-sdk');
const fs = require('fs');

const getAIClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY environment variable is missing");
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
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

    const groq = getAIClient();
    
    // Format history for Groq
    const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
    
    if (history) {
      history.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.parts[0].text
        });
      });
    }
    
    // Add current message
    messages.push({
      role: 'user',
      content: `(Language preference: ${language || 'auto'})\n\nUser: ${message}`
    });

    const response = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: messages,
      temperature: 0.3
    });

    res.json({ text: response.choices[0].message.content });
  } catch (error) {
    console.error('Groq Chat API Error:', error);
    res.status(500).json({ error: 'Failed to process chat message', details: error.message });
  }
};

exports.voiceMessage = async (req, res) => {
  let finalPath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const { language, history } = req.body;
    const groq = getAIClient();

    // Groq requires an extension on the filename to detect the MIME type.
    // Multer saves without an extension by default.
    finalPath = req.file.path + '.webm';
    fs.renameSync(req.file.path, finalPath);

    // 1. Transcribe the audio using Whisper
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(finalPath),
      model: 'whisper-large-v3-turbo',
      response_format: 'json'
    });

    const transcribedText = transcription.text;
    console.log('Transcribed Audio:', transcribedText);

    // 2. Generate the AI reply using Llama 3
    const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
    
    // We optionally pass history if it exists
    if (history) {
      try {
         const parsedHistory = typeof history === 'string' ? JSON.parse(history) : history;
         parsedHistory.forEach(msg => {
           messages.push({
             role: msg.role === 'user' ? 'user' : 'assistant',
             content: msg.parts[0].text
           });
         });
      } catch (e) {
         console.warn("Could not parse history in voice request");
      }
    }
    
    messages.push({
      role: 'user',
      content: `(The user sent a voice message. This is the exact transcription. Reply naturally in ${language || 'their spoken language'}.)\n\nTranscription: ${transcribedText}`
    });

    const chatResponse = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: messages,
      temperature: 0.3
    });

    // Cleanup temp file
    if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);

    res.json({ text: chatResponse.choices[0].message.content });
  } catch (error) {
    console.error('Groq Voice API Error:', error);
    if (finalPath && fs.existsSync(finalPath)) {
      fs.unlinkSync(finalPath);
    } else if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to process voice message', details: error.message });
  }
};
