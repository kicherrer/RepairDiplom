'use client';

import { useTranslation } from 'react-i18next';

export function Loading() {
  const { t } = useTranslation('common');
  return (
    <div className="flex items-center justify-center p-4">
      <div className="text-muted-foreground">{t('common.loading')}</div>
    </div>
  );
}
