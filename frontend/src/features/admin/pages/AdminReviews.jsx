import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../../components/common/PageHeader';
import { Container } from '../../../components/ui/Layout/Container';
import { Card } from '../../../components/ui/Layout/Card';
import { Button } from '../../../components/ui/Button/Button';
import { Skeleton } from '../../../components/ui/Feedback/Skeleton';
import { EmptyState } from '../../../components/ui/Feedback/EmptyState';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { AdminReviewsTable } from '../../review/components/AdminReviewsTable';
import { ReviewDetailsDialog } from '../../review/components/ReviewDetailsDialog';
import { ReviewList } from '../../review/components/ReviewList';
import { ReviewSummary } from '../../review/components/ReviewSummary';
import { useReviews } from '../../review/hooks/useReviews';

const ratingFilterOptions = [
  { value: 'all', label: 'All ratings' },
  { value: '5', label: '5 stars' },
  { value: '4', label: '4 stars' },
  { value: '3', label: '3 stars' },
  { value: '2', label: '2 stars' },
  { value: '1', label: '1 star' },
];

function AdminReviews() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedReview, setSelectedReview] = useState(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const ratingFilter = searchParams.get('rating') || 'all';
  const search = searchParams.get('search') || '';
  const reviewsQuery = useReviews('all');

  const reviews = useMemo(() => (Array.isArray(reviewsQuery.data) ? reviewsQuery.data : []), [reviewsQuery.data]);
  const filteredReviews = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return reviews.filter((review) => {
      const roundedRating = String(Math.round(Number(review?.rating || 0)));
      if (ratingFilter !== 'all' && roundedRating !== ratingFilter) return false;

      if (!needle) return true;
      const bookingCode = review?.booking?.bookingCode || review?.bookingId || '';
      const customerName = review?.author?.name || review?.customer?.name || '';
      const providerName = review?.booking?.provider?.name || review?.provider?.name || '';
      const serviceName = review?.booking?.service?.name || review?.service?.name || '';
      const comment = review?.comment || '';
      const text = `${bookingCode} ${customerName} ${providerName} ${serviceName} ${comment}`.toLowerCase();
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
        eyebrow="Admin"
        title="Reviews"
        description="Monitor customer feedback, provider ratings, and review quality."
      />

      <ReviewSummary reviews={reviews} labelFromLoaded />

      <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
        <div className="grid gap-3 md:grid-cols-[0.8fr_1fr_auto]">
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
              placeholder="Search booking, service, customer, provider..."
              className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)]"
            />
          </label>
          <div className="flex items-end">
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => setSearchParams(new URLSearchParams())}>
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {reviewsQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-2xl" />)}
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
          <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={() => reviewsQuery.refetch()}>
            Retry
          </Button>
        </Card>
      ) : null}

      {!reviewsQuery.isLoading && !reviewsQuery.isError && !filteredReviews.length ? (
        <EmptyState
          title={reviews.length ? 'No reviews match these filters.' : 'No reviews yet.'}
          description="Customer feedback entries will appear here."
        />
      ) : null}

      {!reviewsQuery.isLoading && !reviewsQuery.isError && filteredReviews.length ? (
        <>
          <AdminReviewsTable reviews={filteredReviews} onViewDetails={setSelectedReview} />
          <div className="lg:hidden">
            <ReviewList reviews={filteredReviews} role="admin" renderActions={(review) => (
              <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setSelectedReview(review)}>
                View Details
              </Button>
            )} />
          </div>
        </>
      ) : null}

      <ReviewDetailsDialog
        open={Boolean(selectedReview)}
        onClose={() => setSelectedReview(null)}
        review={selectedReview}
        isDesktop={isDesktop}
      />

      {/* TODO: Enable hide/unhide/delete/report-resolution actions when backend moderation endpoints are available. */}
    </Container>
  );
}

export default AdminReviews;
