export default function Loading() {
  return (
    <div className="h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  );
}
