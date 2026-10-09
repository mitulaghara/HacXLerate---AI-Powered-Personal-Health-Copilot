const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'finalsih', 'SIH-2026', 'frontend', 'src', 'views', 'DoctorPanel.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Ensure all needed icons are imported
const requiredIcons = ['Activity', 'Users', 'Stethoscope', 'FileText', 'ClipboardList', 'HeartPulse', 'Share2', 'AlertTriangle', 'Calendar', 'Bell', 'UserCheck'];
const lucideImportMatch = content.match(/import \{([^}]+)\} from 'lucide-react';/);
if (lucideImportMatch) {
  let icons = lucideImportMatch[1];
  requiredIcons.forEach(icon => {
    if (!icons.includes(icon)) {
      icons += `, ${icon}`;
    }
  });
  content = content.replace(/import \{[^}]+\} from 'lucide-react';/, `import {${icons}} from 'lucide-react';`);
}

const oldTabsRegex = /\{\[\{\s*id:\s*'history',[\s\S]*?(?=\]\.map\(tab =>)/;

const newTabs = `{[
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
      ]`;

content = content.replace(oldTabsRegex, newTabs);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated PILL NAV BAR in DoctorPanel.jsx');
