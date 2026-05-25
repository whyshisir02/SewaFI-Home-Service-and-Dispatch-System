import { createElement, forwardRef } from 'react';
import { cn } from '../../../lib/cn';
import { buttonSizes, buttonVariants } from './button.variants';

export const Button = forwardRef(
  ({ as = 'button', className, variant = 'primary', size = 'md', loading = false, children, ...props }, ref) => {
    const hasTo = typeof props.to === 'string' && props.to.trim().length > 0;
    const hasHref = typeof props.href === 'string' && props.href.trim().length > 0;
    const element = as !== 'button' && !hasTo && !hasHref ? 'button' : as;
    const elementProps = { ...props };

    if (element === 'button') {
      elementProps.type = elementProps.type || 'button';
      delete elementProps.to;
      delete elementProps.href;
    }

    return createElement(
      element,
      {
        ref,
        className: cn(
          'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
          buttonVariants[variant],
          buttonSizes[size],
          className
        ),
        ...elementProps,
      },
      <>
        {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
        {children}
      </>
    );
  }
);

Button.displayName = 'Button';

export default Button;
