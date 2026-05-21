import { forwardRef } from 'react';

export const Select = forwardRef(({ label, options = [], placeholder = 'Select an option', error, ...props }, ref) => (
  <label className="flex w-full flex-col gap-2 text-sm font-medium text-foreground">
    <span>{label}</span>
    <select
      ref={ref}
      className="h-11 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-foreground focus:border-primary"
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error ? <span className="text-xs text-danger">{error}</span> : null}
  </label>
));

Select.displayName = 'Select';

export default Select;
