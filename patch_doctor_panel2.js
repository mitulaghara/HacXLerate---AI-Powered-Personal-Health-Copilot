const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'finalsih', 'SIH-2026', 'frontend', 'src', 'views', 'DoctorPanel.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add X icon if missing
if (!content.includes(' X ') && !content.includes(', X')) {
  content = content.replace(/import \{([^}]+)\} from 'lucide-react';/, "import {$1, X} from 'lucide-react';");
}

// 2. Add photo states
const statesIndex = content.indexOf("const [loading, setLoading] = useState(false);");
if (statesIndex !== -1 && !content.includes("const [photoPending, setPhotoPending] = useState(null);")) {
  const newStates = `const [loading, setLoading] = useState(false);
  const [photoPending, setPhotoPending] = useState(null);
  const [savingPhoto, setSavingPhoto] = useState(false);`;
  content = content.replace("const [loading, setLoading] = useState(false);", newStates);
}

// 3. Add Photo Header Handlers
const handlersIndex = content.indexOf("// Fetch Doctor Profile on mount");
if (handlersIndex !== -1 && !content.includes("const handlePhotoSelectHeader")) {
  const newHandlers = `
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

  `;
  content = content.slice(0, handlersIndex) + newHandlers + content.slice(handlersIndex);
}

// 4. Update the Avatar rendering block
const oldAvatarStart = content.indexOf("<div style={{ position: 'relative' }}>");
// we need to find the closing tag of this div. It ends at `</CheckCircle2></div></div>` roughly, but since there's spacing we can just regex or substring carefully.
const checkCirclePart = '<CheckCircle2 size={14} color="#fff" />';
const checkCircleEnd = content.indexOf(checkCirclePart, oldAvatarStart);
const oldAvatarEnd = content.indexOf('</div>\n          </div>', checkCircleEnd) + '</div>\n          </div>'.length;

if (oldAvatarStart !== -1 && checkCircleEnd !== -1) {
  const currentImageToDisplay = "photoPending && photoPending !== 'REMOVED' ? photoPending : (photoPending === 'REMOVED' ? '' : profilePhoto)";
  const newAvatarJSX = `
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative', width: '96px', height: '96px' }}>
              {(${currentImageToDisplay}) ? (
                <img src={${currentImageToDisplay}} alt={doctorName || 'Doctor'} style={{
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
                  {savingPhoto ? <div className="heartbeat-loader" style={{ width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div> : <Save size={14} />}
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
`;
  content = content.slice(0, oldAvatarStart) + newAvatarJSX + content.slice(oldAvatarEnd);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched DoctorPanel.jsx for photo upload');
