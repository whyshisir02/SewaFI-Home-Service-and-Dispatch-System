import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Info,
  LockKeyhole,
  RefreshCw,
  Tag,
  UserCheck,
  WalletCards,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { useNotificationSocket } from '../hooks/useNotificationSocket';
import { useNotifications } from '../hooks/useNotifications';
import { appToast } from '../../../lib/toast';
import { ROUTES } from '../../../constants/routes.constant';
import {
  getCurrentPushSubscription,
  isWebPushSupported,
  requestNotificationPermission,
  subscribeBrowserToPush,
  unsubscribeBrowserPush,
} from '../utils/webPush';

const TABS = ['active', 'unread', 'archived'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

const typeIconMap = {
  BOOKING_CREATED: ClipboardList,
  BOOKING_STATUS_UPDATED: CalendarCheck,
  BOOKING_ACCEPTED: UserCheck,
  BOOKING_CANCELLED: XCircle,
  BOOKING_COMPLETED: CheckCircle2,
  JOB_AVAILABLE: BriefcaseBusiness,
  JOB_ASSIGNED: BriefcaseBusiness,
  PROVIDER_APPROVED: BadgeCheck,
  PROVIDER_REJECTED: AlertTriangle,
  PAYMENT_UPDATED: WalletCards,
  REVIEW_REQUEST: CheckCircle2,
  SECURITY: LockKeyhole,
  OTP: LockKeyhole,
  SYSTEM: Info,
  PROMOTION: Tag,
};

const tabLabel = {
  active: 'Active',
  unread: 'Unread',
  archived: 'Archived',
};

const emptyTitle = {
  active: 'No active notifications.',
  unread: 'No unread notifications.',
  archived: 'No archived notifications.',
};

const routeByRole = {
  customer: {
    booking: (id) => ROUTES.customer.bookingDetails.replace(':id', id),
  },
  provider: {
    booking: (id) => ROUTES.provider.jobDetails.replace(':id', id),
  },
  admin: {
    booking: (id) => `/admin/bookings/${id}`,
  },
};

const toEpoch = (value) => {
  const time = new Date(value || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const formatTime = (value) => {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleString();
};

const getNotificationLink = (role, notification) => {
  const actionUrl =
    notification?.actionUrl ||
    notification?.link ||
    notification?.data?.actionUrl ||
    notification?.data?.link;

  if (actionUrl && actionUrl.startsWith('/')) return actionUrl;

  const bookingId = notification?.bookingId || notification?.data?.bookingId;
  if (bookingId) return routeByRole[role]?.booking(String(bookingId));

  return null;
};

export function NotificationsCenter({ role = 'customer' }) {
  useNotificationSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const [localSearch, setLocalSearch] = useState(searchParams.get('q') || '');
  const [markAllSupported, setMarkAllSupported] = useState(true);
  const [archiveReadSupported, setArchiveReadSupported] = useState(true);
  const [browserPushSupported, setBrowserPushSupported] = useState(false);
  const [browserPushPermission, setBrowserPushPermission] = useState('default');
  const [browserPushEnabled, setBrowserPushEnabled] = useState(false);

  const tabFromQuery = String(searchParams.get('tab') || 'active').toLowerCase();
  const tab = TABS.includes(tabFromQuery) ? tabFromQuery : 'active';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || 1);

  const filters = useMemo(
    () => ({
      page,
      limit: 20,
      tab,
    }),
    [page, tab]
  );

  const {
    notificationsQuery,
    unreadCountQuery,
    pushConfigQuery,
    markAsReadMutation,
    markAllAsReadMutation,
    archiveNotificationMutation,
    unarchiveNotificationMutation,
    archiveReadNotificationsMutation,
    subscribePushMutation,
    unsubscribePushMutation,
    sendTestPushMutation,
  } = useNotifications({ role, filters });

  const backendList = useMemo(() => notificationsQuery.data?.notifications || [], [notificationsQuery.data]);
  const meta = notificationsQuery.data?.meta;
  const localUnreadCount = backendList.filter((item) => !item?.isRead && !item?.isArchived).length;

  const unreadCountPayload = unreadCountQuery.data;
  const unreadCount =
    unreadCountPayload?.count ??
    unreadCountPayload?.unreadCount ??
    unreadCountPayload?.totalUnread ??
    (typeof unreadCountPayload === 'number' ? unreadCountPayload : localUnreadCount);

  const filteredNotifications = useMemo(() => {
    const query = localSearch.trim().toLowerCase();
    const filtered = backendList.filter((item) => {
      if (!query) return true;
      const text = `${item?.title || ''} ${item?.message || ''}`.toLowerCase();
      return text.includes(query);
    });

    if (sort === 'oldest') return [...filtered].sort((a, b) => toEpoch(a?.createdAt) - toEpoch(b?.createdAt));
    return [...filtered].sort((a, b) => toEpoch(b?.createdAt) - toEpoch(a?.createdAt));
  }, [backendList, localSearch, sort]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'active' || value === 'newest') next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const onMarkAll = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      appToast.success('All active notifications marked as read.');
    } catch (error) {
      if (error?.code === 'NOTIFICATIONS_MARK_ALL_ENDPOINT_MISSING') {
        setMarkAllSupported(false);
        appToast.error('Bulk mark-as-read is unavailable right now.');
        return;
      }
      appToast.error('Unable to mark all notifications as read.');
    }
  };

  const onArchiveRead = async () => {
    try {
      const result = await archiveReadNotificationsMutation.mutateAsync();
      const count = result?.archivedCount ?? result?.count ?? 0;
      appToast.success(count ? `${count} read notifications archived.` : 'No read notifications to archive.');
    } catch (error) {
      if (error?.code === 'NOTIFICATIONS_ARCHIVE_READ_ENDPOINT_MISSING') {
        setArchiveReadSupported(false);
        appToast.error('Archive-read action is unavailable right now.');
        return;
      }
      appToast.error('Unable to archive read notifications.');
    }
  };

  const onMarkRead = async (id) => {
    try {
      await markAsReadMutation.mutateAsync(id);
    } catch (error) {
      appToast.error('Unable to update notification status.');
    }
  };

  const onArchive = async (id) => {
    try {
      await archiveNotificationMutation.mutateAsync(id);
      appToast.success('Notification archived.');
    } catch (error) {
      appToast.error('Unable to archive notification.');
    }
  };

  const onUnarchive = async (id) => {
    try {
      await unarchiveNotificationMutation.mutateAsync(id);
      appToast.success('Notification moved to active.');
    } catch (error) {
      appToast.error('Unable to restore notification.');
    }
  };

  const totalCount = meta?.total ?? backendList.length;
  const canLoadMore = Boolean(meta?.hasMore || meta?.hasNextPage || (meta?.totalPages && meta?.page < meta?.totalPages));
  const pushConfig = pushConfigQuery.data || {};
  const pushBackendEnabled = Boolean(pushConfig?.enabled && pushConfig?.publicKey);

  useEffect(() => {
    const syncPushState = async () => {
      const supported = isWebPushSupported();
      setBrowserPushSupported(supported);
      if (!supported) {
        setBrowserPushPermission('denied');
        setBrowserPushEnabled(false);
        return;
      }

      setBrowserPushPermission(Notification.permission || 'default');
      try {
        const subscription = await getCurrentPushSubscription();
        setBrowserPushEnabled(Boolean(subscription));
      } catch {
        setBrowserPushEnabled(false);
      }
    };

    syncPushState();
  }, []);

  const pushStatusLabel = (() => {
    if (!browserPushSupported) return 'Not supported on this browser.';
    if (!pushBackendEnabled) return 'Temporarily unavailable.';
    if (browserPushPermission === 'denied') return 'Permission denied.';
    if (browserPushEnabled) return 'Enabled';
    return 'Disabled';
  })();

  const pushHelpText =
    role === 'provider'
      ? 'Enable system alerts so you do not miss nearby job requests.'
      : 'Enable system alerts for important booking and account updates.';

  const onEnablePush = async () => {
    if (!browserPushSupported) {
      appToast.error('System notifications are not supported on this browser.');
      return;
    }
    if (!pushBackendEnabled) {
      appToast.error('System notifications are temporarily unavailable.');
      return;
    }

    try {
      const permission = await requestNotificationPermission();
      setBrowserPushPermission(permission);
      if (permission !== 'granted') {
        appToast.error('Notification permission was not granted.');
        return;
      }

      const subscription = await subscribeBrowserToPush(pushConfig.publicKey);
      const payload = typeof subscription.toJSON === 'function' ? subscription.toJSON() : subscription;
      await subscribePushMutation.mutateAsync(payload);
      setBrowserPushEnabled(true);
      appToast.success('System notifications enabled.');
    } catch {
      appToast.error('Unable to enable system notifications right now.');
    }
  };

  const onDisablePush = async () => {
    try {
      const subscription = await unsubscribeBrowserPush();
      const endpoint = subscription?.endpoint;
      if (endpoint) {
        await unsubscribePushMutation.mutateAsync(endpoint);
      }
      setBrowserPushEnabled(false);
      appToast.success('System notifications disabled.');
    } catch {
      appToast.error('Unable to disable system notifications right now.');
    }
  };

  const onSendTestPush = async () => {
    try {
      const summary = await sendTestPushMutation.mutateAsync();
      if (summary?.disabled) {
        appToast.error('Push service is not configured yet.');
        return;
      }
      appToast.success('Test notification sent.');
    } catch {
      appToast.error('Unable to send test notification right now.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notifications"
        title="Notifications"
        description="Track active updates, unread items, and your notification archive."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => notificationsQuery.refetch()}
              className="rounded-xl"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            {markAllSupported && tab !== 'archived' ? (
              <Button
                type="button"
                variant="outline"
                disabled={!unreadCount || markAllAsReadMutation.isPending}
                onClick={onMarkAll}
                className="rounded-xl"
              >
                Mark all as read
              </Button>
            ) : null}
            {archiveReadSupported && tab !== 'archived' ? (
              <Button
                type="button"
                variant="outline"
                onClick={onArchiveRead}
                disabled={archiveReadNotificationsMutation.isPending}
                className="rounded-xl"
              >
                Archive read
              </Button>
            ) : null}
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Active', value: tab === 'archived' ? '-' : totalCount },
          { label: 'Unread', value: unreadCount },
          { label: 'Archived', value: tab === 'archived' ? totalCount : '-' },
        ].map((item) => (
          <article key={item.label} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">{item.label}</p>
            <p className="mt-2 text-2xl font-extrabold text-[var(--sf-text-main)]">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--sf-text-main)]">System notifications</p>
            <p className="text-sm text-[var(--sf-text-muted)]">{pushHelpText}</p>
            <p className="text-xs font-medium text-[var(--sf-text-muted)]">Status: {pushStatusLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl"
              onClick={onEnablePush}
              disabled={
                !browserPushSupported ||
                !pushBackendEnabled ||
                browserPushEnabled ||
                subscribePushMutation.isPending
              }
            >
              Enable system notifications
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl"
              onClick={onSendTestPush}
              disabled={!browserPushEnabled || sendTestPushMutation.isPending}
            >
              Send test notification
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl"
              onClick={onDisablePush}
              disabled={!browserPushEnabled || unsubscribePushMutation.isPending}
            >
              Disable
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setParam('tab', item)}
              className={`h-11 shrink-0 rounded-xl border px-4 text-sm font-semibold transition ${
                tab === item
                  ? 'border-[var(--sf-secondary)] bg-[var(--sf-secondary)]/15 text-[var(--sf-secondary)]'
                  : 'border-[var(--sf-border)] bg-[var(--sf-surface)] text-[var(--sf-text-muted)]'
              }`}
            >
              {tabLabel[item]}
              {item === 'unread' && unreadCount ? (
                <span className="ml-2 rounded-full bg-[var(--sf-accent)] px-2 py-0.5 text-xs text-white">{unreadCount}</span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
          <Input
            label="Search notifications"
            value={localSearch}
            onChange={(event) => {
              setLocalSearch(event.target.value);
              const next = new URLSearchParams(searchParams);
              if (event.target.value.trim()) next.set('q', event.target.value.trim());
              else next.delete('q');
              setSearchParams(next);
            }}
            placeholder="Search notifications..."
          />
          <label className="flex flex-col gap-2 text-sm font-medium text-[var(--sf-text-main)]">
            <span>Sort</span>
            <select
              className="h-11 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]"
              value={sort}
              onChange={(event) => setParam('sort', event.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {notificationsQuery.isLoading ? (
        <section className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
          ))}
        </section>
      ) : null}

      {!notificationsQuery.isLoading && notificationsQuery.isError ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
          <p className="text-sm text-[var(--sf-text-muted)]">Unable to load notifications right now.</p>
          <Button type="button" variant="outline" className="mt-3 rounded-xl" onClick={() => notificationsQuery.refetch()}>
            Retry
          </Button>
        </section>
      ) : null}

      {!notificationsQuery.isLoading && !notificationsQuery.isError && !filteredNotifications.length ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 text-center">
          <p className="text-base font-semibold text-[var(--sf-text-main)]">{emptyTitle[tab]}</p>
        </section>
      ) : null}

      {!notificationsQuery.isLoading && !notificationsQuery.isError && filteredNotifications.length ? (
        <section aria-label="Notification list" className="space-y-3">
          {filteredNotifications.map((notification) => {
            const Icon = typeIconMap[(notification?.type || '').toUpperCase()] || Bell;
            const href = getNotificationLink(role, notification);
            const isUnread = !notification?.isRead;
            const isArchived = Boolean(notification?.isArchived);

            return (
              <article
                key={notification?.id || `${notification?.createdAt}-${notification?.title}`}
                className={`rounded-2xl border p-4 ${
                  isUnread && !isArchived
                    ? 'border-[var(--sf-secondary)]/30 bg-[var(--sf-secondary)]/8'
                    : 'border-[var(--sf-border)] bg-[var(--sf-surface)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--sf-surface-soft)] text-[var(--sf-primary)]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`text-sm ${isUnread ? 'font-bold' : 'font-semibold'} text-[var(--sf-text-main)]`}>
                        {notification?.title || 'Notification'}
                      </p>
                      <span className="rounded-full border border-[var(--sf-border)] px-2 py-0.5 text-[11px] font-semibold text-[var(--sf-text-muted)]">
                        {notification?.type || 'SYSTEM'}
                      </span>
                      <span className="text-xs text-[var(--sf-text-muted)]">
                        {isArchived ? 'Archived' : isUnread ? 'Unread' : 'Read'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--sf-text-muted)]">
                      {notification?.message || 'No additional details available.'}
                    </p>
                    <p className="mt-2 text-xs text-[var(--sf-text-muted)]">{formatTime(notification?.createdAt)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {!isArchived && isUnread ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 rounded-xl"
                          onClick={() => onMarkRead(notification?.id)}
                          disabled={markAsReadMutation.isPending}
                        >
                          Mark as read
                        </Button>
                      ) : null}
                      {href ? (
                        <Button as={Link} to={href} variant="outline" className="h-9 rounded-xl">
                          View details
                        </Button>
                      ) : null}
                      {!isArchived ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 rounded-xl"
                          onClick={() => onArchive(notification?.id)}
                          disabled={archiveNotificationMutation.isPending}
                        >
                          Archive
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 rounded-xl"
                          onClick={() => onUnarchive(notification?.id)}
                          disabled={unarchiveNotificationMutation.isPending}
                        >
                          Unarchive
                        </Button>
                      )}
                    </div>
                  </div>
                  {isUnread && !isArchived ? (
                    <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-[var(--sf-accent)]" aria-label="Unread notification" />
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      {canLoadMore ? (
        <div className="flex justify-center">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => setParam('page', String(page + 1))}>
            Load More
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default NotificationsCenter;
