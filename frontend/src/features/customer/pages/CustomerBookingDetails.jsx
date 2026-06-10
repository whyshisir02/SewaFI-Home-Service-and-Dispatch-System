import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { BookingActionsCard } from '../../../components/booking/BookingActionsCard';
import { BookingLocationPanel } from '../../../components/booking/BookingLocationPanel';
import { BookingPaymentCard } from '../../../components/booking/BookingPaymentCard';
import { BookingProgressTimeline } from '../../../components/booking/BookingProgressTimeline';
import { BookingServiceDetails } from '../../../components/booking/BookingServiceDetails';
import { BookingStatusCard } from '../../../components/booking/BookingStatusCard';
import { CancelBookingDialog } from '../../../components/booking/CancelBookingDialog';
import { LiveUpdatesPanel } from '../../../components/booking/LiveUpdatesPanel';
import { ProviderDetailsCard } from '../../../components/booking/ProviderDetailsCard';
import { SafetyTrustStrip } from '../../../components/booking/SafetyTrustStrip';
import { Button } from '../../../components/ui/Button/Button';
import { Card } from '../../../components/ui/Layout/Card';
import { EmptyState } from '../../../components/ui/Feedback/EmptyState';
import { Skeleton } from '../../../components/ui/Feedback/Skeleton';
import { Container } from '../../../components/ui/Layout/Container';
import { ROUTES } from '../../../constants/routes.constant';
import { getCustomerCancellationPolicy } from '../../../utils/bookingCancellation';
import { formatDate } from '../../../utils/formatDate';
import { ReviewForm } from '../../review/components/ReviewForm';
import { StarRatingDisplay } from '../../review/components/StarRatingDisplay';
import { useBookingTracking, useBookingTrackingSocket, useCancelBooking } from '../../../hooks/useBookingTracking';

function TrackingSkeleton() {
  return (
    <Container className="space-y-6 py-10">
      <Skeleton className="h-16 w-2/3 rounded-2xl" />
      <Skeleton className="h-56 rounded-[28px]" />
      <Skeleton className="h-44 rounded-[28px]" />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr_360px]">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </Container>
  );
}

function BookingErrorState({ title, description, onRetry }) {
  return (
    <Container className="py-12">
      <div className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 shadow-[var(--sf-shadow)]">
        <EmptyState title={title} description={description} />
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          {onRetry ? (
            <Button type="button" onClick={onRetry} className="rounded-xl">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </Button>
          ) : null}
          <Button as={Link} to={ROUTES.customer.bookings} variant="outline" className="rounded-xl">
            Back to My Bookings
          </Button>
          <Button as={Link} to={ROUTES.home} variant="ghost" className="rounded-xl">
            Go Home
          </Button>
        </div>
      </div>
    </Container>
  );
}

const getScheduledWarningTime = (booking) => {
  const value =
    booking?.scheduledEndTime ||
    booking?.scheduledTime ||
    booking?.scheduledAt ||
    booking?.preferredDate;

  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

function CustomerBookingDetails() {
  const { id } = useParams();
  const bookingQuery = useBookingTracking(id);
  const socketState = useBookingTrackingSocket(id);
  const cancelMutation = useCancelBooking();
  const [cancelOpen, setCancelOpen] = useState(false);
  const booking = bookingQuery.data;
  const isNotFound = bookingQuery.error?.response?.status === 404;
  const canReview =
    booking?.status === 'COMPLETED' &&
    String(booking?.paymentStatus || '').toUpperCase() === 'PAID' &&
    Boolean(booking?.providerId);
  const comparisonTime = bookingQuery.dataUpdatedAt || 0;
  const scheduledWarningTime = getScheduledWarningTime(booking);
  const showScheduleWarning =
    Boolean(scheduledWarningTime) &&
    ['PENDING', 'ACCEPTED'].includes(String(booking?.status || '').toUpperCase()) &&
    scheduledWarningTime.getTime() < comparisonTime;
  const cancellationPolicy = getCustomerCancellationPolicy(booking);

  const handleCancel = async (reason) => {
    await cancelMutation.mutateAsync({ id: booking.id, reason });
    setCancelOpen(false);
    bookingQuery.refetch();
  };

  if (bookingQuery.isLoading) return <TrackingSkeleton />;

  if (bookingQuery.isError && !isNotFound) {
    return (
      <BookingErrorState
        title="Unable to load booking details"
        description="Unable to load booking details right now."
        onRetry={() => bookingQuery.refetch()}
      />
    );
  }

  if (isNotFound || !booking?.id) {
    return (
      <BookingErrorState
        title="Booking not found"
        description="We could not find this booking. It may have been removed or the link may be incorrect."
      />
    );
  }

  return (
    <div className="bg-[var(--sf-bg)]">
      <Container className="space-y-8 py-8 sm:py-10 lg:py-12">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Button as={Link} to={ROUTES.customer.bookings} variant="ghost" className="mb-4 rounded-xl">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to My Bookings
            </Button>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--sf-secondary)]">Booking tracking</p>
            <h1 className="mt-3 font-display text-[32px] font-extrabold leading-[42px] text-[var(--sf-text-main)] sm:text-[46px] sm:leading-[56px]">
              Track Your Booking
            </h1>
            <p className="mt-3 text-[15px] leading-7 text-[var(--sf-text-muted)] sm:text-lg">
              Real-time updates on your service from request to completion.
            </p>
          </div>
        </header>

        <BookingStatusCard booking={booking} onRefresh={() => bookingQuery.refetch()} refreshing={bookingQuery.isFetching} />

        {showScheduleWarning ? (
          <Card className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-[var(--sf-text-main)]">
            Scheduled service time has passed. Please contact provider/support or reschedule.
          </Card>
        ) : null}

        <BookingProgressTimeline booking={booking} />

        <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr_360px]">
          <ProviderDetailsCard booking={booking} />
          <BookingLocationPanel
            booking={booking}
            trackingLocations={socketState.trackingLocations}
            trackingMessage={socketState.trackingMessage}
          />
          <LiveUpdatesPanel booking={booking} socketConnected={socketState.connected} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <BookingServiceDetails booking={booking} />
          <BookingPaymentCard booking={booking} />
          <BookingActionsCard
            onCancel={() => setCancelOpen(true)}
            cancellationPolicy={cancellationPolicy}
          />
        </div>

        <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
          <h2 className="text-lg font-bold text-[var(--sf-text-main)]">Review and Rating</h2>
          {booking?.review ? (
            <div className="mt-3 space-y-2 text-sm text-[var(--sf-text-muted)]">
              <StarRatingDisplay rating={Number(booking.review.rating || 0)} />
              {booking.review.comment ? <p className="text-[var(--sf-text-main)]">{booking.review.comment}</p> : null}
              <p>Submitted: {booking.review.createdAt ? formatDate(booking.review.createdAt, { includeTime: true }) : 'N/A'}</p>
            </div>
          ) : canReview ? (
            <div className="mt-3">
              <ReviewForm
                bookingId={booking.id}
                providerId={booking.providerId}
                onSuccess={() => bookingQuery.refetch()}
              />
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--sf-text-muted)]">Review available after completed and paid booking.</p>
          )}
        </Card>

        <SafetyTrustStrip />
      </Container>

      <CancelBookingDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        loading={cancelMutation.isPending}
        description={cancellationPolicy.confirmDescription || undefined}
      />
    </div>
  );
}

export default CustomerBookingDetails;
