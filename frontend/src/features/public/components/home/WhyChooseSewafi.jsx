import { BarChart3, BellDot, LayoutDashboard, MapPinned, ShieldCheck, Workflow } from 'lucide-react';
import { Container } from '../../../../components/ui/Layout/Container';
import { SectionHeader } from '../../../../components/common/SectionHeader';

const features = [
  {
    title: 'Verified Providers',
    description: 'Provider onboarding and approval help maintain service quality.',
    icon: ShieldCheck,
  },
  {
    title: 'Location-Based Dispatch',
    description: 'Bookings are matched based on service type, area, and provider availability.',
    icon: MapPinned,
  },
  {
    title: 'Trackable Booking Flow',
    description: 'Track requests from provider search to completion.',
    icon: BellDot,
  },
  {
    title: 'Transparent Booking Flow',
    description: 'From estimated amount to final confirmation, key updates stay visible.',
    icon: Workflow,
  },
  {
    title: 'Separate Dashboards',
    description: 'Customers, providers, and admins each get a focused workspace.',
    icon: LayoutDashboard,
  },
  {
    title: 'Admin Monitoring',
    description: 'Admins monitor providers, bookings, payments, and support activity.',
    icon: BarChart3,
  },
];

export function WhyChooseSewafi() {
  return (
    <section className="bg-[var(--sf-bg)] py-12 sm:py-16 lg:py-20">
      <Container>
        <SectionHeader
          title="Built for Local Service Requests in Nepal"
          description="SewaFi keeps service selection, dispatch, status updates, and completion in one clear workflow."
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 transition duration-300 hover:-translate-y-1 hover:border-[var(--sf-secondary)] hover:shadow-[var(--sf-shadow)]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-extrabold text-[var(--sf-primary)]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export default WhyChooseSewafi;
