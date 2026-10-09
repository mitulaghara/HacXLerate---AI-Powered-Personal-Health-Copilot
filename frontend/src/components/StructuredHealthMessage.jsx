import React from 'react';
import { 
  Building2, 
  Phone, 
  PhoneCall, 
  Bed, 
  UserCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Pill, 
  MapPin, 
  ShieldAlert, 
  Activity,
  HeartPulse,
  Flame,
  Info,
  Navigation
} from 'lucide-react';

/**
 * Formats inline markdown like **bold**, *italic*, and optionally auto-links telephone numbers.
 */
export const InlineFormattedText = ({ text, plainPhones = false }) => {
  if (!text) return null;

  // Split by bold (**bold**)
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return (
            <strong key={index} className="font-semibold text-slate-900">
              {plainPhones ? boldText : linkifyPhones(boldText)}
            </strong>
          );
        }
        return (
          <span key={index}>
            {plainPhones ? part : linkifyPhones(part)}
          </span>
        );
      })}
    </span>
  );
};

/**
 * Detects telephone numbers (+91..., 01392...) and wraps them in a clickable tel: link.
 */
function linkifyPhones(str) {
  if (typeof str !== 'string') return str;
  // Match Indian phone numbers or emergency hotlines
  const phoneRegex = /(\+91[-\s]?[0-9]{3,5}[-\s]?[0-9]{5,8}|0[0-9]{2,4}[-\s]?[0-9]{6,8})/g;
  const segments = str.split(phoneRegex);

  if (segments.length === 1) return str;

  return segments.map((seg, idx) => {
    if (seg.match(phoneRegex)) {
      return (
        <a
          key={idx}
          href={`tel:${seg.replace(/[^0-9+]/g, '')}`}
          className="inline-flex items-center gap-1 font-bold px-1.5 py-0.5 rounded text-xs mx-0.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300"
          title={`Call ${seg}`}
          onClick={(e) => e.stopPropagation()}
        >
          <PhoneCall size={11} className="text-emerald-700" />
          <span>{seg}</span>
        </a>
      );
    }
    return seg;
  });
}

/**
 * Structured Hospital / Facility Card View (Spacious, Clean, No-Truncate)
 */
const HospitalCard = ({ facility }) => {
  const {
    name,
    type,
    distance,
    beds,
    specialist,
    emergency,
    phone,
    rawLines = []
  } = facility;

  const cleanPhone = phone ? phone.replace(/[^0-9+]/g, '') : '+915912412001';

  return (
    <div className="my-3 rounded-2xl border border-teal-200/90 bg-white p-4 shadow-sm text-slate-800 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-slate-100">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 shadow-xs mt-0.5">
            <Building2 size={19} />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-900 leading-snug break-words">
              {name || 'Healthcare Facility'}
            </h4>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              {type || 'Multi-Speciality Facility'}
            </div>
          </div>
        </div>
        {emergency && (
          <span className="shrink-0 rounded-full bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
            <Flame size={11} className="text-red-600" />
            24×7 Emergency
          </span>
        )}
      </div>

      {/* Key Information Stack (Vertical, spacious, no clipping) */}
      <div className="my-3 space-y-2 rounded-xl bg-slate-50/80 p-3 border border-slate-100 text-xs">
        {distance && (
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium shrink-0">
              <MapPin size={13} className="text-teal-600" /> Exact Distance:
            </span>
            <span className="font-semibold text-slate-900 text-right">{distance}</span>
          </div>
        )}
        {beds && (
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium shrink-0">
              <Bed size={13} className="text-emerald-600" /> Available Beds:
            </span>
            <span className="font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded text-[11px] border border-emerald-300">
              {beds}
            </span>
          </div>
        )}
        {specialist && (
          <div className="flex items-start justify-between gap-2 pt-0.5">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium shrink-0">
              <UserCheck size={13} className="text-blue-600" /> On-Duty Doctor:
            </span>
            <span className="font-semibold text-slate-900 text-right pl-2 leading-tight">
              {specialist}
            </span>
          </div>
        )}
      </div>

      {/* Additional Facility Lines */}
      {rawLines.length > 0 && (
        <div className="mb-3 space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2">
          {rawLines.map((line, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <span className="text-teal-600 font-bold">•</span>
              <InlineFormattedText text={line} />
            </div>
          ))}
        </div>
      )}

      {/* Full-Width Action Buttons Box (Spacious, prominent, easy to tap) */}
      <div className="space-y-2 pt-1 border-t border-slate-100">
        <a
          href={`tel:${cleanPhone}`}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition-all text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <PhoneCall size={14} />
          <span>Call Hospital: {phone || '+91-591-2412001'}</span>
        </a>

        <a
          href="tel:108"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition-all text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Activity size={14} />
          <span>Call 108 (National Emergency Ambulance)</span>
        </a>
      </div>
    </div>
  );
};

/**
 * Emergency Action Steps Box View (Clean, legible, no pink inline words)
 */
const EmergencyStepsBox = ({ title, steps = [] }) => {
  return (
    <div className="my-3 rounded-2xl border border-red-200 bg-red-50/50 p-4 shadow-sm text-slate-800">
      <div className="flex items-center justify-between border-b border-red-200/70 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-white shadow-xs">
            <AlertTriangle size={15} />
          </div>
          <h4 className="text-xs font-bold text-red-950 uppercase tracking-wide">
            {title || 'Immediate Emergency Action Steps'}
          </h4>
        </div>
        <a
          href="tel:108"
          className="flex items-center gap-1 rounded-full bg-red-600 hover:bg-red-700 px-2.5 py-1 text-[11px] font-bold text-white transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <PhoneCall size={11} />
          <span>Call 108</span>
        </a>
      </div>

      <div className="space-y-2.5">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-start gap-3 text-xs leading-relaxed">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-white text-[11px] font-bold mt-0.5 shadow-xs">
              {idx + 1}
            </span>
            <div className="flex-1 text-slate-800 pt-0.5">
              <InlineFormattedText text={step} plainPhones={true} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Medicine & Prescription Dosage Card View
 */
const MedicineCard = ({ medData }) => {
  const { title, details = [], disclaimer } = medData;
  return (
    <div className="my-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm text-slate-800">
      <div className="flex items-center gap-2.5 border-b border-emerald-100 pb-2.5 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
          <Pill size={16} />
        </div>
        <h4 className="text-xs font-bold text-emerald-950">
          {title || 'Recommended Clinical Medication'}
        </h4>
      </div>

      <div className="space-y-2 text-xs">
        {details.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-slate-700">
              <InlineFormattedText text={item} />
            </div>
          </div>
        ))}
      </div>

      {disclaimer && (
        <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200/80 p-2.5 text-[11px] text-amber-900 flex items-start gap-2 leading-relaxed">
          <ShieldAlert size={14} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <InlineFormattedText text={disclaimer} />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Smart Markdown Table to Responsive Card Parser
 */
function parseMarkdownTableToCards(tableLines) {
  if (tableLines.length < 2) return null;

  const dataLines = tableLines.filter(line => !line.match(/^\|?\s*[-:]+[-|\s:]*\|?$/));
  if (dataLines.length < 2) return null;

  const headerParts = dataLines[0]
    .split('|')
    .map(s => s.trim())
    .filter(Boolean);

  const rows = dataLines.slice(1).map(line => {
    return line
      .split('|')
      .map(s => s.trim())
      .filter(Boolean);
  });

  return (
    <div className="my-3 space-y-3">
      {rows.map((row, rIdx) => {
        const rowStr = row.join(' ');
        if (rowStr.toLowerCase().includes('what to do') || rowStr.toLowerCase().includes('108')) {
          const stepMatches = rowStr.match(/\d+\.\s+[^.]+/g);
          if (stepMatches) {
            return (
              <EmergencyStepsBox
                key={rIdx}
                title="Immediate Action Steps"
                steps={stepMatches.map(s => s.replace(/^\d+\.\s*/, '').trim())}
              />
            );
          }
        }

        return (
          <div key={rIdx} className="rounded-2xl border border-teal-200 bg-white p-3.5 shadow-sm text-xs">
            {headerParts.map((h, cIdx) => {
              const val = row[cIdx];
              if (!val) return null;
              const isName = h.toLowerCase().includes('facility') || h.toLowerCase().includes('hospital');
              const isPhone = h.toLowerCase().includes('contact') || h.toLowerCase().includes('phone');
              
              if (isName) {
                return (
                  <div key={cIdx} className="font-bold text-sm text-slate-900 border-b border-teal-100 pb-1.5 mb-2 flex items-center gap-1.5">
                    <Building2 size={15} className="text-teal-600" />
                    <InlineFormattedText text={val} />
                  </div>
                );
              }

              if (isPhone) {
                return (
                  <div key={cIdx} className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Contact:</span>
                    <a
                      href={`tel:${val.replace(/[^0-9+]/g, '')}`}
                      className="inline-flex items-center gap-1.5 font-bold bg-teal-600 text-white px-2.5 py-1 rounded-lg text-xs hover:bg-teal-700"
                    >
                      <PhoneCall size={12} />
                      <span>{val}</span>
                    </a>
                  </div>
                );
              }

              return (
                <div key={cIdx} className="flex items-start justify-between py-1 text-slate-700">
                  <span className="font-medium text-slate-500">{h}:</span>
                  <span className="font-semibold text-right max-w-[65%]">
                    <InlineFormattedText text={val} />
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Main Structured Health Message Component
 */
export const StructuredHealthMessage = ({ text, isUser = false }) => {
  if (!text) return null;

  if (isUser) {
    return <span className="whitespace-pre-wrap leading-relaxed">{text}</span>;
  }

  const lines = text.split('\n');
  const elements = [];
  let currentBullets = [];
  let currentTable = [];
  let inHospitalBlock = null;
  let currentEmergencySteps = null;
  let currentMedicine = null;

  const flushBullets = (key) => {
    if (currentBullets.length > 0) {
      elements.push(
        <ul key={key} className="my-2 space-y-1.5 text-xs text-slate-700">
          {currentBullets.map((b, bIdx) => (
            <li key={bIdx} className="flex items-start gap-2">
              <span className="text-teal-600 font-bold leading-none mt-1 shrink-0">•</span>
              <div className="flex-1 leading-relaxed">
                <InlineFormattedText text={b} />
              </div>
            </li>
          ))}
        </ul>
      );
      currentBullets = [];
    }
  };

  const flushTable = (key) => {
    if (currentTable.length > 0) {
      const tableCards = parseMarkdownTableToCards(currentTable);
      if (tableCards) {
        elements.push(<React.Fragment key={key}>{tableCards}</React.Fragment>);
      }
      currentTable = [];
    }
  };

  const flushHospital = (key) => {
    if (inHospitalBlock) {
      elements.push(<HospitalCard key={key} facility={inHospitalBlock} />);
      inHospitalBlock = null;
    }
  };

  const flushEmergency = (key) => {
    if (currentEmergencySteps) {
      elements.push(
        <EmergencyStepsBox
          key={key}
          title={currentEmergencySteps.title}
          steps={currentEmergencySteps.steps}
        />
      );
      currentEmergencySteps = null;
    }
  };

  const flushMedicine = (key) => {
    if (currentMedicine) {
      elements.push(<MedicineCard key={key} medData={currentMedicine} />);
      currentMedicine = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line) continue;

    // 1. Detect Markdown Table Lines
    if (line.startsWith('|') && line.endsWith('|')) {
      flushBullets(`b-pre-tbl-${i}`);
      flushHospital(`h-pre-tbl-${i}`);
      flushEmergency(`e-pre-tbl-${i}`);
      flushMedicine(`m-pre-tbl-${i}`);
      currentTable.push(line);
      continue;
    } else if (currentTable.length > 0) {
      flushTable(`tbl-${i}`);
    }

    // 2. Detect Hospital Card Start (e.g. 🏥 **Hospital Name**)
    if (line.includes('🏥')) {
      flushBullets(`b-pre-h-${i}`);
      flushHospital(`h-pre-h-${i}`);
      flushEmergency(`e-pre-h-${i}`);
      flushMedicine(`m-pre-h-${i}`);

      const cleanName = line.replace(/^[🏥*\s]+/, '').replace(/[*]+/g, '').trim();
      const typeMatch = cleanName.match(/\(([^)]+)\)/);
      inHospitalBlock = {
        name: cleanName.replace(/\([^)]+\)/, '').trim(),
        type: typeMatch ? typeMatch[1] : null,
        distance: null,
        beds: null,
        specialist: null,
        emergency: line.toLowerCase().includes('emergency') || line.includes('24'),
        phone: null,
        rawLines: []
      };
      continue;
    }

    // 3. Detect Emergency Action Steps Start (🚨 Immediate Action Steps / What to do right now)
    if (
      line.includes('🚨') && 
      (line.toLowerCase().includes('step') || line.toLowerCase().includes('action') || line.toLowerCase().includes('what to do') || line.includes('तुरंत'))
    ) {
      flushBullets(`b-pre-e-${i}`);
      flushHospital(`h-pre-e-${i}`);
      flushEmergency(`e-pre-e-${i}`);
      flushMedicine(`m-pre-e-${i}`);

      currentEmergencySteps = {
        title: line.replace(/[🚨*#:]+/g, '').trim() || 'Immediate Action Steps',
        steps: []
      };
      continue;
    }

    // Inside Emergency Steps
    if (currentEmergencySteps) {
      if (line.match(/^\d+\./) || line.startsWith('•') || line.startsWith('-')) {
        currentEmergencySteps.steps.push(line.replace(/^(\d+\.\s*|[•\-*]\s*)/, ''));
        continue;
      } else {
        flushEmergency(`e-end-${i}`);
      }
    }

    // Inside Hospital Block: Extract Properties
    if (inHospitalBlock) {
      const lower = line.toLowerCase();
      if (lower.includes('distance') || lower.includes('location')) {
        inHospitalBlock.distance = line.replace(/^[^:]+:\s*/, '').replace(/[*]+/g, '').trim();
        continue;
      }
      if (lower.includes('bed') || lower.includes('available')) {
        inHospitalBlock.beds = line.replace(/^[^:]+:\s*/, '').replace(/[*]+/g, '').trim();
        continue;
      }
      if (lower.includes('specialist') || lower.includes('doctor') || lower.includes('cardiologist')) {
        inHospitalBlock.specialist = line.replace(/^[^:]+:\s*/, '').replace(/[*]+/g, '').trim();
        continue;
      }
      if (lower.includes('emergency') && (lower.includes('ready') || lower.includes('yes') || lower.includes('24'))) {
        inHospitalBlock.emergency = true;
        continue;
      }
      if (lower.includes('phone') || lower.includes('contact') || lower.includes('hotline')) {
        const phoneMatch = line.match(/(\+91[-\s]?[0-9]{3,5}[-\s]?[0-9]{5,8}|0[0-9]{2,4}[-\s]?[0-9]{6,8})/);
        if (phoneMatch) {
          inHospitalBlock.phone = phoneMatch[0];
        }
        continue;
      }
      if (line.startsWith('•') || line.startsWith('-')) {
        inHospitalBlock.rawLines.push(line.replace(/^[•\-*]\s*/, ''));
        continue;
      }
      flushHospital(`h-end-${i}`);
    }

    // 4. Detect Medicine Recommendation Start (💊)
    if (line.includes('💊') || line.toLowerCase().includes('recommended medication') || line.toLowerCase().includes('दवा')) {
      flushBullets(`b-pre-m-${i}`);
      flushHospital(`h-pre-m-${i}`);
      flushEmergency(`e-pre-m-${i}`);
      flushMedicine(`m-pre-m-${i}`);

      currentMedicine = {
        title: line.replace(/[💊*#:]+/g, '').trim() || 'Medication Guidance',
        details: [],
        disclaimer: null
      };
      continue;
    }

    if (currentMedicine) {
      if (line.toLowerCase().includes('disclaimer') || line.toLowerCase().includes('warning') || line.includes('⚠️')) {
        currentMedicine.disclaimer = line.replace(/^[⚠️*:\s]+/, '');
        flushMedicine(`m-end-${i}`);
        continue;
      }
      if (line.startsWith('•') || line.startsWith('-') || line.match(/^\d+\./)) {
        currentMedicine.details.push(line.replace(/^([•\-*]|\d+\.)\s*/, ''));
        continue;
      }
      flushMedicine(`m-end-line-${i}`);
    }

    // 5. Generic Bullets (•, -, *)
    if (line.startsWith('•') || line.startsWith('-') || line.startsWith('* ')) {
      currentBullets.push(line.replace(/^[•\-*]\s*/, ''));
      continue;
    } else {
      flushBullets(`b-end-${i}`);
    }

    // 6. Section Headers (### or ##)
    if (line.startsWith('#')) {
      const headerText = line.replace(/^#+\s*/, '');
      elements.push(
        <h4 key={`hdr-${i}`} className="text-xs font-bold text-teal-900 border-b border-teal-100 pb-1 mt-3 mb-2 flex items-center gap-1.5">
          <Activity size={13} className="text-teal-600" />
          <InlineFormattedText text={headerText} />
        </h4>
      );
      continue;
    }

    // 7. Clinical Disclaimer Banner (⚠️)
    if (line.includes('⚠️') || line.toLowerCase().includes('important disclaimer') || line.toLowerCase().includes('safety disclaimer') || line.toLowerCase().includes('clinical disclaimer')) {
      elements.push(
        <div key={`warn-${i}`} className="my-2.5 rounded-xl bg-amber-50/80 border border-amber-200/90 p-3 text-[11px] text-amber-900 flex items-start gap-2 leading-relaxed">
          <Info size={14} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <InlineFormattedText text={line.replace(/^[⚠️\s]+/, '')} />
          </div>
        </div>
      );
      continue;
    }

    // 8. Standard Paragraph
    elements.push(
      <p key={`p-${i}`} className="my-1.5 text-xs leading-relaxed text-slate-800">
        <InlineFormattedText text={line} />
      </p>
    );
  }

  // Final flushes
  flushTable('tbl-final');
  flushBullets('b-final');
  flushHospital('h-final');
  flushEmergency('e-final');
  flushMedicine('m-final');

  return (
    <div className="w-full space-y-1 text-slate-800 selection:bg-teal-100">
      {elements}
    </div>
  );
};

export default StructuredHealthMessage;
