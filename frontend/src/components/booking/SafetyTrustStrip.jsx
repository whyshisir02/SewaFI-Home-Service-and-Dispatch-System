import { Headphones, ListChecks, ShieldCheck } from 'lucide-react';

const chips = [
  { label: 'Verified provider workflow', icon: ShieldCheck },
  { label: 'Booking status updates', icon: ListChecks },
  { label: 'Support access', icon: Headphones },
];

export function SafetyTrustStrip() {
  return (
    <section className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-secondary-soft)] p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-2xl font-extrabold text-[var(--sf-text-main)]">Your safety is our priority.</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--sf-text-muted)]">
        SewaFi keeps booking details and status updates visible so customers and providers can follow the service process clearly.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        {chips.map((chip) => {
          const IconComponent = chip.icon;

          return (
            <span key={chip.label} className="inline-flex items-center gap-2 rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 py-2 text-sm font-bold text-[var(--sf-text-main)]">
              <IconComponent className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
              {chip.label}
            </span>
          );
        })}
      </div>
    </section>
  );
}

export default SafetyTrustStrip;
