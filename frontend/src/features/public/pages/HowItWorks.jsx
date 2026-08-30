import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BellRing,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Hammer,
  Radar,
  Search,
  ShieldCheck,
  ToggleRight,
  UserPlus,
  UserRound,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button';
import { ROUTES } from '../../../constants/routes.constant';
import heroImage from '../../../assets/images/hero/hero-services.png';
import { usePublicFaqs } from '../hooks/usePublicFaqs';

const customerSteps = [
  { title: 'Choose a Service', text: 'Select the type of home service you need from available service categories.', icon: Search },
  { title: 'Add Service Details', text: 'Describe the problem, add your address, and choose your preferred date/time.', icon: FileText },
  { title: 'Confirm Booking', text: 'Review your details and confirm the booking request.', icon: CalendarCheck },
  { title: 'SewaFi Dispatches Providers', text: 'SewaFi checks eligible providers based on service type, location, and availability.', icon: Radar },
  { title: 'Track Your Booking', text: 'Follow status updates such as requested, accepted, in progress, and completed.', icon: Activity },
  { title: 'Complete the Service', text: 'After service completion, your booking history stays available in your dashboard.', icon: CheckCircle2 },
];

const providerSteps = [
  { title: 'Register as Provider', text: 'Create a provider account and submit required profile details.', icon: UserPlus },
  { title: 'Complete Verification', text: 'Admin reviews the provider profile before jobs can be received.', icon: ShieldCheck },
  { title: 'Set Availability', text: 'Turn availability on when ready to receive service requests.', icon: ToggleRight },
  { title: 'Receive Nearby Jobs', text: 'SewaFi notifies eligible providers when matching bookings are available.', icon: BellRing },
  { title: 'Accept Assigned Work', text: 'Accept available jobs and view booking/customer area details.', icon: ClipboardCheck },
  { title: 'Update Job Progress', text: 'Update job status as accepted, in progress, and completed.', icon: Hammer },
];

const statusLifecycle = [
  { label: 'Requested', value: 'PENDING', text: 'Booking request has been created.', tone: 'border-[var(--sf-primary)]/30 bg-[var(--sf-primary)]/10' },
  { label: 'Provider Accepted', value: 'ACCEPTED', text: 'A provider has accepted the booking.', tone: 'border-[var(--sf-secondary)]/30 bg-[var(--sf-secondary)]/10' },
  { label: 'Work In Progress', value: 'IN_PROGRESS', text: 'The provider is working on the service.', tone: 'border-[var(--sf-accent)]/30 bg-[var(--sf-accent)]/10' },
  { label: 'Completed', value: 'COMPLETED', text: 'The service has been completed.', tone: 'border-emerald-500/30 bg-emerald-500/10' },
  { label: 'Cancelled', value: 'CANCELLED', text: 'The booking has been cancelled.', tone: 'border-red-500/30 bg-red-500/10' },
];

const staticFaqs = [
  {
    id: 's1',
    question: 'How does SewaFi find a provider?',
    answer: 'SewaFi uses service type, location, provider availability, and provider eligibility to help dispatch suitable providers.',
  },
  {
    id: 's2',
    question: 'Can customers choose a provider manually?',
    answer: 'The current booking flow uses automatic dispatch, so SewaFi handles provider matching after booking confirmation.',
  },
  {
    id: 's3',
    question: 'When can I track my booking?',
    answer: 'Customers can track booking status after creating a booking from the booking tracking page.',
  },
  {
    id: 's4',
    question: 'Can providers reject or ignore jobs?',
    answer: 'Providers receive eligible nearby jobs and can choose whether to accept available requests.',
  },
  {
    id: 's5',
    question: 'What happens after a provider accepts?',
    answer: 'Booking status updates to accepted, and the assigned provider can continue service updates through completion.',
  },
  {
    id: 's6',
    question: 'Can admins monitor bookings?',
    answer: 'Admins can monitor platform users, providers, bookings, services, and system activity through the admin dashboard.',
  },
];

const faqTitle = (faq) => faq?.question || faq?.title || faq?.heading || 'Question';
const faqBody = (faq) => faq?.answer || faq?.content || faq?.description || 'No additional details available.';

function HowItWorks() {
  const [activeAudience, setActiveAudience] = useState('customer');
  const faqQuery = usePublicFaqs('how-it-works');
  const faqs = faqQuery.data?.length ? faqQuery.data : staticFaqs;

  const jumpTo = (sectionId, nextAudience) => () => {
    setActiveAudience(nextAudience);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="overflow-hidden bg-[var(--sf-bg)] text-[var(--sf-text-main)]">
      <section className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="inline-flex rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sf-secondary)]">
              How It Works
            </p>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-[54px]">Simple Steps, Reliable Service</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--sf-text-muted)] sm:text-lg">
              SewaFi organizes the full flow for Nepal home services: booking request, provider acceptance, work progress, payment confirmation, and review.
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
              <img src={heroImage} alt="SewaFi booking and provider workflow visual" loading="lazy" decoding="async" className="h-auto w-full rounded-2xl object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-3 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={jumpTo('customer-flow', 'customer')}
              aria-pressed={activeAudience === 'customer'}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition ${
                activeAudience === 'customer'
                  ? 'border-[var(--sf-secondary)] bg-[var(--sf-secondary)]/15 text-[var(--sf-secondary)]'
                  : 'border-[var(--sf-border)] bg-[var(--sf-surface)] text-[var(--sf-text-muted)]'
              }`}
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              For Customers
            </button>
            <button
              type="button"
              onClick={jumpTo('provider-flow', 'provider')}
              aria-pressed={activeAudience === 'provider'}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition ${
                activeAudience === 'provider'
                  ? 'border-[var(--sf-secondary)] bg-[var(--sf-secondary)]/15 text-[var(--sf-secondary)]'
                  : 'border-[var(--sf-border)] bg-[var(--sf-surface)] text-[var(--sf-text-muted)]'
              }`}
            >
              <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
              For Providers
            </button>
          </div>
        </div>
      </section>

      <section id="customer-flow" className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">For Customers - Booking Flow</h2>
          <p className="mt-3 max-w-4xl text-base leading-7 text-[var(--sf-text-muted)]">
            Book a service, confirm your details, and track updates from request to completion.
          </p>
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {customerSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--sf-secondary)]/15 text-[var(--sf-secondary)]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sf-text-muted)]">Step {index + 1}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">{step.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="provider-flow" className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">For Providers - Workflow</h2>
          <p className="mt-3 max-w-4xl text-base leading-7 text-[var(--sf-text-muted)]">
            Providers apply, get verified, receive eligible nearby jobs, and update assigned work from one dashboard.
          </p>
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {providerSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--sf-primary)]/15 text-[var(--sf-primary)]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sf-text-muted)]">Step {index + 1}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">{step.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-[var(--sf-border)] bg-gradient-to-br from-[var(--sf-secondary)]/15 via-[var(--sf-primary)]/10 to-[var(--sf-surface)] p-7 sm:p-10">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">How SewaFi Dispatch Works</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 text-sm font-semibold">Customer request</div>
              <div className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 text-sm font-semibold">Dispatch engine checks service, location, and availability</div>
              <div className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 text-sm font-semibold">Eligible providers are notified</div>
              <div className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 text-sm font-semibold">Provider accepts and booking updates are visible</div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--sf-text-muted)]">
              Admin dashboards monitor booking and provider activity while dispatch continues in the background.
            </p>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Booking Status Lifecycle</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {statusLifecycle.map((item) => (
              <article key={item.value} className={`rounded-2xl border p-4 ${item.tone}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sf-text-muted)]">{item.label}</p>
                <p className="mt-2 text-sm font-bold text-[var(--sf-text-main)]">{item.value}</p>
                <p className="mt-2 text-sm text-[var(--sf-text-muted)]">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Frequently Asked Questions</h2>

          {faqQuery.isLoading ? (
            <div className="mt-6 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
              ))}
            </div>
          ) : null}

          {faqQuery.isError ? (
            <div className="mt-6 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
              <p className="text-sm text-[var(--sf-text-muted)]">Unable to load this section right now.</p>
              <Button type="button" variant="outline" className="mt-3 h-10 rounded-xl" onClick={() => faqQuery.refetch()}>
                Retry
              </Button>
            </div>
          ) : null}

          {!faqQuery.isLoading && !faqQuery.isError && !faqs.length ? (
            <div className="mt-6 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 text-sm text-[var(--sf-text-muted)]">
              No FAQs available right now.
            </div>
          ) : null}

          {!faqQuery.isLoading && !faqQuery.isError && faqs.length ? (
            <div className="mt-6 grid gap-3 lg:grid-cols-2">
              {faqs.map((faq, index) => (
                <details key={faq.id || faq._id || index} className="group rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
                  <summary className="cursor-pointer list-none font-semibold text-[var(--sf-text-main)]">{faqTitle(faq)}</summary>
                  <p className="mt-3 text-sm leading-6 text-[var(--sf-text-muted)]">{faqBody(faq)}</p>
                </details>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="pb-12 pt-10 sm:pb-14 sm:pt-12 lg:pb-16 lg:pt-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-[var(--sf-border)] bg-gradient-to-br from-[var(--sf-primary)]/10 via-[var(--sf-secondary)]/10 to-[var(--sf-surface)] p-7 sm:p-10">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Ready to Get Started?</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sf-text-muted)]">
              Book a home service as a customer or apply as a provider to receive service requests through SewaFi.
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

export default HowItWorks;
