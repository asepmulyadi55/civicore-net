import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from './locales/en/translation.json';
import idTranslations from './locales/id/translation.json';

const resources = {
  en: {
    translation: enTranslations
  },
  id: {
    translation: idTranslations
  }
};

// Read user's saved language preference directly — avoids waiting for AdminLayout's useEffect
function getInitialLanguage(): string {
  try {
    const raw = localStorage.getItem('admin_user');
    if (raw && raw !== 'undefined') {
      const user = JSON.parse(raw);
      if (user?.language) return user.language;
    }
  } catch {}
  return 'en';
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
