import { CreditCard, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button/Button';
import { ROUTES } from '../../../constants/routes.constant';
import { formatMoney } from './trackingUtils';

export function BookingPaymentCard({ booking }) {
  const finalPrice = formatMoney(booking.finalAmount || booking.finalPrice || booking.totalPrice);
  const estimatedPrice = formatMoney(booking.providerProposedAmount || booking.estimatedAmount || booking.estimatedPrice || booking.basePrice);
  const priceLabel = finalPrice ? 'Final Price' : estimatedPrice ? 'Estimated Price' : 'Price';
  const price = finalPrice || estimatedPrice || 'Price will be confirmed based on service details.';

  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-sm">
      <h2 className="font-display text-2xl font-extrabold text-[var(--sf-text-main)]">Payment and Estimate</h2>
      <div className="mt-5 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] p-5">
        <Wallet className="h-6 w-6 text-[var(--sf-secondary)]" aria-hidden="true" />
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-[var(--sf-text-soft)]">{priceLabel}</p>
        <p className="mt-2 text-2xl font-extrabold text-[var(--sf-text-main)]">{price}</p>
      </div>
      <div className="mt-4 grid gap-3 text-sm">
        {booking.paymentStatus ? (
          <div className="flex items-center justify-between rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] p-3">
            <span className="inline-flex items-center gap-2 text-[var(--sf-text-muted)]">
              <CreditCard className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
              Payment Status
            </span>
            <span className="font-bold text-[var(--sf-text-main)]">{booking.paymentStatus}</span>
          </div>
        ) : null}
        {booking.paymentMethod ? (
          <div className="flex items-center justify-between rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] p-3">
            <span className="text-[var(--sf-text-muted)]">Payment Method</span>
            <span className="font-bold text-[var(--sf-text-main)]">{booking.paymentMethod}</span>
          </div>
        ) : null}
      </div>
      {booking?.id ? (
        <Button as={Link} to={ROUTES.customer.paymentDetails.replace(':bookingId', booking.id)} variant="outline" className="mt-4 h-10 w-full rounded-xl">
          {booking?.paymentStatus === 'AWAITING_CONFIRMATION' ? 'Confirm Final Payment' : 'View Payment Details'}
        </Button>
      ) : null}
    </section>
  );
}

export default BookingPaymentCard;
