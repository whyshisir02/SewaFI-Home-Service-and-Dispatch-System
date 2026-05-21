import { useQuery } from '@tanstack/react-query';
import { serviceApi } from '../api/service.api';

export const useServices = (params) =>
  useQuery({
    queryKey: ['services', params],
    queryFn: () => serviceApi.list(params),
  });

export const useServiceDetails = (id, params) =>
  useQuery({
    queryKey: ['service-details', id, params],
    queryFn: () => serviceApi.details(id, params),
    enabled: Boolean(id),
  });
