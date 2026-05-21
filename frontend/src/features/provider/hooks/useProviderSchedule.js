import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { providerApi } from '../api/provider.api';

export const useProviderSchedule = () => {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ['provider', 'profile'],
    queryFn: providerApi.profile,
  });

  const updateScheduleMutation = useMutation({
    mutationFn: providerApi.updateSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['provider-profile'] });
      queryClient.invalidateQueries({ queryKey: ['provider-dashboard'] });
    },
  });

  return { profileQuery, updateScheduleMutation };
};
