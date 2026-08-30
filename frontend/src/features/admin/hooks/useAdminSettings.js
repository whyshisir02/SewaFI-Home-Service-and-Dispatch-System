import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminSettingsApi } from '../api/adminSettings.api';

export const useAdminSettings = () => {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ['admin-settings', 'me'],
    queryFn: adminSettingsApi.me,
  });

  const platformQuery = useQuery({
    queryKey: ['admin-settings', 'platform'],
    queryFn: adminSettingsApi.platform,
    retry: 1,
  });

  const contactQuery = useQuery({
    queryKey: ['admin-settings', 'contact'],
    queryFn: adminSettingsApi.contact,
    retry: 1,
  });

  const bookingQuery = useQuery({
    queryKey: ['admin-settings', 'booking'],
    queryFn: adminSettingsApi.booking,
    retry: 1,
  });

  const notificationsQuery = useQuery({
    queryKey: ['admin-settings', 'notifications'],
    queryFn: adminSettingsApi.notifications,
    retry: 1,
  });

  const securityQuery = useQuery({
    queryKey: ['admin-settings', 'security'],
    queryFn: adminSettingsApi.security,
    retry: 1,
  });

  const updateProfileMutation = useMutation({
    mutationFn: adminSettingsApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings', 'me'] });
    },
  });

  const updatePlatformMutation = useMutation({
    mutationFn: adminSettingsApi.updatePlatform,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings', 'platform'] });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: adminSettingsApi.updateContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings', 'contact'] });
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: adminSettingsApi.updateBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings', 'booking'] });
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: adminSettingsApi.updateNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings', 'notifications'] });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: adminSettingsApi.changePassword,
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
