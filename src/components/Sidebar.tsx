'use client';

type TabId = 'explorer' | 'chat' | 'settings';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: React.ReactNode;
}

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'explorer', label: 'Explorer', icon: '[.]' },
  { id: 'chat', label: 'AI Chat', icon: '<AI>' },
  { id: 'settings', label: 'Settings', icon: '[=]' },
];

export default function Sidebar({ activeTab, onTabChange, children }: SidebarProps) {
  return (
    <div className="flex h-full" style={{ background: 'var(--bg-surface-solid)' }}>
      <div className="flex flex-col items-center gap-0.5 py-2" style={{
        background: 'var(--bg-page)',
        borderRight: '1px solid var(--border-color)',
        width: '48px',
        flexShrink: 0,
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            title={tab.label}
            style={{
              width: '36px', height: '32px', borderRadius: '4px', border: 'none',
              background: activeTab === tab.id ? 'var(--accent-soft)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '10px', fontWeight: activeTab === tab.id ? 700 : 500,
              letterSpacing: '0.5px',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', transition: 'all 0.1s',
              position: 'relative',
            }}
          >
            {tab.icon}
            {activeTab === tab.id && (
              <span style={{
                position: 'absolute', left: '-5px', top: '50%', transform: 'translateY(-50%)',
                width: '2px', height: '16px', background: 'var(--accent)', borderRadius: '1px',
              }} />
            )}
          </button>
        ))}
      </div>
      <div className="flex flex-col flex-1 overflow-hidden" style={{ width: '320px', minWidth: '320px', maxWidth: '320px' }}>
        {children}
      </div>
    </div>
  );
}
