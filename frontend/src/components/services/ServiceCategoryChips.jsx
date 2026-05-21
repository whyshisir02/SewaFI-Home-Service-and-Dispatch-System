import { LayoutGrid, Wrench } from 'lucide-react';
import { Skeleton } from '../ui/Feedback/Skeleton';
import { cn } from '../../lib/cn';

export function ServiceCategoryChips({ categories = [], activeCategory, isLoading, onSelect }) {
  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-32 shrink-0 rounded-full" />
        ))}
      </div>
    );
  }

  const chips = [{ id: '', name: 'All Services', icon: LayoutGrid }, ...categories.map((category) => ({ ...category, icon: Wrench }))];

  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      {chips.map((category) => {
        const Icon = category.icon || Wrench;
        const isActive = (category.id || '') === (activeCategory || '');

        return (
          <button
            key={category.id || 'all'}
            type="button"
            onClick={() => onSelect(category.id || '')}
            className={cn(
              'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold transition',
              isActive
                ? 'border-[var(--sf-secondary)] bg-[var(--sf-secondary)] text-white'
                : 'border-[var(--sf-border)] bg-[var(--sf-surface)] text-[var(--sf-text-muted)] hover:border-[var(--sf-secondary)] hover:text-[var(--sf-secondary)]'
            )}
            aria-pressed={isActive}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {category.name}
          </button>
        );
      })}
    </div>
  );
}

export default ServiceCategoryChips;
