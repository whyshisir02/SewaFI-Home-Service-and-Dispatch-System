import { CalendarCheck, Star, UserCheck, UserPlus, Users, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '../../../components/ui/Feedback/Skeleton';
import { formatCurrency } from '../../../utils/formatCurrency';
import { ROUTES } from '../../../constants/routes.constant';

const kpiConfig = [
  {
    key: 'totalUsers',
    label: 'Total Users',
    helper: 'Registered users',
    icon: Users,
    tone: 'bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]',
    path: ROUTES.admin.users,
  },
  {
    key: 'activeProviders',
    label: 'Active Providers',
    helper: 'Approved providers',
    icon: UserCheck,
    tone: 'bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]',
    path: ROUTES.admin.providers,
  },
  {
    key: 'bookingsToday',
    label: 'Bookings Today',
    helper: 'Created today',
    icon: CalendarCheck,
    tone: 'bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]',
    path: ROUTES.admin.bookings,
  },
  {
    key: 'pendingApprovals',
    label: 'Pending Approvals',
    helper: 'Review providers',
    icon: UserPlus,
    tone: 'bg-[var(--sf-accent-soft)] text-[var(--sf-accent)]',
    path: ROUTES.admin.providers,
  },
  {
    key: 'revenue',
    label: 'Revenue',
    helper: 'Paid bookings',
    icon: WalletCards,
    tone: 'bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]',
    path: ROUTES.admin.payments,
  },
  {
    key: 'rating',
    label: 'Avg Rating',
    helper: 'Customer reviews',
    icon: Star,
    tone: 'bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]',
    path: ROUTES.admin.reviews,
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
  if (value == null) return '-';
  if (key === 'revenue') return formatCurrency(value);
  if (key === 'rating') return Number(value).toFixed(2);
  return value;
};

const resolveHelperText = (itemKey, values, defaultHelper) => {
  if (itemKey === 'pendingApprovals' && Number(values.pendingApprovals || 0) > 0) {
    return 'Review providers';
  }
  if (itemKey === 'rating') {
    return values.reviewsTotal > 0 ? 'Based on customer reviews' : 'No reviews yet';
  }
  return defaultHelper;
};

export function AdminKpiGrid({ stats, isLoading }) {
  if (isLoading) {
    return (
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6" aria-label="Loading admin metrics">
        {kpiConfig.map((item) => (
          <Skeleton key={item.key} className="h-36 rounded-2xl" />
        ))}
      </section>
    );
  }

  const values = resolveKpis(stats);

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6" aria-label="Admin KPI metrics">
      {kpiConfig.map((item) => {
        const IconComponent = item.icon;
        const isPendingReview = item.key === 'pendingApprovals' && Number(values.pendingApprovals || 0) > 0;
        return (
          <Link
            key={item.key}
            to={item.path}
            className={`block h-full min-w-0 rounded-2xl border bg-[var(--sf-surface)] p-3.5 shadow-[0_10px_24px_rgba(7,59,115,0.07)] transition hover:-translate-y-0.5 hover:border-[var(--sf-secondary)] hover:shadow-[0_14px_30px_rgba(7,59,115,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-secondary)] sm:p-4 ${
              isPendingReview ? 'border-[var(--sf-accent)]/45' : 'border-[var(--sf-border)]'
            }`}
          >
            <div className="flex h-full min-h-[8.75rem] min-w-0 flex-col">
              <div className="flex min-w-0 items-start justify-between gap-4">
                <p className="text-sm font-semibold text-[var(--sf-text-muted)]">{item.label}</p>
                <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.tone}`}>
                  <IconComponent className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-2.5 whitespace-nowrap font-display text-2xl font-extrabold leading-tight tracking-tight text-[var(--sf-text-main)] sm:text-3xl">
                {formatValue(item.key, values[item.key])}
              </p>
              <p className="mt-2 text-xs leading-5 text-[var(--sf-text-muted)] sm:text-sm">
                {resolveHelperText(item.key, values, item.helper)}
              </p>
              {item.key === 'revenue' && stats?.revenue?.growth != null ? (
                <p className="mt-1 text-xs font-semibold text-[var(--sf-secondary)]">Growth {stats.revenue.growth}%</p>
              ) : null}
            </div>
          </Link>
        );
      })}
    </section>
  );
}

export default AdminKpiGrid;
