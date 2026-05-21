import { cn } from '../../../lib/cn';

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-2xl bg-surface-muted', className)} />;
}

export default Skeleton;
