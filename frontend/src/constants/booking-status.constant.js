export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  PROVIDER_SEARCHING: 'PROVIDER_SEARCHING',
  NEW_REQUEST: 'NEW_REQUEST',
  ACCEPTED: 'ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  AWAITING_CONFIRMATION: 'AWAITING_CONFIRMATION',
  PAYMENT_DISPUTED: 'PAYMENT_DISPUTED',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
};

export const BOOKING_STATUS_META = {
  PENDING: { label: 'Pending', tone: 'warning' },
  PROVIDER_SEARCHING: { label: 'Provider searching', tone: 'warning' },
  NEW_REQUEST: { label: 'New request', tone: 'primary' },
  ACCEPTED: { label: 'Provider accepted', tone: 'primary' },
  IN_PROGRESS: { label: 'Work in progress', tone: 'secondary' },
  AWAITING_CONFIRMATION: { label: 'Awaiting customer confirmation', tone: 'warning' },
  PAYMENT_DISPUTED: { label: 'Payment disputed', tone: 'danger' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  EXPIRED: { label: 'Expired', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'danger' },
};

const normalizeStatus = (value) => String(value || '').trim().toUpperCase();
const formatFallback = (value) =>
  String(value || 'UNKNOWN')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const hasFinalAmountSubmission = (booking) =>
  Number(booking?.providerProposedAmount ?? booking?.finalAmount ?? 0) > 0;

export const getBookingDisplayStatus = (booking, options = {}) => {
  const audience = String(options?.audience || 'customer').toLowerCase();
  const surface = String(options?.surface || 'default').toLowerCase();
  const status = normalizeStatus(booking?.status);
  const paymentStatus = normalizeStatus(booking?.paymentStatus);
  const submittedFinalAmount = hasFinalAmountSubmission(booking);

  if (paymentStatus === 'DISPUTED') {
    return {
      code: BOOKING_STATUS.PAYMENT_DISPUTED,
      label: 'Payment disputed',
      tone: 'danger',
      description: 'Customer disputed the final amount/payment.',
    };
  }

  if (status === 'CANCELLED' && normalizeStatus(booking?.cancelledBy) === 'SYSTEM') {
    return {
      code: BOOKING_STATUS.EXPIRED,
      label: 'Expired',
      tone: 'neutral',
      description: 'No provider accepted before the scheduled arrival window expired.',
    };
  }

  if (
    status === BOOKING_STATUS.IN_PROGRESS &&
    (paymentStatus === 'AWAITING_CONFIRMATION' ||
      (submittedFinalAmount && !booking?.customerConfirmedAt)) &&
    submittedFinalAmount &&
    !booking?.customerConfirmedAt
  ) {
    const byAudience = {
      customer: 'Provider submitted final amount. Please confirm or dispute.',
      provider: 'Waiting for customer to confirm payment.',
      admin: 'Final amount submitted; customer confirmation pending.',
    };
    return {
      code: BOOKING_STATUS.AWAITING_CONFIRMATION,
      label: 'Awaiting customer confirmation',
      tone: 'warning',
      description: byAudience[audience] || byAudience.customer,
    };
  }

  if (status === BOOKING_STATUS.PENDING && !booking?.providerId) {
    if (surface === 'nearby' && audience === 'provider') {
      return {
        code: BOOKING_STATUS.NEW_REQUEST,
        label: 'New request',
        tone: 'primary',
        description: 'This request is available for nearby eligible providers.',
      };
    }
    return {
      code: BOOKING_STATUS.PROVIDER_SEARCHING,
      label: 'Provider searching',
      tone: 'warning',
      description: 'Waiting for an eligible provider to accept.',
    };
  }

  if (status === BOOKING_STATUS.ACCEPTED) {
    return {
      code: BOOKING_STATUS.ACCEPTED,
      label: 'Provider accepted',
      tone: 'primary',
      description: 'Provider accepted your booking.',
    };
  }

  if (status === BOOKING_STATUS.IN_PROGRESS) {
    return {
      code: BOOKING_STATUS.IN_PROGRESS,
      label: 'Work in progress',
      tone: 'secondary',
      description: 'The provider is working on your service.',
    };
  }

  if (status === BOOKING_STATUS.COMPLETED && paymentStatus === 'PAID') {
    return {
      code: BOOKING_STATUS.COMPLETED,
      label: 'Completed',
      tone: 'success',
      description: 'Service completed and payment confirmed.',
    };
  }

  if (status === BOOKING_STATUS.EXPIRED) {
    return {
      code: BOOKING_STATUS.EXPIRED,
      label: 'Expired',
      tone: 'neutral',
      description: 'The scheduled service time passed before the booking could move forward.',
    };
  }

  if (status === BOOKING_STATUS.CANCELLED) {
    return {
      code: BOOKING_STATUS.CANCELLED,
      label: 'Cancelled',
      tone: 'danger',
      description: 'Booking was cancelled.',
    };
  }

  const fallbackCode = status || BOOKING_STATUS.PENDING;
  const fallbackMeta = BOOKING_STATUS_META[fallbackCode];
  return {
    code: fallbackCode,
    label: fallbackMeta?.label || formatFallback(fallbackCode),
    tone: fallbackMeta?.tone || 'neutral',
    description: 'Booking status updated.',
  };
};

export const deriveBookingStatusForDisplay = (booking, options = {}) =>
  getBookingDisplayStatus(booking, options).code;
