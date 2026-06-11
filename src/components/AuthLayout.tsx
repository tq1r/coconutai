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
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sand-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 no-underline mb-4">
            <span className="text-3xl">🥥</span>
            <span className="font-bold text-xl text-ocean-600">Coconut AI</span>
          </Link>
          <h1 className="text-2xl font-bold text-stone-800 mb-1.5">{title}</h1>
          {subtitle && <p className="text-sm text-stone-400">{subtitle}</p>}
        </div>
        <div className="bg-white border border-sand-100 rounded-xl p-7 shadow-sm">
          {children}
        </div>
        {footerText && footerLink && (
          <p className="text-center text-sm text-stone-400 mt-6">
            {footerText}{' '}
            <Link href={footerLink.href} className="text-ocean-500 hover:text-ocean-600 no-underline font-medium">{footerLink.text}</Link>
          </p>
        )}
      </div>
    </div>
  );
};
