import { AlertTriangle, CalendarClock, ShieldCheck, UserCog, Users2 } from 'lucide-react';

export function AuditStatsCards({ stats, derivedFromLoaded }) {
  const cards = [
    { key: 'totalLogs', label: 'Total Logs', value: stats.totalLogs, icon: CalendarClock },
    { key: 'adminActions', label: 'Admin Actions', value: stats.adminActions, icon: UserCog },
    { key: 'bookingEvents', label: 'Booking Events', value: stats.bookingEvents, icon: CalendarClock },
    { key: 'providerEvents', label: 'Provider Events', value: stats.providerEvents, icon: Users2 },
    { key: 'securityEvents', label: 'Security Events', value: stats.securityEvents, icon: ShieldCheck },
    { key: 'failedWarning', label: 'Failed / Warning', value: stats.failedWarning, icon: AlertTriangle },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => (
        <article key={card.key} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
          <div className="flex items-center gap-2 text-[var(--sf-text-muted)]">
            <card.icon className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.12em]">{card.label}</p>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[var(--sf-text-main)]">{card.value ?? 'N/A'}</p>
          {derivedFromLoaded ? <p className="mt-1 text-xs text-[var(--sf-text-muted)]">From loaded logs</p> : null}
        </article>
      ))}
    </section>
  );
}

export default AuditStatsCards;
