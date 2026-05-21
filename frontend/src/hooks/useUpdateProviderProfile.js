import { useMutation, useQueryClient } from '@tanstack/react-query';
import { providerApi } from '../features/provider/api/provider.api';
import { api, unwrapResponse } from '../lib/axios';

const updateUserAddress = async (payload) => {
  const response = await api.patch('/users/me', payload);
  return unwrapResponse(response);
};

export const useUpdateProviderProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ providerPayload, userPayload }) => {
      const tasks = [];

      if (providerPayload && Object.keys(providerPayload).length) {
        tasks.push(providerApi.updateProfile(providerPayload));
      }

      if (userPayload && Object.keys(userPayload).length) {
        tasks.push(updateUserAddress(userPayload));
      }

      const results = await Promise.all(tasks);
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-profile-status'] });
      queryClient.invalidateQueries({ queryKey: ['provider-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['provider-profile'] });
    },
  });
};

export default useUpdateProviderProfile;
