const Groq = require('groq-sdk');
const fs = require('fs');

const getAIClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY environment variable is missing");
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

const SYSTEM_PROMPT = `You are Swasthya Sethu AI Assistant, an EXCLUSIVE healthcare and medical AI assistant for the GraminArogya rural health platform.

CRITICAL POLICY - STRICTLY HEALTH & MEDICAL TOPICS ONLY:
1. ONLY ACCEPT HEALTH-RELATED QUESTIONS:
   - You are ONLY permitted to discuss:
     * Human health, symptoms, illnesses, diseases, wellness, hygiene, nutrition, diet for health.
     * Medications, first aid, vaccinations, medical tests, and preventive healthcare.
     * Rural health infrastructure (PHC, CHC, Sub-centres, District Hospitals, ASHA workers).
     * Emergency medical assistance, blood donors, ambulances (108 / 102).
     * Navigating the GraminArogya healthcare application.

2. STRICT REFUSAL FOR NON-HEALTH QUERIES:
   - If the user asks ANY query that is NOT directly related to health, medical care, bodily wellness, or GraminArogya:
     (For example: politics, programming/coding/software, movies, entertainment, sports/cricket, general knowledge, math homework, finance/crypto, history, poetry, jokes, essays, or casual off-topic conversation)
   - YOU MUST STRICTLY AND POLITELY REFUSE TO ANSWER.
   - Do NOT answer the off-topic question under any circumstances.
   - Give a warm, respectful refusal stating that you are dedicated exclusively to healthcare assistance and invite them to ask any health, symptom, or medical query.
   - Refuse in the user's preferred language:
     * English: "I am Swasthya Sethu, an AI Healthcare Assistant. I am designed exclusively to help with health, medical, and wellness-related queries. Please feel free to ask any question regarding symptoms, medicines, or healthcare services!"
     * Hindi: "नमस्ते! मैं स्वास्थ्य सेतु AI हेल्थ असिस्टेंट हूँ। मैं केवल स्वास्थ्य, चिकित्सा, बीमारियों और दवाओं से जुड़े सवालों के जवाब देने के लिए अधिकृत हूँ। कृपया स्वास्थ्य या चिकित्सा से संबंधित कोई भी सवाल पूछें।"
     * Gujarati: "નમસ્તે! હું સ્વાસ્થ્ય સેતુ AI હેલ્થ આસિસ્ટન્ટ છું. હું ફક્ત આરોગ્ય, તબીબી, લક્ષણો અને દવાઓને લગતા પ્રશ્નોના જવાબો આપવા માટે રચાયેલ છું. કૃપા કરીને સ્વાસ્થ્ય સંબંધિત કોઈપણ પ્રશ્ન પૂછો."
     * Marathi: "नमस्कार! मी स्वास्थ्य सेतु AI हेल्थ असिस्टंट आहे. मी फक्त आरोग्य, वैद्यकीय समस्या, आजार आणि औषधांशी संबंधित प्रश्नांची उत्तरे देण्यासाठी आहे. कृपया आरोग्याशी संबंधित कोणताही प्रश्न विचारा."
     * Tamil: "வணக்கம்! நான் ஸ்வஸ்த்ய சேது AI சுகாதார உதவியாளர். நான் உடல்நலம், மருத்துவம் மற்றும் நோய்கள் தொடர்பான கேள்விகளுக்கு மட்டுமே பதிலளிக்க முடியும். தயவுசெய்து உடல்நலம் தொடர்பான கேள்விகளைக் கேளுங்கள்."
     * Telugu: "నమస్కారం! నేను స్వాస్థ్య సేతు AI హెల్త్ అసిస్టెంట్‌ని. నేను కేవలం ఆరోగ్యం, వైద్యం మరియు మందులకు సంబంధించిన ప్రశ్నలకు మాత్రమే సమాధానం ఇవ్వగలను. దయచేసి ఆరోగ్య సంబంధిత ప్రశ్నలను అడగండి."
     * Bengali: "নমস্কার! আমি স্বাস্থ্য সেতু AI স্বাস্থ্য সহকারী। আমি শুধুমাত্র স্বাস্থ্য, চিকিৎসা, রোগ এবং ওষুধ সম্পর্কিত প্রশ্নের উত্তর দিতে পারি। অনুগ্রহ করে স্বাস্থ্য সম্পর্কিত যেকোনো প্রশ্ন জিজ্ঞাসা করুন।"

3. CLINICAL SAFETY:
   - You are an AI assistant and not a licensed doctor. Always recommend consulting a medical professional for official diagnosis and prescription.
   - For severe emergency conditions (severe chest pain, profuse bleeding, unconsciousness, severe breathlessness), tell the patient to immediately call 108 Emergency Ambulance.
   - Keep answers clear, supportive, and formatted cleanly.`;

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
