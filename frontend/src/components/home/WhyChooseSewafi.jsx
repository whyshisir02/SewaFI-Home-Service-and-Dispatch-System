import { BarChart3, BellDot, LayoutDashboard, MapPinned, ShieldCheck, Workflow } from 'lucide-react';
import { Container } from '../ui/Layout/Container';
import { SectionHeader } from '../common/SectionHeader';

const features = [
  {
    title: 'Verified Providers',
    description: 'Providers can be reviewed and verified before receiving jobs.',
    icon: ShieldCheck,
  },
  {
    title: 'Location-Based Dispatch',
    description: 'Bookings are matched based on service type, area, and provider availability.',
    icon: MapPinned,
  },
  {
    title: 'Real-Time Updates',
    description: 'Customers and providers can follow booking status changes.',
    icon: BellDot,
  },
  {
    title: 'Transparent Booking Flow',
    description: 'Clear steps from service selection to completion.',
    icon: Workflow,
  },
  {
    title: 'Separate Dashboards',
    description: 'Customers, providers, and admins get role-based dashboards.',
    icon: LayoutDashboard,
  },
  {
    title: 'Admin Monitoring',
    description: 'Admins can manage services, providers, bookings, and platform activity.',
    icon: BarChart3,
  },
];

export function WhyChooseSewafi() {
  return (
    <section className="bg-[var(--sf-bg)] py-12 sm:py-16 lg:py-24">
      <Container>
        <SectionHeader
          title="Built for Reliable Home Services"
          description="SewaFi keeps the operational pieces visible: service selection, dispatch, acceptance, tracking, and completion."
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
