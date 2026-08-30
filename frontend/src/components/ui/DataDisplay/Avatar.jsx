import { cn } from '../../../lib/cn';

export function Avatar({ src, alt, fallback = 'SF', size = 'md' }) {
  const sizes = {
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-xl',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn('rounded-full object-cover', sizes[size])}
      />
    );
  }

  return (
    <div className={cn('flex items-center justify-center rounded-full bg-primary/12 font-semibold text-primary', sizes[size])}>
      {fallback}
    </div>
  );
}

export default Avatar;
