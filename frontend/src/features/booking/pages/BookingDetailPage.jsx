import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, RefreshCw } from 'lucide-react';
import { Container } from '../../../components/ui/Layout/Container';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/Button/Button';
import { Card } from '../../../components/ui/Layout/Card';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { ConfirmDialog } from '../../../components/ui/Overlay/ConfirmDialog';
import { EmptyState } from '../../../components/ui/Feedback/EmptyState';
import { Skeleton } from '../../../components/ui/Feedback/Skeleton';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { getErrorMessage } from '../../../utils/errorHandler';
import {
  buildBookingAddress,
  getBookingCoordinates,
  getBookingMapsAction,
} from '../../../utils/bookingLocation';
import { ROUTES } from '../../../constants/routes.constant';
import { deriveBookingStatusForDisplay } from '../../../constants/booking-status.constant';
import { appToast } from '../../../lib/toast';
import { useBookingDetail } from '../hooks/useBookingDetail';
import { providerApi } from '../../provider/api/provider.api';

const roleConfig = {
  customer: {
    backTo: ROUTES.customer.bookings,
    backLabel: 'Back to My Bookings',
    listLabel: 'Customer booking',
  },
  provider: {
    backTo: ROUTES.provider.assignedJobs,
    backLabel: 'Back to Assigned Jobs',
    listLabel: 'Provider job',
  },
  admin: {
    backTo: ROUTES.admin.bookings,
    backLabel: 'Back to Bookings',
    listLabel: 'Admin booking',
  },
};

const getTimelineFromTimestamps = (booking) => {
  const rows = [
    { key: 'createdAt', label: 'Created' },
    { key: 'acceptedAt', label: 'Accepted' },
    { key: 'startedAt', label: 'Started' },
    { key: 'completedAt', label: 'Completed' },
    { key: 'cancelledAt', label: 'Cancelled' },
  ];
  return rows
    .filter((row) => booking?.[row.key])
    .map((row) => ({ status: row.label, changedAt: booking[row.key] }));
};

const getAmount = (booking) => booking?.finalAmount ?? booking?.providerProposedAmount ?? booking?.finalPrice ?? booking?.estimatedAmount ?? booking?.estimatedPrice ?? null;

export function BookingDetailPage({ role = 'customer' }) {
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [pendingAction, setPendingAction] = useState(null);
  const [finalAmount, setFinalAmount] = useState('');
  const [providerNote, setProviderNote] = useState('');
  const [submittingFinalAmount, setSubmittingFinalAmount] = useState(false);
  const config = roleConfig[role] || roleConfig.customer;
  const { detailQuery, timelineQuery, cancelMutation, updateStatusMutation, timeline } = useBookingDetail({ id, role });

  const booking = detailQuery.data;
  const timelineRows = timeline.length ? timeline : getTimelineFromTimestamps(booking);
  const notFound = detailQuery.error?.response?.status === 404;

  const onRunAction = async () => {
    if (!pendingAction?.type || !booking?.id) return;
    try {
      if (pendingAction.type === 'cancel') {
        await cancelMutation.mutateAsync({ id: booking.id });
        appToast.success('Booking cancelled successfully.');
      } else if (pendingAction.type === 'status' && pendingAction.nextStatus) {
        await updateStatusMutation.mutateAsync({ id: booking.id, status: pendingAction.nextStatus });
        appToast.success('Booking status updated successfully.');
      }
      setPendingAction(null);
      detailQuery.refetch();
      timelineQuery.refetch();
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to update booking right now.'));
    }
  };

  if (detailQuery.isLoading) {
    return (
      <Container className="space-y-4 py-6 lg:py-8">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </Container>
    );
  }

  if (notFound) {
    return (
      <Container className="py-10">
        <Card className="rounded-2xl p-6">
          <EmptyState title="Booking not found." description="We could not find this booking." />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button as={Link} to={config.backTo} variant="outline" className="rounded-xl">{config.backLabel}</Button>
            <Button as={Link} to={ROUTES.home} variant="ghost" className="rounded-xl">Go to Dashboard</Button>
          </div>
        </Card>
      </Container>
    );
  }

  if (detailQuery.isError || !booking?.id) {
    return (
      <Container className="py-10">
        <Card className="rounded-2xl p-6">
          <EmptyState title="Unable to load booking details right now." />
          <div className="mt-4 flex gap-2">
            <Button type="button" onClick={() => detailQuery.refetch()} className="rounded-xl">Retry</Button>
            <Button as={Link} to={config.backTo} variant="outline" className="rounded-xl">{config.backLabel}</Button>
          </div>
        </Card>
      </Container>
    );
  }

  const displayStatus = deriveBookingStatusForDisplay(booking);
  const awaitingCustomerConfirmation = displayStatus === 'AWAITING_CONFIRMATION';
  const showCancel =
    role !== 'provider' &&
    !['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(booking?.status);
  const showStart = role === 'provider' && booking?.status === 'ACCEPTED';
  const showCompleteWorkAndAmount =
    role === 'provider' &&
    booking?.status === 'IN_PROGRESS' &&
    !awaitingCustomerConfirmation;
  const showWaitingForCustomerConfirmation =
    role === 'provider' && awaitingCustomerConfirmation;
  const coordinates = getBookingCoordinates(booking);
  const mapAction = getBookingMapsAction(booking);
  const fullAddress = buildBookingAddress(booking);

  const submitFinalAmount = async () => {
    const amountNumber = Number(finalAmount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      appToast.error('Please enter a valid final amount.');
      return;
    }
    setSubmittingFinalAmount(true);
    try {
      await providerApi.submitFinalAmount({
        bookingId: booking.id,
        finalAmount: amountNumber,
        providerNote: providerNote.trim() || undefined,
      });
      appToast.success('Final amount submitted. Waiting for customer confirmation.');
      setPendingAction(null);
      setFinalAmount('');
      setProviderNote('');
      queryClient.invalidateQueries({ queryKey: ['provider-assigned-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      detailQuery.refetch();
      timelineQuery.refetch();
    } catch (error) {
      appToast.error(getErrorMessage(error, 'Unable to submit final amount right now.'));
    } finally {
      setSubmittingFinalAmount(false);
    }
  };

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <PageHeader
        eyebrow={config.listLabel}
        title="Booking Details"
        description="View booking information, status updates, provider/customer details, and service progress."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button as={Link} to={config.backTo} variant="outline" className="h-11 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
              {config.backLabel}
            </Button>
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => { detailQuery.refetch(); timelineQuery.refetch(); }}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        )}
      />

      <Card className="rounded-2xl p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">Booking</p>
            <p className="text-lg font-bold text-[var(--sf-text-main)]">{booking?.bookingCode || booking?.id}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">Status</p>
            <StatusBadge status={displayStatus} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">Dispatch</p>
            {booking?.dispatchState ? <StatusBadge status={booking.dispatchState} /> : <p className="text-sm text-[var(--sf-text-muted)]">—</p>}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">Created</p>
            <p className="text-sm text-[var(--sf-text-main)]">{booking?.createdAt ? formatDate(booking.createdAt, { includeTime: true }) : '—'}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card className="rounded-2xl p-5">
            <h2 className="text-base font-bold text-[var(--sf-text-main)]">Status History</h2>
            {timelineQuery.isLoading ? (
              <div className="mt-3 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
            ) : timelineRows.length ? (
              <ul className="mt-3 space-y-2">
                {timelineRows.map((item, index) => (
                  <li key={item?.id || `${item?.status || 'item'}-${index}`} className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-3 py-2">
                    <p className="font-medium text-[var(--sf-text-main)]">{item?.status || item?.label || 'Update'}</p>
                    <p className="text-xs text-[var(--sf-text-muted)]">{item?.message || item?.note || ''}</p>
                    <p className="text-xs text-[var(--sf-text-muted)]">{item?.changedAt || item?.createdAt ? formatDate(item?.changedAt || item?.createdAt, { includeTime: true }) : 'Time unavailable'}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[var(--sf-text-muted)]">No detailed status history available yet.</p>
            )}
          </Card>

          <Card className="rounded-2xl p-5">
            <h2 className="text-base font-bold text-[var(--sf-text-main)]">Service Details</h2>
            <p className="mt-2 text-sm text-[var(--sf-text-main)]">{booking?.service?.name || booking?.serviceName || 'Service'}</p>
            {booking?.description ? <p className="mt-2 text-sm text-[var(--sf-text-muted)]">{booking.description}</p> : null}
            {booking?.specialInstructions ? <p className="mt-2 text-sm text-[var(--sf-text-muted)]">{booking.specialInstructions}</p> : null}
            {Array.isArray(booking?.images) && booking.images.length ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {booking.images.map((url, idx) => <img key={`${url}-${idx}`} src={url} alt={`Booking attachment ${idx + 1}`} className="h-20 w-full rounded-xl object-cover" />)}
              </div>
            ) : null}
          </Card>

          <Card className="rounded-2xl p-5">
            <h2 className="text-base font-bold text-[var(--sf-text-main)]">Location</h2>
            <div className="mt-3 flex items-start gap-2 text-sm text-[var(--sf-text-muted)]">
              <MapPin className="mt-0.5 h-4 w-4" />
              <div>
                <p>{fullAddress || 'Address not available'}</p>
                {role === 'provider' ? (
                  <>
                    {booking?.addressLandmark ? <p>Landmark: {booking.addressLandmark}</p> : null}
                    {(booking?.contactName || booking?.customer?.name) ? (
                      <p>Contact name: {booking?.contactName || booking?.customer?.name}</p>
                    ) : null}
                    {(booking?.contactPhone || booking?.customer?.phone) ? (
                      <p>Contact phone: {booking?.contactPhone || booking?.customer?.phone}</p>
                    ) : null}
                    {coordinates ? <p>GPS location captured.</p> : null}
                    {!coordinates ? (
                      <p className="mt-2">
                        GPS location was not captured. Use the written address and contact the customer if needed.
                      </p>
                    ) : null}
                    {mapAction?.url ? (
                      <div className="mt-2">
                        <Button
                          as="a"
                          href={mapAction.url}
                          target="_blank"
                          rel="noreferrer"
                          variant="outline"
                          className="h-9 rounded-xl"
                        >
                          {mapAction.label}
                        </Button>
                      </div>
                    ) : (
                      <p className="mt-2">Location is not available for this booking.</p>
                    )}
                  </>
                ) : null}
                <p>{[booking?.province, booking?.district, booking?.municipality, booking?.ward].filter(Boolean).join(', ') || '—'}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-2xl p-5">
            <h2 className="text-base font-bold text-[var(--sf-text-main)]">Customer</h2>
            <p className="mt-2 text-sm text-[var(--sf-text-main)]">{booking?.customer?.fullName || booking?.customer?.name || '—'}</p>
            {booking?.customer?.phone ? <p className="text-sm text-[var(--sf-text-muted)]">{booking.customer.phone}</p> : null}
            {booking?.customer?.email ? <p className="text-sm text-[var(--sf-text-muted)]">{booking.customer.email}</p> : null}
          </Card>

          <Card className="rounded-2xl p-5">
            <h2 className="text-base font-bold text-[var(--sf-text-main)]">Provider</h2>
            {booking?.provider ? (
              <>
                <p className="mt-2 text-sm text-[var(--sf-text-main)]">{booking?.provider?.fullName || booking?.provider?.name}</p>
                {booking?.provider?.phone ? <p className="text-sm text-[var(--sf-text-muted)]">{booking.provider.phone}</p> : null}
              </>
            ) : (
              <p className="mt-2 text-sm text-[var(--sf-text-muted)]">Provider not assigned yet.</p>
            )}
          </Card>

          <Card className="rounded-2xl p-5">
            <h2 className="text-base font-bold text-[var(--sf-text-main)]">Payment</h2>
            <p className="mt-2 text-sm text-[var(--sf-text-muted)]">
              {getAmount(booking) == null ? 'Price not available yet.' : formatCurrency(getAmount(booking))}
            </p>
            {booking?.paymentStatus ? <div className="mt-2"><StatusBadge status={booking.paymentStatus} /></div> : <p className="mt-2 text-sm text-[var(--sf-text-muted)]">No payment details available.</p>}
          </Card>

          <Card className="rounded-2xl p-5">
            <h2 className="text-base font-bold text-[var(--sf-text-main)]">Actions</h2>
            <div className="mt-3 space-y-2">
              {showCancel ? (
                <Button type="button" variant="outline" className="h-10 w-full rounded-xl" onClick={() => setPendingAction({ type: 'cancel' })}>
                  Cancel Booking
                </Button>
              ) : null}
              {showStart ? (
                <Button type="button" className="h-10 w-full rounded-xl" onClick={() => setPendingAction({ type: 'status', nextStatus: 'IN_PROGRESS' })}>
                  Start Work
                </Button>
              ) : null}
              {showCompleteWorkAndAmount ? (
                <Button type="button" className="h-10 w-full rounded-xl" onClick={() => setPendingAction({ type: 'submitFinalAmount' })}>
                  Complete Work & Submit Final Amount
                </Button>
              ) : null}
              {showWaitingForCustomerConfirmation ? (
                <Button type="button" variant="outline" className="h-10 w-full rounded-xl" disabled>
                  Waiting for Customer Confirmation
                </Button>
              ) : null}
              {role === 'customer' ? (
                <Button as={Link} to={ROUTES.contact} variant="ghost" className="h-10 w-full rounded-xl">Contact Support</Button>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingAction && pendingAction.type !== 'submitFinalAmount')}
        onClose={() => setPendingAction(null)}
        onConfirm={onRunAction}
        title={pendingAction?.type === 'cancel' ? 'Cancel Booking?' : 'Update Booking Status?'}
        description={
          pendingAction?.type === 'cancel'
            ? 'This action may affect the booking lifecycle. Continue only if you are sure.'
            : `Are you sure you want to move this booking to ${pendingAction?.nextStatus}?`
        }
        confirmLabel={pendingAction?.type === 'cancel' ? 'Cancel Booking' : 'Update Status'}
      />

      {pendingAction?.type === 'submitFinalAmount' ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center overflow-y-auto bg-black/45 px-4 py-4 sm:items-center">
          <Card className="w-full max-w-xl rounded-2xl p-5">
            <div className="max-h-[90vh] overflow-y-auto pr-1">
              <h3 className="text-lg font-bold text-[var(--sf-text-main)]">Complete Work & Submit Final Amount</h3>
              <p className="mt-2 text-sm text-[var(--sf-text-muted)]">
                Starting/base price: {booking?.estimatedAmount || booking?.estimatedPrice || booking?.basePrice ? formatCurrency(Number(booking?.estimatedAmount || booking?.estimatedPrice || booking?.basePrice)) : 'Not available'}
              </p>
              <label className="mt-3 block space-y-1 text-sm text-[var(--sf-text-main)]">
                <span>Final Amount (NPR)</span>
                <input
                  type="number"
                  min="1"
                  value={finalAmount}
                  onChange={(event) => setFinalAmount(event.target.value)}
                  className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]"
                />
              </label>
              <label className="mt-3 block space-y-1 text-sm text-[var(--sf-text-main)]">
                <span>Work Note</span>
                <textarea
                  rows={4}
                  value={providerNote}
                  onChange={(event) => setProviderNote(event.target.value)}
                  className="w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 py-2 text-sm text-[var(--sf-text-main)]"
                  placeholder="Describe what was completed."
                />
              </label>
              <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
                <Button type="button" className="h-10 w-full rounded-xl sm:w-auto" onClick={submitFinalAmount} loading={submittingFinalAmount} disabled={submittingFinalAmount}>
                  Complete Work & Submit Final Amount
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full rounded-xl sm:w-auto"
                  onClick={() => {
                    setPendingAction(null);
                    setFinalAmount('');
                    setProviderNote('');
                  }}
                  disabled={submittingFinalAmount}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </Container>
  );
}

export default BookingDetailPage;
