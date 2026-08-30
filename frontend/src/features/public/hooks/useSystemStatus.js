import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../api/public.api';

export const useSystemStatus = () =>
  useQuery({
    queryKey: ['system-status'],
    queryFn: () => publicApi.systemStatus(),
    retry: 1,
    staleTime: 60_000,
  });

export default useSystemStatus;
