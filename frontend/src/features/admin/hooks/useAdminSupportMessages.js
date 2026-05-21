import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '../api/support.api';

const getArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const getMeta = (payload) =>
  payload?.pagination
  || payload?.meta
  || payload?.pageInfo
  || null;

const normalizeSupportItem = (item) => ({
  ...item,
  ticketCode: item?.ticketCode || item?.code || item?.id,
  fullName: item?.fullName || item?.name || item?.user?.fullName || item?.user?.name || '',
  topic: item?.topic || item?.category || '',
  subject: item?.subject || item?.title || '',
  status: item?.status || item?.state || '',
  priority: item?.priority || item?.severity || '',
  bookingCode: item?.bookingCode || item?.booking?.bookingCode || item?.booking?.code || '',
  createdAt: item?.createdAt || item?.submittedAt || item?.updatedAt || '',
});

export const useAdminSupportMessages = (filters = {}) => {
  const messagesQuery = useQuery({
    queryKey: ['admin-support-messages', filters],
    queryFn: () => supportApi.list(filters),
    retry: 1,
  });

  const statsQuery = useQuery({
    queryKey: ['admin-support-stats'],
    queryFn: supportApi.stats,
    retry: 1,
    enabled: messagesQuery.error?.code !== 'SUPPORT_ENDPOINT_UNAVAILABLE',
  });

  const messages = useMemo(
    () =>
      getArray(messagesQuery.data, ['tickets', 'messages', 'support', 'supportMessages']).map(
        normalizeSupportItem
      ),
    [messagesQuery.data]
  );

  const pagination = useMemo(() => getMeta(messagesQuery.data), [messagesQuery.data]);
  const isUnsupported = messagesQuery.error?.code === 'SUPPORT_ENDPOINT_UNAVAILABLE';

  return {
    messagesQuery,
    statsQuery,
    messages,
    pagination,
    isUnsupported,
  };
};

export const useAdminSupportMessageDetails = (id) =>
  useQuery({
    queryKey: ['admin-support-message-detail', id],
    queryFn: () => supportApi.details(id),
    enabled: Boolean(id),
    retry: 1,
  });

export const useSupportActions = () => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-support-messages'] });
    queryClient.invalidateQueries({ queryKey: ['admin-support-stats'] });
  };

  const statusMutation = useMutation({
    mutationFn: supportApi.updateStatus,
    onSuccess: invalidate,
  });

  const replyMutation = useMutation({
    mutationFn: supportApi.reply,
    onSuccess: invalidate,
  });

  const archiveMutation = useMutation({
    mutationFn: supportApi.archive,
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: supportApi.remove,
    onSuccess: invalidate,
  });

  return {
    statusMutation,
    replyMutation,
    archiveMutation,
    deleteMutation,
  };
};

