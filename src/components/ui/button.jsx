import React from 'react';

export function Button({ className = '', children, disabled, onClick, type = 'button', ...props }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
