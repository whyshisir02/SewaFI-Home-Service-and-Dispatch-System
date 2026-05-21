import { Link } from 'react-router-dom';
import { AlertTriangle, LifeBuoy } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { ROUTES } from '../../constants/routes.constant';

export function BookingActionsCard({ booking, onCancel }) {
  const canCancel = ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(booking.status);

  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-sm">
      <h2 className="font-display text-2xl font-extrabold text-[var(--sf-text-main)]">Help and Actions</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">
        Need help with this booking? Contact support or cancel if the booking is still eligible.
      </p>
      <div className="mt-5 grid gap-3">
        <Button as={Link} to={ROUTES.contact} variant="outline" className="rounded-xl">
          <LifeBuoy className="h-4 w-4" aria-hidden="true" />
          Contact Support
        </Button>
        {canCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl border-[var(--sf-danger)] text-[var(--sf-danger)] hover:border-[var(--sf-danger)] hover:text-[var(--sf-danger)]">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Cancel Booking
          </Button>
        ) : null}
      </div>
    </section>
  );
}

export default BookingActionsCard;
