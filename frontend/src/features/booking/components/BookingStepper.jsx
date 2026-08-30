import { CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/cn';

const steps = ['Select Service', 'Describe Problem', 'Add Location', 'Choose Date & Time', 'Review and Confirm'];

export function BookingStepper({ completed = [] }) {
  const activeIndex = Math.min(completed.length, steps.length - 1);

  return (
    <nav aria-label="Booking steps" className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <ol className="flex min-w-max gap-3 rounded-[28px] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-3 shadow-sm">
        {steps.map((step, index) => {
          const isCompleted = completed.includes(index);
          const isActive = index === activeIndex;

          return (
            <li
              key={step}
              className={cn(
                'flex min-h-12 items-center gap-3 rounded-2xl border px-4 text-sm font-bold transition',
                isCompleted
                  ? 'border-[var(--sf-secondary)] bg-[var(--sf-secondary-soft)] text-[var(--sf-secondary)]'
                  : isActive
                    ? 'border-[var(--sf-secondary)] bg-[var(--sf-secondary)] text-white'
                    : 'border-[var(--sf-border)] bg-[var(--sf-bg)] text-[var(--sf-text-muted)]'
              )}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--sf-surface)] text-[var(--sf-secondary)]">
                {isCompleted ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : index + 1}
              </span>
              {step}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default BookingStepper;
