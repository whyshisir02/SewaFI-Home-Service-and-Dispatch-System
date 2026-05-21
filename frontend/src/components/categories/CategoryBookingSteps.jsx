import { CalendarCheck, CheckCircle2, FileText, Radar, Search } from 'lucide-react';

const steps = [
  { title: 'Choose a Service', description: 'Select a service under this category.', icon: Search },
  { title: 'Add Details', description: 'Describe the issue, address, and preferred time.', icon: FileText },
  { title: 'Confirm Request', description: 'Submit your booking request.', icon: CalendarCheck },
  { title: 'SewaFi Dispatches Providers', description: 'Eligible nearby providers are notified based on service, area, and availability.', icon: Radar },
  { title: 'Track Progress', description: 'Follow booking status from request to completion.', icon: CheckCircle2 },
];

export function CategoryBookingSteps() {
  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 sm:p-6">
      <h2 className="text-2xl font-extrabold text-[var(--sf-text-main)]">How Booking Works</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <article key={step.title} className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-4">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sf-text-muted)]">
                Step {index + 1}
              </p>
              <h3 className="mt-2 text-base font-bold text-[var(--sf-text-main)]">{step.title}</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--sf-text-muted)]">{step.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default CategoryBookingSteps;
