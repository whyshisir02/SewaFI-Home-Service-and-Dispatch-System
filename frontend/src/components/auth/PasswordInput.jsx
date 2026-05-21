import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export function PasswordInput({
  id = 'login-password',
  name = 'password',
  label = 'Password',
  placeholder = 'Enter your password',
  autoComplete = 'current-password',
  value,
  onChange,
  onBlur,
  error,
  disabled,
}) {
  const [visible, setVisible] = useState(false);
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-[var(--sf-text-main)]">
        {label}
      </label>
      <div className="relative mt-2">
        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sf-text-soft)]" aria-hidden="true" />
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          placeholder={placeholder}
          className="h-12 w-full rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface-soft)] px-11 pr-12 text-sm text-[var(--sf-text-main)] outline-none transition placeholder:text-[var(--sf-text-soft)] focus:border-[var(--sf-secondary)] focus:ring-2 focus:ring-[var(--sf-secondary)]/20 disabled:cursor-not-allowed disabled:opacity-70"
        />
        <button
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((next) => !next)}
          className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[var(--sf-text-muted)] transition hover:bg-[var(--sf-surface)] hover:text-[var(--sf-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--sf-secondary)]"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      {error ? (
        <p id={errorId} className="mt-2 text-sm font-medium text-[var(--sf-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default PasswordInput;
