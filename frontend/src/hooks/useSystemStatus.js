import { useQuery } from '@tanstack/react-query';
import { api, unwrapResponse } from '../lib/axios';

const STATUS_ENDPOINTS = [
  '/public/status',
  '/system/status',
  '/public/maintenance',
];

const isMissingEndpoint = (error) => error?.response?.status === 404;

const loadSystemStatus = async () => {
  for (const endpoint of STATUS_ENDPOINTS) {
    try {
      const response = await api.get(endpoint);
      const payload = unwrapResponse(response);
      return payload || null;
    } catch (error) {
      if (isMissingEndpoint(error)) continue;
      throw error;
    }
  }

  return null;
};

export const useSystemStatus = () =>
  useQuery({
    queryKey: ['system-status'],
    queryFn: loadSystemStatus,
    retry: 1,
    staleTime: 60_000,
  });

export default useSystemStatus;
