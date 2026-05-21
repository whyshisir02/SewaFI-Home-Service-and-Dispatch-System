import React from 'react';

export default function Skeleton({ width = '100%', height = 12, style = {}, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, display: 'block', ...style }}
      aria-hidden
    />
  );
}
