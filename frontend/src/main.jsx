import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import './minimalist.css';
import './i18n';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <React.Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', fontFamily: 'sans-serif' }}>Loading...</div>}>
        <App />
      </React.Suspense>
    </BrowserRouter>
  </React.StrictMode>
);
