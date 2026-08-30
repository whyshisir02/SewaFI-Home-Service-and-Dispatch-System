import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../../components/common/PageHeader';
import { Container } from '../../../components/ui/Layout/Container';
import { Card } from '../../../components/ui/Layout/Card';
import { Button } from '../../../components/ui/Button/Button';
import { Skeleton } from '../../../components/ui/Feedback/Skeleton';
import { EmptyState } from '../../../components/ui/Feedback/EmptyState';
import { ReviewList } from '../../review/components/ReviewList';
import { ReviewSummary } from '../../review/components/ReviewSummary';
import { useReviews } from '../../review/hooks/useReviews';

const ratingFilterOptions = [
  { value: 'all', label: 'All ratings' },
  { value: '5', label: '5 stars' },
  { value: '4', label: '4 stars' },
  { value: '3', label: '3 stars and below' },
];

function ProviderReviews() {
  const [searchParams, setSearchParams] = useSearchParams();
  const ratingFilter = searchParams.get('rating') || 'all';
  const reviewsQuery = useReviews('received');

  const reviews = useMemo(() => (Array.isArray(reviewsQuery.data) ? reviewsQuery.data : []), [reviewsQuery.data]);
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const rating = Number(review?.rating || 0);
      if (ratingFilter === '5' && Math.round(rating) !== 5) return false;
      if (ratingFilter === '4' && Math.round(rating) !== 4) return false;
      if (ratingFilter === '3' && Math.round(rating) > 3) return false;
      return true;
    });
  }, [ratingFilter, reviews]);

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
        title="Reviews"
        description="See customer feedback from completed services."
      />

      <ReviewSummary reviews={reviews} labelFromLoaded />

      <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
        <label className="space-y-1 text-sm text-[var(--sf-text-main)]">
          <span>Rating</span>
          <select
            value={ratingFilter}
            onChange={(event) => setParam('rating', event.target.value)}
            className="h-11 w-full rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 text-sm text-[var(--sf-text-main)] md:max-w-xs"
          >
            {ratingFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
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
          <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={() => reviewsQuery.refetch()}>
            Retry
          </Button>
        </Card>
      ) : null}

      {!reviewsQuery.isLoading && !reviewsQuery.isError && !filteredReviews.length ? (
        <EmptyState
          title={reviews.length ? 'No reviews match these filters.' : 'No reviews yet.'}
          description="Customer reviews will appear after completed services."
        />
      ) : null}

      {!reviewsQuery.isLoading && !reviewsQuery.isError && filteredReviews.length ? (
        <ReviewList
          reviews={filteredReviews}
          userRole="provider"
          emptyTitle="No reviews yet."
          emptyDescription="Customer reviews will appear after completed services."
        />
      ) : null}

      {/* TODO: Enable report review action when backend review reporting endpoint is available. */}
    </Container>
  );
}

export default ProviderReviews;
