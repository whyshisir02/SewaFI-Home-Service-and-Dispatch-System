import { cn } from '../../../lib/cn';

export function Tabs({ items = [], active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-full bg-surface-muted p-1">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange?.(item.value)}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium transition',
            active === item.value ? 'bg-surface text-foreground shadow-soft' : 'text-muted'
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default Tabs;
