import { Link } from 'react-router-dom';
import { Button } from '../../../../components/ui/Button/Button';
import { ROUTES } from '../../../../constants/routes.constant';

export function CategoryCTA({ categoryName, bookingPath }) {
  return (
    <section className="rounded-[28px] border border-[var(--sf-border)] bg-[linear-gradient(135deg,var(--sf-primary-soft),var(--sf-secondary-soft),var(--sf-surface))] p-6 sm:p-8">
      <h2 className="font-display text-3xl font-extrabold text-[var(--sf-text-main)] sm:text-4xl">
        Need a {categoryName || 'Service'} Service?
      </h2>
      <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sf-text-muted)]">
        Book through SewaFi and track your service request from one place.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button as={Link} to={bookingPath} className="h-12 rounded-xl bg-[var(--sf-accent)] px-6 text-white hover:brightness-95">
          Book a Service
        </Button>
        <Button as={Link} to={ROUTES.services} variant="outline" className="h-12 rounded-xl px-6">
          View All Services
        </Button>
      </div>
    </section>
  );
}

export default CategoryCTA;
