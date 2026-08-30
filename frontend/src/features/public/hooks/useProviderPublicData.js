import { useQuery } from '@tanstack/react-query';
import { isMissingEndpoint } from '../../../lib/endpointFallback';
import { serviceApi } from '../../services/api/service.api';
import { publicApi } from '../api/public.api';
import { toArray } from '../../../utils/collection';

export const useProviderCategories = () =>
  useQuery({
    queryKey: ['provider-public', 'categories'],
    queryFn: async () => {
      const payload = await serviceApi.categories();
      return toArray(payload, ['categories']).filter((category) => category?.isActive !== false);
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

export const useProviderFaqs = () =>
  useQuery({
    queryKey: ['provider-public', 'faqs'],
    queryFn: async () => {
      try {
        const payload = await publicApi.faqs({ section: 'provider' });
        return toArray(payload, ['faqs']).filter((item) => item?.isActive !== false);
      } catch (error) {
        if (isMissingEndpoint(error)) {
          return [];
        }

        throw error;
      }
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
