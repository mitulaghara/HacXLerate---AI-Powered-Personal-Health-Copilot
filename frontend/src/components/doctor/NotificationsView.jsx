import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, AlertTriangle, FileText, UserCheck, Share2 } from 'lucide-react';

export default function NotificationsView() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated fetching from backend since there isn't a dedicated notifications endpoint yet
    // In production, this would be: await api.getDoctorNotifications(doctorId)
    setTimeout(() => {
      setNotifications([
        { id: 1, type: 'emergency', title: 'Urgent Referral Received', message: 'Patient Rajesh Kumar (Cardiac distress) referred from CHC.', time: new Date(Date.now() - 1000 * 60 * 15).toISOString(), read: false },
        { id: 2, type: 'report', title: 'Lab Report Available', message: 'CBC results for Sunita Devi are now available.', time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), read: false },
        { id: 3, type: 'appointment', title: 'Appointment Cancelled', message: 'Ramesh Singh cancelled their 10:30 AM slot.', time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), read: true },
        { id: 4, type: 'followup', title: 'Follow-up Reminder', message: 'Anil Patel is due for post-op checkup today.', time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), read: true }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type) => {
    switch(type) {
      case 'emergency': return <AlertTriangle size={20} color="#dc2626" />;
      case 'report': return <FileText size={20} color="#0284c7" />;
      case 'appointment': return <Clock size={20} color="#d97706" />;
      case 'followup': return <UserCheck size={20} color="#16a34a" />;
      case 'referral': return <Share2 size={20} color="#7c3aed" />;
      default: return <Bell size={20} color="#64748b" />;
    }
  };

  const getBg = (type) => {
    switch(type) {
      case 'emergency': return '#fef2f2';
      case 'report': return '#f0f9ff';
      case 'appointment': return '#fffbeb';
      case 'followup': return '#f0fdf4';
      case 'referral': return '#f5f3ff';
      default: return '#f8fafc';
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Bell size={24} color="#0d9488" /> Notification Center
          </h2>
        </div>
        {notifications.some(n => !n.read) && (
          <button 
            onClick={markAllAsRead}
            style={{ background: 'transparent', color: '#0f766e', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <CheckCircle size={14} /> Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="heartbeat-loader" style={{ width: '30px', height: '30px', border: '3px solid #0d9488', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ background: '#f8fafc', padding: '60px 20px', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
          <Bell size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#334155', margin: '0 0 8px 0' }}>All Caught Up!</h3>
          <p style={{ color: '#64748b', margin: 0 }}>You have no new notifications.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map(notif => (
            <div 
              key={notif.id} 
              onClick={() => markAsRead(notif.id)}
              style={{ 
                background: notif.read ? '#fff' : '#f0fdf4', 
                border: '1px solid',
                borderColor: notif.read ? '#e2e8f0' : '#86efac', 
                borderRadius: '12px', 
                padding: '16px 20px', 
                display: 'flex', 
                gap: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: notif.read ? 'none' : '0 4px 6px rgba(16, 185, 129, 0.05)'
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: getBg(notif.type), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {getIcon(notif.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: notif.read ? 600 : 700 }}>{notif.title}</h4>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                    {new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>{notif.message}</p>
              </div>
              {!notif.read && (
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', alignSelf: 'center' }}></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
