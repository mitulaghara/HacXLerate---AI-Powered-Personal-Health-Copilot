import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Phone, Navigation, ExternalLink, Clock, RefreshCw, AlertCircle, LocateFixed, Search, Loader, ChevronDown, ChevronUp, Stethoscope, Globe, Radio, CheckCircle2 } from 'lucide-react';
import { getLivePosition, reverseGeocode, calculateDistanceKm, fetchRealNearbyHospitals, searchLocationByName } from '../utils/geolocation';

/* ─── Amenity label mapping ───────────────────────────────────────────────── */
function getAmenityLabel(amenity) {
  const map = {
    hospital: {
      text: 'Hospital',
      color: '#b91c1c',
      bg: '#fee2e2'
    },
    clinic: {
      text: 'Clinic',
      color: '#047857',
      bg: '#d1fae5'
    },
    doctors: {
      text: 'Doctor / GP',
      color: '#7c3aed',
      bg: '#ede9fe'
    },
    health_centre: {
      text: 'Health Centre',
      color: '#0369a1',
      bg: '#e0f2fe'
    },
    health: {
      text: 'Health Facility',
      color: '#0369a1',
      bg: '#e0f2fe'
    }
  };
  return map[amenity] || {
    text: amenity || 'Medical Facility',
    color: '#374151',
    bg: '#f3f4f6'
  };
}

/* ─── Leaflet custom icons ────────────────────────────────────────────────── */
function createHospitalIcon(index, isFirst) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 30px; height: 30px; border-radius: 50%;
        background: ${isFirst ? '#059669' : '#0369a1'};
        border: 2.5px solid #ffffff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 12px; font-weight: 800;
      ">${index}</div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
}
function createUserIcon() {
  return L.divIcon({
    className: '',
    html: `
      <style>
        @keyframes pinDrop { 0%{transform:translateY(-6px)} 100%{transform:translateY(0px)} }
        @keyframes shadowPulse { 0%{transform:scale(0.6);opacity:0.3} 100%{transform:scale(1);opacity:0.15} }
      </style>
      <div style="position:relative;width:36px;height:50px">
        <svg style="animation:pinDrop 0.4s ease-in-out infinite alternate" width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 26 18 26s18-13.4 18-26C36 8.06 27.94 0 18 0z" fill="#ef4444"/>
          <circle cx="18" cy="18" r="8" fill="#fff"/>
        </svg>
        <div style="position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);width:16px;height:4px;border-radius:50%;background:rgba(0,0,0,0.2);animation:shadowPulse 0.4s ease-in-out infinite alternate"></div>
      </div>
    `,
    iconSize: [36, 50],
    iconAnchor: [18, 44]
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════════ */
export default function NearbyHospitals({
  onSelectHospital,
  onLoadingStateChange,
  onHospitalsFetched
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [status, setStatus] = useState('locating'); // idle|locating|loading|done|error
  const [error, setError] = useState('');
  const [userCoords, setUserCoords] = useState(null);
  const [userAddress, setUserAddress] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [radius, setRadius] = useState(10000);
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [permissionNotice, setPermissionNotice] = useState('');
  const [facilityMode, setFacilityMode] = useState('hospital'); // 'hospital' or 'pharmacy' 
  useEffect(() => {
    if (onLoadingStateChange) {
      onLoadingStateChange(status === 'locating' || status === 'loading');
    }
  }, [status, onLoadingStateChange]);
  useEffect(() => {
    if (onHospitalsFetched && hospitals.length > 0) {
      onHospitalsFetched(hospitals);
    }
  }, [hospitals, onHospitalsFetched]);

  /* ── Init / reset Leaflet map ──────────────────────────────────────────── */
  const initMap = useCallback((lat, lng) => {
    if (!mapRef.current) return null;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // User marker
    L.marker([lat, lng], {
      icon: createUserIcon(),
      zIndexOffset: 1000
    }).addTo(map).bindPopup('<strong>📍 Your Location</strong>');

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    mapInstanceRef.current = map;
    return map;
  }, []);

  /* ── Place hospital markers on map ────────────────────────────────────── */
  const placeMarkers = useCallback((map, list, userLat, userLng) => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    const bounds = [[userLat, userLng]];
    list.forEach((h, idx) => {
      const marker = L.marker([h.lat, h.lng], {
        icon: createHospitalIcon(idx + 1, idx === 0)
      }).addTo(map);
      marker.bindPopup(`
        <div style="font-family:sans-serif; min-width:170px; padding:4px;">
          <div style="font-weight:800; font-size:13px; color:#064e3b; margin-bottom:3px;">${idx + 1}. ${h.name}</div>
          <div style="font-size:11px; color:#6b7280;">📍 ${h.distanceKm} km away</div>
          ${h.phone ? `<div style="font-size:12px; margin-top:4px; color:#065f46; font-weight:700;">📞 ${h.phone}</div>` : ''}
        </div>
      `);
      marker.on('click', () => setExpandedId(h.id));
      markersRef.current.push(marker);
      bounds.push([h.lat, h.lng]);
    });
    if (bounds.length > 1) {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 16
      });
    }
  }, []);

  /* ── Load hospitals for coordinates ───────────────────────────────────── */
  const loadHospitalsForLocation = useCallback(async (coords, address, currentRadius) => {
    setUserCoords(coords);
    if (address) setUserAddress(address);
    setStatus('loading');
    setError('');
    const searchRadius = currentRadius ?? radius;
    initMap(coords.lat, coords.lng); // initialize or reset map
    try {
      const parsed = await fetchRealNearbyHospitals(coords.lat, coords.lng, searchRadius, facilityMode);
      setHospitals(parsed);
      setStatus('done');
      if (mapInstanceRef.current && parsed.length > 0) {
        placeMarkers(mapInstanceRef.current, parsed, coords.lat, coords.lng);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch hospitals. Please check your internet connection.');
      setStatus('error');
    }
  }, [radius, initMap, placeMarkers, facilityMode]);

  /* ── Main auto-detect GPS / IP flow ───────────────────────────────────── */
  const runAutoDetect = useCallback(async forcedRadius => {
    setStatus('locating');
    setError('');
    setPermissionNotice('');
    setHospitals([]);
    const pos = await getLivePosition();
    setUserCoords(pos);
    if (pos.permissionStatus === 'denied') {
      setPermissionNotice('GPS access was not granted by your browser. We are showing hospitals near your detected city network. You can also search your exact area or pincode below.');
    }
    let addr = pos.city ? `${pos.city}, ${pos.region || ''}` : '';
    try {
      const geo = await reverseGeocode(pos.lat, pos.lng);
      addr = geo.shortAddress || geo.formattedAddress || addr || 'Live Location';
    } catch (_) {}
    setUserAddress(addr);
    await loadHospitalsForLocation(pos, addr, forcedRadius ?? radius);
  }, [radius, loadHospitalsForLocation]);

  /* ── Explicit GPS Request when user taps button ───────────────────────── */
  const handleRequestLiveGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setStatus('locating');
    setPermissionNotice('');
    navigator.geolocation.getCurrentPosition(async pos => {
      const coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: Math.round(pos.coords.accuracy || 10),
        source: 'gps',
        isFallback: false,
        permissionStatus: 'granted'
      };
      setUserCoords(coords);
      try {
        const geo = await reverseGeocode(coords.lat, coords.lng);
        const addr = geo.shortAddress || geo.formattedAddress || 'Live GPS Location';
        setUserAddress(addr);
        loadHospitalsForLocation(coords, addr, radius);
      } catch (_) {
        loadHospitalsForLocation(coords, 'Live GPS Location', radius);
      }
    }, err => {
      console.warn('Manual GPS request error:', err);
      setPermissionNotice(err.code === 1 ? 'Location permission is blocked. Please allow location in your browser settings (tap 🔒 lock icon in URL bar) or type your city/pincode below.' : 'GPS signal timed out. Using network location.');
      runAutoDetect(radius);
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  };

  /* ── Custom City / Pincode Search ─────────────────────────────────────── */
  const handleCustomSearch = async e => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setError('');
    try {
      const found = await searchLocationByName(searchQuery);
      if (found) {
        const coords = {
          lat: found.lat,
          lng: found.lng,
          accuracy: 50,
          source: 'search',
          isFallback: false
        };
        setUserCoords(coords);
        setUserAddress(found.shortAddress || found.displayName || searchQuery);
        setPermissionNotice('');
        await loadHospitalsForLocation(coords, found.shortAddress, radius);
      } else {
        alert(`Location "${searchQuery}" not found. Please try entering a city name or 6-digit PIN code.`);
      }
    } catch (err) {
      console.error(err);
      alert('Error searching for location. Please check your internet connection.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Auto-run on mount
  useEffect(() => {
    runAutoDetect(radius);
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);
  const handleRadiusChange = newRadius => {
    setRadius(newRadius);
    if (userCoords) {
      loadHospitalsForLocation(userCoords, userAddress, newRadius);
    }
  };
  const openDirections = h => {
    const origin = userCoords ? `${userCoords.lat},${userCoords.lng}` : '';
    const dest = `${h.lat},${h.lng}`;
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`, '_blank');
  };
  const openOsmMap = h => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name)}&query=${h.lat},${h.lng}`, '_blank');
  };

  /* ── UI ───────────────────────────────────────────────────────────────── */
  return <div>
      {/* ── Mobile Responsive Styles ── */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-stack {
            flex-direction: column !important;
            width: 100% !important;
          }
          .mobile-full-width {
            width: 100% !important;
            min-width: 100% !important;
            flex: none !important;
          }
          .mobile-full-width-btn {
            width: 100% !important;
            justify-content: center !important;
          }
          .mobile-grid-1 {
            grid-template-columns: 1fr !important;
          }
          .mobile-hide {
            display: none !important;
          }
          .mobile-text-center {
            text-align: center !important;
          }
          .mobile-align-start {
            align-items: flex-start !important;
          }
          .mobile-wrap-gap {
            gap: 12px !important;
          }
          .mobile-status-row {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .mobile-card-actions {
            flex-direction: column !important;
          }
          .mobile-card-actions button, .mobile-card-actions a {
            width: 100% !important;
          }
        }
      `}</style>

            {/* ── Mode Toggle (Hospitals vs Jan Aushadhi) ────────────── */}
      <div style={{
        display: 'flex',
        background: '#f1f5f9',
        padding: '6px',
        borderRadius: '12px',
        marginBottom: '24px',
        gap: '8px'
      }}>
        <button 
          onClick={() => {
            setFacilityMode('hospital');
          }}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: facilityMode === 'hospital' ? '#fff' : 'transparent',
            color: facilityMode === 'hospital' ? 'var(--primary)' : '#64748b',
            border: 'none',
            borderRadius: '8px',
            boxShadow: facilityMode === 'hospital' ? '0 2px 12px rgba(0,0,0,0.05)' : 'none',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Stethoscope size={18} />
          <span>Hospitals & Clinics</span>
        </button>
        <button 
          onClick={() => {
            setFacilityMode('pharmacy');
          }}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: facilityMode === 'pharmacy' ? '#fff' : 'transparent',
            color: facilityMode === 'pharmacy' ? '#059669' : '#64748b',
            border: 'none',
            borderRadius: '8px',
            boxShadow: facilityMode === 'pharmacy' ? '0 2px 12px rgba(0,0,0,0.05)' : 'none',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <span style={{fontSize: '1.2rem'}}>💊</span>
          <span>Jan Aushadhi (Medicines)</span>
        </button>
      </div>
      
      {/* ── Top Bar: Search City / Pincode + Location Controls ────────────── */}
      <div style={{
        background: '#fff',
        border: '1px solid var(--borderLight)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        {/* Search Bar Row */}
        <form className="mobile-stack" onSubmit={handleCustomSearch} style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <div className="mobile-full-width" style={{
            position: 'relative',
            flex: 1,
            minWidth: '280px'
          }}>
            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mutedForeground)' }}>
              <Search size={18} strokeWidth={2.5} />
            </div>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              placeholder="Search city, PIN code, or Hospital Name (e.g. AIIMS Delhi)..." 
              disabled={searchLoading} 
              style={{
                width: '100%',
                padding: '12px 16px 12px 46px',
                border: "1px solid var(--borderLight)",
                borderRadius: '12px',
                fontSize: '0.95rem',
                outline: 'none',
                fontWeight: 600,
                color: 'var(--foreground)',
                background: '#f8fafc',
                transition: 'border-color 0.2s, background 0.2s'
              }} 
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary)';
                e.target.style.background = '#fff';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--borderLight)';
                e.target.style.background = '#f8fafc';
              }}
            />
          </div>
          
          <button className="mobile-full-width-btn"
            type="submit" 
            disabled={searchLoading || !searchQuery.trim()} 
            style={{
              padding: '12px 24px',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#fff',
              background: searchLoading || !searchQuery.trim() ? '#94a3b8' : 'var(--primary)',
              border: 'none',
              borderRadius: '12px',
              cursor: searchLoading || !searchQuery.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'background 0.2s, transform 0.1s'
            }}
          >
            {searchLoading ? <Loader size={16} className="spin" /> : <Search size={16} />}
            <span>Search Area</span>
          </button>
          
          <button className="mobile-full-width-btn"
            type="button" 
            onClick={handleRequestLiveGps} 
            disabled={status === 'locating' || status === 'loading'} 
            style={{
              padding: '12px 20px',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--foreground)',
              background: '#fff',
              border: '1px solid var(--borderLight)',
              borderRadius: '12px',
              cursor: status === 'locating' || status === 'loading' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              transition: 'all 0.2s'
            }}
          >
            <LocateFixed size={16} color="var(--primary)" />
            <span>Use Live GPS</span>
          </button>
        </form>

        {/* Status Badges & Controls Row */}
        <div className="mobile-status-row" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          borderTop: "1px solid var(--borderLight)",
          paddingTop: '16px'
        }}>
          {/* Active Location Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: userCoords?.source === 'gps' ? '#ecfdf5' : '#f0f9ff',
              border: `1px solid ${userCoords?.source === 'gps' ? '#a7f3d0' : '#bae6fd'}`,
              color: userCoords?.source === 'gps' ? '#065f46' : '#0369a1',
              padding: '8px 16px',
              borderRadius: '100px',
              fontSize: '0.8rem',
              fontWeight: 700
            }}>
              {userCoords?.source === 'gps' ? <Radio size={14} /> : <Globe size={14} />}
              <span style={{
                maxWidth: '260px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {status === 'locating' ? 'Locating...' : userAddress || 'Active Location'}
              </span>
              {userCoords?.source === 'gps' && <span style={{
                background: '#059669',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.65rem',
                marginLeft: '4px'
              }}>LIVE GPS</span>}
              {userCoords?.source === 'ip' && <span style={{
                background: '#0284c7',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.65rem',
                marginLeft: '4px'
              }}>NETWORK</span>}
              {userCoords?.source === 'search' && <span style={{
                background: '#4f46e5',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.65rem',
                marginLeft: '4px'
              }}>SEARCHED</span>}
            </div>

            {/* Radius Selector */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc',
              padding: '6px 12px',
              borderRadius: '12px',
              border: '1px solid var(--borderLight)'
            }}>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--mutedForeground)'
              }}>Radius:</span>
              <select 
                value={radius} 
                onChange={e => handleRadiusChange(Number(e.target.value))} 
                disabled={status === 'loading' || status === 'locating'} 
                style={{
                  background: 'transparent',
                  border: "none",
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--foreground)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value={2000}>2 km</option>
                <option value={5000}>5 km</option>
                <option value={10000}>10 km</option>
                <option value={20000}>20 km</option>
                <option value={50000}>50 km</option>
              </select>
            </div>
          </div>

          {/* Refresh Button */}
          <button className="mobile-full-width-btn"
            onClick={() => runAutoDetect(radius)} 
            disabled={status === 'locating' || status === 'loading'} 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--foreground)',
              background: '#fff',
              border: '1px solid var(--borderLight)',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: status === 'locating' || status === 'loading' ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#f8fafc'; }}
            onMouseOut={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#fff'; }}
          >
            {status === 'locating' || status === 'loading' ? (
              <><Loader size={14} className="spin" /> Locating...</>
            ) : (
              <><RefreshCw size={14} /> Refresh Map</>
            )}
          </button>
        </div>
      </div>
      {/* ── Permission or Network Notice ─────────────────────────────────── */}
      {permissionNotice && <div style={{
        border: "1px solid #fcd34d",
        background: '#fffbeb',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        fontSize: '0.85rem',
        lineHeight: 1.5,
        color: '#92400e'
      }}>
          <AlertCircle size={20} color="#d97706" style={{
            flexShrink: 0,
            marginTop: '2px'
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, marginBottom: '4px', fontSize: '0.9rem' }}>Location Access Guide:</div>
            <div>{permissionNotice}</div>
          </div>
          <button onClick={handleRequestLiveGps} style={{
            border: 'none',
            background: '#d97706',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'background 0.2s'
          }}>
            📍 Allow GPS
          </button>
        </div>}

      {/* ── Leaflet Map ──────────────────────────────────────────────────── */}
      <div style={{
        width: '100%',
        height: '400px',
        overflow: 'hidden',
        border: "1px solid var(--borderLight)",
        borderRadius: '16px',
        marginBottom: '24px',
        position: 'relative',
        zIndex: 1,
        isolation: 'isolate',
        boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
      }}>
        {(status === 'locating' || status === 'loading') && <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(4px)'
      }}>
            <div className="loading" style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
              <svg width="64px" height="48px">
                <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="back"></polyline>
                <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="front"></polyline>
              </svg>
            </div>
            <span style={{
          fontSize: '0.88rem',
          fontWeight: 700
        }}>
              {status === 'locating' ? '📍 Live location identify ho rahi hai...' : '🔍 100% Real nearby hospitals fetch ho rahe hain...'}
            </span>
            <span style={{
          fontSize: '0.75rem'
        }}>
              OpenStreetMap Overpass & Satellite database query active
            </span>
          </div>}
        <div ref={mapRef} style={{
        width: '100%',
        height: '100%'
      }} />
      </div>

      {/* ── Error state ──────────────────────────────────────────────────── */}
      {status === 'error' && <div style={{
        border: "1px solid #fecaca",
        background: '#fef2f2',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
        color: '#991b1b'
      }}>
          <AlertCircle size={22} color="#dc2626" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{error}</div>
            <button onClick={() => runAutoDetect(radius)} style={{
              marginTop: '8px',
              border: 'none',
              background: '#dc2626',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'background 0.2s'
            }}>
              🔄 Try Again
            </button>
          </div>
        </div>}

      {/* ── Summary bar ──────────────────────────────────────────────────── */}
      {status === 'done' && <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 16px',
      marginBottom: '16px',
      border: `1px solid ${hospitals.length > 0 ? '#a7f3d0' : '#fde68a'}`,
      fontSize: '0.83rem',
      fontWeight: 700,
      flexWrap: 'wrap',
      justifyContent: 'space-between'
    }}>
          <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
            <Stethoscope size={16} color={hospitals.length > 0 ? '#059669' : '#b45309'} />
            {hospitals.length > 0 ? <span>{hospitals.length} healthcare facilities found within {radius / 1000} km of {userAddress || 'your location'}</span> : <span>No hospitals found within {radius / 1000} km — try expanding radius to 20 km or 50 km</span>}
          </div>
          {hospitals.length > 0 && <span style={{
        fontSize: '0.74rem',
        fontWeight: 800
      }}>
              Nearest: {hospitals[0].name} ({hospitals[0].distanceKm} km)
            </span>}
        </div>}

      {/* ── Hospital Cards ────────────────────────────────────────────────── */}
      {status === 'done' && hospitals.length > 0 && <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
        gap: '20px'
      }}>
          {hospitals.map((h, idx) => {
          const labelStyle = getAmenityLabel(h.amenity);
          const isExpanded = expandedId === h.id;
          const isFirst = idx === 0;
          return <div key={h.id || idx} style={{
            background: '#fff',
            border: isFirst ? '2px solid var(--primary)' : '1px solid var(--borderLight)',
            borderRadius: '16px',
            boxShadow: isFirst ? '0 8px 24px rgba(11, 107, 104, 0.12)' : '0 4px 16px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            position: 'relative',
            transition: 'transform 0.2s, box-shadow 0.2s',
            display: 'flex',
            flexDirection: 'column'
          }}>
                  {/* Top ribbon for nearest */}
                  {isFirst && <div style={{
              background: "var(--primary)",
              color: "#fff",
              padding: '8px 16px',
              fontSize: '0.75rem',
              fontWeight: 800,
              textAlign: 'center',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
                      🏆 Nearest Healthcare Facility
                    </div>}

                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Header row */}
                    <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                marginBottom: '16px'
              }}>
                      {/* Rank circle */}
                      <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: isFirst ? 'var(--primary)' : '#f3f4f6',
                  color: isFirst ? '#fff' : '#4b5563',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1rem',
                  marginTop: '2px'
                }}>
                        {idx + 1}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: 'var(--foreground)',
                    lineHeight: 1.3,
                    marginBottom: '8px',
                    wordBreak: 'break-word'
                  }}>
                          {h.name}
                        </h3>

                        {/* Badges row */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '100px',
                      background: labelStyle.bg,
                      color: labelStyle.color
                    }}>
                            🏥 {labelStyle.text}
                          </span>
                          {h.emergency && <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '100px',
                      background: '#fee2e2',
                      color: '#b91c1c'
                    }}>🚨 Emergency</span>}
                          {h.beds && <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '100px',
                      background: '#e0f2fe',
                      color: '#0369a1'
                    }}>🛏️ {h.beds}</span>}
                        </div>
                      </div>

                      {/* Distance badge */}
                      <div style={{
                  textAlign: 'center',
                  flexShrink: 0,
                  background: isFirst ? 'rgba(11, 107, 104, 0.05)' : '#f8fafc',
                  border: isFirst ? '1px solid rgba(11, 107, 104, 0.1)' : '1px solid var(--borderLight)',
                  borderRadius: '12px',
                  padding: '10px 14px'
                }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                          {h.distanceKm} km
                        </div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--mutedForeground)', marginTop: '4px' }}>
                          ~{h.etaMins || Math.max(3, Math.round(h.distanceKm * 2.2))} MINS
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    {h.address && <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: '12px',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: 'var(--mutedForeground)'
              }}>
                        <MapPin size={16} color="var(--primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span style={{ lineHeight: 1.4 }}>{h.address}</span>
                      </div>}

                    {/* Phone number */}
                    {h.phone ? <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                padding: '12px 16px',
                background: '#f0fdf4',
                borderRadius: '8px',
                border: "1px solid #bbf7d0"
              }}>
                        <Phone size={16} color="#16a34a" />
                        <a href={`tel:${h.phone}`} style={{
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: '#166534',
                  textDecoration: 'none'
                }}>
                          {h.phone}
                        </a>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', marginLeft: 'auto' }}>
                          Tap to Call
                        </span>
                      </div> : <div style={{
                marginBottom: '12px',
                padding: '12px 16px',
                background: '#fef2f2',
                borderRadius: '8px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#991b1b',
                border: "1px solid #fecaca"
              }}>
                        <Phone size={16} color="#dc2626" />
                        <span style={{ fontWeight: 600 }}>Emergency Helpline: <a href="tel:108" style={{ fontWeight: 800, color: '#991b1b' }}>108</a> / <a href="tel:102" style={{ fontWeight: 800, color: '#991b1b' }}>102</a></span>
                      </div>}

                    {/* Operator */}
                    {h.operator && <div style={{
                fontSize: '0.8rem',
                marginBottom: '12px',
                color: 'var(--mutedForeground)'
              }}>
                        🏛️ Managed by: <strong style={{ color: 'var(--foreground)' }}>{h.operator}</strong>
                      </div>}

                    {/* Opening hours toggle */}
                    {h.openingHours && <div style={{ marginBottom: '16px' }}>
                        <button onClick={() => setExpandedId(isExpanded ? null : h.id)} style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  padding: '4px 0'
                }}>
                          <Clock size={14} />
                          <span>Opening Hours: {isExpanded ? 'Hide' : 'Show'}</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        {isExpanded && <div style={{
                  marginTop: '10px',
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: "1px solid var(--borderLight)",
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: 'var(--mutedForeground)'
                }}>
                            {h.openingHours}
                          </div>}
                      </div>}

                    <div style={{ flex: 1 }}></div>

                    {/* Action buttons */}
                    <div className="mobile-card-actions" style={{
                display: 'flex',
                gap: '12px',
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: "1px solid var(--borderLight)",
                flexWrap: 'wrap'
              }}>
                      <button onClick={() => openDirections(h)} style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  minWidth: '130px',
                  transition: 'background 0.2s',
                  boxShadow: '0 4px 12px rgba(11, 107, 104, 0.15)'
                }}>
                        <Navigation size={16} />
                        <span>Get Directions</span>
                      </button>

                      <button onClick={() => openOsmMap(h)} style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  background: '#fff',
                  color: 'var(--foreground)',
                  border: '1px solid var(--borderLight)',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  minWidth: '130px',
                  transition: 'border-color 0.2s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                        <ExternalLink size={16} />
                        <span>Google Maps</span>
                      </button>

                      {onSelectHospital && <button onClick={() => onSelectHospital(h, userCoords)} style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  background: '#fef2f2',
                  color: 'var(--emergency)',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  minWidth: '130px',
                  transition: 'background 0.2s'
                }}>
                          <Stethoscope size={16} />
                          <span>Select for Referral</span>
                        </button>}
                    </div>
                  </div>
                </div>;
        })}
          </div>}
      {/* ── CSS animations ────────────────────────────────────────────────── */}
      <style>{`
        @keyframes nearbySpinAnim {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes nearbyPulse {
          0%   { transform: scale(1);   opacity: 0.8; }
          50%  { transform: scale(1.6); opacity: 0.3; }
          100% { transform: scale(1);   opacity: 0.8; }
        }
      `}</style>
    </div>;
}