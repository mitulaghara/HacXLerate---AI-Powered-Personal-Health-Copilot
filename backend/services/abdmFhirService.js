/**
 * ABDM (Ayushman Bharat Digital Mission) & HL7 FHIR R4 Service
 * Conforms to NDHM FHIR Implementation Guide specifications
 * Generates FHIR Bundles, Observations, MedicationRequests, and handles Mock ABHA Link/Import
 */

class ABDMFhirService {
  /**
   * Generates a 14-digit ABDM-compliant ABHA ID (e.g. 14-8291-0394-8192)
   */
  generateMockAbhaId() {
    const p1 = Math.floor(10 + Math.random() * 89);
    const p2 = Math.floor(1000 + Math.random() * 9000);
    const p3 = Math.floor(1000 + Math.random() * 9000);
    const p4 = Math.floor(1000 + Math.random() * 9000);
    return `${p1}-${p2}-${p3}-${p4}`;
  }

  /**
   * Generates a standard ABHA Address (e.g. rahul.sharma@abdm)
   */
  generateMockAbhaAddress(name = 'patient') {
    const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    return `${clean || 'user'}${rand}@abdm`;
  }

  /**
   * Converts a digitized MedicalDocument into an official ABDM FHIR R4 Document Bundle
   */
  convertToFhirBundle(document, patient = {}) {
    const docId = document._id ? document._id.toString() : 'doc-001';
    const patientAbha = patient.abhaId || '14-8823-9912-3841';
    const patientName = patient.name || document.extractedData?.general?.patientName || 'Ayushman Beneficiary';
    const doctorName = document.extractedData?.general?.doctorName || 'Attending Physician';
    const facilityName = document.extractedData?.general?.facilityOrLabName || 'GraminArogya Certified Digital Clinic';
    const docDate = document.extractedData?.general?.documentDate || document.createdAt || new Date().toISOString();

    const bundleId = `abdm-bundle-${docId}`;
    const compositionId = `comp-${docId}`;
    const patientId = `patient-${patient._id || 'pat-001'}`;
    const practitionerId = `practitioner-${docId}`;
    const orgId = `org-${docId}`;

    const entries = [];

    // 1. Composition Resource (Document Manifest)
    entries.push({
      fullUrl: `urn:uuid:${compositionId}`,
      resource: {
        resourceType: 'Composition',
        id: compositionId,
        meta: {
          versionId: '1',
          lastUpdated: new Date().toISOString(),
          profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportRecord']
        },
        language: 'en-IN',
        identifier: {
          system: 'https://healthid.ndhm.gov.in/records',
          value: `REC-${docId}`
        },
        status: 'final',
        type: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: document.documentCategory === 'blood_test' ? '721981007' : '371530004',
            display: document.extractedData?.general?.documentType || 'Clinical consultation report'
          }],
          text: document.extractedData?.general?.documentType || 'Health Record'
        },
        subject: {
          reference: `urn:uuid:${patientId}`,
          display: patientName
        },
        date: new Date(docDate).toISOString(),
        author: [{
          reference: `urn:uuid:${practitionerId}`,
          display: doctorName
        }],
        title: document.extractedData?.general?.documentType || 'GraminArogya Digitized Clinical Document',
        custodian: {
          reference: `urn:uuid:${orgId}`,
          display: facilityName
        },
        section: [
          {
            title: 'AI Plain-Language Summary',
            code: {
              coding: [{
                system: 'http://snomed.info/sct',
                code: '371531000',
                display: 'Report summary'
              }]
            },
            text: {
              status: 'generated',
              div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>${document.aiExtraction?.summary || document.summary || 'Summary unavailable'}</p></div>`
            }
          }
        ]
      }
    });

    // 2. Patient Resource
    entries.push({
      fullUrl: `urn:uuid:${patientId}`,
      resource: {
        resourceType: 'Patient',
        id: patientId,
        meta: {
          profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient']
        },
        identifier: [
          {
            type: {
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                code: 'MR',
                display: 'Medical Record Number'
              }]
            },
            system: 'https://healthid.ndhm.gov.in',
            value: patientAbha
          }
        ],
        name: [{
          use: 'official',
          text: patientName
        }],
        telecom: patient.phone ? [{
          system: 'phone',
          value: patient.phone,
          use: 'mobile'
        }] : [],
        gender: (patient.gender || 'unknown').toLowerCase(),
        birthDate: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : undefined
      }
    });

    // 3. Practitioner Resource
    entries.push({
      fullUrl: `urn:uuid:${practitionerId}`,
      resource: {
        resourceType: 'Practitioner',
        id: practitionerId,
        meta: {
          profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Practitioner']
        },
        identifier: [{
          system: 'https://doctor.ndhm.gov.in',
          value: `DOC-${Math.floor(10000 + Math.random() * 90000)}`
        }],
        name: [{
          text: doctorName
        }]
      }
    });

    // 4. Organization Resource
    entries.push({
      fullUrl: `urn:uuid:${orgId}`,
      resource: {
        resourceType: 'Organization',
        id: orgId,
        meta: {
          profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Organization']
        },
        identifier: [{
          system: 'https://facility.ndhm.gov.in',
          value: `HFR-${Math.floor(100000 + Math.random() * 900000)}`
        }],
        name: facilityName
      }
    });

    // 5. Observations (Lab Tests)
    const tests = document.extractedData?.bloodAndLabTests || [];
    tests.forEach((t, idx) => {
      const obsId = `obs-${docId}-${idx}`;
      entries.push({
        fullUrl: `urn:uuid:${obsId}`,
        resource: {
          resourceType: 'Observation',
          id: obsId,
          meta: {
            profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/Observation']
          },
          status: 'final',
          code: {
            coding: [{
              system: 'http://loinc.org',
              display: t.testName
            }],
            text: t.testName
          },
          subject: {
            reference: `urn:uuid:${patientId}`
          },
          effectiveDateTime: new Date(docDate).toISOString(),
          valueQuantity: {
            value: parseFloat(t.measuredValue) || t.measuredValue,
            unit: t.unit || '',
            system: 'http://unitsofmeasure.org'
          },
          interpretation: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
              code: t.abnormalFlag === 'HIGH' ? 'H' : t.abnormalFlag === 'LOW' ? 'L' : t.abnormalFlag === 'NORMAL' ? 'N' : 'A',
              display: t.abnormalFlag || 'Normal'
            }]
          }],
          referenceRange: t.referenceRange ? [{
            text: t.referenceRange
          }] : [],
          note: t.plainExplanation ? [{
            text: `[AI Copilot Explanation]: ${t.plainExplanation}`
          }] : []
        }
      });
    });

    // 6. MedicationRequests (Prescriptions)
    const meds = document.extractedData?.prescriptions || [];
    meds.forEach((m, idx) => {
      const medId = `med-${docId}-${idx}`;
      entries.push({
        fullUrl: `urn:uuid:${medId}`,
        resource: {
          resourceType: 'MedicationRequest',
          id: medId,
          meta: {
            profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/MedicationRequest']
          },
          status: 'active',
          intent: 'order',
          medicationCodeableConcept: {
            text: m.medicineName
          },
          subject: {
            reference: `urn:uuid:${patientId}`
          },
          authoredOn: new Date(docDate).toISOString(),
          requester: {
            reference: `urn:uuid:${practitionerId}`
          },
          dosageInstruction: [{
            text: `${m.dosage ? m.dosage + ' ' : ''}${m.frequency ? m.frequency + ' ' : ''}${m.instructions || ''}`
          }]
        }
      });
    });

    return {
      resourceType: 'Bundle',
      id: bundleId,
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString(),
        profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle']
      },
      identifier: {
        system: 'https://healthid.ndhm.gov.in/bundles',
        value: `BUNDLE-${docId}`
      },
      type: 'document',
      timestamp: new Date().toISOString(),
      total: entries.length,
      entry: entries
    };
  }

  /**
   * Generates mock external health records simulated from the ABDM Health Information Network
   */
  generateMockAbdmRecords(patientName = 'Patient') {
    return [
      {
        originalFilename: 'abdm_aiims_discharge_summary.pdf',
        sanitizedFilename: 'abdm_aiims_discharge_summary.pdf',
        mimeType: 'application/pdf',
        fileSize: 245000,
        storagePath: 'abdm/mock/aiims_discharge.pdf',
        fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        documentCategory: 'discharge_summary',
        status: 'VERIFIED',
        verificationStatus: 'MANUALLY_VERIFIED',
        ocrEngine: 'abdm-fhir-gateway',
        ocrConfidence: 98,
        confidenceCategory: 'HIGH',
        rawOcrText: 'AIIMS New Delhi Department of Cardiology. Discharge Summary for ' + patientName + '. Diagnosis: Stable Angina. Treatment: Aspirin 75mg, Atorvastatin 20mg.',
        extractedData: {
          general: {
            documentType: 'Inpatient Hospital Discharge Summary',
            documentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            patientName: patientName,
            facilityOrLabName: 'AIIMS New Delhi - National Cardiology Centre',
            doctorName: 'Dr. V. K. Paul, MD (Cardiology)'
          },
          bloodAndLabTests: [
            {
              testName: 'Cardiac Troponin I',
              measuredValue: '0.02',
              unit: 'ng/mL',
              referenceRange: '0.00 - 0.04',
              abnormalFlag: 'NORMAL',
              plainExplanation: 'Heart muscle injury enzymes are completely normal.',
              confidence: 'HIGH'
            },
            {
              testName: 'Lipid Profile - Total Cholesterol',
              measuredValue: '215',
              unit: 'mg/dL',
              referenceRange: '125 - 200',
              abnormalFlag: 'HIGH',
              plainExplanation: 'Cholesterol is mildly elevated. Continue prescribed statin medication.',
              confidence: 'HIGH'
            }
          ],
          prescriptions: [
            {
              medicineName: 'Ecosprin (Aspirin)',
              formulation: 'Tablet',
              dosage: '75mg',
              frequency: '0-1-0',
              duration: '30 days',
              instructions: 'After lunch daily to protect blood vessels'
            },
            {
              medicineName: 'Atorvastatin',
              formulation: 'Tablet',
              dosage: '20mg',
              frequency: '0-0-1',
              duration: '30 days',
              instructions: 'At bedtime daily'
            }
          ]
        },
        aiExtraction: {
          status: 'COMPLETED',
          modelUsed: 'ABDM FHIR Health Information Gateway (AI Verified)',
          summary: 'Successfully synced your discharge summary from AIIMS New Delhi. Your cardiac enzymes are healthy, but your cholesterol needs monitoring. Please continue taking your heart medicines daily after meals.',
          extractedAt: new Date()
        }
      }
    ];
  }
}

module.exports = new ABDMFhirService();
