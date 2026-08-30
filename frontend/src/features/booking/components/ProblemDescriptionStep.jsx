import { FileImage, MessageSquareText } from 'lucide-react';
import { BookingField, textareaClass } from './BookingField';

export function ProblemDescriptionStep({ values, errors, onChange, onBlur }) {
  return (
    <section className="rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--sf-primary-soft)] text-[var(--sf-primary)]">
          <MessageSquareText className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--sf-secondary)]">Step 2</p>
          <h2 className="font-display text-2xl font-extrabold text-[var(--sf-text-main)]">Describe Problem</h2>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <BookingField label="Problem Description" required error={errors.description}>
          <textarea
            value={values.description}
            onChange={(event) => onChange('description', event.target.value.slice(0, 500))}
            onBlur={() => onBlur('description')}
            placeholder="Describe the issue, problem, or work you need help with..."
            className={textareaClass}
            maxLength={500}
          />
          <p className="mt-2 text-right text-xs text-[var(--sf-text-soft)]">{values.description.length}/500</p>
        </BookingField>

        <div className="rounded-2xl border border-dashed border-[var(--sf-border)] bg-[var(--sf-bg)] p-5">
          <div className="flex gap-3">
            <FileImage className="h-6 w-6 text-[var(--sf-secondary)]" aria-hidden="true" />
            <div>
              <h3 className="font-bold text-[var(--sf-text-main)]">Booking Images</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--sf-text-muted)]">
                You can continue booking without images. If required, providers may request photos after assignment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProblemDescriptionStep;
