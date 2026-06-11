export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0a0a0f] text-white flex flex-col">
      {children}
    </div>
  );
}
