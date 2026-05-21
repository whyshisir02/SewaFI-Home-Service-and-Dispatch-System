import { useQuery } from '@tanstack/react-query';
import { api, unwrapResponse } from '../lib/axios';

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

export const usePublicFaqs = (section) =>
  useQuery({
    queryKey: ['public-faqs', section],
    queryFn: async () => {
      try {
        const payload = await api.get('/public/faqs', { params: { section } }).then(unwrapResponse);
        return toArray(payload, ['faqs']).filter((faq) => faq?.isActive !== false);
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
