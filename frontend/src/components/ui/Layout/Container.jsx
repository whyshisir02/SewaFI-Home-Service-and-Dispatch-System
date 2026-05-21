import { cn } from '../../../lib/cn';

export function Container({ className, children }) {
  return <div className={cn('mx-auto w-full max-w-[var(--max-width)] px-4 sm:px-6 lg:px-8', className)}>{children}</div>;
}

export default Container;
