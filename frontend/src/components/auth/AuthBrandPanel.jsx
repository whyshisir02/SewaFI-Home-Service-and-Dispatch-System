import { Clock, Home, LockKeyhole, MapPin, Route, ShieldCheck } from 'lucide-react';

const defaultTrustItems = [
  { label: 'Trusted service workflow', icon: ShieldCheck },
  { label: 'Location-based dispatch', icon: MapPin },
  { label: 'Secure account access', icon: LockKeyhole },
];

export function AuthBrandPanel({
  eyebrow = 'SewaFi Access',
  title = 'Welcome back to SewaFi',
  description = 'Sign in to book trusted home services, track bookings, or manage your provider/admin dashboard.',
  trustItems = defaultTrustItems,
  notice,
  visualBadge = 'Dispatch ready',
  visualNote = 'Live updates',
}) {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-[var(--sf-border)] bg-[radial-gradient(circle_at_top_left,var(--sf-secondary-soft),transparent_32%),linear-gradient(135deg,var(--sf-surface)_0%,var(--sf-surface-soft)_100%)] p-6 shadow-[var(--sf-shadow)] lg:p-10">
      <div className="relative z-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--sf-secondary)]">{eyebrow}</p>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-[var(--sf-text-main)] lg:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[var(--sf-text-muted)]">
          {description}
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {trustItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]/80 p-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]">
                  <IconComponent className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-[var(--sf-text-main)]">{item.label}</span>
              </div>
            );
          })}
        </div>

        {notice ? (
          <div className="mt-6 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]/80 p-4 text-sm leading-6 text-[var(--sf-text-muted)]">
            {notice}
          </div>
        ) : null}

        <div className="mt-8 hidden rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)]/85 p-5 lg:block">
          <div className="relative h-56 overflow-hidden rounded-3xl bg-[linear-gradient(135deg,var(--sf-primary-soft),var(--sf-secondary-soft))]">
            <div className="absolute left-8 top-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--sf-surface)] text-[var(--sf-primary)] shadow-sm">
              <Home className="h-7 w-7" aria-hidden="true" />
            </div>
            <div className="absolute right-8 top-12 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--sf-secondary)] text-white shadow-sm">
              <MapPin className="h-7 w-7" aria-hidden="true" />
            </div>
            <div className="absolute bottom-8 left-10 right-10 h-px border-t-2 border-dashed border-[var(--sf-secondary)]/55" />
            <div className="absolute bottom-14 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-[var(--sf-surface)] px-4 py-3 text-sm font-bold text-[var(--sf-text-main)] shadow-sm">
              <Route className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
              {visualBadge}
            </div>
            <div className="absolute bottom-8 right-8 inline-flex items-center gap-2 rounded-2xl bg-[var(--sf-surface)] px-4 py-3 text-sm font-bold text-[var(--sf-text-main)] shadow-sm">
              <Clock className="h-4 w-4 text-[var(--sf-accent)]" aria-hidden="true" />
              {visualNote}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AuthBrandPanel;
