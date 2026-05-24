import { RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { getUserName } from './adminDashboardUtils';

export function AdminDashboardHeader({ user, onRefresh }) {
  return (
    <header className="overflow-hidden rounded-3xl border border-[var(--sf-border)] bg-[radial-gradient(circle_at_top_right,var(--sf-primary-soft),transparent_34%),linear-gradient(135deg,var(--sf-surface)_0%,var(--sf-surface-soft)_100%)] p-5 shadow-[var(--sf-shadow)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--sf-secondary)]">Admin control center</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-[var(--sf-text-main)] sm:text-4xl">
            Admin Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--sf-text-muted)] sm:text-base">
            Monitor bookings, providers, services, and platform activity.
          </p>
          <p className="mt-1.5 text-sm font-semibold text-[var(--sf-text-soft)]">Signed in as {getUserName(user)}</p>
        </div>

        <Button type="button" variant="outline" className="h-12 rounded-2xl" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
    </header>
  );
}

export default AdminDashboardHeader;
