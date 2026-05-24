import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  BellRing,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Headphones,
  LayoutDashboard,
  MapPin,
  ShieldCheck,
  Star,
  ToggleRight,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button';
import { ROUTES } from '../../../constants/routes.constant';
import { useProviderCategories, useProviderFaqs } from '../hooks/useProviderPublicData';
import heroServicesImage from '../../../assets/images/hero/hero-services.png';

const benefitCards = [
  {
    title: 'Get Nearby Job Requests',
    description: 'Receive service requests based on your skills and working area.',
    icon: MapPin,
  },
  {
    title: 'Manage Your Availability',
    description: 'Control when you are available to receive jobs.',
    icon: CalendarClock,
  },
  {
    title: 'Build Customer Trust',
    description: 'Grow your reputation through completed services and customer feedback.',
    icon: Star,
  },
  {
    title: 'Use a Provider Dashboard',
    description: 'Track assigned jobs, availability, earnings, and notifications from one place.',
    icon: LayoutDashboard,
  },
  {
    title: 'Work More Professionally',
    description: 'Use a structured booking and dispatch system instead of scattered calls or messages.',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Platform Support',
    description: 'Get booking updates and support through the same provider workflow.',
    icon: Headphones,
  },
];

const dispatchSteps = [
  { title: 'Apply as Provider', text: 'Create your provider account and submit required details.', icon: UserPlus },
  { title: 'Get Verified', text: 'Admin reviews your profile before you can receive jobs.', icon: ShieldCheck },
  { title: 'Set Availability', text: 'Turn your availability on when you are ready to work.', icon: ToggleRight },
  { title: 'Receive Nearby Jobs', text: 'SewaFi notifies eligible providers when customers book nearby.', icon: BellRing },
  { title: 'Accept and Complete Work', text: 'Accept jobs, provide service, and update progress through your dashboard.', icon: CheckCircle2 },
  { title: 'Grow With Completed Jobs', text: 'Build your reputation through completed bookings and customer feedback.', icon: TrendingUp },
];

const requirements = [
  'Valid phone number',
  'Service skill or experience',
  'Working area and location details',
  'Basic profile information',
  'Professional service behavior',
  'Verification details may be requested during provider review',
];

const opportunityCards = [
  'More organized job requests',
  'Better customer communication',
  'Clear booking history',
  'Availability control',
  'Service reputation growth',
];

const verificationStatuses = [
  { label: 'PENDING_APPROVAL', description: 'Profile is under admin review.', tone: 'border-[var(--sf-accent)]/30 bg-[var(--sf-accent)]/10' },
  { label: 'APPROVED', description: 'Provider can receive and accept nearby jobs.', tone: 'border-[var(--sf-secondary)]/30 bg-[var(--sf-secondary)]/10' },
  { label: 'REJECTED', description: 'Provider needs to update details and re-apply.', tone: 'border-red-500/30 bg-red-500/10' },
  { label: 'SUSPENDED', description: 'Provider account is restricted until review is completed.', tone: 'border-red-500/30 bg-red-500/10' },
];

const fallbackFaqs = [
  {
    id: 'faq-1',
    question: 'How do I apply as a provider?',
    answer: 'Use the Apply as Provider button to open provider registration and submit your account details.',
  },
  {
    id: 'faq-2',
    question: 'When can I receive jobs?',
    answer: 'You can start receiving nearby requests after your provider profile is approved and availability is enabled.',
  },
  {
    id: 'faq-3',
    question: 'Can I control my availability?',
    answer: 'Yes. You can switch your availability on or off from your provider dashboard.',
  },
  {
    id: 'faq-4',
    question: 'What happens after I accept a job?',
    answer: 'The booking moves to your assigned work list, and you can update progress as you complete the service.',
  },
];

const getCategoryName = (category) => category?.name || category?.title || category?.label || category?.slug || 'Category';
const getCategoryDescription = (category) => category?.description || category?.summary || 'Available for provider registration.';
const getCategoryId = (category) => category?.id || category?._id || category?.slug;
const getFaqQuestion = (faq) => faq?.question || faq?.title || faq?.heading || 'Provider question';
const getFaqAnswer = (faq) => faq?.answer || faq?.content || faq?.description || 'Please contact support for more details.';

function BecomeProviderPage() {
  const categoriesQuery = useProviderCategories();
  const faqsQuery = useProviderFaqs();

  const categories = categoriesQuery.data || [];
  const backendFaqs = faqsQuery.data || [];
  const faqs = backendFaqs.length ? backendFaqs : fallbackFaqs;

  return (
    <div className="overflow-hidden bg-[var(--sf-bg)] text-[var(--sf-text-main)]">
      <section className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="inline-flex rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sf-secondary)]">
              Become a Provider
            </p>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-[54px]">
              Earn by Providing Trusted Home Services
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--sf-text-muted)] sm:text-lg">
              Serve customers in your chosen areas and receive dispatch-ready service requests based on your skills and schedule.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button as={Link} to={`${ROUTES.register}?role=provider`} className="h-12 rounded-xl bg-[var(--sf-accent)] px-6 text-white hover:brightness-95">
                Apply as Provider
              </Button>
              <Button as="a" href="/#how-it-works" variant="outline" className="h-12 rounded-xl px-6">
                See How It Works
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {['Nearby job requests', 'Flexible availability', 'Provider dashboard', 'Verification-based trust'].map((chip) => (
                <span key={chip} className="rounded-full border border-[var(--sf-border)] bg-[var(--sf-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--sf-text-muted)]">
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-[var(--sf-secondary)]/15 via-[var(--sf-primary)]/10 to-transparent blur-2xl" aria-hidden="true" />
            <div className="relative rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[var(--sf-shadow)]">
              <img src={heroServicesImage} alt="SewaFi provider job dispatch illustration" className="h-auto w-full rounded-2xl object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Why Become a SewaFi Provider?</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {benefitCards.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 transition hover:-translate-y-1 hover:shadow-lg">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--sf-secondary)]/15 text-[var(--sf-secondary)]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">How Provider Dispatch Works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dispatchSteps.map((item, index) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--sf-primary)]/12 text-[var(--sf-primary)]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sf-text-muted)]">Step {index + 1}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--sf-text-muted)]">{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
          <div>
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">What You Need to Join</h2>
            <p className="mt-3 text-base leading-7 text-[var(--sf-text-muted)]">
              Share accurate profile and location details so SewaFi can match you with nearby customers and complete provider verification smoothly.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5">
            <ul className="space-y-3">
              {requirements.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-[var(--sf-text-muted)]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--sf-secondary)]" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Service Skills You Can Offer</h2>
          <p className="mt-2 text-base leading-7 text-[var(--sf-text-muted)]">Choose your service category during provider registration.</p>

          {categoriesQuery.isLoading ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
              ))}
            </div>
          ) : null}

          {categoriesQuery.isError ? (
            <div className="mt-6 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
              <p className="text-sm text-[var(--sf-text-muted)]">Unable to load this section right now.</p>
              <Button type="button" variant="outline" className="mt-3 h-10 rounded-xl" onClick={() => categoriesQuery.refetch()}>
                Retry
              </Button>
            </div>
          ) : null}

          {!categoriesQuery.isLoading && !categoriesQuery.isError ? (
            categories.length ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <article key={getCategoryId(category) || getCategoryName(category)} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
                    <h3 className="text-base font-bold">{getCategoryName(category)}</h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--sf-text-muted)]">{getCategoryDescription(category)}</p>
                    <Button
                      as={Link}
                      to={`${ROUTES.register}?role=provider${getCategoryId(category) ? `&category=${encodeURIComponent(getCategoryId(category))}` : ''}`}
                      variant="ghost"
                      className="mt-3 h-9 rounded-xl px-0 text-[var(--sf-secondary)] hover:bg-transparent hover:underline"
                    >
                      Apply in this category
                    </Button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 text-sm text-[var(--sf-text-muted)]">
                Service categories will appear here once configured.
              </div>
            )
          ) : null}
        </div>
      </section>

      <section className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Work Opportunities Through a Structured Platform</h2>
          <p className="mt-3 max-w-4xl text-base leading-7 text-[var(--sf-text-muted)]">
            SewaFi helps providers receive organized service requests, manage assigned work, and build a reliable service profile over time.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {opportunityCards.map((item) => (
              <div key={item} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 text-sm font-semibold text-[var(--sf-text-main)]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Provider Verification Process</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {verificationStatuses.map((status) => (
              <div key={status.label} className={`rounded-2xl border p-4 ${status.tone}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sf-text-muted)]">{status.label}</p>
                <p className="mt-2 text-sm text-[var(--sf-text-main)]">{status.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Provider FAQ</h2>

          {faqsQuery.isLoading ? (
            <div className="mt-6 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]" />
              ))}
            </div>
          ) : null}

          {faqsQuery.isError ? (
            <div className="mt-6 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
              <p className="text-sm text-[var(--sf-text-muted)]">Unable to load this section right now.</p>
              <Button type="button" variant="outline" className="mt-3 h-10 rounded-xl" onClick={() => faqsQuery.refetch()}>
                Retry
              </Button>
            </div>
          ) : null}

          {!faqsQuery.isLoading && !faqsQuery.isError ? (
            <div className="mt-6 space-y-3">
              {faqs.map((faq, index) => (
                <details key={faq.id || faq._id || index} className="group rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4">
                  <summary className="cursor-pointer list-none font-semibold text-[var(--sf-text-main)]">
                    <span className="inline-flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-[var(--sf-secondary)]" aria-hidden="true" />
                      {getFaqQuestion(faq)}
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-[var(--sf-text-muted)]">{getFaqAnswer(faq)}</p>
                </details>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="pb-12 pt-10 sm:pb-14 sm:pt-12 lg:pb-16 lg:pt-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-[var(--sf-border)] bg-gradient-to-br from-[var(--sf-secondary)]/15 via-[var(--sf-primary)]/10 to-[var(--sf-surface)] p-7 sm:p-10">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Ready to Start as a SewaFi Provider?</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sf-text-muted)]">
              Create your provider account and complete your profile to begin the verification process.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button as={Link} to={`${ROUTES.register}?role=provider`} className="h-12 rounded-xl bg-[var(--sf-secondary)] px-6 text-white hover:bg-[var(--sf-secondary)]/90">
                Apply as Provider
              </Button>
              <Button as="a" href="/#how-it-works" variant="outline" className="h-12 rounded-xl px-6">
                Learn How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default BecomeProviderPage;
