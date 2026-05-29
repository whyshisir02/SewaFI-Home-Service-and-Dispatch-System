import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Clock3,
  FileClock,
  ListChecks,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button';
import { Container } from '../../../components/ui/Layout/Container';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/ui/Overlay/Modal';
import { Drawer } from '../../../components/ui/Overlay/Drawer';
import { ConfirmDialog } from '../../../components/ui/Overlay/ConfirmDialog';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { getErrorMessage } from '../../../utils/errorHandler';
import { appToast } from '../../../lib/toast';
import { useServiceCategories } from '../../services/hooks/useServiceCategories';
import { BookingStatusBadge } from '../../booking/components/BookingStatusBadge';
import {
  useAdminBookingDetails,
  useAdminBookings,
  useAdminBookingTimeline,
} from '../hooks/useAdminBookings';

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const paymentOptions = [
  { value: 'all', label: 'All Payment Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAID', label: 'Paid' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'CANCELLATION_FEE', label: 'Cancellation Fee' },
];

const rangeOptions = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'scheduled', label: 'Scheduled first' },
  { value: 'status', label: 'Status' },
];

const getBookingsArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.bookings)) return payload.bookings;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getServiceName = (booking) => booking?.service?.name || booking?.serviceName || 'Service';
const getCustomerName = (booking) => booking?.customer?.fullName || booking?.customer?.name || 'Customer';
const getProviderName = (booking) => booking?.provider?.fullName || booking?.provider?.name || 'Not assigned';
const getAmount = (booking) => booking?.finalPrice ?? booking?.estimatedPrice ?? null;
const getDispatch = (booking) => booking?.dispatchState || '—';
const getSchedule = (booking) =>
  booking?.scheduledAt || booking?.preferredDate
    ? `${formatDate(booking?.scheduledAt || booking?.preferredDate, {
        includeTime: Boolean(booking?.preferredTimeSlot),
      })}${booking?.preferredTimeSlot ? ` • ${booking.preferredTimeSlot}` : ''}`
    : 'Not scheduled';

const matchesRange = (value, range) => {
  if (!value || range === 'all') return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  if (range === 'today') return date.toDateString() === now.toDateString();
  if (range === 'week') {
    const end = new Date(now);
    end.setDate(end.getDate() + 7);
    return date >= now && date <= end;
  }
  if (range === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  return true;
};

function AdminBookings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [supportsActions, setSupportsActions] = useState({
    cancel: true,
    updateStatus: true,
  });
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const dispatch = searchParams.get('dispatch') || 'all';
  const payment = searchParams.get('payment') || 'all';
  const serviceCategory = searchParams.get('serviceCategory') || 'all';
  const range = searchParams.get('range') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || 1);

  const filters = useMemo(
    () => ({
      page,
      limit: 20,
      ...(search ? { search } : {}),
      ...(status !== 'all' ? { status } : {}),
      ...(dispatch !== 'all' ? { dispatchState: dispatch } : {}),
      ...(payment !== 'all' ? { paymentStatus: payment } : {}),
      ...(serviceCategory !== 'all' ? { serviceCategoryId: serviceCategory } : {}),
      ...(range !== 'all' ? { range } : {}),
      ...(sort !== 'newest' ? { sort } : {}),
    }),
    [dispatch, page, payment, range, search, serviceCategory, sort, status]
  );

  const { bookingsQuery, statsQuery, updateStatusMutation, cancelBookingMutation } = useAdminBookings(filters);
  const categoriesQuery = useServiceCategories();

  const bookings = useMemo(() => getBookingsArray(bookingsQuery.data), [bookingsQuery.data]);
  const bookingDetailsQuery = useAdminBookingDetails(selectedBookingId);
  const bookingTimelineQuery = useAdminBookingTimeline(selectedBookingId);
  const selectedBooking = bookingDetailsQuery.data || bookings.find((item) => String(item?.id) === String(selectedBookingId));

  const dispatchStates = useMemo(() => {
    const set = new Set(
      bookings
        .map((item) => item?.dispatchState)
        .filter(Boolean)
    );
    return ['all', ...Array.from(set)];
  }, [bookings]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all' || value === 'newest') next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const filteredBookings = useMemo(() => {
    const needle = search.trim().toLowerCase();
    let list = bookings.filter((item) => {
      if (status !== 'all' && item?.status !== status) return false;
      if (dispatch !== 'all' && item?.dispatchState !== dispatch) return false;
      if (payment !== 'all' && item?.paymentStatus !== payment) return false;
      if (serviceCategory !== 'all') {
        const categoryId = String(item?.service?.categoryId || item?.serviceCategoryId || '');
        if (categoryId !== String(serviceCategory)) return false;
      }
      if (!matchesRange(item?.scheduledAt || item?.preferredDate || item?.createdAt, range)) return false;
      if (!needle) return true;
      const text = `${item?.bookingCode || item?.id} ${getCustomerName(item)} ${getProviderName(item)} ${getServiceName(item)} ${item?.address || ''}`.toLowerCase();
      return text.includes(needle);
    });

    if (sort === 'oldest') list = [...list].sort((a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0));
    else if (sort === 'scheduled') list = [...list].sort((a, b) => new Date(a?.scheduledAt || a?.preferredDate || Infinity) - new Date(b?.scheduledAt || b?.preferredDate || Infinity));
    else if (sort === 'status') list = [...list].sort((a, b) => String(a?.status || '').localeCompare(String(b?.status || '')));
    else list = [...list].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
    return list;
  }, [bookings, dispatch, payment, range, search, serviceCategory, sort, status]);

  const stats = useMemo(() => {
    const raw = statsQuery.data?.bookings || statsQuery.data;
    const derived = {
      total: bookings.length,
      pending: bookings.filter((item) => item?.status === 'PENDING').length,
      accepted: bookings.filter((item) => item?.status === 'ACCEPTED').length,
      inProgress: bookings.filter((item) => item?.status === 'IN_PROGRESS').length,
      completed: bookings.filter((item) => item?.status === 'COMPLETED').length,
      cancelled: bookings.filter((item) => item?.status === 'CANCELLED').length,
    };
    return {
      total: raw?.total ?? derived.total,
      pending: raw?.pending ?? derived.pending,
      accepted: raw?.accepted ?? derived.accepted,
      inProgress: raw?.inProgress ?? raw?.in_progress ?? derived.inProgress,
      completed: raw?.completed ?? derived.completed,
      cancelled: raw?.cancelled ?? derived.cancelled,
      derived: !(raw?.total != null),
    };
  }, [bookings, statsQuery.data]);

  const runAction = async () => {
    if (!pendingAction?.id || !pendingAction?.type) return;
    try {
      if (pendingAction.type === 'cancel') {
        await cancelBookingMutation.mutateAsync({ id: pendingAction.id });
        appToast.success('Booking cancelled successfully.');
      } else if (pendingAction.type === 'status' && pendingAction.nextStatus) {
        await updateStatusMutation.mutateAsync({ id: pendingAction.id, status: pendingAction.nextStatus });
        appToast.success('Booking status updated successfully.');
      }
      setPendingAction(null);
      bookingsQuery.refetch();
      statsQuery.refetch();
      if (selectedBookingId) {
        bookingDetailsQuery.refetch();
        bookingTimelineQuery.refetch();
      }
    } catch (error) {
      const code = error?.response?.status;
      if ((code === 404 || code === 405) && pendingAction.type === 'cancel') {
        setSupportsActions((prev) => ({ ...prev, cancel: false }));
      }
      if ((code === 404 || code === 405) && pendingAction.type === 'status') {
        setSupportsActions((prev) => ({ ...prev, updateStatus: false }));
      }
      appToast.error(getErrorMessage(error, 'Unable to update booking right now.'));
    }
  };

  const timelinePayload = bookingTimelineQuery.data;
  const timelineData = Array.isArray(timelinePayload)
    ? timelinePayload
    : Array.isArray(timelinePayload?.history)
      ? timelinePayload.history
      : Array.isArray(timelinePayload?.timeline)
        ? timelinePayload.timeline
        : Array.isArray(selectedBooking?.statusHistory)
          ? selectedBooking.statusHistory
          : [];

  const actionButtons = (booking) => (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => setSelectedBookingId(booking?.id)}>
        View Details
      </Button>
      {supportsActions.cancel && booking?.status !== 'COMPLETED' && booking?.status !== 'CANCELLED' ? (
        <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => setPendingAction({ type: 'cancel', id: booking?.id, code: booking?.bookingCode })}>
          Cancel
        </Button>
      ) : null}
      {supportsActions.updateStatus && booking?.status === 'PENDING' ? (
        <Button type="button" className="h-9 rounded-xl" onClick={() => setPendingAction({ type: 'status', id: booking?.id, code: booking?.bookingCode, nextStatus: 'ACCEPTED' })}>
          Mark Accepted
        </Button>
      ) : null}
      {supportsActions.updateStatus && booking?.status === 'ACCEPTED' ? (
        <Button type="button" className="h-9 rounded-xl" onClick={() => setPendingAction({ type: 'status', id: booking?.id, code: booking?.bookingCode, nextStatus: 'IN_PROGRESS' })}>
          Start
        </Button>
      ) : null}
      {supportsActions.updateStatus && booking?.status === 'IN_PROGRESS' ? (
        <Button type="button" className="h-9 rounded-xl" onClick={() => setPendingAction({ type: 'status', id: booking?.id, code: booking?.bookingCode, nextStatus: 'COMPLETED' })}>
          Complete
        </Button>
      ) : null}
    </div>
  );

  const detailsContent = selectedBooking ? (
    <div className="space-y-4 text-sm text-[var(--sf-text-muted)]">
      <div>
        <p><span className="font-semibold text-[var(--sf-text-main)]">Booking:</span> #{selectedBooking?.bookingCode || selectedBooking?.id}</p>
        <p><span className="font-semibold text-[var(--sf-text-main)]">Status:</span> <BookingStatusBadge booking={selectedBooking} audience="admin" className="ml-2" /></p>
        <p><span className="font-semibold text-[var(--sf-text-main)]">Dispatch:</span> {selectedBooking?.dispatchState || '—'}</p>
      </div>
      <div>
        <p><span className="font-semibold text-[var(--sf-text-main)]">Service:</span> {getServiceName(selectedBooking)}</p>
        {selectedBooking?.description ? <p><span className="font-semibold text-[var(--sf-text-main)]">Description:</span> {selectedBooking.description}</p> : null}
        {selectedBooking?.specialInstructions ? <p><span className="font-semibold text-[var(--sf-text-main)]">Instructions:</span> {selectedBooking.specialInstructions}</p> : null}
      </div>
      <div>
        <p><span className="font-semibold text-[var(--sf-text-main)]">Customer:</span> {getCustomerName(selectedBooking)}</p>
        {selectedBooking?.customer?.phone ? <p><span className="font-semibold text-[var(--sf-text-main)]">Phone:</span> {selectedBooking.customer.phone}</p> : null}
        <p><span className="font-semibold text-[var(--sf-text-main)]">Address:</span> {selectedBooking?.address || selectedBooking?.location?.address || '—'}</p>
      </div>
      <div>
        <p><span className="font-semibold text-[var(--sf-text-main)]">Provider:</span> {getProviderName(selectedBooking)}</p>
        <p><span className="font-semibold text-[var(--sf-text-main)]">Schedule:</span> {getSchedule(selectedBooking)}</p>
        <p><span className="font-semibold text-[var(--sf-text-main)]">Payment:</span> {selectedBooking?.paymentStatus ? <StatusBadge status={selectedBooking.paymentStatus} className="ml-2" /> : '—'}</p>
        <p><span className="font-semibold text-[var(--sf-text-main)]">Amount:</span> {getAmount(selectedBooking) == null ? 'Not available' : formatCurrency(getAmount(selectedBooking))}</p>
      </div>
      <div>
        <p className="font-semibold text-[var(--sf-text-main)]">Timeline</p>
        {bookingTimelineQuery.isLoading ? (
          <p>Loading timeline...</p>
        ) : timelineData.length ? (
          <ul className="mt-2 space-y-2">
            {timelineData.map((entry, index) => (
              <li key={entry?.id || `${entry?.status || 'step'}-${index}`} className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-3 py-2">
                <p className="font-medium text-[var(--sf-text-main)]">{entry?.status || entry?.label || 'Update'}</p>
                <p className="text-xs">{entry?.changedAt || entry?.createdAt ? formatDate(entry?.changedAt || entry?.createdAt, { includeTime: true }) : 'Time unavailable'}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2">No booking timeline available.</p>
        )}
      </div>
      <div>{actionButtons(selectedBooking)}</div>
    </div>
  ) : (
    <p className="text-sm text-[var(--sf-text-muted)]">Booking details unavailable.</p>
  );

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <PageHeader
        eyebrow="Admin"
        title="Bookings"
        description="Monitor customer bookings, provider assignment, dispatch progress, and payment status."
        actions={
          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => {
            bookingsQuery.refetch();
            statsQuery.refetch();
          }}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: 'Total Bookings', value: stats.total, icon: ListChecks },
          { label: 'Pending', value: stats.pending, icon: Clock3 },
          { label: 'Accepted', value: stats.accepted, icon: CheckCircle2 },
          { label: 'In Progress', value: stats.inProgress, icon: FileClock },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2 },
          { label: 'Cancelled', value: stats.cancelled, icon: XCircle },
        ].map((card) => (
          <article key={card.label} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
            <div className="flex items-center gap-2 text-[var(--sf-text-muted)]">
              <card.icon className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.12em]">{card.label}</p>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-[var(--sf-text-main)]">{card.value ?? '—'}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr_0.9fr_0.9fr_0.9fr]">
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Search</span>
            <input value={search} onChange={(event) => setParam('search', event.target.value)} placeholder="Search by booking code, customer, provider, service, or location..." className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]" />
          </label>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Booking Status</span>
            <select value={status} onChange={(event) => setParam('status', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Dispatch</span>
            <select value={dispatch} onChange={(event) => setParam('dispatch', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              {dispatchStates.map((option) => <option key={option} value={option}>{option === 'all' ? 'All Dispatch States' : option}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Payment</span>
            <select value={payment} onChange={(event) => setParam('payment', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              {paymentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Service Category</span>
            <select value={serviceCategory} onChange={(event) => setParam('serviceCategory', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              <option value="all">All categories</option>
              {(Array.isArray(categoriesQuery.data) ? categoriesQuery.data : []).map((item) => (
                <option key={item?.id} value={item?.id}>{item?.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Date range</span>
            <select value={range} onChange={(event) => setParam('range', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              {rangeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Sort</span>
            <select value={sort} onChange={(event) => setParam('sort', event.target.value)} className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]">
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      {bookingsQuery.isLoading ? (
        <section className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
          ))}
        </section>
      ) : null}

      {!bookingsQuery.isLoading && bookingsQuery.isError ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
          <p className="font-semibold text-[var(--sf-text-main)]">Unable to load bookings right now.</p>
          <Button type="button" variant="outline" className="mt-3 rounded-xl" onClick={() => bookingsQuery.refetch()}>
            Retry
          </Button>
        </section>
      ) : null}

      {!bookingsQuery.isLoading && !bookingsQuery.isError && !filteredBookings.length ? (
        <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 text-center">
          <p className="text-lg font-semibold text-[var(--sf-text-main)]">
            {bookings.length ? 'No bookings match these filters.' : 'No bookings found.'}
          </p>
          {bookings.length ? (
            <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={() => setSearchParams(new URLSearchParams())}>
              Clear Filters
            </Button>
          ) : null}
        </section>
      ) : null}

      {!bookingsQuery.isLoading && !bookingsQuery.isError && filteredBookings.length ? (
        <>
          <section className="hidden overflow-x-auto rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] lg:block">
            <table className="min-w-[1380px] w-full text-left">
              <thead className="bg-[var(--sf-surface-soft)]">
                <tr className="text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Dispatch</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="sticky right-0 z-10 whitespace-nowrap bg-[var(--sf-surface-soft)] px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking?.id} className="border-t border-[var(--sf-border)]">
                    <td className="px-4 py-4 text-sm">
                      <p className="max-w-[180px] truncate font-semibold text-[var(--sf-text-main)]">{booking?.bookingCode || booking?.id}</p>
                      <p className="text-xs text-[var(--sf-text-muted)]">{booking?.createdAt ? formatDate(booking.createdAt) : '—'}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">
                      <p className="max-w-[180px] truncate">{getServiceName(booking)}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">
                      <p className="max-w-[170px] truncate">{getCustomerName(booking)}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">
                      <p className="max-w-[170px] truncate">{getProviderName(booking)}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">
                      <p className="max-w-[220px] truncate">{getSchedule(booking)}</p>
                    </td>
                    <td className="px-4 py-4"><BookingStatusBadge booking={booking} audience="admin" /></td>
                    <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">
                      <p className="max-w-[140px] truncate">{getDispatch(booking)}</p>
                    </td>
                    <td className="px-4 py-4 text-sm">{booking?.paymentStatus ? <StatusBadge status={booking.paymentStatus} /> : '—'}</td>
                    <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">{getAmount(booking) == null ? 'Not available' : formatCurrency(getAmount(booking))}</td>
                    <td className="sticky right-0 z-[1] whitespace-nowrap bg-[var(--sf-surface)] px-4 py-4 shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.18)]">
                      {actionButtons(booking)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="space-y-3 lg:hidden">
            {filteredBookings.map((booking) => (
              <article key={booking?.id} className="w-full min-w-0 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
                <p className="truncate font-semibold text-[var(--sf-text-main)]">{booking?.bookingCode || booking?.id}</p>
                <p className="mt-1 truncate text-sm text-[var(--sf-text-muted)]">Service: {getServiceName(booking)}</p>
                <p className="truncate text-sm text-[var(--sf-text-muted)]">Customer: {getCustomerName(booking)}</p>
                <p className="truncate text-sm text-[var(--sf-text-muted)]">Provider: {getProviderName(booking)}</p>
                <p className="truncate text-sm text-[var(--sf-text-muted)]">Date: {getSchedule(booking)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <BookingStatusBadge booking={booking} audience="admin" />
                  {booking?.dispatchState ? <StatusBadge status={booking.dispatchState} /> : null}
                  {booking?.paymentStatus ? <StatusBadge status={booking.paymentStatus} /> : null}
                </div>
                <p className="mt-2 text-sm text-[var(--sf-text-muted)]">{getAmount(booking) == null ? 'Amount unavailable' : formatCurrency(getAmount(booking))}</p>
                <div className="mt-3 [&_button]:h-10 [&_button]:w-full">{actionButtons(booking)}</div>
              </article>
            ))}
          </section>
        </>
      ) : null}

      {/* TODO: Add manual provider assignment action when backend assign-provider endpoint contract is available. */}
      {/* TODO: Add export action only after backend export endpoint is confirmed for admin bookings. */}

      {isDesktop ? (
        <Modal open={Boolean(selectedBookingId)} onClose={() => setSelectedBookingId(null)} title="Booking Details">
          {bookingDetailsQuery.isLoading ? <p className="text-sm text-[var(--sf-text-muted)]">Loading booking details...</p> : detailsContent}
        </Modal>
      ) : (
        <Drawer open={Boolean(selectedBookingId)} onClose={() => setSelectedBookingId(null)} title="Booking Details">
          {bookingDetailsQuery.isLoading ? <p className="text-sm text-[var(--sf-text-muted)]">Loading booking details...</p> : detailsContent}
        </Drawer>
      )}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        onConfirm={runAction}
        title={pendingAction?.type === 'cancel' ? 'Cancel booking?' : 'Update booking status?'}
        description={
          pendingAction?.type === 'cancel'
            ? `Are you sure you want to cancel booking ${pendingAction?.code || ''}?`
            : `Are you sure you want to set ${pendingAction?.code || 'this booking'} to ${pendingAction?.nextStatus || 'new status'}?`
        }
        confirmLabel={pendingAction?.type === 'cancel' ? 'Cancel Booking' : 'Update Status'}
        confirmLoading={cancelBookingMutation.isPending || updateStatusMutation.isPending}
      />
    </Container>
  );
}

export default AdminBookings;
