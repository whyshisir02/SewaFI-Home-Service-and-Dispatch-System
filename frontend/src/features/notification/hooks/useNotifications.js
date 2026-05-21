import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../api/notification.api';

const toArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

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
      const payload = await notificationApi.list({ role, ...filters });
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

  const unreadCountQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationApi.unreadCount,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  return {
    notificationsQuery,
    unreadCountQuery,
    markAsReadMutation,
    markAllAsReadMutation,
    deleteNotificationMutation,
  };
};
