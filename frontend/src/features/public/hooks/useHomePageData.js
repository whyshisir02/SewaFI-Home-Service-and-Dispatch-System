import { useQuery } from '@tanstack/react-query';
import { locationApi } from '../../location/api/location.api';
import { publicApi } from '../api/public.api';
import { serviceApi } from '../../services/api/service.api';
import { toArray } from '../../../utils/collection';

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
      const payload = await locationApi.provinces();
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
      const payload = await publicApi.faqs({ showOnHome: true, limit: 6 });
      return toArray(payload, ['faqs']).filter((faq) => faq?.isActive !== false);
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

export const useSiteSettings = () =>
  useQuery({
    queryKey: ['home', 'site-settings'],
    queryFn: async () => {
      const payload = await publicApi.siteSettings();
      return payload && typeof payload === 'object' ? payload : {};
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
