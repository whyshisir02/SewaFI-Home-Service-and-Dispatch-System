import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { EmptyState } from '../../../components/ui/Feedback/EmptyState';
import { Skeleton } from '../../../components/ui/Feedback/Skeleton';
import { cn } from '../../../lib/cn';

export function ServiceFaq({ faqs = [], isLoading, isError, onRetry }) {
  const [openId, setOpenId] = useState(null);

  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-2xl font-extrabold text-[var(--sf-text-main)] sm:text-3xl">Service FAQs</h2>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : null}

        {isError ? (
          <EmptyState title="Unable to load FAQs" description="We could not load FAQs for this service right now." actionLabel="Retry" onAction={onRetry} />
        ) : null}

        {!isLoading && !isError && !faqs.length ? <EmptyState title="No FAQs available yet." description="This service does not have published FAQs right now." /> : null}

        {!isLoading && !isError && faqs.length ? (
          <div className="space-y-3">
            {faqs.map((faq) => {
              const id = faq.id || faq.question;
              const isOpen = openId === id;

              return (
                <div key={id} className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)]">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : id)}
                    className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left font-bold text-[var(--sf-text-main)]"
                    aria-expanded={isOpen}
                  >
                    {faq.question}
                    <ChevronDown className={cn('h-5 w-5 shrink-0 text-[var(--sf-secondary)] transition', isOpen && 'rotate-180')} aria-hidden="true" />
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
    </section>
  );
}

export default ServiceFaq;
