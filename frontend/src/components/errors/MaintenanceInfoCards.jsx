import { CalendarClock, Radar, ShieldCheck } from 'lucide-react';

const cards = [
  {
    title: 'Bookings may be unavailable',
    description: 'Live booking and tracking may not work during maintenance.',
    icon: CalendarClock,
  },
  {
    title: 'Provider dispatch may pause',
    description: 'Nearby job matching and real-time updates may be delayed.',
    icon: Radar,
  },
  {
    title: 'Your account remains safe',
    description: 'Maintenance does not mean your account data is lost.',
    icon: ShieldCheck,
  },
];

export function MaintenanceInfoCards() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article key={card.title} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--sf-surface-soft)] text-[var(--sf-secondary)]">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-[var(--sf-text-main)]">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">{card.description}</p>
          </article>
        );
      })}
    </section>
  );
}

export default MaintenanceInfoCards;
