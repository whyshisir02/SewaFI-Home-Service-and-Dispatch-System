import { Link } from 'react-router-dom';
import { Layers, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { ROUTES } from '../../constants/routes.constant';

const getCategoryName = (category) => category?.name || 'Service';

export function CategoryHero({ category, serviceCount, bookingPath }) {
  const categoryName = getCategoryName(category);
  const description =
    category?.longDescription
    || category?.description
    || 'Find trusted home services under this category and book through SewaFi dispatch workflow.';

  return (
    <section className="overflow-hidden rounded-[28px] border border-[var(--sf-border)] bg-[linear-gradient(135deg,var(--sf-surface)_0%,var(--sf-primary-soft)_55%,var(--sf-secondary-soft)_100%)] p-6 shadow-[var(--sf-shadow)] sm:p-8 lg:p-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_300px] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 py-2 text-sm font-bold text-[var(--sf-secondary)]">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Service Category
          </div>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight text-[var(--sf-text-main)] sm:text-5xl">
            {categoryName} Services
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--sf-text-muted)]">{description}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button as={Link} to={bookingPath} className="h-12 rounded-xl bg-[var(--sf-accent)] px-6 text-white hover:brightness-95">
              Book a Service
            </Button>
            <Button as={Link} to={ROUTES.services} variant="outline" className="h-12 rounded-xl px-6">
              Browse All Services
            </Button>
          </div>
        </div>

        <aside className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]">
            <Layers className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.15em] text-[var(--sf-text-muted)]">Available Services</p>
          <p className="mt-2 text-3xl font-extrabold text-[var(--sf-text-main)]">
            {typeof serviceCount === 'number' ? serviceCount : '--'}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">
            {typeof serviceCount === 'number'
              ? 'Count based on currently loaded services for this category.'
              : 'Service count will appear when available from backend data.'}
          </p>
        </aside>
      </div>
    </section>
  );
}

export default CategoryHero;
