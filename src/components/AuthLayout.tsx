'use client';

import React from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  footerText?: string;
  footerLink?: { text: string; href: string };
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, footerText, footerLink }) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-page)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 no-underline mb-4">
            <span className="font-bold text-xl" style={{ color: 'var(--accent)' }}>Coconut AI</span>
          </Link>
          <h1 className="text-2xl font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>{title}</h1>
          {subtitle && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>
        <div className="border p-7" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-weak)', borderRadius: '4px' }}>
          {children}
        </div>
        {footerText && footerLink && (
          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            {footerText}{' '}
            <Link href={footerLink.href} className="no-underline font-semibold" style={{ color: 'var(--accent)' }}>{footerLink.text}</Link>
          </p>
        )}
      </div>
    </div>
  );
};
