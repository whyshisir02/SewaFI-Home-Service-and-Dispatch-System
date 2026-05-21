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

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

const isMissingEndpoint = (error) => error?.response?.status === 404;

export const usePublicStats = () =>
  useQuery({
    queryKey: ['about', 'public-stats'],
    queryFn: async () => {
      const endpoints = ['/public/stats', '/admin/public-stats', '/public/about-stats'];

      for (const endpoint of endpoints) {
        try {
          const payload = await api.get(endpoint).then(unwrapResponse);
          return payload || null;
        } catch (error) {
          if (!isMissingEndpoint(error)) {
            throw error;
          }
        }
      }

      // TODO: Connect About stats cards when a stable public stats endpoint is available.
      return null;
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

export const useCoverageCities = () =>
  useQuery({
    queryKey: ['about', 'coverage'],
    queryFn: async () => {
      try {
        const payload = await api.get('/public/coverage').then(unwrapResponse);
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

