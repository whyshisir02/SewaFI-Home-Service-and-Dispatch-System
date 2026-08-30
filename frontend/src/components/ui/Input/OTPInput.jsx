import { useEffect, useRef } from 'react';
import { cn } from '../../../lib/cn';

export function OTPInput({ length = 6, value = '', onChange, disabled = false, ariaLabel = 'Enter OTP', className }) {
  const firstDigitRef = useRef(null);
  const digits = Array.from({ length }, (_, index) => value[index] || '');

  // Focus the first digit on mount instead of using autoFocus
  useEffect(() => {
    firstDigitRef.current?.focus();
  }, []);

  const handleChange = (index, nextValue) => {
    const sanitized = nextValue.replace(/\D/g, '');
    if (!sanitized) {
      const values = digits.slice();
      values[index] = '';
      onChange?.(values.join(''));
      return;
    }
    const values = digits.slice();
    const chars = sanitized.slice(0, length - index).split('');
    chars.forEach((char, offset) => {
      values[index + offset] = char;
    });
    onChange?.(values.join(''));
    const nextFocus = Math.min(index + chars.length, length - 1);
    const nextElement = document.querySelector(`input[data-otp-index="${nextFocus}"]`);
    if (nextElement) nextElement.focus();
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      const prevElement = document.querySelector(`input[data-otp-index="${index - 1}"]`);
      if (prevElement) prevElement.focus();
    }
  };

  return (
    <div className={cn('flex flex-wrap justify-center gap-2', className)} role="group" aria-label={ariaLabel}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={index === 0 ? firstDigitRef : undefined}
          value={digit}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          className="h-12 w-11 rounded-2xl border border-border bg-surface text-center text-lg font-semibold text-foreground outline-none focus:border-[var(--sf-secondary)] focus:ring-2 focus:ring-[var(--sf-secondary)]/25 disabled:cursor-not-allowed disabled:opacity-60 sm:w-12"
          inputMode="numeric"
          maxLength={1}
          aria-label={`OTP digit ${index + 1}`}
          data-otp-index={index}
          autoComplete="one-time-code"
          disabled={disabled}
        />
      ))}
    </div>
  );
}

export default OTPInput;
