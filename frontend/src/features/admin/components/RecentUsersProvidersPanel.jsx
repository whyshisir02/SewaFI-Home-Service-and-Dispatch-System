import { useState } from 'react';
import { UsersRound } from 'lucide-react';
import { Skeleton } from '../../../components/ui/Feedback/Skeleton';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { formatDate } from '../../../utils/formatDate';
import { getAvatar, getInitials, getPersonName, getProviderStatus, sortByRecent } from './adminDashboardUtils';

export function RecentUsersProvidersPanel({ users = [], isLoading, isError }) {
  const [tab, setTab] = useState('users');
  const recentUsers = sortByRecent(users)
    .filter((user) => (tab === 'providers' ? user.role === 'PROVIDER' : user.role !== 'PROVIDER'))
    .slice(0, 5);

  if (isLoading) {
    return <Skeleton className="h-[340px] rounded-3xl" />;
  }

  return (
    <section className="rounded-3xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[0_12px_30px_rgba(7,59,115,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sf-secondary)]">People</p>
          <h2 className="mt-1 text-xl font-extrabold text-[var(--sf-text-main)] sm:text-2xl">Recent Users / Providers</h2>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]">
          <UsersRound className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-1">
        {['users', 'providers'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`min-h-11 rounded-xl px-3 text-sm font-bold capitalize transition ${
              tab === item ? 'bg-[var(--sf-secondary)] text-white' : 'text-[var(--sf-text-muted)] hover:text-[var(--sf-secondary)]'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {isError ? (
        <div className="mt-5 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-5 text-sm text-[var(--sf-text-muted)]">
          Unable to load recent users.
        </div>
      ) : null}

      {!isError && !recentUsers.length ? (
        <div className="mt-5 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-5 text-sm text-[var(--sf-text-muted)]">
          No recent {tab} found.
        </div>
      ) : null}

      {!isError && recentUsers.length ? (
        <div className="mt-4 space-y-2.5">
          {recentUsers.map((user) => {
            const name = getPersonName(user);
            const avatar = getAvatar(user);
            return (
              <article key={user.id} className="flex gap-3 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-3">
                {avatar ? (
                  <img src={avatar} alt={name} loading="lazy" decoding="async" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                ) : (
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--sf-secondary-soft)] font-bold text-[var(--sf-secondary)]">
                    {getInitials(name)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-bold text-[var(--sf-text-main)]">{name}</h3>
                    <StatusBadge status={tab === 'providers' ? getProviderStatus(user) : user.role} />
                  </div>
                  <p className="mt-1 truncate text-sm text-[var(--sf-text-muted)]">{user.email || user.phone || 'Contact not available'}</p>
                  {user.createdAt ? <p className="mt-1 text-xs text-[var(--sf-text-soft)]">Joined {formatDate(user.createdAt)}</p> : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export default RecentUsersProvidersPanel;
