import { BellRing } from 'lucide-react';
import { Skeleton } from '../ui/Feedback/Skeleton';
import { formatDate } from '../../utils/formatDate';
import { sortByRecent } from './adminDashboardUtils';

const severityClass = {
  INFO: 'bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]',
  SUCCESS: 'bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]',
  WARNING: 'bg-[var(--sf-accent-soft)] text-[var(--sf-accent)]',
  ERROR: 'bg-[var(--sf-danger)]/10 text-[var(--sf-danger)]',
};

export function SystemAlertsPanel({ alerts = [], isLoading, isError }) {
  if (isLoading) return <Skeleton className="h-[430px] rounded-[28px]" />;

  const sortedAlerts = sortByRecent(alerts).slice(0, 5);

  return (
    <section className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-[0_16px_40px_rgba(7,59,115,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sf-secondary)]">Alerts</p>
          <h2 className="mt-1 text-2xl font-extrabold text-[var(--sf-text-main)]">System Alerts</h2>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--sf-accent-soft)] text-[var(--sf-accent)]">
          <BellRing className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      {isError ? (
        <div className="mt-5 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-5 text-sm text-[var(--sf-text-muted)]">
          Unable to load system alerts.
        </div>
      ) : null}

      {!isError && !sortedAlerts.length ? (
        <div className="mt-5 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-5 text-sm text-[var(--sf-text-muted)]">
          No system alerts right now.
        </div>
      ) : null}

      {!isError && sortedAlerts.length ? (
        <div className="mt-5 space-y-3">
          {sortedAlerts.map((alert) => {
            const severity = alert.severity || alert.type || 'INFO';
            return (
              <article key={alert.id || `${alert.title}-${alert.createdAt}`} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-4">
                <div className="flex items-start gap-3">
                  <span className={`mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${severityClass[severity] || severityClass.INFO}`}>
                    <BellRing className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[var(--sf-text-main)]">{alert.title || severity}</h3>
                    {alert.message || alert.body ? <p className="mt-1 text-sm leading-6 text-[var(--sf-text-muted)]">{alert.message || alert.body}</p> : null}
                    {alert.createdAt ? <p className="mt-2 text-xs text-[var(--sf-text-soft)]">{formatDate(alert.createdAt, { includeTime: true })}</p> : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export default SystemAlertsPanel;
