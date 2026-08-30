import { formatDate } from '../../../../utils/formatDate';

const SENSITIVE_KEY_FRAGMENTS = [
  'password',
  'token',
  'secret',
  'otp',
  'authorization',
  'api_key',
  'apikey',
  'refresh',
  'smtp',
  'db_url',
  'database_url',
];

const isSensitiveKey = (key) => {
  const normalized = String(key || '').toLowerCase();
  return SENSITIVE_KEY_FRAGMENTS.some((fragment) => normalized.includes(fragment));
};

export const sanitizeAuditMetadata = (value) => {
  if (Array.isArray(value)) return value.map((entry) => sanitizeAuditMetadata(entry));
  if (!value || typeof value !== 'object') return value;

  const next = {};
  for (const [key, entry] of Object.entries(value)) {
    if (isSensitiveKey(key)) {
      next[key] = '********';
      continue;
    }
    next[key] = sanitizeAuditMetadata(entry);
  }
  return next;
};

export const toUpperUnderscore = (value) =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');

export const formatLabel = (value) =>
  String(value || 'Unknown')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const severityTone = (value) => {
  const severity = toUpperUnderscore(value);
  if (severity === 'SUCCESS') return 'success';
  if (severity === 'WARNING') return 'warning';
  if (severity === 'ERROR' || severity === 'CRITICAL') return 'danger';
  if (severity === 'INFO') return 'primary';
  return 'neutral';
};

export const statusTone = (value) => {
  const status = toUpperUnderscore(value);
  if (status === 'SUCCESS') return 'success';
  if (status === 'FAILED') return 'danger';
  if (status === 'PENDING') return 'warning';
  return 'neutral';
};

export const actionCategoryFromLog = (log = {}) => {
  const action = toUpperUnderscore(log?.action);
  const entityType = toUpperUnderscore(log?.entityType);

  if (action.startsWith('BOOKING_') || entityType === 'BOOKING') return 'BOOKING';
  if (action.startsWith('PROVIDER_') || entityType === 'PROVIDER') return 'PROVIDER';
  if (action.startsWith('PAYMENT_') || entityType === 'PAYMENT') return 'PAYMENT';
  if (action.startsWith('SETTINGS_') || entityType === 'SETTINGS') return 'SETTINGS';
  if (action.startsWith('ADMIN_') || entityType === 'USER') return 'USER';
  if (action.includes('LOGIN') || action.includes('LOGOUT') || action.includes('OTP') || action.includes('PASSWORD')) return 'AUTH';
  return 'SYSTEM';
};

export const summarizeAuditLog = (log = {}) => {
  const actor = log?.actor?.fullName || log?.actor?.name || log?.actor?.email || null;
  const action = formatLabel(log?.action);
  const entity = log?.entityType ? formatLabel(log.entityType) : null;
  const bookingCode = log?.bookingCode || log?.metadata?.bookingCode || null;

  if (actor && entity) return `${actor} performed ${action} on ${entity}.`;
  if (bookingCode) return `${action} for booking ${bookingCode}.`;
  if (entity) return `${action} on ${entity}.`;
  return `${action}.`;
};

export const formatAuditTime = (value) => formatDate(value, { includeTime: true });

