import { EmptyState } from '../../../../components/ui/Feedback/EmptyState';
import { Button } from '../../../../components/ui/Button/Button';

const getFaqTitle = (faq) => faq?.question || faq?.title || faq?.heading || 'Question';
const getFaqBody = (faq) => faq?.answer || faq?.content || faq?.description || 'No details available.';

export function CategoryFAQ({ faqs = [], isLoading, isError, onRetry }) {
  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 sm:p-6">
      <h2 className="text-2xl font-extrabold text-[var(--sf-text-main)]">Frequently Asked Questions</h2>

      {isLoading ? (
        <div className="mt-5 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)]" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="mt-5 rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-4">
          <p className="text-sm text-[var(--sf-text-muted)]">Unable to load FAQs right now.</p>
          <Button type="button" variant="outline" className="mt-3 h-10 rounded-xl" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError && !faqs.length ? <div className="mt-5"><EmptyState title="No FAQs available yet." description="This category does not have published FAQs right now." /></div> : null}

      {!isLoading && !isError && faqs.length ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {faqs.map((faq, index) => (
            <details key={faq?.id || faq?._id || index} className="group rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] p-4">
              <summary className="cursor-pointer list-none font-semibold text-[var(--sf-text-main)]">{getFaqTitle(faq)}</summary>
              <p className="mt-3 text-sm leading-6 text-[var(--sf-text-muted)]">{getFaqBody(faq)}</p>
            </details>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default CategoryFAQ;
