import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import commonRu from '../public/locales/ru/common.json';
import commonEn from '../public/locales/en/common.json';

const i18n = i18next.createInstance();

i18n
  .use(initReactI18next)
  .init({
    lng: 'ru',
    fallbackLng: 'en',
    resources: {
      ru: { common: commonRu },
      en: { common: commonEn }
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false }
  });

export default i18n;
