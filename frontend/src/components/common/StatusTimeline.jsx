import { CheckCircle2, Clock3 } from 'lucide-react';
import { cn } from '../../lib/cn';

export function StatusTimeline({ items = [] }) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.label} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', item.completed ? 'bg-secondary text-slate-950' : 'bg-surface-muted text-muted')}>
              {item.completed ? <CheckCircle2 className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
            </div>
            {index < items.length - 1 ? <div className="mt-2 h-full w-px bg-border" /> : null}
          </div>
          <div className="pb-6">
            <p className="font-semibold text-foreground">{item.label}</p>
            <p className="text-sm text-muted">{item.description}</p>
            {item.date ? <p className="mt-1 text-xs text-muted">{item.date}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatusTimeline;
