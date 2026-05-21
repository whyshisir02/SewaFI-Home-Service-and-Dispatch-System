import React from 'react';
import { getBookingStatusVariant } from '../../constants/booking-status';

export default function Badge({ variant = 'default', status, children, className = '' }) {
  const base = 'inline-flex items-center gap-2 text-sm font-semibold px-3 py-1 rounded-[var(--radius-pill)]';
  const resolvedVariant = status ? getBookingStatusVariant(status) : variant;

  const style = (() => {
    switch (resolvedVariant) {
      case 'gold':
        return { background: 'rgba(245,158,11,0.08)', color: 'var(--gold)', border: '1px solid rgba(245,158,11,0.12)' };
      case 'green':
        return { background: 'rgba(16,185,129,0.06)', color: 'var(--green)', border: '1px solid rgba(16,185,129,0.12)' };
      case 'teal':
        return { background: 'rgba(20,184,166,0.06)', color: 'var(--teal)', border: '1px solid rgba(20,184,166,0.12)' };
      case 'purple':
        return { background: 'rgba(139,92,246,0.06)', color: 'var(--purple)', border: '1px solid rgba(139,92,246,0.12)' };
      case 'danger':
        return { background: 'rgba(239,68,68,0.06)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.12)' };
      default:
        return { background: 'rgba(59,130,246,0.06)', color: 'var(--blue-light)', border: '1px solid rgba(59,130,246,0.12)' };
    }
  })();

  return (
    <span className={`${base} ${className}`} style={style}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 8,
          background: 'currentColor',
          display: 'inline-block',
          opacity: 0.9
        }}
      />
      <span>{children || status}</span>
    </span>
  );
}
