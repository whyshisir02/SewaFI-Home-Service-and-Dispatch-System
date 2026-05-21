import { cn } from '../../../lib/cn';

export function Stack({ className, children }) {
  return <div className={cn('flex flex-col gap-4', className)}>{children}</div>;
}

export default Stack;
