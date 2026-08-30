import { Star } from 'lucide-react';
import { cn } from '../../../lib/cn';

const stars = [1, 2, 3, 4, 5];

export function StarRatingInput({ value = 0, onChange, disabled = false, name = 'rating', label = 'Overall rating' }) {
  const currentValue = Number(value || 0);

  const onKeyDown = (event) => {
    if (disabled) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      onChange(Math.min(5, currentValue + 1));
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      onChange(Math.max(1, currentValue - 1));
    }
    if (event.key === 'Home') {
      event.preventDefault();
      onChange(1);
    }
    if (event.key === 'End') {
      event.preventDefault();
      onChange(5);
    }
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-[var(--sf-text-main)]">{label}</legend>
      <div
        role="radiogroup"
        aria-label={label}
        tabIndex={0}
        className="flex items-center gap-2"
        onKeyDown={onKeyDown}
      >
        {stars.map((star) => {
          const isFilled = star <= currentValue;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              name={name}
              aria-checked={currentValue === star}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              disabled={disabled}
              className={cn(
                'inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--sf-border)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-secondary)]',
                isFilled ? 'bg-amber-500/15 text-amber-500' : 'text-[var(--sf-text-muted)] hover:text-amber-500'
              )}
              onClick={() => onChange(star)}
            >
              <Star className={cn('h-5 w-5', isFilled ? 'fill-current' : '')} />
            </button>
          );
        })}
        <span className="pl-1 text-sm text-[var(--sf-text-muted)]">{currentValue} / 5</span>
      </div>
    </fieldset>
  );
}

export default StarRatingInput;

