'use client';

import React from 'react';

export const AuthInput: React.FC<{
  label: string; type: 'text' | 'email' | 'password'; placeholder: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string; required?: boolean;
}> = ({ label, type, placeholder, value, onChange, error, required = true }) => (
  <div className="mb-4">
    <label className="block text-xs text-sand-300 mb-1.5">{label}{required && <span className="text-rose-400 ml-0.5">*</span>}</label>
    <input
      type={type} placeholder={placeholder} value={value} onChange={onChange}
      className={`w-full px-3 py-2 rounded-md text-xs bg-[#0d0b0a] text-white border ${error ? 'border-rose-500' : 'border-[#2a2620]'} focus:outline-none focus:border-cyan-500 transition-colors placeholder-sand-500`}
      required={required}
    />
    {error && <p className="text-rose-400 text-xs mt-1">{error}</p>}
  </div>
);

export const AuthButton: React.FC<{
  children: React.ReactNode; isLoading?: boolean; onClick?: () => void; type?: 'button' | 'submit';
}> = ({ children, isLoading, onClick, type = 'submit' }) => (
  <button
    type={type} onClick={onClick} disabled={isLoading}
    className="w-full py-2 rounded-md text-xs font-medium bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors"
  >
    {isLoading ? 'Loading...' : children}
  </button>
);
