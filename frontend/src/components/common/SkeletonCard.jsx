import { Skeleton } from '../ui/Feedback/Skeleton';
import { cn } from '../../lib/cn';

export function SkeletonCard({ className }) {
  return (
    <div className={cn('rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-4 shadow-[var(--sf-shadow)]', className)}>
      <Skeleton className="h-36 w-full rounded-2xl" />
      <Skeleton className="mt-5 h-4 w-24" />
      <Skeleton className="mt-3 h-6 w-3/4" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
      <div className="mt-6 flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
    </div>
  );
}

export default SkeletonCard;
