import { Button } from '../../../components/ui/Button/Button';
import { formatDate } from '../../../utils/formatDate';
import { StarRatingDisplay } from './StarRatingDisplay';

export function AdminReviewsTable({ reviews = [], onViewDetails }) {
  return (
    <section className="hidden overflow-hidden rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] lg:block">
      <table className="w-full text-left">
        <thead className="bg-[var(--sf-surface-soft)]">
          <tr className="text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">
            <th className="px-4 py-3">Review</th>
            <th className="px-4 py-3">Booking</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Provider</th>
            <th className="px-4 py-3">Service</th>
            <th className="px-4 py-3">Rating</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review?.id || review?.createdAt} className="border-t border-[var(--sf-border)] align-top">
              <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">
                <p className="font-semibold text-[var(--sf-text-main)]">{review?.id || 'N/A'}</p>
                <p>{review?.comment || 'No comment provided.'}</p>
              </td>
              <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">{review?.booking?.bookingCode || review?.bookingId || 'N/A'}</td>
              <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">{review?.author?.name || review?.customer?.name || 'Customer'}</td>
              <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">{review?.booking?.provider?.name || review?.provider?.name || 'N/A'}</td>
              <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">{review?.booking?.service?.name || review?.service?.name || 'N/A'}</td>
              <td className="px-4 py-4">
                <StarRatingDisplay rating={Number(review?.rating || 0)} />
              </td>
              <td className="px-4 py-4 text-sm text-[var(--sf-text-muted)]">{review?.createdAt ? formatDate(review.createdAt, { includeTime: true }) : 'N/A'}</td>
              <td className="px-4 py-4">
                <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => onViewDetails(review)}>
                  View Details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default AdminReviewsTable;

