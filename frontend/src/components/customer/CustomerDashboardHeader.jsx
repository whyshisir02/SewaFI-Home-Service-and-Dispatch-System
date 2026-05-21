import { Link } from 'react-router-dom';
import { ArrowRight, CalendarRange, Plus } from 'lucide-react';
import { Button } from '../ui/Button/Button';

const getCustomerName = (user) => user?.fullName || user?.name || user?.firstName || 'Customer';

export function CustomerDashboardHeader({ user }) {
  return (
    <header className="overflow-hidden rounded-[28px] border border-[var(--sf-border)] bg-[linear-gradient(135deg,var(--sf-surface)_0%,var(--sf-surface-soft)_100%)] p-6 shadow-[var(--sf-shadow)] sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--sf-secondary)]">Customer dashboard</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-[var(--sf-text-main)] sm:text-4xl">
            Welcome back, {getCustomerName(user)}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--sf-text-muted)]">
            Here&apos;s what&apos;s happening with your home services today.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
          <Button
            as={Link}
            to="/customer/book"
            className="h-12 rounded-xl bg-[var(--sf-accent)] px-5 text-white hover:bg-[var(--sf-accent)]/90"
          >
            <Plus className="h-4 w-4" />
            Book a Service
          </Button>
          <Button as={Link} to="/customer/bookings" variant="outline" className="h-12 rounded-xl">
            <CalendarRange className="h-4 w-4" />
            View My Bookings
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

export default CustomerDashboardHeader;
