'use client';

import { useTheme } from './ThemeProvider';

const themes = [
  { id: 'beach', label: 'Beach', icon: '~', desc: 'Warm sand & sea breeze', bg: '#fdfaf5', accent: '#14b8a6' },
  { id: 'dark', label: 'Dark', icon: '*', desc: 'Easy on the eyes', bg: '#0c0a09', accent: '#2dd4bf' },
  { id: 'ocean', label: 'Ocean', icon: '~', desc: 'Deep blue waters', bg: '#f0f9ff', accent: '#0284c7' },
  { id: 'sunset', label: 'Sunset', icon: '~', desc: 'Golden hour glow', bg: '#fff7ed', accent: '#f97316' },
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
    <div className="flex-1 overflow-y-auto" style={{ padding: '20px 16px' }}>
      <h2 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '20px' }}>Settings</h2>

      {/* Theme */}
      <section style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '10px' }}>Appearance</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                borderRadius: '10px', border: theme === t.id ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                background: theme === t.id ? 'var(--accent-soft)' : 'transparent',
                cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '24px', lineHeight: 1 }}>{t.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.desc}</div>
              </div>
              {theme === t.id && (
                <span style={{ color: 'var(--accent)', fontSize: '16px' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Account */}
      <section style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '10px' }}>Account</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</div>
          <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{userName}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px' }}>Email</div>
          <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{userEmail}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px' }}>Role</div>
          <div style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 600, textTransform: 'capitalize' }}>{userRole}</div>
        </div>
      </section>

      {/* Roblox */}
      {robloxUsername && (
        <section style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '10px' }}>Roblox Account</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>RBX</span>
            <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{robloxUsername}</span>
          </div>
        </section>
      )}

      {/* Studio Plugin */}
      <section>
        <h3 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '10px' }}>Studio Plugin Sync</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Plugin connection code (6 characters)</div>
          <input
            type="text"
            maxLength={6}
            value={pluginCode}
            onChange={(e) => onPluginCodeChange(e.target.value.toUpperCase())}
            placeholder="Enter code"
            style={{
              background: 'var(--bg-code)', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
              borderRadius: '8px', padding: '8px 10px', fontSize: '16px', fontWeight: 700,
              fontFamily: 'monospace', letterSpacing: '0.15em', textAlign: 'center',
              outline: 'none', textTransform: 'uppercase', width: '120px',
            }}
          />
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Enter the code shown in your Roblox Studio plugin to connect.
          </div>
        </div>
      </section>
    </div>
  );
}
