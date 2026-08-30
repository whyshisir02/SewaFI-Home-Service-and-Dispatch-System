import { CheckCircle2 } from 'lucide-react';
import { EmptyState } from '../../../components/ui/Feedback/EmptyState';

const normalizeItems = (items) =>
  Array.isArray(items)
    ? items.map((item, index) => (typeof item === 'string' ? { id: item, title: item } : { id: item.id || item.title || index, ...item }))
    : [];

export function ServiceIncludedSection({ includedItems }) {
  const items = normalizeItems(includedItems);

  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-2xl font-extrabold text-[var(--sf-text-main)] sm:text-3xl">What&apos;s Included</h2>
      {items.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-bold text-[var(--sf-text-main)]">{item.title || item.name}</h3>
              {item.description ? <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">{item.description}</p> : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState title="No included details listed." description="Included service details are not available for this service yet." />
        </div>
      )}
    </section>
  );
}

export default ServiceIncludedSection;
