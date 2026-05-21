import { Card } from '../../../components/ui/Layout/Card';
import { formatDate } from '../../../utils/formatDate';
import { StarRatingDisplay } from './StarRatingDisplay';

export function ReviewCard({ review, role = 'customer', actions }) {
  const serviceName = review?.booking?.service?.name || review?.service?.name || review?.serviceName || 'Service';
  const bookingCode = review?.booking?.bookingCode || review?.bookingCode || review?.bookingId || null;
  const providerName = review?.booking?.provider?.name || review?.provider?.name || null;
  const customerName = review?.author?.name || review?.customer?.name || null;
  const titleName =
    role === 'provider'
      ? customerName || 'Customer'
      : role === 'admin'
        ? customerName || 'Customer'
        : providerName || 'Provider';

  return (
    <Card className="space-y-4 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[var(--sf-text-main)]">{serviceName}</p>
          <p className="text-sm text-[var(--sf-text-muted)]">{titleName}</p>
          {bookingCode ? <p className="text-xs text-[var(--sf-text-muted)]">Booking: {bookingCode}</p> : null}
        </div>
        <StarRatingDisplay rating={Number(review?.rating || 0)} />
      </div>
      <p className="text-sm leading-7 text-[var(--sf-text-muted)]">{review?.comment || review?.review || 'No comment provided.'}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--sf-text-muted)]">{review?.createdAt ? formatDate(review.createdAt, { includeTime: true }) : 'Date unavailable'}</p>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </Card>
  );
}

export default ReviewCard;
