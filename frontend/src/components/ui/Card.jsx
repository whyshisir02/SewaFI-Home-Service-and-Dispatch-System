import React from 'react';

export default function Card({ children, className = '', style = {}, ...props }) {
  return (
    <div className={`sf-card ${className}`} style={style} {...props}>
      {children}
    </div>
  );
}
