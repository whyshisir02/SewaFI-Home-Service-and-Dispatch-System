import { ArrowRight, BriefcaseBusiness, Clock, MapPin, Radar, ShieldCheck, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../../components/ui/Button/Button';
import { Container } from '../../../../components/ui/Layout/Container';
import { ROUTES } from '../../../../constants/routes.constant';

const trustChips = ['Verified providers', 'Location-based dispatch', 'Booking tracking'];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[var(--sf-bg)] pb-16 pt-12 sm:pb-20 lg:pb-28 lg:pt-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,var(--sf-primary-soft),transparent_34%),radial-gradient(circle_at_82%_22%,var(--sf-secondary-soft),transparent_28%)]" />
      <Container className="relative grid items-center gap-12 lg:grid-cols-[1.03fr_0.97fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 py-2 text-sm font-bold text-[var(--sf-secondary)] shadow-sm">
            <Radar className="h-4 w-4" />
            Automatic dispatch for Nepal homes
          </div>

          <div className="mt-7 max-w-3xl">
            <h1 className="font-display text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[var(--sf-text-main)] sm:text-[50px] sm:leading-[1.05] lg:text-[56px]">
              Reliable Home Services,
              <span className="block text-[var(--sf-secondary)]">Dispatched Near You</span>
            </h1>
            <p className="mt-6 max-w-2xl text-[15px] leading-[26px] text-[var(--sf-text-muted)] sm:text-lg sm:leading-[30px]">
              Book local home services in Nepal with a structured flow: request, provider acceptance, work updates, final amount confirmation, and review.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              as={Link}
              to={`${ROUTES.customer.book.replace(':serviceId', 'new')}`}
              className="h-12 rounded-2xl bg-[var(--sf-accent)] px-6 text-white hover:brightness-95"
            >
              Book a Service
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              as={Link}
              to={`${ROUTES.register}?role=provider`}
              variant="outline"
              className="h-12 rounded-2xl border-[var(--sf-secondary)] bg-[var(--sf-surface)] text-[var(--sf-secondary)] hover:border-[var(--sf-secondary)] hover:text-[var(--sf-secondary)]"
            >
              <BriefcaseBusiness className="h-4 w-4" />
              Become a Provider
            </Button>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            {trustChips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 py-2 text-sm font-semibold text-[var(--sf-text-muted)]"
              >
                <ShieldCheck className="h-4 w-4 text-[var(--sf-secondary)]" />
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-[28px] border border-[var(--sf-border)] bg-[linear-gradient(145deg,var(--sf-surface)_0%,var(--sf-surface-soft)_100%)] p-5 shadow-[var(--sf-shadow)]">
            <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(var(--sf-border)_1px,transparent_1px),linear-gradient(90deg,var(--sf-border)_1px,transparent_1px)] [background-size:44px_44px]" />
            <div className="relative min-h-[460px] overflow-hidden rounded-[24px] border border-[var(--sf-border)] bg-[radial-gradient(circle_at_center,var(--sf-secondary-soft),transparent_34%),linear-gradient(145deg,var(--sf-primary-soft),var(--sf-surface))]">
              <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--sf-secondary)] opacity-25" />
              <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border border-[var(--sf-secondary)] bg-[var(--sf-secondary-soft)] opacity-80" />
              <div className="absolute left-[48%] top-[43%] flex h-16 w-16 items-center justify-center rounded-full bg-[var(--sf-secondary)] text-white shadow-[0_18px_45px_rgba(0,150,136,0.28)]">
                <MapPin className="h-7 w-7" />
              </div>

              <div className="absolute left-6 top-7 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[var(--sf-shadow)] backdrop-blur">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]">
                    <Radar className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[var(--sf-text-main)]">Dispatch mode</p>
                    <p className="text-xs text-[var(--sf-text-muted)]">Location-aware</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-6 left-4 right-4 rounded-[24px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-[var(--sf-shadow)] backdrop-blur sm:left-8 sm:right-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--sf-secondary)]">Service Request</p>
                    <h3 className="mt-2 text-xl font-extrabold text-[var(--sf-text-main)]">Finding eligible provider...</h3>
                  </div>
                  <span className="rounded-full bg-[var(--sf-accent-soft)] px-3 py-1 text-xs font-bold text-[var(--sf-accent)]">
                    Live
                  </span>
                </div>
                <div className="mt-5 grid gap-3 text-sm text-[var(--sf-text-muted)] sm:grid-cols-2">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[var(--sf-secondary)]" />
                    Based on booking area
                  </span>
                  <span className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-[var(--sf-secondary)]" />
                    Pending acceptance
                  </span>
                  <span className="flex items-center gap-2 sm:col-span-2">
                    <Clock className="h-4 w-4 text-[var(--sf-secondary)]" />
                    ETA available after provider accepts
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default HeroSection;
