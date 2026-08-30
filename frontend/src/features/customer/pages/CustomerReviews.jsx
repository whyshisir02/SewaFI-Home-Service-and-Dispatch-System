import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../../components/common/PageHeader';
import { Container } from '../../../components/ui/Layout/Container';
import { Button } from '../../../components/ui/Button/Button';
import { Card } from '../../../components/ui/Layout/Card';
import { Skeleton } from '../../../components/ui/Feedback/Skeleton';
import { EmptyState } from '../../../components/ui/Feedback/EmptyState';
import { ROUTES } from '../../../constants/routes.constant';
import { bookingApi } from '../../booking/api/booking.api';
import { ReviewForm } from '../../review/components/ReviewForm';
import { ReviewList } from '../../review/components/ReviewList';
import { ReviewSummary } from '../../review/components/ReviewSummary';
import { useReviews } from '../../review/hooks/useReviews';

const ratingFilterOptions = [
  { value: 'all', label: 'All' },
  { value: '5', label: '5 stars' },
  { value: '4', label: '4 stars' },
  { value: '3', label: '3 stars and below' },
];

function CustomerReviews() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const ratingFilter = searchParams.get('rating') || 'all';
  const search = searchParams.get('search') || '';
  const selectedBookingId = searchParams.get('bookingId') || '';

  const reviewsQuery = useReviews('my');
  const completedBookingsQuery = useQuery({
    queryKey: ['customer-completed-bookings-for-reviews'],
    queryFn: () => bookingApi.list({ status: 'COMPLETED' }),
    retry: 1,
  });

  const reviews = useMemo(() => (Array.isArray(reviewsQuery.data) ? reviewsQuery.data : []), [reviewsQuery.data]);
  const completedBookings = useMemo(
    () => (Array.isArray(completedBookingsQuery.data) ? completedBookingsQuery.data : []),
    [completedBookingsQuery.data]
  );

  const reviewableBookings = useMemo(
    () => completedBookings.filter((booking) => !booking?.review),
    [completedBookings]
  );

  const activeReviewableBooking = useMemo(
    () => reviewableBookings.find((booking) => String(booking?.id) === String(selectedBookingId)) || null,
    [reviewableBookings, selectedBookingId]
  );

  const filteredReviews = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return reviews.filter((review) => {
      const rating = Number(review?.rating || 0);
      if (ratingFilter === '5' && Math.round(rating) !== 5) return false;
      if (ratingFilter === '4' && Math.round(rating) !== 4) return false;
      if (ratingFilter === '3' && Math.round(rating) > 3) return false;

      if (!needle) return true;
      const serviceName = review?.booking?.service?.name || review?.service?.name || '';
      const providerName = review?.booking?.provider?.name || review?.provider?.name || '';
      const bookingCode = review?.booking?.bookingCode || review?.bookingCode || '';
      const text = `${serviceName} ${providerName} ${bookingCode}`.toLowerCase();
      return text.includes(needle);
    });
  }, [ratingFilter, reviews, search]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    const normalized = String(value || '').trim();
    if (!normalized || normalized === 'all') next.delete(key);
    else next.set(key, normalized);
    setSearchParams(next);
  };

  return (
    <Container className="space-y-6 py-6 lg:py-8">
      <PageHeader
        eyebrow="Reviews"
        title="My Reviews"
        description="View reviews you submitted for completed bookings."
      />

      <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
        <h2 className="text-base font-semibold text-[var(--sf-text-main)]">Write a Review</h2>
        {completedBookingsQuery.isLoading ? (
          <Skeleton className="mt-3 h-24 rounded-xl" />
        ) : reviewableBookings.length ? (
          <div className="mt-3 space-y-4">
            <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
              <span>Completed booking</span>
              <select
                value={selectedBookingId}
                onChange={(event) => setParam('bookingId', event.target.value)}
                className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]"
              >
                <option value="">Select completed booking</option>
                {reviewableBookings.map((booking) => (
                  <option key={booking?.id} value={booking?.id}>
                    {(booking?.bookingCode || booking?.id)} - {booking?.service?.name || 'Service'}
                  </option>
                ))}
              </select>
            </label>
            {activeReviewableBooking ? (
              <ReviewForm
                bookingId={activeReviewableBooking.id}
                providerId={activeReviewableBooking.providerId}
                onSuccess={() => {
                  setParam('bookingId', '');
                  reviewsQuery.refetch();
                  completedBookingsQuery.refetch();
                }}
              />
            ) : (
              <p className="text-sm text-[var(--sf-text-muted)]">Select a completed booking to submit a review.</p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--sf-text-muted)]">No eligible completed bookings for review right now.</p>
        )}
      </Card>

      <ReviewSummary reviews={reviews} labelFromLoaded />

      <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
        <div className="grid gap-3 md:grid-cols-[0.8fr_1fr]">
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Rating</span>
            <select
              value={ratingFilter}
              onChange={(event) => setParam('rating', event.target.value)}
              className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]"
            >
              {ratingFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
            <span>Search</span>
            <input
              value={search}
              onChange={(event) => setParam('search', event.target.value)}
              placeholder="Search by service or provider..."
              className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]"
            />
          </label>
        </div>
      </Card>

      {reviewsQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-2xl" />)}
        </div>
      ) : null}

      {!reviewsQuery.isLoading && reviewsQuery.error?.code === 'REVIEW_ENDPOINT_UNAVAILABLE' ? (
        <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6">
          <p className="text-lg font-semibold text-[var(--sf-text-main)]">Reviews are currently unavailable.</p>
          <p className="mt-2 text-sm text-[var(--sf-text-muted)]">Please try again later.</p>
        </Card>
      ) : null}

      {!reviewsQuery.isLoading && reviewsQuery.isError && reviewsQuery.error?.code !== 'REVIEW_ENDPOINT_UNAVAILABLE' ? (
        <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6">
          <p className="text-lg font-semibold text-[var(--sf-text-main)]">Unable to load reviews right now.</p>
          <div className="mt-4 flex gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => reviewsQuery.refetch()}>
              Retry
            </Button>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => completedBookingsQuery.refetch()}>
              Refresh
            </Button>
          </div>
        </Card>
      ) : null}

      {!reviewsQuery.isLoading && !reviewsQuery.isError && !filteredReviews.length ? (
        <EmptyState
          title={reviews.length ? 'No reviews match these filters.' : 'No reviews yet.'}
          description="Completed booking reviews will appear here."
          actionLabel="View Completed Bookings"
          onAction={() => navigate(`${ROUTES.customer.bookings}?status=COMPLETED`)}
        />
      ) : null}

      {!reviewsQuery.isLoading && !reviewsQuery.isError && filteredReviews.length ? (
        <ReviewList reviews={filteredReviews} userRole="customer" />
      ) : null}
    </Container>
  );
}

export default CustomerReviews;
