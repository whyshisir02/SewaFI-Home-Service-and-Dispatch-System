import React from 'react';

export default function Button({ variant = 'primary', size = 'default', children, className = '', disabled = false, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-semibold transition-[var(--transition)] sf-focus';
  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm';

  const style = (() => {
    switch (variant) {
      case 'secondary':
        return { background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border2)' };
      case 'danger':
        return { background: 'rgba(239,68,68,0.08)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.18)' };
      case 'teal':
        return { background: 'var(--teal)', color: 'white' };
      default:
        return { background: 'var(--blue)', color: 'white' };
    }
  })();

  return (
    <button
      type={props.type || 'button'}
      className={`${base} ${sizeClasses} ${className}`}
      style={{ ...(style || {}), opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
