import { X } from 'lucide-react';

export function Chip({ children, onRemove }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground">
      {children}
      {onRemove ? (
        <button type="button" onClick={onRemove} aria-label="Remove chip">
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </span>
  );
}

export default Chip;
