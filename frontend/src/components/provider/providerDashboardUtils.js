export const ACTIVE_PROVIDER_JOB_STATUSES = ['ACCEPTED', 'IN_PROGRESS'];

export const toArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

export const getProviderProfile = (profilePayload) => profilePayload?.providerProfile || profilePayload?.profile || profilePayload;

export const getProviderName = (user, profilePayload) => {
  const providerProfile = getProviderProfile(profilePayload);
  return user?.fullName || user?.name || profilePayload?.fullName || profilePayload?.name || providerProfile?.name || 'Provider';
};

export const parseAvailability = (availability) => {
  if (!availability) return { availableToday: false };
  if (typeof availability === 'object') return availability;
  try {
    return JSON.parse(availability);
  } catch {
    return { availableToday: !String(availability).toLowerCase().includes('unavailable') };
  }
};

export const isProviderAvailable = (providerProfile) => parseAvailability(providerProfile?.availability).availableToday !== false;

export const isProviderApproved = (providerProfile) => providerProfile?.status === 'APPROVED';

export const getServiceName = (job) => job?.service?.name || job?.serviceName || 'Service request';

export const getLocationSummary = (job) =>
  job?.areaLabel ||
  [job?.municipality, job?.district, job?.province].filter(Boolean).join(', ') ||
  job?.address ||
  'Customer area not available';

export const getJobDate = (job) => job?.scheduledTime || job?.scheduledAt || job?.preferredDate || job?.createdAt;

export const getAmount = (job) => {
  if (job?.finalPrice != null) return { label: 'Final', value: job.finalPrice };
  if (job?.totalPrice != null) return { label: 'Total', value: job.totalPrice };
  if (job?.estimatedPrice != null) return { label: 'Estimated', value: job.estimatedPrice };
  if (job?.basePrice != null) return { label: 'Estimated', value: job.basePrice };
  if (job?.service?.basePrice != null) return { label: 'Estimated', value: job.service.basePrice };
  return null;
};

export const getAssignedJobs = (jobs = [], providerId) =>
  jobs.filter((job) => {
    if (job?.providerId && providerId) return job.providerId === providerId;
    return ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(job?.status);
  });

export const sortByRecent = (items = []) =>
  [...items].sort((a, b) => new Date(b?.updatedAt || b?.createdAt || 0) - new Date(a?.updatedAt || a?.createdAt || 0));

export const deriveProviderStats = ({ nearbyJobs = [], assignedJobs = [], summary }) => {
  const completedFromJobs = assignedJobs.filter((job) => job?.status === 'COMPLETED').length;
  return {
    nearbyJobs: nearbyJobs.length,
    assignedJobs: assignedJobs.filter((job) => ACTIVE_PROVIDER_JOB_STATUSES.includes(job?.status)).length,
    completedJobs: summary?.profile?.totalJobs ?? summary?.earnings?.total?.count ?? completedFromJobs,
    todayEarnings: summary?.earnings?.today?.amount,
    rating: summary?.profile?.averageRating,
  };
};
