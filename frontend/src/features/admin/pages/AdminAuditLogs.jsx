import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button/Button';
import { Container } from '../../../components/ui/Layout/Container';
import { AdminAuditLogsHeader } from '../components/audit/AdminAuditLogsHeader';
import { AuditStatsCards } from '../components/audit/AuditStatsCards';
import { AuditLogFilters } from '../components/audit/AuditLogFilters';
import { AuditLogsTable } from '../components/audit/AuditLogsTable';
import { AuditLogMobileCard } from '../components/audit/AuditLogMobileCard';
import { AuditLogDetailsDialog } from '../components/audit/AuditLogDetailsDialog';
import { actionCategoryFromLog, toUpperUnderscore } from '../components/audit/auditUtils';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { getErrorMessage } from '../../../utils/errorHandler';
import { appToast } from '../../../lib/toast';
import { adminApi } from '../api/admin.api';
import { useAdminAuditLogDetails, useAdminAuditLogs } from '../hooks/useAdminAuditLogs';

const rangeStart = (rangeKey) => {
  const now = new Date();
  const date = new Date(now);
  if (rangeKey === 'today') {
    date.setHours(0, 0, 0, 0);
    return date;
  }
  if (rangeKey === 'this_week') {
    const day = date.getDay();
    const offset = day === 0 ? 6 : day - 1;
    date.setDate(date.getDate() - offset);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  if (rangeKey === 'this_month') {
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  return null;
};

const normalizeText = (value) => String(value || '').trim();

function AdminAuditLogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [selectedInlineLog, setSelectedInlineLog] = useState(null);
  const [supportsExport, setSupportsExport] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const values = useMemo(() => ({
    search: searchParams.get('search') || '',
    actionType: (searchParams.get('actionType') || 'ALL').toUpperCase(),
    entityType: (searchParams.get('entityType') || 'ALL').toUpperCase(),
    severity: (searchParams.get('severity') || 'ALL').toUpperCase(),
    actorRole: (searchParams.get('actorRole') || 'ALL').toUpperCase(),
    range: searchParams.get('range') || 'all_time',
    sort: searchParams.get('sort') || 'newest',
    page: Number(searchParams.get('page') || 1),
  }), [searchParams]);

  const apiFilters = useMemo(
    () => ({
      page: values.page,
      limit: 25,
      ...(values.search ? { search: values.search } : {}),
      ...(values.actionType !== 'ALL' ? { actionType: values.actionType } : {}),
      ...(values.entityType !== 'ALL' ? { entityType: values.entityType } : {}),
      ...(values.severity !== 'ALL' ? { severity: values.severity } : {}),
      ...(values.actorRole !== 'ALL' ? { actorRole: values.actorRole } : {}),
      ...(values.range !== 'all_time' ? { range: values.range } : {}),
      ...(values.sort !== 'newest' ? { sort: values.sort } : {}),
    }),
    [values]
  );

  const { logsQuery, statsQuery, logs, pagination, isUnsupported } = useAdminAuditLogs(apiFilters);
  const detailsQuery = useAdminAuditLogDetails(selectedLogId);

  const showEntityFilter = useMemo(
    () => logs.some((entry) => entry?.entityType != null),
    [logs]
  );
  const showSeverityFilter = useMemo(
    () => logs.some((entry) => entry?.severity != null),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const needle = normalizeText(values.search).toLowerCase();
    const rangeCutoff = rangeStart(values.range);

    let items = logs.filter((log) => {
      if (values.actionType !== 'ALL' && actionCategoryFromLog(log) !== values.actionType) return false;
      if (values.entityType !== 'ALL' && toUpperUnderscore(log?.entityType) !== values.entityType) return false;
      if (values.severity !== 'ALL' && toUpperUnderscore(log?.severity) !== values.severity) return false;
      if (values.actorRole !== 'ALL' && toUpperUnderscore(log?.actorRole) !== values.actorRole) return false;

      if (rangeCutoff) {
        const createdAt = log?.createdAt ? new Date(log.createdAt) : null;
        if (!createdAt || createdAt < rangeCutoff) return false;
      }

      if (!needle) return true;
      const actorText = `${log?.actor?.fullName || ''} ${log?.actor?.name || ''} ${log?.actor?.email || ''}`;
      const text = `${log?.action || ''} ${actorText} ${log?.bookingCode || ''} ${log?.entityType || ''} ${log?.entityId || ''}`.toLowerCase();
      return text.includes(needle);
    });

    items = [...items].sort((a, b) => {
      const aTime = new Date(a?.createdAt || 0).getTime();
      const bTime = new Date(b?.createdAt || 0).getTime();
      return values.sort === 'oldest' ? aTime - bTime : bTime - aTime;
    });

    return items;
  }, [logs, values]);

  const stats = useMemo(() => {
    const raw = statsQuery.data?.stats || statsQuery.data || null;

    if (raw && Object.keys(raw).length) {
      return {
        values: {
          totalLogs: raw.totalLogs ?? raw.total ?? raw.count ?? null,
          adminActions: raw.adminActions ?? raw.admin ?? null,
          bookingEvents: raw.bookingEvents ?? raw.bookings ?? null,
          providerEvents: raw.providerEvents ?? raw.providers ?? null,
          securityEvents: raw.securityEvents ?? raw.security ?? null,
          failedWarning: raw.failedWarning ?? raw.failedOrWarning ?? raw.warnings ?? null,
        },
        derived: false,
      };
    }

    const derived = filteredLogs.reduce(
      (acc, log) => {
        const actionCategory = actionCategoryFromLog(log);
        const severity = toUpperUnderscore(log?.severity);
        const status = toUpperUnderscore(log?.status);
        acc.totalLogs += 1;
        if (toUpperUnderscore(log?.actorRole) === 'ADMIN' || String(log?.action || '').toUpperCase().startsWith('ADMIN_')) acc.adminActions += 1;
        if (actionCategory === 'BOOKING') acc.bookingEvents += 1;
        if (actionCategory === 'PROVIDER') acc.providerEvents += 1;
        if (actionCategory === 'AUTH' || severity === 'CRITICAL') acc.securityEvents += 1;
        if (severity === 'WARNING' || severity === 'ERROR' || severity === 'CRITICAL' || status === 'FAILED') acc.failedWarning += 1;
        return acc;
      },
      {
        totalLogs: 0,
        adminActions: 0,
        bookingEvents: 0,
        providerEvents: 0,
        securityEvents: 0,
        failedWarning: 0,
      }
    );

    return { values: derived, derived: true };
  }, [filteredLogs, statsQuery.data]);

  const selectedLog = detailsQuery.data || selectedInlineLog;

  const setParam = (key, nextValue) => {
    const next = new URLSearchParams(searchParams);
    const normalized = normalizeText(nextValue);
    if (!normalized || normalized === 'ALL' || normalized === 'all_time' || normalized === 'newest') next.delete(key);
    else next.set(key, normalized);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const onRefresh = () => {
    logsQuery.refetch();
    statsQuery.refetch();
    if (selectedLogId) detailsQuery.refetch();
  };

  const onViewDetails = (log) => {
    setSelectedInlineLog(log);
    setSelectedLogId(log?.id);
  };

  const onExport = async () => {
    try {
      setIsExporting(true);
      const response = await adminApi.exportAuditLogs(apiFilters);
      const blob = response?.data;
      if (!(blob instanceof Blob)) throw new Error('Invalid export payload');
      const fileUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = `sewafi-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(fileUrl);
      appToast.success('Audit logs exported successfully.');
    } catch (error) {
      if (error?.code === 'AUDIT_ENDPOINT_UNAVAILABLE' || [404, 405].includes(error?.response?.status)) {
        setSupportsExport(false);
      }
      appToast.error(getErrorMessage(error, 'Unable to export logs right now.'));
    } finally {
      setIsExporting(false);
    }
  };

  const canGoPrev = values.page > 1;
  const totalPages = Number(pagination?.totalPages || pagination?.pages || 0);
  const canGoNext = totalPages ? values.page < totalPages : Boolean(pagination?.nextCursor);

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <AdminAuditLogsHeader
        onRefresh={onRefresh}
        onExport={onExport}
        supportsExport={supportsExport && !isUnsupported}
        exportLoading={isExporting}
      />

      {logsQuery.isLoading ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
            ))}
          </section>
          <section className="h-20 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
        </>
      ) : null}

      {!logsQuery.isLoading && isUnsupported ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6">
          <p className="text-lg font-semibold text-[var(--sf-text-main)]">Audit logs are not available yet.</p>
          <p className="mt-2 text-sm text-[var(--sf-text-muted)]">Connect backend audit logging APIs before enabling this page.</p>
          {/* TODO: Enable admin audit logs when backend audit log APIs are available. */}
        </section>
      ) : null}

      {!logsQuery.isLoading && !isUnsupported ? (
        <>
          <AuditStatsCards stats={stats.values} derivedFromLoaded={stats.derived} />

          <AuditLogFilters
            values={values}
            onChange={setParam}
            showSeverity={showSeverityFilter}
            showEntity={showEntityFilter}
            onReset={clearFilters}
          />

          {logsQuery.isError ? (
            <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
              <p className="font-semibold text-[var(--sf-text-main)]">Unable to load audit logs right now.</p>
              <div className="mt-3 flex gap-2">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => logsQuery.refetch()}>
                  Retry
                </Button>
                <Button type="button" variant="outline" className="rounded-xl" onClick={onRefresh}>
                  Refresh
                </Button>
              </div>
            </section>
          ) : null}

          {!logsQuery.isError && !filteredLogs.length ? (
            <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 text-center">
              <p className="text-lg font-semibold text-[var(--sf-text-main)]">{logs.length ? 'No audit logs match these filters.' : 'No audit logs found.'}</p>
              {logs.length ? (
                <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : null}
            </section>
          ) : null}

          {!logsQuery.isError && filteredLogs.length ? (
            <>
              <AuditLogsTable logs={filteredLogs} onViewDetails={onViewDetails} />
              <section className="space-y-3 lg:hidden">
                {filteredLogs.map((log) => (
                  <AuditLogMobileCard key={log?.id} log={log} onViewDetails={onViewDetails} />
                ))}
              </section>
            </>
          ) : null}

          {totalPages || pagination?.nextCursor ? (
            <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
              <p className="text-sm text-[var(--sf-text-muted)]">
                Page {values.page}{totalPages ? ` of ${totalPages}` : ''}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl"
                  disabled={!canGoPrev}
                  onClick={() => setParam('page', String(values.page - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl"
                  disabled={!canGoNext}
                  onClick={() => setParam('page', String(values.page + 1))}
                >
                  Next
                </Button>
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      {/* TODO: Move local filter fallback to backend-only filtering once audit API query contract is finalized. */}
      <AuditLogDetailsDialog
        open={Boolean(selectedLogId)}
        onClose={() => {
          setSelectedLogId(null);
          setSelectedInlineLog(null);
        }}
        log={selectedLog}
        isDesktop={isDesktop}
      />
    </Container>
  );
}

export default AdminAuditLogs;

