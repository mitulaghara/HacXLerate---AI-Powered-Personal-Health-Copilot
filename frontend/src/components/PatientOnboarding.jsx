import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Check, X, Phone, Calendar, Droplet, MapPin, AlertCircle, Heart, CheckCircle2, ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { api } from '../utils/api';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const InputField = ({ label, icon: Icon, type = "text", value, onChange, placeholder, required = false, isHidden = false }) => {
  if (isHidden) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground)' }}>
        {label} {required && <span style={{ color: 'var(--emergency)' }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={18} color="var(--mutedForeground)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />}
        <input
          type={type} required={required} value={value} onChange={onChange} placeholder={placeholder}
          style={{
            width: '100%', padding: Icon ? '0.75rem 1rem 0.75rem 2.75rem' : '0.75rem 1rem', 
            background: '#fff', border: '1px solid var(--borderLight)', borderRadius: '8px',
            fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--foreground)',
            outline: 'none', transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--borderLight)'}
        />
      </div>
    </div>
  );
};

export default function PatientOnboarding({ onSuccess, switchToLogin }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Step 1: Account
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Step 2: Personal
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('');
  
  // Step 3: Address
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [villageTown, setVillageTown] = useState('');
  const [pinCode, setPinCode] = useState('');
  
  // Step 4: Emergency Contact
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');
  const [emergencyContactMobile, setEmergencyContactMobile] = useState('');
  
  // Step 5: Health Profile
  const [knownAllergies, setKnownAllergies] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');
  const [previousMedicalConditions, setPreviousMedicalConditions] = useState('');
  const [previousSurgeries, setPreviousSurgeries] = useState('');
  const [disabilityRequirements, setDisabilityRequirements] = useState('');
  
  // Step 6: Consent
  const [consentAccepted, setConsentAccepted] = useState(false);
  
  const [passwordStrength, setPasswordStrength] = useState({ length: false, upper: false, lower: false, number: false, special: false, score: 0 });
  const [completedProfile, setCompletedProfile] = useState(null); // stores resulting patId

  useEffect(() => {
    const reqs = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };
    const score = Object.values(reqs).filter(Boolean).length;
    setPasswordStrength({ ...reqs, score });
  }, [password]);

  const validateStep1 = () => {
    if (!name || !phone || !password || !confirmPassword) return "Please fill all required fields.";
    if (!/^\d{10}$/.test(phone)) return "Mobile number must be exactly 10 digits.";
    if (password !== confirmPassword) return "Passwords do not match.";
    if (passwordStrength.score < 5) return "Please satisfy all password requirements.";
    return "";
  };

  const [existingData, setExistingData] = useState(null);

  const handleNext = async () => {
    setErrorMsg('');
    if (step === 1) {
      const err = validateStep1();
      if (err) return setErrorMsg(err);
      
      setLoading(true);
      try {
        const fullPhone = `${countryCode}${phone}`;
        const res = await api.checkExisting({ phone: fullPhone, email, password });
        if (res.exists) {
          if (res.token) {
            localStorage.setItem('gramin_arogya_token', res.token);
            localStorage.setItem('gramin_arogya_user', JSON.stringify(res.user));
          }
          setExistingData(res.patientData || {});
          
          const p = res.patientData || {};
          if (p.dateOfBirth) setDateOfBirth(p.dateOfBirth.substring(0, 10)); // YYYY-MM-DD
          if (p.gender) setGender(p.gender);
          if (p.bloodGroup) setBloodGroup(p.bloodGroup);
          if (p.preferredLanguage) setPreferredLanguage(p.preferredLanguage);
          if (p.address?.state) setState(p.address.state);
          if (p.address?.district) setDistrict(p.address.district);
          if (p.address?.villageTown) setVillageTown(p.address.villageTown);
          if (p.address?.pinCode) setPinCode(p.address.pinCode);
          if (p.emergencyContactName) setEmergencyContactName(p.emergencyContactName);
          if (p.emergencyContactRelation) setEmergencyContactRelation(p.emergencyContactRelation);
          if (p.emergencyContactMobile) setEmergencyContactMobile(p.emergencyContactMobile);
          if (p.knownAllergies?.length) setKnownAllergies(p.knownAllergies.join(', '));
          if (p.chronicConditions?.length) setChronicConditions(p.chronicConditions.join(', '));
          if (p.currentMedications?.length) setCurrentMedications(p.currentMedications.join(', '));
          if (p.previousMedicalConditions?.length) setPreviousMedicalConditions(p.previousMedicalConditions.join(', '));
          if (p.previousSurgeries?.length) setPreviousSurgeries(p.previousSurgeries.join(', '));
          if (p.disabilityRequirements) setDisabilityRequirements(p.disabilityRequirements);
        }
      } catch (err) {
        if (err.message) return setErrorMsg(err.message);
        return setErrorMsg('Error checking account existence.');
      } finally {
        setLoading(false);
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep(prev => prev - 1);
  };

  const parseArray = (str) => {
    if (!str) return [];
    if (str.toLowerCase() === 'none' || str.toLowerCase() === 'not known') return [];
    return str.split(',').map(s => s.trim()).filter(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consentAccepted) return setErrorMsg('You must accept the terms to register.');
    
    setLoading(true);
    setErrorMsg('');

    const fullPhone = `${countryCode}${phone}`;
    const finalUsername = (email ? email.toLowerCase().trim() : '') || fullPhone.replace(/\D/g, '') || name.toLowerCase().replace(/\s+/g, '');

    const payload = {
      username: finalUsername,
      name, phone: fullPhone, email, password, role: 'patient',
      dateOfBirth, gender, bloodGroup, preferredLanguage,
      address: { state, district, villageTown, pinCode },
      emergencyContactName, emergencyContactRelation, emergencyContactMobile,
      knownAllergies: parseArray(knownAllergies),
      chronicConditions: parseArray(chronicConditions),
      currentMedications: parseArray(currentMedications),
      previousMedicalConditions: parseArray(previousMedicalConditions),
      previousSurgeries: parseArray(previousSurgeries),
      disabilityRequirements,
      consentAccepted
    };

    try {
      const data = await api.register(payload);
      
      if (data && data.success) {
        setCompletedProfile(data.user);
      } else {
        if (data?.message && data.message.includes('already exists')) {
          setErrorMsg(data.message);
        } else {
          setErrorMsg(data?.error || data?.message || 'Registration failed');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Network error during registration.');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (score) => {
    if (score <= 2) return 'var(--emergency)';
    if (score <= 4) return '#E7A63B';
    return '#10B981';
  };

  const getStrengthLabel = (score) => {
    if (score === 0) return '';
    if (score <= 2) return 'WEAK';
    if (score <= 4) return 'MEDIUM';
    return 'STRONG';
  };

  const RequirementItem = ({ satisfied, text }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: satisfied ? '#10B981' : 'var(--mutedForeground)' }}>
      {satisfied ? <Check size={14} strokeWidth={3} /> : <X size={14} />}
      <span>{text}</span>
    </div>
  );

  if (completedProfile) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
        <CheckCircle2 size={64} color="#10B981" style={{ margin: '0 auto 1.5rem' }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--foreground)' }}>Registration Successful!</h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--mutedForeground)', marginBottom: '2rem' }}>
          Your health profile has been securely created. Please save your permanent Patient ID below.
        </p>
        
        <div style={{ background: '#F8FAF9', border: '2px dashed var(--borderLight)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--mutedForeground)', marginBottom: '0.5rem' }}>YOUR PATIENT ID</div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '2px' }}>
              {completedProfile.patId || completedProfile.username}
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(completedProfile.patId || completedProfile.username)}
              style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              title="Copy ID"
            >
              Copy
            </button>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--mutedForeground)', marginTop: '0.5rem' }}>Please save or remember this ID for future logins.</div>
        </div>

        <button 
          onClick={switchToLogin}
          style={{ width: '100%', padding: '0.875rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          Continue to Sign In <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '2rem' }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= step ? 'var(--primary)' : 'var(--borderLight)', transition: 'background 0.3s' }} />
        ))}
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        {step === 1 && "Account Details"}
        {step === 2 && "Personal Information"}
        {step === 3 && "Address Details"}
        {step === 4 && "Emergency Contact"}
        {step === 5 && "Health Profile"}
        {step === 6 && "Review & Consent"}
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--mutedForeground)', marginBottom: '1.5rem' }}>
        {step === 1 && "Create your secure login credentials."}
        {step === 2 && "Basic demographic details."}
        {step === 3 && "Where do you reside?"}
        {step === 4 && "Who should we contact in an emergency?"}
        {step === 5 && "Optional medical history. Type 'None' if not applicable."}
        {step === 6 && "Verify your information before finalizing."}
      </p>

      {errorMsg && (
        <div style={{ background: '#FEF2F2', color: 'var(--emergency)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontFamily: 'var(--font-body)', fontSize: '0.875rem', border: '1px solid #FCA5A5' }}>
          {errorMsg}
        </div>
      )}

      {step === 1 && (
        <div>
          <InputField label="FULL NAME" icon={User} value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" required />
          {/* Phone field with country code */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--foreground)', display: 'block', marginBottom: '0.5rem', letterSpacing: '0.02em' }}>
              MOBILE NUMBER <span style={{ color: 'var(--emergency)' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                style={{
                  padding: '0.875rem 0.5rem', border: '1px solid var(--borderLight)', borderRadius: '8px',
                  fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--foreground)',
                  background: '#fff', cursor: 'pointer', outline: 'none',
                  width: '155px', minWidth: '155px', maxWidth: '155px', flexShrink: 0
                }}
              >
                <option value="+91">IN India (+91)</option>
                <option value="+93">AF Afghanistan (+93)</option>
                <option value="+355">AL Albania (+355)</option>
                <option value="+213">DZ Algeria (+213)</option>
                <option value="+1684">AS American Samoa (+1684)</option>
                <option value="+376">AD Andorra (+376)</option>
                <option value="+244">AO Angola (+244)</option>
                <option value="+1264">AI Anguilla (+1264)</option>
                <option value="+1268">AG Antigua & Barbuda (+1268)</option>
                <option value="+54">AR Argentina (+54)</option>
                <option value="+374">AM Armenia (+374)</option>
                <option value="+297">AW Aruba (+297)</option>
                <option value="+61">AU Australia (+61)</option>
                <option value="+43">AT Austria (+43)</option>
                <option value="+994">AZ Azerbaijan (+994)</option>
                <option value="+1242">BS Bahamas (+1242)</option>
                <option value="+973">BH Bahrain (+973)</option>
                <option value="+880">BD Bangladesh (+880)</option>
                <option value="+1246">BB Barbados (+1246)</option>
                <option value="+375">BY Belarus (+375)</option>
                <option value="+32">BE Belgium (+32)</option>
                <option value="+501">BZ Belize (+501)</option>
                <option value="+229">BJ Benin (+229)</option>
                <option value="+1441">BM Bermuda (+1441)</option>
                <option value="+975">BT Bhutan (+975)</option>
                <option value="+591">BO Bolivia (+591)</option>
                <option value="+387">BA Bosnia & Herzegovina (+387)</option>
                <option value="+267">BW Botswana (+267)</option>
                <option value="+55">BR Brazil (+55)</option>
                <option value="+246">IO British Indian Ocean Territory (+246)</option>
                <option value="+1284">VG British Virgin Islands (+1284)</option>
                <option value="+673">BN Brunei (+673)</option>
                <option value="+359">BG Bulgaria (+359)</option>
                <option value="+226">BF Burkina Faso (+226)</option>
                <option value="+257">BI Burundi (+257)</option>
                <option value="+855">KH Cambodia (+855)</option>
                <option value="+237">CM Cameroon (+237)</option>
                <option value="+1">CA Canada (+1)</option>
                <option value="+238">CV Cape Verde (+238)</option>
                <option value="+1345">KY Cayman Islands (+1345)</option>
                <option value="+236">CF Central African Republic (+236)</option>
                <option value="+235">TD Chad (+235)</option>
                <option value="+56">CL Chile (+56)</option>
                <option value="+86">CN China (+86)</option>
                <option value="+57">CO Colombia (+57)</option>
                <option value="+269">KM Comoros (+269)</option>
                <option value="+242">CG Congo (+242)</option>
                <option value="+243">CD Congo DRC (+243)</option>
                <option value="+682">CK Cook Islands (+682)</option>
                <option value="+506">CR Costa Rica (+506)</option>
                <option value="+225">CI Cote d'Ivoire (+225)</option>
                <option value="+385">HR Croatia (+385)</option>
                <option value="+53">CU Cuba (+53)</option>
                <option value="+599">CW Curacao (+599)</option>
                <option value="+357">CY Cyprus (+357)</option>
                <option value="+420">CZ Czech Republic (+420)</option>
                <option value="+45">DK Denmark (+45)</option>
                <option value="+253">DJ Djibouti (+253)</option>
                <option value="+1767">DM Dominica (+1767)</option>
                <option value="+1809">DO Dominican Republic (+1809)</option>
                <option value="+670">TL East Timor (+670)</option>
                <option value="+593">EC Ecuador (+593)</option>
                <option value="+20">EG Egypt (+20)</option>
                <option value="+503">SV El Salvador (+503)</option>
                <option value="+240">GQ Equatorial Guinea (+240)</option>
                <option value="+291">ER Eritrea (+291)</option>
                <option value="+372">EE Estonia (+372)</option>
                <option value="+251">ET Ethiopia (+251)</option>
                <option value="+500">FK Falkland Islands (+500)</option>
                <option value="+298">FO Faroe Islands (+298)</option>
                <option value="+679">FJ Fiji (+679)</option>
                <option value="+358">FI Finland (+358)</option>
                <option value="+33">FR France (+33)</option>
                <option value="+594">GF French Guiana (+594)</option>
                <option value="+689">PF French Polynesia (+689)</option>
                <option value="+241">GA Gabon (+241)</option>
                <option value="+220">GM Gambia (+220)</option>
                <option value="+995">GE Georgia (+995)</option>
                <option value="+49">DE Germany (+49)</option>
                <option value="+233">GH Ghana (+233)</option>
                <option value="+350">GI Gibraltar (+350)</option>
                <option value="+30">GR Greece (+30)</option>
                <option value="+299">GL Greenland (+299)</option>
                <option value="+1473">GD Grenada (+1473)</option>
                <option value="+590">GP Guadeloupe (+590)</option>
                <option value="+1671">GU Guam (+1671)</option>
                <option value="+502">GT Guatemala (+502)</option>
                <option value="+224">GN Guinea (+224)</option>
                <option value="+245">GW Guinea-Bissau (+245)</option>
                <option value="+592">GY Guyana (+592)</option>
                <option value="+509">HT Haiti (+509)</option>
                <option value="+504">HN Honduras (+504)</option>
                <option value="+852">HK Hong Kong (+852)</option>
                <option value="+36">HU Hungary (+36)</option>
                <option value="+354">IS Iceland (+354)</option>
                <option value="+62">ID Indonesia (+62)</option>
                <option value="+98">IR Iran (+98)</option>
                <option value="+964">IQ Iraq (+964)</option>
                <option value="+353">IE Ireland (+353)</option>
                <option value="+972">IL Israel (+972)</option>
                <option value="+39">IT Italy (+39)</option>
                <option value="+1876">JM Jamaica (+1876)</option>
                <option value="+81">JP Japan (+81)</option>
                <option value="+962">JO Jordan (+962)</option>
                <option value="+7">KZ Kazakhstan (+7)</option>
                <option value="+254">KE Kenya (+254)</option>
                <option value="+686">KI Kiribati (+686)</option>
                <option value="+383">XK Kosovo (+383)</option>
                <option value="+965">KW Kuwait (+965)</option>
                <option value="+996">KG Kyrgyzstan (+996)</option>
                <option value="+856">LA Laos (+856)</option>
                <option value="+371">LV Latvia (+371)</option>
                <option value="+961">LB Lebanon (+961)</option>
                <option value="+266">LS Lesotho (+266)</option>
                <option value="+231">LR Liberia (+231)</option>
                <option value="+218">LY Libya (+218)</option>
                <option value="+423">LI Liechtenstein (+423)</option>
                <option value="+370">LT Lithuania (+370)</option>
                <option value="+352">LU Luxembourg (+352)</option>
                <option value="+853">MO Macau (+853)</option>
                <option value="+389">MK Macedonia (+389)</option>
                <option value="+261">MG Madagascar (+261)</option>
                <option value="+265">MW Malawi (+265)</option>
                <option value="+60">MY Malaysia (+60)</option>
                <option value="+960">MV Maldives (+960)</option>
                <option value="+223">ML Mali (+223)</option>
                <option value="+356">MT Malta (+356)</option>
                <option value="+692">MH Marshall Islands (+692)</option>
                <option value="+596">MQ Martinique (+596)</option>
                <option value="+222">MR Mauritania (+222)</option>
                <option value="+230">MU Mauritius (+230)</option>
                <option value="+52">MX Mexico (+52)</option>
                <option value="+691">FM Micronesia (+691)</option>
                <option value="+373">MD Moldova (+373)</option>
                <option value="+377">MC Monaco (+377)</option>
                <option value="+976">MN Mongolia (+976)</option>
                <option value="+382">ME Montenegro (+382)</option>
                <option value="+1664">MS Montserrat (+1664)</option>
                <option value="+212">MA Morocco (+212)</option>
                <option value="+258">MZ Mozambique (+258)</option>
                <option value="+95">MM Myanmar (+95)</option>
                <option value="+264">NA Namibia (+264)</option>
                <option value="+674">NR Nauru (+674)</option>
                <option value="+977">NP Nepal (+977)</option>
                <option value="+31">NL Netherlands (+31)</option>
                <option value="+687">NC New Caledonia (+687)</option>
                <option value="+64">NZ New Zealand (+64)</option>
                <option value="+505">NI Nicaragua (+505)</option>
                <option value="+227">NE Niger (+227)</option>
                <option value="+234">NG Nigeria (+234)</option>
                <option value="+683">NU Niue (+683)</option>
                <option value="+850">KP North Korea (+850)</option>
                <option value="+1670">MP Northern Mariana Islands (+1670)</option>
                <option value="+47">NO Norway (+47)</option>
                <option value="+968">OM Oman (+968)</option>
                <option value="+92">PK Pakistan (+92)</option>
                <option value="+680">PW Palau (+680)</option>
                <option value="+970">PS Palestine (+970)</option>
                <option value="+507">PA Panama (+507)</option>
                <option value="+675">PG Papua New Guinea (+675)</option>
                <option value="+595">PY Paraguay (+595)</option>
                <option value="+51">PE Peru (+51)</option>
                <option value="+63">PH Philippines (+63)</option>
                <option value="+48">PL Poland (+48)</option>
                <option value="+351">PT Portugal (+351)</option>
                <option value="+1787">PR Puerto Rico (+1787)</option>
                <option value="+974">QA Qatar (+974)</option>
                <option value="+262">RE Reunion (+262)</option>
                <option value="+40">RO Romania (+40)</option>
                <option value="+7">RU Russia (+7)</option>
                <option value="+250">RW Rwanda (+250)</option>
                <option value="+1869">KN Saint Kitts & Nevis (+1869)</option>
                <option value="+1758">LC Saint Lucia (+1758)</option>
                <option value="+508">PM Saint Pierre & Miquelon (+508)</option>
                <option value="+1784">VC Saint Vincent & Grenadines (+1784)</option>
                <option value="+685">WS Samoa (+685)</option>
                <option value="+378">SM San Marino (+378)</option>
                <option value="+239">ST Sao Tome & Principe (+239)</option>
                <option value="+966">SA Saudi Arabia (+966)</option>
                <option value="+221">SN Senegal (+221)</option>
                <option value="+381">RS Serbia (+381)</option>
                <option value="+248">SC Seychelles (+248)</option>
                <option value="+232">SL Sierra Leone (+232)</option>
                <option value="+65">SG Singapore (+65)</option>
                <option value="+1721">SX Sint Maarten (+1721)</option>
                <option value="+421">SK Slovakia (+421)</option>
                <option value="+386">SI Slovenia (+386)</option>
                <option value="+677">SB Solomon Islands (+677)</option>
                <option value="+252">SO Somalia (+252)</option>
                <option value="+27">ZA South Africa (+27)</option>
                <option value="+82">KR South Korea (+82)</option>
                <option value="+211">SS South Sudan (+211)</option>
                <option value="+34">ES Spain (+34)</option>
                <option value="+94">LK Sri Lanka (+94)</option>
                <option value="+249">SD Sudan (+249)</option>
                <option value="+597">SR Suriname (+597)</option>
                <option value="+268">SZ Swaziland (+268)</option>
                <option value="+46">SE Sweden (+46)</option>
                <option value="+41">CH Switzerland (+41)</option>
                <option value="+963">SY Syria (+963)</option>
                <option value="+886">TW Taiwan (+886)</option>
                <option value="+992">TJ Tajikistan (+992)</option>
                <option value="+255">TZ Tanzania (+255)</option>
                <option value="+66">TH Thailand (+66)</option>
                <option value="+228">TG Togo (+228)</option>
                <option value="+676">TO Tonga (+676)</option>
                <option value="+1868">TT Trinidad & Tobago (+1868)</option>
                <option value="+216">TN Tunisia (+216)</option>
                <option value="+90">TR Turkey (+90)</option>
                <option value="+993">TM Turkmenistan (+993)</option>
                <option value="+1649">TC Turks & Caicos (+1649)</option>
                <option value="+688">TV Tuvalu (+688)</option>
                <option value="+1340">VI US Virgin Islands (+1340)</option>
                <option value="+256">UG Uganda (+256)</option>
                <option value="+380">UA Ukraine (+380)</option>
                <option value="+971">AE United Arab Emirates (+971)</option>
                <option value="+44">GB United Kingdom (+44)</option>
                <option value="+1">US United States (+1)</option>
                <option value="+598">UY Uruguay (+598)</option>
                <option value="+998">UZ Uzbekistan (+998)</option>
                <option value="+678">VU Vanuatu (+678)</option>
                <option value="+58">VE Venezuela (+58)</option>
                <option value="+84">VN Vietnam (+84)</option>
                <option value="+967">YE Yemen (+967)</option>
                <option value="+260">ZM Zambia (+260)</option>
                <option value="+263">ZW Zimbabwe (+263)</option>
              </select>
              <div style={{ position: 'relative', flex: 1 }}>
                <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--mutedForeground)' }} />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPhone(digits);
                  }}
                  placeholder="10-digit number"
                  maxLength={10}
                  required
                  style={{
                    width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem',
                    border: '1px solid var(--borderLight)', borderRadius: '8px',
                    fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--foreground)',
                    background: '#fff', outline: 'none', boxSizing: 'border-box',
                    letterSpacing: '1px',
                    borderColor: phone.length > 0 && phone.length < 10 ? '#FCA5A5' : 'var(--borderLight)'
                  }}
                />
              </div>
            </div>
            {phone.length > 0 && phone.length < 10 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--emergency)', marginTop: '0.4rem', fontFamily: 'var(--font-body)' }}>
                {10 - phone.length} more digit{10 - phone.length !== 1 ? 's' : ''} needed
              </p>
            )}
            {phone.length === 10 && (
              <p style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '0.4rem', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={12} strokeWidth={3} /> Valid mobile number
              </p>
            )}
          </div>
          <InputField label="EMAIL ADDRESS (OPTIONAL)" icon={Mail} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" />
          
          <InputField label="PASSWORD" icon={Lock} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a password" required />
          {password.length > 0 && (
            <div style={{ background: '#F8FAF9', border: '1px solid var(--borderLight)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                <RequirementItem satisfied={passwordStrength.length} text="Min 8 characters" />
                <RequirementItem satisfied={passwordStrength.upper} text="1 uppercase letter" />
                <RequirementItem satisfied={passwordStrength.lower} text="1 lowercase letter" />
                <RequirementItem satisfied={passwordStrength.number} text="1 number" />
                <RequirementItem satisfied={passwordStrength.special} text="1 special symbol" />
              </div>
              <div style={{ height: '6px', background: 'var(--borderLight)', borderRadius: '4px', overflow: 'hidden', display: 'flex', gap: '2px' }}>
                {[1,2,3,4,5].map(v => (
                  <div key={v} style={{ flex: 1, background: passwordStrength.score >= v ? getStrengthColor(passwordStrength.score) : 'transparent', transition: 'background 0.3s' }} />
                ))}
              </div>
            </div>
          )}
          <InputField label="CONFIRM PASSWORD" icon={Lock} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm your password" required />
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <InputField label="DATE OF BIRTH" type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} required isHidden={!!existingData?.dateOfBirth} />
          
          {!existingData?.gender && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600 }}>GENDER *</label>
              <select value={gender} onChange={e => setGender(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--borderLight)', outline: 'none' }} required>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Not Specified">Prefer not to say</option>
              </select>
            </div>
          )}

          {!existingData?.bloodGroup && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600 }}>BLOOD GROUP *</label>
              <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--borderLight)', outline: 'none' }} required>
                <option value="">Select</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
          )}
          
          <InputField label="PREFERRED LANGUAGE" value={preferredLanguage} onChange={e => setPreferredLanguage(e.target.value)} placeholder="e.g. Hindi, English" isHidden={!!existingData?.preferredLanguage} />
          
          {!!existingData && !!existingData.dateOfBirth && !!existingData.gender && !!existingData.bloodGroup && (
            <div style={{ gridColumn: 'span 2', padding: '1rem', background: '#F8FAF9', borderRadius: '8px', color: 'var(--mutedForeground)', fontSize: '0.875rem' }}>
              All required personal information is already on file. You may proceed.
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <InputField label="STATE" value={state} onChange={e => setState(e.target.value)} placeholder="e.g. Gujarat" required isHidden={!!existingData?.address?.state} />
          <InputField label="DISTRICT" value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. Ahmedabad" required isHidden={!!existingData?.address?.district} />
          <InputField label="VILLAGE / TOWN" value={villageTown} onChange={e => setVillageTown(e.target.value)} placeholder="e.g. Sanand" required isHidden={!!existingData?.address?.villageTown} />
          <InputField label="PIN CODE" value={pinCode} onChange={e => setPinCode(e.target.value)} placeholder="e.g. 382110" required isHidden={!!existingData?.address?.pinCode} />

          {!!existingData?.address?.state && !!existingData?.address?.district && !!existingData?.address?.villageTown && !!existingData?.address?.pinCode && (
            <div style={{ gridColumn: 'span 2', padding: '1rem', background: '#F8FAF9', borderRadius: '8px', color: 'var(--mutedForeground)', fontSize: '0.875rem' }}>
              Address information is already on file. You may proceed.
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div>
          <InputField label="EMERGENCY CONTACT NAME" icon={User} value={emergencyContactName} onChange={e => setEmergencyContactName(e.target.value)} placeholder="Name of contact person" required isHidden={!!existingData?.emergencyContactName} />
          <InputField label="RELATIONSHIP" value={emergencyContactRelation} onChange={e => setEmergencyContactRelation(e.target.value)} placeholder="e.g. Father, Spouse" required isHidden={!!existingData?.emergencyContactRelation} />
          <InputField label="CONTACT MOBILE" icon={Phone} value={emergencyContactMobile} onChange={e => setEmergencyContactMobile(e.target.value)} placeholder="10-digit mobile number" required isHidden={!!existingData?.emergencyContactMobile} />

          {!!existingData?.emergencyContactName && !!existingData?.emergencyContactRelation && !!existingData?.emergencyContactMobile && (
            <div style={{ padding: '1rem', background: '#F8FAF9', borderRadius: '8px', color: 'var(--mutedForeground)', fontSize: '0.875rem' }}>
              Emergency contact is already on file. You may proceed.
            </div>
          )}
        </div>
      )}

      {step === 5 && (
        <div>
          <InputField label="KNOWN ALLERGIES (Comma separated)" value={knownAllergies} onChange={e => setKnownAllergies(e.target.value)} placeholder="e.g. Penicillin, Peanuts (or None)" isHidden={!!existingData?.knownAllergies?.length} />
          <InputField label="CHRONIC CONDITIONS" value={chronicConditions} onChange={e => setChronicConditions(e.target.value)} placeholder="e.g. Diabetes, Hypertension (or None)" isHidden={!!existingData?.chronicConditions?.length} />
          <InputField label="CURRENT MEDICATIONS" value={currentMedications} onChange={e => setCurrentMedications(e.target.value)} placeholder="e.g. Metformin (or None)" isHidden={!!existingData?.currentMedications?.length} />
          <InputField label="PREVIOUS SURGERIES" value={previousSurgeries} onChange={e => setPreviousSurgeries(e.target.value)} placeholder="e.g. Appendectomy 2019 (or None)" isHidden={!!existingData?.previousSurgeries?.length} />
          <InputField label="DISABILITY / ACCESSIBILITY REQ" value={disabilityRequirements} onChange={e => setDisabilityRequirements(e.target.value)} placeholder="e.g. Wheelchair user (or None)" isHidden={!!existingData?.disabilityRequirements} />
        </div>
      )}

      {step === 6 && (
        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
          <div style={{ background: '#F8FAF9', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <h4 style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>ACCOUNT</h4>
            <p><strong>Name:</strong> {name}<br/><strong>Phone:</strong> {phone}<br/><strong>Email:</strong> {email || 'N/A'}</p>
          </div>
          <div style={{ background: '#F8FAF9', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <h4 style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>PERSONAL & ADDRESS</h4>
            <p><strong>DOB:</strong> {dateOfBirth} | <strong>Gender:</strong> {gender} | <strong>Blood Group:</strong> {bloodGroup}</p>
            <p><strong>Address:</strong> {villageTown}, {district}, {state} - {pinCode}</p>
          </div>
          
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', marginTop: '1.5rem', padding: '1rem', border: '1px solid var(--borderLight)', borderRadius: '8px' }}>
            <input type="checkbox" checked={consentAccepted} onChange={e => setConsentAccepted(e.target.checked)} style={{ marginTop: '0.25rem' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--mutedForeground)' }}>
              I consent to the collection and processing of my personal and health data for the purpose of receiving healthcare services in accordance with the Privacy Policy.
            </span>
          </label>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        {step > 1 && (
          <button type="button" onClick={handleBack} style={{ flex: 1, padding: '0.875rem', background: 'transparent', border: '1px solid var(--borderLight)', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            <ChevronLeft size={18} /> Back
          </button>
        )}
        
        {step < 6 ? (
          <button type="button" onClick={handleNext} style={{ flex: 2, padding: '0.875rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            Next Step <ChevronRight size={18} />
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={loading} style={{ flex: 2, padding: '0.875rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            {loading ? 'Submitting...' : 'Complete Registration'} <Save size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
