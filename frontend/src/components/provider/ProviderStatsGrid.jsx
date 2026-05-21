import { BriefcaseBusiness, CheckCircle2, MapPinned, Star, WalletCards } from 'lucide-react';
import { Skeleton } from '../ui/Feedback/Skeleton';
import { formatCurrency } from '../../utils/formatCurrency';
import { deriveProviderStats } from './providerDashboardUtils';

const statConfig = [
  {
    key: 'nearbyJobs',
    label: 'Nearby Jobs',
    description: 'Available dispatch requests',
    icon: MapPinned,
    tone: 'bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]',
  },
  {
    key: 'assignedJobs',
    label: 'Assigned Jobs',
    description: 'Accepted or in progress',
    icon: BriefcaseBusiness,
    tone: 'bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]',
  },
  {
    key: 'completedJobs',
    label: 'Completed Jobs',
    description: 'From backend provider stats',
    icon: CheckCircle2,
    tone: 'bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]',
  },
  {
    key: 'todayEarnings',
    label: 'Today Earnings',
    description: 'Completed jobs today',
    icon: WalletCards,
    tone: 'bg-[var(--sf-accent-soft)] text-[var(--sf-accent)]',
  },
  {
    key: 'rating',
    label: 'Rating',
    description: 'Backend provider rating',
    icon: Star,
    tone: 'bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]',
  },
];

const formatValue = (key, value) => {
  if (value == null) return '—';
  if (key === 'todayEarnings') return formatCurrency(value);
  if (key === 'rating') return Number(value).toFixed(1);
  return value;
};

export function ProviderStatsGrid({ nearbyJobs = [], assignedJobs = [], summary, isLoading }) {
  if (isLoading) {
    return (
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Loading provider stats">
        {statConfig.map((item) => (
          <Skeleton key={item.key} className="h-36 rounded-2xl" />
        ))}
      </section>
    );
  }

  const stats = deriveProviderStats({ nearbyJobs, assignedJobs, summary });

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Provider stats">
      {statConfig.map((item) => {
        const IconComponent = item.icon;
        return (
          <article key={item.key} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-[0_16px_40px_rgba(7,59,115,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--sf-text-muted)]">{item.label}</p>
                <p className="mt-3 text-3xl font-extrabold text-[var(--sf-text-main)]">{formatValue(item.key, stats[item.key])}</p>
              </div>
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}>
                <IconComponent className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--sf-text-muted)]">{item.description}</p>
          </article>
        );
      })}
    </section>
  );
}

export default ProviderStatsGrid;
