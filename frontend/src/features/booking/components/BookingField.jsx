import { cn } from '../../../lib/cn';

export function BookingField({ label, required, error, hint, children, className }) {
  return (
    <label className={cn('block text-sm font-bold text-[var(--sf-text-main)]', className)}>
      <span>
        {label}
        {required ? <span className="ml-1 text-[var(--sf-danger)]">*</span> : null}
      </span>
      <div className="mt-2">{children}</div>
      {hint ? <p className="mt-2 text-xs font-normal leading-5 text-[var(--sf-text-soft)]">{hint}</p> : null}
      {error ? (
        <p className="mt-2 text-xs font-semibold text-[var(--sf-danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </label>
  );
}

export const fieldClass =
  'min-h-11 w-full rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] px-4 text-sm text-[var(--sf-text-main)] placeholder:text-[var(--sf-text-soft)] focus:border-[var(--sf-secondary)]';

export const textareaClass =
  'min-h-32 w-full rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-bg)] px-4 py-3 text-sm leading-6 text-[var(--sf-text-main)] placeholder:text-[var(--sf-text-soft)] focus:border-[var(--sf-secondary)]';

export default BookingField;
