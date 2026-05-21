import { Card } from '../../../components/ui/Layout/Card';
import { StarRatingDisplay } from './StarRatingDisplay';

export function ReviewSummary({ reviews = [], labelFromLoaded = false }) {
  const average = reviews.length ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length : 0;
  const breakdown = reviews.reduce(
    (acc, review) => {
      const rounded = Math.max(1, Math.min(5, Math.round(Number(review?.rating || 0))));
      acc[rounded] += 1;
      return acc;
    },
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  );

  return (
    <Card className="space-y-4 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <h3 className="text-lg font-semibold text-[var(--sf-text-main)]">Rating Summary</h3>
      <StarRatingDisplay rating={average} />
      <p className="text-sm text-[var(--sf-text-muted)]">{reviews.length} total reviews</p>
      {labelFromLoaded ? <p className="text-xs text-[var(--sf-text-muted)]">From loaded reviews</p> : null}
      <div className="grid grid-cols-5 gap-2 text-center">
        {[5, 4, 3, 2, 1].map((star) => (
          <div key={star} className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-2 py-2">
            <p className="text-xs font-semibold text-[var(--sf-text-main)]">{star}★</p>
            <p className="text-xs text-[var(--sf-text-muted)]">{breakdown[star] || 0}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default ReviewSummary;
