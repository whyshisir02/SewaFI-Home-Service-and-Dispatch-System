import { useQuery } from '@tanstack/react-query';
import { serviceApi } from '../api/service.api';
import { toArray } from '../../../utils/collection';

export const useServices = (params, options = {}) =>
  useQuery({
    queryKey: ['services', params],
    queryFn: async () => {
      const payload = await serviceApi.list(params);
      return toArray(payload, ['services']);
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
      return toArray(payload, ['services']);
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
