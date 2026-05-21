export const getProviderName = (provider) =>
  provider?.user?.fullName
  || provider?.user?.name
  || provider?.fullName
  || provider?.name
  || 'Provider';

export const getProviderAvatar = (provider) =>
  provider?.user?.avatarUrl || provider?.user?.avatar || provider?.avatarUrl || provider?.avatar || '';

export const getProviderCategoryName = (provider) =>
  provider?.category?.name
  || provider?.serviceCategory?.name
  || provider?.serviceCategory
  || provider?.categoryName
  || '';

export const getProviderRatingValue = (provider) => {
  const raw = provider?.rating ?? provider?.averageRating ?? provider?.providerProfile?.averageRating;
  if (raw == null) return null;
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
};

export const getProviderReviewsCount = (provider) => {
  const raw = provider?.totalReviews ?? provider?.reviewsCount;
  if (raw == null) return null;
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
};

export const getProviderCompletedJobs = (provider) => {
  const raw = provider?.completedJobs ?? provider?.totalJobs ?? provider?.providerProfile?.totalJobs;
  if (raw == null) return null;
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
};

export const getProviderExperienceYears = (provider) => {
  const raw = provider?.experienceYears ?? provider?.experience;
  if (raw == null) return null;
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
};

export const getProviderAvailabilityLabel = (provider) => {
  if (typeof provider?.isAvailable === 'boolean') {
    return provider.isAvailable ? 'Available' : 'Unavailable';
  }
  if (typeof provider?.isCurrentlyBusy === 'boolean') {
    return provider.isCurrentlyBusy ? 'Busy' : 'Available';
  }
  if (typeof provider?.availability === 'string' && provider.availability.trim()) {
    return provider.availability;
  }
  return '';
};

export const getProviderStatus = (provider) => provider?.status || provider?.providerStatus || '';

export const getProviderBio = (provider) => provider?.bio || provider?.about || '';

export const getProviderJoinedAt = (provider) => provider?.joinedAt || provider?.createdAt || provider?.user?.createdAt || '';

export const getProviderSkills = (provider) => {
  const skillsFromSubCategories = Array.isArray(provider?.subCategories)
    ? provider.subCategories
      .map((item) => item?.subCategory?.name || item?.name)
      .filter(Boolean)
    : [];

  const skillsFromExpertise = Array.isArray(provider?.expertise)
    ? provider.expertise.filter(Boolean)
    : typeof provider?.expertise === 'string'
      ? provider.expertise.split(',').map((item) => item.trim()).filter(Boolean)
      : [];

  return [...new Set([...skillsFromSubCategories, ...skillsFromExpertise])];
};

export const getProviderAreas = (provider) => {
  if (Array.isArray(provider?.serviceAreas) && provider.serviceAreas.length) {
    return provider.serviceAreas
      .map((area) => [area?.province, area?.district, area?.municipality].filter(Boolean).join(', '))
      .filter(Boolean);
  }

  if (Array.isArray(provider?.workingAreas)) {
    return provider.workingAreas.map((item) => String(item || '').trim()).filter(Boolean);
  }

  return [];
};

export const getProviderServiceItems = (provider) => {
  if (!Array.isArray(provider?.services)) return [];
  return provider.services
    .map((item) => ({
      id: item?.id || item?.serviceId,
      name: item?.name || item?.service?.name,
      description: item?.description || item?.service?.description,
      price: item?.basePrice ?? item?.price ?? item?.service?.basePrice,
    }))
    .filter((item) => item.name);
};

export const providerStatusText = (status) => {
  switch (status) {
    case 'APPROVED':
      return 'Verified Provider';
    case 'PENDING_APPROVAL':
      return 'Under Review';
    case 'SUSPENDED':
      return 'Unavailable';
    case 'REJECTED':
      return 'Not Available';
    default:
      return status || 'Unknown';
  }
};

