import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import { Skeleton } from '../ui/Feedback/Skeleton';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate } from '../../utils/formatDate';
import { getAvatar, getInitials, getPersonName, getProviderCategory, getProviderStatus } from './adminDashboardUtils';

export function ProviderApprovalQueue({ providers = [], isLoading, isError, approvingId, onApprove, onRetry }) {
  const pendingProviders = providers.slice(0, 6);

  return (
    <section className="rounded-3xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[0_12px_30px_rgba(7,59,115,0.08)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sf-accent)]">Attention</p>
          <h2 className="mt-1 text-xl font-extrabold text-[var(--sf-text-main)] sm:text-2xl">Provider Approval Queue</h2>
        </div>
        <Button as={Link} to="/admin/providers" variant="outline" className="rounded-xl">
          View all providers
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="mt-5 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-5">
          <p className="font-semibold text-[var(--sf-text-main)]">Unable to load provider approvals.</p>
          <button type="button" className="mt-3 text-sm font-semibold text-[var(--sf-secondary)]" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : null}

      {!isLoading && !isError && !pendingProviders.length ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-6 text-center">
          <ShieldCheck className="h-8 w-8 text-[var(--sf-secondary)]" aria-hidden="true" />
          <h3 className="mt-3 text-xl font-extrabold text-[var(--sf-text-main)]">No pending provider approvals.</h3>
        </div>
      ) : null}

      {!isLoading && !isError && pendingProviders.length ? (
        <div className="mt-4 space-y-2.5 md:max-h-[420px] md:overflow-y-auto md:pr-1">
          {pendingProviders.map((provider) => {
            const name = getPersonName(provider);
            const avatar = getAvatar(provider);
            const providerId = provider.id || provider.userId;
            return (
              <article key={providerId} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3.5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    {avatar ? (
                      <img src={avatar} alt={name} className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--sf-secondary-soft)] font-bold text-[var(--sf-secondary)]">
                        {getInitials(name)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-bold text-[var(--sf-text-main)]">{name}</h3>
                        <StatusBadge status={getProviderStatus(provider)} />
                      </div>
                      <p className="mt-1 text-sm text-[var(--sf-text-muted)]">{getProviderCategory(provider) || 'Category not set'}</p>
                      <p className="mt-1 text-xs text-[var(--sf-text-soft)]">
                        {provider.createdAt ? `Submitted ${formatDate(provider.createdAt)}` : 'Submission date unavailable'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button as={Link} to="/admin/providers" variant="outline" className="rounded-xl">
                      View
                    </Button>
                    <Button
                      type="button"
                      className="rounded-xl bg-[var(--sf-accent)] text-white hover:bg-[var(--sf-accent)]/90"
                      loading={approvingId === providerId}
                      onClick={() => onApprove(providerId)}
                    >
                      Approve
                    </Button>
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

export default ProviderApprovalQueue;
