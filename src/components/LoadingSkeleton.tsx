export function PanelSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-shimmer p-4" style={{ borderRadius: '4px' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="mb-3 h-3" style={{
          background: 'var(--border-color)',
          borderRadius: '4px',
          width: `${70 + Math.random() * 30}%`,
          opacity: 1 - i * 0.2,
        }} />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-shimmer border" style={{
      background: 'var(--bg-surface-solid)',
      borderColor: 'var(--border-color)',
      borderRadius: '4px', padding: '18px',
    }}>
      <div className="h-3 mb-3 w-1/3" style={{ background: 'var(--border-color)', borderRadius: '4px' }} />
      <div className="h-3 mb-2 w-2/3" style={{ background: 'var(--border-color)', borderRadius: '4px' }} />
      <div className="h-3 w-1/2" style={{ background: 'var(--border-color)', borderRadius: '4px' }} />
    </div>
  );
}
