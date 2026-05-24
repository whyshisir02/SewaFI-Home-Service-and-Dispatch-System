import { CheckCircle2, ClipboardList, MapPin, UserCheck } from 'lucide-react';
import { Container } from '../ui/Layout/Container';
import { SectionHeader } from '../common/SectionHeader';

const steps = [
  {
    title: 'You Book',
    description: 'Choose a service, add your location, and confirm your preferred time.',
    icon: ClipboardList,
  },
  {
    title: 'We Find Nearby Providers',
    description: 'SewaFi checks available providers based on service area and availability.',
    icon: MapPin,
  },
  {
    title: 'Provider Accepts',
    description: 'The nearest eligible provider accepts the job and receives booking details.',
    icon: UserCheck,
  },
  {
    title: 'Track Until Completion',
    description: 'Follow booking status updates from request to service completion.',
    icon: CheckCircle2,
  },
];

export function DispatchSteps() {
  return (
    <section id="how-it-works" className="bg-[var(--sf-surface)] py-12 sm:py-16 lg:py-20">
      <Container>
        <SectionHeader title="How SewaFi Dispatch Works" description="From booking request to service completion, each step is visible and trackable." />

        <div className="relative mt-12">
          <div className="absolute left-6 top-0 hidden h-0.5 w-[calc(100%-3rem)] border-t border-dashed border-[var(--sf-secondary)] opacity-40 lg:block" />
          <div className="absolute bottom-0 left-6 top-0 w-0.5 border-l border-dashed border-[var(--sf-secondary)] opacity-40 lg:hidden" />

          <div className="grid gap-6 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <article key={step.title} className="relative pl-16 lg:pl-0 lg:pt-12">
                  <div className="absolute left-0 top-0 z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--sf-secondary)] bg-[var(--sf-secondary)] text-white shadow-[0_14px_32px_rgba(0,150,136,0.22)] lg:left-6">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] p-5">
                    <span className="inline-flex rounded-full bg-[var(--sf-primary-soft)] px-3 py-1 text-xs font-extrabold text-[var(--sf-primary)]">
                      Step {index + 1}
                    </span>
                    <h3 className="mt-4 text-lg font-extrabold text-[var(--sf-text-main)]">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">{step.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}

export default DispatchSteps;
