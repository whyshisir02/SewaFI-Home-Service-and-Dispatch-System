import { CalendarCheck2, CircleDashed, Clock3, XCircle } from 'lucide-react';
import { Skeleton } from '../ui/Feedback/Skeleton';
import { deriveStats } from './dashboardUtils';

const statConfig = [
  {
    key: 'active',
    label: 'Active Bookings',
    description: 'Pending, accepted, or in progress',
    icon: Clock3,
    className: 'bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]',
  },
  {
    key: 'completed',
    label: 'Completed',
    description: 'Services finished successfully',
    icon: CalendarCheck2,
    className: 'bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]',
  },
  {
    key: 'pending',
    label: 'Pending',
    description: 'Waiting for provider matching',
    icon: CircleDashed,
    className: 'bg-[var(--sf-accent-soft)] text-[var(--sf-accent)]',
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    description: 'Bookings marked cancelled',
    icon: XCircle,
    className: 'bg-[var(--sf-danger)]/10 text-[var(--sf-danger)]',
  },
];

export function CustomerStatsGrid({ bookings = [], isLoading }) {
  if (isLoading) {
    return (
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading dashboard stats">
        {statConfig.map((item) => (
          <Skeleton key={item.key} className="h-36 rounded-2xl" />
        ))}
      </section>
    );
  }

  const stats = deriveStats(bookings);

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Customer booking stats">
      {statConfig.map((item) => {
        const IconComponent = item.icon;
        return (
          <article
            key={item.key}
            className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-[0_16px_40px_rgba(7,59,115,0.08)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--sf-text-muted)]">{item.label}</p>
                <p className="mt-3 text-4xl font-extrabold text-[var(--sf-text-main)]">{stats[item.key]}</p>
              </div>
              <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${item.className}`}>
                <IconComponent className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--sf-text-muted)]">{item.description}</p>
            <p className="mt-1 text-xs font-medium text-[var(--sf-text-soft)]">From current bookings</p>
          </article>
        );
      })}
    </section>
  );
}

export default CustomerStatsGrid;
