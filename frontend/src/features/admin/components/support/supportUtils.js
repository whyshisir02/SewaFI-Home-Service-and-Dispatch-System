import { formatDate } from '../../../../utils/formatDate';

export const toUpperUnderscore = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, '_')
    .toUpperCase();

export const statusLabel = (status) => {
  const key = toUpperUnderscore(status);
  if (key === 'IN_PROGRESS') return 'In Progress';
  if (key === 'OPEN') return 'Open';
  if (key === 'PENDING') return 'Pending';
  if (key === 'RESOLVED') return 'Resolved';
  if (key === 'CLOSED') return 'Closed';
  return status || 'Unknown';
};

export const priorityLabel = (priority) => {
  const key = toUpperUnderscore(priority);
  if (key === 'LOW') return 'Low';
  if (key === 'MEDIUM') return 'Medium';
  if (key === 'HIGH') return 'High';
  if (key === 'URGENT') return 'Urgent';
  return priority || '--';
};

export const topicLabel = (topic) => {
  const key = toUpperUnderscore(topic);
  const lookup = {
    BOOKING_SUPPORT: 'Booking Support',
    PROVIDER_REGISTRATION: 'Provider Registration',
    ACCOUNT_HELP: 'Account Help',
    PAYMENT_ISSUE: 'Payment Issue',
    SERVICE_ISSUE: 'Service Issue',
    GENERAL_QUESTION: 'General Question',
  };
  return lookup[key] || topic || 'General';
};

export const formatSupportDate = (value) => (value ? formatDate(value, { includeTime: true }) : '--');
