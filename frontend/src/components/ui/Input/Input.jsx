import { forwardRef } from 'react';
import { cn } from '../../../lib/cn';

const FieldShell = ({ label, hint, error, required, children }) => (
  <label className="flex w-full flex-col gap-2 text-sm font-medium text-foreground">
    <span className="flex items-center gap-1">
      {label}
      {required ? <span className="text-danger">*</span> : null}
    </span>
    {children}
    {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    {error ? <span className="text-xs text-danger">{error}</span> : null}
  </label>
);

export const Input = forwardRef(({ label, hint, error, className, required, ...props }, ref) => (
  <FieldShell label={label} hint={hint} error={error} required={required}>
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-foreground placeholder:text-muted focus:border-primary',
        className
      )}
      {...props}
    />
  </FieldShell>
));

Input.displayName = 'Input';

export default Input;
