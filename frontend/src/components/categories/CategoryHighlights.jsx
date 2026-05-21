import { Activity, ClipboardCheck, MapPin } from 'lucide-react';

const items = [
  {
    title: 'Easy Booking',
    description: 'Book this type of service through a simple request form.',
    icon: ClipboardCheck,
  },
  {
    title: 'Location-Based Dispatch',
    description: 'SewaFi matches requests with eligible nearby providers.',
    icon: MapPin,
  },
  {
    title: 'Status Tracking',
    description: 'Track booking progress from request to completion.',
    icon: Activity,
  },
];

export function CategoryHighlights() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article key={item.title} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-[var(--sf-text-main)]">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">{item.description}</p>
          </article>
        );
      })}
    </section>
  );
}

export default CategoryHighlights;
