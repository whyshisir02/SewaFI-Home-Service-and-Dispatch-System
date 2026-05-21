import { useQuery } from '@tanstack/react-query';
import { serviceApi } from '../features/services/api/service.api';

const toArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

export const useCategoryServices = ({ categoryId, categorySlug, search }) =>
  useQuery({
    queryKey: ['category-services', categoryId, categorySlug, search],
    queryFn: async () => {
      const payload = await serviceApi.list({
        ...(categoryId ? { category: categoryId } : {}),
        ...(!categoryId && categorySlug ? { categorySlug } : {}),
        ...(search ? { search } : {}),
      });

      return toArray(payload, ['services']).filter((service) => service?.isActive !== false);
    },
    enabled: Boolean(categoryId || categorySlug),
    retry: 1,
    staleTime: 5 * 60_000,
  });

export default useCategoryServices;
