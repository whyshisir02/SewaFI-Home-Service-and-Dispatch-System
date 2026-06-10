import { deriveBookingStatusForDisplay } from '../constants/booking-status.constant';

const CANCELLATION_LOCK_WINDOW_MS = 60 * 60 * 1000;

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getBookingScheduledTime = (booking) =>
  toDate(booking?.scheduledTime || booking?.scheduledAt || booking?.preferredDate || null);

export const getCustomerCancellationPolicy = (booking, now = new Date()) => {
  const status = String(booking?.status || '').trim().toUpperCase();
  const displayStatus = deriveBookingStatusForDisplay(booking);
  const scheduledTime = getBookingScheduledTime(booking);

  if (status === 'PENDING') {
    return {
      canCancel: true,
      needsWarning: false,
      confirmDescription:
        'Are you sure you want to cancel this booking? This action may not be reversible depending on the booking status.',
      supportMessage: '',
    };
  }

  if (status === 'ACCEPTED') {
    const locked =
      !scheduledTime || scheduledTime.getTime() - now.getTime() <= CANCELLATION_LOCK_WINDOW_MS;

    if (!locked) {
      return {
        canCancel: true,
        needsWarning: true,
        confirmDescription:
          'Provider has already accepted this booking. Cancelling now may affect provider availability.',
        supportMessage: '',
      };
    }

    return {
      canCancel: false,
      needsWarning: false,
      confirmDescription: '',
      supportMessage:
        'This booking is within 1 hour of the scheduled service time. Please contact support if you need help with this booking.',
    };
  }

  if (displayStatus === 'AWAITING_CONFIRMATION') {
    return {
      canCancel: false,
      needsWarning: false,
      confirmDescription: '',
      supportMessage:
        'The provider has completed the work and submitted the final amount. Please review and confirm payment, or contact support if there is an issue.',
    };
  }

  if (status === 'IN_PROGRESS') {
    return {
      canCancel: false,
      needsWarning: false,
      confirmDescription: '',
      supportMessage:
        'The provider has already started working on your service. Please contact support if you need help with this booking.',
    };
  }

  if (status === 'COMPLETED') {
    return {
      canCancel: false,
      needsWarning: false,
      confirmDescription: '',
      supportMessage:
        'This service is already completed. You can review the booking or contact support if there is an issue.',
    };
  }

  return {
    canCancel: false,
    needsWarning: false,
    confirmDescription: '',
    supportMessage: '',
  };
};
