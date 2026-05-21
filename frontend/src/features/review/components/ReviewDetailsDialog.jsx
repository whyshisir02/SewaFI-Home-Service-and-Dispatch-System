import { Drawer } from '../../../components/ui/Overlay/Drawer';
import { Modal } from '../../../components/ui/Overlay/Modal';
import { formatDate } from '../../../utils/formatDate';
import { StarRatingDisplay } from './StarRatingDisplay';

const Row = ({ label, value }) => (
  <div className="text-sm text-[var(--sf-text-muted)]">
    <span className="font-semibold text-[var(--sf-text-main)]">{label}:</span>{' '}
    {value == null || value === '' ? 'N/A' : value}
  </div>
);

export function ReviewDetailsDialog({ open, onClose, review, isDesktop }) {
  const Wrapper = isDesktop ? Modal : Drawer;

  return (
    <Wrapper open={open} onClose={onClose} title="Review Details">
      {!review ? (
        <p className="text-sm text-[var(--sf-text-muted)]">Review details unavailable.</p>
      ) : (
        <div className="space-y-4">
          <section className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3">
            <Row label="Rating" value={<StarRatingDisplay rating={Number(review?.rating || 0)} />} />
            <Row label="Review ID" value={review?.id} />
            <Row label="Booking Code" value={review?.booking?.bookingCode || review?.bookingCode || review?.bookingId} />
            <Row label="Service" value={review?.booking?.service?.name || review?.service?.name || review?.serviceName} />
            <Row label="Created" value={review?.createdAt ? formatDate(review.createdAt, { includeTime: true }) : null} />
          </section>
          <section className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3">
            <h4 className="mb-2 text-sm font-semibold text-[var(--sf-text-main)]">Reviewer</h4>
            <Row label="Customer" value={review?.author?.name || review?.customer?.name} />
            <Row label="Provider" value={review?.booking?.provider?.name || review?.provider?.name} />
          </section>
          <section className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3">
            <h4 className="mb-2 text-sm font-semibold text-[var(--sf-text-main)]">Comment</h4>
            <p className="text-sm leading-7 text-[var(--sf-text-muted)]">{review?.comment || 'No comment provided.'}</p>
          </section>
        </div>
      )}
    </Wrapper>
  );
}

export default ReviewDetailsDialog;
