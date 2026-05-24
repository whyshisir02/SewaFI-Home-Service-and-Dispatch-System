import { BadgeCheck, Clock, ReceiptText, ShieldCheck } from 'lucide-react';
import { Container } from '../ui/Layout/Container';

const benefits = [
  {
    title: 'Verified Professionals',
    description: 'Background-checked and reviewed providers.',
    icon: ShieldCheck,
  },
  {
    title: 'On-Time Dispatch',
    description: 'Location-aware matching for faster response.',
    icon: Clock,
  },
  {
    title: 'Transparent Booking',
    description: 'Track requests from provider search to completion.',
    icon: ReceiptText,
  },
  {
    title: 'Satisfaction Focused',
    description: 'Final amount confirmation and support handled in one flow.',
    icon: BadgeCheck,
  },
];

export function ServicesTrustStrip() {
  return (
    <section className="bg-[var(--sf-bg)] pb-12 sm:pb-16 lg:pb-20">
      <Container>
        <div className="grid gap-4 rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-secondary-soft)] p-5 sm:grid-cols-2 lg:grid-cols-4 lg:p-6">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <article key={benefit.title} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-extrabold text-[var(--sf-text-main)]">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">{benefit.description}</p>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export default ServicesTrustStrip;
