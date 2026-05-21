import { createElement } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Card } from '../ui/Layout/Card';

export function StatCard({ label, value, helper, icon }) {
  const iconComponent = icon || ArrowUpRight;

  return (
    <Card className="space-y-4 min-w-0">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <p className="min-w-0 truncate text-sm text-muted">{label}</p>
        <span className="shrink-0 rounded-2xl bg-primary/12 p-2 text-primary">
          {createElement(iconComponent, { className: 'h-4 w-4' })}
        </span>
      </div>
      <div className="min-w-0">
        <p className="font-display text-3xl leading-tight tracking-tight whitespace-nowrap text-foreground">{value}</p>
        {helper ? <p className="mt-2 text-sm text-muted">{helper}</p> : null}
      </div>
    </Card>
  );
}

export default StatCard;
