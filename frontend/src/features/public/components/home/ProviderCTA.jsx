import { ArrowRight, BadgeCheck, BriefcaseBusiness, CalendarCheck, MapPinned } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Container } from '../../../../components/ui/Layout/Container';
import { Button } from '../../../../components/ui/Button/Button';
import { ROUTES } from '../../../../constants/routes.constant';

const benefits = [
  { label: 'Nearby job requests', icon: MapPinned },
  { label: 'Flexible availability', icon: CalendarCheck },
  { label: 'Provider dashboard', icon: BriefcaseBusiness },
  { label: 'Verification-based trust', icon: BadgeCheck },
];

export function ProviderCTA() {
  return (
    <section className="bg-[var(--sf-surface)] py-12 sm:py-16 lg:py-20">
      <Container>
        <div className="grid items-center gap-10 overflow-hidden rounded-[28px] border border-[var(--sf-border)] bg-[linear-gradient(135deg,var(--sf-primary-soft),var(--sf-secondary-soft))] p-6 shadow-[var(--sf-shadow)] sm:p-8 lg:grid-cols-[1fr_0.85fr] lg:p-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--sf-secondary)]">Provider network</p>
            <h2 className="mt-3 font-display text-[28px] font-extrabold leading-[36px] text-[var(--sf-text-main)] sm:text-[40px] sm:leading-[48px]">
              Become a SewaFi Provider
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[var(--sf-text-muted)] sm:text-lg sm:leading-8">
              Serve customers in your selected areas, manage your schedule, and track assigned jobs from one provider workspace.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <span key={benefit.label} className="inline-flex items-center gap-3 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 py-3 text-sm font-bold text-[var(--sf-text-main)]">
                    <Icon className="h-5 w-5 text-[var(--sf-secondary)]" />
                    {benefit.label}
                  </span>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button as={Link} to={`${ROUTES.register}?role=provider`} className="h-12 rounded-xl bg-[var(--sf-accent)] text-white hover:brightness-95">
                Join as Provider
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button as={Link} to="/#how-it-works" variant="outline" className="h-12 rounded-xl bg-[var(--sf-surface)]">
                Learn More
              </Button>
            </div>
          </div>

          <div className="relative min-h-[300px] rounded-[24px] border border-white/50 bg-[var(--sf-surface)] p-5 backdrop-blur">
            <div className="absolute left-8 top-8 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[var(--sf-shadow)]">
              <BriefcaseBusiness className="h-8 w-8 text-[var(--sf-secondary)]" />
              <p className="mt-3 font-bold text-[var(--sf-text-main)]">Provider workspace</p>
              <p className="mt-1 text-sm text-[var(--sf-text-muted)]">Jobs, schedule, profile</p>
            </div>
            <div className="absolute bottom-8 right-8 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[var(--sf-shadow)]">
              <MapPinned className="h-8 w-8 text-[var(--sf-primary)]" />
              <p className="mt-3 font-bold text-[var(--sf-text-main)]">Area-based matching</p>
              <p className="mt-1 text-sm text-[var(--sf-text-muted)]">Accept eligible requests</p>
            </div>
            <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[24px] bg-[var(--sf-secondary)] text-white shadow-[var(--sf-shadow)]">
              <BadgeCheck className="h-9 w-9" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default ProviderCTA;
