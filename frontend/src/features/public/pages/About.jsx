import { Link } from 'react-router-dom';
import {
  Activity,
  BellRing,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Headphones,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button';
import heroImage from '../../../assets/images/hero/hero.png';
import { ROUTES } from '../../../constants/routes.constant';
import { normalizePublicStats, useCoverageCities, usePublicStats } from '../../../hooks/useAboutPageData';

const whyProblems = [
  { title: 'Unclear service availability', icon: Search },
  { title: 'Hard to find trusted providers', icon: ShieldCheck },
  { title: 'Poor booking communication', icon: BellRing },
  { title: 'No simple status tracking', icon: ClipboardCheck },
];

const whySolutions = [
  { title: 'Simple booking flow', icon: ListChecks },
  { title: 'Location-based dispatch', icon: MapPin },
  { title: 'Provider verification workflow', icon: UserCheck },
  { title: 'Role-based dashboards', icon: LayoutDashboard },
];

const customerTrustCards = [
  { title: 'Clear service selection', icon: ListChecks },
  { title: 'Booking status visibility', icon: Activity },
  { title: 'Provider information after acceptance', icon: UserCheck },
  { title: 'Support access', icon: Headphones },
];

const providerOpportunityCards = [
  { title: 'Nearby job requests', icon: MapPin },
  { title: 'Availability control', icon: CheckCircle2 },
  { title: 'Assigned job dashboard', icon: LayoutDashboard },
  { title: 'Reputation through completed work', icon: TrendingUp },
];

const futureVisionCards = ['Better dispatch', 'Better provider tools', 'Better service tracking', 'Stronger local coverage'];

const formatValue = (value, key) => {
  if (typeof value === 'number' && key === 'averageRating') return value.toFixed(1);
  return value;
};

const getCoverageName = (item) => {
  if (typeof item === 'string') return item;
  return item?.name || item?.city || item?.label || item?.title || null;
};

function About() {
  const statsQuery = usePublicStats();
  const coverageQuery = useCoverageCities();
  const statItems = normalizePublicStats(statsQuery.data);
  const coverageCities = (coverageQuery.data || []).map(getCoverageName).filter(Boolean);

  return (
    <div className="overflow-hidden bg-[var(--sf-bg)] text-[var(--sf-text-main)]">
      <section className="py-12 sm:py-16 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="inline-flex rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sf-secondary)]">
              About SewaFi
            </p>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Making Home Services Easier, Faster, and More Reliable
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--sf-text-muted)] sm:text-lg">
              SewaFi connects customers with trusted local service providers through a simple booking and dispatch system built for Nepal.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button as={Link} to="/customer/book" className="h-12 rounded-xl bg-[var(--sf-accent)] px-6 text-white hover:brightness-95">
                Book a Service
              </Button>
              <Button as={Link} to={ROUTES.becomeProvider} variant="outline" className="h-12 rounded-xl px-6">
                Become a Provider
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-[var(--sf-secondary)]/15 via-[var(--sf-primary)]/10 to-transparent blur-2xl" aria-hidden="true" />
            <div className="relative rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[var(--sf-shadow)]">
              <img src={heroImage} alt="SewaFi home service trust and dispatch visual" className="h-auto w-full rounded-2xl object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-7 shadow-[var(--sf-shadow)] sm:p-10">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--sf-secondary)]/15 text-[var(--sf-secondary)]">
              <Target className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-display text-3xl font-extrabold sm:text-4xl">Our Mission</h2>
            <p className="mt-4 max-w-4xl text-base leading-7 text-[var(--sf-text-muted)]">
              To make reliable home services easier to access by connecting customers with skilled providers through a clear, location-aware booking and dispatch system.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Why SewaFi Exists</h2>
          <p className="mt-3 max-w-5xl text-base leading-7 text-[var(--sf-text-muted)]">
            Finding a reliable home service provider can be difficult when pricing, availability, communication, and trust are unclear. SewaFi is designed to organize this process through service booking, dispatch, provider updates, and role-based dashboards.
          </p>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
              <h3 className="text-lg font-bold">Pain Points</h3>
              <ul className="mt-4 space-y-3">
                {whyProblems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.title} className="flex items-center gap-3 text-sm text-[var(--sf-text-muted)]">
                      <Icon className="h-4 w-4 text-[var(--sf-primary)]" aria-hidden="true" />
                      {item.title}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
              <h3 className="text-lg font-bold">How SewaFi Helps</h3>
              <ul className="mt-4 space-y-3">
                {whySolutions.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.title} className="flex items-center gap-3 text-sm text-[var(--sf-text-muted)]">
                      <Icon className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
                      {item.title}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-[var(--sf-border)] bg-gradient-to-br from-[var(--sf-primary)]/10 via-[var(--sf-secondary)]/10 to-[var(--sf-surface)] p-7 sm:p-10">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--sf-primary)]/15 text-[var(--sf-primary)]">
              <Compass className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-display text-3xl font-extrabold sm:text-4xl">Built for Local Homes, Local Providers, and Local Needs</h2>
            <p className="mt-4 max-w-4xl text-base leading-7 text-[var(--sf-text-muted)]">
              SewaFi is designed with Nepal-focused address selection, local service categories, provider areas, and dispatch-ready workflows.
            </p>
            {coverageQuery.isLoading ? <div className="mt-5 h-10 w-full max-w-xl animate-pulse rounded-xl bg-[var(--sf-surface)]" /> : null}
            {!coverageQuery.isLoading && coverageCities.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {coverageCities.slice(0, 10).map((city) => (
                  <span key={city} className="rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--sf-text-muted)]">
                    {city}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Built Around Customer Trust</h2>
          <p className="mt-3 max-w-4xl text-base leading-7 text-[var(--sf-text-muted)]">
            Customers need clear service information, easy booking, visible status updates, and support when something changes.
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {customerTrustCards.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--sf-secondary)]/15 text-[var(--sf-secondary)]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-bold">{item.title}</h3>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Creating Opportunities for Service Providers</h2>
          <p className="mt-3 max-w-4xl text-base leading-7 text-[var(--sf-text-muted)]">
            SewaFi helps service providers receive organized job requests, manage availability, track assigned jobs, and build a professional service profile.
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {providerOpportunityCards.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--sf-primary)]/15 text-[var(--sf-primary)]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-bold">{item.title}</h3>
                </article>
              );
            })}
          </div>
          <Button as={Link} to={ROUTES.becomeProvider} className="mt-6 h-11 rounded-xl bg-[var(--sf-secondary)] px-5 text-white hover:bg-[var(--sf-secondary)]/90">
            Become a Provider
          </Button>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-[var(--sf-border)] bg-gradient-to-br from-[var(--sf-secondary)]/15 via-[var(--sf-primary)]/10 to-[var(--sf-surface)] p-7 sm:p-10">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Our Future Vision</h2>
            <p className="mt-4 max-w-4xl text-base leading-7 text-[var(--sf-text-muted)]">
              SewaFi aims to become a reliable digital bridge between households and skilled service providers, growing city by city with better dispatch, service tracking, provider management, and customer support.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {futureVisionCards.map((item) => (
                <div key={item} className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 py-3 text-sm font-semibold">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {statsQuery.isLoading ? (
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {!statsQuery.isLoading && !statsQuery.isError && statItems.length ? (
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {statItems.map((item) => (
                <article key={item.key} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sf-text-muted)]">{item.label}</p>
                  <p className="mt-2 text-3xl font-extrabold">{formatValue(item.value, item.key)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="pb-14 pt-12 sm:pb-16 sm:pt-14 lg:pb-24 lg:pt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-[var(--sf-border)] bg-gradient-to-br from-[var(--sf-primary)]/10 via-[var(--sf-secondary)]/10 to-[var(--sf-surface)] p-7 sm:p-10">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Let&apos;s Build a Better Home Services Experience, Together</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sf-text-muted)]">
              Whether you need a service or want to grow as a provider, SewaFi gives you a structured platform to start.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button as={Link} to="/customer/book" className="h-12 rounded-xl bg-[var(--sf-accent)] px-6 text-white hover:brightness-95">
                Book a Service
              </Button>
              <Button as={Link} to={ROUTES.becomeProvider} variant="outline" className="h-12 rounded-xl px-6">
                Become a Provider
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
