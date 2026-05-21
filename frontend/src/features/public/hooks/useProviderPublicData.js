import { useQuery } from '@tanstack/react-query';
import { api, unwrapResponse } from '../../../lib/axios';
import { serviceApi } from '../../services/api/service.api';

const toArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const isMissingEndpoint = (error) => error?.response?.status === 404;

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
        const payload = await api.get('/public/faqs', { params: { section: 'provider' } }).then(unwrapResponse);
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
