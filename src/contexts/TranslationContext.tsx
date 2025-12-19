import React, { createContext, useContext, useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import enTranslations from '../locales/en.json';
import esTranslations from '../locales/es.json';

interface Translations {
  [key: string]: any;
}

const translations: { [key: string]: Translations } = {
  en: enTranslations,
  es: esTranslations,
};

interface TranslationContextType {
  t: (key: string, params?: { [key: string]: string | number }) => string;
  language: string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>('en');

  useEffect(() => {
    // Get system language from Tauri backend
    invoke<string>('get_system_language').then((lang: string) => {
      // Normalize language code (e.g., "en-US" -> "en", "es-ES" -> "es")
      const normalizedLang = lang.split('-')[0].toLowerCase();

      // Check if we have translations for this language, fallback to English
      if (translations[normalizedLang]) {
        setLanguage(normalizedLang);
      } else {
        setLanguage('en');
      }
    }).catch(() => {
      // Fallback to English if detection fails
      setLanguage('en');
    });
  }, []);

  const t = (key: string, params?: { [key: string]: string | number }): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found
        value = translations['en'];
        for (const k2 of keys) {
          if (value && typeof value === 'object' && k2 in value) {
            value = value[k2];
          } else {
            return key; // Return the key if not found in any language
          }
        }
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace parameters (e.g., {{time}} with actual value)
    if (params) {
      Object.keys(params).forEach((paramKey) => {
        value = value.replace(`{{${paramKey}}}`, String(params[paramKey]));
      });
    }

    return value;
  };

  return (
    <TranslationContext.Provider value={{ t, language }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
