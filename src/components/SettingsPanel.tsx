'use client';

import { useTheme } from './ThemeProvider';

const themes = [
  { id: 'coconut', label: 'Coconut', icon: '~', desc: 'Warm amber dark', bg: '#0a0a0f', accent: '#d97706' },
  { id: 'midnight', label: 'Midnight', icon: '*', desc: 'Cool blue dark', bg: '#070712', accent: '#3b82f6' },
  { id: 'obsidian', label: 'Obsidian', icon: '*', desc: 'Deep purple dark', bg: '#050508', accent: '#a855f7' },
];

interface SettingsPanelProps {
  userName: string;
  userEmail: string;
  userRole: string;
  robloxUsername?: string;
  pluginCode: string;
  onPluginCodeChange: (code: string) => void;
}

export default function SettingsPanel({ userName, userEmail, userRole, robloxUsername, pluginCode, onPluginCodeChange }: SettingsPanelProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex-1 overflow-y-auto animate-fade-in" style={{ padding: '16px 14px' }}>
      <h2 className="label animate-slide-up" style={{ marginBottom: '16px', fontSize: '10px' }}>Settings</h2>

      <section className="animate-slide-up" style={{ marginBottom: '20px', animationDelay: '60ms' }}>
        <h3 className="label" style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '9px' }}>Appearance</h3>
        <div className="stagger-1" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id as any)}
              className="animate-slide-up animate-scale-hover"
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px',
                borderRadius: '6px', border: theme === t.id ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                background: theme === t.id ? 'var(--accent-soft)' : 'transparent',
                cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.2s ease',
              }}
            >
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: t.accent }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.label}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{t.desc}</div>
              </div>
              {theme === t.id && (
                <span style={{ color: 'var(--accent)', fontSize: '11px' }}>o</span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="animate-slide-up" style={{ marginBottom: '20px', animationDelay: '120ms' }}>
        <h3 className="label" style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '9px' }}>Account</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</div>
          <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>{userName}</div>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '6px' }}>Email</div>
          <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>{userEmail}</div>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '6px' }}>Role</div>
          <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, textTransform: 'capitalize' }}>{userRole}</div>
        </div>
      </section>

      {robloxUsername && (
        <section className="animate-slide-up" style={{ marginBottom: '20px', animationDelay: '180ms' }}>
          <h3 className="label" style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '9px' }}>Roblox Account</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>RBX</span>
            <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>{robloxUsername}</span>
          </div>
        </section>
      )}

      <section className="animate-slide-up" style={{ animationDelay: '240ms' }}>
        <h3 className="label" style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '9px' }}>Studio Plugin Sync</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Plugin connection code (6 characters)</div>
          <input
            type="text"
            maxLength={6}
            value={pluginCode}
            onChange={(e) => onPluginCodeChange(e.target.value.toUpperCase())}
            placeholder="Enter code"
            style={{
              background: 'var(--bg-code)', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
              borderRadius: '6px', padding: '6px 8px', fontSize: '14px', fontWeight: 700,
              fontFamily: 'monospace', letterSpacing: '0.12em', textAlign: 'center',
              outline: 'none', textTransform: 'uppercase', width: '110px',
            }}
          />
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Enter the code shown in your Roblox Studio plugin to connect.
          </div>
        </div>
      </section>
    </div>
  );
}
