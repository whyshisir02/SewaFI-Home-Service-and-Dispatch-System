import { forwardRef } from 'react';
import { cn } from '../../../lib/cn';

const toDigits = (value) =>
  String(value || '')
    .replace(/\D/g, '')
    .slice(0, 10);

export const PhoneInput = forwardRef(
  ({ label, hint, error, required, value, onChange, className, id, name, ...props }, ref) => {
    const safeValue = toDigits(value);

    const handleChange = (event) => {
      const nextValue = toDigits(event.target.value);
      if (typeof onChange === 'function') {
        onChange({
          ...event,
          target: {
            ...event.target,
            id,
            name,
            value: nextValue,
          },
        });
      }
    };

    return (
      <label className="flex w-full flex-col gap-2 text-sm font-medium text-foreground">
        <span className="flex items-center gap-1">
          {label}
          {required ? <span className="text-danger">*</span> : null}
        </span>
        <div
          className={cn(
            'flex h-11 w-full items-center rounded-2xl border bg-surface text-sm text-foreground',
            error
              ? 'border-[var(--sf-danger)] focus-within:border-[var(--sf-danger)]'
              : 'border-border focus-within:border-primary',
            className
          )}
        >
          <span className="shrink-0 border-r border-border px-3 text-sm font-semibold text-foreground">+977</span>
          <input
            ref={ref}
            id={id}
            name={name}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            value={safeValue}
            onChange={handleChange}
            className="h-full w-full rounded-r-2xl bg-transparent px-3 text-sm text-foreground placeholder:text-muted focus:outline-none"
            placeholder="9801234567"
            {...props}
          />
        </div>
        {hint ? <span className="text-xs text-muted">{hint}</span> : null}
        {error ? <span className="text-xs text-danger">{error}</span> : null}
      </label>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

export default PhoneInput;
