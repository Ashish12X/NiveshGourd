// src/components/common/Button.jsx
import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  onClick,
  disabled = false,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  ariaLabel,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm focus-visible:ring-slate-900 border border-slate-800',
    secondary: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm focus-visible:ring-slate-400',
    teal: 'bg-teal-700 text-white hover:bg-teal-800 shadow-sm focus-visible:ring-teal-700 border border-teal-700',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400 bg-transparent',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400',
    emergency: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm focus-visible:ring-rose-500 border border-rose-600',
    amber: 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm focus-visible:ring-amber-500 border border-amber-600',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
    </button>
  );
}
