import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translateText } from '../lib/language';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('ta');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('siteLanguage');
      if (stored === 'en' || stored === 'ta') {
        setLanguage(stored);
      }
    } catch (_) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('siteLanguage', language);
    } catch (_) {
      // ignore
    }

    if (typeof document !== 'undefined') {
      document.documentElement.lang = language === 'en' ? 'en' : 'ta';
    }
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    ui: (text) => translateText(text, language),
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
