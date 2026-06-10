import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { getBookingDisplayStatus } from '../../constants/booking-status.constant';

export const statusMeta = {
  PROVIDER_SEARCHING: {
    label: 'Provider Searching',
    tone: 'bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]',
    explanation: 'Waiting for an eligible provider to accept.',
  },
  NEW_REQUEST: {
    label: 'New Request',
    tone: 'bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]',
    explanation: 'This request is available for nearby eligible providers.',
  },
  PENDING: {
    label: 'Searching Providers',
    tone: 'bg-[var(--sf-accent-soft)] text-[var(--sf-accent)]',
    explanation: 'SewaFi is looking for eligible nearby providers.',
  },
  ACCEPTED: {
    label: 'Provider Accepted',
    tone: 'bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]',
    explanation: 'A provider has accepted your booking.',
  },
  IN_PROGRESS: {
    label: 'Work In Progress',
    tone: 'bg-[var(--sf-accent-soft)] text-[var(--sf-accent)]',
    explanation: 'The provider is working on your service.',
  },
  AWAITING_CONFIRMATION: {
    label: 'Awaiting Customer Confirmation',
    tone: 'bg-[var(--sf-accent-soft)] text-[var(--sf-accent)]',
    explanation: 'Provider has completed the work and submitted the final amount. Please review and confirm payment.',
  },
  PAYMENT_DISPUTED: {
    label: 'Payment Disputed',
    tone: 'bg-[var(--sf-bg)] text-[var(--sf-danger)] border border-[var(--sf-danger)]',
    explanation: 'The final amount was disputed and is waiting for resolution.',
  },
  COMPLETED: {
    label: 'Completed',
    tone: 'bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]',
    explanation: 'Your service has been completed.',
  },
  EXPIRED: {
    label: 'Expired',
    tone: 'bg-[var(--sf-surface-soft)] text-[var(--sf-text-muted)]',
    explanation: 'The scheduled service window passed before the booking could continue.',
  },
  CANCELLED: {
    label: 'Cancelled',
    tone: 'bg-[var(--sf-bg)] text-[var(--sf-danger)] border border-[var(--sf-danger)]',
    explanation: 'This booking has been cancelled.',
  },
};

export const getDisplayStatus = (booking, options = {}) =>
  getBookingDisplayStatus(booking, options).code;

export const getStatusMeta = (booking, options = {}) => {
  const display = getBookingDisplayStatus(booking, options);
  return (
    statusMeta[display.code] || {
      label: display.label,
      tone: 'bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]',
      explanation: display.description || 'Booking status updated.',
    }
  );
};

export const locationSummary = (booking) =>
  [booking?.municipality, booking?.district, booking?.province].filter(Boolean).join(', ');

export const formatMoney = (value) => (value ? formatCurrency(value) : null);

export const safeDate = (value) => (value ? formatDate(value, { includeTime: true }) : null);
