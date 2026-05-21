import { AlertTriangle, CircleCheckBig, Clock3, Inbox, MessageSquareWarning, TimerReset } from 'lucide-react';

const cards = [
  { key: 'total', label: 'Total Messages', icon: Inbox },
  { key: 'open', label: 'Open', icon: Clock3 },
  { key: 'inProgress', label: 'In Progress', icon: TimerReset },
  { key: 'resolved', label: 'Resolved', icon: CircleCheckBig },
  { key: 'urgent', label: 'Urgent / High', icon: MessageSquareWarning },
  { key: 'today', label: "Today's Messages", icon: AlertTriangle },
];

export function SupportStatsCards({ stats, derivedFromLoaded }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = stats?.[card.key];
        return (
          <article key={card.key} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
            <Icon className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sf-text-muted)]">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-[var(--sf-text-main)]">{value ?? '--'}</p>
            {derivedFromLoaded ? <p className="mt-1 text-xs text-[var(--sf-text-muted)]">From loaded messages</p> : null}
          </article>
        );
      })}
    </section>
  );
}

export default SupportStatsCards;
