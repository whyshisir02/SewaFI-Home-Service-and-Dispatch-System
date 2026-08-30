import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../api/profile.api';
import { toArray } from '../../../utils/collection';

export const useProfileSettings = () => {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: profileApi.me,
    staleTime: 30_000,
  });

  const updateProfileMutation = useMutation({
    mutationFn: profileApi.updateMe,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', 'me'] }),
  });

  const updateProviderProfileMutation = useMutation({
    mutationFn: profileApi.updateProviderProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', 'me'] }),
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: profileApi.uploadAvatar,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', 'me'] }),
  });

  const changePasswordMutation = useMutation({
    mutationFn: profileApi.changePassword,
  });

  const preferencesQuery = useQuery({
    queryKey: ['profile', 'preferences'],
    queryFn: profileApi.getPreferences,
    retry: 1,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: profileApi.updatePreferences,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', 'preferences'] }),
  });

  return {
    profileQuery,
    updateProfileMutation,
    updateProviderProfileMutation,
    uploadAvatarMutation,
    changePasswordMutation,
    preferencesQuery,
    updatePreferencesMutation,
  };
};

export const profileHelpers = {
  toArray,
};

