import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Container } from '../ui/Layout/Container';
import { EmptyState } from '../ui/Feedback/EmptyState';
import { Skeleton } from '../ui/Feedback/Skeleton';
import { SectionHeader } from '../common/SectionHeader';
import { useHomeFaqs } from '../../hooks/useHomePageData';
import { cn } from '../../lib/cn';

const fallbackFaqs = [
  {
    id: 'home-faq-1',
    question: 'How does SewaFi work?',
    answer:
      'Choose a service, describe your problem, select your location and preferred time, then submit a booking request. SewaFi searches for eligible providers in your service area.',
  },
  {
    id: 'home-faq-2',
    question: 'Is the price fixed when I book a service?',
    answer:
      'The price shown during booking is a base or estimated price. The final price may change after the provider checks the actual work. You confirm the final amount before completion.',
  },
  {
    id: 'home-faq-3',
    question: 'When can the provider see my exact address?',
    answer:
      'Providers can only see your broad service area before accepting. Your exact address, contact details, and map location are shown only to the provider who accepts your booking.',
  },
  {
    id: 'home-faq-4',
    question: 'What happens if no provider accepts my booking?',
    answer:
      'If no eligible provider accepts before the scheduled service window ends, the booking is automatically cancelled by the system. You can create a new booking for another time.',
  },
  {
    id: 'home-faq-5',
    question: 'How does payment confirmation work?',
    answer:
      'After the service work, the provider submits the final amount and note. You can review it, then confirm payment or raise a dispute if something is incorrect.',
  },
  {
    id: 'home-faq-6',
    question: 'Can I review a provider?',
    answer:
      'Yes. You can submit a rating and review only after your booking is completed and payment is confirmed. Each booking can be reviewed once.',
  },
];

export function HomeFAQ() {
  const faqQuery = useHomeFaqs();
  const backendFaqs = [...(faqQuery.data || [])].sort(
    (a, b) => (a.displayOrder ?? a.sortOrder ?? a.order ?? 0) - (b.displayOrder ?? b.sortOrder ?? b.order ?? 0)
  );
  const faqs = backendFaqs.length ? backendFaqs : fallbackFaqs;
  const [openId, setOpenId] = useState(null);

  return (
    <section className="bg-[var(--sf-bg)] py-12 sm:py-16 lg:py-20">
      <Container>
        <SectionHeader title="Frequently Asked Questions" description="Quick answers about booking, provider matching, pricing confirmation, and reviews." />

        <div className="mt-10">
          {faqQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : null}

          {!faqQuery.isLoading && !faqs.length ? (
            <EmptyState title="No FAQs available yet." description="Please check back later for updates." />
          ) : null}

          {!faqQuery.isLoading && faqs.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {faqs.map((faq) => {
                const id = faq.id || faq.question;
                const isOpen = openId === id;

                return (
                  <div key={id} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)]">
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : id)}
                      className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left font-bold text-[var(--sf-text-main)]"
                      aria-expanded={isOpen}
                    >
                      {faq.question}
                      <ChevronDown className={cn('h-5 w-5 shrink-0 text-[var(--sf-secondary)] transition', isOpen && 'rotate-180')} />
                    </button>
                    <div className={cn('grid transition-all duration-300', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                      <div className="overflow-hidden">
                        <p className="px-5 pb-5 text-sm leading-6 text-[var(--sf-text-muted)]">{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}

export default HomeFAQ;
