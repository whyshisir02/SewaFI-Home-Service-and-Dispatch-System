import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { providerApi } from '../api/provider.api';

const PROVIDER_AREAS_QUERY_KEY = ['provider', 'areas'];

export const useProviderAreas = () =>
  useQuery({
    queryKey: PROVIDER_AREAS_QUERY_KEY,
    queryFn: providerApi.listAreas,
  });

export const useProviderAreaActions = () => {
  const queryClient = useQueryClient();

  const invalidateRelated = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: PROVIDER_AREAS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ['provider-profile'] }),
      queryClient.invalidateQueries({ queryKey: ['provider-dashboard'] }),
    ]);
  };

  const addAreaMutation = useMutation({
    mutationFn: providerApi.addArea,
    onSuccess: invalidateRelated,
  });

  const removeAreaMutation = useMutation({
    mutationFn: providerApi.removeArea,
    onSuccess: invalidateRelated,
  });

  return {
    addAreaMutation,
    removeAreaMutation,
  };
};

export { PROVIDER_AREAS_QUERY_KEY };
