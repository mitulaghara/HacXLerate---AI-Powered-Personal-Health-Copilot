/**
 * AI Triage & Voice NLP Engine for Rural Healthcare
 * Directly connected to MongoDB Atlas for patient database storage.
 */

const Patient = require('../models/Patient');

const symptomRules = [
  {
    keywords: ['chest pain', 'chhati me dard', 'seene me dard', 'heart attack', 'dil ka daura', 'left arm pain'],
    risk: 'CRITICAL',
    triageCategory: 'RED_EMERGENCY',
    tags: ['Chest Pain', 'Suspected Cardiac Emergency'],
    facilityType: 'District Hospital / Trauma & Cardiology Unit',
    actionNote: 'Immediate 108 ambulance dispatch recommended. Oxygen and ECG monitoring required immediately.'
  },
  {
    keywords: ['saans lene me takleef', 'difficulty breathing', 'shortness of breath', 'dum ghutna', 'blue lips', 'asthma attack', 'spo2 low'],
    risk: 'CRITICAL',
    triageCategory: 'RED_EMERGENCY',
    tags: ['Respiratory Distress', 'Hypoxia Risk'],
    facilityType: 'CHC or District Hospital with Oxygen Beds',
    actionNote: 'Immediate oxygen support required. Check SpO2 immediately. Triage to facility with active oxygen cylinders.'
  },
  {
    keywords: ['pregnancy pain', 'garbhavastha dard', 'high bp in pregnancy', 'preeclampsia', 'bleeding in pregnancy', 'delivery pain', 'prasav'],
    risk: 'HIGH',
    triageCategory: 'RED_EMERGENCY',
    tags: ['High Risk Pregnancy', 'Obstetric Emergency'],
    facilityType: 'CHC or District Hospital with Gynecologist & Labor Room',
    actionNote: 'Alert JSSK/108 Van. Ensure Gynecologist / trained SN available at target facility.'
  },
  {
    keywords: ['snake bite', 'saap ne kata', 'zeher', 'poisoning', 'loss of consciousness', 'behosh', 'seizure', 'daura'],
    risk: 'CRITICAL',
    triageCategory: 'RED_EMERGENCY',
    tags: ['Toxicology / Snake Bite', 'Neurological Emergency'],
    facilityType: 'CHC or District Hospital with Anti-Snake Venom (ASV)',
    actionNote: 'Emergency antidote (ASV) and resuscitation setup needed.'
  },
  {
    keywords: ['high fever', 'tez bukhar', 'chills', 'thand lagna', 'vomiting', 'ulti', 'persistent fever', 'malaria'],
    risk: 'MODERATE',
    triageCategory: 'YELLOW_PRIORITY',
    tags: ['Febrile Illness', 'Suspected Infection / Malaria / Dengue'],
    facilityType: 'PHC or CHC with Blood Testing Diagnostics',
    actionNote: 'Diagnostic workup: CBC, Rapid Malaria Test, Dengue NS1. Monitor hydration.'
  },
  {
    keywords: ['fracture', 'haddi tutna', 'swelling', 'severe sprain', 'chot lagna', 'accident injury'],
    risk: 'MODERATE',
    triageCategory: 'YELLOW_PRIORITY',
    tags: ['Trauma / Orthopedic Injury'],
    facilityType: 'CHC or District Hospital with Digital X-Ray & Orthopedic support',
    actionNote: 'Immobilize limb. Facility with functioning X-ray machine required.'
  },
  {
    keywords: ['dast', 'diarrhea', 'loose motion', 'dehydration', 'chakkar', 'kamzori', 'weakness'],
    risk: 'MODERATE',
    triageCategory: 'YELLOW_PRIORITY',
    tags: ['Acute Gastroenteritis', 'Dehydration Risk'],
    facilityType: 'PHC or Health & Wellness Sub-Centre',
    actionNote: 'Administer ORS + Zinc packets immediately. Monitor pulse and urine output.'
  },
  {
    keywords: ['mild fever', 'halka bukhar', 'cough', 'khansi', 'cold', 'zukham', 'headache', 'sar dard', 'skin rash', 'khujli'],
    risk: 'LOW',
    triageCategory: 'GREEN_ROUTINE',
    tags: ['Mild Upper Respiratory Infection / General Symptom'],
    facilityType: 'Health & Wellness Sub-Centre or Local PHC',
    actionNote: 'OPD consultation with Community Health Officer / MBBS Doctor. Symptomatic medication.'
  }
];

function parseAge(text) {
  const ageMatch = text.match(/(\d+)\s*(saal|sal|years|year|yrs|yr|mahine|months|month)/i) || text.match(/age\s*(?:is|:)?\s*(\d+)/i);
  if (ageMatch) return parseInt(ageMatch[1], 10);
  const rawNum = text.match(/\b(100|[1-9][0-9]?)\b/);
  return rawNum ? parseInt(rawNum[1], 10) : 30;
}

function parseDuration(text) {
  const durationMatch = text.match(/(\d+|kal|aaj|parso|do|teen|char|ek)\s*(din|days|day|hours|ghante|hafte|weeks)?/i);
  if (durationMatch) return durationMatch[0];
  if (/kal se|since yesterday/i.test(text)) return '1-2 Days (Since Yesterday)';
  if (/aaj se|since today/i.test(text)) return 'Since Today (< 24 hrs)';
  return '2-3 Days';
}

exports.parseVoiceTriage = async (req, res) => {
  try {
    const { transcript, language = 'hi-IN', vitalsInput = {} } = req.body;

    if (!transcript || transcript.trim() === '') {
      return res.status(400).json({ success: false, message: 'Voice transcript or text is required.' });
    }

    const lower = transcript.toLowerCase();
    let matchedRule = null;
    let matchedTags = [];

    for (const rule of symptomRules) {
      const match = rule.keywords.some(kw => lower.includes(kw.toLowerCase()));
      if (match) {
        matchedRule = rule;
        matchedTags = [...rule.tags];
        break;
      }
    }

    if (!matchedRule) {
      matchedRule = {
        risk: 'LOW',
        triageCategory: 'GREEN_ROUTINE',
        tags: ['General Health Assessment'],
        facilityType: 'Local PHC / Health & Wellness Sub-Centre',
        actionNote: 'General clinical consultation with available Medical Officer.'
      };
      matchedTags = ['General Complaint'];
    }

    const estimatedAge = parseAge(lower);
    const estimatedDuration = parseDuration(lower);

    let vitals = {
      bp: vitalsInput.bp || (matchedRule.risk === 'CRITICAL' ? '155/98' : '120/80'),
      spo2: vitalsInput.spo2 || (matchedRule.tags.includes('Respiratory Distress') ? 91 : 98),
      temp: vitalsInput.temp || (matchedRule.tags.includes('Febrile Illness') ? 102.1 : 98.6),
      pulse: vitalsInput.pulse || (matchedRule.risk === 'CRITICAL' ? 108 : 76),
      sugar: vitalsInput.sugar || 'Normal (98 mg/dL)'
    };

    let finalRisk = matchedRule.risk;
    let finalCategory = matchedRule.triageCategory;

    if (vitals.spo2 < 92 || vitals.pulse > 120 || vitals.temp > 103) {
      finalRisk = 'CRITICAL';
      finalCategory = 'RED_EMERGENCY';
    } else if (vitals.spo2 < 95 || vitals.temp > 101) {
      if (finalRisk === 'LOW') {
        finalRisk = 'MODERATE';
        finalCategory = 'YELLOW_PRIORITY';
      }
    }

    const triageResult = {
      originalTranscript: transcript,
      detectedLanguage: language,
      structuredData: {
        estimatedAge,
        duration: estimatedDuration,
        chiefComplaint: transcript.length > 120 ? transcript.slice(0, 117) + '...' : transcript,
        symptomTags: matchedTags,
        vitals: vitals
      },
      triageAssessment: {
        riskLevel: finalRisk,
        triageCategory: finalCategory,
        badgeColor: finalRisk === 'CRITICAL' ? '#DC2626' : finalRisk === 'HIGH' ? '#EA580C' : finalRisk === 'MODERATE' ? '#D97706' : '#16A34A',
        recommendedFacilityType: matchedRule.facilityType,
        actionGuidance: matchedRule.actionNote,
        responsibleAiDisclaimer: 'AI assists health workers for triage prioritization; it does not substitute for a qualified doctor’s clinical diagnosis.'
      }
    };

    return res.json({ success: true, data: triageResult });
  } catch (error) {
    console.error('Triage error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.registerPatient = async (req, res) => {
  try {
    const User = require('../models/User');
    const { phone, name, email, vitals, chiefComplaint, symptomTags, riskLevel, triageCategory, recommendedFacilityType, age, gender, village, abhaId } = req.body;

    const cleanPhone = phone ? String(phone).trim() : '';
    const cleanDigits = cleanPhone.replace(/\D/g, '').slice(-10);

    // 1. Check if Patient already exists by phone or ID
    let existingPatient = null;
    if (req.body.id) {
      existingPatient = await Patient.findOne({ id: req.body.id.trim() });
    }
    if (!existingPatient && cleanDigits && cleanDigits.length >= 6) {
      existingPatient = await Patient.findOne({
        $or: [
          { phone: cleanPhone },
          { phone: { $regex: cleanDigits } }
        ]
      });
    }
    if (!existingPatient && email) {
      existingPatient = await Patient.findOne({ email: email.toLowerCase().trim() });
    }

    const staffIdentifier = req.user?.staffId || req.user?.doctorId || req.user?.id || 'STAFF-FIELD';
    const staffName = req.user?.name || req.body.ashaWorkerName || 'Community ASHA Health Worker';

    const screeningReport = {
      visitDate: new Date(),
      ashaId: staffIdentifier,
      ashaName: staffName,
      symptoms: chiefComplaint || (symptomTags && symptomTags.join(', ')) || 'Routine Health Screening',
      observations: `Community screening at ${village || 'Field Sub-Centre'}. Triage: ${triageCategory || 'GREEN_ROUTINE'}`,
      notes: `Facility Recommendation: ${recommendedFacilityType || 'PHC'}. Risk Level: ${riskLevel || 'LOW'}`,
      vitals: vitals || { bp: '120/80', spo2: 98, temp: 98.4, pulse: 72, sugar: 'Normal' },
      triageResult: triageCategory || 'GREEN_ROUTINE',
      followUpRequirement: (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') ? 'Urgent Medical Officer Consultation' : '',
      referralRequirement: recommendedFacilityType || ''
    };

    const clinicalVisit = {
      visitDate: screeningReport.visitDate,
      visitType: 'ASHA Health Screening',
      facilityName: `${village || 'Community'} Health Sub-Centre`,
      doctorName: `${staffName} (ASHA)`,
      diagnosis: triageCategory === 'RED_EMERGENCY' ? 'Emergency Field Triage' : triageCategory === 'YELLOW_URGENT' ? 'Urgent Field Triage' : (chiefComplaint || 'Routine Health Screening'),
      symptoms: chiefComplaint || (symptomTags && symptomTags.join(', ')) || 'Routine Screening',
      clinicalNotes: `Field Screening: ${triageCategory || 'GREEN_ROUTINE'}. Recommended Care: ${recommendedFacilityType || 'Sub-Centre / PHC'}`,
      prescriptions: [],
      treatments: [],
      testReports: [],
      vitalsAtVisit: vitals || { bp: '120/80', spo2: 98, temp: 98.4, pulse: 72, sugar: 'Normal' }
    };

    if (existingPatient) {
      if (name !== undefined) existingPatient.name = name || 'Citizen Patient';
      if (age !== undefined) existingPatient.age = Number(age) || 28;
      if (gender !== undefined) existingPatient.gender = gender;
      if (village !== undefined) existingPatient.village = village || 'Rural Health Sub-Center';
      if (phone !== undefined) existingPatient.phone = cleanPhone;
      if (abhaId !== undefined) existingPatient.abhaId = abhaId;
      if (vitals) existingPatient.vitals = { ...existingPatient.vitals, ...vitals };
      if (chiefComplaint !== undefined) existingPatient.chiefComplaint = chiefComplaint || 'Routine Health Screening';
      if (symptomTags && symptomTags.length) {
        existingPatient.symptomTags = [...new Set([...(existingPatient.symptomTags || []), ...symptomTags])];
      }
      if (riskLevel) existingPatient.riskLevel = riskLevel;
      if (triageCategory) existingPatient.triageCategory = triageCategory;
      if (recommendedFacilityType) existingPatient.recommendedFacilityType = recommendedFacilityType;
      existingPatient.updatedAt = new Date();

      if (!existingPatient.fieldReports) existingPatient.fieldReports = [];
      if (!existingPatient.medicalHistory) existingPatient.medicalHistory = [];

      // Avoid duplicate screening entry within 1 minute
      const oneMinAgo = new Date(Date.now() - 60000);
      const isDuplicate = existingPatient.fieldReports.some(r =>
        r.visitDate > oneMinAgo && r.symptoms === screeningReport.symptoms
      );
      if (!isDuplicate) {
        existingPatient.fieldReports.unshift(screeningReport);
        existingPatient.medicalHistory.unshift(clinicalVisit);
      }

      await existingPatient.save();

      // Sync across any duplicate patient docs matching phone or userId
      try {
        const syncOr = [];
        if (cleanDigits && cleanDigits.length >= 6) syncOr.push({ phone: { $regex: cleanDigits } });
        if (existingPatient.userId) syncOr.push({ userId: existingPatient.userId });
        if (syncOr.length > 0) {
          const others = await Patient.find({ _id: { $ne: existingPatient._id }, $or: syncOr });
          for (const o of others) {
            if (!o.fieldReports) o.fieldReports = [];
            if (!o.medicalHistory) o.medicalHistory = [];
            o.fieldReports.unshift(screeningReport);
            o.medicalHistory.unshift(clinicalVisit);
            if (vitals) o.vitals = { ...o.vitals, ...vitals };
            o.updatedAt = new Date();
            await o.save().catch(() => {});
          }
        }
      } catch (syncErr) {
        console.warn('Cross-patient sync note in registerPatient:', syncErr.message);
      }

      // Live SSE Broadcast to patient client
      try {
        const patientController = require('./patientController');
        if (patientController.broadcastToPatient) {
          patientController.broadcastToPatient(
            { userId: existingPatient.userId, phone: existingPatient.phone, patientId: existingPatient.id },
            { type: 'RECORD_UPDATED', visit: clinicalVisit, report: screeningReport }
          );
        }
      } catch {}

      return res.status(200).json({
        success: true,
        data: existingPatient,
        message: `Existing patient record (${existingPatient.id}) updated with latest field vitals & visit history.`
      });
    }

    // 2. If no Patient doc exists, check if a registered User exists to link userId
    let linkedUserId = null;
    if (cleanDigits && cleanDigits.length >= 6) {
      const user = await User.findOne({ phone: { $regex: cleanDigits } });
      if (user) {
        linkedUserId = user._id;
        if (user.patId && !req.body.id) req.body.id = user.patId;
      }
    }

    const randomSix = Math.floor(100000 + Math.random() * 900000);
    const patId = req.body.id || `PAT-${cleanDigits.slice(-6) || randomSix}`;

    const patientData = {
      id: patId,
      userId: linkedUserId || undefined,
      name: name || 'Citizen Patient',
      age: Number(age) || 28,
      gender: gender || 'Female',
      village: village || 'Rural Health Sub-Center',
      phone: cleanPhone,
      email: email ? email.toLowerCase().trim() : '',
      abhaId: abhaId || `ABHA-91-${cleanDigits.slice(-4) || '1044'}-${randomSix}`,
      chiefComplaint: chiefComplaint || 'Routine Health Screening',
      symptomTags: symptomTags || [chiefComplaint ? chiefComplaint.slice(0, 30) : 'General Screening'],
      vitals: vitals || { bp: '120/80', spo2: 98, temp: 98.4, pulse: 72, sugar: 'Normal' },
      riskLevel: riskLevel || 'LOW',
      triageCategory: triageCategory || 'GREEN_ROUTINE',
      recommendedFacilityType: recommendedFacilityType || 'Health & Wellness Sub-Centre / Local PHC',
      ashaWorkerName: `${staffName} (${staffIdentifier})`,
      registrationDate: new Date(),
      fieldReports: [screeningReport],
      medicalHistory: [clinicalVisit]
    };

    const newPatient = new Patient(patientData);
    await newPatient.save();

    // Live SSE Broadcast if citizen is online
    try {
      const patientController = require('./patientController');
      if (patientController.broadcastToPatient) {
        patientController.broadcastToPatient(
          { userId: newPatient.userId, phone: newPatient.phone, patientId: newPatient.id },
          { type: 'RECORD_UPDATED', visit: clinicalVisit, report: screeningReport }
        );
      }
    } catch {}

    return res.status(201).json({
      success: true,
      data: newPatient,
      message: `Patient registered with ID ${newPatient.id} and initial visit logged.`
    });
  } catch (error) {
    console.error('Patient register error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.addFieldReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { symptoms, observations, notes, vitals, triageResult, followUpRequirement, referralRequirement } = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'Patient ID is required.' });
    }

    const trimmedId = String(id).trim();
    const cleanDigits = trimmedId.replace(/\D/g, '');
    const Patient = require('../models/Patient');
    const User = require('../models/User');
    const mongoose = require('mongoose');
    
    const queryConditions = [
      { id: trimmedId },
      { id: { $regex: `^${trimmedId}$`, $options: 'i' } },
      { abhaId: trimmedId },
      { qrToken: trimmedId },
      { sscCode: trimmedId }
    ];
    if (mongoose.Types.ObjectId.isValid(trimmedId)) {
      queryConditions.push({ _id: trimmedId });
      queryConditions.push({ userId: trimmedId });
    }
    if (cleanDigits.length >= 6) {
      queryConditions.push({ phone: { $regex: cleanDigits.slice(-10) } });
      queryConditions.push({ phone: trimmedId });
    }

    let patient = await Patient.findOne({ $or: queryConditions });

    // Fallback: check if id belongs to a User account
    if (!patient) {
      let matchedUser = null;
      if (mongoose.Types.ObjectId.isValid(trimmedId)) {
        matchedUser = await User.findById(trimmedId);
      }
      if (!matchedUser) {
        const userOr = [{ username: trimmedId }, { patId: trimmedId }];
        if (cleanDigits.length >= 6) userOr.push({ phone: { $regex: cleanDigits.slice(-10) } });
        matchedUser = await User.findOne({ $or: userOr });
      }
      if (matchedUser) {
        patient = await Patient.findOne({
          $or: [
            { userId: matchedUser._id },
            { id: matchedUser.patId || '' },
            { phone: matchedUser.phone || '' }
          ]
        });
      }
    }
    
    if (!patient) {
      return res.status(404).json({ success: false, message: `Patient with ID ${id} not found.` });
    }

    const ashaId = req.user?.staffId || req.user?.doctorId || req.user?.id || 'asha-system';
    const ashaName = req.user?.name || req.body.ashaName || 'Community ASHA Health Worker';

    const newReport = {
      visitDate: new Date(),
      ashaId,
      ashaName,
      symptoms: symptoms || '',
      observations: observations || '',
      notes: notes || '',
      vitals: vitals || { bp: '', spo2: null, temp: null, pulse: null, sugar: '' },
      triageResult: triageResult || 'GREEN_ROUTINE',
      followUpRequirement: followUpRequirement || '',
      referralRequirement: referralRequirement || ''
    };

    if (!patient.fieldReports) {
      patient.fieldReports = [];
    }

    // Update patient current vitals & triage status from this visit
    if (vitals && (vitals.bp || vitals.spo2 || vitals.temp || vitals.pulse || vitals.sugar)) {
      patient.vitals = { ...patient.vitals, ...vitals };
    }
    if (triageResult) {
      patient.triageCategory = triageResult;
      patient.riskLevel = triageResult.includes('RED') || triageResult.includes('CRITICAL') ? 'CRITICAL' :
                         triageResult.includes('YELLOW') || triageResult.includes('URGENT') ? 'HIGH' : 'LOW';
    }

    const clinicalVisit = {
      visitDate: newReport.visitDate,
      visitType: 'ASHA Field Screening & Visit',
      facilityName: `${patient.village || 'Community'} Sub-Centre / Field Visit`,
      doctorName: `${ashaName} (ASHA)`,
      diagnosis: triageResult === 'RED_EMERGENCY' ? 'Emergency Field Triage' : triageResult === 'YELLOW_URGENT' ? 'Urgent Field Triage' : (symptoms || 'Community ASHA Health Visit'),
      symptoms: symptoms || observations || 'Community Field Screening',
      clinicalNotes: observations ? `Field Observations: ${observations}${notes ? ' | ' + notes : ''}` : (notes || 'ASHA Field Checkup completed.'),
      prescriptions: [],
      treatments: referralRequirement ? [`Referral: ${referralRequirement}`] : [],
      testReports: [],
      vitalsAtVisit: vitals || {}
    };

    if (!patient.medicalHistory) {
      patient.medicalHistory = [];
    }
    
    // Prevent duplicate report within the last 1 minute by the same ASHA
    const oneMinAgo = new Date(Date.now() - 60000);
    const isDuplicate = patient.fieldReports.some(r => 
      r.ashaId === ashaId && 
      r.visitDate > oneMinAgo &&
      r.symptoms === newReport.symptoms
    );

    if (!isDuplicate) {
      patient.fieldReports.unshift(newReport);
      patient.medicalHistory.unshift(clinicalVisit);
      patient.updatedAt = new Date();
      await patient.save();
    }

    // Sync visit across any secondary/duplicate patient docs matching same phone or userId
    try {
      const patientPhoneClean = (patient.phone || '').replace(/\D/g, '').slice(-10);
      const syncOr = [];
      if (patientPhoneClean.length >= 6) syncOr.push({ phone: { $regex: patientPhoneClean } });
      if (patient.userId) syncOr.push({ userId: patient.userId });
      if (patient.id) syncOr.push({ id: patient.id });

      if (syncOr.length > 0) {
        const duplicateDocs = await Patient.find({
          _id: { $ne: patient._id },
          $or: syncOr
        });
        for (const doc of duplicateDocs) {
          if (!doc.fieldReports) doc.fieldReports = [];
          if (!doc.medicalHistory) doc.medicalHistory = [];
          const dupExists = doc.fieldReports.some(r => r.visitDate > oneMinAgo && r.symptoms === newReport.symptoms);
          if (!dupExists) {
            doc.fieldReports.unshift(newReport);
            doc.medicalHistory.unshift(clinicalVisit);
            if (vitals) doc.vitals = { ...doc.vitals, ...vitals };
            doc.updatedAt = new Date();
            await doc.save().catch(() => {});
          }
        }
      }
    } catch (syncErr) {
      console.warn('Cross-doc sync note in addFieldReport:', syncErr.message);
    }

    // Broadcast live SSE event to patient
    try {
      const patientController = require('./patientController');
      if (patientController.broadcastToPatient) {
        patientController.broadcastToPatient(
          { userId: patient.userId, phone: patient.phone, patientId: patient.id },
          { type: 'RECORD_UPDATED', visit: clinicalVisit, report: newReport }
        );
      }
    } catch {}

    // Server-side audit log
    const { logAudit } = require('../middleware/authMiddleware');
    await logAudit({
      action: 'ASHA_FIELD_REPORT_SAVED',
      req,
      resource: 'Patient Field Report',
      patientId: patient.id,
      details: { ashaName, triageResult },
      status: 'SUCCESS'
    });

    return res.status(201).json({
      success: true,
      message: 'ASHA Field Report saved successfully',
      patient
    });
  } catch (error) {
    console.error('addFieldReport error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPatients = async (req, res) => {
  try {
    const { search, village } = req.query;
    let query = {};
    if (village && village.trim()) {
      query.village = new RegExp(village.trim(), 'i');
    }
    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: new RegExp(s, 'i') },
        { id: new RegExp(s, 'i') },
        { phone: new RegExp(s, 'i') },
        { abhaId: new RegExp(s, 'i') },
        { sscCode: new RegExp(s, 'i') },
        { village: new RegExp(s, 'i') }
      ];
    }
    const list = await Patient.find(query).sort({ registrationDate: -1, _id: -1 });
    return res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.syncOfflineQueue = async (req, res) => {
  try {
    const { queuedPatients = [] } = req.body;
    const synced = [];

    for (const item of queuedPatients) {
      const cleanPhone = item.phone ? String(item.phone).trim() : '';
      const cleanDigits = cleanPhone.replace(/\D/g, '').slice(-10);

      let existing = null;
      if (item.id) existing = await Patient.findOne({ id: item.id });
      if (!existing && cleanDigits && cleanDigits.length >= 6) {
        existing = await Patient.findOne({ phone: { $regex: cleanDigits } });
      }

      if (existing) {
        if (item.vitals) existing.vitals = { ...existing.vitals, ...item.vitals };
        if (item.chiefComplaint) existing.chiefComplaint = item.chiefComplaint;
        if (item.riskLevel) existing.riskLevel = item.riskLevel;
        existing.syncedAt = new Date();
        await existing.save();
        synced.push(existing);
      } else {
        const randomSix = Math.floor(100000 + Math.random() * 900000);
        const patId = item.id || `PAT-${cleanDigits.slice(-6) || randomSix}`;
        const p = new Patient({
          ...item,
          id: patId,
          syncedAt: new Date()
        });
        await p.save();
        synced.push(p);
      }
    }

    return res.json({
      success: true,
      syncedCount: synced.length,
      message: `Successfully synchronized ${synced.length} records to database.`,
      data: synced
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
