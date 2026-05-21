import { Star } from 'lucide-react';

export function Rating({ value = 0, total = 5, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-warning">
        {Array.from({ length: total }, (_, index) => (
          <Star key={index} className={`h-4 w-4 ${index < Math.round(value) ? 'fill-current' : ''}`} />
        ))}
      </div>
      <span className="text-sm text-muted">{label || value.toFixed(1)}</span>
    </div>
  );
}

export default Rating;
