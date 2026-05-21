import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrapResponse } from '../../../lib/axios';

const isMissingEndpoint = (error) => error?.response?.status === 404;

const endpointError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const toArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const tryEndpoints = async (handlers, missingCode, missingMessage) => {
  let missing = 0;
  for (const handler of handlers) {
    try {
      return await handler();
    } catch (error) {
      if (isMissingEndpoint(error)) {
        missing += 1;
        continue;
      }
      throw error;
    }
  }
  if (missing === handlers.length) {
    throw endpointError(missingCode, missingMessage);
  }
  throw new Error(missingMessage);
};

const profileApi = {
  me: () => api.get('/users/me').then(unwrapResponse),
  updateMe: (payload) => api.patch('/users/me', payload).then(unwrapResponse),
  uploadAvatar: (file) => {
    const data = new FormData();
    data.append('avatar', file);
    return api.patch('/users/me/avatar', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrapResponse);
  },
  updateProviderProfile: (payload) => api.patch('/users/provider/profile', payload).then(unwrapResponse),
  changePassword: (payload) =>
    tryEndpoints(
      [
        () => api.patch('/auth/change-password', payload).then(unwrapResponse),
        () => api.post('/auth/change-password', payload).then(unwrapResponse),
      ],
      'CHANGE_PASSWORD_ENDPOINT_MISSING',
      'Password change endpoint is not available yet.'
    ),
  getPreferences: () =>
    tryEndpoints(
      [() => api.get('/users/me/preferences').then(unwrapResponse)],
      'PREFERENCES_ENDPOINT_MISSING',
      'Preferences endpoint is not available yet.'
    ),
  updatePreferences: (payload) =>
    tryEndpoints(
      [() => api.patch('/users/me/preferences', payload).then(unwrapResponse)],
      'PREFERENCES_ENDPOINT_MISSING',
      'Preferences endpoint is not available yet.'
    ),
};

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

