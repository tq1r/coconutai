'use client';

type TabId = 'explorer' | 'chat' | 'settings';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'explorer', label: 'Explorer', icon: '[.]' },
  { id: 'chat', label: 'AI Chat', icon: '<AI>' },
  { id: 'settings', label: 'Settings', icon: '[=]' },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-2" style={{
      background: 'var(--bg-page)',
      borderRight: '1px solid var(--border-color)',
      width: '48px',
      flexShrink: 0,
      height: '100%',
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
            justifyContent: 'center', transition: 'all 0.2s ease',
            position: 'relative',
          }}
        >
          <span style={{ transition: 'transform 0.15s', display: 'inline-block' }}>{tab.icon}</span>
          {activeTab === tab.id && (
            <span className="animate-pulse-glow" style={{
              position: 'absolute', left: '-5px', top: '50%', transform: 'translateY(-50%)',
              width: '2px', height: '16px', background: 'var(--accent)', borderRadius: '1px',
            }} />
          )}
        </button>
      ))}
    </div>
  );
}
