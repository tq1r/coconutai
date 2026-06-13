import React from 'react';

export const metadata = { title: 'Dashboard - Coconut AI' };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      {children}
    </div>
  );
}
