import React, { useState } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Video, MapPin, User, CheckCircle, XCircle } from 'lucide-react';

export default function DoctorScheduleView({ doctorId }) {
  const [view, setView] = useState('today'); // today, week, month
  
  // Mocking schedule since there isn't a complex appointment backend yet
  const schedule = [
    { id: 1, type: 'appointment', patient: 'Rahul Sharma', time: '09:00 AM', duration: '30m', status: 'COMPLETED', typeLabel: 'In-person', location: 'Room 2' },
    { id: 2, type: 'followup', patient: 'Anil Patel', time: '10:00 AM', duration: '15m', status: 'PENDING', typeLabel: 'Teleconsult', location: 'Online' },
    { id: 3, type: 'appointment', patient: 'Sunita Devi', time: '11:30 AM', duration: '30m', status: 'PENDING', typeLabel: 'In-person', location: 'Room 2' },
    { id: 4, type: 'leave', title: 'Lunch Break', time: '01:00 PM', duration: '1h', status: 'UNAVAILABLE' },
    { id: 5, type: 'appointment', patient: 'Vikram Singh', time: '02:30 PM', duration: '45m', status: 'PENDING', typeLabel: 'In-person', location: 'Room 2' }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Calendar size={24} color="#0d9488" /> Clinical Schedule
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>Manage your appointments, follow-ups, and availability.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '4px' }}>
            {['today', 'week', 'month'].map(v => (
              <button 
                key={v}
                onClick={() => setView(v)}
                style={{ 
                  padding: '6px 16px', background: view === v ? '#fff' : 'transparent', 
                  border: 'none', borderRadius: '6px', fontWeight: view === v ? 700 : 500, 
                  color: view === v ? '#0f766e' : '#64748b', cursor: 'pointer',
                  boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  textTransform: 'capitalize'
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <button style={{ background: '#0d9488', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
            Apply Leave
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex' }}><ChevronLeft size={16} /></button>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>
              {view === 'today' ? 'Today, ' + new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'September 2026'}
            </h3>
            <button style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex' }}><ChevronRight size={16} /></button>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', fontWeight: 500 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0369a1' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7' }}></div> Appointments</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></div> Follow-ups</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#94a3b8' }}></div> Leave/Break</span>
          </div>
        </div>
        
        <div style={{ padding: '20px' }}>
          {view === 'today' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {schedule.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ width: '80px', textAlign: 'right', color: '#64748b', fontWeight: 600, fontSize: '0.9rem', paddingTop: '16px' }}>
                    {item.time}
                  </div>
                  <div style={{ 
                    flex: 1, background: item.type === 'leave' ? '#f8fafc' : item.type === 'followup' ? '#f0fdf4' : '#f0f9ff',
                    border: '1px solid', borderColor: item.type === 'leave' ? '#e2e8f0' : item.type === 'followup' ? '#86efac' : '#bae6fd',
                    borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    {item.type === 'leave' ? (
                      <div style={{ color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} /> {item.title} ({item.duration})
                      </div>
                    ) : (
                      <>
                        <div>
                          <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {item.patient} 
                            {item.status === 'COMPLETED' && <CheckCircle size={14} color="#10b981" />}
                          </h4>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#475569' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {item.duration}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {item.typeLabel === 'Teleconsult' ? <Video size={14} /> : <MapPin size={14} />} {item.typeLabel}
                            </span>
                          </div>
                        </div>
                        <button style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 16px', color: '#0f766e', fontWeight: 600, cursor: 'pointer' }}>
                          View Details
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <Calendar size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
              <h3 style={{ margin: 0, color: '#334155' }}>Calendar View</h3>
              <p>Weekly and Monthly grid views will be available once connected to a full calendar backend.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
