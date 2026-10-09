import React, { useState, useEffect, useRef } from 'react';
import ConsultationWorkspace from '../components/doctor/ConsultationWorkspace';
import ReferralWorkspace from '../components/doctor/ReferralWorkspace';
import DiagnosticsView from '../components/doctor/DiagnosticsView';
import EmergencyActionView from '../components/doctor/EmergencyActionView';
import NotificationsView from '../components/doctor/NotificationsView';
import PatientLookupView from '../components/doctor/PatientLookupView';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import HeartbeatLoader from '../components/HeartbeatLoader';
import { Stethoscope, UserCheck, Shield, Phone, Mail, Award, FileText, Printer, Sparkles, CheckCircle2, AlertCircle, Search, Building2, Clock, IndianRupee, Camera, Image as ImageIcon, PenTool, Save, RefreshCw, ExternalLink, ArrowRight, Heart, Plus, Trash2, QrCode, Share2, Bell, Calendar, Edit3 , Activity, ClipboardList, Users, MessageSquare, HeartPulse, CheckSquare, FileCheck, TrendingUp, X, AlertTriangle, Palette, Upload, Check, Edit2, Loader } from 'lucide-react';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../utils/api';
import PatientMedicalHistoryView from '../components/doctor/PatientMedicalHistoryView';
import DoctorScheduleView from '../components/doctor/DoctorScheduleView';
import DoctorLeaveScheduleView from '../components/doctor/DoctorLeaveScheduleView';
import DoctorRemindersView from '../components/doctor/DoctorRemindersView';
export default function DoctorPanel({
  currentUser,
  onAuthSuccess,
  activeSubTab: propActiveSubTab,
  setActiveSubTab: propSetActiveSubTab
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Tabs: 'dashboard', 'history', 'reminders', 'leaveSchedule', 'profile', 'branding', 'prescriptions', 'phoneFetch', 'consultation', 'referrals', 'diagnostics', 'emergency', 'notifications'
  const [internalSubTab, setInternalSubTab] = useState('dashboard');

  useEffect(() => {
    const path = location.pathname;
    if (path === '/doctor') setInternalSubTab('dashboard');
    else if (path.includes('/doctor/patients/lookup')) setInternalSubTab('phoneFetch');
    else if (path.includes('/doctor/patients')) setInternalSubTab('history');
    else if (path.includes('/doctor/consultation')) setInternalSubTab('consultation');
    else if (path.includes('/doctor/prescriptions')) setInternalSubTab('prescriptions');
    else if (path.includes('/doctor/follow-ups')) setInternalSubTab('reminders');
    else if (path.includes('/doctor/referrals')) setInternalSubTab('referrals');
    else if (path.includes('/doctor/diagnostics')) setInternalSubTab('diagnostics');
    else if (path.includes('/doctor/schedule')) setInternalSubTab('leaveSchedule');
    else if (path.includes('/doctor/notifications')) setInternalSubTab('notifications');
    else if (path.includes('/doctor/profile')) setInternalSubTab('profile');
    else if (path.includes('/doctor/branding')) setInternalSubTab('branding');
    else if (path.includes('/doctor/emergency')) setInternalSubTab('emergency');
    else if (propActiveSubTab && propActiveSubTab !== internalSubTab) {
      setInternalSubTab(propActiveSubTab);
    }
  }, [location.pathname, propActiveSubTab]);

  const activeSubTab = internalSubTab;
    // Extract patientId from URL if present
  const pathParts = location.pathname.split('/');
  let activePatientId = null;
  if (pathParts.length >= 4 && (pathParts[2] === 'patients' || pathParts[2] === 'consultation')) {
    if (pathParts[3] !== 'lookup') {
      activePatientId = pathParts[3];
    }
  }
  const setActiveSubTab = tab => {
    if (propSetActiveSubTab) {
      propSetActiveSubTab(tab);
    }
    if (tab === 'dashboard') navigate('/doctor');
    else if (tab === 'phoneFetch') navigate('/doctor/patients/lookup');
    else if (tab === 'history') navigate('/doctor/patients');
    else if (tab === 'consultation') navigate('/doctor/consultation');
    else if (tab === 'prescriptions') navigate('/doctor/prescriptions');
    else if (tab === 'reminders') navigate('/doctor/follow-ups');
    else if (tab === 'referrals') navigate('/doctor/referrals');
    else if (tab === 'diagnostics') navigate('/doctor/diagnostics');
    else if (tab === 'leaveSchedule') navigate('/doctor/schedule');
    else if (tab === 'notifications') navigate('/doctor/notifications');
    else if (tab === 'profile') navigate('/doctor/profile');
    else if (tab === 'branding') navigate('/doctor/branding');
    else if (tab === 'emergency') navigate('/doctor/emergency');
  };
  const [pendingReminderCount, setPendingReminderCount] = useState(0);
  const [selectedHistoryPatientId, setSelectedHistoryPatientId] = useState('');
  const [historyInitialTab, setHistoryInitialTab] = useState('history');
  const [loading, setLoading] = useState(false);
  const [photoPending, setPhotoPending] = useState(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Doctor Profile Form State - Loaded from Database
  const [doctorId, setDoctorId] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [medicalCouncil, setMedicalCouncil] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [consultationHours, setConsultationHours] = useState('');
  const [consultationFee, setConsultationFee] = useState(0);
  const [bio, setBio] = useState('');

  // Custom Branding Settings - Loaded from Database
  const [brandingLogo, setBrandingLogo] = useState('');
  const [headerTitle, setHeaderTitle] = useState('');
  const [headerSubtitle, setHeaderSubtitle] = useState('');
  const [headerContact, setHeaderContact] = useState('');
  const [headerBgColor, setHeaderBgColor] = useState('#064e3b');
  const [footerText, setFooterText] = useState('');
  const [signatureImage, setSignatureImage] = useState('');
  const [themeColor, setThemeColor] = useState('#059669');
  const [showLetterheadModal, setShowLetterheadModal] = useState(false);
  const padLogoInputRef = useRef(null);

  // Authentication State (Doctor ID & Password, Google, Email OTP)
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('idPass'); // 'idPass' | 'emailOtp' | 'google'
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpPreview, setDevOtpPreview] = useState('');
  const [authStatusMsg, setAuthStatusMsg] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Mobile Number Data Fetching State ("Mobile no thi data fetch that joi")
  const [searchMobile, setSearchMobile] = useState('');
  const [phoneSearchLoading, setPhoneSearchLoading] = useState(false);
  const [fetchedDoctorData, setFetchedDoctorData] = useState(null);
  const [fetchedPatientData, setFetchedPatientData] = useState(null);
  const [phoneSearchMsg, setPhoneSearchMsg] = useState('');

  // Interactive Prescription Pad State - Populated from Database when patient selected
  const [rxPatientName, setRxPatientName] = useState('');
  const [rxPatientAge, setRxPatientAge] = useState('');
  const [rxPatientGender, setRxPatientGender] = useState('');
  const [rxPatientPhone, setRxPatientPhone] = useState('');
  const [rxDiagnosis, setRxDiagnosis] = useState('');
  const [rxVitals, setRxVitals] = useState('');
  const [rxMedicines, setRxMedicines] = useState([{
    name: '',
    dosage: '',
    duration: '',
    instruction: ''
  }]);
  const [rxAdvice, setRxAdvice] = useState('');

  // File upload refs
  const profilePhotoInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const signatureInputRef = useRef(null);


  // Dashboard Overview Stats
  const [dashboardStats, setDashboardStats] = useState({
    todaysPatients: 0,
    pendingConsultations: 0,
    completedConsultations: 0,
    pendingFollowUps: 0,
    pendingReferrals: 0,
    notifications: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const loadDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const res = await api.getDashboardStats();
      if (res && res.success && res.stats) {
        setDashboardStats(res.stats);
      }
    } catch (e) {
      console.warn("Could not load dashboard stats:", e);
    } finally {
      setStatsLoading(false);
    }
  };

  
  const handlePhotoSelectHeader = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2.5 * 1024 * 1024) {
        setErrorMsg('Image size must be less than 2.5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPending(reader.result);
        setErrorMsg('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePhotoHeader = async () => {
    if (!photoPending) return;
    setSavingPhoto(true);
    setErrorMsg('');
    try {
      const payload = {
        doctorId: doctorId || undefined,
        doctorName,
        specialization,
        qualification,
        phone,
        email,
        registrationNumber,
        medicalCouncil,
        experienceYears,
        profilePhoto: photoPending === 'REMOVED' ? '' : photoPending,
        clinicName,
        clinicAddress,
        consultationHours,
        consultationFee,
        bio,
        branding: {
          logo: brandingLogo,
          headerTitle,
          headerSubtitle,
          headerContact,
          headerBgColor,
          footerText,
          signatureImage,
          themeColor,
          showWatermark: true
        }
      };
      const res = await api.updateDoctorProfile(payload);
      if (res.success) {
        setSaveSuccess('Profile photo updated successfully!');
        if (res.profile) populateProfileFields(res.profile);
        setPhotoPending(null);
        setTimeout(() => setSaveSuccess(''), 4000);
      } else {
        setErrorMsg(res.message || 'Failed to save profile photo.');
      }
    } catch (err) {
      setErrorMsg('Error saving photo. Please check network.');
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleCancelPhotoHeader = () => {
    setPhotoPending(null);
    setErrorMsg('');
  };

  const [stockMedicines, setStockMedicines] = useState([]);

  // Fetch Doctor Profile on mount & live reminder count poll
  useEffect(() => {
    loadDoctorProfile(); refreshReminderCount(); loadDashboardStats();
    
    // Load inventory for datalist
    api.getStock().then(res => {
      if (res.success) setStockMedicines(res.data || []);
    }).catch(e => console.error(e));

    const interval = setInterval(() => {
      refreshReminderCount();
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);
  const refreshReminderCount = async () => {
    try {
      const res = await api.getDoctorReminders();
      if (res.success && res.reminders) {
        setPendingReminderCount(res.reminders.filter(r => r.status === 'PENDING').length);
      }
    } catch {}
  };
  const loadDoctorProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getDoctorProfile();
      if (res.success && res.profile) {
        populateProfileFields(res.profile);
      } else if (currentUser) {
        // Load directly from current logged in user in database
        setDoctorName(currentUser.name || '');
        setPhone(currentUser.phone || '');
        setEmail(currentUser.username && currentUser.username.includes('@') ? currentUser.username : '');
        setSpecialization(currentUser.designation || '');
        setClinicName(currentUser.facilityName || '');
      }
    } catch (e) {
      console.warn('Could not load doctor profile from server:', e);
    } finally {
      setLoading(false);
    }
  };
  const populateProfileFields = p => {
    if (!p) return;
    setDoctorId(p.doctorId || '');
    setDoctorName(p.doctorName || currentUser?.name || '');
    setSpecialization(p.specialization || '');
    setQualification(p.qualification || '');
    setPhone(p.phone || currentUser?.phone || '');
    setEmail(p.email || (currentUser?.username?.includes('@') ? currentUser.username : ''));
    setRegistrationNumber(p.registrationNumber || '');
    setMedicalCouncil(p.medicalCouncil || '');
    setExperienceYears(p.experienceYears || 0);
    setProfilePhoto(p.profilePhoto || '');
    setClinicName(p.clinicName || currentUser?.facilityName || '');
    setClinicAddress(p.clinicAddress || '');
    setConsultationHours(p.consultationHours || '');
    setConsultationFee(p.consultationFee || 0);
    setBio(p.bio || '');
    if (p.branding) {
      setBrandingLogo(p.branding.logo || '');
      setHeaderTitle(p.branding.headerTitle || '');
      setHeaderSubtitle(p.branding.headerSubtitle || '');
      setHeaderContact(p.branding.headerContact || '');
      setHeaderBgColor(p.branding.headerBgColor || '#064e3b');
      setFooterText(p.branding.footerText || '');
      setSignatureImage(p.branding.signatureImage || '');
      setThemeColor(p.branding.themeColor || '#059669');
    }
  };

  // Save Doctor Profile & Branding
  const handleSaveProfile = async e => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSaveSuccess('');
    setLoading(true);
    try {
      const payload = {
        doctorId: doctorId || undefined,
        doctorName,
        specialization,
        qualification,
        phone,
        email,
        registrationNumber,
        medicalCouncil,
        experienceYears,
        profilePhoto,
        clinicName,
        clinicAddress,
        consultationHours,
        consultationFee,
        bio,
        branding: {
          logo: brandingLogo,
          headerTitle,
          headerSubtitle,
          headerContact,
          headerBgColor,
          footerText,
          signatureImage,
          themeColor,
          showWatermark: true
        }
      };
      const res = await api.updateDoctorProfile(payload);
      if (res.success) {
        setSaveSuccess('Doctor Profile & Branding saved successfully to central database!');
        confetti({
          particleCount: 60,
          spread: 70,
          origin: {
            y: 0.6
          }
        });
        if (res.profile) populateProfileFields(res.profile);
        setTimeout(() => setSaveSuccess(''), 5000);
      } else {
        setErrorMsg(res.message || 'Failed to save doctor profile.');
      }
    } catch (err) {
      setErrorMsg('Error saving profile. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  // Image Upload Helpers (Converts file to Base64)
  const handleFileUpload = (e, setField) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2.5 * 1024 * 1024) {
        alert('File size exceeds 2.5MB. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setField(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Dedicated Save Handler for Letterhead & Clinic Logo Customization
  const handleSaveLetterhead = async () => {
    setErrorMsg('');
    setSaveSuccess('');
    try {
      const payload = {
        doctorId: doctorId || undefined,
        doctorName: doctorName || currentUser?.name || 'Dr. Attending Physician',
        specialization: specialization || 'General Physician',
        qualification: qualification || 'MBBS',
        phone: phone || currentUser?.phone || '',
        email: email || currentUser?.username || '',
        registrationNumber: registrationNumber || 'NMC-REG-PENDING',
        medicalCouncil: medicalCouncil || 'National Medical Commission',
        experienceYears,
        profilePhoto,
        clinicName: clinicName || headerTitle || 'Arogya Healthcare Centre',
        clinicAddress,
        consultationHours,
        consultationFee,
        bio,
        branding: {
          logo: brandingLogo,
          headerTitle: headerTitle || clinicName,
          headerSubtitle,
          headerContact,
          headerBgColor: themeColor || '#0f766e',
          footerText,
          signatureImage,
          themeColor: themeColor || '#0f766e',
          showWatermark: true
        }
      };
      const res = await api.updateDoctorProfile(payload);
      if (res.success) {
        setSaveSuccess('Clinic Letterhead & Logo updated successfully! ✅');
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        if (res.profile) populateProfileFields(res.profile);
        setShowLetterheadModal(false);
        setTimeout(() => setSaveSuccess(''), 4000);
      } else {
        alert(res.message || 'Failed to update letterhead.');
      }
    } catch (err) {
      alert('Network error while saving letterhead settings.');
    }
  };

  // 0. Authentication: Doctor ID & Password Login
  const handleDoctorIdPassLogin = async (e) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword) {
      setAuthStatusMsg('Please enter your Doctor ID (DOC-XXXXXX) or Registered Phone/Email and Password.');
      return;
    }
    setAuthLoading(true);
    setAuthStatusMsg('');
    try {
      const res = await api.login({
        username: loginIdentifier.trim(),
        password: loginPassword,
        role: 'doctor'
      });
      if (res.success) {
        localStorage.setItem('gramin_arogya_token', res.token);
        localStorage.setItem('gramin_arogya_user', JSON.stringify(res.user));
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.5 }
        });
        if (onAuthSuccess) onAuthSuccess(res.user);
        if (res.profile) {
          populateProfileFields(res.profile);
        } else {
          loadDoctorProfile();
        }
        setShowAuthModal(false);
        setLoginIdentifier('');
        setLoginPassword('');
        setSaveSuccess(`Welcome, Dr. ${res.user.name}! Logged in successfully.`);
      } else {
        setAuthStatusMsg(res.message || res.error || 'Invalid credentials. Please verify your Doctor ID / Phone and password.');
      }
    } catch (err) {
      console.error('Doctor ID/Password login error:', err);
      setAuthStatusMsg('Network error. Failed to authenticate.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 1. Authentication: Send Email OTP
  const handleSendEmailOtp = async e => {
    e.preventDefault();
    if (!otpEmail || !otpEmail.includes('@')) {
      setAuthStatusMsg('Please enter a valid email address.');
      return;
    }
    setAuthLoading(true);
    setAuthStatusMsg('');
    try {
      const res = await api.sendDoctorEmailOtp(otpEmail);
      if (res.success) {
        setOtpSent(true);
        setAuthStatusMsg(res.message || 'OTP sent to your email! Please check your inbox.');
      } else {
        setAuthStatusMsg(res.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setAuthStatusMsg('Network error while requesting OTP.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 1. Authentication: Verify Email OTP
  const handleVerifyEmailOtp = async e => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setAuthStatusMsg('Please enter the OTP code received.');
      return;
    }
    setAuthLoading(true);
    setAuthStatusMsg('');
    try {
      const res = await api.verifyDoctorEmailOtp(otpEmail, otpCode);
      if (res.success) {
        localStorage.setItem('gramin_arogya_token', res.token);
        localStorage.setItem('gramin_arogya_user', JSON.stringify(res.user));
        confetti({
          particleCount: 80,
          spread: 80,
          origin: {
            y: 0.5
          }
        });
        if (onAuthSuccess) onAuthSuccess(res.user);
        if (res.profile) populateProfileFields(res.profile);
        setShowAuthModal(false);
        setOtpSent(false);
        setOtpCode('');
        setSaveSuccess(`Welcome, ${res.user.name}! Logged in via Email OTP.`);
      } else {
        setAuthStatusMsg(res.message || 'Invalid OTP code.');
      }
    } catch (err) {
      setAuthStatusMsg('Verification failed. Check network.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 2. Authentication: Google Login Simulation / One-Tap
  const handleGoogleLogin = async (simulatedAccount = null) => {
    setAuthLoading(true);
    setAuthStatusMsg('');
    try {
      const payload = simulatedAccount || {
        email: email || currentUser?.username || 'doctor@graminarogya.in',
        name: doctorName || currentUser?.name || 'Doctor',
        googleId: 'goog_' + Date.now(),
        picture: profilePhoto || ''
      };
      const res = await api.doctorGoogleLogin(payload);
      if (res.success) {
        localStorage.setItem('gramin_arogya_token', res.token);
        localStorage.setItem('gramin_arogya_user', JSON.stringify(res.user));
        confetti({
          particleCount: 90,
          spread: 90,
          origin: {
            y: 0.5
          }
        });
        if (onAuthSuccess) onAuthSuccess(res.user);
        if (res.profile) populateProfileFields(res.profile);
        setShowAuthModal(false);
        setSaveSuccess(`Google sign-in successful! Welcome, ${res.user.name}.`);
      } else {
        setAuthStatusMsg(res.message || 'Google authentication failed.');
      }
    } catch (err) {
      setAuthStatusMsg('Google sign-in failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 3. Mobile Number Data Fetching ("Mobile no thi data fetch that joi")
  const handleFetchByMobile = async (e, phoneOverride) => {
    if (e && e.preventDefault) e.preventDefault();
    const phoneToSearch = (phoneOverride || searchMobile || '').trim();
    if (!phoneToSearch || phoneToSearch.length < 6) {
      setPhoneSearchMsg('Please enter a valid 10-digit mobile number (e.g. 9876543210)');
      return;
    }
    if (phoneOverride) {
      setSearchMobile(phoneOverride);
    }
    setPhoneSearchLoading(true);
    setPhoneSearchMsg('');
    setFetchedDoctorData(null);
    setFetchedPatientData(null);
    try {
      // 1. Try to fetch doctor profile by mobile number
      const docRes = await api.lookupDoctorByPhone(phoneToSearch);
      if (docRes && docRes.success && docRes.doctor) {
        setFetchedDoctorData(docRes.doctor);
      }

      // 2. Try to fetch patient & clinical records by mobile number
      const patRes = await api.lookupPatientByPhone(phoneToSearch);
      if (patRes && patRes.success) {
        setFetchedPatientData(patRes);
      }
      
      const hasDoctor = Boolean(docRes && docRes.success && docRes.doctor);
      const hasPatients = Boolean(patRes && patRes.success && patRes.patients && patRes.patients.length > 0);

      if (!hasDoctor && !hasPatients) {
        setPhoneSearchMsg(`No records found for mobile number ${phoneToSearch}. You can use this number to register a new patient or create a doctor profile.`);
      } else {
        const parts = [];
        if (hasDoctor) parts.push(`Doctor Profile (${docRes.doctor.doctorName || 'Doctor'})`);
        if (hasPatients) parts.push(`${patRes.patients.length} Patient Record(s)`);
        if (patRes && patRes.prescriptions && patRes.prescriptions.length > 0) {
          parts.push(`${patRes.prescriptions.length} Prescription(s)`);
        }
        setPhoneSearchMsg(`✅ Successfully retrieved from central database: ${parts.join(' and ')}.`);
      }
    } catch (err) {
      setPhoneSearchMsg('Error fetching data for mobile number. Please check connection.');
    } finally {
      setPhoneSearchLoading(false);
    }
  };

  // Quick auto-fetch directly from Prescription Pad input
  const handleAutoFetchRxPatient = async (phone) => {
    const rawPhone = (phone || rxPatientPhone || '').trim();
    if (!rawPhone || rawPhone.length < 6) {
      setSaveSuccess('Please enter a valid patient mobile number first');
      return;
    }
    try {
      const res = await api.lookupPatientByPhone(rawPhone);
      if (res && res.success && res.patients && res.patients.length > 0) {
        const p = res.patients[0];
        setRxPatientName(p.name || '');
        setRxPatientAge(p.age ? String(p.age) : '30');
        setRxPatientGender(p.gender || 'Female');
        setRxDiagnosis(p.chiefComplaint || 'Clinical Consultation');
        if (p.vitals) {
          setRxVitals(`BP: ${p.vitals.bp || '120/80'} | SpO2: ${p.vitals.spo2 || 98}% | Pulse: ${p.vitals.pulse || 72} bpm | Temp: ${p.vitals.temp || 98.4}°F`);
        }
        setSaveSuccess(`Patient ${p.name} (${p.village || 'Village'}) data auto-filled from Database!`);
      } else {
        setSaveSuccess(`No existing patient found for mobile ${rawPhone}. You can enter new details.`);
      }
    } catch (e) {
      setSaveSuccess('Error querying database for patient.');
    }
  };

  // Load fetched doctor profile directly into editor
  const handleApplyFetchedDoctor = doc => {
    populateProfileFields(doc);
    setActiveSubTab('profile');
    setSaveSuccess(`Applied profile data for ${doc.doctorName} (Mobile: ${doc.phone})`);
  };

  // Load fetched patient details into Prescription Pad
  const handleLoadPatientToRx = patient => {
    setRxPatientName(patient.name);
    setRxPatientAge(patient.age ? String(patient.age) : '30');
    setRxPatientGender(patient.gender || 'Female');
    setRxPatientPhone(patient.phone || searchMobile);
    setRxDiagnosis(patient.chiefComplaint || 'Clinical Consultation');
    if (patient.vitals) {
      setRxVitals(`BP: ${patient.vitals.bp || '120/80'} | SpO2: ${patient.vitals.spo2 || 98}% | Pulse: ${patient.vitals.pulse || 72} bpm | Temp: ${patient.vitals.temp || 98.4}°F`);
    }
    setActiveSubTab('prescriptions');
    setSaveSuccess(`Patient ${patient.name} details loaded into Prescription Pad!`);
  };

  // Add a new medicine row in Rx Pad
  const handleAddMedicine = () => {
    setRxMedicines([...rxMedicines, {
      name: '',
      dosage: '1 tablet once daily',
      duration: '3 days',
      instruction: 'After food'
    }]);
  };

  // Remove medicine row
  const handleRemoveMedicine = idx => {
    setRxMedicines(rxMedicines.filter((_, i) => i !== idx));
  };

  // Save & Issue Prescription to Database
  const [savingRx, setSavingRx] = useState(false);
  const handleSavePrescription = async () => {
    if (!rxPatientName.trim() && !rxPatientPhone.trim()) {
      alert('Please specify Patient Name or Mobile Number for this prescription.');
      return;
    }
    const validMeds = rxMedicines.filter(m => m.name && m.name.trim());
    if (validMeds.length === 0) {
      alert('Please add at least one medicine with a name.');
      return;
    }

    setSavingRx(true);
    try {
      const payload = {
        patientId: rxPatientPhone || rxPatientName,
        patientName: rxPatientName.trim(),
        patientPhone: rxPatientPhone.trim(),
        diagnosis: rxDiagnosis.trim() || 'Clinical Consultation',
        clinicalNotes: rxAdvice.trim(),
        facilityName: clinicName || 'Primary Health Centre',
        medicines: validMeds.map(m => ({
          medicineName: m.name.trim(),
          dosage: m.dosage || '1 tablet once daily',
          duration: m.duration || '3 days',
          instructions: m.instruction || 'After food',
          prescribedQty: 10
        }))
      };

      const res = await api.createPrescription(payload);
      if (res.success) {
        setSaveSuccess(`Prescription #${res.prescription.prescriptionId} issued and saved to patient record! ✅`);
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        // Real-time synchronization trigger for patient profile
        try {
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const bc = new BroadcastChannel('prescription_updates');
            bc.postMessage({ type: 'PRESCRIPTION_ADDED', prescription: res.prescription, patientId: res.prescription?.patientId });
            bc.close();
          }
          localStorage.setItem('prescription_sync_event', JSON.stringify({
            type: 'PRESCRIPTION_ADDED',
            timestamp: Date.now(),
            prescription: res.prescription,
            patientId: res.prescription?.patientId
          }));
        } catch (e) {}
      } else {
        alert(res.message || 'Failed to save prescription.');
      }
    } catch (err) {
      alert('Network error while saving prescription.');
    } finally {
      setSavingRx(false);
    }
  };

  // Print Prescription with Exact Preserved Visual Formatting (A4 1-Page Output)
  const handlePrintPrescription = () => {
    const rxElement = document.getElementById('printable-prescription');
    if (!rxElement) {
      window.print();
      return;
    }

    try {
      // Clone element while preserving exact layout and borders
      const clone = rxElement.cloneNode(true);

      // Remove UI buttons, customize badges & file inputs from cloned print document
      clone.querySelectorAll('.no-print, button, input[type="file"]').forEach(el => el.remove());

      // Sync live typed values into cloned input values without destroying input boxes
      const origInputs = rxElement.querySelectorAll('input, textarea');
      const cloneInputs = clone.querySelectorAll('input, textarea');
      origInputs.forEach((orig, idx) => {
        const dest = cloneInputs[idx];
        if (!dest) return;
        dest.value = orig.value || '';
        dest.setAttribute('value', orig.value || '');
        if (orig.tagName.toLowerCase() === 'textarea') {
          dest.textContent = orig.value || '';
        }
      });

      // Remove any existing print iframe
      const existingIframe = document.getElementById('rx-isolated-print-frame');
      if (existingIframe) {
        existingIframe.remove();
      }

      // Create hidden iframe dedicated to printing
      const iframe = document.createElement('iframe');
      iframe.id = 'rx-isolated-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Prescription_${(rxPatientName || 'Patient').replace(/\\s+/g, '_')}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <style>
              @page {
                size: A4 portrait;
                margin: 6mm 10mm;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: #0f172a;
                font-size: 13px;
                width: 100%;
              }
              #printable-prescription {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 auto !important;
                border: 1.5px solid #cbd5e1 !important;
                box-shadow: none !important;
                background: #ffffff !important;
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
              }
              input, textarea {
                border: 1.5px solid #0f766e !important;
                border-radius: 4px !important;
                background: #ffffff !important;
                color: #0f172a !important;
                font-family: inherit !important;
                font-size: inherit !important;
                font-weight: inherit !important;
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              table {
                width: 100%;
                border-collapse: collapse;
              }
              th {
                background: #f8fafc !important;
                border: 1px solid #e2e8f0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              td {
                border: 1px solid #e2e8f0 !important;
              }
              .no-print, button, input[type="file"] {
                display: none !important;
              }
            </style>
          </head>
          <body>
            ${clone.outerHTML}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }, 400);
    } catch (e) {
      console.warn('Iframe print fallback triggered:', e);
      window.print();
    }
  };
    return <div className="doctor-portal-container" style={{
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '24px 20px',
    fontFamily: "'Inter', sans-serif",
    width: '100%',
    boxSizing: 'border-box'
  }}>
    <style>{`
      .doctor-portal-container * {
        box-sizing: border-box;
      }
      .pill-nav::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
      .pill-nav {
        -ms-overflow-style: none !important;
        scrollbar-width: none !important;
        flex-wrap: nowrap !important;
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch !important;
        gap: 8px !important;
        padding: 10px !important;
        justify-content: flex-start;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      @media (min-width: 1200px) {
        .pill-nav { justify-content: space-between; }
        .pill-nav button { flex: 1; justify-content: center; }
      }
      
      .hero-header {
        width: 100%;
        box-sizing: border-box;
      }
      .hero-actions-container {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 10px;
        z-index: 1;
      }
      .hero-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
        width: 100%;
        box-sizing: border-box;
      }
      .stat-card {
        padding: 20px;
        width: 100%;
        box-sizing: border-box;
      }
      
      @media (max-width: 900px) {
        .hero-header {
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 20px !important;
          padding: 24px 20px !important;
        }
        .hero-actions-container {
          align-items: stretch !important;
          width: 100% !important;
        }
        .hero-actions-container .quick-actions-label {
          text-align: center !important;
        }
        .hero-actions {
          display: grid !important;
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 8px !important;
          width: 100% !important;
          justify-content: stretch !important;
        }
        .hero-actions button {
          width: 100% !important;
          min-width: 0 !important;
          justify-content: center !important;
          min-height: 44px !important;
        }
      }
      
      @media (max-width: 768px) {
        .doctor-portal-container {
          padding: 16px 14px !important;
          width: 100% !important;
          max-width: 100vw !important;
          overflow-x: hidden !important;
        }
        .hero-header {
          padding: 18px 14px !important;
          border-radius: 12px !important;
          text-align: center !important;
        }
        .hero-info-wrap {
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
          gap: 16px !important;
          min-width: 0 !important;
          width: 100% !important;
        }
        .hero-tags {
          justify-content: center !important;
          gap: 10px !important;
        }
        .hero-title-wrap {
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
        }
        .stats-grid {
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 10px !important;
        }
        .stat-card {
          padding: 14px 12px !important;
        }
        .stat-card-title {
          font-size: 0.75rem !important;
        }
        .stat-card-value {
          font-size: 1.4rem !important;
        }
        .pill-nav {
          padding: 6px !important;
          gap: 6px !important;
          border-radius: 10px !important;
          margin-bottom: 20px !important;
        }
        .pill-nav button {
          padding: 8px 12px !important;
          font-size: 0.8rem !important;
          min-height: 40px !important;
          flex-shrink: 0 !important;
        }
      }
      
      @media (max-width: 480px) {
        .hero-actions {
          grid-template-columns: 1fr !important;
        }
        .hero-title {
          font-size: 1.35rem !important;
        }
      }

      @media (max-width: 360px) {
        .doctor-portal-container {
          padding: 12px 8px !important;
        }
        .stats-grid {
          grid-template-columns: 1fr !important;
          gap: 8px !important;
        }
      }
    `}</style>

      {/* Professional Doctor Dashboard Header */}
      <div className="hero-header" style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
        borderRadius: '16px',
        padding: '32px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        {/* Subtle decorative background */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%230d9488\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          pointerEvents: 'none'
        }} />

        <div className="hero-info-wrap" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flex: 1,
          minWidth: 0,
          zIndex: 1
        }}>
          
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative', width: '96px', height: '96px' }}>
              {(photoPending && photoPending !== 'REMOVED' ? photoPending : (photoPending === 'REMOVED' ? '' : profilePhoto)) ? (
                <img src={photoPending && photoPending !== 'REMOVED' ? photoPending : (photoPending === 'REMOVED' ? '' : profilePhoto)} alt={doctorName || 'Doctor'} style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: "4px solid #fff",
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  backgroundColor: '#fff'
                }} />
              ) : (
                <div style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  background: '#f0fdf4',
                  border: "4px solid #fff",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  <Stethoscope size={44} color="#0d9488" />
                </div>
              )}
              
              {!photoPending && (
                <label style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  background: '#fff',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #e2e8f0',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  zIndex: 2,
                  color: '#0f766e'
                }}>
                  <Camera size={14} />
                  <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handlePhotoSelectHeader} />
                </label>
              )}
            </div>

            {/* Verification Badge */}
            <div style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#10b981',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #fff',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}>
              <CheckCircle2 size={14} color="#fff" />
            </div>
          </div>

          {photoPending && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 2 }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={handleSavePhotoHeader} disabled={savingPhoto} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                  background: '#10b981', border: 'none', borderRadius: '6px',
                  fontWeight: 600, fontSize: '0.8rem', color: '#fff', cursor: savingPhoto ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                }}>
                  {savingPhoto ? <HeartbeatLoader size="small" /> : <Save size={14} />}
                  {savingPhoto ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={handleCancelPhotoHeader} disabled={savingPhoto} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px',
                  fontWeight: 600, fontSize: '0.8rem', color: '#fff', cursor: savingPhoto ? 'not-allowed' : 'pointer',
                }}>
                  <X size={14} /> Cancel
                </button>
              </div>
              {photoPending !== 'REMOVED' && (profilePhoto || photoPending) && (
                <button type="button" onClick={() => setPhotoPending('REMOVED')} disabled={savingPhoto} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                  background: '#fff', border: 'none', borderRadius: '6px',
                  fontWeight: 600, fontSize: '0.75rem', color: '#ef4444', cursor: savingPhoto ? 'not-allowed' : 'pointer',
                  alignSelf: 'flex-start'
                }}>
                  <Trash2 size={13} /> Remove Photo
                </button>
              )}
            </div>
          )}


          <div style={{ color: '#fff' }}>
            <div className="hero-title-wrap" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '6px'
            }}>
              <div className="hero-title" style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                margin: 0,
                letterSpacing: '-0.01em',
                color: '#fff'
              }}>
                {doctorName || currentUser?.name || 'Doctor Panel'}
              </div>
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <Shield size={14} /> Verified Medical Officer
              </span>
            </div>

            <div style={{
              fontSize: '1rem',
              color: '#94a3b8',
              fontWeight: 500,
              marginBottom: '12px'
            }}>
              {specialization ? <>{specialization} {qualification ? `• ${qualification}` : ''}</> : <span>General Practitioner</span>}
            </div>

            <div className="hero-tags" style={{
              display: 'flex',
              gap: '16px',
              fontSize: '0.85rem',
              color: '#cbd5e1',
              flexWrap: 'wrap'
            }}>
              {registrationNumber && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} color="#5eead4" /> Reg: <strong>{registrationNumber}</strong>
                </span>
              )}
              {phone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={16} color="#5eead4" /> {phone}
                </span>
              )}
              {clinicName && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={16} color="#5eead4" /> {clinicName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="hero-actions-container">
          <div className="quick-actions-label" style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500, marginBottom: '4px' }}>Quick Actions</div>
          <div className="hero-actions">
            <button onClick={() => setActiveSubTab('phoneFetch')} style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <Search size={16} /> Find Patient
            </button>
            <button onClick={() => setActiveSubTab('consultation')} style={{
              background: '#0d9488',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              boxShadow: '0 4px 6px rgba(13, 148, 136, 0.2)'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#0f766e'}
            onMouseOut={(e) => e.currentTarget.style.background = '#0d9488'}
            >
              <Stethoscope size={16} /> Start Consultation
            </button>
            <button onClick={() => setActiveSubTab('prescriptions')} style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <FileCheck size={16} /> Create Prescription
            </button>
            <button onClick={() => setActiveSubTab('history')} style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <Users size={16} /> Create Referral
            </button>
            <button onClick={() => setActiveSubTab('reminders')} style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <Calendar size={16} /> Schedule Follow-Up
            </button>
          </div>
        </div>
      </div>

      {/* Today's Overview Metrics */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={20} color="#0d9488" /> Today's Overview
        </h2>
        
        {statsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px' }}>
            <HeartbeatLoader />
          </div>
        ) : (
          <div className="stats-grid">
            <div className="stat-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="stat-card-title" style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Today's Patients</span>
                <div style={{ background: '#f0fdf4', padding: '6px', borderRadius: '8px' }}><Users size={18} color="#10b981" /></div>
              </div>
              <div className="stat-card-value" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>{dashboardStats.todaysPatients}</div>
            </div>

            <div className="stat-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="stat-card-title" style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Pending Consults</span>
                <div style={{ background: '#fff7ed', padding: '6px', borderRadius: '8px' }}><Clock size={18} color="#f97316" /></div>
              </div>
              <div className="stat-card-value" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>{dashboardStats.pendingConsultations}</div>
            </div>

            <div className="stat-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="stat-card-title" style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Completed</span>
                <div style={{ background: '#eff6ff', padding: '6px', borderRadius: '8px' }}><CheckSquare size={18} color="#3b82f6" /></div>
              </div>
              <div className="stat-card-value" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>{dashboardStats.completedConsultations}</div>
            </div>

            <div className="stat-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="stat-card-title" style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Follow-Ups</span>
                <div style={{ background: '#f5f3ff', padding: '6px', borderRadius: '8px' }}><HeartPulse size={18} color="#8b5cf6" /></div>
              </div>
              <div className="stat-card-value" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>{dashboardStats.pendingFollowUps}</div>
            </div>

            <div className="stat-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="stat-card-title" style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Referrals</span>
                <div style={{ background: '#ecfeff', padding: '6px', borderRadius: '8px' }}><TrendingUp size={18} color="#06b6d4" /></div>
              </div>
              <div className="stat-card-value" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>{dashboardStats.pendingReferrals}</div>
            </div>
            
            <div className="stat-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="stat-card-title" style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Notifications</span>
                <div style={{ background: '#fef2f2', padding: '6px', borderRadius: '8px' }}><Bell size={18} color="#ef4444" /></div>
              </div>
              <div className="stat-card-value" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>{dashboardStats.notifications}</div>
            </div>
          </div>
        )}
      </div>

      {/* Global Success / Error notifications */}
      {saveSuccess && <div style={{
      border: '1px solid #e2e8f0',
      padding: '12px 18px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '0.88rem',
      fontWeight: 600
    }}>
          <CheckCircle2 size={18} /> {saveSuccess}
        </div>}

      {errorMsg && <div style={{
      border: '1px solid #e2e8f0',
      padding: '12px 18px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '0.88rem',
      fontWeight: 600
    }}>
          <AlertCircle size={18} /> {errorMsg}
        </div>}

      {/* ═══════════════════ PROFESSIONAL PILL NAV BAR ═══════════════════ */}
      <div className="pill-nav" style={{
      background: '#0f766e',
      padding: '8px',
      marginBottom: '28px',
      boxShadow: '0 4px 12px rgba(15, 118, 110, 0.15)', border: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      borderRadius: '12px',
      overflowX: 'auto',
      flexWrap: 'nowrap'
    }}>
        {/* Tab definitions */}
          {[
        { id: 'dashboard', label: 'Dashboard', icon: <Activity size={16} />, badge: null },
        { id: 'phoneFetch', label: 'Lookup Patient', icon: <Search size={16} />, badge: null },
        { id: 'history', label: 'Patients & Records', icon: <Users size={16} />, badge: null },
        { id: 'consultation', label: 'Consultation', icon: <Stethoscope size={16} />, badge: null },
        { id: 'prescriptions', label: 'E-Prescriptions', icon: <FileText size={16} />, badge: null },
        { id: 'diagnostics', label: 'Diagnostics', icon: <ClipboardList size={16} />, badge: null },
        { id: 'reminders', label: 'Follow-Ups', icon: <HeartPulse size={16} />, badge: pendingReminderCount > 0 ? pendingReminderCount : null },
        { id: 'referrals', label: 'Referral Hub', icon: <Share2 size={16} />, badge: null },
        { id: 'emergency', label: 'Emergency', icon: <AlertTriangle size={16} color="#ef4444" />, badge: null },
        { id: 'leaveSchedule', label: 'Schedule', icon: <Calendar size={16} />, badge: null },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={16} />, badge: dashboardStats?.notifications > 0 ? dashboardStats.notifications : null },
        { id: 'profile', label: 'My Profile', icon: <UserCheck size={16} />, badge: null }
      ].map(tab => {
        const isActive = activeSubTab === tab.id;
        return (
          <button key={tab.id} onClick={() => setActiveSubTab(tab.id)} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '9px 16px',
            border: 'none',
            borderRadius: '8px',
            background: isActive ? '#fff' : 'transparent',
            color: isActive ? '#0f766e' : 'rgba(255,255,255,0.85)',
            boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            fontWeight: isActive ? 600 : 500,
            fontSize: '0.85rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transform: isActive ? 'translateY(-1px)' : 'translateY(0)',
            transition: 'all 0.2s ease',
            position: 'relative',
            letterSpacing: isActive ? '-0.01em' : '0'
          }}>
            <span style={{
              opacity: isActive ? 1 : 0.8,
              display: 'flex',
              alignItems: 'center'
            }}>
              {tab.icon}
            </span>
            {tab.label}
            {tab.badge && (
              <span style={{
                padding: '1px 7px',
                fontSize: '0.67rem',
                fontWeight: 800,
                minWidth: '18px',
                textAlign: 'center',
                lineHeight: '18px'
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 2: PATIENT MEDICAL HISTORY & COMPLETE PROFILE                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'history' && <PatientMedicalHistoryView currentUser={currentUser} initialPatientId={activePatientId || selectedHistoryPatientId} initialTab={historyInitialTab} onLoadPatientToRx={handleLoadPatientToRx} onSetReminderSuccess={() => refreshReminderCount()} />}

      {/* ========================================================================= */}
      {/* TAB: DOCTOR FOLLOW-UP REMINDERS QUEUE                                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'reminders' && <DoctorRemindersView onSelectPatientForHistory={patientId => {
      setSelectedHistoryPatientId(patientId);
      setHistoryInitialTab('history');
      setActiveSubTab('history');
    }} onWriteRx={patient => {
      handleLoadPatientToRx(patient);
    }} />}

      {/* ========================================================================= */}
      {/* TAB: CONSULTATION WORKSPACE                                               */}
      {/* ========================================================================= */}
      {activeSubTab === 'consultation' && (
        <ConsultationWorkspace 
          patientId={activePatientId || selectedHistoryPatientId}
          doctorId={doctorId}
          doctorName={doctorName}
          onClose={() => setActiveSubTab('dashboard')}
          onSaveComplete={() => {
            loadDashboardStats();
            setActiveSubTab('history');
          }}
        />
      )}

              {/* ========================================================================= */}
        {/* TAB: REFERRAL WORKSPACE                                                   */}
        {/* ========================================================================= */}
        {activeSubTab === 'referrals' && (
          <ReferralWorkspace 
            doctorId={doctorId}
            doctorName={doctorName}
            clinicName={clinicName}
          />
        )}
                {/* ========================================================================= */}
        {/* TAB: DIAGNOSTICS WORKSPACE                                                */}
        {/* ========================================================================= */}
        {activeSubTab === 'diagnostics' && (
          <DiagnosticsView doctorId={doctorId} />
        )}
                {/* ========================================================================= */}
        {/* TAB: EMERGENCY WORKSPACE                                                  */}
        {/* ========================================================================= */}
        {activeSubTab === 'emergency' && (
          <EmergencyActionView 
            doctorName={doctorName}
            clinicName={clinicName}
          />
        )}
                {/* ========================================================================= */}
        {/* TAB: NOTIFICATIONS WORKSPACE                                              */}
        {/* ========================================================================= */}
        {activeSubTab === 'notifications' && (
          <NotificationsView />
        )}
        {/* ========================================================================= */}
        {/* TAB: DOCTOR LEAVE APPLICATION & OPD SCHEDULE                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'leaveSchedule' && <DoctorLeaveScheduleView currentUser={currentUser} />}

      {/* ========================================================================= */}
      {/* TAB 1: DOCTOR PROFILE MANAGEMENT                                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'profile' && <form onSubmit={handleSaveProfile}>
          <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>

            {/* Column 1: Basic Doctor Identity & Registration */}
            <div style={{
          padding: '24px',
          border: '1px solid #e2e8f0'
        }}>
              <h3 style={{
            fontSize: '1.1rem',
            fontWeight: 800,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
                <Stethoscope size={20} color="#059669" /> Doctor Professional Credentials
              </h3>

              {/* Profile Photo Upload */}
              <div style={{
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
                <img src={profilePhoto || 'https://via.placeholder.com/100'} alt="Doctor avatar" style={{
              width: '72px',
              height: '72px',
              objectFit: 'cover',
              border: '1px solid #e2e8f0'
            }} />
                <div>
                  <input type="file" ref={profilePhotoInputRef} accept="image/*" style={{
                display: 'none'
              }} onChange={e => handleFileUpload(e, setProfilePhoto)} />
                  <button type="button" onClick={() => profilePhotoInputRef.current?.click()} style={{
                border: '1px solid #e2e8f0',
                padding: '7px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                    <Camera size={14} /> Upload Profile Photo
                  </button>
                  <div style={{
                fontSize: '0.72rem',
                marginTop: '4px'
              }}>Max 2.5MB (PNG, JPG, WebP)</div>
                </div>
              </div>

              {/* Doctor Name */}
              <div style={{
            marginBottom: '16px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Doctor Full Name *
                </label>
                <input type="text" required value={doctorName} onChange={e => setDoctorName(e.target.value)} placeholder="Enter Doctor Full Name (e.g. Dr. Name)..." style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #e2e8f0',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }} />
              </div>

              {/* Specialization */}
              <div style={{
            marginBottom: '16px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Medical Specialization *
                </label>
                <select value={specialization} onChange={e => setSpecialization(e.target.value)} style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #e2e8f0',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '8px'
            }}>
                  <option value="General Medicine & Family Health">General Medicine & Family Health (MBBS/MD)</option>
                  <option value="Cardiology & Critical Care">Cardiology & Critical Care</option>
                  <option value="Obstetrics & Gynecology (Maternity)">Obstetrics & Gynecology (Maternity)</option>
                  <option value="Pediatrics & Child Health">Pediatrics & Child Health</option>
                  <option value="General Surgery">General Surgery (MS)</option>
                  <option value="Orthopedics & Trauma Surgery">Orthopedics & Trauma Surgery</option>
                  <option value="Pulmonology & Respiratory Care">Pulmonology & Respiratory Care</option>
                  <option value="Dermatology & Venereology">Dermatology & Venereology</option>
                  <option value="Ayush / Public Health Officer">Ayush / Public Health Officer</option>
                </select>
                <input type="text" value={specialization} onChange={e => setSpecialization(e.target.value)} placeholder="Or enter custom specialization..." style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              fontSize: '0.82rem',
              boxSizing: 'border-box'
            }} />
              </div>

              {/* Qualifications */}
              <div style={{
            marginBottom: '16px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Degrees & Qualifications *
                </label>
                <input type="text" required value={qualification} onChange={e => setQualification(e.target.value)} placeholder="e.g. MBBS, MD (Medicine), CCEBDM, DNB" style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #e2e8f0',
              fontSize: '0.9rem',
              boxSizing: 'border-box'
            }} />
              </div>

              {/* License Number & Medical Council */}
              <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '16px'
          }}>
                <div>
                  <label style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                marginBottom: '6px'
              }}>
                    Registration / License No. *
                  </label>
                  <input type="text" required value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} placeholder="e.g. GMC-2018-84729" style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                fontSize: '0.88rem',
                boxSizing: 'border-box'
              }} />
                </div>

                <div>
                  <label style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                marginBottom: '6px'
              }}>
                    Experience (Years)
                  </label>
                  <input type="number" min="0" max="60" value={experienceYears} onChange={e => setExperienceYears(e.target.value)} style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                fontSize: '0.88rem',
                boxSizing: 'border-box'
              }} />
                </div>
              </div>

              <div style={{
            marginBottom: '16px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Medical Council / Registering Authority
                </label>
                <input type="text" value={medicalCouncil} onChange={e => setMedicalCouncil(e.target.value)} placeholder="e.g. Gujarat Medical Council / National Medical Commission" style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #e2e8f0',
              fontSize: '0.88rem',
              boxSizing: 'border-box'
            }} />
              </div>
            </div>

            {/* Column 2: Contact Info, Clinic Details & Consultation */}
            <div style={{
          padding: '24px',
          border: '1px solid #e2e8f0'
        }}>
              <h3 style={{
            fontSize: '1.1rem',
            fontWeight: 800,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
                <Building2 size={20} color="#059669" /> Contact Information & Practice
              </h3>

              {/* Mobile Number  */}
              <div style={{
            marginBottom: '16px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Mobile / Contact Number * (Used for Fast Data Fetch)
                </label>
                <div style={{
              position: 'relative'
            }}>
                  <Phone size={16} color="#9ca3af" style={{
                position: 'absolute',
                left: '12px',
                top: '12px'
              }} />
                  <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91-98765-43210" style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                border: '1px solid #e2e8f0',
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }} />
                </div>
                <div style={{
              fontSize: '0.72rem',
              marginTop: '4px',
              fontWeight: 600
            }}>
                  💡 Mobile number is indexed so data can be fetched instantly via mobile lookup.
                </div>
              </div>

              {/* Email Address */}
              <div style={{
            marginBottom: '16px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Email Address * (For OTP Login & Reports)
                </label>
                <div style={{
              position: 'relative'
            }}>
                  <Mail size={16} color="#9ca3af" style={{
                position: 'absolute',
                left: '12px',
                top: '12px'
              }} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="doctor@example.com" style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                border: '1px solid #e2e8f0',
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }} />
                </div>
              </div>

              {/* Clinic / Hospital Name */}
              <div style={{
            marginBottom: '16px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Clinic / Hospital Name
                </label>
                <input type="text" value={clinicName} onChange={e => setClinicName(e.target.value)} placeholder="e.g. Rampur Primary Health Centre & Care Clinic" style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #e2e8f0',
              fontSize: '0.9rem',
              boxSizing: 'border-box'
            }} />
              </div>

              {/* Clinic Address */}
              <div style={{
            marginBottom: '16px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Clinic / Facility Physical Address
                </label>
                <input type="text" value={clinicAddress} onChange={e => setClinicAddress(e.target.value)} placeholder="e.g. Main Hospital Road, Block HQ" style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #e2e8f0',
              fontSize: '0.88rem',
              boxSizing: 'border-box'
            }} />
              </div>

              {/* Consultation Hours & Fee */}
              <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '12px',
            marginBottom: '16px'
          }}>
                <div>
                  <label style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                marginBottom: '6px'
              }}>
                    Consultation Timings / OPD Hours
                  </label>
                  <input type="text" value={consultationHours} onChange={e => setConsultationHours(e.target.value)} placeholder="e.g. Mon-Sat: 9AM - 1PM, 5PM - 8:30PM" style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                fontSize: '0.85rem',
                boxSizing: 'border-box'
              }} />
                </div>

                <div>
                  <label style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 700,
                marginBottom: '6px'
              }}>
                    OPD Fee (₹)
                  </label>
                  <input type="number" value={consultationFee} onChange={e => setConsultationFee(e.target.value)} placeholder="200" style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                fontSize: '0.88rem',
                boxSizing: 'border-box'
              }} />
                </div>
              </div>

              {/* Clinical Bio */}
              <div style={{
            marginBottom: '16px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Professional Summary / Bio
                </label>
                <textarea rows="3" value={bio} onChange={e => setBio(e.target.value)} placeholder="Brief clinical background or service focus..." style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #e2e8f0',
              fontSize: '0.85rem',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }} />
              </div>

            </div>
          </div>

          {/* Bottom Save Bar */}
          <div style={{
        marginTop: '24px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px'
      }}>
            <button type="button" onClick={loadDoctorProfile} style={{
          border: '1px solid #e2e8f0',
          padding: '12px 20px',
          fontSize: '0.88rem',
          fontWeight: 600,
          cursor: 'pointer'
        }}>
              Reset to Saved
            </button>

            <button type="submit" disabled={loading} style={{
          background: '#0f766e',
          border: 'none',
          padding: '12px 28px',
          fontSize: '0.92rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
              <Save size={18} />
              {loading ? 'Saving Profile...' : 'Save & Update Doctor Profile'}
            </button>
          </div>
        </form>}

      {/* ========================================================================= */}
      {/* TAB 2: CUSTOM BRANDING (LOGO, HEADER, FOOTER, SIGNATURE)                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'branding' && <div>
          <div style={{
        border: '1px solid #e2e8f0',
        padding: '18px 24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
            <div>
              <h3 style={{
            margin: 0,
            fontSize: '1.05rem',
            fontWeight: 800
          }}>
                🏥 Custom Clinic / Hospital Branding Settings
              </h3>
              <p style={{
            margin: '4px 0 0',
            fontSize: '0.82rem'
          }}>
                Set your custom clinic logo, header title, contact bar, and footer legal disclaimer for digital prescriptions and patient slips.
              </p>
            </div>

            <button onClick={() => setActiveSubTab('prescriptions')} style={{
          border: 'none',
          padding: '9px 18px',
          fontSize: '0.82rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
              <FileText size={16} /> Preview Prescription Pad
            </button>
          </div>

          <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>

            {/* Left: Logo & Header Settings */}
            <div style={{
          padding: '24px',
          border: '1px solid #e2e8f0'
        }}>
              <h4 style={{
            margin: '0 0 16px',
            fontSize: '1rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
                <ImageIcon size={18} color="#059669" /> 1. Clinic / Doctor Logo
              </h4>

              <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '20px'
          }}>
                <div style={{
              width: '90px',
              height: '90px',
              border: "2px dashed #000",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
                  {brandingLogo ? <img src={brandingLogo} alt="Clinic Logo" style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }} /> : <span style={{
                fontSize: '0.75rem',
                textAlign: 'center',
                padding: '6px'
              }}>No Logo</span>}
                </div>

                <div>
                  <input type="file" ref={logoInputRef} accept="image/*" style={{
                display: 'none'
              }} onChange={e => handleFileUpload(e, setBrandingLogo)} />
                  <button type="button" onClick={() => logoInputRef.current?.click()} style={{
                border: '1px solid #e2e8f0',
                padding: '8px 16px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                    <Camera size={14} /> Upload Custom Logo
                  </button>
                  <button type="button" onClick={() => setBrandingLogo('https://images.unsplash.com/photo-1516549655169-df83a0774514?w=150&auto=format&fit=crop&q=80')} style={{
                border: 'none',
                padding: '6px 0',
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'block',
                marginTop: '4px'
              }}>
                    Use Standard Medical Caduceus Logo
                  </button>
                </div>
              </div>

              <h4 style={{
            margin: '24px 0 16px',
            fontSize: '1rem',
            fontWeight: 800
          }}>
                2. Header Configuration
              </h4>

              {/* Header Title */}
              <div style={{
            marginBottom: '14px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Prescription Header Title *
                </label>
                <input type="text" value={headerTitle} onChange={e => setHeaderTitle(e.target.value)} placeholder="e.g. Rampur Primary Health Centre (PHC)" style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #e2e8f0',
              fontSize: '0.88rem',
              boxSizing: 'border-box'
            }} />
              </div>

              {/* Header Subtitle */}
              <div style={{
            marginBottom: '14px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Header Subtitle / Affiliation
                </label>
                <input type="text" value={headerSubtitle} onChange={e => setHeaderSubtitle(e.target.value)} placeholder="e.g. Government of Uttar Pradesh • National Rural Health Mission" style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #e2e8f0',
              fontSize: '0.85rem',
              boxSizing: 'border-box'
            }} />
              </div>

              {/* Header Contact bar */}
              <div style={{
            marginBottom: '14px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Header Contact / Hotline Bar
                </label>
                <input type="text" value={headerContact} onChange={e => setHeaderContact(e.target.value)} placeholder="e.g. Emergency: 108 | OPD: +91-98765-43210 | Reg: GMC-2018-84729" style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #e2e8f0',
              fontSize: '0.85rem',
              boxSizing: 'border-box'
            }} />
              </div>

              {/* Header Color Theme */}
              <div style={{
            marginBottom: '14px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Header Accent Color
                </label>
                <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
                  {['#064e3b', '#047857', '#1e3a8a', '#1e293b', '#831843'].map(c => <button key={c} type="button" onClick={() => setHeaderBgColor(c)} style={{
                width: '32px',
                height: '32px',
                border: headerBgColor === c ? '3px solid #10b981' : '2px solid #ffffff',
                cursor: 'pointer'
              }} />)}
                  <input type="color" value={headerBgColor} onChange={e => setHeaderBgColor(e.target.value)} style={{
                width: '40px',
                height: '34px',
                cursor: 'pointer',
                border: 'none'
              }} />
                </div>
              </div>
            </div>

            {/* Right: Footer, Signature & Disclaimer */}
            <div style={{
          padding: '24px',
          border: '1px solid #e2e8f0'
        }}>
              <h4 style={{
            margin: '0 0 16px',
            fontSize: '1rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
                <PenTool size={18} color="#059669" /> 3. Footer & Digital Signature
              </h4>

              {/* Footer Text / Disclaimer */}
              <div style={{
            marginBottom: '16px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Prescription Footer Disclaimer / Instructions *
                </label>
                <textarea rows="4" value={footerText} onChange={e => setFooterText(e.target.value)} placeholder="Enter standard disclaimer, validity period, emergency phone numbers, or notes for patients..." style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #e2e8f0',
              fontSize: '0.85rem',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }} />
              </div>

              {/* Digital Signature */}
              <div style={{
            marginBottom: '20px'
          }}>
                <label style={{
              display: 'block',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '6px'
            }}>
                  Doctor's Digital Signature / Medical Stamp
                </label>
                <div style={{
              border: "2px dashed #000",
              padding: '16px',
              textAlign: 'center'
            }}>
                  {signatureImage ? <div style={{
                marginBottom: '10px'
              }}>
                      <img src={signatureImage} alt="Digital Signature" style={{
                  maxHeight: '60px',
                  objectFit: 'contain'
                }} />
                    </div> : <div style={{
                fontSize: '0.82rem',
                marginBottom: '10px'
              }}>
                      No signature image uploaded yet. (Doctor's name & GMC license will be printed as sign-off).
                    </div>}

                  <input type="file" ref={signatureInputRef} accept="image/*" style={{
                display: 'none'
              }} onChange={e => handleFileUpload(e, setSignatureImage)} />

                  <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px'
              }}>
                    <button type="button" onClick={() => signatureInputRef.current?.click()} style={{
                  border: '1px solid #e2e8f0',
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                      <Camera size={14} /> Upload Signature
                    </button>
                    {signatureImage && <button type="button" onClick={() => setSignatureImage('')} style={{
                  border: 'none',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}>
                        Remove
                      </button>}
                  </div>
                </div>
              </div>

              {/* Live Mini Preview Card */}
              <div style={{
            border: '1px solid #e2e8f0',
            padding: '16px',
            marginTop: '20px'
          }}>
                <div style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}>
                  Live Header/Footer Preview Snippet
                </div>
                <div style={{
              padding: '10px 14px'
            }}>
                  <div style={{
                fontWeight: 800,
                fontSize: '0.95rem'
              }}>{headerTitle || 'Clinic Header Title'}</div>
                  <div style={{
                fontSize: '0.72rem',
                opacity: 0.85
              }}>{headerSubtitle}</div>
                </div>
                <div style={{
              padding: '10px 14px',
              border: '1px solid #e2e8f0',
              borderTop: 'none'
            }}>
                  <div style={{
                fontSize: '0.72rem',
                fontStyle: 'italic'
              }}>
                    {footerText || 'Footer disclaimer will appear here...'}
                  </div>
                </div>
              </div>

              <div style={{
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
                <button type="button" onClick={handleSaveProfile} disabled={loading} style={{
              background: '#0f766e',
              border: 'none',
              padding: '12px 24px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
                  <Save size={16} /> Save Branding Settings
                </button>
              </div>

            </div>

          </div>
        </div>}

      {/* ========================================================================= */}
      {/* TAB 3: LIVE BRANDED PRESCRIPTION PAD & PRINT                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'prescriptions' && <div>
          {/* Controls Bar */}
          <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
            <div>
              <h3 style={{
            margin: 0,
            fontSize: '1.2rem',
            fontWeight: 800
          }}>
                📄 Digital Prescription Pad
              </h3>
              <p style={{
            margin: '4px 0 0',
            fontSize: '0.82rem'
          }}>
                Interactive A4 layout rendering real-time branding, patient history, medication advice, and verification QR.
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <input
                ref={padLogoInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleFileUpload(e, setBrandingLogo)}
              />
              <button
                type="button"
                onClick={() => setShowLetterheadModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 6px rgba(15,118,110,0.25)'
                }}
              >
                <Palette size={16} /> Customize Letterhead & Logo
              </button>

              <button type="button" onClick={handleAddMedicine} style={{
                border: '1px solid #e2e8f0',
                padding: '9px 16px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Plus size={16} /> Add Medicine
              </button>

              <button type="button" onClick={handleSavePrescription} disabled={savingRx} style={{
                background: '#059669',
                color: '#fff',
                border: 'none',
                padding: '9px 20px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: savingRx ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '8px'
              }}>
                <FileCheck size={16} /> {savingRx ? 'Saving...' : 'Save & Issue Prescription'}
              </button>

              <button type="button" onClick={handlePrintPrescription} style={{
                background: '#0f766e',
                color: '#fff',
                border: 'none',
                padding: '9px 20px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '8px'
              }}>
                <Printer size={16} /> Print / Export PDF
              </button>
            </div>
          </div>

          {/* Real A4 Prescription Paper Simulation */}
          <div id="printable-prescription" style={{
            border: '1px solid #e2e8f0',
            padding: '0',
            overflow: 'hidden',
            maxWidth: '900px',
            margin: '0 auto',
            background: '#ffffff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            position: 'relative'
          }}>
            {/* Unified Professional Medical Letterhead */}
            <div style={{
              position: 'relative',
              borderBottom: `2.5px solid ${themeColor || '#0f766e'}`,
              padding: '24px 32px 18px',
              background: '#ffffff'
            }}>
              {/* Top Accent Color Bar */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, ${themeColor || '#0f766e'}, #10b981)`
              }} />

              {/* Quick Customize Badge (hidden on print) */}
              <button
                type="button"
                className="no-print"
                onClick={() => setShowLetterheadModal(true)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '18px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '20px',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: themeColor || '#0f766e',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <Edit2 size={12} /> Customize Header & Logo
              </button>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '24px',
                flexWrap: 'wrap'
              }}>
                {/* Left: Clinic / Hospital Brand & Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flex: '1 1 420px' }}>
                  {/* Clickable Clinic Logo */}
                  <div
                    onClick={() => setShowLetterheadModal(true)}
                    title="Click to customize clinic logo"
                    style={{
                      width: '74px',
                      height: '74px',
                      borderRadius: '12px',
                      border: '1.5px solid #e2e8f0',
                      padding: '4px',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                      flexShrink: 0,
                      cursor: 'pointer',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {brandingLogo ? (
                      <img src={brandingLogo} alt="Clinic Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: `${themeColor || '#0f766e'}10`,
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: themeColor || '#0f766e'
                      }}>
                        <Stethoscope size={28} />
                        <span style={{ fontSize: '0.52rem', fontWeight: 800, marginTop: '2px', textTransform: 'uppercase' }}>CLINIC</span>
                      </div>
                    )}
                  </div>

                  {/* Clinic Info */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h2 style={{
                        margin: 0,
                        fontSize: '1.45rem',
                        fontWeight: 800,
                        color: '#0f172a',
                        fontFamily: "'Inter', sans-serif",
                        letterSpacing: '-0.02em',
                        lineHeight: 1.2
                      }}>
                        {clinicName || headerTitle || (doctorName ? `${doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`}'s Clinic` : 'GraminArogya Rural Healthcare Centre')}
                      </h2>
                      <span style={{
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        background: '#ecfdf5',
                        color: '#065f46',
                        border: '1px solid #a7f3d0',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        Govt. Regd. Clinic
                      </span>
                    </div>

                    <div style={{
                      fontSize: '0.84rem',
                      color: themeColor || '#0f766e',
                      fontWeight: 700,
                      marginTop: '3px'
                    }}>
                      {headerSubtitle || (specialization ? `${specialization} • Comprehensive Family & Primary Care` : 'Department of Health & Family Welfare')}
                    </div>

                    <div style={{
                      fontSize: '0.74rem',
                      color: '#475569',
                      marginTop: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        📍 {clinicAddress || 'Primary Health Centre Campus, Gujarat'}
                      </span>
                      {(phone || headerContact) && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          📞 <strong>Tel:</strong> {phone || headerContact}
                        </span>
                      )}
                      {email && !email.includes('indiankart') && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          ✉️ {email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Attending Doctor Details */}
                <div style={{
                  textAlign: 'right',
                  borderLeft: '1.5px solid #f1f5f9',
                  paddingLeft: '20px',
                  flex: '0 0 auto'
                }}>
                  <div style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    {doctorName ? (doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`) : 'Dr. Attending Physician'}
                  </div>
                  <div style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: themeColor || '#0f766e',
                    marginTop: '2px'
                  }}>
                    {qualification || 'MBBS, MD'}
                  </div>
                  <div style={{
                    fontSize: '0.74rem',
                    color: '#64748b',
                    marginTop: '2px'
                  }}>
                    {specialization || 'Consultant Physician'}
                  </div>
                  <div style={{
                    fontSize: '0.72rem',
                    color: '#334155',
                    marginTop: '3px',
                    fontWeight: 600
                  }}>
                    Reg No: <span style={{ fontFamily: 'monospace' }}>{registrationNumber || 'GMC-2024-91823'}</span> ({medicalCouncil || 'NMC'})
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#64748b',
                    marginTop: '3px'
                  }}>
                    OPD: {consultationHours || '09:00 AM – 05:00 PM'}
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Metadata Section */}
            <div style={{
          padding: '20px 32px',
          borderBottom: "1px dashed #000"
        }}>
              <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            fontSize: '0.85rem'
          }}>
                <div>
                  <span style={{
                display: 'block',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                fontWeight: 700
              }}>Patient Name</span>
                  <input
                    type="text"
                    value={rxPatientName}
                    onChange={e => setRxPatientName(e.target.value)}
                    placeholder="Enter patient name..."
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      border: '1.5px solid #0f766e',
                      borderRadius: '4px',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      outline: 'none',
                      background: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <span style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    fontWeight: 700
                  }}>Age / Gender</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="text"
                      value={rxPatientAge}
                      onChange={e => setRxPatientAge(e.target.value)}
                      placeholder="Age"
                      style={{
                        width: '48px',
                        padding: '7px 6px',
                        border: '1.5px solid #0f766e',
                        borderRadius: '4px',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        outline: 'none',
                        textAlign: 'center',
                        background: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Yrs /</span>
                    <input
                      type="text"
                      value={rxPatientGender}
                      onChange={e => setRxPatientGender(e.target.value)}
                      placeholder="Gender"
                      style={{
                        width: '72px',
                        padding: '7px 6px',
                        border: '1.5px solid #0f766e',
                        borderRadius: '4px',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        outline: 'none',
                        textAlign: 'center',
                        background: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      display: 'block',
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      fontWeight: 700
                    }}>Mobile Number</span>
                    <button
                      type="button"
                      className="no-print"
                      onClick={() => handleAutoFetchRxPatient(rxPatientPhone)}
                      title="Fetch patient details from database"
                      style={{
                        background: '#f0fdf4',
                        color: '#166534',
                        border: '1px solid #bbf7d0',
                        borderRadius: '4px',
                        padding: '1px 6px',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ⚡ Fetch DB
                    </button>
                  </div>
                  <input
                    type="text"
                    value={rxPatientPhone}
                    onChange={e => setRxPatientPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      border: '1.5px solid #0f766e',
                      borderRadius: '4px',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      outline: 'none',
                      background: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <span style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    fontWeight: 700
                  }}>Prescription Date</span>
                  <span style={{
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    display: 'block',
                    padding: '7px 0',
                    color: '#0f172a'
                  }}>{new Date().toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              {/* Vitals Snapshot */}
              <div style={{
                marginTop: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem'
              }}>
                <strong style={{ minWidth: '45px' }}>Vitals:</strong>
                <input
                  type="text"
                  value={rxVitals}
                  onChange={e => setRxVitals(e.target.value)}
                  placeholder="BP: 120/80 | SpO2: 98% | Pulse: 72 bpm | Temp: 98.4°F"
                  style={{
                    width: '100%',
                    padding: '6px 12px',
                    border: '1.5px solid #0f766e',
                    borderRadius: '4px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    outline: 'none',
                    background: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Clinical Diagnosis & Rx Symbol */}
            <div style={{
              padding: '20px 32px'
            }}>
              <div style={{
                marginBottom: '16px'
              }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#0f172a'
                }}>Provisional Clinical Diagnosis</span>
                <input
                  type="text"
                  value={rxDiagnosis}
                  onChange={e => setRxDiagnosis(e.target.value)}
                  placeholder="Enter clinical diagnosis..."
                  style={{
                    width: '100%',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    border: '1.5px solid #0f766e',
                    borderRadius: '4px',
                    outline: 'none',
                    marginTop: '4px',
                    padding: '7px 12px',
                    background: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Rx Stethoscope Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <span style={{
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  fontFamily: 'serif',
                  color: themeColor || '#0f766e'
                }}>℞</span>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  color: '#0f172a'
                }}>MEDICATIONS & DOSAGE SCHEDULE</span>
              </div>

              {/* Medicines Table */}
              <datalist id="medicine-options">
                {stockMedicines.map(m => (
                  <option key={m.id || m._id} value={m.name}>
                    {m.dosageForm} {m.strength ? `- ${m.strength}` : ''} ({m.stockQty} in stock)
                  </option>
                ))}
              </datalist>
              <div style={{
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                marginBottom: '18px'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '0.84rem'
                }}>
                  <thead>
                    <tr style={{
                      background: '#f8fafc',
                      borderBottom: '1px solid #e2e8f0',
                      fontSize: '0.72rem',
                      textTransform: 'uppercase'
                    }}>
                      <th style={{ padding: '8px 12px', width: '38%', fontWeight: 800 }}>Medicine Name & Strength</th>
                      <th style={{ padding: '8px 12px', width: '26%', fontWeight: 800 }}>Dosage Schedule</th>
                      <th style={{ padding: '8px 12px', width: '18%', fontWeight: 800 }}>Duration</th>
                      <th style={{ padding: '8px 12px', width: '18%', fontWeight: 800 }}>Instruction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rxMedicines.map((med, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 10px' }}>
                          <input
                            type="text"
                            list="medicine-options"
                            value={med.name}
                            onChange={e => {
                              const updated = [...rxMedicines];
                              updated[idx].name = e.target.value;
                              setRxMedicines(updated);
                            }}
                            placeholder="Search or enter medicine..."
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              border: '1.5px solid #0f766e',
                              borderRadius: '4px',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              outline: 'none',
                              background: '#ffffff',
                              boxSizing: 'border-box'
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={e => {
                              const updated = [...rxMedicines];
                              updated[idx].dosage = e.target.value;
                              setRxMedicines(updated);
                            }}
                            placeholder="e.g. 1 tab thrice daily"
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              border: '1.5px solid #0f766e',
                              borderRadius: '4px',
                              fontSize: '0.82rem',
                              outline: 'none',
                              background: '#ffffff',
                              boxSizing: 'border-box'
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <input
                            type="text"
                            value={med.duration}
                            onChange={e => {
                              const updated = [...rxMedicines];
                              updated[idx].duration = e.target.value;
                              setRxMedicines(updated);
                            }}
                            placeholder="e.g. 5 days"
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              border: '1.5px solid #0f766e',
                              borderRadius: '4px',
                              fontSize: '0.82rem',
                              outline: 'none',
                              background: '#ffffff',
                              boxSizing: 'border-box'
                            }}
                          />
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="text"
                              value={med.instruction}
                              onChange={e => {
                                const updated = [...rxMedicines];
                                updated[idx].instruction = e.target.value;
                                setRxMedicines(updated);
                              }}
                              placeholder="After food"
                              style={{
                                width: '100%',
                                padding: '6px 10px',
                                border: '1.5px solid #0f766e',
                                borderRadius: '4px',
                                fontSize: '0.82rem',
                                outline: 'none',
                                background: '#ffffff',
                                boxSizing: 'border-box'
                              }}
                            />
                            {rxMedicines.length > 1 && (
                              <button
                                type="button"
                                className="no-print"
                                onClick={() => handleRemoveMedicine(idx)}
                                style={{
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  background: 'transparent',
                                  color: '#dc2626'
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Special Advice / Clinical Notes */}
              <div style={{ marginBottom: '20px' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#0f172a'
                }}>Doctor Advice & Precautions</span>
                <textarea
                  rows="2"
                  value={rxAdvice}
                  onChange={e => setRxAdvice(e.target.value)}
                  placeholder="Doctor advice, precautions and instructions..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1.5px solid #0f766e',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    outline: 'none',
                    marginTop: '4px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    background: '#ffffff',
                    resize: 'none'
                  }}
                />
              </div>

              {/* Signature & Stamp Section */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginTop: '32px',
                paddingTop: '16px',
                borderTop: '1px dashed #cbd5e1'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    padding: '6px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <QRCodeSVG
                      value={JSON.stringify({
                        type: 'SITH_PRESCRIPTION_VERIFICATION',
                        patient: rxPatientName,
                        phone: rxPatientPhone || '',
                        doctor: doctorName,
                        reg: registrationNumber,
                        verified: true
                      })}
                      size={64}
                      level="M"
                    />
                    <span style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '3px', fontWeight: 600 }}>Scan to Verify</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    <div>Security Key: <strong>GA-DOC-VERIFIED-{phone ? phone.slice(-4) : '7890'}</strong></div>
                    <div>Digitally Generated on GraminArogya Medical Platform</div>
                    <div style={{ color: '#059669', fontWeight: 600, marginTop: '2px' }}>Authorized Digital Prescription • NHA Compliant</div>
                  </div>
                </div>

                <div style={{
              textAlign: 'center',
              minWidth: '180px'
            }}>
                  {signatureImage ? <img src={signatureImage} alt="Doctor Signature" style={{
                maxHeight: '50px',
                marginBottom: '6px'
              }} /> : <div style={{
                fontFamily: 'cursive',
                fontSize: '1.2rem',
                marginBottom: '4px'
              }}>
                      {doctorName}
                    </div>}
                  <div style={{
                borderTop: "1px solid #000",
                paddingTop: '4px',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                    {doctorName}
                  </div>
                  <div style={{
                fontSize: '0.72rem'
              }}>
                    {qualification} • Reg: {registrationNumber}
                  </div>
                </div>
              </div>

            </div>

            {/* Custom Branded Footer */}
            <div style={{
          borderTop: "2px solid #000",
          padding: '16px 32px',
          fontSize: '0.72rem',
          textAlign: 'center',
          lineHeight: 1.5
        }}>
              {footerText || 'Notice: Valid for 7 days. Not valid for medico-legal purposes. In case of emergency, visit nearest CHC / District Hospital or call 108.'}
            </div>

          </div>

          {/* ══════════ LETTERHEAD & CLINIC LOGO CUSTOMIZER MODAL ══════════ */}
          {showLetterheadModal && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}>
              <div style={{
                background: '#ffffff',
                borderRadius: '20px',
                maxWidth: '680px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Modal Header */}
                <div style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  borderTopLeftRadius: '20px',
                  borderTopRightRadius: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      background: `${themeColor || '#0f766e'}18`,
                      color: themeColor || '#0f766e',
                      padding: '8px',
                      borderRadius: '10px'
                    }}>
                      <Palette size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                        Customize Prescription Letterhead & Logo
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                        Personalize clinic branding, upload custom logo, and configure doctor credentials.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLetterheadModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '8px',
                      color: '#64748b'
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Body */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Section 1: Clinic Logo Upload & Presets */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                      🏥 Clinic / Hospital Logo
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      {/* Logo Preview */}
                      <div style={{
                        width: '84px',
                        height: '84px',
                        borderRadius: '12px',
                        border: '2px dashed #cbd5e1',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                        flexShrink: 0
                      }}>
                        {brandingLogo ? (
                          <img src={brandingLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.68rem' }}>
                            <Camera size={24} style={{ margin: '0 auto 4px', display: 'block' }} />
                            No Logo
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => padLogoInputRef.current?.click()}
                            style={{
                              background: themeColor || '#0f766e',
                              color: '#ffffff',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Upload size={14} /> Upload Custom Logo
                          </button>
                          {brandingLogo && (
                            <button
                              type="button"
                              onClick={() => setBrandingLogo('')}
                              style={{
                                background: '#fee2e2',
                                color: '#dc2626',
                                border: '1px solid #fca5a5',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Remove Logo
                            </button>
                          )}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Upload any clinic emblem, hospital logo, or stamp (PNG, JPG, SVG, WebP).
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Clinic & Facility Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Clinic / Hospital Name *
                      </label>
                      <input
                        type="text"
                        value={clinicName}
                        onChange={e => {
                          setClinicName(e.target.value);
                          setHeaderTitle(e.target.value);
                        }}
                        placeholder="e.g. Arogya Multispeciality & Rural Care Clinic"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontSize: '0.86rem',
                          fontWeight: 600,
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Tagline / Department Subtitle
                      </label>
                      <input
                        type="text"
                        value={headerSubtitle}
                        onChange={e => setHeaderSubtitle(e.target.value)}
                        placeholder="e.g. General Medicine, Pediatric & Preventive Healthcare"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontSize: '0.86rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Clinic Address
                      </label>
                      <input
                        type="text"
                        value={clinicAddress}
                        onChange={e => setClinicAddress(e.target.value)}
                        placeholder="e.g. Near Bus Stand, Civil Hospital Road, Gujarat"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontSize: '0.86rem',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        Clinic Telephone / Emergency Contact
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={e => {
                          setPhone(e.target.value);
                          setHeaderContact(e.target.value);
                        }}
                        placeholder="e.g. +91 98765 43210"
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontSize: '0.86rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Section 3: Doctor Credentials */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                      👨‍⚕️ Attending Doctor Credentials
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                          Doctor Full Name *
                        </label>
                        <input
                          type="text"
                          value={doctorName}
                          onChange={e => setDoctorName(e.target.value)}
                          placeholder="Dr. Pranav Tank"
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.84rem', fontWeight: 700 }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                          Degrees / Qualifications *
                        </label>
                        <input
                          type="text"
                          value={qualification}
                          onChange={e => setQualification(e.target.value)}
                          placeholder="MBBS, MD (General Medicine)"
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.84rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                          Specialization
                        </label>
                        <input
                          type="text"
                          value={specialization}
                          onChange={e => setSpecialization(e.target.value)}
                          placeholder="Consultant Physician"
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.84rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                          Medical Reg No. *
                        </label>
                        <input
                          type="text"
                          value={registrationNumber}
                          onChange={e => setRegistrationNumber(e.target.value)}
                          placeholder="GMC-2024-91823"
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.84rem', fontFamily: 'monospace' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                          Medical Council
                        </label>
                        <input
                          type="text"
                          value={medicalCouncil}
                          onChange={e => setMedicalCouncil(e.target.value)}
                          placeholder="National Medical Commission (NMC)"
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.84rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                          OPD Timings
                        </label>
                        <input
                          type="text"
                          value={consultationHours}
                          onChange={e => setConsultationHours(e.target.value)}
                          placeholder="09:00 AM – 05:00 PM"
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.84rem' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Color Theme Palette */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                      🎨 Prescription Accent Color Theme
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Clinical Teal', color: '#0f766e' },
                        { label: 'Forest Emerald', color: '#065f46' },
                        { label: 'Royal Blue', color: '#1e40af' },
                        { label: 'Midnight Slate', color: '#1e293b' },
                        { label: 'Medical Crimson', color: '#991b1b' }
                      ].map(item => (
                        <button
                          key={item.color}
                          type="button"
                          onClick={() => setThemeColor(item.color)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: themeColor === item.color ? `2px solid ${item.color}` : '1px solid #cbd5e1',
                            background: themeColor === item.color ? `${item.color}15` : '#ffffff',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: themeColor === item.color ? 800 : 500
                          }}
                        >
                          <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                          {item.label}
                        </button>
                      ))}
                      <input
                        type="color"
                        value={themeColor || '#0f766e'}
                        onChange={e => setThemeColor(e.target.value)}
                        style={{ width: '38px', height: '34px', border: 'none', cursor: 'pointer', borderRadius: '6px' }}
                        title="Custom color picker"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  background: '#f8fafc',
                  borderBottomLeftRadius: '20px',
                  borderBottomRightRadius: '20px'
                }}>
                  <button
                    type="button"
                    onClick={() => setShowLetterheadModal(false)}
                    style={{
                      padding: '9px 18px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: '#475569'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLetterhead}
                    style={{
                      padding: '9px 22px',
                      background: themeColor || '#0f766e',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  >
                    <Save size={16} /> Save Letterhead & Logo to Database
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>}

      {/* ========================================================================= */}
      {/* TAB 4: MOBILE DATA FETCH ("Mobile no thi data fetch that joi")             */}
      {/* ========================================================================= */}
      {activeSubTab === 'phoneFetch' && (
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Main Search Panel */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px -2px rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}>
            {/* Top Accent Strip */}
            <div style={{ height: '4px', background: 'linear-gradient(90deg, #0f766e, #10b981, #06b6d4)' }} />

            <div style={{ padding: '28px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#0f172a'
                }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#ecfdf5',
                    color: '#0f766e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Search size={22} />
                  </div>
                  Mobile Number Data Fetch
                </h3>
                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  background: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #bbf7d0',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                  MongoDB Central Connected
                </span>
              </div>

              <p style={{
                margin: '0 0 20px',
                fontSize: '0.88rem',
                color: '#64748b',
                lineHeight: 1.6
              }}>
                Enter any 10-digit mobile number to automatically fetch the matching <strong>Doctor Profile</strong> or <strong>Patient Clinical History, Vitals & Referral Records</strong> directly from the central database.
              </p>

              {/* Mobile Input & Fetch Button Form */}
              <form onSubmit={handleFetchByMobile} style={{
                display: 'flex',
                gap: '12px',
                maxWidth: '680px',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  flex: 1,
                  minWidth: '260px',
                  position: 'relative'
                }}>
                  <Phone size={18} color="#0f766e" style={{
                    position: 'absolute',
                    left: '14px',
                    top: '14px'
                  }} />
                  <input
                    type="text"
                    value={searchMobile}
                    onChange={e => setSearchMobile(e.target.value)}
                    placeholder="Enter 10-digit mobile (e.g. 9876543210 or 8866877692)"
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '0.94rem',
                      outline: 'none',
                      color: '#0f172a',
                      fontWeight: 600,
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                      background: '#ffffff'
                    }}
                    onFocus={e => e.target.style.borderColor = '#0f766e'}
                    onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                  />
                  {searchMobile && (
                    <button
                      type="button"
                      onClick={() => setSearchMobile('')}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '13px',
                        background: '#e2e8f0',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#64748b',
                        fontSize: '0.75rem'
                      }}
                      title="Clear input"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={phoneSearchLoading}
                  style={{
                    background: phoneSearchLoading ? '#94a3b8' : '#0f766e',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 26px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: phoneSearchLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(15, 118, 110, 0.25)',
                    transition: 'all 0.2s'
                  }}
                >
                  {phoneSearchLoading ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      <span>Fetching DB...</span>
                    </>
                  ) : (
                    <>
                      <Search size={18} />
                      <span>Fetch Data by Mobile</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick-test database pills */}
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Quick Test Records:</span>
                {[
                  { label: 'Pooja Patel', role: 'Patient', phone: '9876543210' },
                  { label: 'Mitul Aghara', role: 'Citizen', phone: '8866877692' },
                  { label: 'Dr. Ananya Roy', role: 'Doctor', phone: '9876511223' },
                  { label: 'Dr. Pranav Tank', role: 'Doctor', phone: '9876500000' },
                  { label: 'Pranav Tank', role: 'Doctor', phone: '1234567890' }
                ].map(pill => (
                  <button
                    key={pill.phone}
                    type="button"
                    onClick={() => {
                      setSearchMobile(pill.phone);
                      handleFetchByMobile(null, pill.phone);
                    }}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      color: '#334155',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#ecfdf5';
                      e.currentTarget.style.borderColor = '#a7f3d0';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }}
                  >
                    <span>📞 {pill.phone}</span>
                    <span style={{ color: pill.role === 'Doctor' ? '#0f766e' : '#2563eb', fontWeight: 700, fontSize: '0.7rem' }}>
                      ({pill.label})
                    </span>
                  </button>
                ))}
              </div>

              {/* Status Message Notification */}
              {phoneSearchMsg && (
                <div style={{
                  marginTop: '18px',
                  padding: '12px 18px',
                  borderRadius: '10px',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: phoneSearchMsg.includes('✅') || phoneSearchMsg.includes('successfully') ? '#f0fdf4' : '#fffbeb',
                  border: `1px solid ${phoneSearchMsg.includes('✅') || phoneSearchMsg.includes('successfully') ? '#bbf7d0' : '#fde68a'}`,
                  color: phoneSearchMsg.includes('✅') || phoneSearchMsg.includes('successfully') ? '#166534' : '#92400e'
                }}>
                  {phoneSearchMsg.includes('✅') || phoneSearchMsg.includes('successfully') ? (
                    <CheckCircle2 size={18} color="#16a34a" />
                  ) : (
                    <AlertCircle size={18} color="#d97706" />
                  )}
                  <span>{phoneSearchMsg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Loading Indicator */}
          {phoneSearchLoading && (
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px'
            }}>
              <Loader size={36} color="#0f766e" className="animate-spin" />
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                Querying MongoDB Atlas Central Registry...
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Searching doctor profiles, patient clinical history, vitals & previous prescriptions for mobile: <strong>{searchMobile}</strong>
              </div>
            </div>
          )}

          {/* Results Grid */}
          {(!phoneSearchLoading && (fetchedDoctorData || (fetchedPatientData && fetchedPatientData.patients && fetchedPatientData.patients.length > 0))) && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '24px',
              alignItems: 'start'
            }}>
              {/* Fetched Doctor Profile Card */}
              {fetchedDoctorData && (
                <div style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px -2px rgba(0,0,0,0.06)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #f1f5f9'
                  }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: '#ecfdf5',
                      color: '#065f46',
                      border: '1px solid #a7f3d0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      ✓ DOCTOR PROFILE FOUND
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                      ID: {fetchedDoctorData.doctorId || 'DOC-REG'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img
                      src={fetchedDoctorData.profilePhoto || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80'}
                      alt="Doctor"
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #0f766e',
                        flexShrink: 0
                      }}
                    />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                        {fetchedDoctorData.doctorName}
                      </h4>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f766e', marginTop: '2px' }}>
                        {fetchedDoctorData.specialization || 'General Physician'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {fetchedDoctorData.qualification || 'MBBS'}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '10px',
                    padding: '14px',
                    fontSize: '0.82rem',
                    lineHeight: 1.8,
                    color: '#334155'
                  }}>
                    <div>📞 <strong>Registered Phone:</strong> {fetchedDoctorData.phone}</div>
                    <div>✉️ <strong>Email Address:</strong> {fetchedDoctorData.email || 'N/A'}</div>
                    <div>📜 <strong>Registration No:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{fetchedDoctorData.registrationNumber || 'GMC-2024-91823'}</span></div>
                    <div>🏥 <strong>Clinic / Facility:</strong> {fetchedDoctorData.clinicName || 'Rural Healthcare Clinic'}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleApplyFetchedDoctor(fetchedDoctorData)}
                      style={{
                        flex: 1,
                        background: '#0f766e',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(15,118,110,0.2)'
                      }}
                    >
                      <UserCheck size={16} /> Load into Profile Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDoctorName(fetchedDoctorData.doctorName || doctorName);
                        setSpecialization(fetchedDoctorData.specialization || specialization);
                        setQualification(fetchedDoctorData.qualification || qualification);
                        setRegistrationNumber(fetchedDoctorData.registrationNumber || registrationNumber);
                        if (fetchedDoctorData.clinicName) setHeaderTitle(fetchedDoctorData.clinicName);
                        setActiveSubTab('prescriptions');
                        setSaveSuccess(`Prescription letterhead configured with ${fetchedDoctorData.doctorName}!`);
                      }}
                      style={{
                        background: '#f0fdf4',
                        color: '#166534',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Palette size={16} /> Use on Prescription
                    </button>
                  </div>
                </div>
              )}

              {/* Fetched Patient Records Card */}
              {fetchedPatientData && fetchedPatientData.patients && fetchedPatientData.patients.length > 0 && (
                <div style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px -2px rgba(0,0,0,0.06)',
                  padding: '24px',
                  gridColumn: fetchedDoctorData ? 'span 1' : 'span 2',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #f1f5f9'
                  }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#0f172a'
                    }}>
                      <Heart size={20} color="#dc2626" />
                      Patient Records Found ({fetchedPatientData.patients.length})
                    </h4>
                    <span style={{
                      fontSize: '0.78rem',
                      color: '#0f766e',
                      fontWeight: 700,
                      background: '#ecfdf5',
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      Mobile: {fetchedPatientData.cleanPhone || searchMobile}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {fetchedPatientData.patients.map(p => {
                      const riskColor = p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL'
                        ? { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' }
                        : p.riskLevel === 'MODERATE'
                        ? { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' }
                        : { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' };

                      return (
                        <div key={p.id || p._id} style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '18px',
                          background: '#ffffff',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                            gap: '8px'
                          }}>
                            <div>
                              <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{p.name}</strong>
                              <span style={{ fontSize: '0.84rem', color: '#64748b', marginLeft: '8px', fontWeight: 600 }}>
                                ({p.age} Yrs • {p.gender})
                              </span>
                              <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '3px' }}>
                                📍 Village: <strong>{p.village || 'Primary Block'}</strong> • ASHA: <strong>{p.ashaWorkerName || 'Designated ASHA'}</strong>
                              </div>
                            </div>

                            <span style={{
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              background: riskColor.bg,
                              color: riskColor.text,
                              border: `1px solid ${riskColor.border}`,
                              textTransform: 'uppercase'
                            }}>
                              {p.riskLevel || 'LOW'} RISK
                            </span>
                          </div>

                          <div style={{
                            fontSize: '0.84rem',
                            color: '#1e293b',
                            background: '#f8fafc',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            borderLeft: '3px solid #0f766e'
                          }}>
                            <strong>Chief Complaint:</strong> {p.chiefComplaint || 'Clinical Consultation Record'}
                          </div>

                          {p.vitals && (
                            <div style={{
                              display: 'flex',
                              gap: '8px',
                              fontSize: '0.76rem',
                              flexWrap: 'wrap'
                            }}>
                              <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                BP: <strong>{p.vitals.bp || '120/80'}</strong>
                              </span>
                              <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                SpO2: <strong>{p.vitals.spo2 || 98}%</strong>
                              </span>
                              <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                Pulse: <strong>{p.vitals.pulse || 72} bpm</strong>
                              </span>
                              <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                Temp: <strong>{p.vitals.temp || 98.4}°F</strong>
                              </span>
                            </div>
                          )}

                          {/* Prescriptions on record indicator */}
                          {fetchedPatientData.prescriptions && fetchedPatientData.prescriptions.length > 0 && (
                            <div style={{
                              fontSize: '0.78rem',
                              color: '#0f766e',
                              background: '#ecfdf5',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid #bbf7d0',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <FileText size={14} />
                              <span>Found <strong>{fetchedPatientData.prescriptions.length}</strong> previous digital prescription(s) issued in database.</span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div style={{
                            marginTop: '4px',
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'wrap'
                          }}>
                            <button
                              type="button"
                              onClick={() => handleLoadPatientToRx(p)}
                              style={{
                                background: '#0f766e',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 16px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 6px rgba(15,118,110,0.2)'
                              }}
                            >
                              <FileText size={15} /> Write Prescription
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedHistoryPatientId(p.id || p.phone || p._id);
                                setHistoryInitialTab('history');
                                setActiveSubTab('history');
                              }}
                              style={{
                                background: '#ffffff',
                                color: '#0f172a',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                padding: '8px 14px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <FileText size={15} color="#0f766e" /> Clinical History
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedHistoryPatientId(p.id || p.phone || p._id);
                                setHistoryInitialTab('profile');
                                setActiveSubTab('history');
                              }}
                              style={{
                                background: '#ffffff',
                                color: '#0f172a',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                padding: '8px 14px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <Edit3 size={15} color="#2563eb" /> Edit Profile
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUTH MODAL FOR DOCTOR: GOOGLE LOGIN & EMAIL OTP LOGIN                     */}
      {/* ========================================================================= */}
      {showAuthModal && <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.72)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
          <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        width: '100%',
        maxWidth: '480px',
        overflow: 'hidden'
      }}>
            {/* Modal Header */}
            <div style={{
          background: '#0f766e',
          padding: '22px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
              <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
                <Stethoscope size={22} color="#34d399" />
                <div>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#ffffff'
                  }}>Doctor Authentication</h3>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.85)'
                  }}>Login via Doctor ID & Password, Email OTP, or Google</div>
                </div>
              </div>

              <button type="button" onClick={() => setShowAuthModal(false)} style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}>
                ✕
              </button>
            </div>

            {/* Auth Switcher Tabs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr 1fr',
              borderBottom: "1px solid #e2e8f0"
            }}>
              <button type="button" onClick={() => {
                setAuthMode('idPass');
                setAuthStatusMsg('');
              }} style={{
                padding: '12px 6px',
                border: 'none',
                background: authMode === 'idPass' ? '#f0fdf4' : '#ffffff',
                borderBottom: authMode === 'idPass' ? '3px solid #059669' : 'none',
                fontWeight: authMode === 'idPass' ? 700 : 500,
                fontSize: '0.82rem',
                color: authMode === 'idPass' ? '#065f46' : '#64748b',
                cursor: 'pointer'
              }}>
                🔑 Doctor ID & Pass
              </button>

              <button type="button" onClick={() => {
                setAuthMode('emailOtp');
                setAuthStatusMsg('');
              }} style={{
                padding: '12px 6px',
                border: 'none',
                background: authMode === 'emailOtp' ? '#f0fdf4' : '#ffffff',
                borderBottom: authMode === 'emailOtp' ? '3px solid #059669' : 'none',
                fontWeight: authMode === 'emailOtp' ? 700 : 500,
                fontSize: '0.82rem',
                color: authMode === 'emailOtp' ? '#065f46' : '#64748b',
                cursor: 'pointer'
              }}>
                ✉️ Email OTP
              </button>

              <button type="button" onClick={() => {
                setAuthMode('google');
                setAuthStatusMsg('');
              }} style={{
                padding: '12px 6px',
                border: 'none',
                background: authMode === 'google' ? '#f0fdf4' : '#ffffff',
                borderBottom: authMode === 'google' ? '3px solid #059669' : 'none',
                fontWeight: authMode === 'google' ? 700 : 500,
                fontSize: '0.82rem',
                color: authMode === 'google' ? '#065f46' : '#64748b',
                cursor: 'pointer'
              }}>
                🌐 Google Login
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {authStatusMsg && <div style={{
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '0.82rem',
                fontWeight: 600,
                borderRadius: '8px',
                background: authStatusMsg.includes('success') || authStatusMsg.includes('Welcome') ? '#ecfdf5' : '#fef2f2',
                color: authStatusMsg.includes('success') || authStatusMsg.includes('Welcome') ? '#065f46' : '#b91c1c',
                border: `1px solid ${authStatusMsg.includes('success') || authStatusMsg.includes('Welcome') ? '#a7f3d0' : '#fca5a5'}`
              }}>
                {authStatusMsg}
              </div>}

              {/* 0. DOCTOR ID & PASSWORD LOGIN (PRIMARY) */}
              {authMode === 'idPass' && (
                <form onSubmit={handleDoctorIdPassLogin}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#1e293b' }}>
                      Doctor ID / Registered Mobile / Email
                    </label>
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={e => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. DOC-123456 or 10-digit mobile"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      Enter the Doctor ID generated by Admin (e.g. <code>DOC-XXXXXX</code>) or your registered mobile number.
                    </span>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          color: '#0f766e',
                          fontWeight: 600
                        }}
                      >
                        {showLoginPassword ? '🙈 Hide' : '👁️ Show'}
                      </button>
                    </div>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="Enter initial doctor password"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    style={{
                      width: '100%',
                      background: '#0f766e',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      cursor: authLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'background 0.2s'
                    }}
                  >
                    {authLoading ? 'Verifying Credentials...' : '🔑 Log In as Doctor'}
                  </button>
                </form>
              )}

              {/* 1. EMAIL OTP LOGIN */}
              {authMode === 'emailOtp' && <div>
                  {!otpSent ? <form onSubmit={handleSendEmailOtp}>
                      <div style={{
                marginBottom: '16px'
              }}>
                        <label style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  marginBottom: '6px'
                }}>
                          Enter Registered Doctor Email
                        </label>
                        <input type="email" required value={otpEmail} onChange={e => setOtpEmail(e.target.value)} placeholder="doctor@graminarogya.in" style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }} />
                      </div>

                      <button type="submit" disabled={authLoading} style={{
                width: '100%',
                background: '#0f766e',
                border: 'none',
                padding: '12px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}>
                        {authLoading ? 'Generating & Sending OTP...' : 'Send OTP to Mail for Authentication'}
                      </button>
                    </form> : <form onSubmit={handleVerifyEmailOtp}>
                      <div style={{
                marginBottom: '16px'
              }}>
                        <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px'
                }}>
                          <label style={{
                    fontSize: '0.82rem',
                    fontWeight: 700
                  }}>
                            Enter 6-Digit OTP Code
                          </label>
                          <button type="button" onClick={() => setOtpSent(false)} style={{
                    border: 'none',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}>
                            Change Email
                          </button>
                        </div>
                        <input type="text" required maxLength="6" value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="e.g. 123456" style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '1.4rem',
                  textAlign: 'center',
                  letterSpacing: '8px',
                  fontWeight: 800,
                  boxSizing: 'border-box'
                }} />
                      </div>


                      <button type="submit" disabled={authLoading} style={{
                width: '100%',
                background: '#0f766e',
                border: 'none',
                padding: '12px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}>
                        {authLoading ? 'Verifying OTP...' : 'Verify OTP & Log In'}
                      </button>
                    </form>}
                </div>}

              {/* 2. GOOGLE LOGIN */}
              {authMode === 'google' && <div style={{
            textAlign: 'center'
          }}>
                  <p style={{
              fontSize: '0.85rem',
              marginBottom: '20px',
              lineHeight: 1.5
            }}>
                    Sign in with your Google Medical Practitioner account to sync your verified credentials, registration license, and hospital schedule.
                  </p>

                  <button type="button" onClick={() => handleGoogleLogin()} disabled={authLoading} style={{
              width: '100%',
              border: '1px solid #e2e8f0',
              padding: '12px 16px',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}>
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.34 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                    </svg>
                    Continue with Google
                  </button>

                  <div style={{
              marginTop: '16px',
              fontSize: '0.74rem'
            }}>
                    Secured by Google Identity Services • SIH 2026
                  </div>
                </div>}

            </div>
          </div>
        </div>}

      {/* Print Styles for clean A4 printing without UI elements */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 10mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 100% !important;
            height: auto !important;
          }
          nav, header, footer, .navbar, .hero-header, .stats-grid, .pill-nav, .no-print, button, input[type="file"] {
            display: none !important;
          }
          body * {
            visibility: hidden;
          }
          #printable-prescription, #printable-prescription * {
            visibility: visible;
          }
          #printable-prescription {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            right: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            z-index: 9999999 !important;
            page-break-inside: avoid !important;
          }
          #printable-prescription input, #printable-prescription textarea {
            border: 1.5px solid #0f766e !important;
            border-radius: 4px !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: inherit !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

    </div>;
}






























