import { CalendarCheck, Star, UserCheck, UserPlus, Users, WalletCards } from 'lucide-react';
import { Skeleton } from '../ui/Feedback/Skeleton';
import { formatCurrency } from '../../utils/formatCurrency';

const kpiConfig = [
  {
    key: 'totalUsers',
    label: 'Total Users',
    helper: 'Registered platform users',
    icon: Users,
    tone: 'bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]',
  },
  {
    key: 'activeProviders',
    label: 'Active Providers',
    helper: 'Approved provider accounts',
    icon: UserCheck,
    tone: 'bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]',
  },
  {
    key: 'bookingsToday',
    label: 'Bookings Today',
    helper: 'Created today',
    icon: CalendarCheck,
    tone: 'bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]',
  },
  {
    key: 'pendingApprovals',
    label: 'Pending Approvals',
    helper: 'Providers awaiting review',
    icon: UserPlus,
    tone: 'bg-[var(--sf-accent-soft)] text-[var(--sf-accent)]',
  },
  {
    key: 'revenue',
    label: 'Revenue',
    helper: 'Paid completed bookings',
    icon: WalletCards,
    tone: 'bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]',
  },
  {
    key: 'rating',
    label: 'Average Rating',
    helper: 'Based on customer reviews',
    icon: Star,
    tone: 'bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]',
  },
];

const resolveKpis = (stats) => {
  const reviewsTotal = Number(stats?.reviews?.total || 0);
  const bookingsTodayRaw = stats?.bookings?.today ?? stats?.bookingsToday ?? stats?.todayBookings;

  return {
    totalUsers: stats?.users?.total,
    activeProviders: stats?.users?.providers,
    bookingsToday: Number.isFinite(Number(bookingsTodayRaw)) ? Number(bookingsTodayRaw) : 0,
    pendingApprovals: stats?.users?.pendingProviders,
    revenue: stats?.revenue?.total,
    rating: reviewsTotal > 0 ? stats?.reviews?.averageRating : null,
    reviewsTotal,
  };
};

const formatValue = (key, value) => {
  if (value == null) return '—';
  if (key === 'revenue') return formatCurrency(value);
  if (key === 'rating') return Number(value).toFixed(2);
  return value;
};

const resolveHelperText = (itemKey, values, defaultHelper) => {
  if (itemKey === 'rating') {
    return values.reviewsTotal > 0 ? 'Based on customer reviews' : 'No reviews yet';
  }
  return defaultHelper;
};

export function AdminKpiGrid({ stats, isLoading }) {
  if (isLoading) {
    return (
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6" aria-label="Loading admin metrics">
        {kpiConfig.map((item) => (
          <Skeleton key={item.key} className="h-36 rounded-2xl" />
        ))}
      </section>
    );
  }

  const values = resolveKpis(stats);

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6" aria-label="Admin KPI metrics">
      {kpiConfig.map((item) => {
        const IconComponent = item.icon;
        return (
          <article key={item.key} className="h-full min-w-0 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-[0_16px_40px_rgba(7,59,115,0.08)] transition hover:-translate-y-1 hover:border-[var(--sf-secondary)]">
            <div className="flex min-w-0 items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--sf-text-muted)]">{item.label}</p>
                <p className="mt-3 whitespace-nowrap font-display text-3xl font-extrabold leading-tight tracking-tight text-[var(--sf-text-main)]">
                  {formatValue(item.key, values[item.key])}
                </p>
              </div>
              <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.tone}`}>
                <IconComponent className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--sf-text-muted)]">
              {resolveHelperText(item.key, values, item.helper)}
            </p>
            {item.key === 'revenue' && stats?.revenue?.growth != null ? (
              <p className="mt-1 text-xs font-semibold text-[var(--sf-secondary)]">Growth {stats.revenue.growth}%</p>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

export default AdminKpiGrid;
