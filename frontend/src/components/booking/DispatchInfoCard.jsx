import { Bell, MapPin, Radar, UserCheck } from 'lucide-react';

const items = [
  { label: 'Request confirmed', icon: Radar },
  { label: 'Area checked', icon: MapPin },
  { label: 'Providers notified', icon: Bell },
  { label: 'Provider accepts', icon: UserCheck },
];

export function DispatchInfoCard() {
  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-secondary-soft)] p-5">
      <h2 className="font-display text-xl font-extrabold text-[var(--sf-text-main)]">How dispatch works</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">
        After you confirm the booking, SewaFi checks eligible providers based on service type, area, and availability. Providers are notified and your booking status updates when one accepts.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-3 text-sm font-bold text-[var(--sf-text-main)]">
              <Icon className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
              {item.label}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default DispatchInfoCard;
