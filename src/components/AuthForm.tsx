'use client';

import React from 'react';

export const AuthInput: React.FC<{
  label: string; type: 'text' | 'email' | 'password'; placeholder: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string; required?: boolean;
}> = ({ label, type, placeholder, value, onChange, error, required = true }) => (
  <div className="mb-4">
    <label className="block text-sm font-semibold text-stone-600 mb-1.5">{label}{required && <span className="text-coral-400 ml-0.5">*</span>}</label>
    <input
      type={type} placeholder={placeholder} value={value} onChange={onChange}
      className={`w-full px-4 py-2.5 rounded-xl text-sm bg-white/90 text-stone-700 border ${error ? 'border-coral-300' : 'border-sand-200'} focus:outline-none focus:border-ocean-400 focus:ring-2 focus:ring-ocean-100 transition-all placeholder-stone-300 shadow-sm`}
      required={required}
    />
    {error && <p className="text-coral-500 text-xs mt-1.5 font-medium">{error}</p>}
  </div>
);

export const AuthButton: React.FC<{
  children: React.ReactNode; isLoading?: boolean; onClick?: () => void; type?: 'button' | 'submit';
}> = ({ children, isLoading, onClick, type = 'submit' }) => (
  <button
    type={type} onClick={onClick} disabled={isLoading}
    className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-ocean-400 to-teal-400 text-white hover:from-ocean-500 hover:to-teal-500 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
  >
    {isLoading ? 'Loading...' : children}
  </button>
);
