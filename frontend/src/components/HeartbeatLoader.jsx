import React from 'react';

/**
 * Universal Heartbeat Loader
 * Renders the exact heartbeat pulse SVG animation.
 * 
 * @param {string} color - The stroke color of the heartbeat line (default: currentColor)
 * @param {number|string} size - The width of the loader (default: 32px)
 * @param {string} text - Optional text to display below the loader
 * @param {boolean} fullScreen - If true, centers the loader in the middle of the screen
 */
export default function HeartbeatLoader({ 
  color = 'currentColor', 
  size = 32, 
  text, 
  fullScreen = false,
  style = {} 
}) {
  const height = (size / 32) * 24; // Maintain aspect ratio

  const content = (
    <div 
      className="heartbeat-loader-wrapper"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: text ? '12px' : '0px',
        ...style
      }}
    >
      <div 
        className="heartbeat-loader" 
        style={{ width: size, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <svg viewBox="0 0 64 48" style={{ width: size, height }}>
          <polyline 
            points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" 
            className="back"
            style={{ 
              fill: 'none', 
              strokeWidth: 3, 
              strokeLinecap: 'round', 
              strokeLinejoin: 'round',
              stroke: color,
              opacity: 0.2
            }}
          />
          <polyline 
            points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" 
            className="front"
            style={{ 
              fill: 'none', 
              strokeWidth: 3, 
              strokeLinecap: 'round', 
              strokeLinejoin: 'round',
              stroke: color,
              strokeDasharray: '48, 144',
              strokeDashoffset: 192,
              animation: 'dash_682 1.4s linear infinite'
            }}
          />
        </svg>
      </div>
      {text && (
        <div style={{ color, fontSize: '0.9rem', fontWeight: 600, textAlign: 'center' }}>
          {text}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        width: '100%',
        padding: '2rem'
      }}>
        {content}
      </div>
    );
  }

  return content;
}
