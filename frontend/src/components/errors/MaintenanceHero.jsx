import { Link } from 'react-router-dom';
import { Home, RefreshCw, ServerCog, Wrench } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { ROUTES } from '../../constants/routes.constant';

export function MaintenanceHero({ message, onRetry, showContact }) {
  return (
    <section className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 text-center shadow-[var(--sf-shadow)] sm:p-8 lg:p-10">
      <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--sf-surface-soft)] text-[var(--sf-primary)]">
        <ServerCog className="h-8 w-8" aria-hidden="true" />
      </div>

      <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--sf-primary)]">
        <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
        Maintenance Mode
      </p>

      <h1 className="mt-5 font-display text-3xl font-extrabold text-[var(--sf-text-main)] sm:text-4xl">
        SewaFi Is Under Maintenance
      </h1>
      <p className="mt-4 text-base leading-7 text-[var(--sf-text-muted)]">
        We&apos;re improving the platform to make home service booking and dispatch more reliable.
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">
        {message || 'Some features may be temporarily unavailable. Please check back shortly.'}
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button type="button" onClick={onRetry} className="h-11 rounded-xl bg-[var(--sf-secondary)] px-6 text-white hover:brightness-95">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try Again
        </Button>
        <Button as={Link} to={ROUTES.home} variant="outline" className="h-11 rounded-xl px-6">
          <Home className="h-4 w-4" aria-hidden="true" />
          Go Home
        </Button>
        {showContact ? (
          <Button as={Link} to={ROUTES.contact} variant="ghost" className="h-11 rounded-xl px-6">
            Contact Support
          </Button>
        ) : null}
      </div>
    </section>
  );
}

export default MaintenanceHero;
