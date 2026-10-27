import { createI18n } from 'vue-i18n';

/**
 * Global i18n instance.
 * Labels are loaded at app start (see store's startApp action)
 */
export const i18n = createI18n({
	legacy: false,
	locale: 'en',
	fallbackLocale: 'en',
	missingWarn: false,
	fallbackWarn: false,
	warnHtmlMessage: false,
});
