'use client';

import React from 'react';

export const AuthInput: React.FC<{
  label: string; type: 'text' | 'email' | 'password'; placeholder: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string; required?: boolean;
}> = ({ label, type, placeholder, value, onChange, error, required = true }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-stone-600 mb-1.5">{label}{required && <span className="text-coral-400 ml-0.5">*</span>}</label>
    <input
      type={type} placeholder={placeholder} value={value} onChange={onChange}
      className={`w-full px-3.5 py-2.5 rounded-lg text-sm bg-stone-50 text-stone-800 border ${error ? 'border-coral-300' : 'border-sand-200'} focus:outline-none focus:border-ocean-400 focus:ring-1 focus:ring-ocean-200 transition-colors placeholder-stone-300`}
      required={required}
    />
    {error && <p className="text-coral-500 text-xs mt-1">{error}</p>}
  </div>
);

export const AuthButton: React.FC<{
  children: React.ReactNode; isLoading?: boolean; onClick?: () => void; type?: 'button' | 'submit';
}> = ({ children, isLoading, onClick, type = 'submit' }) => (
  <button
    type={type} onClick={onClick} disabled={isLoading}
    className="w-full py-2.5 rounded-lg text-sm font-medium bg-ocean-500 text-white hover:bg-ocean-600 disabled:opacity-50 transition-colors shadow-sm"
  >
    {isLoading ? 'Loading...' : children}
  </button>
);
