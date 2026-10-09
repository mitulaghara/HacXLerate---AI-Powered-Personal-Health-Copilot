import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QrScanner({ onScanSuccess, onScanFailure }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    // Initialize the scanner
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    html5QrcodeScanner.render(
      (decodedText) => {
        // Automatically stop scanning after success
        html5QrcodeScanner.clear().catch(console.error);
        if (onScanSuccess) {
          onScanSuccess(decodedText);
        }
      },
      (error) => {
        if (onScanFailure) {
          onScanFailure(error);
        }
      }
    );

    // Cleanup on unmount
    return () => {
      html5QrcodeScanner.clear().catch(console.error);
    };
  }, [onScanSuccess, onScanFailure]);

  return (
    <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      <div id="qr-reader" style={{ width: '100%' }}></div>
    </div>
  );
}
