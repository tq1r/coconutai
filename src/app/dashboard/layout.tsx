import React from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0d0b0a] text-white flex flex-col">
      {children}
    </div>
  );
}
