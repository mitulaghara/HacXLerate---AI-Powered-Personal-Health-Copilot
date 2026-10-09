import i18n from '../i18n';

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' }
];

export const setGoogleTranslateCookie = (langCode) => {
  const code = (langCode || 'en').split('-')[0];
  const gVal = code === 'en' ? '/en/en' : `/en/${code}`;
  const host = window.location.hostname;
  
  // Set for localhost and top-level domain
  document.cookie = `googtrans=${gVal}; path=/;`;
  if (host && host !== 'localhost') {
    document.cookie = `googtrans=${gVal}; path=/; domain=${host};`;
    document.cookie = `googtrans=${gVal}; path=/; domain=.${host};`;
  }
};

export const changeApplicationLanguage = async (newLang) => {
  const code = (newLang || 'en').split('-')[0];
  try {
    // 1. Update i18next state & local storage
    localStorage.setItem('i18nextLng', code);
    localStorage.setItem('app_language', code);
    if (i18n && i18n.changeLanguage) {
      await i18n.changeLanguage(code);
    }

    // 2. Set Google Translate cookie for full DOM translation
    setGoogleTranslateCookie(code);

    // 3. Trigger Google Translate DOM combo if present
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = code;
      select.dispatchEvent(new Event('change'));
    } else {
      // Reload page to let Google Translate initialize with the new language cookie
      window.location.reload();
    }
  } catch (err) {
    console.error('Error changing application language:', err);
    window.location.reload();
  }
};
