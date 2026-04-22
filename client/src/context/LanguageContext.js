import { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // Default to hinglish if nothing is saved
    return localStorage.getItem('preferredLanguage') || 'hinglish';
  });

  useEffect(() => {
    localStorage.setItem('preferredLanguage', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'hinglish' ? 'english' : 'hinglish'));
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}