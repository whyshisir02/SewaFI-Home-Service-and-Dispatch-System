import { cn } from '../../../lib/cn';

export function Card({ className, children }) {
  return <div className={cn('surface-card rounded-[1.75rem] p-5', className)}>{children}</div>;
}

export default Card;
