import { useMemo } from 'react';
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

const normalizeText = (value) => String(value || '').trim().toLowerCase();

export const toCategorySlug = (value) =>
  normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const categoryMatchesSlug = (category, slug) => {
  const normalizedSlug = normalizeText(slug);
  if (!normalizedSlug) return false;

  const candidates = [
    category?.slug,
    category?.id,
    category?.name ? toCategorySlug(category.name) : '',
  ]
    .map(normalizeText)
    .filter(Boolean);

  return candidates.includes(normalizedSlug);
};

export const useServiceCategory = (slug) => {
  const categoriesQuery = useQuery({
    queryKey: ['public-service-category', slug],
    queryFn: async () => {
      if (!slug) return null;

      try {
        const payload = await serviceApi.categoryDetails(slug);
        if (payload?.isActive === false) return null;
        return payload;
      } catch (error) {
        if (error?.response?.status !== 404) {
          throw error;
        }

        // Backward-compatible fallback for environments that only expose category list.
        const payload = await serviceApi.categories();
        const categories = toArray(payload, ['categories']).filter((category) => category?.isActive !== false);
        const match = categories.find((item) => categoryMatchesSlug(item, slug)) || null;
        if (match) return match;
        throw error;
      }
    },
    enabled: Boolean(slug),
    retry: 1,
    staleTime: 5 * 60_000,
  });

  const category = useMemo(() => categoriesQuery.data || null, [categoriesQuery.data]);

  return {
    categoriesQuery,
    category,
  };
};

export default useServiceCategory;
