import { useQuery } from '@tanstack/react-query';
import { serviceApi } from '../api/service.api';
import { locationApi } from '../../location/api/location.api';
import { toArray } from '../../../utils/collection';

const extractMeta = (payload, fallbackLength = 0) => {
  const meta = payload?.meta || payload?.pagination || {};
  return {
    total: meta.total ?? payload?.total ?? fallbackLength,
    page: meta.page ?? payload?.page,
    limit: meta.limit ?? payload?.limit,
    totalPages: meta.totalPages ?? payload?.totalPages,
  };
};

export const normalizeServicesPayload = (payload) => {
  const services = toArray(payload, ['services']).filter((service) => service?.isActive !== false);
  return {
    services,
    meta: extractMeta(payload, services.length),
  };
};

export const usePublicServices = (params) =>
  useQuery({
    queryKey: ['public-services', params],
    queryFn: async () => {
      const supportedParams = {
        ...(params.search ? { search: params.search } : {}),
        ...(params.category ? { category: params.category } : {}),
        ...(params.sort ? { sort: params.sort } : {}),
        ...(params.minPrice ? { minPrice: params.minPrice } : {}),
        ...(params.maxPrice ? { maxPrice: params.maxPrice } : {}),
        ...(params.page ? { page: params.page } : {}),
        ...(params.limit ? { limit: params.limit } : {}),
      };
      const payload = await serviceApi.list(supportedParams);
      return normalizeServicesPayload(payload);
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

export const usePublicServiceCategories = () =>
  useQuery({
    queryKey: ['public-service-categories'],
    queryFn: async () => {
      const payload = await serviceApi.categories();
      return toArray(payload, ['categories']).filter((category) => category?.isActive !== false);
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

export const useServiceLocations = () =>
  useQuery({
    queryKey: ['service-locations', 'provinces'],
    queryFn: async () => {
      const payload = await locationApi.provinces();
      return toArray(payload, ['locations', 'provinces']).map((location) =>
        typeof location === 'string' ? { id: location, name: location } : location
      );
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
