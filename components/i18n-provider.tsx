'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import initI18next from '@/i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [i18n] = useState(() => initI18next);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
