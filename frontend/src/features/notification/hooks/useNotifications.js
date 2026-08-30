import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../api/notification.api';
import { toArray } from '../../../utils/collection';

const extractMeta = (payload, fallbackLength) => {
  const meta = payload?.meta || payload?.pagination || {};
  return {
    total: meta.total ?? payload?.total ?? fallbackLength,
    page: meta.page ?? payload?.page ?? 1,
    limit: meta.limit ?? payload?.limit ?? fallbackLength,
    totalPages: meta.totalPages ?? payload?.totalPages ?? 1,
    hasMore: meta.hasMore ?? payload?.hasMore ?? false,
  };
};

const normalizeListPayload = (payload) => {
  const notifications = toArray(payload, ['notifications']);
  return {
    notifications,
    meta: extractMeta(payload, notifications.length),
  };
};

export const useNotifications = ({ role, filters } = {}) => {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['notifications', role, filters],
    queryFn: async () => {
      const payload = await notificationApi.getNotifications({ role, ...filters });
      return normalizeListPayload(payload);
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: notificationApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const archiveNotificationMutation = useMutation({
    mutationFn: notificationApi.archiveNotification,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unarchiveNotificationMutation = useMutation({
    mutationFn: notificationApi.unarchiveNotification,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const archiveReadNotificationsMutation = useMutation({
    mutationFn: notificationApi.archiveReadNotifications,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCountQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationApi.getUnreadCount,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const pushConfigQuery = useQuery({
    queryKey: ['notifications', 'push-config'],
    queryFn: notificationApi.getPushPublicKey,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const subscribePushMutation = useMutation({
    mutationFn: notificationApi.subscribeToPush,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', 'push-config'] }),
  });

  const unsubscribePushMutation = useMutation({
    mutationFn: notificationApi.unsubscribeFromPush,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', 'push-config'] }),
  });

  const sendTestPushMutation = useMutation({
    mutationFn: notificationApi.sendTestPush,
  });

  return {
    notificationsQuery,
    unreadCountQuery,
    pushConfigQuery,
    markAsReadMutation,
    markAllAsReadMutation,
    archiveNotificationMutation,
    unarchiveNotificationMutation,
    archiveReadNotificationsMutation,
    deleteNotificationMutation,
    subscribePushMutation,
    unsubscribePushMutation,
    sendTestPushMutation,
  };
};
