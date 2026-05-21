import { Link } from 'react-router-dom';
import { ArrowRight, WalletCards } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { Skeleton } from '../ui/Feedback/Skeleton';
import { formatCurrency } from '../../utils/formatCurrency';

const rows = [
  ['today', 'Today'],
  ['last7days', 'Last 7 Days'],
  ['thisMonth', 'This Month'],
  ['total', 'Total Completed'],
];

export function ProviderEarningsSummary({ earnings, isLoading, isError, onRetry }) {
  if (isLoading) {
    return <Skeleton className="h-80 rounded-[28px]" />;
  }

  return (
    <section className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-[0_16px_40px_rgba(7,59,115,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sf-secondary)]">Earnings</p>
          <h2 className="mt-1 text-2xl font-extrabold text-[var(--sf-text-main)]">Earnings Summary</h2>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--sf-accent-soft)] text-[var(--sf-accent)]">
          <WalletCards className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      {isError ? (
        <div className="mt-5 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-5">
          <p className="font-semibold text-[var(--sf-text-main)]">Unable to load earnings summary.</p>
          <p className="mt-1 text-sm text-[var(--sf-text-muted)]">Please refresh this section and try again.</p>
          <Button type="button" variant="outline" className="mt-4 rounded-xl" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}

      {!isError && !earnings ? (
        <div className="mt-5 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-5 text-sm leading-6 text-[var(--sf-text-muted)]">
          Earnings summary will appear after completed jobs.
          {/* TODO: Connect provider earnings summary to backend earnings endpoint if dashboard stats are expanded. */}
        </div>
      ) : null}

      {!isError && earnings ? (
        <div className="mt-5 space-y-3">
          {rows.map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-4">
              <div>
                <p className="font-semibold text-[var(--sf-text-main)]">{label}</p>
                <p className="mt-1 text-xs text-[var(--sf-text-muted)]">{earnings[key]?.count ?? 0} completed jobs</p>
              </div>
              <p className="text-lg font-extrabold text-[var(--sf-text-main)]">{formatCurrency(earnings[key]?.amount ?? 0)}</p>
            </div>
          ))}
          <Button as={Link} to="/provider/earnings" variant="outline" className="w-full rounded-xl">
            View earnings
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </section>
  );
}

export default ProviderEarningsSummary;
