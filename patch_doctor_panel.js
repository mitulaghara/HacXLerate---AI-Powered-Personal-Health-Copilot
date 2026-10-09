const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'finalsih', 'SIH-2026', 'frontend', 'src', 'views', 'DoctorPanel.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Icons to the import if they aren't there
const lucideImportMatch = content.match(/import \{([^}]+)\} from 'lucide-react';/);
if (lucideImportMatch) {
  let icons = lucideImportMatch[1];
  const missingIcons = ['Activity', 'ClipboardList', 'Users', 'Stethoscope', 'ArrowRight', 'MessageSquare', 'Calendar', 'UserCheck', 'HeartPulse', 'CheckSquare', 'FileCheck', 'TrendingUp', 'Clock'];
  
  missingIcons.forEach(icon => {
    if (!icons.includes(icon)) {
      icons += `, ${icon}`;
    }
  });
  
  content = content.replace(/import \{[^}]+\} from 'lucide-react';/, `import {${icons}} from 'lucide-react';`);
}

// 2. Insert Dashboard Stats State and Load Function
const stateInsertIdx = content.indexOf("  // Fetch Doctor Profile on mount & live reminder count poll");
if (stateInsertIdx !== -1) {
  const statsCode = `
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
      const [patientsRes, remindersRes, referralsRes] = await Promise.all([
        api.getPatients().catch(() => ({ data: [] })),
        api.getDoctorReminders().catch(() => ({ reminders: [] })),
        api.getReferrals().catch(() => ({ data: [] }))
      ]);

      const patients = patientsRes.data || patientsRes.patients || [];
      const reminders = remindersRes.reminders || [];
      const referrals = referralsRes.data || referralsRes.referrals || [];

      const todayStr = new Date().toISOString().split('T')[0];
      
      const todaysPatients = patients.filter(p => p.registrationDate && p.registrationDate.startsWith(todayStr)).length;
      const pendingFollowUps = reminders.filter(r => r.status === 'PENDING').length;
      const pendingReferrals = referrals.filter(r => r.status === 'PENDING').length;
      
      setDashboardStats({
        todaysPatients: todaysPatients || patients.length,
        pendingConsultations: patients.length,
        completedConsultations: 0,
        pendingFollowUps,
        pendingReferrals,
        notifications: 0
      });
    } catch (e) {
      console.warn("Could not load dashboard stats:", e);
    } finally {
      setStatsLoading(false);
    }
  };

`;
  content = content.slice(0, stateInsertIdx) + statsCode + content.slice(stateInsertIdx);
}

// 3. Call loadDashboardStats in useEffect
content = content.replace(
  /loadDoctorProfile\(\);\n\s*refreshReminderCount\(\);/g,
  "loadDoctorProfile();\n    refreshReminderCount();\n    loadDashboardStats();"
);

// 4. Replace the old header with the new one
const oldHeaderStart = content.indexOf("{/* Top Banner & Doctor Credentials Header */}");
const oldHeaderEnd = content.indexOf("{/* Global Success / Error notifications */}");

if (oldHeaderStart !== -1 && oldHeaderEnd !== -1) {
  const newHeader = "{/* Professional Doctor Dashboard Header */}\n" +
"      <div style={{\n" +
"        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',\n" +
"        borderRadius: '16px',\n" +
"        padding: '32px',\n" +
"        display: 'flex',\n" +
"        flexWrap: 'wrap',\n" +
"        alignItems: 'center',\n" +
"        justifyContent: 'space-between',\n" +
"        gap: '24px',\n" +
"        marginBottom: '24px',\n" +
"        position: 'relative',\n" +
"        overflow: 'hidden',\n" +
"        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'\n" +
"      }}>\n" +
"        {/* Subtle decorative background */}\n" +
"        <div style={{\n" +
"          position: 'absolute',\n" +
"          top: 0,\n" +
"          right: 0,\n" +
"          bottom: 0,\n" +
"          left: 0,\n" +
"          background: 'url(\"data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%230d9488\\' fill-opacity=\\'0.05\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")',\n" +
"          pointerEvents: 'none'\n" +
"        }} />\n" +
"\n" +
"        <div style={{\n" +
"          display: 'flex',\n" +
"          alignItems: 'center',\n" +
"          gap: '24px',\n" +
"          flex: 1,\n" +
"          minWidth: '280px',\n" +
"          zIndex: 1\n" +
"        }}>\n" +
"          <div style={{ position: 'relative' }}>\n" +
"            {profilePhoto ? (\n" +
"              <img src={profilePhoto} alt={doctorName || 'Doctor'} style={{\n" +
"                width: '96px',\n" +
"                height: '96px',\n" +
"                borderRadius: '50%',\n" +
"                objectFit: 'cover',\n" +
"                border: \"4px solid #fff\",\n" +
"                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',\n" +
"                backgroundColor: '#fff'\n" +
"              }} />\n" +
"            ) : (\n" +
"              <div style={{\n" +
"                width: '96px',\n" +
"                height: '96px',\n" +
"                borderRadius: '50%',\n" +
"                background: '#f0fdf4',\n" +
"                border: \"4px solid #fff\",\n" +
"                display: 'flex',\n" +
"                alignItems: 'center',\n" +
"                justifyContent: 'center',\n" +
"                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'\n" +
"              }}>\n" +
"                <Stethoscope size={44} color=\"#0d9488\" />\n" +
"              </div>\n" +
"            )}\n" +
"            <div style={{\n" +
"              position: 'absolute',\n" +
"              bottom: '4px',\n" +
"              right: '4px',\n" +
"              background: '#10b981',\n" +
"              width: '24px',\n" +
"              height: '24px',\n" +
"              borderRadius: '50%',\n" +
"              display: 'flex',\n" +
"              alignItems: 'center',\n" +
"              justifyContent: 'center',\n" +
"              border: '2px solid #fff',\n" +
"              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'\n" +
"            }}>\n" +
"              <CheckCircle2 size={14} color=\"#fff\" />\n" +
"            </div>\n" +
"          </div>\n" +
"\n" +
"          <div style={{ color: '#fff' }}>\n" +
"            <div style={{\n" +
"              display: 'flex',\n" +
"              alignItems: 'center',\n" +
"              gap: '12px',\n" +
"              flexWrap: 'wrap',\n" +
"              marginBottom: '6px'\n" +
"            }}>\n" +
"              <h1 style={{\n" +
"                fontSize: '1.75rem',\n" +
"                fontWeight: 700,\n" +
"                margin: 0,\n" +
"                letterSpacing: '-0.01em',\n" +
"                color: '#fff'\n" +
"              }}>\n" +
"                {doctorName || currentUser?.name || 'Doctor Panel'}\n" +
"              </h1>\n" +
"              <span style={{\n" +
"                background: 'rgba(16, 185, 129, 0.15)',\n" +
"                color: '#34d399',\n" +
"                padding: '4px 12px',\n" +
"                borderRadius: '20px',\n" +
"                fontSize: '0.75rem',\n" +
"                fontWeight: 600,\n" +
"                display: 'flex',\n" +
"                alignItems: 'center',\n" +
"                gap: '6px',\n" +
"                border: '1px solid rgba(16, 185, 129, 0.3)'\n" +
"              }}>\n" +
"                <Shield size={14} /> Verified Medical Officer\n" +
"              </span>\n" +
"            </div>\n" +
"\n" +
"            <div style={{\n" +
"              fontSize: '1rem',\n" +
"              color: '#94a3b8',\n" +
"              fontWeight: 500,\n" +
"              marginBottom: '12px'\n" +
"            }}>\n" +
"              {specialization ? <>{specialization} {qualification ? `• ${qualification}` : ''}</> : <span>General Practitioner</span>}\n" +
"            </div>\n" +
"\n" +
"            <div style={{\n" +
"              display: 'flex',\n" +
"              gap: '20px',\n" +
"              fontSize: '0.85rem',\n" +
"              color: '#cbd5e1',\n" +
"              flexWrap: 'wrap'\n" +
"            }}>\n" +
"              {registrationNumber && (\n" +
"                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>\n" +
"                  <Award size={16} color=\"#0d9488\" /> Reg: <strong>{registrationNumber}</strong>\n" +
"                </span>\n" +
"              )}\n" +
"              {phone && (\n" +
"                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>\n" +
"                  <Phone size={16} color=\"#0d9488\" /> {phone}\n" +
"                </span>\n" +
"              )}\n" +
"              {clinicName && (\n" +
"                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>\n" +
"                  <Building2 size={16} color=\"#0d9488\" /> {clinicName}\n" +
"                </span>\n" +
"              )}\n" +
"            </div>\n" +
"          </div>\n" +
"        </div>\n" +
"\n" +
"        {/* Quick Actions Row */}\n" +
"        <div style={{\n" +
"          display: 'flex',\n" +
"          flexDirection: 'column',\n" +
"          alignItems: 'flex-end',\n" +
"          gap: '12px',\n" +
"          zIndex: 1\n" +
"        }}>\n" +
"          <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500, marginBottom: '4px' }}>Quick Actions</div>\n" +
"          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>\n" +
"            <button onClick={() => setActiveSubTab('phoneFetch')} style={{\n" +
"              background: 'rgba(255,255,255,0.1)',\n" +
"              color: '#fff',\n" +
"              border: '1px solid rgba(255,255,255,0.2)',\n" +
"              padding: '8px 16px',\n" +
"              borderRadius: '8px',\n" +
"              fontSize: '0.85rem',\n" +
"              fontWeight: 600,\n" +
"              cursor: 'pointer',\n" +
"              display: 'flex',\n" +
"              alignItems: 'center',\n" +
"              gap: '6px',\n" +
"              transition: 'all 0.2s'\n" +
"            }}\n" +
"            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}\n" +
"            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}\n" +
"            >\n" +
"              <Search size={16} /> Find Patient\n" +
"            </button>\n" +
"            <button onClick={() => { setActiveSubTab('history'); setHistoryInitialTab('history'); }} style={{\n" +
"              background: '#0d9488',\n" +
"              color: '#fff',\n" +
"              border: 'none',\n" +
"              padding: '8px 16px',\n" +
"              borderRadius: '8px',\n" +
"              fontSize: '0.85rem',\n" +
"              fontWeight: 600,\n" +
"              cursor: 'pointer',\n" +
"              display: 'flex',\n" +
"              alignItems: 'center',\n" +
"              gap: '6px',\n" +
"              transition: 'all 0.2s',\n" +
"              boxShadow: '0 4px 6px rgba(13, 148, 136, 0.2)'\n" +
"            }}\n" +
"            onMouseOver={(e) => e.currentTarget.style.background = '#0f766e'}\n" +
"            onMouseOut={(e) => e.currentTarget.style.background = '#0d9488'}\n" +
"            >\n" +
"              <Stethoscope size={16} /> Start Consultation\n" +
"            </button>\n" +
"            <button onClick={() => setActiveSubTab('prescriptions')} style={{\n" +
"              background: 'rgba(255,255,255,0.1)',\n" +
"              color: '#fff',\n" +
"              border: '1px solid rgba(255,255,255,0.2)',\n" +
"              padding: '8px 16px',\n" +
"              borderRadius: '8px',\n" +
"              fontSize: '0.85rem',\n" +
"              fontWeight: 600,\n" +
"              cursor: 'pointer',\n" +
"              display: 'flex',\n" +
"              alignItems: 'center',\n" +
"              gap: '6px',\n" +
"              transition: 'all 0.2s'\n" +
"            }}\n" +
"            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}\n" +
"            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}\n" +
"            >\n" +
"              <FileCheck size={16} /> Prescribe\n" +
"            </button>\n" +
"          </div>\n" +
"        </div>\n" +
"      </div>\n" +
"\n" +
"      {/* Today's Overview Metrics */}\n" +
"      <div style={{ marginBottom: '32px' }}>\n" +
"        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>\n" +
"          <Activity size={20} color=\"#0d9488\" /> Today's Overview\n" +
"        </h2>\n" +
"        \n" +
"        {statsLoading ? (\n" +
"          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px' }}>\n" +
"            <div className=\"heartbeat-loader\" style={{ width: '40px', height: '40px', border: '3px solid #0d9488', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>\n" +
"          </div>\n" +
"        ) : (\n" +
"          <div style={{ \n" +
"            display: 'grid', \n" +
"            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', \n" +
"            gap: '16px' \n" +
"          }}>\n" +
"            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>\n" +
"              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>\n" +
"                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Today's Patients</span>\n" +
"                <div style={{ background: '#f0fdf4', padding: '6px', borderRadius: '8px' }}><Users size={18} color=\"#10b981\" /></div>\n" +
"              </div>\n" +
"              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>{dashboardStats.todaysPatients}</div>\n" +
"            </div>\n" +
"\n" +
"            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>\n" +
"              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>\n" +
"                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Pending Consults</span>\n" +
"                <div style={{ background: '#fff7ed', padding: '6px', borderRadius: '8px' }}><Clock size={18} color=\"#f97316\" /></div>\n" +
"              </div>\n" +
"              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>{dashboardStats.pendingConsultations}</div>\n" +
"            </div>\n" +
"\n" +
"            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>\n" +
"              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>\n" +
"                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Completed</span>\n" +
"                <div style={{ background: '#eff6ff', padding: '6px', borderRadius: '8px' }}><CheckSquare size={18} color=\"#3b82f6\" /></div>\n" +
"              </div>\n" +
"              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>{dashboardStats.completedConsultations}</div>\n" +
"            </div>\n" +
"\n" +
"            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>\n" +
"              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>\n" +
"                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Follow-Ups</span>\n" +
"                <div style={{ background: '#f5f3ff', padding: '6px', borderRadius: '8px' }}><HeartPulse size={18} color=\"#8b5cf6\" /></div>\n" +
"              </div>\n" +
"              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>{dashboardStats.pendingFollowUps}</div>\n" +
"            </div>\n" +
"\n" +
"            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>\n" +
"              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>\n" +
"                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Referrals</span>\n" +
"                <div style={{ background: '#ecfeff', padding: '6px', borderRadius: '8px' }}><TrendingUp size={18} color=\"#06b6d4\" /></div>\n" +
"              </div>\n" +
"              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>{dashboardStats.pendingReferrals}</div>\n" +
"            </div>\n" +
"            \n" +
"            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>\n" +
"              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>\n" +
"                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Notifications</span>\n" +
"                <div style={{ background: '#fef2f2', padding: '6px', borderRadius: '8px' }}><Bell size={18} color=\"#ef4444\" /></div>\n" +
"              </div>\n" +
"              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a' }}>{dashboardStats.notifications}</div>\n" +
"            </div>\n" +
"          </div>\n" +
"        )}\n" +
"      </div>\n" +
"\n" +
"      ";
  content = content.slice(0, oldHeaderStart) + newHeader + content.slice(oldHeaderEnd);
}

// 5. Replace "PROFESSIONAL PILL NAV BAR" black border/background
const navBarStart = content.indexOf("{/* ═══════════════════ PROFESSIONAL PILL NAV BAR ═══════════════════ */}");
if (navBarStart !== -1) {
  const oldNavBarStyle = "      <div style={{\n" +
"      background: \"#000000\",\n" +
"      padding: '8px',\n" +
"      marginBottom: '28px',\n" +
"      border: \"1.5px solid #000\",\n" +
"      display: 'flex',\n" +
"      alignItems: 'center',\n" +
"      gap: '4px',\n" +
"      overflowX: 'auto',\n" +
"      flexWrap: 'nowrap'\n" +
"    }}>";
  const newNavBarStyle = "      <div style={{\n" +
"      background: \"#f8fafc\",\n" +
"      padding: '8px',\n" +
"      marginBottom: '28px',\n" +
"      border: \"1px solid #e2e8f0\",\n" +
"      borderRadius: '12px',\n" +
"      display: 'flex',\n" +
"      alignItems: 'center',\n" +
"      gap: '8px',\n" +
"      overflowX: 'auto',\n" +
"      flexWrap: 'nowrap',\n" +
"      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'\n" +
"    }}>";
  content = content.replace(oldNavBarStyle, newNavBarStyle);
}

// 6. Fix nav bar items (remove unneeded opacity, change active style to look more modern)
// Search for: border: 'none',
const activeTabReplaceRegex = /border: 'none',\s*fontWeight: isActive \? 700 : 600,\s*fontSize: '0\.83rem',\s*cursor: 'pointer',\s*whiteSpace: 'nowrap',\s*transform: isActive \? 'translateY\(-1px\)' : 'translateY\(0\)',/g;
content = content.replace(activeTabReplaceRegex, "border: 'none',\n" +
"          borderRadius: '8px',\n" +
"          background: isActive ? '#fff' : 'transparent',\n" +
"          color: isActive ? '#0f172a' : '#64748b',\n" +
"          boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',\n" +
"          fontWeight: isActive ? 600 : 500,\n" +
"          fontSize: '0.85rem',\n" +
"          cursor: 'pointer',\n" +
"          whiteSpace: 'nowrap',\n" +
"          transform: isActive ? 'translateY(-1px)' : 'translateY(0)',\n" +
"          transition: 'all 0.2s ease',");


fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched DoctorPanel.jsx');
