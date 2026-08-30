import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../../profile/api/profile.api';
import { providerApi } from '../api/provider.api';

export const useUpdateProviderProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ providerPayload, userPayload }) => {
      const tasks = [];

      if (providerPayload && Object.keys(providerPayload).length) {
        tasks.push(providerApi.updateProfile(providerPayload));
      }

      if (userPayload && Object.keys(userPayload).length) {
        tasks.push(profileApi.updateMe(userPayload));
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
