import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../api/public.api';
import { isMissingEndpoint } from '../../../lib/endpointFallback';
import { toArray } from '../../../utils/collection';

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

export const usePublicStats = () =>
  useQuery({
    queryKey: ['about', 'public-stats'],
    // TODO: Connect About stats cards when a stable public stats endpoint is available.
    queryFn: async () => (await publicApi.stats()) || null,
    staleTime: 5 * 60_000,
    retry: 1,
  });

export const useCoverageCities = () =>
  useQuery({
    queryKey: ['about', 'coverage'],
    queryFn: async () => {
      try {
        const payload = await publicApi.coverage();
        return toArray(payload, ['cities', 'coverage', 'locations']);
      } catch (error) {
        if (isMissingEndpoint(error)) {
          // TODO: Connect About coverage chips when GET /api/v1/public/coverage is available.
          return [];
        }

        throw error;
      }
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

export const normalizePublicStats = (stats) => {
  if (!stats || typeof stats !== 'object') return [];

  const items = [
    { key: 'completedBookings', label: 'Completed Bookings', value: firstDefined(stats.completedBookings, stats.totalCompletedBookings) },
    { key: 'verifiedProviders', label: 'Verified Providers', value: firstDefined(stats.verifiedProviders, stats.activeProviders) },
    { key: 'serviceCategories', label: 'Service Categories', value: firstDefined(stats.serviceCategories, stats.totalServiceCategories) },
    { key: 'activeCities', label: 'Active Cities', value: firstDefined(stats.activeCities, stats.coveredCities) },
    { key: 'averageRating', label: 'Average Rating', value: firstDefined(stats.averageRating, stats.rating) },
  ];

  return items.filter((item) => item.value !== undefined && item.value !== null);
};

