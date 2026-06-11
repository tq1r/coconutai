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
    <div className="min-h-screen bg-gradient-to-b from-[#0d0b0a] via-[#1a1815] to-[#0d0b0a] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl">🥥</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-orange-400 bg-clip-text text-transparent">Coconut AI</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          {subtitle && <p className="text-sand-400 text-sm">{subtitle}</p>}
        </div>

        <div className="bg-[#1a1815]/90 backdrop-blur-xl border border-[#2a2620] rounded-2xl p-8 shadow-2xl">
          {children}
        </div>

        {footerText && footerLink && (
          <p className="text-center text-sand-400 text-sm mt-6">
            {footerText}{' '}
            <Link href={footerLink.href} className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              {footerLink.text}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};
