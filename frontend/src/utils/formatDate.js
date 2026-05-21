import { APP_CONFIG } from '../config/app.config';

export const formatDate = (value, options = {}) =>
  new Intl.DateTimeFormat(APP_CONFIG.defaultLocale, {
    dateStyle: 'medium',
    timeStyle: options.includeTime ? 'short' : undefined,
  }).format(value ? new Date(value) : new Date());
