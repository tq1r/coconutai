'use client';

import React from 'react';

let inputIdCounter = 0;

export const AuthInput: React.FC<{
  label: string; type: 'text' | 'email' | 'password'; placeholder: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string; required?: boolean;
}> = ({ label, type, placeholder, value, onChange, error, required = true }) => {
  const [inputId] = React.useState(() => `auth-input-${++inputIdCounter}`);
  return (
  <div className="mb-4">
    <label htmlFor={inputId} className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}{required && <span className="ml-0.5" style={{ color: 'var(--accent)' }}>*</span>}</label>
    <input
      id={inputId} type={type} placeholder={placeholder} value={value} onChange={onChange}
      className="w-full px-4 py-2.5 text-sm border outline-none transition-all"
      style={{
        background: 'var(--bg-input)', color: 'var(--text-primary)',
        borderColor: error ? 'var(--danger)' : 'var(--border-weak)',
        borderRadius: '4px',
      }}
      onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = 'var(--accent)'; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = error ? 'var(--danger)' : 'var(--border-weak)'; }}
      required={required}
    />
    {error && <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--danger)' }}>{error}</p>}
  </div>
  );
};

export const AuthButton: React.FC<{
  children: React.ReactNode; isLoading?: boolean; onClick?: () => void; type?: 'button' | 'submit';
}> = ({ children, isLoading, onClick, type = 'submit' }) => (
  <button
    type={type} onClick={onClick} disabled={isLoading}
    className="w-full py-2.5 text-sm font-semibold disabled:opacity-50 transition-all border-0 cursor-pointer"
    style={{ background: 'var(--accent)', color: '#fff', borderRadius: '4px', opacity: isLoading ? 0.6 : 1 }}
  >
    {isLoading ? 'Loading...' : children}
  </button>
);
