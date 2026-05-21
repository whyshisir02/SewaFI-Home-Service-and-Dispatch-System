import { Star } from 'lucide-react';
import { cn } from '../../../lib/cn';

export function StarRatingDisplay({ rating = 0, total = 5, showText = true }) {
  const numericRating = Number(rating || 0);

  return (
    <div className="flex items-center gap-2" aria-label={`${numericRating.toFixed(1)} out of ${total} stars`}>
      <div className="flex items-center gap-1 text-amber-500">
        {Array.from({ length: total }, (_, index) => (
          <Star key={index} className={cn('h-4 w-4', index < Math.round(numericRating) ? 'fill-current' : '')} />
        ))}
      </div>
      {showText ? <span className="text-sm text-[var(--sf-text-muted)]">{numericRating.toFixed(1)} / {total}</span> : null}
    </div>
  );
}

export default StarRatingDisplay;

