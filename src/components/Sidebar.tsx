'use client';

type TabId = 'explorer' | 'chat' | 'settings';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: React.ReactNode;
}

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'explorer', label: 'Explorer', icon: '📁' },
  { id: 'chat', label: 'AI Chat', icon: '🤖' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ activeTab, onTabChange, children }: SidebarProps) {
  return (
    <div className="flex h-full" style={{ background: 'var(--bg-surface-solid)' }}>
      <div className="flex flex-col items-center gap-1 py-3 px-2" style={{
        background: 'var(--bg-page)',
        borderRight: '1px solid var(--border-color)',
        width: '52px',
        flexShrink: 0,
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            title={tab.label}
            style={{
              width: '36px', height: '36px', borderRadius: '10px', border: 'none',
              background: activeTab === tab.id ? 'var(--accent-soft)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', transition: 'all 0.15s',
              position: 'relative',
            }}
          >
            {tab.icon}
            {activeTab === tab.id && (
              <span style={{
                position: 'absolute', left: '-9px', top: '50%', transform: 'translateY(-50%)',
                width: '3px', height: '20px', background: 'var(--accent)', borderRadius: '2px',
              }} />
            )}
          </button>
        ))}
      </div>
      <div className="flex flex-col flex-1 overflow-hidden" style={{ width: '100%', minWidth: '240px', maxWidth: '100%' }}>
        {children}
      </div>
    </div>
  );
}
