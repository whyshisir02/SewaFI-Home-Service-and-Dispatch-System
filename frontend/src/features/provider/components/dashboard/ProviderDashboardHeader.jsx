import { RefreshCw } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button';
import { getProviderName } from './providerDashboardUtils';
import { AvailabilityToggle } from './AvailabilityToggle';

export function ProviderDashboardHeader({ user, profile, available, availabilityLoading, onToggleAvailability, onRefresh }) {
  return (
    <header className="overflow-hidden rounded-[28px] border border-[var(--sf-border)] bg-[linear-gradient(135deg,var(--sf-surface)_0%,var(--sf-surface-soft)_100%)] p-6 shadow-[var(--sf-shadow)] sm:p-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--sf-secondary)]">Provider work portal</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-[var(--sf-text-main)] sm:text-4xl">
            Welcome back, {getProviderName(user, profile)}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--sf-text-muted)]">
            Manage nearby jobs, assigned work, availability, and earnings.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row xl:justify-end">
          <AvailabilityToggle
            available={available}
            loading={availabilityLoading}
            onToggle={onToggleAvailability}
            disabled={!profile}
          />
          <Button type="button" variant="outline" className="h-12 rounded-2xl" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
    </header>
  );
}

export default ProviderDashboardHeader;
