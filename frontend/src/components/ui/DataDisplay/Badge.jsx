import { cn } from '../../../lib/cn';

const tones = {
  neutral: 'bg-surface-muted text-foreground',
  primary: 'bg-primary/12 text-primary',
  secondary: 'bg-secondary/15 text-secondary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
};

export function Badge({ tone = 'neutral', className, children }) {
  return <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold', tones[tone], className)}>{children}</span>;
}

export default Badge;
