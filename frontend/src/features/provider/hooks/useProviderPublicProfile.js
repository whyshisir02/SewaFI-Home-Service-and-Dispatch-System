import { useQuery } from '@tanstack/react-query';
import { providerPublicApi } from '../api/providerPublic.api';
import { reviewApi } from '../../review/api/review.api';
import { toArray } from '../../../utils/collection';

export const useProviderPublicProfile = (providerId) =>
  useQuery({
    queryKey: ['provider-public-profile', providerId],
    queryFn: () => providerPublicApi.profile(providerId),
    enabled: Boolean(providerId),
    staleTime: 3 * 60_000,
    retry: 1,
  });

export const useProviderPublicReviews = (providerId) =>
  useQuery({
    queryKey: ['provider-public-reviews', providerId],
    queryFn: async () => {
      const payload = await reviewApi.provider(providerId);
      return toArray(payload, ['reviews']);
    },
    enabled: Boolean(providerId),
    staleTime: 2 * 60_000,
    retry: 1,
  });

