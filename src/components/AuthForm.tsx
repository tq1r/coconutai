'use client';

import React from 'react';

interface AuthInputProps {
  label: string;
  type: 'text' | 'email' | 'password';
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
}

export const AuthInput: React.FC<AuthInputProps> = ({ label, type, placeholder, value, onChange, error, required = true }) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-sand-300 mb-2">
        {label}{required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2.5 rounded-lg border bg-[#0d0b0a] text-white placeholder-sand-500 ${
          error ? 'border-rose-500' : 'border-[#2a2620]'
        } focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all`}
        required={required}
      />
      {error && <p className="text-rose-400 text-sm mt-1">{error}</p>}
    </div>
  );
};

interface AuthButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary';
}

export const AuthButton: React.FC<AuthButtonProps> = ({ children, isLoading = false, onClick, type = 'button', variant = 'primary' }) => {
  const baseStyles = 'w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm';
  const variantStyles = {
    primary: 'bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50',
    secondary: 'bg-neutral-700 text-neutral-200 hover:bg-neutral-600',
  };

  return (
    <button type={type} onClick={onClick} disabled={isLoading} className={`${baseStyles} ${variantStyles[variant]} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {isLoading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
};

export const AuthDivider: React.FC<{ text?: string }> = ({ text = 'OR' }) => (
  <div className="flex items-center gap-4 my-6">
    <div className="flex-1 h-px bg-neutral-700" />
    <span className="text-sm text-neutral-500 font-medium">{text}</span>
    <div className="flex-1 h-px bg-neutral-700" />
  </div>
);

export const OAuthButton: React.FC<{ provider: 'google' | 'github' | 'discord'; isLoading?: boolean; onClick?: () => void }> = ({ provider, isLoading = false, onClick }) => {
  const icons = { google: '🔵', github: '🐙', discord: '💜' };
  const labels = { google: 'Google', github: 'GitHub', discord: 'Discord' };

  return (
    <button onClick={onClick} disabled={isLoading} className="w-full py-2.5 px-4 rounded-lg border border-neutral-600 hover:border-neutral-500 hover:bg-neutral-750 transition-all flex items-center justify-center gap-2 font-medium text-neutral-200 text-sm disabled:opacity-50">
      <span className="text-lg">{icons[provider]}</span>
      {labels[provider]}
    </button>
  );
};
