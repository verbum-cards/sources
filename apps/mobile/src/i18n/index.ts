import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import common from './ru/common.json';
import home from './ru/home.json';

// Язык интерфейса в бете один — русский, но все строки идут через i18n,
// чтобы добавление второго языка не потребовало правок компонентов.
void i18n.use(initReactI18next).init({
  lng: 'ru',
  fallbackLng: 'ru',
  ns: ['common', 'home'],
  defaultNS: 'common',
  resources: {
    ru: { common, home },
  },
  // Ресурсы подключены инлайн (resources), поэтому i18next инициализируется
  // синхронно и isInitialized становится true до первого рендера App.
  interpolation: { escapeValue: false },
});

export default i18n;
