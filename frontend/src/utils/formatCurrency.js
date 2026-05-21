import { APP_CONFIG } from '../config/app.config';

export const formatCurrency = (amount) =>
  new Intl.NumberFormat(APP_CONFIG.defaultLocale, {
    style: 'currency',
    currency: APP_CONFIG.currency,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
