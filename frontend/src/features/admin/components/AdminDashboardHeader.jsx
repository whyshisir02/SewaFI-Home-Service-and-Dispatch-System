import { RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button';
import { getUserName } from './adminDashboardUtils';

export function AdminDashboardHeader({ user, onRefresh }) {
  return (
    <header className="overflow-hidden rounded-3xl border border-[var(--sf-border)] bg-[radial-gradient(circle_at_top_right,var(--sf-primary-soft),transparent_34%),linear-gradient(135deg,var(--sf-surface)_0%,var(--sf-surface-soft)_100%)] p-4 shadow-[var(--sf-shadow)] sm:p-5 lg:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sf-secondary)] sm:text-sm">Admin control center</p>
          <h1 className="mt-1.5 font-display text-2xl font-extrabold leading-tight text-[var(--sf-text-main)] sm:text-3xl lg:mt-2 lg:text-4xl">
            Admin Dashboard
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[var(--sf-text-muted)] sm:text-base">
            Monitor bookings, providers, services, and platform activity.
          </p>
          <p className="mt-1.5 text-sm font-semibold text-[var(--sf-text-soft)]">Signed in as {getUserName(user)}</p>
        </div>

        <Button type="button" variant="outline" className="h-10 w-full rounded-xl sm:h-11 sm:w-auto sm:rounded-2xl" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
    </header>
  );
}

export default AdminDashboardHeader;
