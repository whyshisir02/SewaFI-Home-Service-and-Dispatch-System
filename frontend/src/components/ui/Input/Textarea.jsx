import { forwardRef } from 'react';
import { cn } from '../../../lib/cn';

export const Textarea = forwardRef(({ label, hint, error, className, ...props }, ref) => (
  <label className="flex w-full flex-col gap-2 text-sm font-medium text-foreground">
    <span>{label}</span>
    <textarea
      ref={ref}
      className={cn(
        'min-h-[120px] w-full rounded-2xl border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none',
        error
          ? 'border-[var(--sf-danger)] focus:border-[var(--sf-danger)]'
          : 'border-border focus:border-primary',
        className
      )}
      {...props}
    />
    {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    {error ? <span className="text-xs text-danger">{error}</span> : null}
  </label>
));

Textarea.displayName = 'Textarea';

export default Textarea;
