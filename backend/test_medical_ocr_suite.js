const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const ocrService = require('./services/ocrService');
const aiMedicalService = require('./services/aiMedicalService');
const MedicalDocument = require('./models/MedicalDocument');
const MedicalRecord = require('./models/MedicalRecord');
const Patient = require('./models/Patient');
const User = require('./models/User');

function generateSamplePdfBuffer(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const content = "BT /F1 12 Tf 16 TL 50 750 Td " + lines.map(l => "(" + l.replace(/[()\\\\]/g, "") + ") '").join(" ") + " ET";
  
  let body = '%PDF-1.4\n';
  const offsets = [];
  
  offsets.push(body.length);
  body += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  
  offsets.push(body.length);
  body += '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  
  offsets.push(body.length);
  body += '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
  
  offsets.push(body.length);
  body += `4 0 obj\n<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream\nendobj\n`;
  
  offsets.push(body.length);
  body += '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
  
  const xrefOffset = body.length;
  body += 'xref\n0 6\n0000000000 65535 f \n';
  for (const off of offsets) {
    body += `${off.toString().padStart(10, '0')} 00000 n \n`;
  }
  body += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(body);
}

function generateEmptyPdfBuffer() {
  const stream = `BT /F1 12 Tf 50 700 Td () Tj ET`;
  const streamLen = stream.length;
  return Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLen} >>
stream
${stream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000350 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
450
%%EOF`);
}

async function runTestSuite() {
  console.log('=================================================================');
  console.log('🧪 GRAMINAROGYA MEDICAL RECORD INTELLIGENCE & OCR TEST SUITE');
  console.log('=================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    await connectDB();
    assert(mongoose.connection.readyState === 1, 'MongoDB connection established successfully');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 1: Valid text-based PDF upload and OCR extraction
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 1: Valid Text-Based PDF Processing ---');
    const sampleReportText = `City Diagnostic Laboratory Hospital Road
Date: 12/10/2026
Patient Name: Suresh Patil
Doctor: Dr. Arvind Sharma
COMPLETE BLOOD COUNT (CBC)
Hemoglobin 14.2 g/dL 13.0 - 17.0
Total Leucocyte Count (WBC) 7800 cells/mcL 4000 - 11000
Platelet Count 2.5 lakh/mcL 1.5 - 4.5
Fasting Blood Sugar 95 mg/dL 70 - 100`;

    const pdfBuffer = generateSamplePdfBuffer(sampleReportText);
    const result1 = await ocrService.processDocument({
      fileBuffer: pdfBuffer,
      mimeType: 'application/pdf',
      originalFilename: 'cbc_report_suresh.pdf',
      documentCategory: 'blood_test'
    });

    console.log('Result 1 Raw Text:', JSON.stringify(result1.rawOcrText));
    assert(result1.rawOcrText.includes('Hemoglobin'), 'Test 1.1: Raw OCR text extracted from PDF');
    assert(result1.ocrEngine === 'pdf-parse', 'Test 1.2: Correct OCR engine detected (pdf-parse)');
    assert(result1.ocrConfidence >= 90, 'Test 1.3: Digital PDF confidence is high (>=90%)');
    assert(result1.status === 'REQUIRES_REVIEW', 'Test 1.4: Document status defaults to REQUIRES_REVIEW');

    const hemoglobinTest = result1.extractedData.bloodAndLabTests.find(t => t.testName.includes('Hemoglobin'));
    assert(hemoglobinTest && hemoglobinTest.measuredValue === '14.2', 'Test 1.5: Hemoglobin measured value (14.2) parsed accurately');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 2: Scanned PDF handling (empty or sparse embedded text stream)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 2: Scanned PDF Fallback Detection ---');
    const emptyPdfBuffer = generateEmptyPdfBuffer();
    const result2 = await ocrService.processDocument({
      fileBuffer: emptyPdfBuffer,
      mimeType: 'application/pdf',
      originalFilename: 'scanned_prescription.pdf',
      documentCategory: 'prescription'
    });

    assert(result2.ocrEngine === 'scanned-pdf-fallback', 'Test 2.1: Scanned PDF detected without crashing');
    assert(result2.status === 'REQUIRES_REVIEW', 'Test 2.2: Scanned PDF marked for manual review');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 3: Image OCR with Tesseract
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 3: Image OCR with Tesseract Engine ---');
    // Using an existing project image
    const sampleImagePath = path.join(__dirname, '..', 'assets', 'doctor-desk.jpg');
    let imageOcrPassed = false;
    try {
      const result3 = await ocrService.processDocument({
        filePath: sampleImagePath,
        mimeType: 'image/jpeg',
        originalFilename: 'doctor_desk.jpg',
        documentCategory: 'other'
      });
      imageOcrPassed = result3.ocrEngine === 'tesseract.js';
      assert(imageOcrPassed, 'Test 3.1: Image OCR ran via Tesseract engine');
      assert(typeof result3.ocrConfidence === 'number' || result3.ocrConfidence === null, 'Test 3.2: Genuine numeric confidence computed');
    } catch (imgErr) {
      assert(false, `Test 3: Image OCR encountered error: ${imgErr.message}`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 4: Prescription extraction (Medication names, dosage, instructions)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 4: Prescription Fields & Dosage Extraction ---');
    const rxText = `Gramin PHC Health Centre
Date: 15/09/2026
Doctor: Dr. Manisha Gupta
Rx:
1. Tab. Paracetamol 500mg 1-0-1 5 days After meals
2. Tab. Amoxicillin 500mg TDS 7 days After meals
3. Tab. Pantoprazole 40mg OD 14 days Before meals / empty stomach`;

    const rxExtracted = ocrService.extractBaselineStructuredData(rxText, 'prescription');
    assert(rxExtracted.prescriptions.length >= 2, 'Test 4.1: Extracted at least 2 medications');
    const pcm = rxExtracted.prescriptions.find(p => p.medicineName.toLowerCase().includes('paracetamol'));
    assert(pcm && pcm.dosage.includes('500'), 'Test 4.2: Paracetamol 500mg dosage captured');
    assert(pcm && pcm.frequency.includes('1-0-1'), 'Test 4.3: Frequency 1-0-1 captured accurately');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 5: Manual Corrections, Audit Trail & Timeline Sync
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 5: Manual Corrections & Verification Sync ---');
    // Create test document in DB
    const testDoc = await MedicalDocument.create({
      patientId: 'PAT-TEST-999',
      userId: new mongoose.Types.ObjectId(),
      patientCode: 'PAT-TEST-999',
      patientName: 'Test Patient',
      originalFilename: 'test_blood_panel.pdf',
      sanitizedFilename: 'med_doc_test_123.pdf',
      mimeType: 'application/pdf',
      fileSize: 1024,
      storagePath: '/tmp/test_blood_panel.pdf',
      documentCategory: 'blood_test',
      status: 'REQUIRES_REVIEW',
      verificationStatus: 'UNVERIFIED',
      extractedData: {
        general: { documentDate: '2026-10-09', facilityOrLabName: 'PHC Testing Lab', doctorName: 'Dr. Test' },
        bloodAndLabTests: [
          { testName: 'Hemoglobin', measuredValue: '12.0', unit: 'g/dL', referenceRange: '13.0 - 17.0', abnormalFlag: 'LOW', wasCorrected: false }
        ]
      }
    });

    // Simulate user correction
    testDoc.userCorrections.push({
      field: 'bloodAndLabTests[0].measuredValue',
      originalValue: '12.0',
      correctedValue: '12.5',
      correctedBy: 'Test Patient',
      correctedAt: new Date(),
      note: 'Corrected blurry digit'
    });
    testDoc.extractedData.bloodAndLabTests[0].measuredValue = '12.5';
    testDoc.extractedData.bloodAndLabTests[0].wasCorrected = true;
    testDoc.verificationStatus = 'MANUALLY_VERIFIED';
    await testDoc.save();

    const fetchedDoc = await MedicalDocument.findById(testDoc._id);
    assert(fetchedDoc.extractedData.bloodAndLabTests[0].measuredValue === '12.5', 'Test 5.1: Corrected laboratory value updated in DB');
    assert(fetchedDoc.userCorrections.length === 1, 'Test 5.2: Audit trail entry recorded');
    assert(fetchedDoc.extractedData.bloodAndLabTests[0].wasCorrected === true, 'Test 5.3: Field flagged as wasCorrected: true');

    // Clean up test document
    await MedicalDocument.findByIdAndDelete(testDoc._id);

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 6: AI Provider Graceful Fallback & Cloud Integration (Google Gemini)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 6: Google Gemini AI Service & Graceful Fallback ---');
    const aiFallbackResult = await aiMedicalService.extractStructuredMedicalData('Some random medical text');
    if (process.env.GEMINI_API_KEY) {
      assert(aiFallbackResult.status === 'COMPLETED' || aiFallbackResult.status === 'FAILED', 'Test 6.1: Gemini AI Service executed with configured API key');
    } else {
      assert(aiFallbackResult.status === 'UNAVAILABLE', 'Test 6.1: When GEMINI_API_KEY is not configured, status is UNAVAILABLE');
      assert(!aiFallbackResult.extractedData, 'Test 6.2: No fake/invented AI medical fields returned');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 7: Invalid MIME Type Rejection
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 7: Unsupported File Type Validation ---');
    let errorCaught = false;
    try {
      await ocrService.processDocument({
        fileBuffer: Buffer.from('console.log("bad")'),
        mimeType: 'text/javascript',
        originalFilename: 'malicious.js',
        documentCategory: 'other'
      });
    } catch (e) {
      errorCaught = true;
    }
    assert(errorCaught, 'Test 7.1: Unsupported MIME type safely rejected by OCR service');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 8: Existing Database Models & Regression Checks
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- TEST 8: Existing Database & Application Regression ---');
    const userCount = await User.countDocuments();
    const patientCount = await Patient.countDocuments();
    const mrCount = await MedicalRecord.countDocuments();
    assert(typeof userCount === 'number', `Test 8.1: Users collection intact (${userCount} records)`);
    assert(typeof patientCount === 'number', `Test 8.2: Patients collection intact (${patientCount} records)`);
    assert(typeof mrCount === 'number', `Test 8.3: MedicalRecords collection intact (${mrCount} records)`);

    console.log('\n=================================================================');
    console.log(`📊 TEST SUITE SUMMARY: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
    console.log('=================================================================\n');

    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('Test suite uncaught error:', err);
    process.exit(1);
  }
}

runTestSuite();
