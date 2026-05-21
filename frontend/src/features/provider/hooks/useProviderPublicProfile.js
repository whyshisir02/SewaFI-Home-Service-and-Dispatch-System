import { useQuery } from '@tanstack/react-query';
import { providerPublicApi } from '../api/providerPublic.api';
import { reviewApi } from '../../review/api/review.api';

const toArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

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

