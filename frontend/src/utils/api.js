/**
 * API client with robust endpoints connected to MongoDB Atlas.
 */

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const getHeaders = () => {
  const token = localStorage.getItem('gramin_arogya_token');
  const user = localStorage.getItem('gramin_arogya_user');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (user) {
    try {
      const parsed = JSON.parse(user);
      if (parsed && (parsed.id || parsed._id)) {
        headers['x-user-id'] = parsed.id || parsed._id;
      }
    } catch {}
  }
  return headers;
};

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch (err) {
    return { success: false, message: `Server error (${res.status || 'unknown'})` };
  }
};

export const api = {
  // Authentication
  
  verifyAdminOtp: async (otp) => {
    const res = await fetch(`${API_BASE}/auth/verify-admin-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp })
    });
    return safeJson(res);
  },
  login: async ({ username, password, role }) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });
    return safeJson(res);
  },

  register: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.json();
  },

  createStaff: async (data) => {
    const res = await fetch(`${API_BASE}/auth/create-staff`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  checkExisting: async (data) => {
    const res = await fetch(`${API_BASE}/auth/check-existing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    return res.json();
  },

  createDoctor: async (data) => {
    const res = await fetch(`${API_BASE}/admin/create-doctor`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getUsers: async () => {
    const res = await fetch(`${API_BASE}/auth/users`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getUsersList: async () => {
    const res = await fetch(`${API_BASE}/auth/users`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Voice AI Triage
  parseVoiceTriage: async (transcript, language, vitals) => {
    const res = await fetch(`${API_BASE}/triage/voice-parse`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ transcript, language, vitalsInput: vitals })
    });
    return res.json();
  },

  // Patients
  registerPatient: async (patientData) => {
    const res = await fetch(`${API_BASE}/patients/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(patientData)
    });
    return res.json();
  },

  addFieldReport: async (id, data) => {
    const res = await fetch(`${API_BASE}/patients/${id}/field-report`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getPatients: async () => {
    const res = await fetch(`${API_BASE}/patients`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getDoctorPatients: async (search = '') => {
    const url = search ? `${API_BASE}/doctor/patients?search=${encodeURIComponent(search)}` : `${API_BASE}/doctor/patients`;
    const res = await fetch(url, {
      headers: getHeaders()
    });
    return res.json();
  },

  getDashboardStats: async () => {
    const res = await fetch(`${API_BASE}/doctor/dashboard-stats`, {
      headers: getHeaders()
    });
    return res.json();
  },

  syncOfflineQueue: async (queuedPatients) => {
    const res = await fetch(`${API_BASE}/sync-offline`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ queuedPatients })
    });
    return res.json();
  },

  // Facilities & Smart Routing
  getFacilities: async () => {
    const res = await fetch(`${API_BASE}/facilities`, {
      headers: getHeaders()
    });
    return res.json();
  },

  createFacility: async (data) => {
    const res = await fetch(`${API_BASE}/facilities`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateFacility: async (id, data) => {
    const res = await fetch(`${API_BASE}/facilities/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteFacility: async (id) => {
    const res = await fetch(`${API_BASE}/facilities/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  getSmartRouting: async (params) => {
    const res = await fetch(`${API_BASE}/facilities/smart-routing`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params)
    });
    return res.json();
  },

  // Inventory & Medicines
  getInventory: async () => {
    const res = await fetch(`${API_BASE}/inventory`, {
      headers: getHeaders()
    });
    return res.json();
  },

  createMedicine: async (data) => {
    const res = await fetch(`${API_BASE}/inventory`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateMedicineStock: async (id, payload) => {
    const res = await fetch(`${API_BASE}/inventory/${id}/stock`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  deleteMedicine: async (id) => {
    const res = await fetch(`${API_BASE}/inventory/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  // Outbreaks
  getOutbreaks: async () => {
    const res = await fetch(`${API_BASE}/outbreaks`, {
      headers: getHeaders()
    });
    return res.json();
  },

  createOutbreak: async (data) => {
    const res = await fetch(`${API_BASE}/outbreaks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateOutbreak: async (id, data) => {
    const res = await fetch(`${API_BASE}/outbreaks/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteOutbreak: async (id) => {
    const res = await fetch(`${API_BASE}/outbreaks/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  // Digital Referrals
  createReferral: async (referralData) => {
    const res = await fetch(`${API_BASE}/referrals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(referralData)
    });
    return res.json();
  },

  getReferrals: async () => {
    const res = await fetch(`${API_BASE}/referrals`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getReferralByCode: async (code) => {
    const res = await fetch(`${API_BASE}/referrals/${code}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  updateReferralStatus: async (id, updatePayload) => {
    const res = await fetch(`${API_BASE}/referrals/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updatePayload)
    });
    return res.json();
  },

  // Analytics & CMO Dashboard
  getDashboardAnalytics: async () => {
    const res = await fetch(`${API_BASE}/analytics/dashboard`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Doctor Panel & Profile Management
  getDoctorProfile: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/doctor/profile?${query}` : `${API_BASE}/doctor/profile`;
    const res = await fetch(url, { headers: getHeaders() });
    return res.json();
  },

  updateDoctorProfile: async (data) => {
    const res = await fetch(`${API_BASE}/doctor/profile`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  lookupDoctorByPhone: async (phone) => {
    try {
      const res = await fetch(`${API_BASE}/doctor/lookup-phone/${encodeURIComponent(phone)}`, {
        headers: getHeaders()
      });
      return await safeJson(res);
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  lookupPatientByPhone: async (phone) => {
    try {
      const res = await fetch(`${API_BASE}/doctor/patient-phone/${encodeURIComponent(phone)}`, {
        headers: getHeaders()
      });
      return await safeJson(res);
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  sendDoctorEmailOtp: async (email) => {
    const res = await fetch(`${API_BASE}/doctor/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  verifyDoctorEmailOtp: async (email, otp) => {
    const res = await fetch(`${API_BASE}/doctor/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    return res.json();
  },

  // Real Google OAuth — sends Google ID token to backend for verification
  googleAuth: async (credential, role = 'patient') => {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, role })
    });
    return res.json();
  },

  doctorGoogleLogin: async (payload) => {
    const res = await fetch(`${API_BASE}/doctor/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },


  // Patient Medical History, Profile & Access Logs
  getPatientHistory: async (id, doctorName = '', doctorId = '') => {
    const params = new URLSearchParams();
    if (doctorName) params.append('doctorName', doctorName);
    if (doctorId) params.append('doctorId', doctorId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/doctor/patient-history/${encodeURIComponent(id)}${query}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  addPatientMedicalHistory: async (id, data) => {
    const res = await fetch(`${API_BASE}/doctor/patient-history/${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updatePatientProfile: async (id, data) => {
    const targetId = id || (data && (data.id || data._id || data.phone)) || 'patient';
    const res = await fetch(`${API_BASE}/doctor/patient-profile/${encodeURIComponent(targetId)}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Doctor Follow-Up Reminders (e.g. Following Day checkup)
  addFollowUpReminder: async (data) => {
    const res = await fetch(`${API_BASE}/doctor/reminder`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getDoctorReminders: async () => {
    const res = await fetch(`${API_BASE}/doctor/reminders`, {
      headers: getHeaders()
    });
    return res.json();
  },

  updateReminderStatus: async (id, status = 'COMPLETED') => {
    const res = await fetch(`${API_BASE}/doctor/reminder/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  // Step 1: Doctor clicks "Mark Done" → OTP sent to patient's email
  sendFollowUpOtp: async (data) => {
    const res = await fetch(`${API_BASE}/doctor/reminder/send-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Step 2: Doctor enters OTP received from patient → follow-up marked COMPLETED
  verifyFollowUpOtp: async (data) => {
    const res = await fetch(`${API_BASE}/doctor/reminder/verify-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Doctor Leave Form & Schedule Management
  submitDoctorLeave: async (data) => {
    const res = await fetch(`${API_BASE}/doctor/leave`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getDoctorScheduleAndLeaves: async () => {
    const res = await fetch(`${API_BASE}/doctor/schedule-leaves`, {
      headers: getHeaders()
    });
    return res.json();
  },

  updateDoctorSchedule: async (data) => {
    const res = await fetch(`${API_BASE}/doctor/schedule`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Patient / Citizen Self-Profile
  getMyPatientProfile: async () => {
    const res = await fetch(`${API_BASE}/patient/profile`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getMyPatientMedicalHistory: async () => {
    const res = await fetch(`${API_BASE}/patient/medical-history`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getMyPrescriptions: async () => {
    const res = await fetch(`${API_BASE}/patient/prescriptions`, {
      headers: getHeaders()
    });
    return res.json();
  },

  updateMyPatientProfile: async (data) => {
    const res = await fetch(`${API_BASE}/patient/profile`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Patient Profile OTP — auto-fetches email from profile, no manual input needed
  sendPatientProfileOtp: async () => {
    const res = await fetch(`${API_BASE}/patient/send-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({})
    });
    return res.json();
  },

  verifyPatientProfileOtp: async (otp) => {
    const res = await fetch(`${API_BASE}/patient/verify-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ otp })
    });
    return res.json();
  },

  // Emergency Blood Bank & Donation NGO Finder
  getBloodBanks: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/blood-banks${query ? `?${query}` : ''}`, {
      headers: getHeaders()
    });
    return safeJson(res);
  },

  createBloodRequest: async (data) => {
    const res = await fetch(`${API_BASE}/blood-request`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return safeJson(res);
  },

  // 14. Unified Patient Identification & Search (Mobile, SSC, ID, QR)
  searchPatientByMobile: async (phone) => {
    const res = await fetch(`${API_BASE}/patients/search/mobile`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ phone })
    });
    return res.json();
  },

  searchPatientBySsc: async (sscCode) => {
    const res = await fetch(`${API_BASE}/patients/search/ssc`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ sscCode })
    });
    return res.json();
  },

  searchPatientByClient: async (clientId) => {
    const res = await fetch(`${API_BASE}/patients/search/client`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ clientId })
    });
    return res.json();
  },

  lookupPatientByQr: async (qrData, qrToken, patientId) => {
    const res = await fetch(`${API_BASE}/patients/lookup/qr`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ qrData, qrToken, patientId })
    });
    return res.json();
  },

  getUnifiedPatientProfile: async (id) => {
    const res = await fetch(`${API_BASE}/patients/${encodeURIComponent(id)}/profile`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // 15. Diseases & Recommendation Catalog
  getDiseases: async () => {
    const res = await fetch(`${API_BASE}/diseases`, {
      headers: getHeaders()
    });
    return res.json();
  },

  createDisease: async (data) => {
    const res = await fetch(`${API_BASE}/diseases`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getDiseaseMedicines: async (diseaseId) => {
    const res = await fetch(`${API_BASE}/diseases/${encodeURIComponent(diseaseId)}/medicines`, {
      headers: getHeaders()
    });
    return res.json();
  },

  linkDiseaseMedicine: async (diseaseId, data) => {
    const res = await fetch(`${API_BASE}/diseases/${encodeURIComponent(diseaseId)}/medicines`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // 16. Prescriptions Database
  createPrescription: async (data) => {
    const res = await fetch(`${API_BASE}/prescriptions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getPrescriptions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/prescriptions${query ? `?${query}` : ''}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getPrescriptionById: async (id) => {
    const res = await fetch(`${API_BASE}/prescriptions/${encodeURIComponent(id)}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getPatientPrescriptions: async (patientId) => {
    const res = await fetch(`${API_BASE}/patients/${encodeURIComponent(patientId)}/prescriptions`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // 17. Medicine Stock Management & Dispensing
  getStock: async () => {
    const res = await fetch(`${API_BASE}/stock`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getStockDashboardMetrics: async () => {
    const res = await fetch(`${API_BASE}/stock/dashboard`, {
      headers: getHeaders()
    });
    return res.json();
  },

  stockIn: async (data) => {
    const res = await fetch(`${API_BASE}/stock/in`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  stockAdjustment: async (data) => {
    const res = await fetch(`${API_BASE}/stock/adjustment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getStockTransactions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/stock/history${query ? `?${query}` : ''}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getMedicineUsage: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/stock/usage${query ? `?${query}` : ''}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  dispensePrescription: async (prescriptionId, payload) => {
    const res = await fetch(`${API_BASE}/prescriptions/${encodeURIComponent(prescriptionId)}/dispense`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // 18. District Admin Stock Analytics & Audit Logs
  getDistrictStockAnalytics: async () => {
    const res = await fetch(`${API_BASE}/analytics/stock`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getAuditLogs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/analytics/audit-logs${query ? `?${query}` : ''}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  systemReset: async (confirmPassword) => {
    const res = await fetch(`${API_BASE}/admin/system-reset`, {
      method: 'DELETE',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmPassword })
    });
    return await handleResponse(res);
  },

  getAdminStats: async () => {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: getHeaders()
    });
    return res.json();
  },

  deletePatient: async (id) => {
    const res = await fetch(`${API_BASE}/admin/patients/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  updatePatient: async (id, data) => {
    const res = await fetch(`${API_BASE}/admin/patients/${id}`, {
      method: 'PUT',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  createAdminUser: async (userData) => {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.json();
  },

  updateAdminUser: async (id, userData) => {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'PUT',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.json();
  },

  deleteAdminUser: async (id) => {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  deletePrescription: async (id) => {
    const cleanId = encodeURIComponent(String(id || '').replace(/^#/, '').trim());
    const res = await fetch(`${API_BASE}/admin/prescriptions/${cleanId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  deleteReferral: async (id) => {
    const cleanId = encodeURIComponent(String(id || '').replace(/^#/, '').trim());
    const res = await fetch(`${API_BASE}/admin/referrals/${cleanId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  purgeCollection: async (collectionName, confirmKeyword = 'CONFIRM_PURGE') => {
    const res = await fetch(`${API_BASE}/admin/collections/${collectionName}`, {
      method: 'DELETE',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmKeyword })
    });
    return res.json();
  },

  // ─── USERNAME MANAGEMENT ──────────────────────────────────────────────────
  updateUsername: async (username) => {
    const res = await fetch(`${API_BASE}/auth/username`, {
      method: 'PATCH',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    return res.json();
  },
  adminResetUsername: async (userId, username) => {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/username`, {
      method: 'PATCH',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    return res.json();
  },

  // ─── ADMIN PROFILE ────────────────────────────────────────────────────────
  getAdminProfile: async () => {
    const res = await fetch(`${API_BASE}/admin/profile`, { headers: getHeaders() });
    return res.json();
  },
  updateAdminProfile: async (data) => {
    const res = await fetch(`${API_BASE}/admin/profile`, {
      method: 'PUT',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // ─── STAFF / ASHA PROFILE ─────────────────────────────────────────────────
  getStaffProfile: async () => {
    const res = await fetch(`${API_BASE}/staff/profile`, { headers: getHeaders() });
    return res.json();
  },
  updateStaffProfile: async (data) => {
    const res = await fetch(`${API_BASE}/staff/profile`, {
      method: 'PUT',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // ─── PATIENT FIELD VISITS (ASHA) ─────────────────────────────────────────
  getMyFieldVisits: async () => {
    const res = await fetch(`${API_BASE}/patient/field-visits`, { headers: getHeaders() });
    return res.json();
  },

  // ─── CONTACT US ──────────────────────────────────────────────────────────
  submitContactMessage: async (data) => {
    const res = await fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getContactMessages: async (status = '') => {
    const qs = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE}/admin/contact-messages${qs}`, { headers: getHeaders() });
    return res.json();
  },
  updateContactMessageStatus: async (id, status) => {
    const res = await fetch(`${API_BASE}/admin/contact-messages/${id}`, {
      method: 'PATCH',
      headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  // ─── USER LIST FOR ADMIN USERNAME MANAGEMENT ─────────────────────────────
  getUsers: async () => {
    const res = await fetch(`${API_BASE}/auth/users`, { headers: getHeaders() });
    return res.json();
  },

  // ─── MEDICAL RECORD INTELLIGENCE & OCR ────────────────────────────────────
  uploadMedicalDocument: async (formData) => {
    const token = localStorage.getItem('gramin_arogya_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const user = localStorage.getItem('gramin_arogya_user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        if (parsed && (parsed.id || parsed._id)) headers['x-user-id'] = parsed.id || parsed._id;
      } catch {}
    }
    const res = await fetch(`${API_BASE}/medical-documents/upload`, {
      method: 'POST',
      headers,
      body: formData
    });
    return safeJson(res);
  },

  getMyMedicalDocuments: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.category && params.category !== 'all') searchParams.append('category', params.category);
    if (params.search) searchParams.append('search', params.search);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await fetch(`${API_BASE}/medical-documents${qs}`, { headers: getHeaders() });
    return safeJson(res);
  },

  getMedicalDocumentById: async (id) => {
    const res = await fetch(`${API_BASE}/medical-documents/${id}`, { headers: getHeaders() });
    return safeJson(res);
  },

  updateMedicalDocumentCorrections: async (id, correctedData, auditNote = '') => {
    const res = await fetch(`${API_BASE}/medical-documents/${id}/corrections`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ correctedData, auditNote })
    });
    return safeJson(res);
  },

  verifyMedicalDocument: async (id) => {
    const res = await fetch(`${API_BASE}/medical-documents/${id}/verify`, {
      method: 'POST',
      headers: getHeaders()
    });
    return safeJson(res);
  },

  retryMedicalDocumentProcessing: async (id) => {
    const res = await fetch(`${API_BASE}/medical-documents/${id}/retry`, {
      method: 'POST',
      headers: getHeaders()
    });
    return safeJson(res);
  },

  deleteMedicalDocument: async (id) => {
    const res = await fetch(`${API_BASE}/medical-documents/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return safeJson(res);
  },

  getMedicalDocumentFileUrl: (id) => {
    const token = localStorage.getItem('gramin_arogya_token');
    return `${API_BASE}/medical-documents/${id}/file${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },

  configureAiKey: async ({ provider, apiKey, model }) => {
    const res = await fetch(`${API_BASE}/medical-documents/configure-ai`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ provider, apiKey, model })
    });
    return safeJson(res);
  },

  reAnalyzeDocument: async (id) => {
    const res = await fetch(`${API_BASE}/medical-documents/${id}/re-analyze`, {
      method: 'POST',
      headers: getHeaders()
    });
    return safeJson(res);
  },

  // ─── ABDM & HL7 FHIR EXPORT / IMPORT ─────────────────────────────────────────
  exportDocumentFhirUrl: (documentId) => {
    return `${API_BASE}/abdm/fhir/document/${documentId}`;
  },

  linkAbha: async (data = {}) => {
    const res = await fetch(`${API_BASE}/abdm/link-abha`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return safeJson(res);
  },

  importAbdmRecords: async (patientId) => {
    const res = await fetch(`${API_BASE}/abdm/import-records`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ patientId })
    });
    return safeJson(res);
  }
};

export default api;



