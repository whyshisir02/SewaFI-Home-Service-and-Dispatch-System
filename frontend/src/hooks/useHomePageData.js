import { useQuery } from '@tanstack/react-query';
import { api, unwrapResponse } from '../lib/axios';
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

export const useFeaturedServices = () =>
  useQuery({
    queryKey: ['home', 'featured-services'],
    queryFn: async () => {
      const payload = await serviceApi.list({ featured: true, limit: 8 });
      return toArray(payload, ['services'])
        .filter((service) => service?.isActive !== false)
        .slice(0, 8);
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

export const useHomeServiceCategories = () =>
  useQuery({
    queryKey: ['home', 'service-categories'],
    queryFn: async () => {
      const payload = await serviceApi.categories();
      return toArray(payload, ['categories']).filter((category) => category?.isActive !== false);
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

export const useCoverageLocations = () =>
  useQuery({
    queryKey: ['home', 'coverage-locations'],
    queryFn: async () => {
      // TODO: Connect this section to GET /api/v1/public/coverage when backend endpoint is ready.
      const payload = await api.get('/locations/provinces').then(unwrapResponse);
      return toArray(payload, ['cities', 'locations', 'provinces']).map((item) =>
        typeof item === 'string' ? { id: item, name: item, isActive: true } : item
      );
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

export const useHomeFaqs = () =>
  useQuery({
    queryKey: ['home', 'faqs'],
    queryFn: async () => {
      const payload = await api
        .get('/public/faqs', { params: { showOnHome: true, limit: 6 } })
        .then(unwrapResponse);
      return toArray(payload, ['faqs']).filter((faq) => faq?.isActive !== false);
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

export const useSiteSettings = () =>
  useQuery({
    queryKey: ['home', 'site-settings'],
    queryFn: async () => {
      const payload = await api.get('/public/site-settings').then(unwrapResponse);
      return payload && typeof payload === 'object' ? payload : {};
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
