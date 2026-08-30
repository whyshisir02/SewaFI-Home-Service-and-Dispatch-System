export const ACTIVE_BOOKING_STATUSES = ['PENDING', 'ACCEPTED', 'IN_PROGRESS'];

export const getService = (booking) => booking?.service || booking?.serviceDetails || {};

export const getServiceName = (booking) => getService(booking)?.name || booking?.serviceName || 'Service booking';

export const getProviderName = (booking) => {
  const provider = booking?.provider || booking?.providerProfile;
  const user = provider?.user || {};
  return provider?.fullName || provider?.name || user?.fullName || user?.name || null;
};

export const getBookingDate = (booking) => booking?.scheduledTime || booking?.scheduledAt || booking?.preferredDate || booking?.createdAt;

export const getAmount = (booking) => {
  if (booking?.finalPrice != null) return { label: 'Final', value: booking.finalPrice };
  if (booking?.totalPrice != null) return { label: 'Total', value: booking.totalPrice };
  if (booking?.estimatedPrice != null) return { label: 'Estimated', value: booking.estimatedPrice };
  if (booking?.basePrice != null) return { label: 'Estimated', value: booking.basePrice };
  return null;
};

export const getLocationSummary = (booking) => {
  const parts = [
    booking?.address,
    booking?.addressLine,
    booking?.municipality,
    booking?.district,
    booking?.province,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Location not available';
};

export const sortByRecent = (items = []) =>
  [...items].sort((a, b) => new Date(b?.updatedAt || b?.createdAt || 0) - new Date(a?.updatedAt || a?.createdAt || 0));

// TODO: Replace derived dashboard stats with a full customer dashboard status breakdown when the backend exposes one.
export const deriveStats = (bookings = []) => ({
  active: bookings.filter((booking) => ACTIVE_BOOKING_STATUSES.includes(booking?.status)).length,
  completed: bookings.filter((booking) => booking?.status === 'COMPLETED').length,
  pending: bookings.filter((booking) => booking?.status === 'PENDING' || ['QUEUED', 'SEARCHING', 'NOTIFIED'].includes(booking?.dispatchState)).length,
  cancelled: bookings.filter((booking) => booking?.status === 'CANCELLED').length,
});
