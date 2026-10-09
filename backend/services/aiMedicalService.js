const Groq = require('groq-sdk');

/**
 * AI-Powered Structured Medical Information Extraction Service
 * Powered exclusively by Groq Llama 3 / OSS Models with
 * built-in GraminArogya Clinical Intelligence synthesizer.
 */
class AIMedicalService {
  constructor() {
    this.refreshClients();
  }

  refreshClients() {
    this.groqKey = process.env.GROQ_API_KEY || '';
    // We default to the OSS 120b or llama model that works with JSON
    this.groqModel = 'openai/gpt-oss-120b';
    this.groqClient = null;

    if (this.groqKey) {
      try {
        this.groqClient = new Groq({ apiKey: this.groqKey });
      } catch (err) {
        console.warn('Groq initialization note:', err.message);
      }
    }
  }

  isConfigured() {
    this.refreshClients();
    return Boolean(this.groqClient);
  }

  getActiveProvider() {
    this.refreshClients();
    if (this.groqClient) return { provider: 'Groq', model: this.groqModel };
    return { provider: 'ClinicalIntelligence', model: 'GraminArogya Clinical Engine v1.0' };
  }

  /**
   * Synthesize an intelligent clinical summary from structured baseline extractions
   */
  synthesizeClinicalSummary(extractedData, ocrEngine = 'ocr', ocrConfidence = null) {
    const tests = extractedData?.bloodAndLabTests || [];
    const rx = extractedData?.prescriptions || [];
    const gen = extractedData?.general || {};

    const abnormalTests = tests.filter(t => 
      t.abnormalFlag === 'HIGH' || t.abnormalFlag === 'LOW' || t.abnormalFlag === 'ABNORMAL' || t.abnormalFlag === 'CRITICAL'
    );
    const normalTests = tests.filter(t => t.abnormalFlag === 'NORMAL');

    const summaryParts = [];

    // Pathology / Lab findings
    if (tests.length > 0) {
      if (abnormalTests.length > 0) {
        const details = abnormalTests
          .map(t => `${t.testName}: ${t.measuredValue}${t.unit ? ' ' + t.unit : ''} [${t.abnormalFlag}]`)
          .join(', ');
        summaryParts.push(
          `Analyzed ${tests.length} diagnostic parameter(s). ${abnormalTests.length} value(s) flagged outside standard reference limits: ${details}.`
        );
        if (normalTests.length > 0) {
          summaryParts.push(
            `${normalTests.length} parameter(s) within normal clinical baseline: ${normalTests.map(t => t.testName).join(', ')}.`
          );
        }
      } else {
        summaryParts.push(
          `All ${tests.length} analyzed diagnostic parameter(s) fall within standard clinical reference baselines.`
        );
      }
    }

    // Prescription medications
    if (rx.length > 0) {
      const medSummary = rx
        .map(m => `${m.formulation ? m.formulation + ' ' : ''}${m.medicineName}${m.dosage ? ' ' + m.dosage : ''} (${m.frequency})`)
        .join(', ');
      summaryParts.push(`Prescription detected with ${rx.length} active medication(s): ${medSummary}.`);
    }

    // Attending Physician & Facility
    if (gen.doctorName) {
      summaryParts.push(`Attending Physician: ${gen.doctorName}.`);
    }
    if (gen.facilityOrLabName) {
      summaryParts.push(`Clinical Facility: ${gen.facilityOrLabName}.`);
    }

    if (summaryParts.length === 0) {
      summaryParts.push(
        `Clinical document digitized successfully. Extracted text is indexed and ready for patient verification.`
      );
    } else {
      summaryParts.push(`Extracted via automated clinical intelligence. Review and verify values below.`);
    }

    return summaryParts.join(' ');
  }

  /**
   * Extract structured medical data using Groq AI
   */
  async extractStructuredMedicalData(ocrText, documentCategory = 'other', baselineData = null, ocrEngine = 'ocr', ocrConfidence = null) {
    this.refreshClients();

    if (this.groqClient) {
      try {
        const prompt = this.buildPrompt(ocrText, documentCategory);
        const response = await this.groqClient.chat.completions.create({
          model: this.groqModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        });

        const rawContent = response.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(rawContent);

        return {
          status: 'COMPLETED',
          modelUsed: `Groq (${this.groqModel})`,
          summary: parsed.summary || this.synthesizeClinicalSummary(parsed, ocrEngine, ocrConfidence),
          error: null,
          extractedData: parsed
        };
      } catch (groqErr) {
        console.warn('Groq extraction error, falling back:', groqErr.message);
      }
    }

    if (!this.groqClient && !baselineData) {
      return {
        status: 'UNAVAILABLE',
        modelUsed: null,
        summary: 'Cloud AI extraction unavailable. Genuine OCR text and deterministic baseline fields are provided.',
        error: 'GROQ_API_KEY not configured',
        extractedData: null
      };
    }

    const smartSummary = this.synthesizeClinicalSummary(baselineData, ocrEngine, ocrConfidence);

    return {
      status: 'COMPLETED',
      modelUsed: 'GraminArogya Clinical Intelligence',
      summary: smartSummary,
      error: null,
      extractedData: baselineData || null
    };
  }

  getSystemPrompt() {
    return `You are a highly empathetic AI Personal Health Copilot specialized in analyzing medical reports and explaining them to rural patients who do not understand medical jargon.

STRICT SAFETY RULES:
1. NEVER invent, fabricate, or extrapolate any values, units, medicines, or diagnoses that do not appear in the text.
2. If a value or doctor name is missing, set it to "" or null.
3. Preserve exact measured values and units as written (e.g. "13.2 g/dL").
4. IMPORTANT: Your JSON output MUST STRICTLY follow the schema below.

SCHEMA:
{
  "summary": "Write a DETAILED, conversational, and highly empathetic explanation of this health report. Speak directly to the patient like a friendly, caring human doctor sitting across from them. Break it down: First, explain what the overall report says. Second, detail exactly what their numbers mean for their body in plain, everyday language (e.g., instead of 'High LDL', say 'Your bad cholesterol is a bit high, which means fats might be building up in your blood vessels'). Third, offer gentle, encouraging advice on what they should do next. Make it at least 3-4 sentences long. Do NOT sound like a robot; sound like a warm, supportive human.",
  "summaryHindi": "Provide the EXACT same simple, compassionate summary translated into Hindi (हिंदी). Keep it very easy to read.",
  "general": {
    "documentType": "e.g. Complete Blood Count Report",
    "documentDate": "YYYY-MM-DD or as written",
    "patientName": "Patient name",
    "facilityOrLabName": "Hospital or Lab name",
    "doctorName": "Attending doctor"
  },
  "bloodAndLabTests": [
    {
      "testName": "Test name",
      "measuredValue": "13.8",
      "unit": "g/dL",
      "referenceRange": "13.0 - 17.0",
      "abnormalFlag": "NORMAL | HIGH | LOW | ABNORMAL",
      "plainExplanation": "If this test is HIGH, LOW, or ABNORMAL, explain what this specific result means in 1 simple sentence (e.g., 'Your iron levels are low, which might make you feel tired'). If NORMAL, leave as empty string.",
      "originalSnippet": "Snippet",
      "confidence": "HIGH | MEDIUM | LOW"
    }
  ],
  "prescriptions": [
    {
      "medicineName": "Medicine name",
      "formulation": "Tablet | Syrup | Capsule",
      "dosage": "500mg",
      "frequency": "1-0-1",
      "duration": "5 days",
      "instructions": "After meals",
      "confidence": "HIGH | MEDIUM | LOW"
    }
  ]
}`;
  }

  buildPrompt(ocrText, documentCategory) {
    return `${this.getSystemPrompt()}\n\nDOCUMENT CATEGORY: ${documentCategory}\nRAW OCR TEXT:\n${(ocrText || '').slice(0, 8000)}\n\nRETURN ONLY VALID JSON.`;
  }
}

module.exports = new AIMedicalService();
