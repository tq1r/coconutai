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
    <div className="min-h-screen bg-[#0d0b0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 no-underline mb-4">
            <span className="text-2xl">🥥</span>
            <span className="font-bold text-lg bg-gradient-to-r from-cyan-400 to-orange-400 bg-clip-text text-transparent">Coconut AI</span>
          </Link>
          <h1 className="text-xl font-bold text-white mb-1">{title}</h1>
          {subtitle && <p className="text-xs text-sand-400">{subtitle}</p>}
        </div>
        <div className="bg-[#1a1815] border border-[#2a2620] rounded-lg p-6">
          {children}
        </div>
        {footerText && footerLink && (
          <p className="text-center text-xs text-sand-400 mt-5">
            {footerText}{' '}
            <Link href={footerLink.href} className="text-cyan-400 hover:text-cyan-300 no-underline">{footerLink.text}</Link>
          </p>
        )}
      </div>
    </div>
  );
};
