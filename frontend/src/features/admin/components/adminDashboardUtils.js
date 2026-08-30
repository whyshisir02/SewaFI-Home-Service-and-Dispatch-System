export const getUserName = (user) => user?.fullName || user?.name || user?.email || 'Admin';

export const getPersonName = (person) => person?.fullName || person?.name || person?.user?.fullName || person?.user?.name || 'Unnamed user';

export const getAvatar = (person) => person?.avatarUrl || person?.avatar || person?.user?.avatarUrl || person?.user?.avatar;

export const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'SF';

export const sortByRecent = (items = []) =>
  [...items].sort((a, b) => new Date(b?.createdAt || b?.updatedAt || 0) - new Date(a?.createdAt || a?.updatedAt || 0));

export const getBookingAmount = (booking) => {
  if (booking?.finalPrice != null) return { label: 'Final', value: booking.finalPrice };
  if (booking?.totalPrice != null) return { label: 'Total', value: booking.totalPrice };
  if (booking?.estimatedPrice != null) return { label: 'Estimated', value: booking.estimatedPrice };
  return null;
};

export const getBookingDate = (booking) => booking?.scheduledAt || booking?.scheduledTime || booking?.createdAt;

export const getProviderStatus = (provider) => provider?.providerProfile?.status || provider?.status;

export const getProviderCategory = (provider) => provider?.providerProfile?.category?.name || provider?.serviceCategory || provider?.category?.name;
