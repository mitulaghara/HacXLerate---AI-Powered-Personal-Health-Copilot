import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend) // Load translations from backend via HTTP
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'gu', 'ta', 'te', 'bn', 'mr'],
    debug: false,
    
    interpolation: {
      escapeValue: false, // React already escapes by default
    },

    backend: {
      // Use our local translation files first.
      // If a key is missing, i18next can theoretically be configured to save it, 
      // but we will do dynamic translation directly with LibreTranslate API for missing stuff.
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    }
  });

export default i18n;
