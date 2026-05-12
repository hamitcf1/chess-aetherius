import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import tr from './locales/tr.json'
import en from './locales/en.json'

export const SUPPORTED_LANGUAGES = ['tr', 'en'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            tr: { translation: tr },
            en: { translation: en },
        },
        fallbackLng: 'tr',
        supportedLngs: SUPPORTED_LANGUAGES,
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: 'satranc-lang',
            caches: ['localStorage'],
        },
    })

export default i18n
