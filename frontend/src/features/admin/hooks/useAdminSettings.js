import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrapResponse } from '../../../lib/axios';

const endpointMissing = (error) => error?.response?.status === 404 || error?.response?.status === 405;

const makeMissingError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const tryGetWithSource = async (paths, missingCode, missingMessage) => {
  let missingCount = 0;
  for (const path of paths) {
    try {
      const data = await api.get(path).then(unwrapResponse);
      return { data, source: path };
    } catch (error) {
      if (endpointMissing(error)) {
        missingCount += 1;
        continue;
      }
      throw error;
    }
  }
  if (missingCount === paths.length) throw makeMissingError(missingCode, missingMessage);
  throw new Error(missingMessage);
};

const tryGet = async (paths, missingCode, missingMessage) => {
  let missingCount = 0;
  for (const path of paths) {
    try {
      return await api.get(path).then(unwrapResponse);
    } catch (error) {
      if (endpointMissing(error)) {
        missingCount += 1;
        continue;
      }
      throw error;
    }
  }
  if (missingCount === paths.length) throw makeMissingError(missingCode, missingMessage);
  throw new Error(missingMessage);
};

const tryPatch = async (paths, payload, missingCode, missingMessage) => {
  let missingCount = 0;
  for (const path of paths) {
    try {
      return await api.patch(path, payload).then(unwrapResponse);
    } catch (error) {
      if (endpointMissing(error)) {
        missingCount += 1;
        continue;
      }
      throw error;
    }
  }
  if (missingCount === paths.length) throw makeMissingError(missingCode, missingMessage);
  throw new Error(missingMessage);
};

const tryPasswordChange = async (payload) => {
  try {
    return await api.patch('/auth/change-password', payload).then(unwrapResponse);
  } catch (error) {
    if (!endpointMissing(error)) throw error;
  }
  return api.post('/auth/change-password', payload).then(unwrapResponse);
};

export const useAdminSettings = () => {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ['admin-settings', 'me'],
    queryFn: () => api.get('/auth/me').then(unwrapResponse),
  });

  const platformQuery = useQuery({
    queryKey: ['admin-settings', 'platform'],
    queryFn: () =>
      tryGetWithSource(
        ['/admin/settings/site', '/public/site-settings'],
        'SITE_SETTINGS_UNAVAILABLE',
        'Platform settings are not configurable from the frontend yet.'
      ),
    retry: 1,
  });

  const contactQuery = useQuery({
    queryKey: ['admin-settings', 'contact'],
    queryFn: () =>
      tryGet(
        ['/admin/settings/contact'],
        'CONTACT_SETTINGS_UNAVAILABLE',
        'Contact settings are not configurable from the frontend yet.'
      ),
    retry: 1,
  });

  const bookingQuery = useQuery({
    queryKey: ['admin-settings', 'booking'],
    queryFn: () =>
      tryGet(
        ['/admin/settings/booking', '/admin/settings/dispatch'],
        'BOOKING_SETTINGS_UNAVAILABLE',
        'Dispatch configuration is managed by backend configuration.'
      ),
    retry: 1,
  });

  const notificationsQuery = useQuery({
    queryKey: ['admin-settings', 'notifications'],
    queryFn: () =>
      tryGet(
        ['/admin/settings/notifications'],
        'NOTIFICATION_SETTINGS_UNAVAILABLE',
        'Email delivery settings are managed from backend environment variables.'
      ),
    retry: 1,
  });

  const securityQuery = useQuery({
    queryKey: ['admin-settings', 'security'],
    queryFn: () =>
      tryGet(
        ['/admin/settings/security'],
        'SECURITY_SETTINGS_UNAVAILABLE',
        'Security settings are not configurable from the frontend yet.'
      ),
    retry: 1,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (payload) => tryPatch(['/users/me', '/profile'], payload, 'PROFILE_UPDATE_UNAVAILABLE', 'Profile update endpoint is unavailable.'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings', 'me'] });
    },
  });

  const updatePlatformMutation = useMutation({
    mutationFn: (payload) => tryPatch(['/admin/settings/site'], payload, 'SITE_SETTINGS_UNAVAILABLE', 'Platform settings endpoint is unavailable.'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings', 'platform'] });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: (payload) => tryPatch(['/admin/settings/contact'], payload, 'CONTACT_SETTINGS_UNAVAILABLE', 'Contact settings endpoint is unavailable.'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings', 'contact'] });
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: (payload) => tryPatch(['/admin/settings/booking', '/admin/settings/dispatch'], payload, 'BOOKING_SETTINGS_UNAVAILABLE', 'Booking settings endpoint is unavailable.'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings', 'booking'] });
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: (payload) => tryPatch(['/admin/settings/notifications'], payload, 'NOTIFICATION_SETTINGS_UNAVAILABLE', 'Notification settings endpoint is unavailable.'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings', 'notifications'] });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: tryPasswordChange,
  });

  return {
    meQuery,
    platformQuery,
    contactQuery,
    bookingQuery,
    notificationsQuery,
    securityQuery,
    updateProfileMutation,
    updatePlatformMutation,
    updateContactMutation,
    updateBookingMutation,
    updateNotificationsMutation,
    changePasswordMutation,
  };
};
