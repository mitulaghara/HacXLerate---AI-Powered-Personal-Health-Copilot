import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Cache to prevent duplicate API requests
const translationCache = JSON.parse(localStorage.getItem('libreTranslateCache') || '{}');

const saveToCache = (key, text) => {
  translationCache[key] = text;
  localStorage.setItem('libreTranslateCache', JSON.stringify(translationCache));
};

export const useDynamicTranslation = (text, preserveMedicalTerms = false) => {
  const { i18n } = useTranslation();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const targetLang = i18n.language || 'en';

  useEffect(() => {
    if (!text) return;
    
    // If English or same language, use original
    if (targetLang === 'en' || targetLang.startsWith('en')) {
      setTranslatedText(text);
      return;
    }

    const cacheKey = `${targetLang}:${text}`;
    if (translationCache[cacheKey]) {
      setTranslatedText(translationCache[cacheKey]);
      return;
    }

    let isMounted = true;
    const fetchTranslation = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: text,
            source: 'en',
            target: targetLang
          })
        });
        
        if (!response.ok) throw new Error('Translation failed');
        
        const data = await response.json();
        if (data.translatedText && isMounted) {
          setTranslatedText(data.translatedText);
          saveToCache(cacheKey, data.translatedText);
        }
      } catch (err) {
        if (isMounted) setError(err);
        console.error('Translation error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTranslation();

    return () => { isMounted = false; };
  }, [text, targetLang]);

  return { translatedText, isLoading, error };
};

export const DynamicText = ({ children, as: Component = 'span', className = '', ...props }) => {
  const { translatedText, isLoading } = useDynamicTranslation(children);
  
  return (
    <Component className={`${className} ${isLoading ? 'opacity-70' : ''}`} {...props}>
      {translatedText}
    </Component>
  );
};
