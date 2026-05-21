import { CheckCircle2 } from 'lucide-react';
import { EmptyState } from '../ui/Feedback/EmptyState';

const normalizeProblems = (items) =>
  Array.isArray(items)
    ? items.map((item, index) => (typeof item === 'string' ? { id: item, title: item } : { id: item.id || item.title || index, ...item }))
    : [];

export function ServiceCommonProblems({ commonProblems }) {
  const problems = normalizeProblems(commonProblems);

  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-2xl font-extrabold text-[var(--sf-text-main)] sm:text-3xl">Common Problems and Use Cases</h2>
      {problems.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {problems.map((problem) => (
            <div key={problem.id} className="flex gap-3 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--sf-secondary)]" aria-hidden="true" />
              <div>
                <h3 className="font-bold text-[var(--sf-text-main)]">{problem.title || problem.name}</h3>
                {problem.description ? <p className="mt-1 text-sm leading-6 text-[var(--sf-text-muted)]">{problem.description}</p> : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState title="No common use cases listed." description="This service does not have published use cases yet." />
        </div>
      )}
    </section>
  );
}

export default ServiceCommonProblems;
