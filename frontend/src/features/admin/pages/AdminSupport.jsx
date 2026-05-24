import { useMemo, useState } from 'react';
import { Button } from '../../../components/ui/Button/Button';
import { Container } from '../../../components/ui/Layout/Container';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { getErrorMessage } from '../../../utils/errorHandler';
import { appToast } from '../../../lib/toast';
import AdminSupportHeader from '../../../components/admin/support/AdminSupportHeader';
import SupportStatsCards from '../../../components/admin/support/SupportStatsCards';
import SupportFilters from '../../../components/admin/support/SupportFilters';
import SupportMessagesTable from '../../../components/admin/support/SupportMessagesTable';
import SupportMessageCard from '../../../components/admin/support/SupportMessageCard';
import SupportDetailsDialog from '../../../components/admin/support/SupportDetailsDialog';
import SupportActionDialog from '../../../components/admin/support/SupportActionDialog';
import { useSearchParams } from 'react-router-dom';
import {
  useAdminSupportMessageDetails,
  useAdminSupportMessages,
  useSupportActions,
} from '../hooks/useAdminSupportMessages';
import { supportApi } from '../api/support.api';
import { toUpperUnderscore } from '../../../components/admin/support/supportUtils';

const normalizeText = (value) => String(value || '').trim();

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

function AdminSupport() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [selectedInlineMessage, setSelectedInlineMessage] = useState(null);
  const [supportsReply, setSupportsReply] = useState(false);
  const [supportsStatus, setSupportsStatus] = useState(true);
  const [supportsArchive, setSupportsArchive] = useState(false);
  const [supportsDelete, setSupportsDelete] = useState(false);
  const [supportsExport, setSupportsExport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const values = {
    search: searchParams.get('search') || '',
    status: (searchParams.get('status') || 'ALL').toUpperCase(),
    topic: (searchParams.get('topic') || 'ALL').toUpperCase(),
    priority: (searchParams.get('priority') || 'ALL').toUpperCase(),
    role: (searchParams.get('role') || 'ALL').toUpperCase(),
    range: searchParams.get('range') || 'all_time',
    sort: searchParams.get('sort') || 'newest',
    page: Number(searchParams.get('page') || 1),
  };

  const apiFilters = useMemo(
    () => ({
      page: values.page,
      limit: 25,
      ...(values.search ? { search: values.search } : {}),
      ...(values.status !== 'ALL' ? { status: values.status } : {}),
      ...(values.topic !== 'ALL' ? { topic: values.topic } : {}),
      ...(values.priority !== 'ALL' ? { priority: values.priority } : {}),
      ...(values.role !== 'ALL' ? { role: values.role } : {}),
      ...(values.range !== 'all_time' ? { range: values.range } : {}),
      ...(values.sort !== 'newest' ? { sort: values.sort } : {}),
    }),
    [values]
  );

  const { messagesQuery, statsQuery, messages, pagination, isUnsupported } = useAdminSupportMessages(apiFilters);
  const detailsQuery = useAdminSupportMessageDetails(selectedMessageId);
  const actions = useSupportActions();

  const showTopic = useMemo(() => messages.some((item) => item?.topic), [messages]);
  const showPriority = useMemo(() => messages.some((item) => item?.priority), [messages]);
  const showRole = useMemo(() => messages.some((item) => item?.role), [messages]);

  const filteredMessages = useMemo(() => {
    const needle = normalizeText(values.search).toLowerCase();
    const cutoff = rangeStart(values.range);

    let items = messages.filter((item) => {
      if (values.status !== 'ALL' && toUpperUnderscore(item?.status) !== values.status) return false;
      if (values.topic !== 'ALL' && toUpperUnderscore(item?.topic) !== values.topic) return false;
      if (values.priority !== 'ALL' && toUpperUnderscore(item?.priority) !== values.priority) return false;
      if (values.role !== 'ALL' && toUpperUnderscore(item?.role) !== values.role) return false;

      if (cutoff) {
        const createdAt = item?.createdAt ? new Date(item.createdAt) : null;
        if (!createdAt || createdAt < cutoff) return false;
      }

      if (!needle) return true;
      const text = `${item?.fullName || ''} ${item?.email || ''} ${item?.phone || ''} ${item?.subject || ''} ${item?.message || ''} ${item?.ticketCode || ''} ${item?.bookingCode || ''}`.toLowerCase();
      return text.includes(needle);
    });

    items = [...items].sort((a, b) => {
      if (values.sort === 'priority') {
        const order = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (order[toUpperUnderscore(b?.priority)] || 0) - (order[toUpperUnderscore(a?.priority)] || 0);
      }
      if (values.sort === 'status') {
        return String(a?.status || '').localeCompare(String(b?.status || ''));
      }
      const aTime = new Date(a?.createdAt || 0).getTime();
      const bTime = new Date(b?.createdAt || 0).getTime();
      return values.sort === 'oldest' ? aTime - bTime : bTime - aTime;
    });

    return items;
  }, [messages, values]);

  const stats = useMemo(() => {
    const raw = statsQuery.data?.stats || statsQuery.data || null;
    if (raw && Object.keys(raw).length) {
      return {
        values: {
          total: raw.total ?? raw.totalMessages ?? null,
          open: raw.open ?? null,
          inProgress: raw.inProgress ?? raw.in_progress ?? null,
          resolved: raw.resolved ?? null,
          urgent: raw.urgent ?? raw.high ?? raw.highPriority ?? null,
          today: raw.today ?? raw.todayMessages ?? null,
        },
        derived: false,
      };
    }

    const todayCutoff = rangeStart('today');
    const derived = filteredMessages.reduce(
      (acc, item) => {
        const status = toUpperUnderscore(item?.status);
        const priority = toUpperUnderscore(item?.priority);
        const createdAt = item?.createdAt ? new Date(item.createdAt) : null;

        acc.total += 1;
        if (status === 'OPEN') acc.open += 1;
        if (status === 'IN_PROGRESS') acc.inProgress += 1;
        if (status === 'RESOLVED') acc.resolved += 1;
        if (priority === 'URGENT' || priority === 'HIGH') acc.urgent += 1;
        if (createdAt && todayCutoff && createdAt >= todayCutoff) acc.today += 1;
        return acc;
      },
      {
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        urgent: 0,
        today: 0,
      }
    );

    return { values: derived, derived: true };
  }, [filteredMessages, statsQuery.data]);

  const selectedMessage = detailsQuery.data || selectedInlineMessage;

  const setParam = (key, nextValue) => {
    const next = new URLSearchParams(searchParams);
    const normalized = normalizeText(nextValue);
    if (!normalized || normalized === 'ALL' || normalized === 'all_time' || normalized === 'newest') next.delete(key);
    else next.set(key, normalized);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams(new URLSearchParams());

  const onRefresh = () => {
    messagesQuery.refetch();
    statsQuery.refetch();
    if (selectedMessageId) detailsQuery.refetch();
  };

  const onViewDetails = (message) => {
    setSelectedInlineMessage(message);
    setSelectedMessageId(message?.id);
  };

  const handleUnsupportedAction = (error, code, setter) => {
    if (error?.code === code || [404, 405].includes(error?.response?.status)) {
      setter(false);
      appToast.error('This action is currently unavailable.');
      return true;
    }
    return false;
  };

  const onSetStatus = async (message, status) => {
    try {
      await actions.statusMutation.mutateAsync({ id: message.id, status });
      appToast.success('Support status updated.');
      if (selectedMessageId) detailsQuery.refetch();
    } catch (error) {
      if (handleUnsupportedAction(error, 'SUPPORT_STATUS_UNAVAILABLE', setSupportsStatus)) return;
      appToast.error(getErrorMessage(error, 'Unable to update support status right now.'));
    }
  };

  const onReply = async (text) => {
    if (!selectedMessage?.id) return;
    try {
      await actions.replyMutation.mutateAsync({ id: selectedMessage.id, message: text });
      appToast.success('Reply sent successfully.');
      detailsQuery.refetch();
    } catch (error) {
      if (handleUnsupportedAction(error, 'SUPPORT_REPLY_UNAVAILABLE', setSupportsReply)) return;
      appToast.error(getErrorMessage(error, 'Unable to send reply right now.'));
    }
  };

  const onConfirmAction = async () => {
    if (!pendingAction?.id) return;

    try {
      if (pendingAction.type === 'archive') {
        await actions.archiveMutation.mutateAsync(pendingAction.id);
        appToast.success('Support message archived.');
      } else if (pendingAction.type === 'delete') {
        await actions.deleteMutation.mutateAsync(pendingAction.id);
        appToast.success('Support message deleted.');
      }
      setPendingAction(null);
      if (selectedMessageId === pendingAction.id) {
        setSelectedMessageId(null);
        setSelectedInlineMessage(null);
      }
    } catch (error) {
      if (pendingAction.type === 'archive' && handleUnsupportedAction(error, 'SUPPORT_ARCHIVE_UNAVAILABLE', setSupportsArchive)) return;
      if (pendingAction.type === 'delete' && handleUnsupportedAction(error, 'SUPPORT_DELETE_UNAVAILABLE', setSupportsDelete)) return;
      appToast.error(getErrorMessage(error, 'Unable to complete this action right now.'));
    }
  };

  const onExport = async () => {
    try {
      setIsExporting(true);
      const response = await supportApi.export(apiFilters);
      const blob = response?.data;
      if (!(blob instanceof Blob)) throw new Error('Invalid export payload');
      const fileUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = `sewafi-support-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(fileUrl);
      appToast.success('Support messages exported successfully.');
    } catch (error) {
      if (error?.code === 'SUPPORT_EXPORT_UNAVAILABLE' || [404, 405].includes(error?.response?.status)) {
        setSupportsExport(false);
      }
      appToast.error(getErrorMessage(error, 'Unable to export support messages right now.'));
    } finally {
      setIsExporting(false);
    }
  };

  const canGoPrev = values.page > 1;
  const totalPages = Number(pagination?.totalPages || pagination?.pages || 0);
  const canGoNext = totalPages ? values.page < totalPages : Boolean(pagination?.nextCursor);

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <AdminSupportHeader
        onRefresh={onRefresh}
        onExport={onExport}
        supportsExport={supportsExport && !isUnsupported && !messagesQuery.isLoading}
        exporting={isExporting}
      />

      {messagesQuery.isLoading ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
            ))}
          </section>
          <section className="h-20 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
        </>
      ) : null}

      {!messagesQuery.isLoading && isUnsupported ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6">
          <p className="text-lg font-semibold text-[var(--sf-text-main)]">Support management is currently unavailable.</p>
          <p className="mt-2 text-sm text-[var(--sf-text-muted)]">Support tools are not enabled in this environment.</p>
          {/* TODO: Enable Admin Support page when support/contact message APIs are available. */}
        </section>
      ) : null}

      {!messagesQuery.isLoading && !isUnsupported ? (
        <>
          <SupportStatsCards stats={stats.values} derivedFromLoaded={stats.derived} />
          <SupportFilters
            values={values}
            onChange={setParam}
            onReset={clearFilters}
            showTopic={showTopic}
            showPriority={showPriority}
            showRole={showRole}
          />

          {messagesQuery.isError ? (
            <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
              <p className="font-semibold text-[var(--sf-text-main)]">Unable to load support messages right now.</p>
              <div className="mt-3 flex gap-2">
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => messagesQuery.refetch()}>
                  Retry
                </Button>
                <Button type="button" variant="outline" className="rounded-xl" onClick={onRefresh}>
                  Refresh
                </Button>
              </div>
            </section>
          ) : null}

          {!messagesQuery.isError && !filteredMessages.length ? (
            <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 text-center">
              <p className="text-lg font-semibold text-[var(--sf-text-main)]">{messages.length ? 'No support messages match these filters.' : 'No support messages yet.'}</p>
              {messages.length ? (
                <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : null}
            </section>
          ) : null}

          {!messagesQuery.isError && filteredMessages.length ? (
            <>
              <SupportMessagesTable
                messages={filteredMessages}
                onViewDetails={onViewDetails}
                onSetInProgress={(message) => onSetStatus(message, 'IN_PROGRESS')}
                onResolve={(message) => onSetStatus(message, 'RESOLVED')}
                supportsStatus={supportsStatus}
                showPriority={showPriority}
                showTopic={showTopic}
              />
              <section className="space-y-3">
                {filteredMessages.map((message) => (
                  <SupportMessageCard
                    key={message?.id || message?.ticketCode}
                    message={message}
                    onViewDetails={onViewDetails}
                    onSetInProgress={(item) => onSetStatus(item, 'IN_PROGRESS')}
                    onResolve={(item) => onSetStatus(item, 'RESOLVED')}
                    supportsStatus={supportsStatus}
                    showPriority={showPriority}
                    showTopic={showTopic}
                  />
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

      <SupportDetailsDialog
        open={Boolean(selectedMessageId)}
        onClose={() => {
          setSelectedMessageId(null);
          setSelectedInlineMessage(null);
        }}
        message={selectedMessage}
        isDesktop={isDesktop}
        supportsReply={supportsReply}
        supportsStatus={supportsStatus}
        supportsArchive={supportsArchive}
        supportsDelete={supportsDelete}
        onSetInProgress={(message) => onSetStatus(message, 'IN_PROGRESS')}
        onResolve={(message) => onSetStatus(message, 'RESOLVED')}
        onArchive={(message) => setPendingAction({ type: 'archive', id: message?.id })}
        onDelete={(message) => setPendingAction({ type: 'delete', id: message?.id })}
        onReply={onReply}
        replying={actions.replyMutation.isPending}
      />

      <SupportActionDialog
        open={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        onConfirm={onConfirmAction}
        title={pendingAction?.type === 'delete' ? 'Delete Support Message?' : 'Archive Support Message?'}
        description={
          pendingAction?.type === 'delete'
            ? 'This support message will be removed. Continue only if you are sure.'
            : 'This support message will be archived from active inbox view.'
        }
        confirmLabel={
          pendingAction?.type === 'delete'
            ? actions.deleteMutation.isPending ? 'Deleting...' : 'Delete'
            : actions.archiveMutation.isPending ? 'Archiving...' : 'Archive'
        }
      />
    </Container>
  );
}

export default AdminSupport;
