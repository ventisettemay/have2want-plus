import React from 'react';

export function Input({ className = '', type = 'text', value, onChange, placeholder, maxLength, ...props }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`w-full rounded-md px-3 py-2 text-sm outline-none transition-all focus:ring-1 focus:ring-amber-500 ${className}`}
      {...props}
    />
  );
}

export default Input;
