import React from 'react';

export default function Input({ label, id, error, ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 7 }}>
          {label}
        </label>
      )}
      <input id={id} className="sf-input sf-focus" {...props} />
      {error && <div style={{ marginTop: 6, fontSize: 12, color: 'var(--red)' }}>{error}</div>}
    </div>
  );
}
