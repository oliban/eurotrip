'use client';

import { useState, useEffect, useCallback } from 'react';
import { detectLocale, getTranslations, LOCALE_CURRENCY, LOCALE_LANGUAGE_NAME, type Locale, type Translations } from '@/lib/i18n';

const LOCALE_STORAGE_KEY = 'eurotrip_locale';

interface LocaleInfo {
  locale: Locale;
  language: string;
  currency: string;
  t: Translations;
  setLocale: (locale: Locale) => void;
}

function buildLocaleInfo(locale: Locale): Omit<LocaleInfo, 'setLocale'> {
  return {
    locale,
    language: LOCALE_LANGUAGE_NAME[locale],
    currency: LOCALE_CURRENCY[locale],
    t: getTranslations(locale),
  };
}

// Always start with 'en' to match SSR
const DEFAULT_LOCALE_INFO = buildLocaleInfo('en');

export function useLocale(): LocaleInfo {
  const [info, setInfo] = useState<Omit<LocaleInfo, 'setLocale'>>(DEFAULT_LOCALE_INFO);

  // On mount: load from localStorage, fall back to browser detection
  useEffect(() => {
    let saved: Locale | null = null;
    try {
      const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (raw === 'sv' || raw === 'en') saved = raw;
    } catch { /* ignore */ }

    const locale = saved ?? detectLocale();
    if (locale !== 'en') {
      setInfo(buildLocaleInfo(locale));
    }
  }, []);

  const setLocale = useCallback((locale: Locale) => {
    setInfo(buildLocaleInfo(locale));
    try { localStorage.setItem(LOCALE_STORAGE_KEY, locale); } catch { /* ignore */ }
  }, []);

  return { ...info, setLocale };
}
