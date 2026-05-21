import { Link } from 'react-router-dom';
import { Button } from '../ui/Button/Button';
import { ROUTES } from '../../constants/routes.constant';
import { getProviderStatus } from './providerProfileUtils';

export function ProviderBookingCTA({ provider }) {
  const status = getProviderStatus(provider);
  const isApproved = status === 'APPROVED';

  return (
    <aside className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
      <h2 className="text-lg font-bold text-[var(--sf-text-main)]">Booking</h2>

      {isApproved ? (
        <>
          <p className="mt-3 text-sm leading-6 text-[var(--sf-text-muted)]">
            SewaFi will dispatch eligible providers based on service type, location, and availability.
          </p>
          <Button as={Link} to={ROUTES.services} className="mt-4 w-full rounded-xl bg-[var(--sf-accent)] text-white hover:brightness-95">
            Book a Service
          </Button>
        </>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[var(--sf-text-muted)]">
          This provider is not currently available for bookings.
        </p>
      )}
    </aside>
  );
}

export default ProviderBookingCTA;

