import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';

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

export const useAdminAuditLogs = (filters = {}) => {
  const logsQuery = useQuery({
    queryKey: ['admin-audit-logs', filters],
    queryFn: () => adminApi.auditLogs(filters),
    retry: 1,
  });

  const statsQuery = useQuery({
    queryKey: ['admin-audit-log-stats'],
    queryFn: () => adminApi.auditLogStats(),
    retry: 1,
    enabled: !logsQuery.error || logsQuery.error?.code !== 'AUDIT_ENDPOINT_UNAVAILABLE',
  });

  const logs = useMemo(
    () => getArray(logsQuery.data, ['logs', 'auditLogs', 'activityLogs', 'records']),
    [logsQuery.data]
  );
  const pagination = useMemo(() => getMeta(logsQuery.data), [logsQuery.data]);

  const isUnsupported = logsQuery.error?.code === 'AUDIT_ENDPOINT_UNAVAILABLE';

  return {
    logsQuery,
    statsQuery,
    logs,
    pagination,
    isUnsupported,
  };
};

export const useAdminAuditLogDetails = (id) =>
  useQuery({
    queryKey: ['admin-audit-log-detail', id],
    queryFn: () => adminApi.auditLogDetails(id),
    enabled: Boolean(id),
    retry: 1,
  });

