import { StarRatingDisplay } from '../../../review/components/StarRatingDisplay';
import { formatDate } from '../../../../utils/formatDate';
import { getErrorMessage } from '../../../../utils/errorHandler';

export function ProviderReviewsSection({
  reviews = [],
  isLoading = false,
  isError = false,
  error = null,
  onRetry,
  unsupported = false,
}) {
  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <h2 className="text-lg font-bold text-[var(--sf-text-main)]">Customer Reviews</h2>

      {unsupported ? (
        <p className="mt-3 text-sm text-[var(--sf-text-muted)]">Reviews are currently unavailable.</p>
      ) : null}

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)]" />
          ))}
        </div>
      ) : null}

      {!unsupported && !isLoading && isError ? (
        <div className="mt-3 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3">
          <p className="text-sm text-[var(--sf-danger)]">{getErrorMessage(error, 'Unable to load provider reviews right now.')}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 text-sm font-semibold text-[var(--sf-secondary)] underline-offset-4 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!unsupported && !isLoading && !isError && !reviews.length ? (
        <p className="mt-3 text-sm text-[var(--sf-text-muted)]">No reviews yet.</p>
      ) : null}

      {!unsupported && !isLoading && !isError && reviews.length ? (
        <div className="mt-4 space-y-3">
          {reviews.map((review, index) => {
            const reviewerName = review?.customer?.name || review?.customer?.fullName || 'Customer';
            return (
              <article key={review?.id || `${reviewerName}-${review?.createdAt || index}`} className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-[var(--sf-text-main)]">{reviewerName}</p>
                  {review?.rating != null ? <StarRatingDisplay rating={Number(review.rating)} /> : null}
                </div>
                {review?.comment ? <p className="mt-2 text-sm text-[var(--sf-text-main)]">{review.comment}</p> : null}
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--sf-text-muted)]">
                  {review?.service?.name ? <span>{review.service.name}</span> : null}
                  {review?.bookingCode ? <span>#{review.bookingCode}</span> : null}
                  {review?.createdAt ? <span>{formatDate(review.createdAt)}</span> : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export default ProviderReviewsSection;
