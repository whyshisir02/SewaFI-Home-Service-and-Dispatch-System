import { cn } from '../../../lib/cn';

export function Grid({ className, children }) {
  return <div className={cn('grid gap-4 md:gap-6', className)}>{children}</div>;
}

export default Grid;
