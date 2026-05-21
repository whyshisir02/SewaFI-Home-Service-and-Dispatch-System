import { createElement, forwardRef } from 'react';
import { cn } from '../../../lib/cn';
import { buttonSizes, buttonVariants } from './button.variants';

export const Button = forwardRef(
  ({ as = 'button', className, variant = 'primary', size = 'md', loading = false, children, ...props }, ref) =>
    createElement(
      as,
      {
        ref,
        className: cn(
          'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
          buttonVariants[variant],
          buttonSizes[size],
          className
        ),
        ...props,
      },
      <>
        {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
        {children}
      </>
    )
);

Button.displayName = 'Button';

export default Button;
