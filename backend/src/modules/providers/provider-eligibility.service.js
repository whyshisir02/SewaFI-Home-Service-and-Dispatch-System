const normalizeId = (value) => String(value || '').trim();

const getActiveProviderServiceIds = (profile) => {
  const ids = (profile?.services || [])
    .filter((item) => item && item.isActive !== false)
    .map((item) => normalizeId(item.serviceId))
    .filter(Boolean);

  return Array.from(new Set(ids));
};

const providerMatchesService = (profile, service) => {
  const providerCategoryId = normalizeId(profile?.categoryId);
  const serviceCategoryId = normalizeId(service?.categoryId);
  const serviceId = normalizeId(service?.id);
  const providerServiceIds = getActiveProviderServiceIds(profile);

  const sameCategory = Boolean(
    providerCategoryId && serviceCategoryId && providerCategoryId === serviceCategoryId
  );
  const hasSelectedServices = providerServiceIds.length > 0;
  const sameService = Boolean(serviceId && providerServiceIds.includes(serviceId));

  return {
    sameCategory,
    hasSelectedServices,
    sameService,
    matches: sameCategory && sameService,
  };
};

module.exports = {
  getActiveProviderServiceIds,
  providerMatchesService,
};
