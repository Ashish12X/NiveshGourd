// src/components/common/Card.jsx
import React from 'react';

export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'p-6',
  onClick,
  as: Component = 'div',
  ...props
}) {
  const hoverStyles = hover
    ? 'hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-pointer'
    : '';

  return (
    <Component
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs ${padding} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
