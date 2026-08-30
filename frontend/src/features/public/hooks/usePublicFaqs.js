import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../api/public.api';
import { isMissingEndpoint } from '../../../lib/endpointFallback';
import { toArray } from '../../../utils/collection';

export const usePublicFaqs = (section) =>
  useQuery({
    queryKey: ['public-faqs', section],
    queryFn: async () => {
      try {
        const payload = await publicApi.faqs({ section });
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
