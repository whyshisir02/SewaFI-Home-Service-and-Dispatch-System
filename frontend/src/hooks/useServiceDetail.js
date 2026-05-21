import { useQuery } from '@tanstack/react-query';
import { api, unwrapResponse } from '../lib/axios';
import { serviceApi } from '../features/services/api/service.api';

const toArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const normalizeDetail = (payload) => {
  const service = payload?.service || payload?.item || payload;
  const providers = toArray(payload, ['providers']);

  return {
    service,
    providers,
  };
};

export const useServiceDetail = (serviceParam) =>
  useQuery({
    queryKey: ['service-detail', serviceParam],
    queryFn: async () => normalizeDetail(await serviceApi.details(serviceParam)),
    enabled: Boolean(serviceParam),
    staleTime: 5 * 60_000,
    retry: 1,
  });

export const useRelatedServices = (service) =>
  useQuery({
    queryKey: ['related-services', service?.id, service?.categoryId],
    queryFn: async () => {
      // TODO: Replace with GET /api/v1/services/:id/related when the backend endpoint is added.
      const payload = await serviceApi.list({ category: service.categoryId });
      return toArray(payload, ['services'])
        .filter((item) => item?.id && item.id !== service.id && item?.isActive !== false)
        .slice(0, 4);
    },
    enabled: Boolean(service?.id && service?.categoryId),
    staleTime: 5 * 60_000,
    retry: 1,
  });

export const useServiceFaqs = (serviceId) =>
  useQuery({
    queryKey: ['service-faqs', serviceId],
    queryFn: async () => {
      try {
        // TODO: Connect to GET /api/v1/services/:id/faqs when the backend endpoint is added.
        const payload = await api.get(`/services/${serviceId}/faqs`).then(unwrapResponse);
        return toArray(payload, ['faqs']).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      } catch (error) {
        if (error?.response?.status === 404) return [];
        throw error;
      }
    },
    enabled: Boolean(serviceId),
    staleTime: 5 * 60_000,
    retry: 1,
  });
