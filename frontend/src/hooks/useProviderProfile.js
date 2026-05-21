import { useQuery } from '@tanstack/react-query';
import { providerApi } from '../features/provider/api/provider.api';

export const useProviderProfile = () =>
  useQuery({
    queryKey: ['provider-profile-status'],
    queryFn: providerApi.profile,
    retry: 1,
    staleTime: 60_000,
  });

export default useProviderProfile;
