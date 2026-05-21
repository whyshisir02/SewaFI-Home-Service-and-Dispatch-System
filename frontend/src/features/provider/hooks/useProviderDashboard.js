import { useQuery } from '@tanstack/react-query';
import { providerApi } from '../api/provider.api';

export const useProviderDashboard = () =>
  useQuery({
    queryKey: ['provider-dashboard'],
    queryFn: providerApi.summary,
  });
