const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'finalsih', 'SIH-2026', 'frontend', 'src', 'views', 'DoctorPanel.jsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes("import PatientLookupView")) {
  content = content.replace(
    /import React, \{ useState, useEffect, useRef \} from 'react';/,
    "import React, { useState, useEffect, useRef } from 'react';\nimport PatientLookupView from '../components/doctor/PatientLookupView';"
  );
}

const oldTab4Regex = /\{\/\* =+ \*\/\}\s*\{\/\* TAB 4: MOBILE DATA FETCH.*?\{\/\* =+ \*\/\}\s*\{activeSubTab === 'phoneFetch' && <div>[\s\S]*?(?=\{\/\* =+ \*\/\}\s*\{\/\* TAB 5: LEAVE & SCHEDULE)/;

const newTab4 = `{/* ========================================================================= */}
        {/* TAB 4: PATIENT LOOKUP (Mobile, QR, SSC, ID)                               */}
        {/* ========================================================================= */}
        {activeSubTab === 'phoneFetch' && (
          <PatientLookupView 
            onPatientFound={(patientId) => {
              // Navigate to patient medical record
              navigate(\`/doctor/patients/\${patientId}\`);
            }}
          />
        )}
        
        `;

content = content.replace(oldTab4Regex, newTab4);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully replaced TAB 4 with PatientLookupView');
