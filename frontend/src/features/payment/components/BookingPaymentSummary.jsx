import { Card } from '../../../components/ui/Layout/Card';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { formatDate } from '../../../utils/formatDate';

export function BookingPaymentSummary({ booking, payment }) {
  return (
    <Card className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <h2 className="text-base font-bold text-[var(--sf-text-main)]">Booking Summary</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">Booking Code</p>
          <p className="text-sm font-semibold text-[var(--sf-text-main)]">{booking?.bookingCode || booking?.id || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">Service</p>
          <p className="text-sm text-[var(--sf-text-main)]">{booking?.service?.name || booking?.serviceName || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">Provider</p>
          <p className="text-sm text-[var(--sf-text-main)]">{booking?.provider?.name || booking?.providerName || 'Not assigned'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">Booking Status</p>
          <StatusBadge status={booking?.status} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">Payment Status</p>
          <StatusBadge status={payment?.paymentStatus || booking?.paymentStatus || 'PENDING'} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--sf-text-muted)]">Created</p>
          <p className="text-sm text-[var(--sf-text-main)]">{booking?.createdAt ? formatDate(booking.createdAt, { includeTime: true }) : 'N/A'}</p>
        </div>
      </div>
    </Card>
  );
}

export default BookingPaymentSummary;
