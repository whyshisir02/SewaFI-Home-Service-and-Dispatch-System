import { useQuery } from '@tanstack/react-query';
import { serviceApi } from '../api/service.api';

const normalizeServices = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.services)) return payload.services;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const useServices = (params, options = {}) =>
  useQuery({
    queryKey: ['services', params],
    queryFn: async () => {
      const payload = await serviceApi.list(params);
      return normalizeServices(payload);
    },
    enabled: options.enabled ?? true,
    staleTime: options.staleTime ?? 60_000,
  });

export const useServicesByCategory = (categoryId, params = {}, options = {}) =>
  useQuery({
    queryKey: ['services', 'by-category', categoryId, params],
    queryFn: async () => {
      const payload = await serviceApi.list({
        ...params,
        category: categoryId,
      });
      return normalizeServices(payload);
    },
    enabled: Boolean(categoryId) && (options.enabled ?? true),
    staleTime: options.staleTime ?? 60_000,
  });

export const useServiceDetails = (id, params) =>
  useQuery({
    queryKey: ['service-details', id, params],
    queryFn: () => serviceApi.details(id, params),
    enabled: Boolean(id),
  });
